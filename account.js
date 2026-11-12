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
 try{p=(await queryItems('CandidateProfiles',{limit:1})).items[0]||null;}catch{}
 try{apps=(await hub('/api/applications')).items||[];}catch{apps=null;}
 document.getElementById('accountSubtitle').textContent=p?'Votre profil privé est enregistré.':'Complétez votre profil pour postuler.';
 dash.innerHTML=card('PROFIL',p?'Profil enregistré':'À compléter',p?(p.jobFamily||'')+' · '+(p.city||''):'Ajoutez identité, langues, vidéo et photo privée.',[['Modifier mon profil','/candidate-setup.html']])
 +card('QUIZ',p?.quizScore!=null?p.quizScore+' %':'À passer','Vérifiez les bases de votre métier.',[['Ouvrir le quiz','/quiz.html?role='+encodeURIComponent(p?.jobFamily||'Serveur')]])
 +card('VIDÉO PRIVÉE',p?.videoFileId?'Enregistrée ✓':'Manquante','Réservée au processus de recrutement autorisé.',[['Gérer mon profil','/candidate-setup.html']])
 +'<div class="dash-card wide"><span>CANDIDATURES · SUIVI CENTRAL</span><h3>'+(apps===null?'Suivi indisponible':apps.length)+'</h3><div class="mini-list">'+(apps===null?'<p>Le serveur des candidatures est momentanément inaccessible. Aucun dossier n’a été effacé.</p>':apps.length?apps.map(a=>'<p><b>'+esc(a.jobTitle||'Candidature')+'</b><span>'+esc(a.status||'En étude')+'</span></p>').join(''):'<p>Aucune candidature enregistrée dans le suivi central.</p>')+'</div><a href="/jobs.html">Voir les offres ↗</a> · <a href="/conversations.html">Mes conversations HORENOVA ↗</a></div>';
}
else if(auth.role==='recruiter'){
 document.getElementById('accountTitle').innerHTML='Espace recruteur.<br><em>Votre équipe commence ici.</em>';
 let p=null,requests=null;
 try{p=(await queryItems('RecruiterProfiles',{limit:1})).items[0]||null;}catch{}
 try{requests=(await hub('/api/recruiter-requests')).items||[];}catch{requests=null;}
 document.getElementById('accountSubtitle').textContent=p?(p.businessName||'Votre établissement'):'Complétez votre établissement.';
 dash.innerHTML=card('ÉTABLISSEMENT',p?.businessName||'À compléter',p?(p.businessType||'')+' · '+(p.city||''):'Ajoutez vos coordonnées professionnelles.',[['Gérer mon établissement','/recruiter-setup.html']])
 +card('DEMANDES',requests===null?'Suivi indisponible':String(requests.length),'Demandes confirmées par le serveur HORENOVA. Les anciens brouillons Wix peuvent être synchronisés depuis le formulaire.',[['Soumettre ou synchroniser','/recruit.html']])
 +card('MISE EN RELATION','HORENOVA intermédiaire','Vos conversations sont ouvertes après validation et accord du candidat.',[['Conversations','/conversations.html'],['Talents anonymisés','/talents.html']]);
}
else{
 document.getElementById('accountTitle').innerHTML='Administration HORENOVA.<br><em>Tout piloter.</em>';
 document.getElementById('accountSubtitle').textContent='Centre de contrôle et de suivi privé.';
 dash.innerHTML=card('CANDIDATURES','Centre de recrutement','Dossiers, photos privées, statuts et validations.',[['Ouvrir le centre','/admin.html']])
 +card('CONVERSATIONS','Intermédiation','Accès administrateur aux échanges de recrutement.',[['Ouvrir les conversations','/conversations.html']])
 +card('BUSINESS','Administration','Outils professionnels réservés.',[['Ouvrir','/business.html']]);
}
