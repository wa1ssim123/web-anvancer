import {requireRole} from '/mihna-global.js';
import {queryItems,insertItem,getItemById} from '/js/wix/items.js';
import {hub,hubPhoto,hubUploadPhoto} from '/hn-api.js?v=professional-20261119-r1';
const auth=await requireRole(['candidate']);
if(!auth)throw Error('Espace candidat uniquement');
const q=new URLSearchParams(location.search);
const jobId=q.get('id')||'';
let role=q.get('role')||'Serveur',title=q.get('title')||'Offre HORENOVA',verifiedJob=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const box=document.getElementById('applyChecks'),job=document.getElementById('applyJob');
if(jobId){
 try{
  const publicResponse=await hub('/api/jobs/public');
  const match=(publicResponse.items||[]).find(item=>String(item.id)===jobId);
  if(match){role=String(match.role||role);title=String(match.title||title);verifiedJob=true;}
 }catch(error){console.warn('Central job verification deferred',error?.message||'network');}
 if(!verifiedJob){
  try{
   const legacy=await getItemById('Jobs',jobId);
   if(legacy?.active===true){role=String(legacy.role||role);title=String(legacy.title||title);verifiedJob=true;}
  }catch(error){console.warn('Published Wix job verification deferred',error?.message||'network');}
 }
}
job.innerHTML='<span>OFFRE À LAQUELLE VOUS POSTULEZ</span><h2>'+esc(title)+'</h2><p>'+esc(role)+' · '+(verifiedJob?'Annonce active et vérifiée':'Annonce non confirmée · retournez aux offres publiées')+'</p>';

let profile=null,publicProfile=null,passed=false,score=0,hasPhoto=false;
const errors=[];
try{
 const data=await Promise.all([
  queryItems('CandidateProfiles',{filters:[{field:'_owner',op:'eq',value:auth.member.id}],limit:1}),
  queryItems('CandidatePublicProfiles',{filters:[{field:'_owner',op:'eq',value:auth.member.id}],limit:1}),
  queryItems('QuizAttempts',{filters:[{field:'_owner',op:'eq',value:auth.member.id},{field:'jobFamily',op:'eq',value:role}],limit:50})
 ]);
 profile=data[0].items?.[0]||null;
 publicProfile=data[1].items?.[0]||null;
 const best=(data[2].items||[]).filter(x=>x.passed).sort((a,b)=>(b.score||0)-(a.score||0))[0];
 passed=!!best;score=best?.score||0;
}catch(error){
 box.innerHTML='<p role="alert" class="hn-app-error">Impossible de charger le profil ou le quiz. Vérifiez votre connexion et réessayez.</p>';
 throw error;
}
try{const photo=await hub('/api/profile/photo/status');hasPhoto=!!photo.hasPhoto;}catch{hasPhoto=false;}
const portrait=document.getElementById('applyPortrait');
if(hasPhoto){
 try{const url=await hubPhoto('/api/profile/photo');if(url){portrait.src=url;portrait.hidden=false;document.getElementById('applyPortraitEmpty').hidden=true;}}catch{}
}
const name=[profile?.firstName,profile?.lastName].filter(Boolean).join(' ').trim();
document.getElementById('applyCandidateName').textContent=name||'Votre profil professionnel';
document.getElementById('applyCandidateMeta').textContent=[
 profile?.jobFamily||role,profile?.city||'',profile?.age?profile.age+' ans':''
].filter(Boolean).join(' · ')+' · Photo et coordonnées privées';
const ready=!!(profile?.profileComplete&&profile?.videoFileId&&profile?.videoConsent&&passed&&jobId&&verifiedJob);
const checks=[
 ['Profil candidat complet',!!profile?.profileComplete],
 ['Présentation vidéo privée',!!profile?.videoFileId&&!!profile?.videoConsent],
 ['Quiz métier '+role,passed],
 ['Offre active et vérifiée',!!jobId&&verifiedJob]
];
const checksHTML='<div class="hn-app-steps"><b>01 · PROFIL</b><b>02 · COMPÉTENCES</b><b>03 · PHOTO</b><b>04 · ENVOI</b></div>'+
'<h3>Votre dossier est-il prêt ?</h3>'+
checks.map(([label,ok])=>'<div class="hn-app-check '+(ok?'':'is-bad')+'"><span>'+(ok?'✓':'!')+' '+esc(label)+'</span><strong>'+(ok?'VALIDÉ':'À COMPLÉTER')+'</strong></div>').join('')+
(!profile?.profileComplete||!profile?.videoFileId?
 '<p><a href="/candidate-setup.html" class="hn-role-primary">Compléter mon profil et ma vidéo ↗</a></p>':
 !passed?'<p><a href="/quiz.html?role='+encodeURIComponent(role)+'&returnTo='+encodeURIComponent(location.pathname+location.search)+'" class="hn-role-primary">Passer mon quiz métier ↗</a></p>':
 !jobId||!verifiedJob?'<p><a href="/jobs.html" class="hn-role-primary">Choisir une offre publiée ↗</a></p>':'');
