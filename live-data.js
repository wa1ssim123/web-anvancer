import { queryItems } from "/js/wix/items.js";
// Treat all CMS user-created fields as untrusted text before inserting into HTML templates.
const safeText=value=>String(value??"").replace(/[&<>"\x27]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","\x27":"&#39;"}[char]));
window.addEventListener('load',async()=>{
  try{
    const live=(await queryItems('Jobs',{filters:[{field:'active',op:'eq',value:true}],sort:[{field:'_createdDate',direction:'desc'}],limit:100})).items;
    window.HORENOVA_LIVE_JOBS=live.map(j=>({id:safeText(j._id),kind:j.kind||'job',title:safeText(j.title||'Offre Horenova'),business:'Employeur partenaire · Horenova',role:safeText(j.role||'Serveur'),city:safeText(j.city||'Casablanca'),pay:safeText(j.salaryText||'À convenir'),period:(j.kind==='shift'?'/ shift':'/ mois'),time:safeText(j.scheduleText||''),dateOffset:0,img:j.role==='Barista'?'https://headless-tfcfvgrbhgw-xwassim04-1409.wix-site-host.com/assets/barista.jpg':j.role==='Chef de cuisine'?'https://headless-tfcfvgrbhgw-xwassim04-1409.wix-site-host.com/assets/chef-action.jpg':'https://headless-tfcfvgrbhgw-xwassim04-1409.wix-site-host.com/assets/restaurant.jpg',details:safeText(j.description||''),sponsored:false,_owner:j._owner,live:true}));
    if(typeof window.renderJobsPage==='function')window.renderJobsPage();
    if(typeof window.renderShifts==='function')window.renderShifts();
    if(typeof window.renderMatch==='function')window.renderMatch();
  }catch(e){console.warn('Horenova live jobs unavailable',e)}
  try{
    const profiles=(await queryItems('CandidatePublicProfiles',{sort:[{field:'rating',direction:'desc'}],limit:100})).items;
    window.HORENOVA_LIVE_TALENTS=profiles.map(p=>({id:safeText(p._id),name:'Talent Horenova',role:safeText(p.jobFamily||'Hospitalité'),city:safeText(p.city||''),rating:0,reviews:0,sponsored:false,bio:'Profil anonymisé. Mise en relation gérée par Horenova.',live:true}));
    if(typeof window.renderTalents==='function')window.renderTalents();
    if(typeof window.renderTalentDetail==='function')window.renderTalentDetail();
  }catch(e){console.warn('Horenova live talents unavailable',e)}
});