'use strict';
/* Read-only HORENOVA production release check.
 * This never creates a channel, sends content or changes private accounts. */
const assert=require('node:assert/strict');
const WEB='https://horenova.com',API='https://horenova-hub-api.onrender.com';
async function request(url,options={}){
 const res=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(45000),...options});
 return {status:res.status,headers:res.headers,body:await res.text()};
}
(async()=>{
 for(const [route,expected] of [
  ['/communaute.html',['communaute.js','hcFollow','hcOffers','hcSearch','hn-language-control']],
  ['/', ['/communaute.html','community-home.css']],
  ['/jobs.html',['/communaute.html','community-inline.css']],
  ['/shifts.html',['/communaute.html','community-inline.css']],
  ['/admin.html',['#hnWhatsappChannelAdmin','channel-admin.css']]
 ]){
  const r=await request(WEB+route);
  assert.equal(r.status,200,'Missing public/community page '+route);
  for(const marker of expected)assert.ok(r.body.includes(marker),route+' missing '+marker);
  console.log('PASS HORENOVA release route '+route);
 }
 const [js,css,adminJs]=await Promise.all([
  request(WEB+'/communaute.js'),request(WEB+'/communaute.css'),request(WEB+'/channel-admin.js')
 ]);
 for(const [name,r] of [['community script',js],['community styling',css],['admin control',adminJs]])
  assert.equal(r.status,200,'Missing '+name);
 const channel=await request(API+'/api/community/channel');
 assert.equal(channel.status,200);
 const status=JSON.parse(channel.body);
 assert.equal(typeof status.active,'boolean');
 if(status.active){
  assert.match(status.url,/^https:\/\/whatsapp\.com\/channel\/[A-Za-z0-9_-]{12,128}$/);
 }else assert.equal(status.url,null,'No admin-supplied channel must mean no public fake URL');
 const unauthorized=await request(API+'/api/community/channel',{
  method:'PATCH',headers:{Origin:WEB,'Content-Type':'application/json'},
  body:JSON.stringify({url:'https://whatsapp.com/channel/0029VaABCDEFGH12345'})
 });
 assert.equal(unauthorized.status,401,'Anonymous callers cannot activate channel links');
 const fromEvil=await request(API+'/api/community/channel',{headers:{Origin:'https://example-attacker.invalid'}});
 assert.equal(fromEvil.status,403,'Foreign websites cannot read the API through browser CORS');
 console.log('PASS HORENOVA live channel release: public site, admin control, authentic stored link only and server access restrictions');
})().catch(e=>{console.error('FAIL HORENOVA channel live release '+e.stack);process.exitCode=1;});
