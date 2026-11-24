import {requireRole,currentLang} from '/mihna-global.js?v=candidate-board-r4';
import {mountCandidateOffers} from '/candidate-offers.js?v=6';
const host=document.querySelector('[data-co-dashboard]'),entry=document.querySelector('[data-co-entry]');
const auth=await requireRole(['candidate','recruiter','admin'],false);
if(host){
 if(!auth||auth.demo){host.hidden=true;}
 else if(location.pathname==='/admin.html'&&auth.role!=='admin'||location.pathname==='/recruit.html'&&auth.role!=='recruiter'){host.hidden=true;}
 else{try{await mountCandidateOffers(host,auth)}catch(e){host.querySelector('[data-co="error"]').textContent=e.message;}}
}
if(entry){
 const lang=currentLang();const role=auth?.role;
 const labels=role==='recruiter'?{fr:'Candidats disponibles ↗',en:'Available candidates ↗',ar:'المرشحون المتاحون ↗'}:role==='admin'?{fr:'Modérer les annonces candidats ↗',en:'Moderate candidate listings ↗',ar:'إدارة إعلانات المرشحين ↗'}:{fr:'＋ Déposer mon offre',en:'＋ Post my availability',ar:'＋ انشر إعلانك'};
 entry.textContent=labels[lang]||labels.fr;
 const title=entry.parentElement.querySelector('strong');if(title)title.textContent=role==='recruiter'?({fr:'Choisissez les talents disponibles',en:'Choose available talent',ar:'اختر المواهب المتاحة'})[lang]||'Candidats disponibles':role==='admin'?({fr:'Annonces des candidats',en:'Candidate listings',ar:'إعلانات المرشحين'})[lang]||'Annonces des candidats':({fr:'Publiez votre recherche de travail',en:'Post your job search',ar:'انشر بحثك عن عمل'})[lang]||'Publiez votre recherche de travail';
}
