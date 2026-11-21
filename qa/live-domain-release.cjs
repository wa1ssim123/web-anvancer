'use strict';
/* Public production smoke: verifies actual domain content, not only GitHub files. */
const assert=require('node:assert/strict');
const release='2026.11.21.support-no-art-v8';
const asset='support-no-art-v8';
const bases=['https://horenova.com','https://horenova-site-officiel.onrender.com'];
const checks=[
 {path:'/version.json',verify:s=>{try{return JSON.parse(s).version===release}catch{return false}}},
 {path:'/support.html',verify:s=>s.includes('id="hsQuickDemand"')&&s.includes('support.js?v='+asset)&&s.includes('Assistance 24 h/24')},
 {path:'/admin.html',verify:s=>s.includes('admin.js?v='+asset)&&s.includes('horenova-admin-cases-v2.css?v='+asset)},
 {path:'/admin.js',verify:s=>s.includes('data-quickprint-id')&&s.includes('Imprimer la candidature avec photo')},
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
 console.log('PASS production HORENOVA custom domain and Render: current support, admin printing, version, launcher.');
})().catch(e=>{console.error(e.stack);process.exitCode=1});
