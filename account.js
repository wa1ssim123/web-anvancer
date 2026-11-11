import {requireRole} from '/mihna-global.js';
import {queryItems} from '/js/wix/items.js';
const auth=await requireRole(['candidate','recruiter','admin'],false);
if(!auth){location.replace('/enter.html?mode=signin&returnTo=%2Faccount.html');throw Error('Connexion nécessaire');}
const dash=document.getElementById('accountDashboard'),identity=document.getElementById('accountIdentity');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const name=document.createElement('b'),email=document.createElement('span'),badge=document.createElement('em');
name.textContent=auth.member?.displayName||'Compte HORENOVA';email.textContent=auth.member?.loginEmail||'';badge.textContent='COMPTE HORENOVA';
identity.replaceChildren(name,email,badge);
const card=(tag,title,desc,links)=>'<div class="dash-card"><span>'+esc(tag)+'</span><h3>'+esc(title)+'</h3><p>'+esc(desc)+'</p>'+links.map(x=>'<a href="'+esc(x[1])+'">'+esc(x[0])+' ↗</a>').join(' · ')+'</div>';
const section=()=>'<p class="hub-muted">En cas de problème temporaire, actualisez la page. Aucune information personnelle n’est publiée dans l’annuaire.</p>';
if(auth.role==='candidate'){
 document.getElementById('accountTitle').innerHTML='Mon espace candidat.<br><em>Votre progression.</em>';
 let p=null,apps=[];
 try{p=(await queryItems('CandidateProfiles',{limit:1})).items[0]||null;}catch{}
 try{apps=(await queryItems('Applications',{limit:60})).items||[];}catch{}
 document.getElementById('accountSubtitle').textContent=p?'Votre profil privé est enregistré.':'Complétez votre profil pour postuler.';
 dash.innerHTML=card('PROFIL',p?'Profil enregistré':'À compléter',p?(p.jobFamily||'')+' · '+(p.city||''):'Ajoutez identité, langues, vidéo et photo privée.',[['Modifier mon profil','/candidate-setup.html']])
 +card('QUIZ',p?.quizScore!=null?p.quizScore+' %':'À passer','Vérifiez les bases de votre métier.',[['Ouvrir le quiz','/quiz.html?role='+encodeURIComponent(p?.jobFamily||'Serveur')]])
 +card('VIDÉO PRIVÉE',p?.videoFileId?'Enregistrée ✓':'Manquante','Réservée au processus de recrutement autorisé.',[['Gérer mon profil','/candidate-setup.html']])
 +'<div class="dash-card wide"><span>CANDIDATURES</span><h3>'+apps.length+'</h3><div class="mini-list">'+(apps.length?apps.map(a=>'<p><b>'+esc(a.jobTitle||'Candidature')+'</b><span>'+esc(a.status||'En étude')+'</span></p>').join(''):'<p>Aucune candidature pour le moment.</p>')+'</div><a href="/jobs.html">Voir les offres ↗</a> · <a href="/conversations.html">Mes conversations HORENOVA ↗</a></div>';
}
else if(auth.role==='recruiter'){
 document.getElementById('accountTitle').innerHTML='Espace recruteur.<br><em>Votre équipe commence ici.</em>';
 let p=null,requests=[];
 try{p=(await queryItems('RecruiterProfiles',{limit:1})).items[0]||null;}catch{}
 try{requests=(await queryItems('JobRequests',{limit:70})).items||[];}catch{}
 document.getElementById('accountSubtitle').textContent=p?(p.businessName||'Votre établissement'):'Complétez votre établissement.';
 dash.innerHTML=card('ÉTABLISSEMENT',p?.businessName||'À compléter',p?(p.businessType||'')+' · '+(p.city||''):'Ajoutez vos coordonnées professionnelles.',[['Gérer mon établissement','/recruiter-setup.html']])
 +card('DEMANDES',String(requests.length),'HORENOVA examine vos conditions avant publication.',[['Soumettre une offre','/recruit.html']])
 +card('MISE EN RELATION','HORENOVA intermédiaire','Vos conversations sont ouvertes après validation et accord du candidat.',[['Conversations','/conversations.html'],['Talents anonymisés','/talents.html']]);
}
else{
 document.getElementById('accountTitle').innerHTML='Administration HORENOVA.<br><em>Tout piloter.</em>';
 document.getElementById('accountSubtitle').textContent='Centre de contrôle et de suivi privé.';
 dash.innerHTML=card('CANDIDATURES','Centre de recrutement','Dossiers, photos privées, statuts et validations.',[['Ouvrir le centre','/admin.html']])
 +card('CONVERSATIONS','Intermédiation','Accès administrateur aux échanges de recrutement.',[['Ouvrir les conversations','/conversations.html']])
 +card('BUSINESS','Administration','Outils professionnels réservés.',[['Ouvrir','/business.html']]);
}
