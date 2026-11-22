'use strict';
/* Local real Chromium security/UX tests. Mock listings and WhatsApp state only.
 * Never creates WhatsApp channels, contacts followers or changes production data.
 */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const MIME={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json'};
const testTitle='<img src=x onerror="window.__XSS_HIT=true">';
const wixJobs=Array.from({length:11},(_,i)=>({
 _id:'job-'+i,active:true,kind:i===0?'shift':'job',
 title:i===1?testTitle:'Serveur confirmé '+i,
 role:'Service',business:'Restaurant HORENOVA '+i,city:i%2?'Rabat':'Casablanca',pay:'À convenir',
 _createdDate:'2026-11-22T18:00:00Z'
}));
const centralJobs=[{id:'c1111111-1111-4111-8111-111111111111',kind:'job',title:'Chef de cuisine',role:'Chef',city:'Casablanca',businessName:'Restaurant vérifié',createdAt:'2026-11-22T19:00:00Z'}];
const server=http.createServer((req,res)=>{
 try{
  const u=new URL(req.url,'http://localhost'),local=decodeURIComponent(u.pathname).replace(/^\/+/,'')||'communaute.html';
  const filename=path.resolve(root,local);
  if(!filename.startsWith(root+path.sep)||!fs.existsSync(filename)||!fs.statSync(filename).isFile()){
   res.writeHead(404);return res.end('Missing');
  }
  res.writeHead(200,{'Content-Type':MIME[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(fs.readFileSync(filename));
 }catch{res.writeHead(400);res.end('Bad request')}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const host='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [320,390,1280]){
   const context=await browser.newContext({viewport:{width,height:830},serviceWorkers:'block',isMobile:width<500,hasTouch:width<500});
   let officialUrl=null;
   await context.route('**/js/wix/items.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'export async function queryItems(collection){return {items:'+JSON.stringify(wixJobs)+'};}'}));
   await context.route('https://horenova-hub-api.onrender.com/**',route=>{
    const p=new URL(route.request().url()).pathname;
    let data,status=200;
    if(p==='/api/community/channel')data={active:!!officialUrl,url:officialUrl};
    else if(p==='/api/jobs/public')data={items:centralJobs};
    else{status=404;data={error:'mock only'}};
    return route.fulfill({status,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(data)});
   });
   const page=await context.newPage(),jsErrors=[];
   page.on('pageerror',e=>jsErrors.push(e.message));
   await page.addInitScript(()=>{window.__XSS_HIT=false;try{localStorage.setItem('mihna-lang','fr')}catch{}});
   await page.goto(host+'/communaute.html',{waitUntil:'load',timeout:14000});
   await page.waitForFunction(()=>document.querySelectorAll('.hc-offer').length===9,{timeout:12000});
   assert.equal(await page.locator('.hc-offer').count(),9,'Only first 9 visible by default');
   assert.equal(await page.locator('#hcFollow').isHidden(),true,'No fake WhatsApp channel links');
   assert.equal(await page.locator('#hcWaiting').isVisible(),true);
   assert.equal(await page.locator('#hcPager').isHidden(),false);
   await page.locator('#hcMore').click();
   await page.waitForFunction(()=>document.querySelectorAll('.hc-offer').length===12);
   assert.equal(await page.evaluate(()=>window.__XSS_HIT),false);
   assert.equal(await page.locator('.hc-offer img[onerror]').count(),0);
   await page.locator('#hcSearch').fill('Chef de cuisine');
   await page.waitForFunction(()=>document.querySelectorAll('.hc-offer').length===1);
   assert.match(await page.locator('.hc-offer h3').innerText(),/Chef de cuisine/);
   await page.locator('#hcSearch').fill('');
   await page.locator('[data-kind="shift"]').click();
   assert.equal(await page.locator('.hc-offer').count(),1);
   await page.locator('[data-kind="all"]').click();
   await page.locator('#hcCity').selectOption('Rabat');
   assert.equal(await page.locator('.hc-offer').count(),5);
   await page.locator('#hcCity').selectOption('');
   const menu=page.locator('#hn-language-control');
   await menu.selectOption('ar');
   assert.equal(await page.locator('html').getAttribute('dir'),'rtl');
   await page.waitForFunction(()=>document.querySelector('h1').textContent.includes('الفرص'));
   await menu.selectOption('en');
   assert.equal(await page.locator('html').getAttribute('lang'),'en');
   await page.waitForFunction(()=>document.querySelector('h1').textContent.includes('Opportunities'));
   officialUrl='https://whatsapp.com/channel/0029VaABCDEFGH12345';
   await page.reload({waitUntil:'load'});
   await page.waitForFunction(()=>!document.querySelector('#hcFollow').hidden,{timeout:12000});
   assert.equal(await page.locator('#hcFollow').getAttribute('href'),officialUrl);
   assert.equal(await page.locator('#hcFollow').getAttribute('target'),'_blank');
   assert.equal(await page.locator('#hcWaiting').isHidden(),true);
   const dims=await page.evaluate(()=>({w:innerWidth,scroll:document.documentElement.scrollWidth}));
   assert.ok(dims.scroll<=dims.w+5,'Horizontal overflow '+width+' '+JSON.stringify(dims));
   assert.deepEqual(jsErrors,[],'No JS errors on public channel page');
   await page.close();await context.close();
   console.log('PASS HORENOVA community '+width+'px: real public listings, 3 languages, XSS protection, filters and admin-published WhatsApp link');
  }
  // The admin settings render in a separate authenticated dashboard and persist
  // only through the admin-protected server route; exercise the UI with mocks.
  const context=await browser.newContext({viewport:{width:390,height:850},serviceWorkers:'block'});
  const page=await context.newPage();
  await page.route('**/hn-api.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'export async function hub(){throw Error("Use mocked request");}'}));
  await page.goto(host+'/communaute.html',{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{
   document.body.innerHTML='<div id="adminRoot"></div>';
   document.documentElement.lang='fr';
   const m=await import('/channel-admin.js');
   let current=null;window.__saved=[];window.confirm=()=>true;
   m.mountAdminChannel(document.getElementById('adminRoot'),async(path,config)=>{
    if(!config)return{active:!!current,url:current};
    window.__saved.push({method:config.method,url:config.body?.url||null});
    if(config.method==='PATCH'){current=config.body.url;return{ok:true,url:current,active:true}}
    if(config.method==='DELETE'){current=null;return{ok:true,active:false,url:null}}
   });
  });
  await page.locator('#hcaTitle').waitFor();
  assert.equal(await page.locator('#hcaRemove').isDisabled(),true);
  await page.locator('#hcaUrl').fill('https://phishing.invalid/channel/0029VaABCDEFGH12345');
  await page.locator('#hcaSave').click();
  assert.equal(await page.evaluate(()=>window.__saved.length),0,'Bad links never leave the browser');
  await page.locator('#hcaUrl').fill('https://www.whatsapp.com/channel/0029VaABCDEFGH12345');
  await page.locator('#hcaSave').click();
  await page.waitForFunction(()=>window.__saved.length===1);
  assert.equal(await page.locator('#hcaCurrentLink').getAttribute('href'),'https://whatsapp.com/channel/0029VaABCDEFGH12345');
  await page.locator('#hcaRemove').click();
  await page.waitForFunction(()=>window.__saved.length===2);
  assert.equal(await page.locator('#hcaCurrentLink').isHidden(),true);
  await page.close();await context.close();
  console.log('PASS admin WhatsApp channel setup: reject forged links, activate and remove official channel URL');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error('FAIL HORENOVA community browser regression: '+e.stack);process.exitCode=1;});
