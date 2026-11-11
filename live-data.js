import { queryItems } from "/js/wix/items.js";
window.addEventListener('load',async()=>{
  try{
    const live=(await queryItems('Jobs',{filters:[{field:'active',op:'eq',value:true}],sort:[{field:'_createdDate',direction:'desc'}],limit:100})).items;
    window.HORENOVA_LIVE_JOBS=live.map(j=>({id:j._id,kind:j.kind||'job',title:j.title||'Offre Horenova',business:j.businessName||'Établissement Horenova',role:j.role||'Serveur',city:j.city||'Casablanca',pay:j.salaryText||'À convenir',period:(j.kind==='shift'?'/ shift':'/ mois'),time:j.scheduleText||'',dateOffset:0,img:j.role==='Barista'?'https://headless-tfcfvgrbhgw-xwassim04-1409.wix-site-host.com/assets/barista.jpg':j.role==='Chef de cuisine'?'https://headless-tfcfvgrbhgw-xwassim04-1409.wix-site-host.com/assets/chef-action.jpg':'https://headless-tfcfvgrbhgw-xwassim04-1409.wix-site-host.com/assets/restaurant.jpg',details:j.description||'',sponsored:!!j.sponsored,_owner:j._owner,live:true}));
    if(typeof window.renderJobsPage==='function')window.renderJobsPage();
    if(typeof window.renderShifts==='function')window.renderShifts();
    if(typeof window.renderMatch==='function')window.renderMatch();
  }catch(e){console.warn('Horenova live jobs unavailable',e)}
  try{
    const profiles=(await queryItems('CandidatePublicProfiles',{sort:[{field:'rating',direction:'desc'}],limit:100})).items;
    window.HORENOVA_LIVE_TALENTS=profiles.map(p=>({id:p._id,name:p.displayName||'Talent Horenova',role:p.jobFamily||'Hospitalité',city:p.city||'',rating:Number(p.rating||0),reviews:Number(p.reviewCount||0),sponsored:!!p.sponsored,bio:[p.bio,p.languageSummary].filter(Boolean).join(' · '),live:true}));
    if(typeof window.renderTalents==='function')window.renderTalents();
    if(typeof window.renderTalentDetail==='function')window.renderTalentDetail();
  }catch(e){console.warn('Horenova live talents unavailable',e)}
});