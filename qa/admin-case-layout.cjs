'use strict';
/* Real admin.js DOM integration with mocked auth and API. No private user records touched. */
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const adminScript=fs.readFileSync(path.join(root,'admin.js'),'utf8');
const printScript=fs.readFileSync(path.join(root,'admin-print.js'),'utf8');
const fullCss=['styles.css','horenova-v12.css','hn-hub.css','support.css','horenova-adaptive-v1.css','horenova-admin-cases-v2.css'];
assert.ok(adminScript.includes('hn-case-section'),'Actual case detail must be grouped');
assert.ok(adminScript.includes('hn-case-private'),'Private fields must be inside an admin-only accordion');
assert.ok(adminScript.includes('hnBackToCases'),'Mobile back-to-list action must exist');
assert.match(adminScript,/hnCasePrint/);
assert.match(adminScript,/data-request-print/);
assert.match(adminScript,/printSupportThread/);
const candidate={
 id:'candidate-fixture-001',createdAt:'2026-11-20T10:00:00Z',status:'EN_ETUDE',
 candidateEmail:'long-candidate-email-address@example.com',
 jobTitle:'Serveur et assistant responsable de salle',
 jobRole:'Serveur',consentToIntro:true,
 profile:{firstName:'Wassim',lastName:'Test de dossier long',age:24,city:'Casablanca',
 jobFamily:'Serveur en restauration',arabic:true,arabicLevel:5,french:true,frenchLevel:4,english:true,englishLevel:3,quizPassed:true,quizScore:90,videoFileId:'private-video',bio:'Présentation longue '.repeat(34),
 application:{experienceYears:3,lastPosition:'Chef de rang - Restaurant du complexe',skills:['Service à table','Accueil client','Suivi commandes','Coordination équipe'],availability:'À convenir',earliestStart:'2026-11-24',desiredCity:'Casablanca',contractPreference:'CDI',phone:'+212648377009',motivation:'Motivation de test très détaillée '.repeat(31)}}
};
const recruiter={id:'request-1',status:'VALIDEE',kind:'job',city:'Casablanca',job_role:'Serveur',job_title:'Serveur',business_name:'Complexe de loisirs',salary_text:'À confirmer',schedule_text:'10h-21h',description:'Description détaillée',contact_name:'Personne responsable',phone:'+212648377009'};
const html='<html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body data-hn12="admin"><main class="hn12-page"><section class="hn12-section hn12-paper"><div id="adminGate" class="admin-grid"></div></section></main></body></html>';
const supportFixture={id:'11111111-1111-4111-8111-111111111111',subject:'Assistance compte HORENOVA',memberEmail:'member@example.invalid',memberRole:'candidate',category:'Compte & accès',status:'OPEN',createdAt:'2026-11-20T10:00:00Z',updatedAt:'2026-11-20T11:00:00Z'};
const mockApi=`
 const supportFixture=${JSON.stringify(supportFixture)};
 const item=${JSON.stringify(candidate)};
 const request=${JSON.stringify(recruiter)};
 export async function hub(route,options){
   if(route==='/api/support/threads')return {items:[supportFixture]};
   if(route==='/api/support/threads/'+supportFixture.id+'/messages')return {items:[{senderRole:'candidate',body:'Mon compte est bloqué',createdAt:'2026-11-20T10:00:00Z'},{senderRole:'admin',body:'Nous examinons votre demande',createdAt:'2026-11-20T10:30:00Z'}]};
   if(route==='/api/applications')return {items:[item]};
   if(route==='/api/recruiter-requests')return {items:[request]};
   if(options?.method==='PATCH'){window.__casePatched=true;return {ok:true}};
   throw new Error('Unexpected mock API request '+route);
 }
 export async function hubPhoto(){
   const raw=atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO9pJyQAAAAASUVORK5CYII=');
   const data=Uint8Array.from(raw,c=>c.charCodeAt(0));
   return URL.createObjectURL(new Blob([data],{type:'image/png'}));
 }
`;
async function main(){
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [320,375,390,430,768,1024,1280]){
   const context=await browser.newContext({viewport:{width,height:850},serviceWorkers:'block'});
   const page=await context.newPage();const errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.route('https://horenova.test/**',route=>{
     const u=new URL(route.request().url());
     const pathname=u.pathname;
     if(pathname==='/admin.html')return route.fulfill({status:200,contentType:'text/html',body:html.replace('</body>','<script type="module" src="/admin.js"></script></body>')});
     if(pathname==='/admin.js')return route.fulfill({status:200,contentType:'text/javascript',body:adminScript});
     if(pathname==='/admin-print.js')return route.fulfill({status:200,contentType:'text/javascript',body:printScript});
     if(pathname==='/mihna-global.js')return route.fulfill({status:200,contentType:'text/javascript',body:"export async function requireRole(){return {role:'admin',email:'admin@example.com'}}"});
     if(pathname==='/hn-api.js')return route.fulfill({status:200,contentType:'text/javascript',body:mockApi});
     if(pathname==='/admin-overview.js')return route.fulfill({status:200,contentType:'text/javascript',body:'export async function mountAdminOverview(){}'});
     return route.fulfill({status:404,body:'not mocked'});
   });
   await page.goto('https://horenova.test/admin.html',{waitUntil:'domcontentloaded'});
   for(const css of fullCss)await page.addStyleTag({path:path.join(root,css)});
   const card=page.locator('#hubCases button[data-id]');
   await card.waitFor({state:'visible',timeout:8000});
   await card.click();
   const detail=page.locator('#hubDetail .hn-case-detail');
   await detail.waitFor({state:'visible',timeout:5000});
   const state=await page.evaluate(()=>{
    const el=s=>document.querySelector(s);
    const rect=s=>el(s)?.getBoundingClientRect();
    const fields=[...document.querySelectorAll('.hn-case-fields>.hn-case-field')].map(n=>n.getBoundingClientRect());
    const overlapping=fields.some((a,i)=>fields.slice(i+1).some(b=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1));
    return {
     viewport:innerWidth,scroll:document.documentElement.scrollWidth,
     labels:document.querySelectorAll('.hn-case-section').length,
     sections:[...document.querySelectorAll('.hn-case-section h4')].map(x=>x.textContent),
     fields:fields.length,overlapping,
     privateExists:!!el('.hn-case-private'),
     privateClosed:!el('.hn-case-private')?.open,
     fieldColumns:getComputedStyle(el('.hn-case-fields')).gridTemplateColumns,
     headingRight:rect('.hn-case-heading')?.right,
     detailsRight:rect('.hn-case-detail')?.right,
     listHidden:getComputedStyle(el('#adminApplications')).display==='none',
     profileRight:rect('.hn-case-profile')?.right,
     decisionRight:rect('.hn-case-decisions')?.right,
     saveControl:!!el('#saveStatus'),requestControl:!!el('#assignRequest')
    };
   });
   assert.ok(state.scroll<=width+2,'Horizontal overflow '+width+': '+JSON.stringify(state));
   assert.ok(state.labels>=4&&state.fields>=15,'Missing application fields: '+JSON.stringify(state));
   assert.ok(!state.overlapping,'Application fields overlap: '+JSON.stringify(state));
   assert.ok(state.privateClosed,'Private data should be collapsed by default');
   assert.ok(state.headingRight<=width+2&&state.detailsRight<=width+2&&state.profileRight<=width+2&&state.decisionRight<=width+2,'Dossier layout exceeds viewport: '+JSON.stringify(state));
   assert.ok(state.saveControl&&state.requestControl,'Moderation controls are missing');
   assert.equal(await page.locator('#hnCasePrint').count(),1,'Candidate print action is required');
   assert.equal(await page.locator('[data-request-print]').count(),1,'Recruiter print action is required');
   assert.equal(await page.locator('.hn-support-print').count(),1,'Support print action is required');
   if(width<=700){assert.ok(state.listHidden,'Mobile should show only the selected dossier');assert.equal(state.fieldColumns.split(' ').length,1,'Phone detail must use one column');}
   if(width===390){
     const candidatePromise=page.waitForEvent('popup');
     await page.locator('#hnCasePrint').click();
     const printCandidate=await candidatePromise;
     await printCandidate.locator('main.sheet .field').first().waitFor({state:'visible'});
     const content=await printCandidate.locator('main.sheet').innerText();
     assert.match(content,/Test de dossier long/);
     assert.match(content,/Motivation de test/);
     assert.match(content,/\+212648377009/);
     assert.match(content,/Quiz métier/);
     assert.equal(await printCandidate.locator('main.sheet img.portrait').count(),1,'Candidate private photo must be embedded');
     assert.equal(await printCandidate.locator('button').innerText(),'Imprimer / Enregistrer en PDF');
     await printCandidate.close();
     const recruiterPromise=page.waitForEvent('popup');
     await page.locator('[data-request-print]').click();
     const printedRecruiter=await recruiterPromise;
     await printedRecruiter.locator('main.sheet .field').first().waitFor({state:'visible'});
     assert.match(await printedRecruiter.locator('main.sheet').innerText(),/Complexe de loisirs/);
     assert.match(await printedRecruiter.locator('main.sheet').innerText(),/Description détaillée/);
     await printedRecruiter.close();
     const supportPromise=page.waitForEvent('popup');
     await page.locator('.hn-support-print').click();
     const printedSupport=await supportPromise;
     await printedSupport.locator('main.sheet .field').first().waitFor({state:'visible'});
     assert.match(await printedSupport.locator('main.sheet').innerText(),/Nous examinons votre demande/);
     assert.match(await printedSupport.locator('main.sheet').innerText(),/Mon compte est bloqué/);
     await printedSupport.close();
   }
   await page.locator('.hn-case-private>summary').click();
   assert.equal(await page.locator('.hn-case-private').evaluate(el=>el.open),true,'Private fields accordion must open');
   if(width<=700){
    await page.locator('#hnBackToCases').click();
    assert.equal(await page.locator('#adminApplications').isVisible(),true,'Back action must restore the list');
   }
   assert.equal(errors.length,0,'Admin module browser exceptions: '+errors.join('; '));
   await context.close();
   console.log('PASS admin candidate dossier '+width+'px ('+state.fields+' readable fields)');
  }
 }finally{await browser.close();}
}
main().catch(e=>{console.error('FAIL admin candidate dossier: '+e.message);process.exitCode=1});
