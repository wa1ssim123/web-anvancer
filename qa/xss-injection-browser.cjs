'use strict';
/* Browser XSS regression against the actual public job/talent renderers.
   Inputs are malicious fixtures only. No real user profiles are read or mutated. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const source=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const html='<html lang="fr"><head><title>HORENOVA XSS Regression</title></head><body>'+
   '<div id="jobsGrid"></div><div id="shiftGrid"></div><div id="talentGrid"></div>'+
   '<div id="jobDetail"></div><div id="talentDetail"></div><div id="profileData"></div>'+
   '<div id="matchDeck"></div><div id="matchIndex"></div><div id="matchTotal"></div>'+
   '</body></html>';
  await page.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(u.host==='horenova.test'&&u.pathname.endsWith('/job.html'))
    return route.fulfill({status:200,contentType:'text/html',body:html});
   return route.fulfill({status:204,body:''});
  });
  await page.goto('https://horenova.test/job.html?id=evil',{waitUntil:'load'});
  await page.evaluate(()=>{
   window.__xssHits=0;
   localStorage.setItem('mihna-v3-temp',JSON.stringify({intent:'job',role:'<img src=x onerror=window.__xssHits++>',city:'<svg onload=window.__xssHits++>',saved:[]}));
  });
  await page.addScriptTag({content:source});
  const injected='<img src=x onerror="window.__xssHits++">';
  const svg='<svg onload="window.__xssHits++"></svg>';
  await page.evaluate(({injected,svg})=>{
   window.HORENOVA_LIVE_JOBS=[
    {id:'evil',kind:'job',title:injected,role:svg,city:injected,business:injected,details:svg,requirements:injected,businessType:svg,workplaceAddress:injected,contractType:injected,period:'/ mois',pay:injected,img:'javascript:alert(1)',sponsored:false},
    {id:'shift',kind:'shift',title:injected,role:svg,city:injected,business:injected,time:svg,period:'/ shift',pay:injected,img:'data:image/svg+xml,%3Csvg%20onload=alert(1)%3E'}
   ];
   window.HORENOVA_LIVE_TALENTS=[{id:'evil',name:injected,role:svg,city:injected,bio:svg,languages:injected,rating:0}];
   window.renderJobsPage();window.renderShifts();window.renderMatch();window.renderTalents();window.renderJobDetail();window.renderTalentDetail();window.init();
  },{injected,svg});
  await page.waitForTimeout(120);
  const result=await page.evaluate(()=>{
   return{
    xssHits:window.__xssHits||0,
    unsafeAttrs:document.querySelectorAll('[onerror],[onload]').length,
    unsafeImages:document.querySelectorAll('img[src^="javascript:"],img[src^="data:"]').length,
    jobText:document.querySelector('#jobsGrid h3')?.textContent||'',
    talentText:document.querySelector('#talentGrid h3')?.textContent||'',
    detailText:document.querySelector('#jobDetail h1')?.textContent||'',
    profileText:document.querySelector('#profileData')?.textContent||''
   };
  });
  assert.equal(result.xssHits,0,'No injected JS may execute');
  assert.equal(result.unsafeAttrs,0,'No injected inline event-handler attributes may be created');
  assert.equal(result.unsafeImages,0,'Untrusted URL schemes cannot be placed in image tags');
  assert.match(result.jobText,/<img src=x/,'Job text remains displayed as text, never markup');
  assert.match(result.talentText,/<img src=x/,'Talent text remains displayed as text');
  assert.match(result.detailText,/<img src=x/,'Job detail treats malicious title as text');
  assert.match(result.profileText,/<img src=x/,'Saved role is safely escaped');
  assert.deepEqual(errors,[],'Browser must not throw with hostile public content');
  console.log('PASS XSS: injected HTML, SVG, event handlers and unsafe URLs are inert in jobs, shifts, profiles, matches and talent pages');
  await context.close();
 }finally{await browser.close();}
})().catch(e=>{console.error('FAIL HORENOVA public-content XSS regression: '+e.stack);process.exitCode=1;});
