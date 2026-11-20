'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const {renderMail}=require('../backend/mail-templates.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const lang of ['fr','en','ar'])for(const kind of ['candidate','job','shift']){
   const email=renderMail(kind,{firstName:'Yasmine',contactName:'Sofia',
     jobTitle:'Serveur expérimenté en restauration gastronomique · service en salle',
     businessName:'Complexe Restaurant & Hôtel',city:'Casablanca',
     scheduleText:'2026-12-01 · 18:00–23:00'},lang);
   for(const width of [320,390,620,1024]){
    const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
    await page.route('**/*',route=>{
     const pathname=new URL(route.request().url()).pathname;
     const file=pathname==='/assets/horenova-email-candidate.gif'?'horenova-email-candidate.gif':
       pathname==='/assets/horenova-email-recruiter.gif'?'horenova-email-recruiter.gif':null;
     if(file)return route.fulfill({status:200,contentType:'image/gif',body:fs.readFileSync(path.join(__dirname,'../assets',file))});
     return route.fulfill({status:204,body:''});
    });
    await page.setContent(email.html,{waitUntil:'domcontentloaded'});
    const image=await page.evaluate(async()=>{
      const element=document.querySelector('img[src$=".gif"]');
      if(!element)return null;
      await element.decode();
      return {w:element.naturalWidth,h:element.naturalHeight,complete:element.complete};
    });
    assert.deepEqual(image,{w:112,h:112,complete:true},'Animated image must decode in Chromium');
    const dims=await page.evaluate(()=>({
      screen:innerWidth,
      document:document.documentElement.scrollWidth,
      button:[...document.querySelectorAll('a')].find(a=>a.href.includes('/account.html')||a.href.includes('/recruit.html'))?.getBoundingClientRect().toJSON(),
      title:document.querySelector('h1')?.textContent,
      dir:document.documentElement.dir
    }));
    assert.ok(dims.document<=width+2,kind+'/'+lang+'/'+width+' horizontal overflow '+JSON.stringify(dims));
    assert.ok(dims.button&&dims.button.width>110&&dims.button.right<=width+2,'CTA outside screen: '+JSON.stringify(dims));
    assert.ok(dims.title?.trim());
    assert.equal(dims.dir,lang==='ar'?'rtl':'ltr');
    await page.close();
   }
   console.log('PASS email visual '+kind+' '+lang);
  }
 }finally{await browser.close();}
})().catch(e=>{console.error('Email visual QA failed',e);process.exitCode=1});
