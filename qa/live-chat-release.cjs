'use strict';
/* Read-only production smoke: checks the published recruitment chat without sending real messages. */
const assert=require('node:assert/strict');
const bases=['https://horenova.com','https://horenova-site-officiel.onrender.com'];
const api='https://horenova-hub-api.onrender.com';
async function request(url,options={}){
 let last;
 for(let retry=0;retry<5;retry++){
  try{
   const res=await fetch(url,{redirect:'follow',cache:'no-store',signal:AbortSignal.timeout(20000),...options});
   return {status:res.status,body:await res.text(),headers:res.headers};
  }catch(e){last=e;if(retry<4)await new Promise(r=>setTimeout(r,2500))}
 }
 throw last;
}
(async()=>{
 for(const base of bases){
  const page=await request(base+'/conversations.html');
  assert.equal(page.status,200,'chat page not published at '+base);
  assert.match(page.body,/hcTabMatching/);
  assert.match(page.body,/conversations-v2\.css/);
  const source=await request(base+'/conversations.js?v=private-matching-20261122');
  assert.equal(source.status,200,'chat script not published at '+base);
  assert.match(source.body,/\/api\/chat\/direct-threads/);
  assert.match(source.body,/\/api\/admin\/match-directory/);
  const profile=await request(base+'/account.js');
  assert.match(profile.body,/Mes conversations privées/);
  console.log('PASS published chat interface and account shortcut '+base);
 }
 const health=await request(api+'/health');
 assert.equal(health.status,200,'API health failed');
 assert.equal(JSON.parse(health.body).ok,true,'API database unavailable');
 for(const url of ['/api/chat/threads','/api/admin/match-directory?kind=candidate']){
  const r=await request(api+url);
  assert.equal(r.status,401,'Private endpoint must reject unauthenticated visitors: '+url);
  console.log('PASS authenticated-only endpoint '+url);
 }
 const preflight=await fetch(api+'/api/chat/direct-threads',{
  method:'OPTIONS',
  headers:{Origin:'https://horenova.com','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'},
  signal:AbortSignal.timeout(20000)
 });
 assert.equal(preflight.status,204);
 assert.equal(preflight.headers.get('access-control-allow-origin'),'https://horenova.com');
 assert.ok((preflight.headers.get('access-control-allow-methods')||'').includes('POST'));
 console.log('PASS HORENOVA recruitment live release / permitted origins and no data leak');
})().catch(e=>{console.error('FAIL live recruitment release '+e.stack);process.exitCode=1;});