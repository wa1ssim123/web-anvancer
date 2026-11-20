import { queryItems } from "/js/wix/items.js";
// Public listings come only from Wix's published Jobs or HORENOVA-approved central requests.
// Recruitment contact information, private videos, and candidate details must never be exposed here.
const safeText=value=>String(value??"").replace(/[&<>"']/g,char=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[char]));
const SITE_MEDIA="https://headless-tfcfvgrbhgw-xwassim04-1409.wix-site-host.com/assets/";
const apiBase="https://horenova-hub-api.onrender.com";
const imageForRole=role=>role==="Barista"?SITE_MEDIA+"barista.jpg":
  role==="Chef de cuisine"?SITE_MEDIA+"chef-action.jpg":SITE_MEDIA+"restaurant.jpg";
function offsetForShift(schedule){
  const match=String(schedule||"").match(/\b\d{4}-\d{2}-\d{2}\b/);
  if(!match)return 0; // Legacy shifts without an explicit date still use the old calendar.
  const date=new Date(match[0]+"T12:00:00");
  const now=new Date();now.setHours(12,0,0,0);
  return Math.round((date-now)/86400000);
}
const normalizeJob=j=>{
  const role=safeText(j.jobRole||j.role||'Serveur');
  const kind=j.kind==='shift'?'shift':'job';
  const schedule=safeText(j.scheduleText||'');
  return {
    id:safeText(j.id||j._id),kind,title:safeText(j.title||'Offre HORENOVA'),
    business:safeText(j.businessName||j.business||'Employeur vérifié · HORENOVA'),
    businessType:safeText(j.businessType||''),workplaceAddress:safeText(j.workplaceAddress||''),
    contractType:safeText(j.contractType||''),requirements:safeText(j.requirements||''),
    openings:Number(j.openings)||1,startDate:safeText(j.startDate||''),
    role,city:safeText(j.city||'Maroc'),pay:safeText(j.salaryText||'À convenir'),
    period:kind==='shift'?'/ shift':'/ mois',
    time:schedule,dateOffset:kind==='shift'?offsetForShift(j.scheduleText):0,
    img:/^\/api\/jobs\/public\/[0-9a-f-]+\/workplace-photo$/i.test(j.photoUrl||'')
      ?apiBase+j.photoUrl:imageForRole(j.jobRole||j.role),
    hasWorkplacePhoto:!!j.hasWorkplacePhoto,
    details:safeText(j.description||''),sponsored:false,live:true,approved:true
  };
};
async function centralVacancies(){
  const response=await fetch(apiBase+"/api/jobs/public",{method:"GET",mode:"cors",cache:"no-store"});
  if(!response.ok)throw Error("Offres centrales indisponibles ("+response.status+")");
  const data=await response.json();
  return Array.isArray(data.items)?data.items:[];
}
// National public talents: query CMS with server-side role/city filters and pagination.
// No private candidate fields are ever read by anonymous visitors.
const TALENT_PAGE_SIZE=60;
const talentPaging={skip:0,hasNext:true,loading:false,generation:0};
window.HORENOVA_TALENTS_HAS_NEXT=false;
window.HORENOVA_TALENTS_LOADING=false;
window.HORENOVA_LIVE_TALENTS=[];
const talentQueryFilters=()=>{
  const role=document.getElementById('talentRoleFilter')?.value.trim()||'';
  const city=document.getElementById('talentCityFilter')?.value.trim()||'';
  return [
    ...(role&&role!=='all'?[{field:'jobFamily',op:'eq',value:role}]:[]),
    ...(city&&city!=='all'?[{field:'city',op:'eq',value:city}]:[])
  ];
};
function showPublicTalents(){
  if(typeof window.renderTalents==='function')window.renderTalents();
  if(typeof window.renderTalentDetail==='function')window.renderTalentDetail();
}
async function loadPublicTalents(reset=false){
  if(reset){
    talentPaging.generation++;
    talentPaging.skip=0;
    talentPaging.hasNext=true;
    window.HORENOVA_LIVE_TALENTS=[];
  }else if(talentPaging.loading||!talentPaging.hasNext)return;
  const currentGeneration=talentPaging.generation;
  talentPaging.loading=true;
  window.HORENOVA_TALENTS_LOADING=true;
  window.HORENOVA_TALENTS_ERROR=false;
  showPublicTalents();
  try{
    const page=await queryItems('CandidatePublicProfiles',{
      filters:talentQueryFilters(),sort:[{field:'_createdDate',direction:'desc'}],
      skip:talentPaging.skip,limit:TALENT_PAGE_SIZE
    });
    if(currentGeneration!==talentPaging.generation)return;
    talentPaging.skip+=page.items.length;
    talentPaging.hasNext=!!page.hasNext&&page.items.length>0;
    window.HORENOVA_TALENTS_HAS_NEXT=talentPaging.hasNext;
    const previous=new Set(window.HORENOVA_LIVE_TALENTS.map(x=>x.id));
    const next=(page.items||[]).filter(p=>!previous.has(safeText(p._id))).map(p=>({
      id:safeText(p._id),
      name:safeText(p.displayName&&!['Talent HORENOVA','Talent Horenova','Profil confidentiel'].includes(String(p.displayName))?String(p.displayName):'Profil confidentiel'),
      role:safeText(p.jobFamily||'Hospitalité'),
      city:safeText(p.city||''),
      languages:safeText(p.languageSummary||''),
      rating:0,reviews:0,sponsored:false,
      bio:safeText(p.displayName&&!['Talent HORENOVA','Talent Horenova','Profil confidentiel'].includes(String(p.displayName))&&p.bio?String(p.bio):'Identité protégée · prise de contact exclusivement par HORENOVA.'),
      live:true
    }));
    window.HORENOVA_LIVE_TALENTS=[...window.HORENOVA_LIVE_TALENTS,...next];
  }catch(error){
    if(currentGeneration===talentPaging.generation){
      window.HORENOVA_TALENTS_ERROR=true;
      console.warn('Horenova public talents unavailable',error);
    }
  }finally{
    if(currentGeneration===talentPaging.generation){
      talentPaging.loading=false;
      window.HORENOVA_TALENTS_LOADING=false;
      showPublicTalents();
    }
  }
}
window.HORENOVA_SEARCH_TALENTS=()=>loadPublicTalents(true);
window.HORENOVA_LOAD_MORE_TALENTS=()=>loadPublicTalents(false);
window.addEventListener('load',async()=>{
  const jobsResults=await Promise.allSettled([
    queryItems('Jobs',{filters:[{field:'active',op:'eq',value:true}],sort:[{field:'_createdDate',direction:'desc'}],limit:100}),
    centralVacancies()
  ]);
  const wix=jobsResults[0].status==='fulfilled'?jobsResults[0].value.items||[]:[];
  const central=jobsResults[1].status==='fulfilled'?jobsResults[1].value:[];
  if(jobsResults[0].status==='rejected')console.warn('Horenova Wix jobs unavailable',jobsResults[0].reason);
  if(jobsResults[1].status==='rejected')console.warn('Horenova approved recruiter requests unavailable',jobsResults[1].reason);
  const records=[
    ...wix.map(j=>({id:j._id,...j})),
    ...central
  ];
  const unique=new Map();
  for(const item of records){
    const j=normalizeJob(item);
    if(!j.id)continue;
    if(j.kind==='shift' && j.dateOffset<0)continue; // Do not advertise past shifts.
    unique.set(j.id,j);
  }
  window.HORENOVA_LIVE_JOBS=[...unique.values()];
  for(const fn of ['renderJobsPage','renderShifts','renderMatch','renderJobDetail','renderFavorites']){
    if(typeof window[fn]==='function')window[fn]();
  }
  await loadPublicTalents(true);
});