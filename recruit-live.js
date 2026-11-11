import { requireRole } from '/mihna-global.js';
import { queryItems, insertItem } from '/js/wix/items.js';
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
<div class='listing-toolbar'><div><span class='small-title'>CANDIDATURES</span><h2>Horenova prépare votre sélection.</h2></div></div><div class='recruit-inbox'><article><div><span>CONTACT INTERMÉDIAIRE</span><h3>Équipe Horenova</h3><p>Notre équipe prendra contact après examen des profils et validation des échanges.</p></div></article></div></section>`;
const form=document.getElementById('liveRecruitForm');
const status=document.getElementById('recruitStatus');
async function render(){
 const grid=document.getElementById('liveRecruitJobs');
 if(!grid)return;
 try{
  const result=await queryItems('JobRequests',{limit:50,sort:[{field:'_createdDate',direction:'desc'}]});
  const mine=(result.items||[]).filter(j=>!auth.member?.id||j._owner===auth.member.id);
  grid.innerHTML=mine.length?mine.map(j=>`<article class='job-card-page'><div class='job-card-content'><small>${esc(j.kind||'Emploi')} · ${esc(j.role||'')}</small><h3>${esc(j.title||'Demande')}</h3><p>${esc(j.city||'')} · ${esc(j.requestStatus||'À examiner')}</p><strong>En cours de traitement Horenova</strong></div></article>`).join(''):`<div class='empty-state'><h3>Aucune demande envoyée.</h3><p>Votre première demande apparaîtra ici.</p></div>`;
 }catch(err){grid.innerHTML=`<div class='empty-state'><h3>Suivi indisponible</h3><p>Les demandes sont traitées par l’administration Horenova.</p></div>`;}
}
form.addEventListener('submit',async event=>{
 event.preventDefault();
 if(!form.reportValidity())return;
 const btn=form.querySelector('button[type=submit]');
 const err=form.querySelector('[data-error]');
 btn.disabled=true;err.textContent='';status.textContent='Envoi de la demande…';
 try{
  const d=Object.fromEntries(new FormData(form).entries());
  d.requestStatus='À examiner';
  if(auth.demo)throw new Error('La soumission nécessite un compte réel.');
  await insertItem('JobRequests',d);
  status.textContent='✓ Demande reçue par Horenova. Notre équipe examine vos conditions avant publication.';
  form.elements.title.value='';form.elements.description.value='';
  await render();
 }catch(errObj){err.textContent=errObj?.message||String(errObj);status.textContent='';}
 finally{btn.disabled=false;}
});
await render();