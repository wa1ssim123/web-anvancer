import { requireRole } from '/mihna-global.js';
import { queryItems, insertItem } from '/js/wix/items.js';
import { hub } from '/hn-api.js';
const auth=await requireRole(['recruiter','admin']);
if(!auth)throw new Error('Accès non autorisé');
const root=document.getElementById('recruitGate');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let prof=null;
if(!auth.demo&&auth.role==='recruiter')prof=(await queryItems('RecruiterProfiles',{limit:1})).items[0]||null;
if(auth.role==='recruiter'&&!prof){location.replace('/recruiter-setup.html');throw new Error('Profil à compléter');}
root.innerHTML=`<div class='recruit-page'><form class='recruit-form' id='liveRecruitForm'>
<span class='small-title'>DEMANDE DE RECRUTEMENT CONFIDENTIELLE</span>
<p>Votre demande arrive à Horenova. Notre équipe valide les conditions, publie une annonce anonyme et organise les mises en relation.</p>
<div class='form-grid'>
<label><small>TYPE</small><select name='kind'><option value='job'>Emploi</option><option value='shift'>Shift</option></select></label>
<label><small>MÉTIER</small><select name='role'><option>Serveur</option><option>Barista</option><option>Chef de cuisine</option><option>Commis</option><option>Barman</option><option>Pâtissier</option><option>Plongeur</option><option>Réceptionniste</option></select></label>
<label><small>VILLE</small><select name='city'><option>Casablanca</option><option>Marrakech</option><option>Rabat</option><option>Tanger</option><option>Agadir</option><option>Fès</option><option>Bouskoura</option><option>Essaouira</option></select></label>
<label><small>ÉTABLISSEMENT (PRIVÉ)</small><input name='businessName' required maxlength='120' value='${esc(prof?.businessName||'')}'></label>
<label><small>PERSONNE À CONTACTER</small><input name='contactName' required maxlength='120' value='${esc(prof?.contactName||'')}'></label>
<label><small>TÉLÉPHONE PRIVÉ</small><input name='phone' required maxlength='40' value='${esc(prof?.phone||'')}'></label>
<label class='wide'><small>TITRE</small><input name='title' required maxlength='120' placeholder='Ex. Barista — matin'></label>
<label><small>RÉMUNÉRATION</small><input name='salaryText' maxlength='120' placeholder='Ex. 5 500 DH'></label>
<label><small>HORAIRES</small><input name='scheduleText' maxlength='120' placeholder='Ex. 18:00–23:00'></label>
<label class='wide'><small>DESCRIPTION</small><textarea name='description' rows='4' maxlength='1500' placeholder='Compétences et conditions, sans coordonnées personnelles'></textarea></label>
</div><p id='recruitStatus' role='status'></p><p class='form-error' data-error></p>
<button class='cta-main' type='submit'>Envoyer ma demande à Horenova ↗</button></form>
<aside class='recruit-aside'><span class='small-title'>INTERMÉDIATION</span><h2>Un contact unique : Horenova.</h2><p>Nous recevons les candidatures et coordonnons les échanges. Aucun candidat ne reçoit directement vos coordonnées. Tout partage de données privées nécessite un accord.</p><a class='soft-btn' href='/talents.html'>Voir les profils anonymes →</a></aside></div>
<section class='listing-page compact'><div class='listing-toolbar'><div><span class='small-title'>MES DEMANDES</span><h2>Suivi de mes recrutements.</h2></div></div><div class='jobs-grid-page' id='liveRecruitJobs'></div>
<div class='listing-toolbar'><div><span class='small-title'>CANDIDATURES</span><h2>Horenova prépare votre sélection.</h2></div></div><div class='recruit-inbox'><article><div><span>HORENOVA RECRUTEMENT</span><h3>Équipe HORENOVA</h3><p>Les conversations sont ouvertes uniquement après validation d’une mise en relation par HORENOVA. Notre équipe conserve la visibilité sur chaque échange.</p><a href='/conversations.html' class='soft-btn'>Mes conversations ↗</a></div></article></div></section>`;
const form=document.getElementById('liveRecruitForm');
const status=document.getElementById('recruitStatus');
async function render(){
 const grid=document.getElementById('liveRecruitJobs');
 if(!grid)return;
 const results=await Promise.allSettled([
  hub('/api/recruiter-requests'),
  queryItems('JobRequests',{limit:50,sort:[{field:'_createdDate',direction:'desc'}]})
 ]);
 const central=results[0].status==='fulfilled'?(results[0].value.items||[]):null;
 const saved=results[1].status==='fulfilled'?(results[1].value.items||[]):[];
 const mine=saved.filter(j=>!auth.member?.id||!j._owner||j._owner===auth.member.id);
 const delivered=new Set((central||[]).map(j=>j.wix_request_id).filter(Boolean));
 const centralCards=(central||[]).map(j=>'<article class="job-card-page"><div class="job-card-content"><small>'+esc(j.kind||'Emploi')+' · '+esc(j.job_role||'')+'</small><h3>'+esc(j.job_title||'Demande')+'</h3><p>'+esc(j.city||'')+' · '+esc(j.business_name||'')+'</p><strong>✓ Reçue par HORENOVA · à examiner</strong></div></article>').join('');
 const legacy=mine.filter(j=>!central||!delivered.has(j._id));
 const legacyCards=legacy.map(j=>'<article class="job-card-page"><div class="job-card-content"><small>'+esc(j.kind||'Emploi')+' · '+esc(j.role||'')+'</small><h3>'+esc(j.title||'Demande')+'</h3><p>'+esc(j.city||'')+' · '+esc(j.businessName||'')+'</p><strong>'+(central?'Enregistrée dans Wix · suivi à synchroniser':'Enregistrée dans Wix · vérification du suivi indisponible')+'</strong>'+(central&&auth.role==='recruiter'?'<p><button type="button" class="soft-btn" data-sync="'+esc(j._id)+'">Synchroniser cette demande</button></p>':'')+'</div></article>').join('');
 const warning=central===null?'<div class="empty-state">La connexion au suivi central est momentanément indisponible. Aucune synchronisation ne peut être confirmée.</div>':'';
 grid.innerHTML=warning+centralCards+legacyCards || '<div class="empty-state"><h3>Aucune demande envoyée.</h3><p>Votre première demande apparaîtra ici.</p></div>';
 grid.querySelectorAll('[data-sync]').forEach(button=>button.addEventListener('click',async()=>{
  const request=legacy.find(j=>j._id===button.dataset.sync);
  if(!request)return;
  button.disabled=true;
  status.className='';
  status.textContent='Synchronisation de votre ancienne demande…';
  try{
   await hub('/api/recruiter-requests',{method:'POST',body:{
    ...request,jobTitle:request.title,wixRequestId:request._id
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
let pendingSync=null;
form.addEventListener('submit',async event=>{
 event.preventDefault();
 if(!form.reportValidity())return;
 const btn=form.querySelector('button[type=submit]');
 const err=form.querySelector('[data-error]');
 btn.disabled=true;err.textContent='';status.className='';
 try{
  if(!pendingSync){
   const data=Object.fromEntries(new FormData(form).entries());
   data.title=String(data.title||'').trim();
   data.businessName=String(data.businessName||'').trim();
   if(data.title.length<4||data.businessName.length<2)throw Error('Le titre doit contenir 4 caractères et l’établissement 2 caractères minimum.');
   data.requestStatus='À examiner';
   status.textContent='Enregistrement de votre demande…';
   const record=await insertItem('JobRequests',data);
   pendingSync={data,id:record._id};
  }
  status.textContent='Transmission au suivi central HORENOVA…';
  await hub('/api/recruiter-requests',{method:'POST',body:{
   ...pendingSync.data,jobTitle:pendingSync.data.title,wixRequestId:pendingSync.id
  }});
  pendingSync=null;
  status.className='recruit-status-ok';
  status.textContent='✓ Demande enregistrée et reçue par HORENOVA. Notre équipe peut désormais la traiter.';
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
