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
  ['/communaute.html',['communaute.js','hcFollow','hcTelegramFollow','communaute-telegram.css','hcOffers','hcSearch','hn-language-control']],
  ['/', ['/communaute.html','home-social-cards.css','hn-intro-shortcut-social','hnSocialTG']],
  ['/jobs.html',['/communaute.html','community-inline.css']],
  ['/shifts.html',['/communaute.html','community-inline.css']],
  ['/admin.html',['#hnWhatsappChannelAdmin','#hnTelegramChannelAdmin','telegram-admin.css','channel-admin.css']]
 ]){
  const r=await request(WEB+route);
  assert.equal(r.status,200,'Missing public/community page '+route);
  for(const marker of expected)assert.ok(r.body.includes(marker),route+' missing '+marker);
  if(route==='/' )assert.ok(!r.body.includes('hn-home-channel-strip'),'Previously overlapping banner must be removed');
  console.log('PASS HORENOVA release route '+route);
 }
 const [js,css,adminJs]=await Promise.all([
  request(WEB+'/communaute.js'),request(WEB+'/communaute-telegram.css'),request(WEB+'/telegram-admin.js')
 ]);
 for(const [name,r] of [['community script',js],['Telegram community styling',css],['Telegram admin control',adminJs]])
  assert.equal(r.status,200,'Missing '+name);
 const channel=await request(API+'/api/community/channel');
 assert.equal(channel.status,200);
 const status=JSON.parse(channel.body);
 assert.equal(typeof status.active,'boolean');
 if(status.active){
  assert.match(status.url,/^https:\/\/whatsapp\.com\/channel\/[A-Za-z0-9_-]{12,128}$/);
 }else assert.equal(status.url,null,'No admin-supplied channel must mean no public fake URL');
 const telegram=await request(API+'/api/community/telegram');
 assert.equal(telegram.status,200,'Telegram channel endpoint must exist');
 const tg=JSON.parse(telegram.body);
 assert.equal(typeof tg.active,'boolean');
 if(tg.active)assert.match(tg.url,/^https:\/\/t\.me\/[A-Za-z][A-Za-z0-9_]{4,31}$/);
 else assert.equal(tg.url,null,'No imaginary Telegram channel link');
 const tgUnauthorized=await request(API+'/api/community/telegram',{
  method:'PATCH',headers:{Origin:WEB,'Content-Type':'application/json'},
  body:JSON.stringify({url:'https://t.me/Horenova_Maroc'})
 });
 assert.equal(tgUnauthorized.status,401,'Anonymous visitor cannot publish Telegram');
 const unauthorized=await request(API+'/api/community/channel',{
  method:'PATCH',headers:{Origin:WEB,'Content-Type':'application/json'},
  body:JSON.stringify({url:'https://whatsapp.com/channel/0029VaABCDEFGH12345'})
 });
 assert.equal(unauthorized.status,401,'Anonymous callers cannot activate channel links');
 const fromEvil=await request(API+'/api/community/channel',{headers:{Origin:'https://example-attacker.invalid'}});
 assert.equal(fromEvil.status,403,'Foreign websites cannot read the API through browser CORS');
 console.log('PASS HORENOVA live social release: no mobile banner, verified WhatsApp, safe Telegram pending, admin-only activation');
})().catch(e=>{console.error('FAIL HORENOVA channel live release '+e.stack);process.exitCode=1;});
