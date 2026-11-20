/* HORENOVA — simplified application flow, single form, no quiz or video gate. */
import {requireRole} from '/mihna-global.js';
import {queryItems} from '/js/wix/items.js';
import {hub,hubPhoto,hubUploadPhoto} from '/hn-api.js?v=candidate-easy-20261120-r1';
const auth=await requireRole(['candidate']);
if(!auth)throw Error('Espace candidat uniquement');
const q=new URLSearchParams(location.search);
const jobId=q.get('id')||'';
let role=q.get('role')||'Serveur',title=q.get('title')||'Offre HORENOVA',verifiedJob=false;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const box=document.getElementById('applyChecks'),job=document.getElementById('applyJob');
const portrait=document.getElementById('applyPortrait');
let profile=null,hasPhoto=false;
if(jobId){
 try{
  const published=await hub('/api/jobs/public');
  const match=(published.items||[]).find(x=>String(x.id)===jobId);
  if(match){role=String(match.role||role);title=String(match.title||title);verifiedJob=true;}
 }catch(error){console.warn('Public job lookup unavailable; server will verify at submission',error?.message||'network');}
 if(!verifiedJob){
  try{
   const {getItemById}=await import('/js/wix/items.js');
   const legacy=await getItemById('Jobs',jobId);
   if(legacy?.active===true){role=String(legacy.role||role);title=String(legacy.title||title);verifiedJob=true;}
  }catch{}
 }
}
job.innerHTML='<span>OFFRE SÉLECTIONNÉE</span><h2>'+esc(title)+'</h2><p>'+esc(role)+(verifiedJob?' · Annonce publiée':' · Vérification de l’annonce lors de l’envoi')+'</p>';
try{
 const response=await queryItems('CandidateProfiles',{filters:[{field:'_owner',op:'eq',value:auth.member.id}],limit:1});
 profile=response.items?.[0]||null;
}catch(error){console.warn('Optional profile prefilling failed',error?.message||'network');}
let previousApplication=null;
try{
 // Use only the signed-in candidate's own applications. No public exposure,
 // and no need to ask for the same phone, city or experience on every offer.
 const r=await hub('/api/applications');
 previousApplication=r.items?.[0]?.profile||null;
}catch(error){console.warn('Optional prior application prefill unavailable',error?.message||'network');}
const previousDetails=previousApplication?.application||{};
try{const r=await hub('/api/profile/photo/status');hasPhoto=!!r.hasPhoto;}catch{}
if(hasPhoto){
 try{
  const url=await hubPhoto('/api/profile/photo');
  if(url){portrait.src=url;portrait.hidden=false;document.getElementById('applyPortraitEmpty').hidden=true;}
 }catch{}
}
const member=auth.member||{};
const contact=member.contact||{};
const firstName=profile?.firstName||previousApplication?.firstName||contact.firstName||'';
const lastName=profile?.lastName||previousApplication?.lastName||contact.lastName||'';
const savedCity=profile?.city||previousDetails.desiredCity||previousApplication?.city||'';
const savedPhone=previousDetails.phone||'';
document.getElementById('applyCandidateName').textContent=[firstName,lastName].filter(Boolean).join(' ')||'Votre dossier, simplement.';
document.getElementById('applyCandidateMeta').textContent='Informations et photo privées · HORENOVA';
const fields=[
 ['Accueil & service client','Accueil & service client'],
 ['Service en salle','Service en salle'],
 ['Hygiène & sécurité','Hygiène & sécurité'],
 ['Travail en équipe','Travail en équipe'],
 ['Barista & café','Barista & café'],
 ['Cuisine & préparation','Cuisine & préparation']
];
box.innerHTML=!jobId?
 '<div class="hn-easy-empty"><h2>Choisissez une annonce</h2><p>Ouvrez une offre pour envoyer votre candidature.</p><a href="/jobs.html">Voir les offres ↗</a></div>':
 '<div class="hn-easy-intro"><span>UNE SEULE CANDIDATURE · 3 ÉTAPES</span><h2>Postuler en quelques minutes.</h2><p>Pas de quiz, pas de vidéo obligatoire. Vos informations et une photo suffisent.</p></div>'+
 '<div class="hn-easy-steps"><span><b>1</b> Coordonnées</span><span><b>2</b> Photo</span><span><b>3</b> Envoyer</span></div>'+
 '<form id="applyDossierForm" class="hn-application-dossier hn-easy-form">'+
 '<section class="hn-easy-section"><h3>01 · Vos coordonnées</h3><p>Ces informations restent confidentielles.</p><div class="hn-app-grid">'+
 '<label>Prénom *<input name="firstName" autocomplete="given-name" maxlength="80" minlength="2" required value="'+esc(firstName)+'" placeholder="Votre prénom"></label>'+
 '<label>Nom *<input name="lastName" autocomplete="family-name" maxlength="80" minlength="2" required value="'+esc(lastName)+'" placeholder="Votre nom"></label>'+
 '<label>Ville *<input name="desiredCity" autocomplete="address-level2" maxlength="80" minlength="2" required value="'+esc(savedCity)+'" placeholder="Ex. Casablanca"></label>'+
 '<label>Téléphone *<input name="phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="25" required value="'+esc(savedPhone)+'" placeholder="+212 6 XX XX XX XX"></label>'+
 '</div></section>'+
 '<section class="hn-easy-section"><h3>02 · Votre photo</h3><p>Ajoutez une photo claire. Elle reste privée et accessible uniquement à HORENOVA et aux recruteurs autorisés.</p>'+
 '<div class="hn-app-photo-upload"><input type="file" name="candidatePhoto" id="applyPhotoFile" accept="image/*" '+(hasPhoto?'':'required')+'>'+
 '<small id="applyPhotoStatus">'+(hasPhoto?'Photo déjà enregistrée ✓ Vous pouvez la remplacer.':'Choisir une photo · JPEG, PNG ou HEIC selon votre appareil · 8 Mo maximum')+'</small></div></section>'+
 '<details class="hn-easy-more"><summary>Ajouter de l’expérience ou une motivation (facultatif)</summary>'+
 '<div class="hn-app-grid"><label>Années d’expérience<input name="experienceYears" type="number" min="0" max="60" step="0.5" placeholder="Ex. 2"></label>'+
 '<label>Dernier poste occupé<input name="lastPosition" maxlength="90" placeholder="Ex. Serveur"></label>'+
 '<label>Disponibilité<select name="availability"><option value="">À préciser plus tard</option><option>Immédiatement</option><option>Sous 7 jours</option><option>Sous 15 jours</option><option>Sous un mois</option><option>À convenir</option></select></label>'+
 '<label>Type de contrat<select name="contractPreference"><option value="">Flexible</option><option>CDI</option><option>CDD</option><option>Shift / mission</option><option>Temps partiel</option></select></label>'+
 '<label class="wide">Compétences<div class="hn-app-chips">'+fields.map(([value,label])=>'<label><input type="checkbox" name="skill" value="'+esc(value)+'"><span>'+esc(label)+'</span></label>').join('')+'</div></label>'+
 '<label class="wide">Ma motivation<textarea name="motivation" maxlength="900" rows="3" placeholder="Quelques mots pour présenter votre candidature (facultatif)"></textarea></label></div></details>'+
 '<label class="hn-app-consent"><input type="checkbox" name="consentToIntro" required><span>J’accepte que HORENOVA étudie ma candidature et partage mon dossier avec un recruteur autorisé. Mes coordonnées et ma photo ne sont jamais publiées.</span></label>'+
 '<p class="hn-app-error" id="applyDossierError" role="alert"></p>'+
 '<button type="submit" class="hn-app-submit" id="applySubmit">Envoyer ma candidature ↗</button>'+
 '<p class="hn-easy-secure">✓ Photo confidentielle · ✓ Aucun quiz requis · ✓ Aucun enregistrement vidéo requis</p></form>';
