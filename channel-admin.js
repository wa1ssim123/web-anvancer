import {hub} from '/hn-api.js';
/* HORENOVA: verified-admin-only WhatsApp Channel URL publisher.
 * The actual Channel is created by the owner inside WhatsApp, never here.
 */
const STR={
 fr:{
 eyebrow:'HORENOVA · COMMUNAUTÉ',title:'Votre canal WhatsApp officiel',
 intro:"Créez le canal dans WhatsApp sur votre téléphone, puis collez son lien officiel ici. Il apparaîtra automatiquement sur HORENOVA. Aucun faux canal ne sera affiché.",
 link:'Lien officiel du canal',hint:'Format : https://whatsapp.com/channel/…',save:'Activer le canal sur le site',remove:'Retirer le lien du site',preview:'Voir la page publique ↗',
 currently:'Canal actuellement publié :',notYet:'Aucun canal officiel connecté pour le moment.',saved:'Lien officiel enregistré. Le bouton public est maintenant activé.',removed:'Lien masqué sur le site. Le canal WhatsApp lui-même n’est pas supprimé.',bad:'Le lien doit commencer par https://whatsapp.com/channel/ et provenir de votre propre canal.',
 failure:'Impossible de sauvegarder pour le moment. Vérifiez votre connexion administrateur.',confirm:'Retirer le lien du canal WhatsApp du site HORENOVA ?',
 guide:'Créer le canal : WhatsApp → Actus → Chaînes → + → Créer une chaîne. Ajoutez le nom HORENOVA, une description et le logo. Ouvrez ensuite votre chaîne et copiez son lien de partage.',
 privacy:'Les abonnés suivent les publications sur WhatsApp. Cette zone ne publie pas automatiquement de messages et ne donne pas accès aux numéros des abonnés.'
 },
 en:{
 eyebrow:'HORENOVA · COMMUNITY',title:'Your official WhatsApp Channel',
 intro:'Create the channel in WhatsApp on your phone, then paste its official URL. The HORENOVA website will display it automatically.',
 link:'Official channel URL',hint:'Format: https://whatsapp.com/channel/…',save:'Publish channel on website',remove:'Remove website link',preview:'View public page ↗',
 currently:'Currently published channel:',notYet:'No official channel connected yet.',saved:'Official URL saved. The public follow button is now active.',removed:'Link hidden from the website; the WhatsApp Channel itself has not been deleted.',bad:'URL must start with https://whatsapp.com/channel/ and point to your own channel.',
 failure:'Unable to save at the moment. Verify your admin session.',confirm:'Remove the channel link from the HORENOVA website?',
 guide:'To create the channel: WhatsApp → Updates → Channels → + → Create channel. Add HORENOVA, a description and its logo, then copy the channel share link.',
 privacy:'Followers receive announcements in WhatsApp. This setting does not automatically publish messages or reveal followers’ phone numbers.'
 },
 ar:{
 eyebrow:'هورينوفا · المجتمع',title:'قناتك الرسمية على واتساب',
 intro:'أنشئ القناة على واتساب من هاتفك، ثم الصق الرابط الرسمي هنا. سيظهر زر المتابعة تلقائياً على موقع هورينوفا.',
 link:'الرابط الرسمي للقناة',hint:'الصيغة: https://whatsapp.com/channel/…',save:'نشر رابط القناة',remove:'إزالة الرابط من الموقع',preview:'فتح الصفحة العامة ↗',
 currently:'القناة المنشورة حالياً:',notYet:'لم يتم ربط قناة رسمية بعد.',saved:'تم حفظ الرابط الرسمي وتفعيل زر المتابعة.',removed:'تم إخفاء الرابط من الموقع، دون حذف قناة واتساب نفسها.',bad:'يجب أن يبدأ الرابط بـ https://whatsapp.com/channel/ وأن يكون لقناتك الرسمية.',
 failure:'تعذّر الحفظ. تحقق من تسجيل الدخول كمسؤول.',confirm:'إزالة رابط قناة واتساب من موقع هورينوفا؟',
 guide:'إنشاء القناة: واتساب ← المستجدات ← القنوات ← + ← إنشاء قناة. أضف اسم هورينوفا والوصف والشعار، ثم انسخ رابط المشاركة.',
 privacy:'يتابع المشتركون الإعلانات داخل واتساب. هذه الأداة لا تنشر تلقائياً ولا تعرض أرقام هواتف المتابعين.'
 }
};
function safe(value){
 try{
  const u=new URL(value);
  const match=u.pathname.match(/^\/channel\/([A-Za-z0-9_-]{12,128})\/?$/);
  return u.protocol==='https:'&&['whatsapp.com','www.whatsapp.com'].includes(u.hostname)&&!u.search&&!u.hash&&!u.username&&!u.password&&!u.port&&match?'https://whatsapp.com/channel/'+match[1]:null;
 }catch{return null}
}
export function mountAdminChannel(root,request=hub){
 if(!root||root.querySelector('#hnWhatsappChannelAdmin'))return;
 const part=document.createElement('section');part.id='hnWhatsappChannelAdmin';part.className='hn-channel-admin';
 part.innerHTML='<div class="hca-head"><div><span id="hcaEyebrow"></span><h2 id="hcaTitle"></h2><p id="hcaIntro"></p></div><div class="hca-badge hn-brand-symbol" aria-hidden="true"><img class="hn-brand-logo hn-brand-logo-whatsapp" src="/assets/brand-whatsapp.svg" alt="" width="50" height="50"></div></div>'+
 '<div class="hca-content"><form id="hcaForm"><label for="hcaUrl" id="hcaLinkLabel"></label><div class="hca-input-row"><input id="hcaUrl" type="url" spellcheck="false" autocomplete="off" inputmode="url" placeholder="https://whatsapp.com/channel/…" required><button type="submit" id="hcaSave"></button></div><small id="hcaHint"></small><div class="hca-actions"><button type="button" id="hcaRemove"></button><a href="/communaute.html" target="_blank" rel="noopener noreferrer" id="hcaPreview"></a></div></form><div class="hca-status"><strong id="hcaCurrentLabel"></strong><a id="hcaCurrentLink" target="_blank" rel="noopener noreferrer" hidden></a><p id="hcaState"></p></div></div><div class="hca-guide"><p id="hcaGuide"></p><small id="hcaPrivacy"></small></div><p id="hcaFeedback" role="status" aria-live="polite"></p>';
 root.prepend(part);
 let active=false,busy=false,loaded=false,current=null;
 const el=id=>part.querySelector('#'+id);
 const lang=()=>['fr','en','ar'].includes(document.documentElement.lang)?document.documentElement.lang:'fr';
 const words=()=>STR[lang()]||STR.fr;
 function draw(){
  const t=words();
  for(const [id,key] of Object.entries({hcaEyebrow:'eyebrow',hcaTitle:'title',hcaIntro:'intro',hcaLinkLabel:'link',hcaSave:'save',hcaHint:'hint',hcaRemove:'remove',hcaPreview:'preview',hcaGuide:'guide',hcaPrivacy:'privacy',hcaCurrentLabel:'currently'}))el(id).textContent=t[key];
  el('hcaCurrentLink').hidden=!active;
  if(active){el('hcaCurrentLink').href=current;el('hcaCurrentLink').textContent=current;el('hcaState').textContent='';}
  else{el('hcaCurrentLink').removeAttribute('href');el('hcaState').textContent=t.notYet;}
  el('hcaRemove').disabled=!active||busy;el('hcaSave').disabled=busy;
 }
 async function refresh(){
  try{
   const data=await request('/api/community/channel');
   current=data.active?safe(data.url):null;
   active=!!current;loaded=true;
   if(active)el('hcaUrl').value=current;
   draw();
  }catch{
   loaded=false;el('hcaFeedback').textContent=words().failure;draw();
  }
 }
 el('hcaForm').addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  const url=safe(el('hcaUrl').value);
  if(!url){el('hcaFeedback').textContent=words().bad;return;}
  busy=true;draw();el('hcaFeedback').textContent='';
  try{
   const data=await request('/api/community/channel',{method:'PATCH',body:{url}});
   current=safe(data.url);active=!!current;el('hcaUrl').value=current||'';
   el('hcaFeedback').textContent=words().saved;
  }catch{el('hcaFeedback').textContent=words().failure}
  finally{busy=false;draw()}
 });
 el('hcaRemove').addEventListener('click',async()=>{
  if(!active||busy||!window.confirm(words().confirm))return;
  busy=true;draw();el('hcaFeedback').textContent='';
  try{
   await request('/api/community/channel',{method:'DELETE'});
   current=null;active=false;el('hcaUrl').value='';
   el('hcaFeedback').textContent=words().removed;
  }catch{el('hcaFeedback').textContent=words().failure}
  finally{busy=false;draw()}
 });
 const observer=new MutationObserver(()=>draw());
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 draw();void refresh();
}
