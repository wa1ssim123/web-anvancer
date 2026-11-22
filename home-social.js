/* HORENOVA homepage channels: independent links, no fixed overlays.
 * Telegram stays inactive until an administrator publishes a real channel URL.
 */
(()=>{
 'use strict';
 const tg=document.getElementById('hnSocialTG');
 const pending=document.getElementById('hnSocialTGPending');
 const wa=document.getElementById('hnSocialWA');
 const title=document.getElementById('hnSocialTitle');
 const overline=document.getElementById('hnSocialOverline');
 if(!tg||!pending||!wa||!title||!overline)return;
 const API='https://horenova-hub-api.onrender.com';
 const texts={
   fr:{over:'POUR RESTER CONNECTÉ',title:'CANAUX',wa:'WhatsApp ↗',tg:'Telegram ↗',pending:'Telegram bientôt'},
   en:{over:'STAY CONNECTED',title:'CHANNELS',wa:'WhatsApp ↗',tg:'Telegram ↗',pending:'Telegram soon'},
   ar:{over:'تابع جديدنا',title:'قنواتنا',wa:'واتساب ↗',tg:'تيليغرام ↗',pending:'تيليغرام قريباً'}
 };
 function language(){
  const current=(document.documentElement.lang||'fr').slice(0,2);
  return texts[current]||texts.fr;
 }
 function refreshLabels(){
  const t=language();
  overline.textContent=t.over;
  title.firstChild&&title.firstChild.nodeType===3?title.firstChild.nodeValue=t.title+' ':title.insertBefore(document.createTextNode(t.title+' '),title.firstChild);
  wa.textContent=t.wa;tg.textContent=t.tg;pending.textContent=t.pending;
 }
 function safeWhatsApp(value){
  try{
   const u=new URL(value),m=u.pathname.match(/^\/channel\/([A-Za-z0-9_-]{12,128})\/?$/);
   return u.protocol==='https:'&&['whatsapp.com','www.whatsapp.com'].includes(u.hostname)&&!u.search&&!u.hash&&m?'https://whatsapp.com/channel/'+m[1]:null;
  }catch{return null}
 }
 function safeTelegram(value){
  try{
   const u=new URL(value),m=u.pathname.match(/^\/([A-Za-z][A-Za-z0-9_]{4,31})\/?$/);
   return u.protocol==='https:'&&['t.me','telegram.me','www.t.me','www.telegram.me'].includes(u.hostname)&&!u.search&&!u.hash&&m?'https://t.me/'+m[1]:null;
  }catch{return null}
 }
 async function load(kind){
  try{
   const response=await fetch(API+'/api/community/'+(kind==='telegram'?'telegram':'channel'),{cache:'no-store',signal:AbortSignal.timeout(10000)});
   if(!response.ok)return;
   const data=await response.json();
   const url=data.active?(kind==='telegram'?safeTelegram(data.url):safeWhatsApp(data.url)):null;
   if(kind==='telegram'){
     if(url){tg.href=url;tg.hidden=false;pending.hidden=true}
     else{tg.hidden=true;tg.removeAttribute('href');pending.hidden=false}
   }else if(url){wa.href=url;wa.hidden=false}
   else{wa.hidden=true;wa.removeAttribute('href')}
  }catch{/* Keep the verified WhatsApp fallback; unavailable Telegram is never clickable. */}
 }
 const observer=new MutationObserver(refreshLabels);
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 refreshLabels();
 void Promise.allSettled([load('whatsapp'),load('telegram')]);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void load('telegram')});
})();