const form=document.getElementById('applyDossierForm');
// Pre-fill optional details from a previous application, never change the
// consent checkbox or upload a photo without this candidate's interaction.
if(form&&previousDetails){
 for(const name of ['experienceYears','lastPosition','availability','contractPreference','motivation']){
  const input=form.elements.namedItem(name);
  const value=previousDetails[name];
  if(input&&value!==null&&value!==undefined&&String(value)!=='')input.value=String(value);
 }
 const skills=Array.isArray(previousDetails.skills)?previousDetails.skills:[];
 form.querySelectorAll('input[name="skill"]').forEach(input=>{input.checked=skills.includes(input.value)});
}
let localPreviewUrl='';
if(form){
 const photoInput=document.getElementById('applyPhotoFile');
 photoInput.onchange=()=>{
  const file=photoInput.files?.[0];
  if(!file)return;
  const status=document.getElementById('applyPhotoStatus');
  if(file.size>8*1024*1024){status.textContent='Photo trop volumineuse : maximum 8 Mo.';photoInput.value='';return;}
  if(!file.type.startsWith('image/')){status.textContent='Choisissez une photo valide.';photoInput.value='';return;}
  if(localPreviewUrl)URL.revokeObjectURL(localPreviewUrl);
  localPreviewUrl=URL.createObjectURL(file);
  portrait.src=localPreviewUrl;portrait.hidden=false;
  document.getElementById('applyPortraitEmpty').hidden=true;
  status.textContent='Photo sélectionnée ✓';
 };
 async function optimizedPortrait(file){
 if(file.size>8*1024*1024)throw Error('Photo trop volumineuse : maximum 8 Mo.');
 let source=null,objectUrl='';
 try{
   if(typeof createImageBitmap==='function'){
     try{source=await createImageBitmap(file);}catch{}
   }
   if(!source){
     objectUrl=URL.createObjectURL(file);
     source=await new Promise((resolve,reject)=>{
       const image=new Image();
       image.onload=()=>resolve(image);
       image.onerror=()=>reject(new Error('Photo non prise en charge. Choisissez un JPEG ou PNG.'));
       image.src=objectUrl;
     });
   }
   const canvas=document.createElement('canvas');canvas.width=500;canvas.height=500;
   const width=source.width||source.naturalWidth,height=source.height||source.naturalHeight;
   if(!width||!height)throw new Error('Dimensions de photo invalides.');
   const side=Math.min(width,height);
   canvas.getContext('2d').drawImage(source,(width-side)/2,(height-side)/2,side,side,0,0,500,500);
   let blob,quality=.8;
   do{blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));quality-=.12;}
   while(blob?.size>430000&&quality>=.3);
   if(!blob||blob.size>450000)throw new Error('Impossible de réduire la photo. Choisissez une autre image.');
   return blob;
 }finally{
   if(source&&typeof source.close==='function')source.close();
   if(objectUrl)URL.revokeObjectURL(objectUrl);
 }
}

 form.addEventListener('submit',async event=>{
  event.preventDefault();
  const err=document.getElementById('applyDossierError'),button=document.getElementById('applySubmit');
  err.textContent='';
  if(!form.reportValidity())return;
  const file=photoInput.files?.[0];
  if(!hasPhoto&&!file){err.textContent='Choisissez une photo pour continuer.';return;}
  const fd=new FormData(form);
  const phone=String(fd.get('phone')||'').trim();
  if(!/^\+?[0-9\s().-]{8,25}$/.test(phone)){err.textContent='Indiquez un téléphone valide.';return;}
  const application={
   firstName:String(fd.get('firstName')||'').trim(),
   lastName:String(fd.get('lastName')||'').trim(),
   desiredCity:String(fd.get('desiredCity')||'').trim(),
   phone,
   experienceYears:String(fd.get('experienceYears')||''),
   lastPosition:String(fd.get('lastPosition')||'').trim(),
   availability:String(fd.get('availability')||''),
   contractPreference:String(fd.get('contractPreference')||''),
   skills:[...form.querySelectorAll('input[name="skill"]:checked')].map(x=>x.value),
   motivation:String(fd.get('motivation')||'').trim()
  };
  button.disabled=true;button.textContent='Envoi en cours…';
  try{
   if(file){button.textContent='Enregistrement de la photo…';await hubUploadPhoto(await optimizedPortrait(file));hasPhoto=true;}
   button.textContent='Enregistrement de votre candidature…';
   const result=await hub('/api/applications',{method:'POST',body:{jobId,consentToIntro:true,application}});
   const caseId=result?.item?.id;
   if(!caseId)throw Error('HORENOVA n’a pas confirmé l’enregistrement du dossier.');
   box.innerHTML='<div class="hn-easy-success" role="status"><b>✓</b><h2>'+(result.alreadyApplied?'Candidature déjà enregistrée !':'Votre candidature est envoyée !')+'</h2>'+
     '<p>Votre dossier a bien été reçu par HORENOVA. Vous pouvez suivre son traitement depuis votre espace.</p>'+
     '<a class="hn-role-primary" href="/account.html">Accéder à mon espace ↗</a></div>';
  }catch(e){
   err.textContent=e?.message||'Impossible d’envoyer votre candidature. Réessayez.';
   button.disabled=false;button.textContent='Envoyer ma candidature ↗';
  }
 });
}