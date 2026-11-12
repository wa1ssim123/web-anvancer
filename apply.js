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
 profile=(await queryItems('CandidateProfiles',{filters:[{field:'_owner',op:'eq',value:auth.member.id}],limit:1})).items[0]||null;
 publicProfile=(await queryItems('CandidatePublicProfiles',{filters:[{field:'_owner',op:'eq',value:auth.member.id}],limit:1})).items[0]||null;
 const attempts=(await queryItems('QuizAttempts',{filters:[{field:'jobFamily',op:'eq',value:role},{field:'_owner',op:'eq',value:auth.member.id}],limit:50})).items;
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
  if(!document.getElementById('applyConsent').checked){
    message.textContent='Votre consentement est nécessaire pour une mise en relation.';
    return;
  }
  button.disabled=true;
  button.textContent='Transmission sécurisée…';
  try{
    // The production recruiting database is the source of truth for applications,
    // statuses and the private conversations. Do not claim success for a CMS-only copy.
    const result=await hub('/api/applications',{method:'POST',body:{jobId,consentToIntro:true}});
    const centralCase=result?.item;
    if(!centralCase?.id)throw Error('Le serveur n’a pas confirmé l’identifiant de la candidature.');
    try{
      const existing=(await queryItems('Applications',{filters:[{field:'jobId',op:'eq',value:jobId},{field:'_owner',op:'eq',value:auth.member.id}],limit:1})).items;
      if(!existing.length)await insertItem('Applications',{
        jobId,jobTitle:title,businessName:'Employeur partenaire HORENOVA',
        candidatePublicProfileId:publicProfile?._id||'',quizScore:score,
        status:'En étude par HORENOVA',
        recruiterHint:'Mise en relation organisée par HORENOVA'
      });
    }catch(error){
      // The primary case is already saved. A legacy Wix mirror outage must not
      // create a second application or conceal a successful central submission.
      console.warn('HORENOVA: copie CMS indisponible, dossier central conservé.');
    }
    box.innerHTML='<div class="success-state"><b>✓</b><h2>Candidature reçue par HORENOVA</h2><p>Votre dossier est enregistré dans le suivi central sécurisé. Vous pourrez le consulter depuis votre espace.</p><a href="/conversations.html?id='+encodeURIComponent(centralCase.id)+'">Ouvrir mon suivi ↗</a></div>';
  }catch(error){
    message.textContent=error?.message||'La candidature n’a pas été confirmée par HORENOVA. Réessayez sans créer de deuxième dossier.';
    button.disabled=false;
    button.textContent='Envoyer ma candidature à HORENOVA ↗';
  }
 };
}
