'use strict';
/* End-to-end DOM of the actual apply.js with mocked Wix identity/API. No emails or production writes. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const app=fs.readFileSync(path.join(root,'apply.js'),'utf8');
const i18n=fs.readFileSync(path.join(root,'horenova-i18n.js'),'utf8');
const fixture='<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body data-hn12="apply"><header class="hn12-top"><div class="hn12-actions"><button id="menuBtn">Menu</button></div></header><main class="hn12-page"><section class="hn-application-studio"><div class="hn-application-layout"><div class="hn-application-panel"><div id="applyJob"></div><div id="applyChecks"></div></div><aside class="hn-application-aside"><img id="applyPortrait" hidden><span id="applyPortraitEmpty">Photo</span><h2 id="applyCandidateName"></h2><p id="applyCandidateMeta"></p></aside></div></section></main><nav class="hn12-dock"><a href="/jobs.html">Jobs</a></nav><script type="module" src="/apply.js"></script><script defer src="/horenova-i18n.js"></script></body></html>';
const memberModule="export async function requireRole(){return {role:'candidate',member:{id:'candidate-mock',contact:{firstName:'Samira',lastName:'Test'}}};} export function currentLang(){return localStorage.getItem('mihna-lang')||'fr'}";
const itemsModule="export async function queryItems(){return {items:[]}};export async function getItemById(){return null};";
function apiModule(hasPhoto){
 return `export async function hub(path,options){
 if(path==='/api/jobs/public')return {items:[{id:'job-001',title:'Serveur',role:'Serveur'}]};
 if(path==='/api/profile/photo/status')return {hasPhoto:${hasPhoto}};
 if(path==='/api/applications'&&options?.method==='POST'){
 window.__submitted=options.body;return {item:{id:'application-001'},ok:true};
 }
 throw Error('Unexpected mock request '+path);
 }
 export async function hubPhoto(){return null}
 export async function hubUploadPhoto(blob){if(!blob||blob.type!=='image/jpeg')throw Error('JPEG normalization missing');window.__uploaded=true;return {ok:true}}`;
}
async function scenario(browser,lang,width,existingPhoto){
 const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(code=>localStorage.setItem('mihna-lang',code),lang);
 await page.route('https://horenova.test/**',route=>{
  const name=new URL(route.request().url()).pathname;
  let content=name==='/apply.html'?fixture:name==='/apply.js'?app:name==='/horenova-i18n.js'?i18n:name==='/mihna-global.js'?memberModule:name==='/js/wix/items.js'?itemsModule:name==='/hn-api.js'?apiModule(existingPhoto):null;
  return route.fulfill({status:content===null?404:200,contentType:name.endsWith('.js')?'text/javascript':'text/html',body:content||'not found'});
 });
 await page.goto('https://horenova.test/apply.html?id=job-001&role=Serveur');
 for(const style of ['styles.css','horenova-v12.css','horenova-candidate-flow-v3.css','horenova-easy-apply-v1.css'])await page.addStyleTag({path:path.join(root,style)});
 await page.locator('#applyDossierForm').waitFor({state:'visible',timeout:7000});
 await page.locator('[name=firstName]').fill('Samira');
 await page.locator('[name=lastName]').fill('Candidate');
 await page.locator('[name=desiredCity]').fill('Casablanca');
 await page.locator('[name=phone]').fill('+212648377009');
 await page.locator('[name=consentToIntro]').check();
 if(!existingPhoto){
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9c9jgU0AAAAASUVORK5CYII=','base64');
  await page.locator('#applyPhotoFile').setInputFiles({name:'portrait.png',mimeType:'image/png',buffer:png});
 }
 await page.waitForFunction(()=>document.documentElement.lang===localStorage.getItem('mihna-lang'));
 const state=await page.evaluate(()=>({
  width:innerWidth,scroll:document.documentElement.scrollWidth,
  quizRequested:document.body.innerText.includes('Passer mon quiz'),
  videoRequired:!!document.querySelector('input[name=video][required]'),
  nameRequired:document.querySelector('[name=firstName]')?.required,
  photoRequired:document.querySelector('#applyPhotoFile')?.required,
  translated:document.querySelector('.hn-easy-intro h2')?.textContent
 }));
 assert.ok(state.scroll<=width+2,'Easy candidature horizontal overflow: '+JSON.stringify(state));
 assert.equal(state.quizRequested,false,'Quiz must not block sending');
 assert.equal(state.videoRequired,false,'Video must not block sending');
 assert.ok(state.nameRequired&&state.photoRequired===!existingPhoto);
 const translated={fr:'Postuler en quelques minutes.',en:'Apply in a few minutes.',ar:'ترشح في دقائق.'};
 assert.equal(state.translated,translated[lang],'Application intro must follow language');
 await page.locator('#applySubmit').click();
 await page.waitForFunction(()=>window.__submitted?.application?.phone==='+212648377009',{timeout:8000});
 const submitted=await page.evaluate(()=>({request:window.__submitted,uploaded:window.__uploaded===true,success:!!document.querySelector('.hn-easy-success')}));
 assert.equal(submitted.request.application.firstName,'Samira');
 assert.equal(submitted.request.application.lastName,'Candidate');
 assert.equal(submitted.request.application.skills.length,0,'Skills are optional');
 assert.equal(submitted.request.consentToIntro,true);
 assert.ok(submitted.success,'Application confirmation must display');
 if(!existingPhoto)assert.ok(submitted.uploaded,'Fresh photo must be saved');
 assert.equal(errors.length,0,'Browser exceptions: '+errors.join('; '));
 console.log('PASS easy applicant '+lang+' '+width+'px photo='+existingPhoto);
 await context.close();
}
async function main(){const browser=await chromium.launch({headless:true});try{
 for(const lang of ['fr','en','ar'])for(const width of [320,390,768])await scenario(browser,lang,width,true);
 await scenario(browser,'fr',390,false);
}finally{await browser.close();}}
main().catch(e=>{console.error('FAIL easy applicant: '+e.stack);process.exitCode=1;});
