'use strict';
/* Critical regression for the exact iPhone screenshot: no banner may overlap
 * HORENOVA's fixed header; channels must sit beside TECH inside the intro.
 * Only synthetic API data used, never any production user records. */
const {chromium}=require('playwright');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.json':'application/json'};
const app=http.createServer((req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost'),name=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html';
  const file=path.resolve(root,name);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end()}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(fs.readFileSync(file));
 }catch{res.writeHead(400);res.end()}
});
(async()=>{
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+app.address().port;
 const browser=await chromium.launch({headless:true});
 const telegram='https://t.me/Horenova_Maroc';
 try{
  for(const width of [320,375,390,430,1280]){
   const context=await browser.newContext({viewport:{width,height:width<500?844:900},isMobile:width<500,hasTouch:width<500,serviceWorkers:'block',reducedMotion:'reduce'});
   let tg=null;
   await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.host==='127.0.0.1:'+app.address().port)return route.continue();
    if(url.hostname==='horenova-hub-api.onrender.com'){
      const t=url.pathname==='/api/community/telegram';
      return route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(t?{active:!!tg,url:tg}:{active:true,url:'https://whatsapp.com/channel/0029Vb9VLZ5A2pLGFYQA6s2u'})});
    }
    return route.fulfill({status:204,body:''});
   });
   const page=await context.newPage();
   await page.goto(base+'/index.html',{waitUntil:'domcontentloaded',timeout:18000});
   await page.locator('.hn-intro-shortcut-social').waitFor({timeout:10000});
   assert.equal(await page.locator('.hn-home-channel-strip').count(),0,'Bug: old WhatsApp banner still exists');
   assert.equal(await page.locator('.hn-intro-shortcut-tech').count(),1,'TECH remains');
   assert.equal(await page.locator('#hnSocialWA').getAttribute('href'),'https://whatsapp.com/channel/0029Vb9VLZ5A2pLGFYQA6s2u');
   await page.waitForFunction(()=>document.querySelector('#hnSocialTGPending')?.textContent?.length>0);
   assert.equal(await page.locator('#hnSocialTG').isHidden(),true,'Cannot link to imaginary Telegram channel');
   assert.equal(await page.locator('#hnSocialTGPending').isVisible(),true);
   const metrics=await page.evaluate(()=>{
    const intro=document.querySelector('.hn-intro'),tech=document.querySelector('.hn-intro-shortcut-tech'),social=document.querySelector('.hn-intro-shortcut-social');
    const a=tech.getBoundingClientRect(),b=social.getBoundingClientRect();
    return{techTop:a.top,socialTop:b.top,techRight:a.right,socialLeft:b.left,techBottom:a.bottom,socialBottom:b.bottom,
      introWidth:intro.getBoundingClientRect().width,documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,
      bannerCount:document.querySelectorAll('.hn-home-channel-strip').length};
   });
   assert.ok(Math.abs(metrics.techTop-metrics.socialTop)<5,'TECH and CANAUX must share a row: '+JSON.stringify(metrics));
   assert.ok(metrics.socialLeft>=metrics.techRight-5,'Social card is beside TECH: '+JSON.stringify(metrics));
   assert.ok(metrics.documentWidth<=metrics.viewportWidth+6,'Horizontal overflow on '+width+': '+JSON.stringify(metrics));
   tg=telegram;
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!document.querySelector('#hnSocialTG')?.hidden,{timeout:12000});
   assert.equal(await page.locator('#hnSocialTG').getAttribute('href'),telegram);
   assert.equal(await page.locator('#hnSocialTGPending').isHidden(),true);
   await page.evaluate(()=>{document.documentElement.lang='ar'});
   await page.waitForFunction(()=>document.querySelector('#hnSocialTitle')?.textContent.includes('قنوات'));
   console.log('PASS HORENOVA intro '+width+'px: no overlapping banner, TECH+CANAUX adjacent, genuine WA/TG links, FR/AR');
   await context.close();
  }
 }finally{await browser.close();app.close()}
})().catch(error=>{console.error('FAIL home channels layout: '+error.stack);process.exitCode=1});