const skillChoices=[
 'Accueil & service client','Service en salle','Hygiène & sécurité','Travail en équipe',
 'Barista & café','Cuisine & préparation','Mise en place','Caisse / POS',
 'Langues étrangères','Gestion des stocks','Organisation d’événements','Leadership'
];
const skillsHTML=skillChoices.map((label,i)=>'<label><input type="checkbox" name="skill" value="'+esc(label)+'" id="skill-'+i+'"><span>'+esc(label)+'</span></label>').join('');
box.innerHTML=checksHTML+
'<form id="applyDossierForm" class="hn-application-dossier">'+
'<h3>01 · Mon expérience et mes compétences</h3>'+
'<div class="hn-app-grid">'+
'<label>Années d’expérience *<input name="experienceYears" type="number" min="0" max="60" step="0.5" placeholder="Ex. 2" required></label>'+
'<label>Dernier poste occupé<input name="lastPosition" maxlength="90" placeholder="Ex. Serveur en restaurant"></label>'+
'<label class="wide">Mes compétences *<div class="hn-app-chips" id="applicationSkills">'+skillsHTML+'</div></label>'+
'<label>Ville de travail recherchée *<input name="desiredCity" maxlength="80" value="'+esc(profile?.city||'')+'" placeholder="Ville au Maroc" required></label>'+
'<label>Type de contrat recherché<select name="contractPreference"><option>CDI</option><option>CDD</option><option>Shift / mission</option><option>Temps partiel</option><option>Stage</option><option>Flexible</option></select></label>'+
'</div>'+
'<h3>02 · Mes disponibilités</h3><div class="hn-app-grid">'+
'<label>Quand êtes-vous disponible ? *<select name="availability" required><option value="">Sélectionnez</option><option>Immédiatement</option><option>Sous 7 jours</option><option>Sous 15 jours</option><option>Sous un mois</option><option>À convenir</option></select></label>'+
'<label>Date possible de début<input type="date" name="earliestStart"></label>'+
'</div>'+
'<h3>03 · Mes coordonnées privées et ma photo</h3><div class="hn-app-grid">'+
'<label class="wide">Téléphone personnel *<input name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="25" placeholder="+212 6 XX XX XX XX" required><small>Visible uniquement par HORENOVA, jamais sur le profil public.</small></label>'+
'<label class="wide"><span>Photo de présentation '+(hasPhoto?'(déjà enregistrée)':'*')+'</span>'+
'<div class="hn-app-photo-upload"><input type="file" name="candidatePhoto" id="applyPhotoFile" accept="image/*" '+(hasPhoto?'':'required')+'><small id="applyPhotoStatus">'+(hasPhoto?'✓ Photo sécurisée déjà enregistrée. Vous pouvez la remplacer.':'Ajoutez un portrait professionnel clair, sans filtre excessif. Maximum 8 Mo.')+'</small></div></label>'+
'</div>'+
'<h3>04 · Ma motivation pour ce poste</h3><div class="hn-app-grid">'+
'<label class="wide">Expliquez votre candidature en quelques phrases *<textarea name="motivation" rows="5" minlength="35" maxlength="900" placeholder="Pourquoi ce poste vous intéresse ? Quelle expérience et quelles qualités pouvez-vous apporter ?" required></textarea></label>'+
'</div>'+
'<label class="hn-app-consent"><input type="checkbox" name="consentToIntro" required><span>Je consens à l’étude de cette candidature par HORENOVA et au partage de mon dossier professionnel avec un recruteur sélectionné après validation. Ma photo reste privée et mes coordonnées ne sont pas publiées. Les administrateurs HORENOVA peuvent superviser la conversation de recrutement.</span></label>'+
'<p class="hn-app-error" id="applyDossierError" role="alert"></p>'+
'<button type="submit" class="hn-app-submit" id="applySubmit" '+(ready?'':'disabled')+'>Envoyer mon dossier professionnel à HORENOVA ↗</button>'+
(!ready?'<p class="hn-app-error">Terminez d’abord votre profil et le quiz pour activer l’envoi.</p>':'')+
'</form>';
const form=document.getElementById('applyDossierForm');
const photoInput=document.getElementById('applyPhotoFile');
photoInput.onchange=()=>{
 const file=photoInput.files?.[0];
 if(!file)return;
 const status=document.getElementById('applyPhotoStatus');
 if(file.size>8*1024*1024){status.textContent='Photo trop volumineuse (maximum 8 Mo).';photoInput.value='';return;}
 if(!file.type.startsWith('image/')){status.textContent='Choisissez une image valide.';photoInput.value='';return;}
 const local=URL.createObjectURL(file);
 portrait.src=local;portrait.hidden=false;
 document.getElementById('applyPortraitEmpty').hidden=true;
 status.textContent='Aperçu prêt · '+(file.size/1024/1024).toFixed(1)+' Mo';
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
 const errorBox=document.getElementById('applyDossierError'),button=document.getElementById('applySubmit');
 errorBox.textContent='';
 if(!ready){errorBox.textContent='Vérifiez votre profil, la vidéo, le quiz exact du métier et la publication réelle de l’offre.';return;}
 if(!form.reportValidity())return;
 const skills=[...form.querySelectorAll('input[name="skill"]:checked')].map(x=>x.value);
 if(!skills.length){errorBox.textContent='Choisissez au moins une compétence.';return;}
 const file=photoInput.files?.[0];
 if(!file&&!hasPhoto){errorBox.textContent='Ajoutez une photo de profil.';return;}
 button.disabled=true;button.textContent='Envoi sécurisé en cours…';
 try{
  if(file){
   button.textContent='Optimisation de votre photo…';
   await hubUploadPhoto(await optimizedPortrait(file));
   hasPhoto=true;
  }
  const fd=new FormData(form);
  const application={
    experienceYears:Number(fd.get('experienceYears')),
    lastPosition:String(fd.get('lastPosition')||'').trim(),
    desiredCity:String(fd.get('desiredCity')||'').trim(),
    contractPreference:String(fd.get('contractPreference')||''),
    availability:String(fd.get('availability')||''),
    earliestStart:String(fd.get('earliestStart')||''),
    phone:String(fd.get('phone')||'').trim(),
    skills,
    motivation:String(fd.get('motivation')||'').trim()
  };
  button.textContent='Transmission de votre dossier…';
  // The central protected database is the source of truth.
  const result=await hub('/api/applications',{method:'POST',body:{
    jobId,consentToIntro:true,application
  }});
  const centralCase=result?.item;
  if(!centralCase?.id)throw Error('Le suivi central n’a pas confirmé le numéro de votre candidature.');
  try{
   const existing=(await queryItems('Applications',{filters:[
    {field:'jobId',op:'eq',value:jobId},
    {field:'_owner',op:'eq',value:auth.member.id}
   ],limit:1})).items||[];
   if(!existing.length)await insertItem('Applications',{
    jobId,jobTitle:title,businessName:'Partenaire HORENOVA',
    candidatePublicProfileId:publicProfile?._id||'',quizScore:score,
    status:'En étude par HORENOVA',recruiterHint:'Mise en relation supervisée par HORENOVA'
   });
  }catch{console.warn('Copie CMS facultative indisponible, candidature principale conservée.');}
  box.innerHTML='<div class="success-state"><b>✓</b><h2>Dossier reçu, '+esc(profile?.firstName||'')+' !</h2><p>Votre candidature professionnelle, votre photo privée et vos compétences sont enregistrées pour étude par HORENOVA.</p><a class="hn-role-primary" href="/conversations.html?id='+encodeURIComponent(centralCase.id)+'">Consulter mon suivi ↗</a></div>';
 }catch(error){
  errorBox.textContent=error?.message||'Votre dossier n’a pas pu être transmis. Veuillez réessayer.';
  button.disabled=false;button.textContent='Envoyer mon dossier professionnel à HORENOVA ↗';
 }
});
