import {requireRole} from '/mihna-global.js';
import {queryItems,insertItem} from '/js/wix/items.js';
import {hub} from '/hn-api.js';
const auth=await requireRole(['candidate']);
if(!auth)throw Error('Connexion requise');
const q=new URLSearchParams(location.search);
const jobId=q.get('id')||'',role=q.get('role')||'Serveur',title=q.get('title')||'Offre HORENOVA';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
document.getElementById('applyJob').innerHTML='<span>'+esc(role)+'</span><h2>'+esc(title)+'</h2><p>Employeur partenaire · HORENOVA</p>';
const box=document.getElementById('applyChecks');
let profile,passed=false,score=0,publicProfile=null;
try{
 profile=(await queryItems('CandidateProfiles',{limit:1})).items[0]||null;
 publicProfile=(await queryItems('CandidatePublicProfiles',{limit:1})).items[0]||null;
 const attempts=(await queryItems('QuizAttempts',{filters:[{field:'jobFamily',op:'eq',value:role}],limit:50})).items;
 const best=attempts.filter(a=>a.passed).sort((a,b)=>(b.score||0)-(a.score||0))[0];
 passed=!!best;score=best?.score||0;
}catch(e){box.textContent='Impossible de vérifier le profil. '+e.message;throw e;}
const ready=!!(profile?.profileComplete&&profile?.videoFileId&&profile?.videoConsent&&passed&&jobId);
const checks=[
 ['Profil complet',!!profile?.profileComplete],
 ['Vidéo de présentation privée',!!profile?.videoFileId&&!!profile?.videoConsent],
 ['Quiz '+role,passed],
 ['Offre réelle sélectionnée',!!jobId]
];
box.innerHTML=checks.map(([name,ok])=>'<div class="check-row '+(ok?'ok':'bad')+'"><b>'+(ok?'✓':'!')+'</b><span>'+esc(name)+'</span><em>'+(ok?'Validé':'À compléter')+'</em></div>').join('');
if(!profile?.profileComplete||!profile?.videoFileId){box.insertAdjacentHTML('beforeend','<a class="cta-main button-link" href="/candidate-setup.html">Compléter mon profil ↗</a>');}
else if(!passed){box.insertAdjacentHTML('beforeend','<a class="cta-main button-link" href="/quiz.html?role='+encodeURIComponent(role)+'&returnTo='+encodeURIComponent(location.pathname+location.search)+'">Passer le quiz ↗</a>');}
else if(!jobId){box.insertAdjacentHTML('beforeend','<p class="form-error">Choisissez une offre depuis la liste des emplois avant de postuler.</p><a href="/jobs.html">Voir les offres →</a>');}
else if(ready){
 const consent=document.createElement('label');consent.style.cssText='display:flex;gap:10px;align-items:flex-start;margin:18px 0;line-height:1.5;font-size:13px';consent.innerHTML='<input type="checkbox" id="applyConsent" required style="margin-top:5px"><span>J’autorise HORENOVA à étudier mon profil, ma photo si fournie et ma candidature, puis à partager ces informations avec un recruteur sélectionné après validation. Je comprends que HORENOVA a accès à la conversation de recrutement.</span>';
 box.appendChild(consent);
 const message=document.createElement('p');message.className='form-error';message.setAttribute('role','alert');box.appendChild(message);
 const button=document.createElement('button');button.className='cta-main';button.type='button';button.textContent='Envoyer ma candidature à HORENOVA ↗';box.appendChild(button);
 button.onclick=async()=>{
  message.textContent='';
  if(!document.getElementById('applyConsent').checked){message.textContent='Votre consentement est nécessaire pour une mise en relation.';return;}
  button.disabled=true;
  let centralCase=null,wixSaved=false,notes=[];
  try{
   try{
    const result=await hub('/api/applications',{method:'POST',body:{jobId,consentToIntro:true}});
    centralCase=result.item;
   }catch(e){notes.push('Messagerie en attente : '+e.message);}
   try{
    const existing=(await queryItems('Applications',{filters:[{field:'jobId',op:'eq',value:jobId}],limit:1})).items;
    if(!existing.length){
      await insertItem('Applications',{jobId,jobTitle:title,businessName:'Employeur partenaire HORENOVA',candidatePublicProfileId:publicProfile?._id||'',quizScore:score,status:'En étude par HORENOVA',recruiterHint:'Mise en relation organisée par HORENOVA'});
    }
    wixSaved=true;
   }catch(e){notes.push('Archivage Wix : '+e.message);}
   if(!centralCase&&!wixSaved)throw Error(notes.join(' · ')||'La candidature n’a pas été enregistrée.');
   box.innerHTML='<div class="success-state"><b>✓</b><h2>Candidature reçue par HORENOVA</h2><p>'+(centralCase?'Votre dossier privé est enregistré dans le centre de recrutement.':'Votre candidature est enregistrée dans Wix. Le chat sécurisé n’est pas encore disponible pour ce dossier.')+'</p>'+(centralCase?'<a href="/conversations.html?id='+encodeURIComponent(centralCase.id)+'">Ouvrir ma conversation ↗</a>':'<a href="/account.html">Retour à mon espace →</a>')+'</div>';
  }catch(e){message.textContent=e.message;button.disabled=false;}
 };
}