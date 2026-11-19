import {requireRole} from '/mihna-global.js';
import {hub,hubPhoto} from '/hn-api.js';
import {countItems} from '/js/wix/items.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const member=await requireRole(['admin'],false);
if(!member)throw Error('Administration protégée');
export async function mountAdminOverview(){
 const root=document.querySelector('#adminGate .hub-root');
 if(!root)return;
 const section=document.createElement('section');
 section.className='hn-admin-publication';
 section.id='hnAdminPublication';
 section.innerHTML='<div class="hn-admin-publication-head"><div><span>HORENOVA · SUPERVISION NATIONALE</span><h2>Publication & visibilité.</h2><p>Contrôle réel des emplois, shifts, talents et candidatures. Les informations privées ne sont pas exposées.</p></div><button id="hnPublicationRefresh" type="button">Vérifier en ligne ↻</button></div><div class="hn-admin-publication-stats" id="hnPublicationStats" role="status">Vérification de la publication…</div><div class="hn-admin-publication-rows" id="hnPublicationRows"></div>';
 root.insertAdjacentElement('afterbegin',section);
 const stats=section.querySelector('#hnPublicationStats'),list=section.querySelector('#hnPublicationRows');
 let previews=new Map(),checking=false;
 const stat=(title,note,value)=>'<article class="hn-pub-stat"><span>'+esc(title)+'</span><strong>'+esc(value===null?'Indisponible':value)+'</strong><small>'+esc(note)+'</small></article>';
 const liveStates={VALIDEE:'Validée',REFUSEE:'Refusée',A_EXAMINER:'En attente'};
 async function refresh(){
  if(checking)return;
  checking=true;
  const refreshButton=section.querySelector('#hnPublicationRefresh');
  refreshButton.disabled=true;
  stats.innerHTML='<p>Vérification des collections publiques et des annonces validées…</p>';
  const res=await Promise.allSettled([
   hub('/api/jobs/public'),hub('/api/recruiter-requests'),hub('/api/applications'),
   countItems('CandidatePublicProfiles'),countItems('Jobs',[{field:'active',op:'eq',value:true}])
  ]);
  const get=(i,key)=>res[i].status==='fulfilled'?(key?res[i].value?.[key]:res[i].value):null;
  const publicJobs=get(0,'items'),requests=get(1,'items'),applications=get(2,'items');
  const talents=get(3),cms=get(4);
  const live=Array.isArray(publicJobs)?publicJobs:null;
  const reqs=Array.isArray(requests)?requests:null;
  const files=Array.isArray(applications)?applications:null;
  const openJobs=live?.filter(x=>x.kind!=='shift')||[],shifts=live?.filter(x=>x.kind==='shift')||[];
  const pending=reqs?.filter(x=>x.status==='A_EXAMINER')||[];
  const failed=live&&reqs?reqs.filter(x=>x.status==='VALIDEE'&&!live.some(y=>y.id===x.id)):[];
  stats.innerHTML=stat('Emplois confirmés','Offres visibles pour tous',live?openJobs.length:null)+
   stat('Shifts confirmés','Missions visibles pour tous',live?shifts.length:null)+
   stat('Talents publics','Profils anonymisés',talents)+
   stat('Demandes à examiner','Avant publication',reqs?pending.length:null)+
   stat('Candidatures','Dossiers confidentiels',files?files.length:null)+
   stat('Autres offres CMS','Catalogue Wix actif',cms);
  const compare=live===null?'Impossible de vérifier le catalogue public : son état reste inconnu.':
   failed.length?'⚠ '+failed.length+' annonce(s) validée(s) introuvable(s) publiquement.':
   '✓ La vérification compare les demandes validées avec les offres réellement accessibles.';
  list.innerHTML='<div class="hn-pub-list-head"><h3>Offres, shifts et photos</h3><p>'+esc(compare)+'</p></div>'+
   (reqs?.length?reqs.map(r=>{
    const visible=live?.some(x=>x.id===r.id)??false;
    const status=r.status==='VALIDEE'?visible?'EN LIGNE ✓':'VALIDÉE · NON VISIBLE !':liveStates[r.status]||'À examiner';
    const cls=visible?'live':r.status==='VALIDEE'?'issue':'pending';
    const photo=r.has_workplace_photo?'✓ Photo fournie':'⚠ Photo manquante';
    return '<article class="hn-pub-row '+cls+'" data-id="'+esc(r.id)+'"><div class="hn-pub-row-copy">'+
     '<strong>'+esc(r.job_title||'Demande')+'</strong>'+
     '<span>'+esc(r.kind==='shift'?'SHIFT':'EMPLOI')+' · '+esc(r.job_role||'')+' · '+esc(r.city||'Maroc')+'</span>'+
     '<small>'+esc(r.business_name||'Établissement')+' · '+esc(photo)+'</small>'+
     '<p>'+esc(r.workplace_address||'Adresse du lieu non précisée')+' · '+esc(r.contract_type||'Contrat à préciser')+'</p></div>'+
     '<div class="hn-pub-row-actions"><b>'+esc(status)+'</b>'+
     '<button type="button" data-photo="'+esc(r.id)+'">Voir la photo ↗</button>'+
     (visible?'<a href="/job.html?id='+encodeURIComponent(r.id)+'" target="_blank" rel="noopener">Voir l’annonce ↗</a>':'')+
     '</div><div class="hn-pub-preview" data-photo-box="'+esc(r.id)+'"></div></article>';
   }).join(''):'<p>Aucune demande à vérifier.</p>');
  list.querySelectorAll('[data-photo]').forEach(button=>button.onclick=async()=>{
   const id=button.dataset.photo,pane=button.closest('[data-id]').querySelector('[data-photo-box]');
   button.disabled=true;pane.textContent='Chargement sécurisé de la photo…';
   try{
    const url=await hubPhoto('/api/recruiter-requests/'+encodeURIComponent(id)+'/workplace-photo');
    if(!url){pane.textContent='Le recruteur n’a pas encore enregistré de photo.';return;}
    const prev=previews.get(id);if(prev)URL.revokeObjectURL(prev);
    previews.set(id,url);
    pane.innerHTML='<img alt="Photo du lieu de travail communiquée par le recruteur" loading="lazy">';
    pane.querySelector('img').src=url;
   }catch(error){pane.textContent='Photo indisponible : '+(error?.message||'erreur');}
   finally{button.disabled=false;}
  });
  checking=false;refreshButton.disabled=false;
 }
 section.querySelector('#hnPublicationRefresh').onclick=()=>refresh();
 document.addEventListener('hn-admin-moderation-changed',()=>{void refresh()});
 await refresh();
}
