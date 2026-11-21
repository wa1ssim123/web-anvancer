'use strict';
/* HORENOVA safe production smoke: no valid auth, no real ID, no writes. */
const assert=require('node:assert/strict');
const url='https://horenova-hub-api.onrender.com/api/recruiter-requests/not-a-valid-id';
const origins=['https://horenova.com','https://www.horenova.com'];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function check(origin){
 let last='No result';
 for(let attempt=0;attempt<8;attempt++){
  try{
   const result=await fetch(url,{
    method:'OPTIONS',
    headers:{
     Origin:origin,
     'Access-Control-Request-Method':'DELETE',
     'Access-Control-Request-Headers':'authorization'
    },
    signal:AbortSignal.timeout(16000)
   });
   const methods=result.headers.get('access-control-allow-methods')||'';
   const allowHeaders=result.headers.get('access-control-allow-headers')||'';
   const echoedOrigin=result.headers.get('access-control-allow-origin')||'';
   last='status='+result.status+', methods='+methods+', headers='+allowHeaders+', origin='+echoedOrigin;
   if(result.status===204&&methods.split(',').map(v=>v.trim()).includes('DELETE')&&
     /authorization/i.test(allowHeaders)&&echoedOrigin===origin){
     console.log('PASS production mobile DELETE CORS preflight '+origin+' '+last);
     return;
   }
  }catch(e){last=String(e?.message||e).slice(0,200)}
  if(attempt<7)await sleep(5000);
 }
 assert.fail('FAILED production deletion CORS preflight at '+origin+': '+last);
}
(async()=>{
 for(const origin of origins)await check(origin);
 console.log('PASS HORENOVA API accepts DELETE preflight for both official hostnames. No advertisements touched.');
})().catch(e=>{console.error(e.stack);process.exitCode=1});
