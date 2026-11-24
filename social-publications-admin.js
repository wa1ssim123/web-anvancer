import {hub} from '/hn-api.js';
import {PROMO_IMAGES,nextPromoImage,buildPromoMessage,copyTextOnly,posterAsPng} from '/social-promo-share.js?v=simple-copy-20261123-v11';
/* HORENOVA official publication supervision.
 * WhatsApp = manual copy/paste into the existing channel (official Meta API
 * does not publish Channel posts). Telegram = official Bot API after setup.
 * Only authenticated admins mount this panel; server enforces the role.
 */
const T={
 fr:{copyMessage:'Copier message + lien',copyPhoto:'Copier photo aléatoire',textCopied:'✅ Message complet et lien de candidature copiés.',imageCopied:'✅ Photo copiée. Collez-la dans votre publication.',textManual:'Copie bloquée : sélectionnez le message affiché ci-dessous.',imageManual:'Copie photo non autorisée sur ce navigateur : appuyez longuement sur l’image pour la copier ou l’enregistrer.',imagePreview:'Photo HORENOVA sélectionnée',over:'HORENOVA · DIFFUSION DES OFFRES',title:'Chaque offre validée, prête à partager.',
  desc:'Offres approuvées · publication suivie sur Telegram et messages prêts à partager sur WhatsApp. Les envois confirmés sont clairement indiqués.',
  refresh:'Actualiser ↻',tg:'Telegram',wa:'WhatsApp',
  botReady:'Serveur prêt · envois à confirmer',botMissing:'Envoi automatique inactif',
  channelMissing:'Chaîne non reliée',channelReady:'Chaîne reliée',
  waReady:'Canal WhatsApp relié',waMissing:'Canal WhatsApp non relié',
  guideTitle:'Telegram bloqué ? Voir les étapes de configuration',instructions:'Pour activer Telegram : créez votre bot avec @BotFather, ajoutez-le comme administrateur de votre chaîne avec le droit de publier, puis configurez TELEGRAM_BOT_TOKEN dans les variables d’environnement privées du service Render HORENOVA API.',
  linkTelegram:'Gérer le canal Telegram ↗',render:'Ouvrir les paramètres Render ↗',moreOptions:'Canaux et autres actions',
  copy:'Copier affiche complète WhatsApp',copyTelegram:'Copier affiche complète Telegram',copyWaLink:'Copier le lien WhatsApp',copyTgLink:'Copier le lien Telegram',copyText:'Copier message et lien',copied:'Message copié. Ouvrez le canal et collez-le pour le publier.',copiedLink:'Lien de la chaîne copié.',copyError:'Copie impossible : sélectionnez et copiez le texte ci-dessous.',promoTitle:'Visuel HORENOVA sélectionné',promoAlt:'Affiche officielle HORENOVA',promoPreview:'Voir le message prêt à publier',promoShare:'Partager photo + message + lien',promoSave:'Ouvrir / enregistrer la photo',promoRich:'✅ Affiche copiée avec photo, poste, ville et adresse de candidature visibles. Pour un lien cliquable, utilisez « Copier message et lien » ci-dessous.',promoText:'✅ Texte et lien de candidature copiés. La photo est disponible séparément.',promoManual:'Le navigateur bloque la copie automatique : ouvrez le message ci-dessous pour le sélectionner et copier.',promoShared:'✅ Photo, texte et lien proposés au partage. Vérifiez les trois avant de publier.',promoShareError:'Le partage n’est pas disponible ici. Ouvrez la photo, puis collez le message copié.',promoSharedLink:'Texte, lien de l’offre et URL de la photo proposés au partage.',
  openWa:'Ouvrir le canal WhatsApp ↗',openTelegram:'Ouvrir le canal Telegram ↗',view:'Voir l’annonce ↗', retry:'Relancer Telegram après vérification',retryConfirm:'Vérifiez AVANT la relance qu’aucun message identique n’est déjà visible sur votre chaîne Telegram. Continuer ?',
  retried:'Nouvelle tentative demandée.',error:'Impossible de consulter la diffusion : ',empty:"Aucune nouvelle validation enregistrée depuis l’activation de la diffusion. Les anciennes annonces ne sont pas renvoyées.",
  pending:'En attente d’envoi',syncIssue:'Statut à synchroniser · actualiser',awaitBot:'Auto inactive · copiez le message',sending:'Envoi en cours',published:'Envoyé',manual:'Prêt à copier',needs_review:'À vérifier',cancelled:'Annulé',
  lastError:'Contrôle nécessaire :',info:'Les annonces refusées, retirées ou non validées ne sont pas envoyées.'
 },
 en:{copyMessage:'Copy message + link',copyPhoto:'Copy random photo',textCopied:'✅ Full message and job link copied.',imageCopied:'✅ Photo copied. Paste it into your post.',textManual:'Clipboard blocked: select the message below to copy it.',imageManual:'This browser blocked image copying: press and hold the image to copy or save it.',imagePreview:'Selected HORENOVA poster',over:'HORENOVA · JOB PUBLICATION',title:'Every approved job, ready to share.',
  desc:'Approved jobs · Telegram delivery tracking and WhatsApp posts ready to share. Only confirmed deliveries appear as sent.',
  refresh:'Refresh ↻',tg:'Telegram',wa:'WhatsApp',
  botReady:'Server ready · delivery to verify',botMissing:'Automatic posting inactive',
  channelMissing:'Channel not linked',channelReady:'Channel linked',
  waReady:'WhatsApp Channel linked',waMissing:'WhatsApp Channel not linked',
  guideTitle:'Telegram blocked? View configuration steps',instructions:'To enable Telegram, create a bot with @BotFather, make it an administrator of your public channel with posting rights, and set TELEGRAM_BOT_TOKEN in the private Render HORENOVA API environment variables.',
  linkTelegram:'Manage Telegram Channel ↗',render:'Render settings ↗',moreOptions:'Channels and more actions',
  copy:'Copy complete poster · WhatsApp',copyTelegram:'Copy complete poster · Telegram',copyWaLink:'Copy WhatsApp Channel link',copyTgLink:'Copy Telegram Channel link',copyText:'Copy message and job link',copied:'Post copied. Open the channel and paste it.',copiedLink:'Channel link copied.',copyError:'Copy unavailable: select and copy the text below.',promoTitle:'Selected HORENOVA poster',promoAlt:'Official HORENOVA recruitment poster',promoPreview:'View the ready-to-share post',promoShare:'Share image + message + link',promoSave:'Open / save image',promoRich:'✅ Complete poster copied with photo, title, city and the job URL printed on it. Use Copy message and job link below for a clickable URL.',promoText:'✅ Message and job link copied. Share the poster separately.',promoManual:'Clipboard blocked: open the message below, select and copy it.',promoShared:'✅ Image, text and link sent to the share sheet. Verify all three before posting.',promoShareError:'Sharing unavailable here. Open the image, then paste your copied message.',promoSharedLink:'Message, job link and poster URL offered to the share sheet.',
  openWa:'Open WhatsApp Channel ↗',openTelegram:'Open Telegram Channel ↗',view:'View job ↗',retry:'Retry Telegram after checking',retryConfirm:'First verify that no identical message was posted in your Telegram channel. Retry?',retried:'Retry requested.',error:'Cannot load publication status: ',empty:'No new approvals have been recorded since publishing was enabled. Older jobs are not resent.',
  pending:'Awaiting delivery',syncIssue:'Status out of sync · refresh',awaitBot:'Auto inactive · copy the post',sending:'Sending',published:'Sent',manual:'Ready to copy',needs_review:'Needs review',cancelled:'Cancelled',
  lastError:'Attention:',info:'Rejected, withdrawn or unapproved vacancies are never sent.'
 },
 ar:{copyMessage:'نسخ الرسالة والرابط',copyPhoto:'نسخ صورة عشوائية',textCopied:'✅ تم نسخ الرسالة ورابط الترشح.',imageCopied:'✅ تم نسخ الصورة. الصقها في المنشور.',textManual:'تعذر النسخ: حدد النص المعروض أدناه لنسخه.',imageManual:'هذا المتصفح يمنع نسخ الصورة: اضغط عليها مطولاً لنسخها أو حفظها.',imagePreview:'صورة هورينوفا المختارة',over:'هورينوفا · نشر الوظائف',title:'كل عرض موافق عليه جاهز للنشر.',
  desc:'عروض العمل المعتمدة · متابعة النشر على تيليغرام وتجهيز رسائل واتساب للمشاركة. لا تظهر حالة الإرسال إلا بعد التأكيد.',
  refresh:'تحديث ↻',tg:'تيليغرام',wa:'واتساب',
  botReady:'الخادم جاهز · تأكيد الإرسال مطلوب',botMissing:'النشر التلقائي غير نشط',
  channelMissing:'القناة غير مرتبطة',channelReady:'القناة مرتبطة',
  waReady:'قناة واتساب مرتبطة',waMissing:'قناة واتساب غير مرتبطة',
  guideTitle:'تيليغرام متوقف؟ عرض خطوات الربط',instructions:'لتفعيل تيليغرام، أنشئ بوتاً باستعمال @BotFather وأضفه مشرفاً للقناة مع صلاحية النشر، ثم أضف TELEGRAM_BOT_TOKEN إلى إعدادات البيئة الخاصة بخادم HORENOVA على Render.',
  linkTelegram:'إدارة قناة تيليغرام ↗',render:'إعدادات Render ↗',moreOptions:'القنوات وخيارات إضافية',
  copy:'نسخ الملصق الكامل واتساب',copyTelegram:'نسخ الملصق الكامل تيليغرام',copyWaLink:'نسخ رابط قناة واتساب',copyTgLink:'نسخ رابط قناة تيليغرام',copyText:'نسخ الرسالة ورابط الترشح',copied:'تم نسخ الرسالة. افتح القناة والصقها.',copiedLink:'تم نسخ رابط القناة.',copyError:'تعذر النسخ، يرجى نسخ النص أدناه.',promoTitle:'صورة هورينوفا المختارة',promoAlt:'الملصق الرسمي للتوظيف من هورينوفا',promoPreview:'عرض رسالة الإعلان الجاهزة',promoShare:'مشاركة الصورة والرسالة والرابط',promoSave:'فتح / حفظ الصورة',promoRich:'✅ تم نسخ الملصق مع الصورة والمهنة والمدينة وعنوان الترشح الظاهر. للرابط القابل للنقر استخدم نسخ الرسالة والرابط.',promoText:'✅ تم نسخ النص ورابط الترشح. شارك الصورة بشكل منفصل.',promoManual:'تعذّر النسخ التلقائي. افتح الرسالة بالأسفل وحددها لنسخها.',promoShared:'✅ مشاركة الصورة والنص والرابط جاهزة. تحقق من ظهورها قبل النشر.',promoShareError:'تعذرت المشاركة هنا. افتح الصورة ثم الصق الرسالة المنسوخة.',promoSharedLink:'تم تجهيز الرسالة ورابط الوظيفة ورابط الصورة للمشاركة.',
  openWa:'فتح قناة واتساب ↗',openTelegram:'فتح قناة تيليغرام ↗',view:'عرض الإعلان ↗',retry:'إعادة محاولة تيليغرام بعد التحقق',retryConfirm:'تحقق أولاً من عدم وجود رسالة مماثلة في القناة قبل إعادة الإرسال. هل تريد المتابعة؟',retried:'تم طلب إعادة الإرسال.',error:'تعذر تحميل حالة النشر: ',empty:'لا توجد موافقات جديدة منذ تفعيل نظام النشر. لن نعيد نشر الإعلانات القديمة.',
  pending:'في انتظار الإرسال',syncIssue:'الحالة غير متزامنة · حدّث الصفحة',awaitBot:'النشر الآلي غير نشط · انسخ الرسالة',sending:'جارٍ الإرسال',published:'تم الإرسال',manual:'جاهز للنسخ',needs_review:'يحتاج للمراجعة',cancelled:'ملغى',lastError:'تنبيه:',info:'لا يتم نشر الإعلانات المرفوضة أو المسحوبة أو غير المعتمدة.'}
};
export function mountSocialPublications(root,request=hub){
 if(!root||root.querySelector('#hnAdminSocialPublications'))return;
 const el=document.createElement('section');el.id='hnAdminSocialPublications';el.className='hn-social-publication-admin';
 el.innerHTML='<div class="hspa-heading"><div><span id="hspaOver"></span><h2 id="hspaTitle"></h2><p id="hspaDesc"></p></div><button type="button" id="hspaRefresh"></button></div>'+
 '<div id="hspaConnections" class="hspa-connections"></div>'+
 '<div class="hspa-guidelinks"><a href="/admin.html#hnTelegramChannelAdmin" id="hspaTelegram" class="hspa-admin-link"></a></div>'+
 '<div class="hspa-list" id="hspaList"></div><p id="hspaFeedback" role="status" aria-live="polite"></p><small id="hspaInfo"></small>';
 root.prepend(el);
 const $=id=>el.querySelector('#'+id);
 // The channel settings are mounted asynchronously. A regular anchor can
 // resolve before its target exists, leaving the mobile button apparently dead.
 $('hspaTelegram').href='#hnTelegramChannelAdmin';
 $('hspaTelegram').addEventListener('click',event=>{
  event.preventDefault();
  const locate=()=>document.getElementById('hnTelegramChannelAdmin');
  const jump=()=>{const target=locate();if(!target)return false;
   target.scrollIntoView({behavior:'smooth',block:'start'});return true;};
  if(jump())return;
  history.replaceState(null,'','#hnTelegramChannelAdmin');
  const observer=new MutationObserver(()=>{if(jump())observer.disconnect()});
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),10000);
 });
 const lang=()=>T[(document.documentElement.lang||'fr').slice(0,2)]||T.fr;
 let model=null,loading=false;
 // Prepare all five PNGs while the administrator views the page. Each
 // clipboard write starts directly inside a click (necessary on iPhone Safari).
 const posterPng=new Map();
 for(const url of PROMO_IMAGES){
  const task=posterAsPng(url);
  task.catch(()=>{});posterPng.set(url,task);
 }
 const text=(node,value)=>{node.textContent=value};
 function make(tag,cls,value){const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=value;return n}
 function button(label,cb){const b=make('button','hspa-action',label);b.type='button';b.addEventListener('click',cb);return b}
 function feedback(card,message){
  let node=card.querySelector('.hspa-local-feedback');
  if(!node){
   node=make('p','hspa-local-feedback');
   node.setAttribute('role','status');
   node.setAttribute('aria-live','polite');
   card.append(node);
  }
  text(node,message);
 }
 function showManualText(card,message){
  let preview=card.querySelector('.hspa-copy-fallback');
  if(!preview){
   preview=make('textarea','hspa-copy-fallback');
   preview.setAttribute('aria-label',lang().copyMessage);
   preview.readOnly=true;preview.rows=10;
   card.append(preview);
  }
  preview.value=message;
  preview.focus();preview.select();
 }
 async function copyJobMessage(card,offer,row){
  const message=buildPromoMessage(offer,row);
  // Always copy ONLY plain text: the job link stays clickable when pasted.
  const copied=await copyTextOnly(message);
  if(!copied)showManualText(card,message);
  else card.querySelector('.hspa-copy-fallback')?.remove();
  feedback(card,copied?lang().textCopied:lang().textManual);
 }
 function copyRandomPhoto(card){
  // Every click changes the poster; the image contains NO appended caption.
  const url=nextPromoImage();
  card.querySelector('.hspa-photo-preview')?.remove();
  const preview=make('div','hspa-photo-preview');
  preview.append(make('strong','',lang().imagePreview));
  const img=make('img','');
  img.src=url;img.alt=lang().imagePreview;img.loading='eager';
  preview.append(img);card.append(preview);
  const error=()=>feedback(card,lang().imageManual);
  if(typeof ClipboardItem==='undefined'||typeof navigator.clipboard?.write!=='function'){
   error();return;
  }
  try{
   // Image-only ClipboardItem is created DURING the user click, before await.
   // A preloaded Promise<Blob> is supported by modern Safari and Chromium.
   const png=posterPng.get(url)||posterAsPng(url);
   const item=new ClipboardItem({'image/png':png});
   navigator.clipboard.write([item])
    .then(()=>feedback(card,lang().imageCopied))
    .catch(error);
  }catch{error()}
 }
 function draw(){
  const w=lang();
  for(const [id,key] of Object.entries({hspaOver:'over',hspaTitle:'title',hspaDesc:'desc',hspaRefresh:'refresh',hspaTelegram:'linkTelegram',hspaInfo:'info'}))text($(id),w[key]);
  const links=$('hspaConnections');links.replaceChildren();
  const telegramActive=!!(model?.configured&&model?.telegramChannel);
  const indicators=[
   {label:w.tg,detail:telegramActive?w.botReady:w.botMissing,ready:telegramActive},
   {label:w.wa,detail:model?.whatsappChannel?w.waReady:w.waMissing,ready:!!model?.whatsappChannel}
  ];
  for(const val of indicators){const card=make('div','hspa-connection'+(val.ready?' hspa-ready':''));card.append(make('b','',val.label),make('span','',val.detail));links.append(card)}
  const host=$('hspaList');host.replaceChildren();
  if(!model){host.append(make('p','hspa-empty',w.empty));return}
  const groups=new Map();
  for(const row of model.rows||[]){
   if(!groups.has(row.requestId))groups.set(row.requestId,[]);
   groups.get(row.requestId).push(row);
  }
  if(!groups.size){host.append(make('p','hspa-empty',w.empty));return}
  for(const rows of groups.values()){
   const rec=rows[0],card=make('article','hspa-post');
   const header=make('div','hspa-post-head');
   header.append(make('strong','',rec.title||'Offre HORENOVA'),make('span','',rec.city||'Maroc'));
   card.append(header);
   const state=make('div','hspa-post-state');
   for(const row of rows){
    const item=make('span','hspa-pill hspa-'+row.status,
     (row.channel==='telegram'?'Telegram':'WhatsApp')+' · '+(row.status==='cancelled'&&rec.jobStatus==='VALIDEE'&&!rec.removed?w.syncIssue:row.channel==='telegram'&&row.status==='pending'&&!model.configured?w.awaitBot:(w[row.status]||row.status)));
    state.append(item);
   }
   card.append(state);
   const actions=make('div','hspa-post-actions');
   if(rows.some(row=>row.status==='cancelled')&&rec.jobStatus==='VALIDEE'&&!rec.removed){
    card.append(make('p','hspa-error',w.syncIssue));
   }
   const link=make('a','hspa-action',w.view);
   link.href=rec.publicUrl||'https://horenova.com/job.html?id='+encodeURIComponent(rec.requestId);
   link.target='_self';
   actions.append(link);
   if(!rec.removed&&rec.jobStatus==='VALIDEE'){
    const preferred=rows.find(x=>x.channel==='whatsapp')||rows.find(x=>x.channel==='telegram')||rec;
    actions.append(button(w.copyMessage,()=>{void copyJobMessage(card,rec,preferred)}));
    actions.append(button(w.copyPhoto,()=>copyRandomPhoto(card)));
   }
   const telegram=rows.find(x=>x.channel==='telegram');
   if(telegram?.status==='needs_review'&&telegram.lastError){
    card.append(make('p','hspa-error',w.lastError+' '+telegram.lastError));
   }
   card.append(actions);
   host.append(card);
  }
 }
 async function refresh(){
  if(loading)return;
  loading=true;$('hspaRefresh').disabled=true;
  try{model=await request('/api/community/publications');text($('hspaFeedback'),'');draw()}
  catch(err){text($('hspaFeedback'),lang().error+(err?.message||'Erreur'))}
  finally{loading=false;$('hspaRefresh').disabled=false}
 }
 $('hspaRefresh').addEventListener('click',()=>{void refresh()});
 document.addEventListener('hn-admin-moderation-changed',()=>{void refresh()});
 document.addEventListener('hn-admin-listing-removed',()=>{void refresh()});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh()});
 setInterval(()=>{if(!document.hidden)void refresh()},60000);
 let observedLanguage=document.documentElement.lang;
 const observer=new MutationObserver(()=>{const next=document.documentElement.lang;if(next===observedLanguage)return;observedLanguage=next;draw()});observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 draw();void refresh();
}
