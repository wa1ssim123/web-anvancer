import {hub} from '/hn-api.js';
/* Admin-only Telegram channel publisher. The account owner must create their
   own Telegram public channel and paste its real link here. */
const STR={
 fr:{eyebrow:'HORENOVA · TELEGRAM',title:'Votre chaîne Telegram officielle',
 intro:"Créez une chaîne publique HORENOVA dans Telegram, puis collez son lien ici. Le bouton de suivi s'activera automatiquement sur HORENOVA, sans redéploiement.",
 label:'Lien public de la chaîne',save:'Activer la chaîne Telegram',remove:'Retirer le lien',preview:'Voir la page publique ↗',hint:'Format : https://t.me/nom_du_canal',
 published:'Lien Telegram publié :',none:'Aucune chaîne Telegram reliée pour le moment.',bad:'Collez le vrai lien public de votre chaîne, commençant par https://t.me/.',saved:'Lien Telegram enregistré : le bouton public est activé.',removed:'Lien masqué sur HORENOVA. Votre chaîne Telegram est conservée.',error:'Impossible de charger ou enregistrer le lien. Vérifiez votre connexion admin.',confirm:'Retirer ce lien Telegram du site HORENOVA ?',guide:'Dans Telegram : nouveau message → Nouvelle chaîne → nom HORENOVA → choisir « Chaîne publique » → définir un nom d’utilisateur → copier le lien t.me.',privacy:'Ce réglage relie seulement la chaîne. Les nouvelles offres approuvées pourront être publiées automatiquement lorsque le bot officiel Telegram sera configuré sur le serveur et autorisé à publier dans cette chaîne.'},
 en:{eyebrow:'HORENOVA · TELEGRAM',title:'Your official Telegram channel',
 intro:'Create a public HORENOVA channel in Telegram and paste the real URL here. The follow button will activate without a new deployment.',
 label:'Public channel URL',save:'Activate Telegram channel',remove:'Remove channel link',preview:'View public page ↗',hint:'Format: https://t.me/channel_username',
 published:'Published Telegram URL:',none:'No Telegram channel linked yet.',bad:'Paste the real public channel URL starting with https://t.me/.',saved:'Telegram link saved. The public follow button is active.',removed:'Link hidden from HORENOVA. Your Telegram channel remains unchanged.',error:'Unable to read or save the link. Check your admin session.',confirm:'Remove this Telegram link from HORENOVA?',guide:'In Telegram: new message → New Channel → HORENOVA → choose Public Channel → choose a username → copy its t.me link.',privacy:'This setting only links your channel. New admin-approved vacancies can be posted automatically once the official Telegram bot is configured on the server and allowed to publish in this channel.'},
 ar:{eyebrow:'هورينوفا · تيليغرام',title:'قناة هورينوفا الرسمية على تيليغرام',
 intro:'أنشئ قناة عامة باسم هورينوفا في تيليغرام والصق رابطها الرسمي هنا. سيظهر زر المتابعة تلقائياً على الموقع.',
 label:'رابط القناة العامة',save:'تفعيل قناة تيليغرام',remove:'إزالة الرابط',preview:'الصفحة العامة ↗',hint:'الصيغة: https://t.me/channel_username',
 published:'الرابط المنشور:',none:'لم يتم ربط قناة تيليغرام بعد.',bad:'ألصق الرابط العام الصحيح للقناة الذي يبدأ بـ https://t.me/.',saved:'تم حفظ الرابط وتفعيل زر المتابعة.',removed:'تم إخفاء الرابط من هورينوفا دون حذف القناة.',error:'تعذر تحميل الرابط أو حفظه. تحقق من حساب المسؤول.',confirm:'إزالة رابط قناة تيليغرام من هورينوفا؟',guide:'في تيليغرام: رسالة جديدة ← قناة جديدة ← هورينوفا ← قناة عامة ← اختر اسم مستخدم ← انسخ رابط t.me.',privacy:'هذا الإعداد يربط القناة فقط. يمكن نشر عروض العمل الجديدة الموافق عليها تلقائياً بعد إعداد بوت تيليغرام الرسمي على الخادم ومنحه صلاحية النشر في القناة.'}
};
function valid(url){
 if(typeof url!=='string')return null;
 try{const u=new URL(url.trim()),m=u.pathname.match(/^\/([A-Za-z][A-Za-z0-9_]{4,31})\/?$/);
  const reserved=['joinchat','addstickers','share','login','iv','s','proxy','socks','blog','faq','apps'];
  return u.protocol==='https:'&&['t.me','telegram.me','www.t.me','www.telegram.me'].includes(u.hostname)&&!u.search&&!u.hash&&!u.port&&!u.username&&!u.password&&m&&!reserved.includes(m[1].toLowerCase())?'https://t.me/'+m[1]:null
 }catch{return null}
}
export function mountTelegramAdmin(root,request=hub){
 if(!root||root.querySelector('#hnTelegramChannelAdmin'))return;
 const section=document.createElement('section');section.id='hnTelegramChannelAdmin';section.className='hn-channel-admin hn-telegram-admin';
 section.innerHTML='<div class="hca-head"><div><span id="htgEyebrow"></span><h2 id="htgTitle"></h2><p id="htgIntro"></p></div><div class="hca-badge" aria-hidden="true">➤</div></div>'+
 '<div class="hca-content"><form id="htgForm"><label for="htgUrl" id="htgLabel"></label><div class="hca-input-row"><input id="htgUrl" type="url" spellcheck="false" autocomplete="off" inputmode="url" placeholder="https://t.me/nom_du_canal" required><button type="submit" id="htgSave"></button></div><small id="htgHint"></small><div class="hca-actions"><button type="button" id="htgRemove"></button><a href="/communaute.html#telegram" target="_blank" rel="noopener noreferrer" id="htgPreview"></a></div></form>'+
 '<div class="hca-status"><strong id="htgPublished"></strong><a id="htgCurrent" target="_blank" rel="noopener noreferrer" hidden></a><p id="htgNone"></p></div></div>'+
 '<div class="hca-guide"><p id="htgGuide"></p><small id="htgPrivacy"></small></div><p id="htgFeedback" role="status" aria-live="polite"></p>';
 root.prepend(section);
 const el=id=>section.querySelector('#'+id);let current=null,busy=false;
 const phrase=()=>STR[(document.documentElement.lang||'fr').slice(0,2)]||STR.fr;
 function render(){
  const t=phrase();
  for(const [id,key] of Object.entries({htgEyebrow:'eyebrow',htgTitle:'title',htgIntro:'intro',htgLabel:'label',htgSave:'save',htgRemove:'remove',htgPreview:'preview',htgHint:'hint',htgPublished:'published',htgGuide:'guide',htgPrivacy:'privacy'}))el(id).textContent=t[key];
  el('htgCurrent').hidden=!current;
  if(current){el('htgCurrent').href=current;el('htgCurrent').textContent=current;el('htgNone').textContent=''}
  else{el('htgCurrent').removeAttribute('href');el('htgNone').textContent=t.none}
  el('htgSave').disabled=busy;el('htgRemove').disabled=!current||busy;
 }
 async function load(){
  try{const r=await request('/api/community/telegram');current=r.active?valid(r.url):null;
   if(current)el('htgUrl').value=current;render()
  }catch{el('htgFeedback').textContent=phrase().error;render()}
 }
 el('htgForm').addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  const url=valid(el('htgUrl').value);
  if(!url){el('htgFeedback').textContent=phrase().bad;return}
  busy=true;render();el('htgFeedback').textContent='';
  try{const r=await request('/api/community/telegram',{method:'PATCH',body:{url}});
   current=valid(r.url);el('htgUrl').value=current||'';el('htgFeedback').textContent=phrase().saved
  }catch{el('htgFeedback').textContent=phrase().error}
  finally{busy=false;render()}
 });
 el('htgRemove').addEventListener('click',async()=>{
  if(!current||busy||!window.confirm(phrase().confirm))return;
  busy=true;render();
  try{await request('/api/community/telegram',{method:'DELETE'});
   current=null;el('htgUrl').value='';el('htgFeedback').textContent=phrase().removed
  }catch{el('htgFeedback').textContent=phrase().error}
  finally{busy=false;render()}
 });
 const observer=new MutationObserver(render);
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 render();void load();
}
