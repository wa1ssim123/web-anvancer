import {requireRole} from '/mihna-global.js';
import {queryItems} from '/js/wix/items.js';
import {hub} from '/hn-api.js';
const auth=await requireRole(['candidate','recruiter','admin'],false);
if(!auth){const {getMemberState}=await import('/js/wix/member-store.js');const member=getMemberState().member;location.replace(member?.id?'/enter.html?mode=signup&finish=1':'/enter.html?mode=signin&returnTo=%2Faccount.html');throw Error('Authentification ou rôle à finaliser');}
const dash=document.getElementById('accountDashboard'),identity=document.getElementById('accountIdentity');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const name=document.createElement('b'),email=document.createElement('span'),badge=document.createElement('em');
name.textContent=auth.member?.displayName||'Compte HORENOVA';email.textContent=auth.member?.loginEmail||'';badge.textContent='COMPTE HORENOVA';
identity.replaceChildren(name,email,badge);
const card=(tag,title,desc,links)=>'<div class="dash-card"><span>'+esc(tag)+'</span><h3>'+esc(title)+'</h3><p>'+esc(desc)+'</p>'+links.map(x=>'<a href="'+esc(x[1])+'">'+esc(x[0])+' ↗</a>').join(' · ')+'</div>';
const section=()=>'<p class="hub-muted">En cas de problème temporaire, actualisez la page. Aucune information personnelle n’est publiée dans l’annuaire.</p>';
if(auth.role==='candidate'){
 document.getElementById('accountTitle').innerHTML='Mon espace candidat.<br><em>Votre progression.</em>';
 let p=null,apps=null;
 try{p=(await queryItems('CandidateProfiles',{filters:[{field:'_owner',op:'eq',value:auth.member.id}],limit:1})).items[0]||null;}catch{}
 try{apps=(await hub('/api/applications')).items||[];}catch{apps=null;}
 document.getElementById('accountSubtitle').textContent=p?'Votre profil privé est enregistré.':'Complétez votre profil pour postuler.';
 dash.innerHTML=card('PROFIL',p?'Profil enregistré':'À compléter',p?(p.jobFamily||'')+' · '+(p.city||''):'Ajoutez identité, langues, vidéo et photo privée.',[['Modifier mon profil','/candidate-setup.html']])
 +card('QUIZ',p?.quizScore!=null?p.quizScore+' %':'À passer','Vérifiez les bases de votre métier.',[['Ouvrir le quiz','/quiz.html?role='+encodeURIComponent(p?.jobFamily||'Serveur')]])
 +card('VIDÉO PRIVÉE',p?.videoFileId?'Enregistrée ✓':'Manquante','Réservée au processus de recrutement autorisé.',[['Gérer mon profil','/candidate-setup.html']])
 +'<div class="dash-card wide"><span>CANDIDATURES · SUIVI CENTRAL</span><h3>'+(apps===null?'Suivi indisponible':apps.length)+'</h3><div class="mini-list">'+(apps===null?'<p>Le serveur des candidatures est momentanément inaccessible. Aucun dossier n’a été effacé.</p>':apps.length?apps.map(a=>'<p><b>'+esc(a.jobTitle||'Candidature')+'</b><span>'+esc(a.status||'En étude')+'</span></p>').join(''):'<p>Aucune candidature enregistrée dans le suivi central.</p>')+'</div><a href="/jobs.html">Voir les offres ↗</a> · <a href="/conversations.html">Mes conversations HORENOVA ↗</a></div>';
}
else if(auth.role==='recruiter'){
 document.getElementById('accountTitle').innerHTML='Espace recruteur.<br><em>Pilotez vos recrutements.</em>';
 const info=await Promise.allSettled([
  queryItems('RecruiterProfiles',{filters:[{field:'_owner',op:'eq',value:auth.member.id}],limit:1}),
  hub('/api/recruiter-requests'),
  hub('/api/applications')
 ]);
 const p=info[0].status==='fulfilled'?info[0].value.items?.[0]||null:null;
 const requests=info[1].status==='fulfilled'?info[1].value.items||[]:null;
 const candidates=info[2].status==='fulfilled'?info[2].value.items||[]:null;
 const pending=requests?.filter(x=>x.status==='A_EXAMINER').length??null;
 const approved=requests?.filter(x=>x.status==='VALIDEE').length??null;
 const declined=requests?.filter(x=>x.status==='REFUSEE').length??null;
 const shifts=requests?.filter(x=>x.kind==='shift').length??null;
 document.body.dataset.accountRole='recruiter';
 document.getElementById('accountSubtitle').textContent=p?
   'Votre espace professionnel · '+(p.businessName||'Établissement')+' · '+(p.city||'Maroc'):
   'Commencez par présenter votre établissement pour diffuser vos besoins en recrutement.';
 const countOrUnavailable=x=>x===null?'Indisponible':String(x);
 dash.innerHTML=
 '<div class="hn-role-welcome"><span>ESPACE PROFESSIONNEL / HORENOVA</span><h3>Recruter, simplement.<br>Avec un vrai suivi.</h3><p>Vous décrivez votre besoin. HORENOVA vérifie l’annonce avant publication et organise les mises en relation avec les candidats consentants.</p><a href="/recruit.html" class="hn-role-primary">+ Déposer une offre ou un shift ↗</a></div>'+
 card('01 · MON ÉTABLISSEMENT',p?.businessName||'À compléter',
   p?(p.businessType||'')+' · '+(p.city||''):'Renseignez votre établissement, sa ville et ses coordonnées professionnelles.',
   [['Gérer mon établissement','/recruiter-setup.html']])+
 card('02 · DEMANDES D’EMPLOI',countOrUnavailable(requests?.filter(x=>x.kind!=='shift').length??null),
   'Annonces soumises à HORENOVA, avec modération avant publication.',
   [['Créer une annonce','/recruit.html'],['Voir mes demandes','/recruit.html#liveRecruitJobs']])+
 card('03 · MISSIONS / SHIFTS',countOrUnavailable(shifts),
   'Précisez la date, les horaires, le métier, le nombre de postes et la rémunération.',
   [['Publier un shift','/recruit.html'],['Voir mes shifts','/recruit.html#liveRecruitJobs']])+
 card('04 · TALENTS AU MAROC','Annuaire national',
   'Découvrez les profils anonymisés par métier et par ville, sans informations privées.',
   [['Explorer les talents','/talents.html']])+
 card('05 · CANDIDATURES',countOrUnavailable(candidates?.length??null),
   'Les dossiers deviennent visibles après validation et affectation par HORENOVA.',
   [['Mes candidatures','/conversations.html']])+
 card('06 · CONVERSATIONS','Espace sécurisé',
   'Chat candidat + recruteur + administrateur, après accord et mise en relation.',
   [['Ouvrir le chat','/conversations.html']])+
 '<div id="recruitment" class="dash-card wide"><span>ÉTAT RÉEL DE MES ANNONCES</span><h3>Votre suivi HORENOVA.</h3>'+
 (requests===null?'<p>Le serveur des demandes est temporairement inaccessible. Aucun statut n’est présumé.</p>':
 '<div class="hn-recruit-stats"><span>En attente <b>'+pending+'</b></span><span>Publiées <b>'+approved+'</b></span><span>Refusées <b>'+declined+'</b></span></div>'+
 (requests.length?requests.slice(0,12).map(r=>'<p class="hn-recruit-record"><b>'+esc(r.job_title||'Demande')+'</b><span>'+esc(r.kind==='shift'?'Shift':'Emploi')+' · '+esc(r.city||'')+'</span><em>'+esc(r.status==='VALIDEE'?'Publiée':r.status==='REFUSEE'?'Refusée':'À examiner')+'</em></p>').join(''):
 '<p>Aucune demande pour le moment. Commencez par publier votre première annonce.</p>'))+
 '<a href="/recruit.html">Gérer toutes mes annonces ↗</a></div>';
}

