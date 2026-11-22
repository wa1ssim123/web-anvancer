'use strict';
/* Browser regression for the real recruiter shift form using mocked accounts and APIs. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const markup='<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/recruit-shift-calendar.css"></head><body data-hn12="recruit"><main id="recruitGate"></main><script type="module" src="/recruit-live.js"></script></body></html>';
const mocks={
 '/mihna-global.js':"export async function requireRole(){return {role:'recruiter',member:{id:'qa',loginEmail:'qa@example.invalid'}}};export const currentLang=()=> 'fr';",
 '/js/wix/items.js':"export async function queryItems(name){return {items:name==='RecruiterProfiles'?[{businessName:'Restaurant QA',businessType:'Restaurant',contactName:'QA',city:'Casablanca',phone:'0600000000',businessAddress:'Centre-ville, Casablanca'}]:[]}};export async function insertItem(name,data){window.__savedCms=data;return {_id:'qa-request-001'}};",
 '/hn-api.js':"export async function hub(p,opts){if(p==='/api/recruiter/workplace-photo/status')return {hasPhoto:true};if(p==='/api/recruiter-requests'&&opts?.method==='POST'){window.__savedCentral=opts.body;return {ok:true,emailQueued:false,emailEnabled:false}}if(p==='/api/recruiter-requests'||p==='/api/jobs/public'||p==='/api/applications')return {items:[]};throw Error('Unexpected API '+p)};export async function hubUploadWorkplacePhoto(){throw Error('Mock: no upload')};export async function hubPhoto(){return null};"
};
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [375,390,1280]){
   const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'});
   await context.route('https://horenova.qa/**',route=>{
    const url=new URL(route.request().url()),p=url.pathname;
    const body=p==='/recruit.html'?markup:p==='/recruit-live.js'?read('recruit-live.js'):p==='/recruit-shift-calendar.js'?read('recruit-shift-calendar.js'):p==='/recruit-shift-calendar.css'?read('recruit-shift-calendar.css'):mocks[p]||'Not found';
    return route.fulfill({status:body==='Not found'?404:200,contentType:p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html',body});
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('https://horenova.qa/recruit.html');
   await page.locator('#liveRecruitForm').waitFor({state:'visible'});
   await page.locator('[name="kind"]').selectOption('shift');
   await page.locator('#recruitShiftFields').waitFor({state:'visible'});
   assert.equal(await page.locator('[name="shiftDate"]').getAttribute('required'),'','Shift date must be required');
   assert.ok(await page.locator('#hnRecruitStartDateLabel').isHidden(),'Duplicate date field must not confuse shift recruiters');
   await page.locator('#hnShiftCalendarToggle').click();
   await page.locator('#hnShiftCalendar').waitFor({state:'visible'});
   await page.locator('#hnShiftCalendar [data-hn-month="1"]').click();
   const date=await page.locator('#hnShiftCalendar [data-hn-day="15"]').getAttribute('aria-label');
   await page.locator('#hnShiftCalendar [data-hn-day="15"]').click();
   assert.equal(await page.locator('[name="shiftDate"]').inputValue(),date);
   assert.equal(await page.locator('[name="startDate"]').inputValue(),date);
   await page.locator('[name="shiftStart"]').fill('10:00');
   await page.locator('[name="shiftEnd"]').fill('17:00');
   await page.locator('[name="shiftSlots"]').fill('2');
   await page.locator('[name="title"]').fill('Serveur extra événement');
   await page.locator('[name="requirements"]').fill('Service en salle, accueil, hygiène et ponctualité');
   await page.locator('#liveRecruitForm button[type="submit"]').click();
   await page.waitForFunction(()=>Boolean(window.__savedCentral),{timeout:5000});
   const saved=await page.evaluate(()=>({cms:window.__savedCms,central:window.__savedCentral}));
   assert.equal(saved.cms.kind,'shift');assert.equal(saved.cms.startDate,date);assert.equal(saved.cms.shiftDate,date);
   assert.equal(saved.central.startDate,date);assert.equal(saved.central.openings,2);
   assert.ok(saved.central.scheduleText.includes(date));
   assert.deepEqual(errors,[],'Uncaught page errors: '+JSON.stringify(errors));
   console.log('PASS recruiter shift form '+width+'px: calendar selectable, date saved in CMS and central request');
   await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error('FAIL recruiter shift form: '+e.stack);process.exitCode=1});
