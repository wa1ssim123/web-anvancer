'use strict';
/* Real browser: support opens immediately, request submission opens chat,
 * and availability copy never impersonates an online human. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'support.html'),'utf8');
const js=fs.readFileSync(path.join(root,'support.js'),'utf8');
const css=fs.readFileSync(path.join(root,'support.css'),'utf8');
assert.ok(!html.includes('hs-hero-art'),'The big decorative drawing must be removed');
assert.match(html,/hsQuickDemand/);
assert.match(html,/tel:\+212648377009/);
assert.match(html,/24 h\/24/);
async function test(browser,width,role){
 const context=await browser.newContext({viewport:{width,height:850},serviceWorkers:'block',reducedMotion:'reduce'});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const mock=Array.from({length:1},()=>({id:'11111111-1111-4111-8111-111111111111',subject:'Je veux un emploi',category:'Candidature & quiz',status:'OPEN',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),lastMessageAt:new Date().toISOString()}));
 const api=`const threads=${JSON.stringify(role==='admin'?mock:[])},messages=[];
 export async function hub(path,options={}){
 if(path==='/api/support/presence')return {online:false,operatorCount:0};
 if(path==='/api/support/threads'&&(!options.method||options.method==='GET'))return {items:threads};
 if(path==='/api/support/threads'&&options.method==='POST'){
   const id='22222222-2222-4222-8222-222222222222';
   threads.unshift({id,subject:options.body.subject,category:options.body.category,status:'OPEN',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),lastMessageAt:new Date().toISOString()});
   messages.push({id:'initial',senderRole:'candidate',body:options.body.message,createdAt:new Date().toISOString()});
   window.__created=true;return {id};
 }
 if(path.endsWith('/messages')&&(!options.method||options.method==='GET'))return {items:messages};
 if(path.endsWith('/messages')&&options.method==='POST'){
   messages.push({id:'next',senderRole:'candidate',body:options.body.message,createdAt:new Date().toISOString()});return {ok:true};
 }
 throw Error('Unexpected support API: '+path);
 }`;
 await page.route('https://horenova.test/**',route=>{
   const u=new URL(route.request().url()),p=u.pathname;
   if(p==='/support.html')return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
   if(p==='/support.css')return route.fulfill({status:200,contentType:'text/css',body:css});
   if(p==='/support.js')return route.fulfill({status:200,contentType:'text/javascript',body:js});
   if(p==='/mihna-global.js')return route.fulfill({status:200,contentType:'text/javascript',body:`export const currentLang=()=> 'fr';export async function requireRole(){return {role:'${role}',id:'u1',email:'example@invalid.test'}}`});
   if(p==='/hn-api.js')return route.fulfill({status:200,contentType:'text/javascript',body:api});
   if(p.endsWith('.js'))return route.fulfill({status:200,contentType:'text/javascript',body:''});
   if(p.endsWith('.css'))return route.fulfill({status:200,contentType:'text/css',body:''});
   return route.fulfill({status:204,body:''});
 });
 await page.goto('https://horenova.test/support.html',{waitUntil:'domcontentloaded'});
 await page.locator('#hsConsole').waitFor({state:'visible',timeout:7000});
 const x=await page.evaluate(()=>({
  horizontal:document.documentElement.scrollWidth,viewport:innerWidth,
  art:document.querySelectorAll('.hs-hero-art').length,
  status:document.getElementById('hsPresenceLabel').textContent,
  canCall:document.querySelector('a[href="tel:+212648377009"]')!==null
 }));
 assert.ok(x.horizontal<=width+2,'Horizontal overflow: '+JSON.stringify(x));
 assert.equal(x.art,0);
 assert.ok(x.canCall);
 assert.match(x.status,/24 h\/24/);
 if(role==='candidate'){
  await page.locator('#hsQuickDemand').click();
  await page.locator('#hsNewDialog').waitFor({state:'visible'});
  await page.locator('#hsCreateForm select[name="category"]').selectOption('Candidature & quiz');
  await page.locator('#hsCreateForm input[name="subject"]').fill('Mon compte est bloqué');
  await page.locator('#hsCreateForm textarea[name="message"]').fill('Je ne parviens pas à envoyer ma candidature.');
  await page.locator('#hsCreateSubmit').click();
  await page.locator('#hsMessageForm').waitFor({state:'visible',timeout:7000});
  assert.equal(await page.evaluate(()=>window.__created),true);
  await page.locator('#hsMessage').fill('Pouvez-vous me répondre ici ?');
  await page.locator('#hsMessageSubmit').click();
  await page.waitForFunction(()=>document.querySelectorAll('.hs-message').length===2);
  assert.match(await page.locator('#hsMessages').innerText(),/Pouvez-vous me répondre ici/);
 }else{
  assert.equal(await page.locator('#hsNewThread').isVisible(),false);
  assert.equal(await page.locator('.hs-thread').count(),1);
 }
 assert.deepEqual(errors,[],'Browser errors: '+errors.join('; '));
 await context.close();
 console.log('PASS direct support '+role+' '+width+'px');
}
(async()=>{const browser=await chromium.launch({headless:true});try{
 for(const width of [320,390,1280])for(const role of ['candidate','admin'])await test(browser,width,role);
}finally{await browser.close()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