else{
 document.getElementById('accountTitle').innerHTML='Administration HORENOVA.<br><em>Supervision nationale.</em>';
 document.body.dataset.accountRole='admin';
 const res=await Promise.allSettled([hub('/api/recruiter-requests'),hub('/api/applications')]);
 const reqs=res[0].status==='fulfilled'?res[0].value.items||[]:null;
 const apps=res[1].status==='fulfilled'?res[1].value.items||[]:null;
 const pending=reqs?.filter(x=>x.status==='A_EXAMINER').length??null;
 document.getElementById('accountSubtitle').textContent='Gestion privée · modération · candidatures · mise en relation.';
 dash.innerHTML=
 '<div class="hn-role-welcome"><span>CENTRE DE CONTRÔLE</span><h3>Un seul objectif.<br>Des recrutements sérieux.</h3><p>Validez les offres, coordonnez les candidatures et supervisez les conversations tout en protégeant les données personnelles.</p><a class="hn-role-primary" href="/admin.html">Ouvrir l’administration ↗</a></div>'+
 card('DEMANDES À EXAMINER',pending===null?'Indisponible':String(pending),
   'Vérification des entreprises et des offres avant publication nationale.',[['Modérer les demandes','/admin.html']])+
 card('DOSSIERS CANDIDATS',apps===null?'Indisponible':String(apps.length),
   'Candidatures, statuts et affectations recruteurs.',[['Centre candidatures','/admin.html']])+
 card('CHATS SUPERVISÉS','Administration',
   'Accès encadré aux conversations liées à chaque candidature.',[['Ouvrir les conversations','/conversations.html']])+
 card('ÉTABLISSEMENTS',reqs===null?'Indisponible':String(new Set(reqs.map(x=>x.recruiter_wix_id)).size),
   'Suivi des recruteurs actifs et de leurs demandes.',[['Gérer les recruteurs','/admin.html']])+
 card('SERVICES HORENOVA','Plateforme',
   'Gestion des fonctionnalités commerciales et outils professionnels.',[['Outils business','/business.html']]);
}
