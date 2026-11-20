import { requireRole,currentLang } from '/mihna-global.js';
import { queryItems, insertItem } from '/js/wix/items.js';
import { hub, hubUploadWorkplacePhoto, hubPhoto } from '/hn-api.js?v=professional-20261119-r1';
const auth=await requireRole(['recruiter'],false);
if(!auth){location.replace('/account.html');throw new Error('Espace réservé aux recruteurs');}
const root=document.getElementById('recruitGate');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let prof=null;
if(!auth.demo&&auth.role==='recruiter')prof=(await queryItems('RecruiterProfiles',{filters:[{field:'_owner',op:'eq',value:auth.member.id}],limit:1})).items[0]||null;
if(auth.role==='recruiter'&&!prof){location.replace('/recruiter-setup.html');throw new Error('Profil à compléter');}
root.innerHTML=`<section class='hn-rec-command' aria-label='Tableau de bord recruteur'>
  <div class='hn-rec-head'><div><span class='hn-rec-eyebrow'>HORENOVA · ESPACE RECRUTEUR</span><h2>Votre équipe commence ici.</h2><p>Bienvenue ${esc(prof?.businessName||'dans votre espace professionnel')} · Toutes vos demandes, leurs véritables statuts et vos candidatures au même endroit.</p></div><a class='hn-rec-create' href='#liveRecruitForm'>＋ Nouvelle annonce</a></div>
  <div class='hn-rec-kpis' id='hnRecruitKpis' role='status'><div class='hn-rec-kpi'><span>Annonces en ligne</span><strong>—</strong></div><div class='hn-rec-kpi'><span>En attente</span><strong>—</strong></div><div class='hn-rec-kpi'><span>À synchroniser</span><strong>—</strong></div><div class='hn-rec-kpi'><span>Refusées</span><strong>—</strong></div></div>
 </section>
 <section class='hn-rec-board' aria-label='Suivi de mes annonces'><div class='hn-rec-board-head'><div><h3>Mes annonces et shifts</h3><p>Statuts vérifiés auprès de HORENOVA. Une annonce en ligne est accessible au public.</p></div><button class='soft-btn' id='hnRecruitReload' type='button'>Actualiser ↻</button></div>
 <div class='hn-rec-tabs' id='hnRecruitTabs' role='tablist' aria-label='Filtrer les annonces'>
 <button type='button' data-recruit-filter='all' aria-selected='true'>Toutes</button>
 <button type='button' data-recruit-filter='live' aria-selected='false'>En ligne</button>
 <button type='button' data-recruit-filter='pending' aria-selected='false'>En attente</button>
 <button type='button' data-recruit-filter='sync' aria-selected='false'>À synchroniser</button>
 <button type='button' data-recruit-filter='rejected' aria-selected='false'>Refusées</button>
 <button type='button' data-recruit-filter='issue' aria-selected='false'>À vérifier</button></div>
 <div class='jobs-grid-page' id='liveRecruitJobs' aria-live='polite'></div><p class='hn-rec-empty' id='hnRecruitFilterEmpty' hidden>Aucune annonce dans cette catégorie.</p></section>
 <div class='hn-rec-helper'>Les nouvelles offres sont examinées par HORENOVA avant publication. Aucun contact privé n’est publié automatiquement.</div>
<div class='recruit-page'><form class='recruit-form' id='liveRecruitForm'>
<span class='small-title'>DEMANDE DE RECRUTEMENT CONFIDENTIELLE</span>
<p>Votre demande arrive à Horenova. Notre équipe valide les conditions, publie une annonce anonyme et organise les mises en relation.</p>
<div class='form-grid'>
<label><small>TYPE</small><select name='kind'><option value='job'>Emploi</option><option value='shift'>Shift</option></select></label>
<label><small>MÉTIER</small><select name='role'><option>Serveur</option><option>Barista</option><option>Chef de cuisine</option><option>Commis</option><option>Barman</option><option>Pâtissier</option><option>Plongeur</option><option>Réceptionniste</option></select></label>
<label><small>VILLE *</small><input name='city' list='hnRecruitCities' required maxlength='80' value='${esc(prof?.city||'')}' placeholder='Ville au Maroc'><datalist id='hnRecruitCities'><option value='Casablanca'><option value='Rabat'><option value='Marrakech'><option value='Fès'><option value='Tanger'><option value='Agadir'><option value='Meknès'><option value='Oujda'><option value='Tétouan'><option value='Kénitra'><option value='El Jadida'><option value='Safi'><option value='Nador'><option value='Dakhla'><option value='Laâyoune'></datalist></label>
<label><small>ÉTABLISSEMENT (PRIVÉ)</small><input name='businessName' required maxlength='120' value='${esc(prof?.businessName||'')}'></label>
<label><small>PERSONNE À CONTACTER</small><input name='contactName' required maxlength='120' value='${esc(prof?.contactName||'')}'></label>
<label><small>TÉLÉPHONE PRIVÉ</small><input name='phone' required maxlength='40' value='${esc(prof?.phone||'')}'></label>
<label class='wide'><small>TITRE</small><input name='title' required maxlength='120' placeholder='Ex. Barista — matin'></label>
<label><small>RÉMUNÉRATION</small><input name='salaryText' maxlength='120' placeholder='Ex. 5 500 DH'></label>
<label><small>HORAIRES</small><input name='scheduleText' maxlength='120' placeholder='Ex. 18:00–23:00'></label>
<div class='wide' id='recruitShiftFields' hidden style='padding:12px;border-radius:14px;background:#ecefe9;margin-top:10px'>
  <strong style='display:block;margin-bottom:10px'>Détails de la mission / shift</strong>
  <div class='form-grid'>
    <label><small>DATE DU SHIFT</small><input type='date' name='shiftDate'></label>
    <label><small>DÉBUT</small><input type='time' name='shiftStart'></label>
    <label><small>FIN</small><input type='time' name='shiftEnd'></label>
    <label><small>POSTES À POURVOIR</small><input type='number' name='shiftSlots' min='1' max='200' value='1'></label>
  </div>
</div>
<label><small>TYPE D'ÉTABLISSEMENT</small><select name='businessType' required><option value=''>Choisir un établissement</option><option>Restaurant</option><option>Café</option><option>Hôtel / Riad</option><option>Complexe de loisirs</option><option>Traiteur / Événementiel</option><option>Boulangerie / Pâtisserie</option><option>Tourisme / Agence de voyages</option><option>Autre</option></select></label>
<label><small>CONTRAT</small><select name='contractType' required><option value=''>Choisir un contrat</option><option value='CDI'>CDI</option><option value='CDD'>CDD</option><option value='Shift / mission'>Shift / mission</option><option value='Temps partiel'>Temps partiel</option><option value='Stage'>Stage</option><option value='Autre'>Autre</option></select></label>
<label class='wide'><small>ADRESSE DU LIEU DE TRAVAIL · PUBLIQUE</small><input name='workplaceAddress' maxlength='180' required placeholder='Quartier, avenue, ville (sans téléphone ni e-mail)' value='${esc(prof?.businessAddress||'')}'></label>
<label><small>NOMBRE DE POSTES</small><input type='number' name='openings' min='1' max='200' value='1' required></label>
<label><small>DATE DE DÉBUT (SI CONNUE)</small><input type='date' name='startDate'></label>
<label class='wide'><small>COMPÉTENCES & EXIGENCES *</small><textarea name='requirements' rows='3' maxlength='1200' minlength='15' required placeholder='Ex. Service en salle, 2 ans d’expérience, hygiène, langues, horaires…'></textarea></label>
<label class='wide'><small>DESCRIPTION</small><textarea name='description' rows='4' maxlength='1500' placeholder='Compétences et conditions, sans coordonnées personnelles'></textarea></label>
<div class='wide hn-workplace-uploader'>
  <span class='small-title'>PHOTO AUTHENTIQUE DU LIEU DE TRAVAIL · OBLIGATOIRE</span>
  <p>Ajoutez une photo récente de la salle, de la réception, du café ou du complexe où la personne travaillera. Après validation HORENOVA, elle sera visible sur votre annonce nationale. Aucun visage identifiable sans autorisation.</p>
  <input type='file' name='workplacePhoto' id='workplacePhoto' accept='image/jpeg,image/png,image/webp,image/heic,image/heif' aria-label='Photo de l’établissement'>
  <img id='workplacePreview' alt='Aperçu du lieu de travail' hidden>
  <small id='workplacePhotoStatus' role='status'>Image JPEG, PNG ou HEIC · optimisée automatiquement · format horizontal conseillé.</small>
</div>
</div><p id='recruitStatus' role='status'></p><p class='form-error' data-error></p>
<button class='cta-main' type='submit'>Envoyer ma demande à Horenova ↗</button></form>
<aside class='recruit-aside'><span class='small-title'>INTERMÉDIATION</span><h2>Un contact unique : Horenova.</h2><p>Nous recevons les candidatures et coordonnons les échanges. Aucun candidat ne reçoit directement vos coordonnées. Tout partage de données privées nécessite un accord.</p><a class='soft-btn' href='/talents.html'>Voir les profils anonymes →</a></aside></div>
<section class='listing-page compact'>
<div class='listing-toolbar'><div><span class='small-title'>CANDIDATURES VALIDÉES</span><h2>Les candidats de votre établissement.</h2><p>Une candidature apparaît après accord du candidat et affectation par HORENOVA.</p></div><div style='display:flex;flex-wrap:wrap;gap:10px'><button type='button' class='soft-btn' id='refreshRecruitApplications'>Actualiser les candidatures ↻</button><a href='/conversations.html' class='soft-btn'>Toutes mes conversations ↗</a></div></div><div class='recruit-inbox' id='liveRecruitApplications' aria-live='polite'><div class='empty-state'>Chargement de vos candidatures…</div></div></section>`;
const form=document.getElementById('liveRecruitForm');
if(prof?.businessType)form.elements.businessType.value=prof.businessType;
const status=document.getElementById('recruitStatus');
const workplaceInput=document.getElementById('workplacePhoto');
const workplacePreview=document.getElementById('workplacePreview');
const workplaceInfo=document.getElementById('workplacePhotoStatus');
let hasWorkplacePhoto=false;
try{
 const state=await hub('/api/recruiter/workplace-photo/status');
 hasWorkplacePhoto=!!state.hasPhoto;
 if(hasWorkplacePhoto)workplaceInfo.textContent='✓ Une photo de votre établissement est déjà enregistrée. Ajoutez-en une autre seulement pour la remplacer.';
}catch{workplaceInfo.textContent='Statut de la photo non disponible. Ajoutez une image pour cette annonce.';}
workplaceInput.required=!hasWorkplacePhoto;
workplaceInput.addEventListener('change',()=>{
 const file=workplaceInput.files?.[0];
 if(!file)return;
 if(!file.type.startsWith('image/')){workplaceInfo.textContent='Choisissez une photo (JPEG, PNG ou HEIC).';return;}
 workplacePreview.src=URL.createObjectURL(file);
 workplacePreview.hidden=false;
 workplaceInfo.textContent=file.name+' · '+(file.size/1024/1024).toFixed(1)+' Mo';
});
async function optimizeWorkplacePhoto(file){
 if(file.size>12*1024*1024)throw Error('Photo trop volumineuse : maximum 12 Mo avant optimisation.');
 let source=null,url='';
 try{
   if(typeof createImageBitmap==='function'){
     try{source=await createImageBitmap(file);}catch{}
   }
   if(!source){
     url=URL.createObjectURL(file);
     source=await new Promise((resolve,reject)=>{
       const image=new Image();
       image.onload=()=>resolve(image);
       image.onerror=()=>reject(new Error('Format de photo non pris en charge. Choisissez un JPEG ou PNG.'));
       image.src=url;
     });
   }
   const width=source.width||source.naturalWidth,height=source.height||source.naturalHeight;
   if(!width||!height)throw new Error('Photo sans dimensions valides.');
   const canvas=document.createElement('canvas');
   const edge=1400,ratio=Math.min(1,edge/Math.max(width,height));
   canvas.width=Math.max(1,Math.round(width*ratio));
   canvas.height=Math.max(1,Math.round(height*ratio));
   canvas.getContext('2d').drawImage(source,0,0,canvas.width,canvas.height);
   let quality=.78,blob;
   do{
     blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));
     quality-=.10;
   }while(blob?.size>530000&&quality>=.35);
   if(!blob||blob.size>550000)throw new Error('Impossible de réduire la photo sous 550 Ko. Choisissez une autre image.');
   return blob;
 }finally{
   if(source&&typeof source.close==='function')source.close();
   if(url)URL.revokeObjectURL(url);
 }
}

