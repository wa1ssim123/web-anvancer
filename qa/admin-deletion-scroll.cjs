'use strict';
/* Synthetic Chromium integration: verify mobile recruitment scroll and two
 * independent administrator delete entry points, without touching real records. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const sources={admin:read('admin.js'),overview:read('admin-overview.js'),printer:read('admin-print.js')};
const jobs=Array.from({length:7},(_,i)=>({
  id:('00000000-0000-4000-8000-'+String(100000000000+i)),
  kind:i%2?'shift':'job',status:i===4?'REFUSEE':'VALIDEE',
  job_title:'Annonce fictive '+(i+1),job_role:'Serveur',city:'Casablanca',
  business_name:'HORENOVA Test',workplace_address:'Aucun lieu réel',contract_type:'CDI',
  salary_text:'À préciser',description:'Dossier de test',schedule_text:'8h-16h',
  created_at:'2026-11-21T01:00:00Z',has_workplace_photo:false
}));
const html='<html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body data-hn12="admin"><header class="hn12-top" style="background:#141b24;color:#fff"><span>HORENOVA</span></header><main class="hn12-page"><section class="hn12-section hn12-paper"><div id="adminGate" class="admin-grid"></div></section></main><nav class="hn12-dock" style="position:fixed;bottom:0;left:0;right:0;z-index:500;min-height:78px;background:#10151f;color:white"><span>Admin</span><span>Demandes</span><span>Dossiers</span><span>Chat</span><span>Profil</span></nav><script type="module" src="/admin.js"></script></body></html>';
const api=`
let requests=${JSON.stringify(jobs)},deletions=[];
window.__deletions=deletions;
export async function hub(route,options={}){
  if(route==='/api/support/threads')return {items:[]};
  if(route==='/api/jobs/public')return {items:requests.filter(x=>x.status==='VALIDEE').map(x=>({...x,kind:x.kind}))};
  if(route==='/api/recruiter-requests')return {items:requests};
  if(route==='/api/applications')return {items:[]};
  if(route==='/api/admin/email-status')return {enabled:false,states:[]};
  if(route.startsWith('/api/recruiter-requests/')&&options.method==='DELETE'){
    const id=route.split('/').at(-1);const row=requests.find(r=>r.id===id);
    if(!row)throw Error('Annonce absente');
    deletions.push(id);requests=requests.filter(r=>r.id!==id);
    return {ok:true,removed:true,id};
  }
  if(route.startsWith('/api/recruiter-requests/')&&options.method==='PATCH'){
    return {ok:true};
  }
  throw Error('Unexpected mock API: '+route);
}
export async function hubPhoto(){return null;}
`;
async function main(){
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,1280]){
  const ctx=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://horenova.test/**',route=>{
    const url=new URL(route.request().url()),pathname=url.pathname;
    const modules={
      '/admin.html':['text/html',html],
      '/admin.js':['text/javascript',sources.admin],
      '/admin-overview.js':['text/javascript',sources.overview],
      '/admin-print.js':['text/javascript',sources.printer],
      '/mihna-global.js':['text/javascript',"export async function requireRole(){return {role:'admin',email:'admin@example.invalid'}}"],
      '/hn-api.js':['text/javascript',api],
      '/js/wix/items.js':['text/javascript','export async function countItems(){return 0;}']
    };
    const result=modules[pathname];
    return result?route.fulfill({status:200,contentType:result[0],body:result[1]}):route.fulfill({status:404,body:''});
  });
  await page.goto('https://horenova.test/admin.html',{waitUntil:'domcontentloaded'});
  for(const css of ['styles.css','horenova-v12.css','hn-hub.css','horenova-adaptive-v1.css','horenova-admin-cases-v2.css'])await page.addStyleTag({path:path.join(root,css)});
  await page.locator('#hubRecruiterRequests [data-request-remove]').first().waitFor({state:'visible',timeout:8000});
  await page.locator('#hnPublicationRows [data-remove-id]').first().waitFor({state:'visible',timeout:8000});
  assert.equal(await page.locator('#hubRecruiterRequests [data-request-id]').count(),7);
  const values=await page.evaluate(()=>{
    const e=document.getElementById('hubRecruiterRequests');
    return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
      scrollHeight:document.documentElement.scrollHeight,requestScroll:getComputedStyle(e).overflowY,
      requestMax:getComputedStyle(e).maxHeight,pageOverflow:getComputedStyle(document.body).overflowY};
  });
  assert.ok(values.scrollWidth<=width+3,'Unexpected horizontal overflow: '+JSON.stringify(values));
  if(width===390){
    assert.equal(values.requestMax,'none','Recruitment list should not be height-clipped');
    assert.notEqual(values.requestScroll,'auto','No nested scroll trap for recruiter request list');
    await page.locator('#adminRecruiterRequests').evaluate(e=>window.scrollTo(0,e.getBoundingClientRect().top+window.scrollY-110));
    const start=await page.evaluate(()=>window.scrollY);
    const point=await page.locator('#hubRecruiterRequests [data-request-id]').first().boundingBox();
    await page.mouse.move(Math.max(50,Math.min(350,point.x+point.width/2)),Math.max(165,Math.min(610,point.y+point.height/2)));
    for(let i=0;i<10;i++)await page.mouse.wheel(0,540);
    await page.waitForTimeout(400);
    const end=await page.evaluate(()=>window.scrollY);
    const bottom=await page.locator('#hubRecruiterRequests [data-request-id]').last().boundingBox();
    assert.ok(end>start+250,'Page scroll remained stuck inside recruiter requests: '+JSON.stringify({start,end,values}));
    assert.ok(bottom.y+bottom.height<=844-78+12,'Last request cannot rise above fixed admin dock: '+JSON.stringify({bottom,end}));
  }
  // Cancel preserves the ad, then accept removes it from both admin regions.
  page.once('dialog',d=>d.dismiss());
  await page.locator('#hubRecruiterRequests [data-request-remove]').first().click();
  assert.equal(await page.locator('#hubRecruiterRequests [data-request-id]').count(),7);
  page.once('dialog',d=>d.accept());
  await page.locator('#hubRecruiterRequests [data-request-remove]').first().click();
  await page.waitForFunction(()=>document.querySelectorAll('#hubRecruiterRequests [data-request-id]').length===6);
  await page.waitForFunction(()=>document.querySelectorAll('#hnPublicationRows [data-remove-id]').length===6);
  assert.equal(await page.evaluate(()=>window.__deletions.length),1,'One deletion should run after confirmation');
  page.once('dialog',d=>d.accept());
  await page.locator('#hnPublicationRows [data-remove-id]').first().click();
  await page.waitForFunction(()=>document.querySelectorAll('#hubRecruiterRequests [data-request-id]').length===5);
  assert.equal(await page.evaluate(()=>window.__deletions.length),2,'Publication screen removal should update central recruitment list');
  assert.deepEqual(errors,[],'Admin JavaScript errors: '+errors.join('; '));
  await ctx.close();
  console.log('PASS admin recruit scroll + confirmed deletion (publication and requests), '+width+'px');
 }
}finally{await browser.close();}
}
main().catch(e=>{console.error(e.stack);process.exitCode=1});
