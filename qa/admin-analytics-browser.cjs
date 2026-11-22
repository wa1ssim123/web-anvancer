'use strict';
/* Real Chromium test for the admin-only audience dashboard, no live accounts or writes. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const fakeData={
 registrations:{candidates:27,recruiters:8,total:35,recent:[]},
 wixHistory:{from:'2026-11-10',through:'2026-11-22',sessions:318,uniqueVisitors:253,daily:[
  {date:'2026-11-10',sessions:59,uniqueVisitors:41},
  {date:'2026-11-11',sessions:76,uniqueVisitors:54},
  {date:'2026-11-20',sessions:160,uniqueVisitors:142},
  {date:'2026-11-21',sessions:22,uniqueVisitors:18}
 ]},
 firstParty:{uniqueBrowsers:5,sessions:7,todaySessions:2,last7Days:7,firstRecorded:'2026-11-22',daily:[{date:'2026-11-22',sessions:7,uniqueBrowsers:5}]}
};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/hn-api.js'){res.writeHead(200,{'Content-Type':'application/javascript'});return res.end('export async function hub(){throw Error("use test source");}');}
 if(url.pathname==='/admin-analytics.js'||url.pathname==='/admin-analytics.css'){
  const ext=url.pathname.endsWith('.js')?'application/javascript':'text/css';
  res.writeHead(200,{'Content-Type':ext});return res.end(fs.readFileSync(path.join(root,url.pathname.slice(1))));
 }
 res.writeHead(200,{'Content-Type':'text/html'});
 res.end('<!doctype html><html lang="fr" dir="ltr"><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/admin-analytics.css"></head><body style="margin:0"><main id="adminGate"></main></body></html>');
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [320,390,1280]){
   const page=await browser.newPage({viewport:{width,height:860},isMobile:width<500,hasTouch:width<500});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'load'});
   await page.evaluate(async data=>{
    const m=await import('/admin-analytics.js');
    m.mountAdminAnalytics(document.getElementById('adminGate'),async()=>data);
   },fakeData);
   await page.locator('#haRegistered').getByText('35').waitFor({timeout:4000});
   assert.equal(await page.locator('#haCandidates').innerText(),'27');
   assert.equal(await page.locator('#haRecruiters').innerText(),'8');
   assert.equal(await page.locator('#haWixVisitors').innerText(),'253');
   assert.equal(await page.locator('#haWixSessions').innerText(),'318');
   assert.equal(await page.locator('#haNewBrowsers').innerText(),'5');
   assert.equal(await page.locator('#haNewSessions').innerText(),'7');
   assert.equal(await page.locator('#haToday').innerText(),'2');
   assert.equal(await page.locator('#haWeek').innerText(),'7');
   assert.equal(await page.locator('.hn-audience-day').count(),4,'Historic Wix chart');
   await page.locator('#haLiveTab').click();
   assert.equal(await page.locator('.hn-audience-day').count(),1,'Separate new-tracker chart');
   assert.equal(await page.locator('#haLiveTab').getAttribute('aria-pressed'),'true');
   await page.evaluate(()=>{document.documentElement.lang='ar';document.documentElement.dir='rtl'});
   await page.waitForFunction(()=>document.querySelector('#haTitle')?.textContent.includes('الزوار'),null,{timeout:2500});
   assert.equal(await page.locator('#haCandidates').innerText(),new Intl.NumberFormat('ar-MA').format(27));
   await page.evaluate(()=>{document.documentElement.lang='en';document.documentElement.dir='ltr'});
   await page.waitForFunction(()=>document.querySelector('#haTitle')?.textContent.includes('Audience'),null,{timeout:2500});
   const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
   assert.ok(dims.scroll<=dims.width+4,'Horizontal overflow '+width+': '+JSON.stringify(dims));
   assert.deepEqual(errors,[],'No JS errors');
   console.log('PASS admin site analytics '+width+'px, 27 candidates, 8 recruiters, 253 Wix unique visitors, 318 visits, separate tracker and FR/AR/EN');
   await page.close();
  }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error('FAIL admin analytics '+e.stack);process.exitCode=1;});
