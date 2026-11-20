'use strict';
/* Private admin print previews: all test records are synthetic; no live accounts touched. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const source=read('admin.js'),printer=read('admin-print.js');
const photo64='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==';
const sample={
 id:'11111111-1111-4111-8111-111111111111',createdAt:'2026-11-20T11:15:00.000Z',status:'EN_ETUDE',
 jobTitle:'Serveur en salle',jobRole:'Serveur',jobId:'33333333-3333-4333-8333-333333333333',
 candidateEmail:'samira@example.invalid',consentToIntro:true,
 profile:{firstName:'Samira',lastName:'Exemple',age:26,city:'Casablanca',
 jobFamily:'Restauration',arabic:true,arabicLevel:5,french:true,frenchLevel:4,
 application:{phone:'+212600000000',experienceYears:4,lastPosition:'Chef de rang',
 skills:['Accueil des clients','Prise de commandes'],availability:'Immédiate',
 contractPreference:'CDI',motivation:'Je souhaite rejoindre votre équipe en salle.'}}
};
const request={
 id:'22222222-2222-4222-8222-222222222222',kind:'shift',status:'A_EXAMINER',
 job_title:'Shift barista',job_role:'Barista',business_name:'Café Test',
 city:'Casablanca',schedule_text:'18h00 – 23h00',salary_text:'À convenir',
 description:'Service barista du soir',contact_name:'Responsable',phone:'+212611111111',
 created_at:'2026-11-20T09:30:00Z',has_workplace_photo:true
};
const thread={
 id:'44444444-4444-4444-8444-444444444444',subject:'Difficulté de connexion',
 category:'Compte & accès',memberEmail:'candidate@example.invalid',
 memberRole:'candidate',status:'OPEN',createdAt:'2026-11-20T10:00:00Z',
 updatedAt:'2026-11-20T12:00:00Z',unread:1
};
const pageHtml='<html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body data-hn12="admin"><section id="adminGate"></section><script type="module" src="/admin.js"></script></body></html>';
const mockApi=`
const candidate=${JSON.stringify(sample)};
const job=${JSON.stringify(request)};
const help=${JSON.stringify(thread)};
export async function hub(route,options={}){
 if(route==='/api/support/threads')return {items:[help]};
 if(route===('/api/support/threads/'+help.id+'/messages'))return {items:[
  {id:'m1',senderRole:'candidate',body:'Je ne peux pas me connecter.',createdAt:'2026-11-20T10:15:00Z'},
  {id:'m2',senderRole:'admin',body:'Nous examinons votre situation.',createdAt:'2026-11-20T10:45:00Z'}
 ]};
 if(route==='/api/applications')return {items:[candidate]};
 if(route==='/api/recruiter-requests')return {items:[job]};
 if(options.method==='PATCH')return {ok:true};
 throw Error('Unexpected mock API '+route);
}
export async function hubPhoto(){
 const encoded='${photo64}';
 const bytes=Uint8Array.from(atob(encoded),v=>v.charCodeAt(0));
 return URL.createObjectURL(new Blob([bytes],{type:'image/png'}));
}`;
async function run(){
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:860},serviceWorkers:'block',acceptDownloads:false});
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://horenova.test/**',route=>{
    const uri=new URL(route.request().url());
    const map={'/admin.html':['text/html',pageHtml],'/admin.js':['text/javascript',source],
      '/admin-print.js':['text/javascript',printer],
      '/mihna-global.js':['text/javascript',"export async function requireRole(){return {role:'admin',email:'admin@example.invalid'}}"],
      '/hn-api.js':['text/javascript',mockApi],
      '/admin-overview.js':['text/javascript','export async function mountAdminOverview(){}']};
    const match=map[uri.pathname];
    return match?route.fulfill({status:200,contentType:match[0],body:match[1]}):route.fulfill({status:404,body:''});
   });
   await page.goto('https://horenova.test/admin.html',{waitUntil:'domcontentloaded'});
   await page.locator('#hubCases button[data-id]').waitFor({state:'visible',timeout:9000});
   const quick=page.locator('#hubCases [data-quickprint-id]').first();
   await quick.waitFor({state:'visible'});
   assert.match(await quick.innerText(),/Imprimer la candidature avec photo/);
   const quickPop=page.waitForEvent('popup');
   await quick.click();
   const quickSheet=await quickPop;
   await quickSheet.locator('img.portrait').waitFor({state:'visible',timeout:7000});
   assert.match(await quickSheet.locator('body').innerText(),/Samira Exemple/);
   assert.match(await quickSheet.locator('body').innerText(),/Serveur en salle/);
   await quickSheet.close();
   await page.locator('#hubCases button[data-id]').first().click();
   const candidateBtn=page.locator('#hnCasePrint');
   await candidateBtn.waitFor({state:'visible'});
   const candidatePopup=page.waitForEvent('popup');
   await candidateBtn.click();
   const first=await candidatePopup;
   await first.waitForFunction(()=>document.querySelector('.summary h1')!==null,null,{timeout:7000});
   assert.match(await first.locator('body').innerText(),/Samira Exemple/);
   assert.match(await first.locator('body').innerText(),/\+212600000000/);
   assert.match(await first.locator('body').innerText(),/Je souhaite rejoindre votre équipe/);
   assert.equal(await first.locator('img.portrait').count(),1,'Candidate portrait must be included');
   assert.match(await first.locator('style').textContent(),/@page\{size:A4/);
   assert.equal(await first.locator('.toolbar button').innerText(),'Imprimer / Enregistrer en PDF');
   await first.close();
   const recruiterPopup=page.waitForEvent('popup');
   await page.locator('[data-request-print]').first().click();
   const second=await recruiterPopup;
   await second.waitForFunction(()=>document.querySelector('.summary h1')!==null,null,{timeout:7000});
   assert.match(await second.locator('body').innerText(),/Shift barista/);
   assert.match(await second.locator('body').innerText(),/18h00 – 23h00/);
   assert.match(await second.locator('body').innerText(),/Responsable/);
   assert.equal(await second.locator('img.portrait').count(),1,'Recruiter workplace image should be printed');
   await second.close();
   const supportPopup=page.waitForEvent('popup');
   await page.locator('.hn-support-print').first().click();
   const third=await supportPopup;
   await third.waitForFunction(()=>document.querySelector('.summary h1')!==null,null,{timeout:7000});
   const body=await third.locator('body').innerText();
   assert.match(body,/Difficulté de connexion/);
   assert.match(body,/candidate@example.invalid/);
   assert.match(body,/Nous examinons votre situation/);
   await third.close();
   assert.deepEqual(errors,[],'Admin page JS errors: '+errors.join('; '));
   await context.close();
   console.log('PASS private print A4: candidate with photo, recruiter shift with photo, support chat; '+width+'px');
  }
 }finally{await browser.close()}
}
run().catch(e=>{console.error(e.stack);process.exitCode=1});
