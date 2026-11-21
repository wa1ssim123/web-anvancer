'use strict';
/* Verify ACTUAL rendered support entry on public host and capture any inserted artwork above header. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const ORIGINS=['https://horenova.com','https://horenova-site-officiel.onrender.com'];
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
 for(const origin of ORIGINS){
  for(const screen of [{width:390,height:844},{width:1280,height:800}]){
   const context=await browser.newContext({viewport:screen,deviceScaleFactor:1,serviceWorkers:'allow',reducedMotion:'reduce'});
   const page=await context.newPage();
   const failures=[];page.on('pageerror',e=>failures.push(e.message));
   await page.goto(origin+'/support.html?qa=live-layout-20261121',{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForTimeout(800);
   const result=await page.evaluate(()=>{
    const header=document.querySelector('header.hs-top');
    const r=header?.getBoundingClientRect();
    const tags=[...document.body.children].slice(0,14).map(e=>{
      const box=e.getBoundingClientRect();
      return {tag:e.tagName,cls:e.className?.toString().slice(0,90),id:e.id,top:Math.round(box.top),height:Math.round(box.height)};
    });
    const topImages=[...document.querySelectorAll('img,svg,object,embed')].filter(e=>{
      const r=e.getBoundingClientRect();
      return r.top<1000&&r.bottom>0
    }).slice(0,35).map(e=>{
      const r=e.getBoundingClientRect();return {tag:e.tagName,src:e.getAttribute('src')||e.getAttribute('data')||'',outer:e.outerHTML.slice(0,180),top:Math.round(r.top),h:Math.round(r.height)};
    });
    return {url:location.href,headerTop:r?.top,headerHeight:r?.height,scrollY,scrollHeight:document.documentElement.scrollHeight,
      firstChildren:tags,topImages,whiskHtml:document.documentElement.outerHTML.includes('art-whisk.svg'),
      whiskResources:performance.getEntriesByType('resource').filter(x=>/art-(whisk|chefhat|coffee|zellige)/.test(x.name)).map(x=>x.name)};
   });
   console.log('LIVE_SUPPORT_DOM '+JSON.stringify({origin,screen,result,errors:failures}));
   await context.close();
  }
 }
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