const shiftFields=document.getElementById('recruitShiftFields');
function updateShiftFields(){
 const isShift=form.elements.kind.value==='shift';
 if(isShift)form.elements.contractType.value='Shift / mission';
 else if(form.elements.contractType.value==='Shift / mission')form.elements.contractType.value='';
 shiftFields.hidden=!isShift;
 ['shiftDate','shiftStart','shiftEnd','shiftSlots'].forEach(key=>{
  if(form.elements[key])form.elements[key].required=isShift;
 });
 form.elements.scheduleText.placeholder=isShift?'Complété automatiquement à partir du shift':'Ex. 09:00–17:00 ou temps plein';
}
form.elements.kind.addEventListener('change',updateShiftFields);
updateShiftFields();
let activeRecruitFilter='all';
function filterRecruitCards(){const grid=document.getElementById('liveRecruitJobs');if(!grid)return;let visible=0;grid.querySelectorAll('[data-hn-job-status]').forEach(card=>{const show=activeRecruitFilter==='all'||card.dataset.hnJobStatus===activeRecruitFilter;card.hidden=!show;if(show)visible++;});const empty=document.getElementById('hnRecruitFilterEmpty');if(empty)empty.hidden=visible>0||!!grid.querySelector('.empty-state');document.querySelectorAll('#hnRecruitTabs [data-recruit-filter]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.recruitFilter===activeRecruitFilter)));}
document.getElementById('hnRecruitTabs')?.addEventListener('click',event=>{const btn=event.target.closest('[data-recruit-filter]');if(!btn)return;activeRecruitFilter=btn.dataset.recruitFilter;filterRecruitCards();});
document.getElementById('hnRecruitReload')?.addEventListener('click',async event=>{const btn=event.currentTarget;btn.disabled=true;try{await render();await renderRecruiterApplications();}finally{btn.disabled=false;}});
async function render(){
 const grid=document.getElementById('liveRecruitJobs');
 if(!grid)return;
 const results=await Promise.allSettled([
  hub('/api/recruiter-requests'),
  queryItems('JobRequests',{filters:[{field:'_owner',op:'eq',value:auth.member.id}],limit:50,sort:[{field:'_createdDate',direction:'desc'}]}),
  hub('/api/jobs/public')
 ]);
 const central=results[0].status==='fulfilled'?(results[0].value.items||[]):null;
 const saved=results[1].status==='fulfilled'?(results[1].value.items||[]):[];
 const mine=saved.filter(j=>!auth.member?.id||!j._owner||j._owner===auth.member.id);
 const delivered=new Set((central||[]).map(j=>j.wix_request_id).filter(Boolean));
 const publicJobs=results[2].status==='fulfilled'?(results[2].value.items||[]):null;
 const publicIds=new Set((publicJobs||[]).map(x=>x.id));
 const statusFor=j=>{
  if(j.status==='REFUSEE')return 'rejected';
  if(j.status==='A_EXAMINER')return 'pending';
  if(j.status==='VALIDEE')return publicJobs===null?'issue':publicIds.has(j.id)?'live':'issue';
  return 'issue';
 };
 const textFor=j=>{
  const status=statusFor(j);
  return {live:'En ligne · visible publiquement',pending:'En attente de validation',rejected:'Refusée par HORENOVA',issue:j.status==='VALIDEE'?'Validée · visibilité à vérifier':'Statut à vérifier'}[status];
 };
 const centralCards=(central||[]).map(j=>{
  const state=statusFor(j),url='/job.html?id='+encodeURIComponent(j.id);
  const publicActions=state==='live'?'<div class="hn-rec-card-actions"><a href="'+url+'">Voir l’annonce</a><button type="button" data-share-link="'+esc(j.id)+'">Copier le lien</button><a href="https://wa.me/?text='+encodeURIComponent('Offre HORENOVA · '+(j.job_title||'Emploi')+' · '+(j.city||'Maroc')+' — '+new URL(url,location.origin).href)+'" target="_blank" rel="noopener noreferrer">WhatsApp</a></div>':'';
  return '<article class="job-card-page hn-rec-listing" data-hn-job-status="'+state+'"><div class="job-card-content"><small>'+esc(j.kind==='shift'?'SHIFT':'EMPLOI')+' · '+esc(j.job_role||'')+'</small><h3>'+esc(j.job_title||'Demande')+'</h3><p>'+esc(j.city||'')+' · '+esc(j.business_name||'')+'</p><strong class="hn-rec-status '+(state==='rejected'?'rejected':state==='pending'?'pending':state==='issue'?'issue':'')+'">'+esc(textFor(j))+'</strong>'+publicActions+'</div></article>';
 }).join('');
 const legacy=mine.filter(j=>!central||!delivered.has(j._id));
 const legacyCards=legacy.map(j=>'<article class="job-card-page hn-rec-listing" data-hn-job-status="sync"><div class="job-card-content"><small>'+esc(j.kind||'Emploi')+' · '+esc(j.role||'')+'</small><h3>'+esc(j.title||'Demande')+'</h3><p>'+esc(j.city||'')+' · '+esc(j.businessName||'')+'</p><strong class="hn-rec-status pending">'+(central?'Enregistrée · synchronisation requise':'Enregistrée · suivi central indisponible')+'</strong>'+(central&&auth.role==='recruiter'?'<div class="hn-rec-card-actions"><button type="button" data-sync="'+esc(j._id)+'">Synchroniser cette demande</button></div>':'')+'</div></article>').join('');
 const warning=central===null?'<div class="empty-state">La connexion au suivi central est momentanément indisponible. Aucune synchronisation ne peut être confirmée.</div>':'';
 grid.innerHTML=(warning+centralCards+legacyCards)||'<div class="empty-state"><h3>Aucune demande envoyée.</h3><p>Votre première demande apparaîtra ici.</p></div>';
 const stats=document.getElementById('hnRecruitKpis');
 if(stats){const kpis=[['Annonces en ligne',central===null||publicJobs===null?'—':central.filter(j=>statusFor(j)==='live').length],['En attente',central===null?'—':central.filter(j=>statusFor(j)==='pending').length],['À synchroniser',legacy.length],['Refusées',central===null?'—':central.filter(j=>statusFor(j)==='rejected').length]];stats.innerHTML=kpis.map(([name,value])=>'<div class="hn-rec-kpi"><span>'+esc(name)+'</span><strong>'+esc(value)+'</strong></div>').join('');}
 filterRecruitCards();
 grid.querySelectorAll('[data-share-link]').forEach(btn=>btn.addEventListener('click',async()=>{const url=new URL('/job.html?id='+encodeURIComponent(btn.dataset.shareLink),location.origin).href;try{await navigator.clipboard.writeText(url);btn.textContent='✓ Lien copié';setTimeout(()=>{if(btn.isConnected)btn.textContent='Copier le lien';},2000);}catch{window.prompt('Copier le lien de l’annonce',url);}}));
 grid.querySelectorAll('[data-sync]').forEach(button=>button.addEventListener('click',async()=>{
  const request=legacy.find(j=>j._id===button.dataset.sync);
  if(!request)return;
  button.disabled=true;
  status.className='';
  status.textContent='Synchronisation de votre ancienne demande…';
  try{
   const submitted=await hub('/api/recruiter-requests',{method:'POST',body:{
    ...request,jobTitle:request.title,wixRequestId:request._id,locale:currentLang()
   }});
   status.className='recruit-status-ok';
   status.textContent='✓ Ancienne demande synchronisée avec HORENOVA.';
   await render();
  }catch(error){
   status.className='recruit-status-error';
   status.textContent='Synchronisation impossible : '+(error?.message||String(error));
   button.disabled=false;
  }
 }));
}
async function renderRecruiterApplications(){
 const area=document.getElementById('liveRecruitApplications');
 if(!area)return;
 try{
   const response=await hub('/api/applications');
   const cases=Array.isArray(response.items)?response.items:[];
   if(!cases.length){
     area.innerHTML='<div class="empty-state"><h3>Aucune candidature affectée.</h3><p>Lorsqu’un candidat postule à une annonce validée, HORENOVA étudie le dossier et organise la mise en relation. Vous retrouverez ici uniquement les candidatures qui vous ont été attribuées.</p><a class="soft-btn" href="/talents.html">Explorer les talents anonymisés ↗</a></div>';
     return;
   }
   area.innerHTML=cases.map(a=>{
     const name=[a.profile?.firstName,a.profile?.lastName].filter(Boolean).join(' ')||'Candidat HORENOVA';
     const link='/conversations.html?id='+encodeURIComponent(a.id||'');
     const dossier=a.profile?.application||{};
     const skills=Array.isArray(dossier.skills)?dossier.skills.join(' · '):'';
     const experience=Number.isFinite(Number(dossier.experienceYears))?Number(dossier.experienceYears)+' an(s)':'À préciser';
     const state=({
       EN_ETUDE:'En étude',PRESELECTION:'Présélection',ENTRETIEN:'Entretien',
       MISE_EN_RELATION:'Mise en relation',RETENUE:'Retenue',REFUSEE:'Refusée',CLOTURE:'Clôturée'
     })[a.status]||a.status||'Mise en relation';
     return '<article class="job-card-page" style="margin-bottom:14px"><div class="job-card-content">'+
       '<small>CONFIDENTIEL · CANDIDATURE AUTORISÉE</small><h3>'+esc(name)+'</h3>'+
       '<p>'+esc(a.jobTitle||'Offre')+' · '+esc(a.jobRole||'')+'</p>'+
       '<p><strong>Statut :</strong> '+esc(state)+'</p>'+
       '<div class="hn-rec-dossier">'+
       '<div><small>EXPÉRIENCE</small><b>'+esc(experience)+'</b></div>'+
       '<div><small>DERNIER POSTE</small><b>'+esc(dossier.lastPosition||'À préciser')+'</b></div>'+
       '<div><small>DISPONIBILITÉ</small><b>'+esc(dossier.availability||'À convenir')+'</b></div>'+
       '<div><small>VILLE</small><b>'+esc(dossier.desiredCity||a.profile?.city||'Maroc')+'</b></div>'+
       (skills?'<div class="wide"><small>COMPÉTENCES</small><p>'+esc(skills)+'</p></div>':'')+
       (dossier.motivation?'<div class="wide"><small>MOTIVATION</small><p>'+esc(dossier.motivation)+'</p></div>':'')+
       '</div>'+
       '<div data-candidate-photo-target="'+esc(a.id||'')+'"></div>'+
       '<button type="button" class="soft-btn" data-candidate-photo="'+esc(a.id||'')+'">Voir le portrait autorisé ↗</button> '+
       '<a class="soft-btn" href="'+esc(link)+'">Ouvrir la conversation avec HORENOVA ↗</a>'+
       '</div></article>';
   }).join('');
   area.querySelectorAll('[data-candidate-photo]').forEach(button=>button.onclick=async()=>{
     const id=button.dataset.candidatePhoto,target=button.closest('.job-card-page')?.querySelector('[data-candidate-photo-target]');
     if(!id||!target)return;
     button.disabled=true;target.textContent='Chargement du portrait confidentiel…';
     try{
       const url=await hubPhoto('/api/applications/'+encodeURIComponent(id)+'/photo');
       if(!url){target.textContent='Photo non disponible pour ce candidat.';return;}
       target.innerHTML='<img class="hn-rec-candidate-portrait" alt="Portrait privé du candidat autorisé">';
       target.querySelector('img').src=url;
       button.hidden=true;
     }catch(error){target.textContent='Erreur de chargement du portrait.';}
     finally{button.disabled=false;}
   });
 }catch(error){
   area.innerHTML='<div class="empty-state" role="alert"><h3>Suivi temporairement indisponible.</h3><p>Aucune candidature n’est supprimée. Rechargez cette page quand la connexion est rétablie.</p></div>';
   console.warn('HORENOVA: recruiter applications temporarily unavailable',error?.message||'network');
 }
}

let pendingSync=null;
form.addEventListener('submit',async event=>{
 event.preventDefault();
 if(!form.reportValidity())return;
 const btn=form.querySelector('button[type=submit]');
 const err=form.querySelector('[data-error]');
 btn.disabled=true;err.textContent='';status.className='';
 try{
  if(!pendingSync){
   const imageFile=workplaceInput.files?.[0]||null;
   if(!imageFile && !hasWorkplacePhoto)throw Error('Ajoutez une photo réelle du lieu de travail.');
   if(imageFile){
     status.textContent='Optimisation et sauvegarde de la photo de l’établissement…';
     await hubUploadWorkplacePhoto(await optimizeWorkplacePhoto(imageFile));
     hasWorkplacePhoto=true;
     workplaceInput.required=false;
     workplaceInfo.textContent='✓ Photo enregistrée. Elle apparaîtra après validation de l’annonce.';
   }
   const data=Object.fromEntries(new FormData(form).entries());
   delete data.workplacePhoto; // A File must never be serialized into CMS JSON.
   data.title=String(data.title||'').trim();
   if(data.kind==='shift'){
     const day=data.shiftDate||'',start=data.shiftStart||'',end=data.shiftEnd||'';
     const slots=Number(data.shiftSlots);
     if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!/^\d{2}:\d{2}$/.test(start)||!/^\d{2}:\d{2}$/.test(end))throw Error('Date et heures du shift obligatoires.');
     if(!Number.isInteger(slots)||slots<1||slots>200)throw Error('Nombre de postes invalide (1 à 200).');
     data.scheduleText=day+' · '+start+'–'+end+' · '+slots+' poste(s)';
     data.openings=slots;
     data.contractType='Shift / mission';
   }
   data.businessName=String(data.businessName||'').trim();
   if(data.title.length<4||data.businessName.length<2)throw Error('Le titre doit contenir 4 caractères et l’établissement 2 caractères minimum.');
   data.requestStatus='À examiner';
   status.textContent='Enregistrement de votre demande…';
   const record=await insertItem('JobRequests',data);
   pendingSync={data,id:record._id};
  }
  status.textContent='Transmission au suivi central HORENOVA…';
  await hub('/api/recruiter-requests',{method:'POST',body:{
   ...pendingSync.data,jobTitle:pendingSync.data.title,wixRequestId:pendingSync.id,locale:currentLang()
  }});
  pendingSync=null;
  status.className='recruit-status-ok';
  status.textContent='✓ Demande et photo enregistrées. Publication après validation par l’administrateur HORENOVA.'+(submitted.emailQueued&&submitted.emailEnabled?' Un e-mail de confirmation est en cours d’envoi.':'');
  form.elements.title.value='';
  form.elements.description.value='';
  await render();
 }catch(error){
  status.className='recruit-status-error';
  const message=error?.message||String(error);
  err.textContent=message;
  status.textContent=pendingSync
    ?'Demande enregistrée dans Wix, mais transmission centrale NON confirmée. Appuyez à nouveau sur Envoyer pour réessayer sans enregistrer de doublon.'
    :'La demande n’a pas été enregistrée. Corrigez le formulaire puis réessayez.';
 }finally{btn.disabled=false;}
});
await render();
await renderRecruiterApplications();
const refreshRecruitApps=document.getElementById('refreshRecruitApplications');
if(refreshRecruitApps)refreshRecruitApps.onclick=async()=>{
 refreshRecruitApps.disabled=true;
 try{await renderRecruiterApplications();}
 finally{refreshRecruitApps.disabled=false;}
};
// A new admin assignment becomes visible across devices without a reload.
setInterval(()=>{if(!document.hidden)renderRecruiterApplications().catch(()=>{});},60000);
