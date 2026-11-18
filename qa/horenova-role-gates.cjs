'use strict';
/**
 * HORENOVA regression: each verified member role gets a distinct onboarding and account experience.
 * Uses in-memory DOMs and simulated authenticated role; no real users or production writes.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8')
  .replace(/^import\s+.*?;\s*$/gm,'');
async function checkOnboarding(role){
 const markup=source('onboarding.js');
 const pages={
  hnRecruiterIntro:{hidden:true},
  onboardingNext:{href:'/candidate-setup.html'},
  welcomeVideo:{pause(){},play(){return Promise.resolve()}},
  videoCaption:{textContent:''},
  onboardingVoice:{textContent:''}
 };
 const intro={hidden:false},hero={title:{},text:{},kicker:{}};
 let redirect='';
 const doc={
  body:{dataset:{}},
  querySelector:q=>({
    '.onboarding-shell':intro,
    '.hn12-hero-copy h1':hero.title,
    '.hn12-hero-copy p':hero.text,
    '.hn12-hero-copy .hn12-kicker':hero.kicker
  })[q]||null,
  getElementById:id=>pages[id]||null,
  querySelectorAll:()=>[]
 };
 const win={addEventListener(){}};
 await new Function('requireRole','applyLanguage','document','window','location',
   'return (async function(){'+markup+'})()')(
     async()=>({role}),()=>{},doc,win,{replace:x=>{redirect=x}}
   );
 if(role==='recruiter'){
   assert.equal(intro.hidden,true,'Recruiters must NOT see candidate quiz or video');
   assert.equal(pages.hnRecruiterIntro.hidden,false,'Recruiters see their own intro');
   assert.equal(pages.hnRecruiterIntro?pages.onboardingNext.href:'/candidate-setup.html','/candidate-setup.html');
   assert.equal(doc.body.dataset.onboardingRole,'recruiter');
 } else if(role==='candidate'){
   assert.equal(intro.hidden,false,'Candidate must see their own intro');
   assert.equal(pages.hnRecruiterIntro.hidden,true);
 } else assert.equal(redirect,'/admin.html','Admin goes directly to admin console');
}
async function checkAccount(role){
 const markup=source('account.js');
 const nodes=Object.fromEntries(['accountDashboard','accountIdentity','accountTitle','accountSubtitle']
   .map(id=>[id,{innerHTML:'',textContent:'',replaceChildren(){}}]));
 const hero={title:{},text:{},kicker:{}};
 const d={
   body:{dataset:{}},
   createElement:()=>({textContent:''}),
   getElementById:id=>nodes[id],
   querySelector:q=>q==='.hn12-hero-copy'?{
     querySelector:p=>p==='h1'?hero.title:p==='p'?hero.text:p==='.hn12-kicker'?hero.kicker:null
   }:q==='.hn12-hero .bg img'?{src:''}:null
 };
 await new Function('requireRole','queryItems','hub','document','location',
   'return (async function(){'+markup+'})()')(
    async()=>({role,member:{id:'test-member',displayName:'QA',loginEmail:'qa@example.invalid'}}),
    async collection=>({items:[collection==='RecruiterProfiles'?{businessName:'QA Restaurant',city:'Marrakech'}:{jobFamily:'Serveur',city:'Oujda'}]}),
    async endpoint=>endpoint.includes('recruiter-requests')?
      {items:[{id:'request',status:'A_EXAMINER',kind:'shift',job_title:'Shift QA',city:'Marrakech'}]}:
      {items:[{id:'application',jobTitle:'Serveur',status:'EN_ETUDE'}]},
    d,{replace(){}}
   );
 const html=nodes.accountDashboard.innerHTML;
 if(role==='recruiter'){
   assert.match(html,/Déposer une offre ou un shift/);
   assert.match(html,/TALENTS AU MAROC/);
   assert.match(html,/CONVERSATIONS/);
   assert.doesNotMatch(html,/Ouvrir le quiz/);
   assert.doesNotMatch(html,/candidate-setup/);
   assert.equal(d.body.dataset.accountRole,'recruiter');
 } else if(role==='candidate'){
   assert.match(html,/Ouvrir le quiz/);
   assert.match(html,/candidate-setup/);
   assert.doesNotMatch(html,/Déposer une offre ou un shift/);
 } else {
   assert.match(html,/Ouvrir l’administration/);
   assert.match(html,/Supervision nationale|CENTRE DE CONTRÔLE/);
   assert.doesNotMatch(html,/Ouvrir le quiz/);
 }
}
async function run(){
 for(const role of ['candidate','recruiter','admin']){
  await checkOnboarding(role);
  console.log('PASS onboarding: '+role);
  await checkAccount(role);
  console.log('PASS account dashboard: '+role);
 }
 const recruiter=fs.readFileSync(path.join(__dirname,'../recruit-live.js'),'utf8');
 assert.match(recruiter,/renderRecruiterApplications/);
 assert.match(recruiter,/hub\('\/api\/applications'\)/);
 assert.match(recruiter,/\/conversations\.html\?id=/);
 const onboarding=fs.readFileSync(path.join(__dirname,'../onboarding.html'),'utf8');
 assert.match(onboarding,/\.onboarding-shell\[hidden\]\{display:none!important\}/);
 const nav=fs.readFileSync(path.join(__dirname,'../mihna-global.js'),'utf8');
 assert.match(nav,/HN_ROLE_NAV/);
 assert.match(nav,/installMemberRoleNavigation/);
 const mobile=fs.readFileSync(path.join(__dirname,'../mobile-nav-v15.js'),'utf8');
 assert.match(mobile,/panel\.addEventListener\('click'/);
 console.log('PASS role navigation, recruiter inbox and hidden candidate flow');
}
run().catch(error=>{console.error(error);process.exitCode=1;});