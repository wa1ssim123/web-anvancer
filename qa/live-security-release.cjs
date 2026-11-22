'use strict';
/* Read-only security smoke against the DEPLOYED API.
   No real accounts, uploads, messages or database mutations are used. */
const assert=require('node:assert/strict');
const api='https://horenova-hub-api.onrender.com';
async function probe(path,options={}){
 const response=await fetch(api+path,{cache:'no-store',signal:AbortSignal.timeout(60000),...options});
 const body=await response.text();
 return {status:response.status,headers:response.headers,body};
}
(async()=>{
 const health=await probe('/health');
 assert.equal(health.status,200,'API health must remain available');
 assert.equal(JSON.parse(health.body).ok,true,'API must reach PostgreSQL');
 const secureHeaders={
  'x-content-type-options':'nosniff',
  'x-frame-options':'DENY',
  'referrer-policy':'no-referrer',
  'strict-transport-security':'max-age=31536000'
 };
 for(const [name,value] of Object.entries(secureHeaders))
  assert.equal(health.headers.get(name),value,'Missing API security response header '+name);
 assert.match(health.headers.get('content-security-policy')||'',/default-src 'none'/);
 for(const path of ['/api/me','/api/applications','/api/chat/threads',
  '/api/analytics/admin','/api/tech/venues','/api/support/threads']){
  const r=await probe(path);
  assert.equal(r.status,401,'Private route must reject unauthenticated callers: '+path);
  assert.equal(r.headers.get('x-content-type-options'),'nosniff');
 }
 const rejected=await probe('/api/jobs/public',{headers:{Origin:'https://malicious-example.invalid'}});
 assert.equal(rejected.status,403,'Unapproved browser origins must be rejected');
 assert.equal(rejected.headers.get('access-control-allow-origin'),null,'Never echo hostile origin');
 const preflight=await probe('/api/jobs/public',{method:'OPTIONS',headers:{
  Origin:'https://horenova.com','Access-Control-Request-Method':'GET'
 }});
 assert.equal(preflight.status,204,'First-party CORS must remain allowed');
 assert.equal(preflight.headers.get('access-control-allow-origin'),'https://horenova.com');
 const invalid=await probe('/health',{method:'PROPFIND'});
 assert.equal(invalid.status,405,'Unexpected HTTP methods are rejected');
 console.log('PASS DEPLOYED HORENOVA security: health, headers, all six private routes, first-party CORS, hostile origins and methods');
})().catch(e=>{console.error('FAIL deployed HORENOVA security '+e.stack);process.exitCode=1;});
