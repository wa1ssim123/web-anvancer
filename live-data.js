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
    business:'Employeur partenaire · HORENOVA',
    role,city:safeText(j.city||'Maroc'),pay:safeText(j.salaryText||'À convenir'),
    period:kind==='shift'?'/ shift':'/ mois',
    time:schedule,dateOffset:kind==='shift'?offsetForShift(j.scheduleText):0,
    img:imageForRole(j.jobRole||j.role),details:safeText(j.description||''),
    sponsored:false,live:true,approved:true
  };
};
async function centralVacancies(){
  const response=await fetch(apiBase+"/api/jobs/public",{method:"GET",mode:"cors",cache:"no-store"});
  if(!response.ok)throw Error("Offres centrales indisponibles ("+response.status+")");
  const data=await response.json();
  return Array.isArray(data.items)?data.items:[];
}
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
  try{
    const profiles=(await queryItems('CandidatePublicProfiles',{sort:[{field:'rating',direction:'desc'}],limit:100})).items||[];
    window.HORENOVA_LIVE_TALENTS=profiles.map(p=>({
      id:safeText(p._id),name:'Talent HORENOVA',
      role:safeText(p.jobFamily||'Hospitalité'),city:safeText(p.city||''),
      rating:0,reviews:0,sponsored:false,
      bio:'Profil anonymisé. Mise en relation uniquement par HORENOVA.',
      live:true
    }));
    if(typeof window.renderTalents==='function')window.renderTalents();
    if(typeof window.renderTalentDetail==='function')window.renderTalentDetail();
  }catch(e){console.warn('Horenova public talents unavailable',e);}
});