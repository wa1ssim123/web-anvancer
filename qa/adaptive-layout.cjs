'use strict';
/* Isolated responsive CSS geometry and legibility fixtures for authenticated dashboards.
 * No production user account or real candidate data is required. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const stylesheet={
 admin:['styles.css','horenova-v12.css','hn-hub.css','support.css','horenova-adaptive-v1.css'],
 account:['styles.css','horenova-ux-repair-20261120.css','horenova-v12.css','horenova-adaptive-v1.css'],
 recruit:['styles.css','horenova-ux-repair-20261120.css','horenova-v12.css','horenova-adaptive-v1.css'],
 support:['support.css','horenova-adaptive-v1.css']
};
const adminHtml=`
<section class="hn12-hero"><div class="hn12-hero-copy"><h1>Tout voir.<br><em>Tout contrôler.</em></h1><p>Suivi national de toutes les annonces et profils.</p></div></section>
<section class="hn12-section hn12-paper"><div class="hn12-section-head"><div><h2>Piloter Horenova.</h2></div><p>Traitez les demandes, candidatures et mises en relation.</p></div>
<nav class="hn-admin-mobile-tabs"><a href="#adminSupportInbox">Support</a><a href="#hnAdminPublication">Publications</a></nav>
<div class="admin-grid" id="adminGate"><div class="hub-root">
<section class="hn-support-admin-inbox" id="adminSupportInbox"><div class="hn-support-admin-header">
<div><span>SUPPORT NATIONAL</span><h2>Messages & problèmes des membres</h2><p>Questions de candidats et recruteurs.</p></div>
<div><a class="hn-support-admin-cta" href="#t">Ouvrir support</a><a class="hn-support-admin-tel" href="tel:+212648377009">0648377009</a></div></div>
<div class="hn-support-admin-metrics"><span><strong>4</strong>Messages non lus</span><span><strong>2</strong>Demandes ouvertes</span></div>
<div class="hn-support-admin-latest"><a href="#thread"><strong>Compte bloqué</strong><small>Utilisateur · Candidature</small><b>Répondre</b></a></div>
</section>
<section class="hn-admin-publication" id="hnAdminPublication">
<div class="hn-admin-publication-head"><div><span>HORENOVA · SUPERVISION NATIONALE</span><h2>Publication & visibilité.</h2><p>Contrôle des emplois et talents.</p></div><button>Vérifier en ligne</button></div>
<div class="hn-admin-publication-stats">${new Array(6).fill(0).map((_,i)=>'<article class="hn-pub-stat"><span>Statistique '+(i+1)+'</span><strong>4</strong><small>Vérification en cours</small></article>').join('')}</div>
<div class="hn-pub-filter-toolbar"><button aria-pressed="true">Toutes</button><button>En ligne</button><button>En attente</button><button>Refusées</button></div>
<div class="hn-pub-list-head"><h3>Offres & shifts</h3><p>Liste mise à jour.</p></div>
${new Array(4).fill(0).map((_,i)=>'<article class="hn-pub-row"><div class="hn-pub-row-copy"><strong>Serveur '+(i+1)+'</strong><span>Serveur · Casablanca</span><small>Restaurant professionnel · Photo fournie</small><p>Quartier Casablanca, Maroc</p></div><div class="hn-pub-row-actions"><b>EN LIGNE</b><button>Voir la photo</button><a href="#offre">Voir annonce</a></div></article>').join('')}
</section>
<div class="hub-head"><h2>Candidatures & recrutement</h2><p class="hub-muted">Dossiers à examiner.</p></div>
<div class="hub-layout"><section class="hub-panel"><div class="hub-panel-head"><h3>Candidatures</h3></div><div class="hub-stack"><div class="hub-detail hub-muted">Aucune candidature.</div></div></section>
<section class="hub-panel" id="hubDetail"><div class="hub-detail hub-muted">Choisissez un dossier.</div></section></div>
</div></div></section>`;
const accountHtml=`<section class="hn12-hero"><div class="hn12-hero-copy"><h1>Votre talent.<br>Votre avenir.</h1></div></section>
<section class="hn12-section hn12-paper"><div class="hn12-section-head"><h2>Mon espace candidat.</h2></div>
<div id="accountDashboard" class="account-dashboard-live">
<div class="hn-role-welcome"><h3>Préparez votre avenir.</h3><p>Un dossier prêt pour postuler.</p></div>
<div class="hn-candidate-progress"><h3>Progression · 3/4</h3><p>Étapes du profil.</p></div>
${new Array(5).fill(0).map((_,i)=>'<article class="dash-card"><span>HORENOVA</span><h3>Étape '+(i+1)+'</h3><p>Suivez votre progression.</p><a href="#">Continuer</a></article>').join('')}</div></section>`;
const recruiterHtml=`<section class="hn12-hero"><div class="hn12-hero-copy"><h1>Vos offres.</h1></div></section>
<section class="hn12-section hn12-paper"><div class="hn12-section-head"><h2>Studio de recrutement.</h2></div>
<div id="recruitGate"><section class="hn-rec-command"><div class="hn-rec-head"><h2>Votre équipe commence ici.</h2><a class="hn-rec-create" href="#form">Nouvelle annonce</a></div>
<div class="hn-rec-kpis">${new Array(4).fill(0).map(()=>'<div class="hn-rec-kpi"><span>En ligne</span><strong>2</strong></div>').join('')}</div></section>
<section class="hn-rec-board"><h3>Mes annonces</h3><div class="hn-rec-tabs"><button aria-selected="true">En ligne</button><button>En attente</button></div><div class="jobs-grid-page"><article class="job-card-page"><div class="job-card-content"><h3>Serveur</h3><p>Casablanca</p></div></article></div></section>
<div class="recruit-page"><form class="recruit-form" id="form"><div class="form-grid"><label>Métier<input placeholder="Métier"></label><label>Ville<input placeholder="Ville"></label></div><button type="submit">Créer une annonce</button></form><aside class="recruit-aside"><h2>HORENOVA</h2><p>Notre équipe vous accompagne.</p></aside></div></div></section>`;
const supportHtml=`<header class="hs-top"><a href="/">HORENOVA</a><nav><a href="tel:+212648377009">Téléphone</a></nav></header>
<main class="hs-main"><section class="hs-hero"><div><h1>On reste à vos côtés.</h1><p>Assistance candidats et recruteurs.</p></div></section>
<div class="hs-livebar"><strong>Un superviseur est en ligne</strong></div>
<div class="hs-console"><aside class="hs-sidebar"><div class="hs-sidehead"><h2>Mes conversations</h2></div><div class="hs-threads"><button class="hs-thread">Conversation</button></div></aside>
<section class="hs-chatpanel"><div class="hs-chathead"><h2>Assistance personnalisée</h2></div><div class="hs-messages"><article class="hs-message"><p>Bonjour, pouvez-vous nous aider ?</p></article></div>
<form class="hs-send"><textarea placeholder="Votre message"></textarea><button>Envoyer</button></form></section></div></main>`;
const fixtures={admin:adminHtml,account:accountHtml,recruit:recruiterHtml,support:supportHtml};
function contrast(foreground,background){
 const comps=value=>(value.match(/[\d.]+/g)||[]).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
 const [r,g,b]=comps(foreground),[a,c,d]=comps(background);
 const f=.2126*r+.7152*g+.0722*b,bg=.2126*a+.7152*c+.0722*d;
 return (Math.max(f,bg)+.05)/(Math.min(f,bg)+.05);
}
async function main(){
 const browser=await chromium.launch({headless:true});
 try{
  for(const role of Object.keys(fixtures)){
   for(const width of [320,375,390,430,768,1024,1280]){
    const context=await browser.newContext({viewport:{width,height:860},serviceWorkers:'block'});
    const page=await context.newPage();
    const body=role==='support'?'class="hn-support-page"':'data-hn12="'+role+'"';
    const rootNode=role==='support'?fixtures[role]:'<main class="hn12-page">'+fixtures[role]+'</main>';
    await page.setContent('<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body '+body+'>'+rootNode+'</body></html>');
    for(const sheet of stylesheet[role])await page.addStyleTag({path:path.join(root,sheet)});
    const state=await page.evaluate(()=>{
      const select=s=>document.querySelector(s);
      const style=s=>{const e=select(s);return e?getComputedStyle(e):null};
      const box=s=>select(s)?.getBoundingClientRect();
      return{
       width:innerWidth,scroll:document.documentElement.scrollWidth,
       columns:style('#accountDashboard')?.gridTemplateColumns,
       heroH:box('.hn12-hero')?.height,
       supportColor:style('#adminSupportInbox .hn-support-admin-header h2')?.color,
       supportBackground:style('#adminSupportInbox')?.backgroundColor,
       pubColor:style('.hn-pub-row-copy strong')?.color,
       pubBg:style('.hn-pub-row')?.backgroundColor,
       recruitColumns:style('.recruit-page')?.gridTemplateColumns,
       supportTabs:style('.hn-admin-mobile-tabs')?.display,
       emptyHeight:box('#hubDetail .hub-detail')?.height,
       mainHeight:box('#recruitGate')?.height,
      };
    });
    assert.ok(state.scroll<=width+2,role+' overflow at '+width+': '+JSON.stringify(state));
    if(width<=700){
     if(role==='admin'){
       assert.ok(state.heroH<=225,'Admin hero is too tall on mobile: '+JSON.stringify(state));
       assert.equal(state.supportTabs,'flex','Admin mobile fast navigation should display');
       assert.ok(contrast(state.supportColor,state.supportBackground)>=4.5,'Support headline contrast too weak: '+JSON.stringify(state));
       assert.ok(contrast(state.pubColor,state.pubBg)>=4.5,'Job row contrast too weak: '+JSON.stringify(state));
       assert.ok(state.emptyHeight<=140,'Empty candidature placeholder excessive height: '+state.emptyHeight);
     }
     if(role==='account')assert.ok(state.columns.split(' ').length===1,'Candidate card grid should be one column: '+state.columns);
     if(role==='recruit')assert.ok(state.recruitColumns.split(' ').length===1,'Recruiter form should be single column: '+state.recruitColumns);
    } else if(role==='admin')assert.equal(state.supportTabs,'none','Mobile admin tabs must be hidden on tablets and desktops');
    console.log('PASS adaptive '+role+' '+width+'px');
    await context.close();
   }
  }
 }finally{await browser.close();}
}
main().catch(error=>{console.error('FAIL adaptive role layout: '+error.message);process.exitCode=1;});
