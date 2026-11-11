import { requireRole } from '/mihna-global.js';
import { queryItems } from '/js/wix/items.js';
const auth=await requireRole(['admin'],false);
const gate=document.getElementById('adminGate');
const cms='https://manage.wix.com/dashboard/7d0d5cbc-d6b5-483c-adcf-eda65565ae2e/wix-cms';
if(!auth){
 gate.innerHTML=`<div class='admin-denied'><b>🔒</b><h2>Accès administrateur uniquement.</h2><p>L’administration n’est pas ouverte aux visiteurs.</p><a class='cta-main button-link' href='/login.html'>Se connecter</a></div>`;
}else{
 let jobs=0,talents=0;
 try{jobs=(await queryItems('Jobs',{limit:100})).items.length;}catch{}
 try{talents=(await queryItems('CandidatePublicProfiles',{limit:100})).items.length;}catch{}
 gate.innerHTML=`
 <a class='admin-stat accent' href='${cms}' target='_blank' rel='noopener'><span>01 · DEMANDES EMPLOYEURS</span><b>À EXAMINER</b><p>Ouvrir JobRequests dans le CMS. Vérifier établissement, contact, rémunération et conditions puis négocier avant publication.</p></a>
 <a class='admin-stat accent' href='${cms}' target='_blank' rel='noopener'><span>02 · CANDIDATURES PRIVÉES</span><b>À TRAITER</b><p>Ouvrir Applications dans le CMS, rapprocher chaque dossier du profil CandidateProfiles et de l’offre Jobs.</p></a>
 <a class='admin-stat' href='${cms}' target='_blank' rel='noopener'><span>03 · OFFRES PUBLIQUES</span><b>${jobs}</b><p>Après validation, créer une offre Jobs sans identité ni coordonnées de l’établissement. Seul le CMS admin publie.</p></a>
 <a class='admin-stat' href='${cms}' target='_blank' rel='noopener'><span>04 · PROFILS ANONYMES</span><b>${talents}</b><p>L’identité des candidats et leurs vidéos privées restent dans CandidateProfiles, hors de l’annuaire public.</p></a>
 <a class='admin-stat' href='${cms}' target='_blank' rel='noopener'><span>05 · SUIVI ET NÉGOCIATION</span><b>HORENOVA</b><p>Suivre requestStatus dans JobRequests et status dans Applications. Mettre les parties en relation avec leur accord.</p></a>
 <a class='admin-stat' href='${cms}' target='_blank' rel='noopener'><span>06 · DOSSIERS CONFIDENTIELS</span><b>↗</b><p>Les collections RecruiterProfiles, CandidateProfiles et Applications ne sont pas publiques. Utiliser le CMS Wix administrateur.</p></a>
 <a class='admin-stat' href='/shop.html'><span>SHOP</span><b>↗</b><p>Gérer la boutique professionnelle Horenova.</p></a>
 <a class='admin-stat' href='/business.html'><span>BUSINESS</span><b>↗</b><p>Outils métiers Horenova.</p></a>`;
}