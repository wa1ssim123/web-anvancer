'use strict';
/* Public production smoke: verifies actual domain content, not only GitHub files. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const localAdmin=fs.readFileSync(path.join(__dirname,'../admin.html'),'utf8');
const expectedAdminScript=localAdmin.match(/src="(\/admin\.js\?v=[^"]+)"/)?.[1];
const expectedAdminStyles=localAdmin.match(/href="(\/admin-social-mobile-fix\.css\?v=[^"]+)"/)?.[1];
assert.ok(expectedAdminScript&&expectedAdminStyles,'Admin release must link to current JS and CSS');
const release='2026.11.21.admin-delete-scroll-v9';
const asset='support-no-art-v8';
const bases=['https://horenova.com','https://horenova-site-officiel.onrender.com'];
const checks=[
 {path:'/version.json',verify:s=>{try{return JSON.parse(s).version===release}catch{return false}}},
 {path:'/support.html',verify:s=>s.includes('id="hsQuickDemand"')&&s.includes('support.js?v='+asset)&&s.includes('Assistance 24 h/24')},
 {path:'/admin.html',verify:s=>s.includes(expectedAdminScript)&&s.includes(expectedAdminStyles)&&s.includes('horenova-admin-cases-v2.css')},
 {path:'/social-publications-admin.js',verify:s=>s.includes('social-promo-share.js')&&s.includes('copyJobMessage')&&s.includes('copyRandomPhoto')&&!s.includes('secondaryActions')&&!s.includes('copyWithPoster')},
 {path:'/social-promo-share.js',verify:s=>s.includes('nextPromoImage')&&s.includes('buildPromoMessage')&&s.includes('d0158d_94f90047')},
 {path:'/admin.js',verify:s=>s.includes('data-quickprint-id')&&s.includes('Imprimer la candidature avec photo')&&s.includes('data-request-remove')},
 {path:'/admin-overview.js',verify:s=>s.includes('data-remove-id')&&s.includes('hn-admin-listing-removed')},
 {path:'/horenova-admin-cases-v2.css',verify:s=>s.includes('#adminGate #hubRecruiterRequests.hub-stack')&&s.includes('hn-admin-remove-btn')},
 {path:'/pwa-register.js',verify:s=>s.includes("const BUILD='"+release+"'")&&s.includes("link.href='/support.html'")}
];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function fetchText(url){
 const response=await fetch(url,{redirect:'follow',headers:{'Cache-Control':'no-cache','Pragma':'no-cache'},signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('HTTP '+response.status+' at '+url);
 return response.text();
}
(async()=>{
 for(const base of bases){
  for(const check of checks){
   let ok=false,last='No response';
   for(let attempt=1;attempt<=8;attempt++){
    try{
     const text=await fetchText(base+check.path);
     ok=check.verify(text);
     last=ok?'match':'content mismatch';
    }catch(error){last=String(error?.message||error).slice(0,160)}
    if(ok)break;
    if(attempt<8)await sleep(15000);
   }
   console.log((ok?'PASS':'FAIL')+' '+base+check.path+' '+last);
   assert.ok(ok,'Actual public site did not serve latest HORENOVA release at '+base+check.path+' ('+last+')');
  }
 }

 // Real browser preflight: previously Access-Control-Allow-Methods omitted DELETE,
 // causing the iPhone to report the API as unavailable before hitting the route.
 const preflightUrl='https://horenova-hub-api.onrender.com/api/recruiter-requests/not-a-valid-uuid';
 let validated=false,last='No response';
 for(let attempt=1;attempt<=10;attempt++){
  try{
   const response=await fetch(preflightUrl,{
    method:'OPTIONS',
    headers:{
      Origin:'https://horenova.com',
      'Access-Control-Request-Method':'DELETE',
      'Access-Control-Request-Headers':'authorization'
    },
    signal:AbortSignal.timeout(15000)
   });
   const methods=response.headers.get('access-control-allow-methods')||'';
   const headers=response.headers.get('access-control-allow-headers')||'';
   const origin=response.headers.get('access-control-allow-origin')||'';
   validated=response.status===204&&methods.split(',').map(x=>x.trim()).includes('DELETE')&&/authorization/i.test(headers)&&origin==='https://horenova.com';
   last='HTTP '+response.status+'; origin='+origin+'; methods='+methods+'; headers='+headers;
  }catch(error){last=String(error?.message||error).slice(0,150)}
  if(validated)break;
  if(attempt<10)await sleep(12000);
 }
 console.log((validated?'PASS':'FAIL')+' production DELETE CORS preflight '+last);
 assert.ok(validated,'Browser cannot delete HORENOVA jobs because API preflight is incorrect: '+last);
 console.log('PASS production HORENOVA custom domain and Render: current support, admin printing, version, launcher.');
})().catch(e=>{console.error(e.stack);process.exitCode=1});
