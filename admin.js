import {requireRole} from '/mihna-global.js';
import {hub,hubPhoto} from '/hn-api.js';
import {printCandidate,printRecruiter,printSupportThread} from '/admin-print.js?v=spv7-20261120';
const auth=await requireRole(['admin'],false);
const root=document.getElementById('adminGate');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(!auth){root.innerHTML='<div class="hub-error">Accès réservé à l’administration HORENOVA. <a href="/enter.html?mode=signin">Se connecter</a></div>';}
else{
root.innerHTML='<div class="hub-root"><div class="hub-head"><div><span class="hub-small">HORENOVA · CENTRE PRIVÉ · VERSION 20/11 / SUPPORT & IMPRESSION</span><h2>Candidatures & recrutement</h2><p class="hub-muted">Dossiers détaillés, photos privées, contrôle des mises en relation et conversations. <strong>Impression A4 accessible directement sur chaque dossier.</strong></p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="hub-action secondary" href="#hnAdminAnalytics">▥ Statistiques du site ↗</a><a class="hub-action secondary" href="#hnWhatsappChannelAdmin">◉ Canal WhatsApp ↗</a><a class="hub-action secondary" href="#hnTelegramChannelAdmin">➤ Canal Telegram ↗</a><a class="hub-action secondary" href="#hnAdminSocialPublications">◎ Diffusion des offres ↗</a><a class="hub-action secondary" href="/conversations.html">✉ Messagerie privée ↗</a><a class="hub-action" href="/conversations.html?mode=matching">✦ Rechercher & Matching ↗</a></div></div><div class="hub-error" id="hubError"></div><div class="hub-head"><input id="hubSearch" class="hub-input" placeholder="Rechercher un candidat ou une offre…" aria-label="Rechercher"><button class="hub-action secondary" id="hubRefresh">Actualiser</button></div><div class="hub-layout"><section class="hub-panel" id="adminApplications"><div class="hub-panel-head"><h3 id="hubCount">Candidatures</h3><p class="hub-muted">Nouveaux dossiers transmis à HORENOVA</p></div><div id="hubCases" class="hub-stack"></div></section><section class="hub-panel" id="hubDetail"><div class="hub-detail hub-muted">Choisissez un dossier à examiner.</div></section></div><section class="hub-panel" id="adminRecruiterRequests" style="margin-top:22px"><div class="hub-panel-head"><h3>Demandes de recrutement <span id="hubRequestsCount"></span></h3><p class="hub-muted">Demandes privées reçues des établissements, disponibles pour vérification et association aux candidatures.</p></div><div id="hubRecruiterRequests" class="hub-stack"></div></section><p class="hub-muted" style="margin-top:22px">Dossiers historiques : <a target="_blank" rel="noopener" href="https://manage.wix.com/dashboard/7d0d5cbc-d6b5-483c-adcf-eda65565ae2e/wix-cms">ouvrir le CMS Wix administrateur</a>.</p></div>';

void import('/social-publications-admin.js?v=simple-copy-20261123-v11').then(({mountSocialPublications})=>mountSocialPublications(root))
 .catch(error=>console.warn('HORENOVA social publications unavailable',error?.message||'unknown'));
void import('/telegram-admin.js?v=brand-logos-20261123').then(({mountTelegramAdmin})=>mountTelegramAdmin(root))
 .catch(error=>console.warn('HORENOVA Telegram admin unavailable',error?.message||'unknown'));
void import('/channel-admin.js?v=brand-logos-20261123').then(({mountAdminChannel})=>mountAdminChannel(root))
 .catch(error=>console.warn('HORENOVA WhatsApp Channel admin unavailable',error?.message||'unknown'));
void import('/admin-analytics.js?v=analytics-20261122').then(({mountAdminAnalytics})=>mountAdminAnalytics(root))
 .catch(error=>console.warn('HORENOVA private analytics could not load',error?.message||'unknown'));

root.insertAdjacentHTML('afterbegin',
 '<section class="hn-support-admin-inbox" id="adminSupportInbox"><div class="hn-support-admin-header"><div><span>HORENOVA · SUPPORT NATIONAL</span><h2>Messages & problèmes des membres</h2><p>Les demandes de candidats et recruteurs sont privées. Cliquez pour répondre.</p></div><div><a class="hn-support-admin-cta" href="/support.html">Ouvrir le support ↗</a><a class="hn-support-admin-tel" href="tel:+212648377009">☎ 0648377009</a></div></div>'+
 '<div class="hn-support-admin-metrics" id="hnSupportAdminMetrics" role="status">Chargement des messages de support…</div>'+
 '<div class="hn-support-admin-latest" id="hnSupportAdminLatest"></div></section>');
async function refreshSupportInbox(){
 const count=document.getElementById('hnSupportAdminMetrics');
 const list=document.getElementById('hnSupportAdminLatest');
 if(!count||!list)return;
 try{
  const result=await hub('/api/support/threads');
  const items=result.items||[];
  const unread=items.reduce((n,t)=>n+Number(t.unread||0),0);
  const open=items.filter(x=>x.status==='OPEN'||x.status==='IN_PROGRESS').length;
  count.innerHTML='<span><strong>'+unread+'</strong> Messages non lus</span><span><strong>'+open+'</strong> Demandes ouvertes</span><span><strong>'+items.length+'</strong> Conversations récentes</span>';
  list.replaceChildren();
  if(!items.length){list.textContent='Aucune demande pour le moment.';return;}
  for(const item of items.slice(0,7)){
   const link=document.createElement('a');link.href='/support.html?thread='+encodeURIComponent(item.id);
   const title=document.createElement('strong');title.textContent=item.subject||'Demande de support';
   const meta=document.createElement('small');meta.textContent=[item.memberEmail,item.category,item.status].filter(Boolean).join(' · ');
   const badge=document.createElement('b');badge.textContent=Number(item.unread)>0?item.unread+' nouveau(x)':'Répondre ↗';
   link.append(title,meta,badge);
   const row=document.createElement('div');row.className='hn-support-admin-row';
   const print=document.createElement('button');print.className='hn-admin-print-btn hn-support-print';print.type='button';
   print.textContent='⎙ Imprimer';
   print.addEventListener('click',()=>void printSupportThread(item,()=>hub('/api/support/threads/'+encodeURIComponent(item.id)+'/messages')));
   row.append(link,print);list.append(row);
  }
 }catch(error){count.textContent='Suivi du support momentanément indisponible. Appelez le 0648377009.';}
}
void refreshSupportInbox();
setInterval(()=>{if(!document.hidden)void refreshSupportInbox();},14000);
const $=id=>document.getElementById(id);
const names={EN_ETUDE:'En étude',PRESELECTION:'Présélection',ENTRETIEN:'Entretien',MISE_EN_RELATION:'Mise en relation',RETENUE:'Retenue',REFUSEE:'Refusée',CLOTURE:'Clôturée'};
const statuses=['EN_ETUDE','PRESELECTION','ENTRETIEN','MISE_EN_RELATION','RETENUE','REFUSEE','CLOTURE'];
let applications=[],requests=[],selected='',objectUrl=null;
const field=(n,v,w=false)=>'<div class="hub-field hn-case-field '+(w?'wide':'')+'"><small>'+esc(n)+'</small><strong>'+esc(v===null||v===undefined||v===''?'Non renseigné':v)+'</strong></div>';
const caseGroup=(title,subtitle,fields,tag)=>'<section class="hn-case-section"><div class="hn-case-section-head"><span class="hn-case-section-icon" aria-hidden="true">'+tag+'</span><div><h4>'+title+'</h4><p>'+subtitle+'</p></div></div><div class="hub-grid hn-case-fields">'+fields+'</div></section>';
const showError=msg=>{$('hubError').textContent=msg||'';};
const requestStatuses={A_EXAMINER:'À examiner',VALIDEE:'Validée · visible publiquement',REFUSEE:'Refusée'};
function listRequests(){
  const count=$('hubRequestsCount'),target=$('hubRecruiterRequests');
  if(!count||!target)return;
  count.textContent='('+requests.length+')';
  target.innerHTML=requests.length?requests.map(r=>{
    const current=requestStatuses[r.status]?r.status:'A_EXAMINER';
    const options=Object.entries(requestStatuses).map(([key,label])=>'<option value="'+key+'"'+(key===current?' selected':'')+'>'+esc(label)+'</option>').join('');
    return '<article class="hub-case" data-request-id="'+esc(r.id)+'">'+
      '<small class="hub-muted">'+esc(r.kind==='shift'?'Shift':'Emploi')+' · '+esc(r.city||'')+'</small>'+
      '<strong>'+esc(r.job_title||'Demande sans titre')+'</strong>'+
      '<span>'+esc(r.business_name||'Établissement')+' · '+esc(r.job_role||'')+'</span>'+
      '<p class="hub-tag">'+esc(requestStatuses[current])+'</p>'+
      '<details style="margin:9px 0 12px"><summary style="cursor:pointer;font-weight:750">Vérifier les conditions avant publication</summary>'+
      '<div style="display:grid;gap:8px;margin:9px 0;padding:14px;border-radius:12px;background:#f0f2f4">'+
      field('Rémunération',r.salary_text)+field('Date et horaires',r.schedule_text)+
      field('Description à examiner',r.description,true)+
      field('Contact privé du recruteur',r.contact_name,true)+
      field('Téléphone privé',r.phone,true)+
      '<p class="hub-muted">Assurez-vous qu’aucune coordonnée personnelle n’est incluse dans le titre ou la description publique.</p>'+
      '</div></details>'+
      '<div class="hub-request-actions"><label>Décision administrative <select class="hub-select" data-request-status>'+options+'</select></label>'+
      '<button type="button" class="hub-action secondary" data-request-save>Enregistrer</button>'+
      '<button type="button" class="hn-admin-print-btn" data-request-print>⎙ Imprimer la demande</button>'+'<button type="button" class="hub-action secondary" data-request-private>✉ Contacter le recruteur</button>'+'<button type="button" class="hn-admin-remove-btn" data-request-remove aria-label="Supprimer cette annonce">🗑 Supprimer l’annonce</button></div>'+
      '<p class="hub-muted" data-request-feedback role="status"></p></article>';
  }).join(''):'<div class="hub-detail hub-muted">Aucune demande de recrutement dans le suivi central.</div>';
  target.querySelectorAll('[data-request-print]').forEach(button=>button.addEventListener('click',()=>{
    const card=button.closest('[data-request-id]'),record=requests.find(r=>r.id===card?.dataset.requestId);
    if(record)void printRecruiter(record,record.has_workplace_photo?()=>hubPhoto('/api/recruiter-requests/'+encodeURIComponent(record.id)+'/workplace-photo'):null);
  }));
  target.querySelectorAll('[data-request-private]').forEach(button=>button.addEventListener('click',async()=>{
    const card=button.closest('[data-request-id]'),id=card?.dataset.requestId;
    if(!id||button.disabled)return;
    button.disabled=true;const feedback=card.querySelector('[data-request-feedback]');
    try{const room=await hub('/api/chat/direct-threads',{method:'POST',body:{kind:'recruiter',sourceId:id}});
      location.assign('/conversations.html?id='+encodeURIComponent(room.id));
    }catch(e){if(feedback)feedback.textContent=e?.message||'Messagerie indisponible.';button.disabled=false;}
  }));
  target.querySelectorAll('[data-request-remove]').forEach(button=>button.addEventListener('click',async()=>{
    const card=button.closest('[data-request-id]');
    const id=card?.dataset.requestId,record=requests.find(r=>r.id===id);
    if(!record||button.disabled)return;
    const label=(record.kind==='shift'?'le shift « ':'l’offre « ')+(record.job_title||'Sans titre')+' »';
    if(!window.confirm('Supprimer '+label+' de HORENOVA ?\\n\\nElle disparaîtra des offres et shifts publics. Les candidatures déjà reçues et leur historique seront conservés.'))return;
    const feedback=card.querySelector('[data-request-feedback]');
    button.disabled=true;
    if(feedback)feedback.textContent='Suppression de l’annonce…';
    try{
      await hub('/api/recruiter-requests/'+encodeURIComponent(id),{method:'DELETE'});
      requests=requests.filter(r=>r.id!==id);
      listRequests();
      document.dispatchEvent(new Event('hn-admin-listing-removed'));
    }catch(error){
      if(feedback){feedback.textContent='Suppression impossible : '+(error?.message||String(error));feedback.style.color='#a52419';}
      button.disabled=false;
    }
  }));
  target.querySelectorAll('[data-request-save]').forEach(button=>button.addEventListener('click',async()=>{
    const card=button.closest('[data-request-id]');
    if(!card)return;
    const id=card.dataset.requestId,status=card.querySelector('[data-request-status]')?.value;
    const feedback=card.querySelector('[data-request-feedback]');
    button.disabled=true;
    feedback.textContent='Enregistrement du statut…';
    try{
      await hub('/api/recruiter-requests/'+encodeURIComponent(id)+'/status',{method:'PATCH',body:{status}});
      const old=requests.find(x=>x.id===id);if(old)old.status=status;
      feedback.textContent=status==='VALIDEE'
        ? '✓ Offre validée et visible sur HORENOVA. Consultez la diffusion pour vérifier Telegram et partager sur WhatsApp.'
        : status==='REFUSEE'
        ? '✓ Demande refusée, non visible publiquement.'
        : '✓ Demande en attente de vérification, non publiée.';
      feedback.style.color='#155b42';
      if(status==='VALIDEE'){
        const jump=document.createElement('a');
        jump.href='#hnAdminSocialPublications';
        jump.textContent=' Voir la diffusion et copier WhatsApp ↗';
        jump.style.cssText='display:block;margin-top:7px;font-weight:800;text-decoration:underline;color:inherit';
        feedback.append(jump);
      }
      card.querySelector('.hub-tag').textContent=requestStatuses[status]||status;
      document.dispatchEvent(new Event('hn-admin-moderation-changed'));
    }catch(error){
      feedback.textContent='Échec : '+(error?.message||String(error));
      feedback.style.color='#a52419';
    }finally{button.disabled=false;}
  }));
}
function list(){
 const term=$('hubSearch').value.toLowerCase().trim();
 const shown=applications.filter(a=>[a.jobTitle,a.candidateEmail,a.profile?.firstName,a.profile?.lastName,a.profile?.city].join(' ').toLowerCase().includes(term));
 $('hubCount').textContent=applications.length+' dossier(s)';
 $('hubCases').innerHTML=shown.map(a=>'<article class="hn-case-list-item">'+
   '<button type="button" class="hub-case '+(a.id===selected?'active':'')+'" data-id="'+esc(a.id)+'" aria-label="Ouvrir le dossier de '+esc([a.profile?.firstName,a.profile?.lastName].filter(Boolean).join(' ')||a.candidateEmail)+'">'+
   '<span>'+esc(new Date(a.createdAt).toLocaleDateString('fr-MA'))+'</span>'+
   '<strong>'+esc([a.profile?.firstName,a.profile?.lastName].filter(Boolean).join(' ')||a.candidateEmail)+'</strong>'+
   '<span>'+esc(a.jobTitle)+' · '+esc(a.profile?.city||'')+'</span>'+
   '<p class="hub-tag">'+esc(names[a.status]||a.status)+'</p></button>'+
   '<button class="hn-admin-print-btn hn-case-quickprint" type="button" data-quickprint-id="'+esc(a.id)+'" aria-label="Imprimer le dossier complet de '+esc([a.profile?.firstName,a.profile?.lastName].filter(Boolean).join(' ')||a.candidateEmail)+' avec photo">⎙ Imprimer la candidature avec photo</button>'+
   '</article>').join('')||'<div class="hub-detail hub-muted">Aucune candidature.</div>';
 $('hubCases').querySelectorAll('button[data-id]').forEach(b=>b.onclick=()=>detail(b.dataset.id,true));
 $('hubCases').querySelectorAll('button[data-quickprint-id]').forEach(b=>b.onclick=()=>{
   const candidate=applications.find(a=>a.id===b.dataset.quickprintId);
   if(candidate)void printCandidate(candidate,()=>hubPhoto('/api/applications/'+encodeURIComponent(candidate.id)+'/photo'));
 });
}
async function detail(id,scrollToDetail=false){
 selected=id;list();
 const a=applications.find(x=>x.id===id);
 if(!a)return;
 const p=a.profile||{},d=p.application||{};
 const languages=[['Arabe',p.arabic,p.arabicLevel],['Français',p.french,p.frenchLevel],['Anglais',p.english,p.englishLevel]]
  .filter(x=>x[1]).map(x=>x[0]+(x[2]?' · '+x[2]+'/5':'')).join(' · ')||'Non renseignées';
 const fullname=[p.firstName,p.lastName].filter(Boolean).join(' ').trim()||'Candidat HORENOVA';
 const select=statuses.map(k=>'<option value="'+k+'"'+(a.status===k?' selected':'')+'>'+esc(names[k])+'</option>').join('');
 const reqOptions='<option value="">Sélectionner une demande validée…</option>'+
  requests.filter(r=>r.status==='VALIDEE'&&(!r.job_role||r.job_role===a.jobRole)).map(r=>'<option value="'+esc(r.id)+'">'+esc(r.business_name+' · '+r.job_title)+'</option>').join('');
 const personFields=field('E-mail',a.candidateEmail,true)+field('Âge',p.age)+field('Ville',p.city);
 const workFields=field('Métier',p.jobFamily)+field('Langues',languages,true)+field('Années d’expérience',d.experienceYears)+field('Dernier poste',d.lastPosition)+field('Compétences',Array.isArray(d.skills)?d.skills.join(' · '):d.skills,true)+field('Disponibilité',d.availability)+field('Date souhaitée',d.earliestStart)+field('Ville souhaitée',d.desiredCity)+field('Contrat préféré',d.contractPreference);
 const candidateFields=field('Quiz (facultatif)',p.quizPassed?String(p.quizScore)+' %':'Non fourni')+field('Vidéo (facultative)',p.videoFileId?'Enregistrée':'Non fournie')+field('Présentation',p.bio,true)+field('Motivation détaillée',d.motivation,true);
 const privateFields=field('Téléphone privé du candidat',d.phone,true)+field('Consentement candidat',a.consentToIntro?'Oui':'Non');
 const group=(title,subtitle,fields,icon)=>'<section class="hn-case-section"><div class="hn-case-section-head"><span class="hn-case-section-icon" aria-hidden="true">'+icon+'</span><div><h4>'+title+'</h4><p>'+subtitle+'</p></div></div><div class="hub-grid hn-case-fields">'+fields+'</div></section>';
 const markup='<div class="hub-detail hn-case-detail">'+
  '<button type="button" class="hn-case-back" id="hnBackToCases">← Retour aux candidatures</button>'+
  '<div class="hn-case-printbar"><button type="button" class="hn-admin-print-btn" id="hnCasePrint">⎙ Imprimer le dossier complet avec photo</button><span>Fiche A4 · accès administrateur</span></div>'+
  '<div class="hn-case-heading"><span class="hub-small">DOSSIER PRIVÉ · '+esc(id.slice(0,8))+'</span><div class="hn-case-profile">'+
  '<div class="hn-case-portrait-wrap"><div id="hubPortrait" class="hub-photo hub-photo-placeholder" aria-label="Photo du candidat">◉</div></div>'+
  '<div class="hn-case-profile-copy"><h3>'+esc(fullname)+'</h3><p>'+esc(a.jobTitle||'Candidature')+'</p><span class="hub-tag">'+esc(names[a.status]||a.status)+'</span></div></div></div>'+
  group('Identité et contact','Informations transmises par le candidat',personFields,'01')+
  group('Profil professionnel','Métier, expérience et disponibilité',workFields,'02')+
  group('Informations complémentaires','Quiz et vidéo facultatifs · la candidature reste valide sans eux',candidateFields,'03')+
  '<details class="hn-case-private"><summary>Informations confidentielles · accès administrateur</summary>'+
  '<div class="hub-grid hn-case-fields">'+privateFields+'</div></details>'+
  '<section class="hn-case-section hn-case-decisions"><div class="hn-case-section-head"><span class="hn-case-section-icon" aria-hidden="true">04</span><div><h4>Décision administrative</h4><p>Vérifiez le dossier avant toute mise en relation</p></div></div>'+
  '<div class="hub-controls hn-case-controls"><label>Statut du dossier<select class="hub-select" id="hubStatus">'+select+'</select></label>'+
  '<button class="hub-action" type="button" id="saveStatus">Enregistrer le statut</button>'+
  '<label>Associer une demande d’établissement<select class="hub-select" id="recruitRequest">'+reqOptions+'</select></label>'+
  '<button class="hub-action secondary" type="button" id="assignRequest" '+(a.recruiterWixId?'disabled':'')+'>Autoriser la mise en relation</button>'+
  '<button type="button" class="hub-action secondary" id="hnPrivateCandidateMessage">✉ Contacter le candidat en privé</button>'+
   (a.recruiterWixId?'<a class="hub-action secondary" href="/conversations.html?id='+encodeURIComponent(id)+'">Ouvrir la conversation à trois ↗</a>':'<a class="hub-action secondary" href="/conversations.html?mode=matching">✦ Rechercher un recruteur compatible ↗</a>')+
  '<p class="hub-error" id="caseError" role="alert"></p></div></section></div>';
 const target=$('hubDetail');
 target.innerHTML=markup;
 root.classList.add('hn-case-open');
 $('hnCasePrint').onclick=()=>void printCandidate(a,()=>hubPhoto('/api/applications/'+encodeURIComponent(id)+'/photo'));
  $('hnBackToCases').onclick=()=>{
  root.classList.remove('hn-case-open');selected='';list();
  const listBox=$('adminApplications');if(listBox){listBox.scrollIntoView({block:'start',behavior:'smooth'});}
 };
 $('saveStatus').onclick=async()=>{
  const button=$('saveStatus'),error=$('caseError');button.disabled=true;
  try{await hub('/api/applications/'+encodeURIComponent(id)+'/status',{method:'PATCH',body:{status:$('hubStatus').value}});await refresh();}
  catch(e){error.textContent=e?.message||String(e);}
  finally{button.disabled=false;}
 };
 $('hnPrivateCandidateMessage').onclick=async()=>{
    const button=$('hnPrivateCandidateMessage'),error=$('caseError');button.disabled=true;
    try{const room=await hub('/api/chat/direct-threads',{method:'POST',body:{kind:'candidate',sourceId:id}});
      location.assign('/conversations.html?id='+encodeURIComponent(room.id));
    }catch(e){error.textContent=e?.message||'Messagerie indisponible.';button.disabled=false;}
  };
  $('assignRequest').onclick=async()=>{
  const button=$('assignRequest'),error=$('caseError');button.disabled=true;
  try{const requestId=$('recruitRequest').value;if(!requestId)throw Error('Sélectionnez une demande.');if(!a.consentToIntro)throw Error('Consentement candidat requis.');await hub('/api/applications/'+encodeURIComponent(id)+'/assign',{method:'PATCH',body:{requestId}});await refresh();}
  catch(e){error.textContent=e?.message||String(e);}
  finally{button.disabled=false;}
 };
 if(scrollToDetail){
  requestAnimationFrame(()=>{target.scrollIntoView({block:'start',behavior:'smooth'});});
 }
 if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}
 try{
  objectUrl=await hubPhoto('/api/applications/'+encodeURIComponent(id)+'/photo');
  if(objectUrl&&id===selected){const img=document.createElement('img');img.className='hub-photo';img.src=objectUrl;img.alt='Photo du candidat';$('hubPortrait')?.replaceWith(img);}
 }catch{}
}

async function refresh(){
try{showError('');const [a,r]=await Promise.all([hub('/api/applications'),hub('/api/recruiter-requests')]);applications=a.items||[];requests=r.items||[];list();listRequests();if(selected&&applications.some(a=>a.id===selected))await detail(selected,false);else root.classList.remove('hn-case-open');}
catch(e){showError(e.message+' Les dossiers privés restent accessibles dans le CMS administrateur Wix.');$('hubCases').innerHTML='<div class="hub-detail hub-muted">Service des dossiers non disponible.</div>';}
}
document.addEventListener('hn-admin-listing-removed',()=>{void refresh()});
$('hubSearch').oninput=list;$('hubRefresh').onclick=refresh;await refresh();
try{const {mountAdminOverview}=await import('/admin-overview.js?v=admin-delete-scroll-v1');await mountAdminOverview();}catch(error){console.error('Contrôle des publications indisponible',error);}
}