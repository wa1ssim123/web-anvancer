'use strict';
/* Browser QA uses only mocked Wix identities and API data. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const appId='11111111-1111-4111-8111-111111111111',requestId='22222222-2222-4222-8222-222222222222',threadId='33333333-3333-4333-8333-333333333333';
function fakeApi(role){
 const code=[
  "let matched=false, opened=('__ROLE__'!=='admin'), messages=[{id:1,senderWixId:'admin-id',senderRole:'admin',body:'Bonjour, nous avons une opportunité.',createdAt:'2026-11-22T18:00:00Z'}];",
  "const aid='__APP__',rid='__REQ__',tid='__THREAD__';",
  "export async function hub(url,{method='GET',body={}}={}) {",
  "if(url.startsWith('/api/admin/match-directory?')) {",
  "const kind=new URL('https://test.invalid'+url).searchParams.get('kind');",
  "return {kind,items:kind==='candidate'?[{id:aid,name:'Candidat Démo',jobRole:'Serveur, Commis',city:'Casablanca',status:'EN_ETUDE',consentToIntro:true,assigned:false}]:[{id:rid,name:'Restaurant Test',jobRole:'Serveur',city:'Casablanca',status:'VALIDEE'}]};}",
  "if(url==='/api/chat/threads')return {items:[...(opened?[{id:tid,kind:'direct',role:'candidate',title:'Candidat Démo',subtitle:'Serveur',messagePreview:messages.at(-1)?.body||''}]:[]),...(matched?[{id:aid,kind:'match',title:'Serveur en salle',candidateName:'Candidat Démo',businessName:'Restaurant Test',subtitle:'Candidat Démo · Restaurant Test'}]:[])]};",
  "if(url==='/api/chat/direct-threads'&&method==='POST'){opened=true;return {id:tid,kind:'direct'};}",
  "if(url.includes('/assign')&&method==='PATCH'){if(body.requestId!==rid)throw Error('Mauvais recruteur');matched=true;return {ok:true};}",
  "if(url.includes('/messages')){if(method==='GET')return {items:messages};if(method==='POST'){messages.push({id:messages.length+1,senderWixId:'__ROLE__-id',senderRole:'__ROLE__',body:body.body,createdAt:'2026-11-22T19:00:00Z'});return {ok:true};}}",
  "throw Error('Unexpected fake endpoint '+method+' '+url);}"
 ].join('\n');
 return code.replaceAll('__ROLE__',role).replaceAll('__APP__',appId).replaceAll('__REQ__',requestId).replaceAll('__THREAD__',threadId);
}
async function scenario(browser,role,width,language='fr'){
 const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce',serviceWorkers:'block'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(lang=>localStorage.setItem('mihna-lang',lang),language);
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname!=='horenova.test')return route.fulfill({status:204,body:''});
  if(u.pathname==='/mihna-global.js')return route.fulfill({status:200,contentType:'application/javascript',body:"export async function requireRole(){return {role:'"+role+"',member:{id:'"+role+"-id'}};}"});
  if(u.pathname==='/hn-api.js')return route.fulfill({status:200,contentType:'application/javascript',body:fakeApi(role)});
  if(['/horenova-i18n.js','/pwa-register.js'].includes(u.pathname))return route.fulfill({status:200,contentType:'application/javascript',body:''});
  const file=path.resolve(root,u.pathname.replace(/^\//,'')||'index.html');
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404});
  const type=file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'application/javascript';
  return route.fulfill({status:200,contentType:type,body:fs.readFileSync(file)});
 });
 await page.goto('https://horenova.test/conversations.html',{waitUntil:'load'});
 await page.locator('#hcTabMessages:visible').waitFor({timeout:12000});
 assert.equal(await page.evaluate(()=>document.documentElement.lang),language);
 assert.equal(await page.evaluate(()=>document.documentElement.dir),language==='ar'?'rtl':'ltr');
 if(role==='admin'){
  await page.locator('#hcTabMatching:visible').click();
  await page.locator('#hcDirectoryResults .hc-result').first().waitFor({timeout:8000});
  // An administrator can first contact an applicant privately, before introducing them.
  await page.locator('#hcDirectoryResults .hc-result button').nth(1).click();
  await page.locator('#conversationForm:visible').waitFor({timeout:9000});
  await page.locator('#conversationText').fill('Message privé préalable au candidat.');
  await page.locator('#hcSend').click();
  await page.locator('#conversationMessages').getByText('Message privé préalable au candidat.').waitFor({timeout:9000});
  await page.locator('#hcTabMatching').click();
  await page.locator('#hcDirectoryResults .hc-result button').first().click();
  await page.locator('[data-kind="recruiter"]').click();
  await page.locator('#hcDirectoryResults .hc-result').first().waitFor({timeout:8000});
  await page.locator('#hcDirectoryResults .hc-result button').first().click();
  assert.equal(await page.locator('#hcStartMatch').isDisabled(),false);
  page.once('dialog',d=>d.accept());
  await page.locator('#hcStartMatch').click();
  await page.locator('#conversationForm:visible').waitFor({timeout:9000});
  assert.match(await page.locator('#hcParticipants').innerText(),/Restaurant Test/);
 }else{
  await page.locator('#conversationForm:visible').waitFor({timeout:9000});
  assert.equal(await page.locator('#hcTabMatching').isVisible(),false);
 }
 await page.locator('#conversationText').fill('Je confirme ma disponibilité.');
 await page.locator('#hcSend').click();
 await page.locator('#conversationMessages').getByText('Je confirme ma disponibilité.').waitFor({timeout:9000});
 const layout=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
 assert.ok(layout.scroll<=layout.width+2,'Mobile overflow '+JSON.stringify({role,layout}));
 assert.deepEqual(errors,[],'Browser errors '+errors.join(' | '));
 console.log('PASS HORENOVA chat '+role+' '+width+'px '+language+': private inbox and send'+(role==='admin'?' + private direct contact + matching group':''));
 await context.close();
}
(async()=>{const browser=await chromium.launch({headless:true});try{
 for(const role of ['admin','candidate','recruiter'])await scenario(browser,role,390);
 await scenario(browser,'admin',1280);
 await scenario(browser,'candidate',390,'en');
 await scenario(browser,'recruiter',390,'ar');
 await scenario(browser,'admin',390,'ar');
}finally{await browser.close()}})().catch(e=>{console.error('FAIL HORENOVA chat UI: '+e.stack);process.exitCode=1;});
