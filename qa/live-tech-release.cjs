'use strict';
/* Production release verification; read-only and no real accounts or orders touched. */
const assert=require('node:assert/strict');
const site='https://horenova.com';
const render='https://horenova-site-officiel.onrender.com';
const api='https://horenova-hub-api.onrender.com';
async function get(url,options={}){
 const r=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(20000),cache:'no-store',...options});
 return {status:r.status,url:r.url,contentType:r.headers.get('content-type'),body:await r.text()};
}
(async()=>{
 for(const origin of [render,site]){
  for(const [path,needle] of [
   ['/tech.html','HORENOVA TECH'],
   ['/tech-demo.html','PROTOTYPE LOCAL'],
   ['/tech-console.html','HORENOVA TECH PRO'],
   ['/tech-menu.html','HORENOVA TAP MENU']
  ]){
   const r=await get(origin+path);
   assert.equal(r.status,200,origin+path+' returned HTTP '+r.status);
   assert.ok(r.body.includes(needle),origin+path+' missing expected release content');
   console.log('PASS live Tech page '+origin+path);
  }
 }
 const alive=await get(api+'/health');
 assert.equal(alive.status,200,'Horenova API health is failing');
 assert.equal(JSON.parse(alive.body).ok,true);
 const unauth=await get(api+'/api/tech/venues');
 assert.equal(unauth.status,401,'Unauthenticated Tech venue list must be protected');
 const missing=await get(api+'/api/tech/menu/does-not-exist');
 assert.equal(missing.status,404,'Public menu endpoint must be mounted and return 404 for unknown venues');
 console.log('PASS public API and protected venue access');
})().catch(e=>{console.error('FAIL live Tech release: '+e.stack);process.exitCode=1;});