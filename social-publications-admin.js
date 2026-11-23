import {hub} from '/hn-api.js';
import {nextPromoImage,buildPromoMessage,copyTextOnly,sharePromo,fetchPosterBlob} from '/social-promo-share.js?v=copy-text-first-20261123-r1';
/* HORENOVA official publication supervision.
 * WhatsApp = manual copy/paste into the existing channel (official Meta API
 * does not publish Channel posts). Telegram = official Bot API after setup.
 * Only authenticated admins mount this panel; server enforces the role.
 */
const T={
 fr:{over:'HORENOVA · DIFFUSION DES OFFRES',title:'Chaque offre validée, prête à partager.',
  desc:'Offres approuvées · publication suivie sur Telegram et messages prêts à partager sur WhatsApp. Les envois confirmés sont clairement indiqués.',
  refresh:'Actualiser ↻',tg:'Telegram',wa:'WhatsApp',
  botReady:'Serveur prêt · envois à confirmer',botMissing:'Envoi automatique inactif',
  channelMissing:'Chaîne non reliée',channelReady:'Chaîne reliée',
  waReady:'Canal WhatsApp relié',waMissing:'Canal WhatsApp non relié',
  guideTitle:'Telegram bloqué ? Voir les étapes de configuration',instructions:'Pour activer Telegram : créez votre bot avec @BotFather, ajoutez-le comme administrateur de votre chaîne avec le droit de publier, puis configurez TELEGRAM_BOT_TOKEN dans les variables d’environnement privées du service Render HORENOVA API.',
  linkTelegram:'Gérer le canal Telegram ↗',render:'Ouvrir les paramètres Render ↗',moreOptions:'Canaux et autres actions',
  copy:'Copier message + lien WhatsApp',copyTelegram:'Copier message + lien Telegram',copyWaLink:'Copier le lien WhatsApp',copied:'Message copié. Ouvrez le canal et collez-le pour le publier.',copiedLink:'Lien de la chaîne copié.',copyError:'Copie impossible : sélectionnez et copiez le texte ci-dessous.',promoTitle:'Visuel HORENOVA sélectionné',promoAlt:'Affiche officielle HORENOVA',promoPreview:'Voir le message prêt à publier',promoShare:'Partager uniquement la photo',promoSave:'Ouvrir / enregistrer la photo',promoRich:'✅ Message copié avec son lien.',promoText:'✅ Texte et lien de candidature copiés. La photo est disponible séparément.',promoManual:'Le navigateur bloque la copie automatique : ouvrez le message ci-dessous pour le sélectionner et copier.',promoShared:'✅ Photo envoyée vers le partage. Collez ensuite le message et le lien déjà copiés.',promoShareError:'Le partage n’est pas disponible ici. Ouvrez la photo, puis collez le message copié.',promoSharedLink:'Le lien de la photo a été partagé. Collez ensuite votre message déjà copié.',
  openWa:'Ouvrir le canal WhatsApp ↗',openTelegram:'Ouvrir le canal Telegram ↗',view:'Voir l’annonce ↗', retry:'Relancer Telegram après vérification',retryConfirm:'Vérifiez AVANT la relance qu’aucun message identique n’est déjà visible sur votre chaîne Telegram. Continuer ?',
  retried:'Nouvelle tentative demandée.',error:'Impossible de consulter la diffusion : ',empty:"Aucune nouvelle validation enregistrée depuis l’activation de la diffusion. Les anciennes annonces ne sont pas renvoyées.",
  pending:'En attente d’envoi',syncIssue:'Statut à synchroniser · actualiser',awaitBot:'Auto inactive · copiez le message',sending:'Envoi en cours',published:'Envoyé',manual:'Prêt à copier',needs_review:'À vérifier',cancelled:'Annulé',
  lastError:'Contrôle nécessaire :',info:'Les annonces refusées, retirées ou non validées ne sont pas envoyées.'
 },
 en:{over:'HORENOVA · JOB PUBLICATION',title:'Every approved job, ready to share.',
  desc:'Approved jobs · Telegram delivery tracking and WhatsApp posts ready to share. Only confirmed deliveries appear as sent.',
  refresh:'Refresh ↻',tg:'Telegram',wa:'WhatsApp',
  botReady:'Server ready · delivery to verify',botMissing:'Automatic posting inactive',
  channelMissing:'Channel not linked',channelReady:'Channel linked',
  waReady:'WhatsApp Channel linked',waMissing:'WhatsApp Channel not linked',
  guideTitle:'Telegram blocked? View configuration steps',instructions:'To enable Telegram, create a bot with @BotFather, make it an administrator of your public channel with posting rights, and set TELEGRAM_BOT_TOKEN in the private Render HORENOVA API environment variables.',
  linkTelegram:'Manage Telegram Channel ↗',render:'Render settings ↗',moreOptions:'Channels and more actions',
  copy:'Copy WhatsApp message + link',copyTelegram:'Copy Telegram message + link',copyWaLink:'Copy WhatsApp Channel link',copied:'Post copied. Open the channel and paste it.',copiedLink:'Channel link copied.',copyError:'Copy unavailable: select and copy the text below.',promoTitle:'Selected HORENOVA poster',promoAlt:'Official HORENOVA recruitment poster',promoPreview:'View the ready-to-share post',promoShare:'Share the image only',promoSave:'Open / save image',promoRich:'✅ Message and link copied.',promoText:'✅ Message and job link copied. Share the poster separately.',promoManual:'Clipboard blocked: open the message below, select and copy it.',promoShared:'✅ Image sharing opened. Paste your already-copied message and link afterwards.',promoShareError:'Sharing unavailable here. Open the image, then paste your copied message.',promoSharedLink:'The image link was shared. Paste the copied job message afterwards.',
  openWa:'Open WhatsApp Channel ↗',openTelegram:'Open Telegram Channel ↗',view:'View job ↗',retry:'Retry Telegram after checking',retryConfirm:'First verify that no identical message was posted in your Telegram channel. Retry?',retried:'Retry requested.',error:'Cannot load publication status: ',empty:'No new approvals have been recorded since publishing was enabled. Older jobs are not resent.',
  pending:'Awaiting delivery',syncIssue:'Status out of sync · refresh',awaitBot:'Auto inactive · copy the post',sending:'Sending',published:'Sent',manual:'Ready to copy',needs_review:'Needs review',cancelled:'Cancelled',
  lastError:'Attention:',info:'Rejected, withdrawn or unapproved vacancies are never sent.'
 },
 ar:{over:'هورينوفا · نشر الوظائف',title:'كل عرض موافق عليه جاهز للنشر.',
  desc:'عروض العمل المعتمدة · متابعة النشر على تيليغرام وتجهيز رسائل واتساب للمشاركة. لا تظهر حالة الإرسال إلا بعد التأكيد.',
  refresh:'تحديث ↻',tg:'تيليغرام',wa:'واتساب',
  botReady:'الخادم جاهز · تأكيد الإرسال مطلوب',botMissing:'النشر التلقائي غير نشط',
  channelMissing:'القناة غير مرتبطة',channelReady:'القناة مرتبطة',
  waReady:'قناة واتساب مرتبطة',waMissing:'قناة واتساب غير مرتبطة',
  guideTitle:'تيليغرام متوقف؟ عرض خطوات الربط',instructions:'لتفعيل تيليغرام، أنشئ بوتاً باستعمال @BotFather وأضفه مشرفاً للقناة مع صلاحية النشر، ثم أضف TELEGRAM_BOT_TOKEN إلى إعدادات البيئة الخاصة بخادم HORENOVA على Render.',
  linkTelegram:'إدارة قناة تيليغرام ↗',render:'إعدادات Render ↗',moreOptions:'القنوات وخيارات إضافية',
  copy:'نسخ رسالة ورابط واتساب',copyTelegram:'نسخ رسالة ورابط تيليغرام',copyWaLink:'نسخ رابط قناة واتساب',copied:'تم نسخ الرسالة. افتح القناة والصقها.',copiedLink:'تم نسخ رابط القناة.',copyError:'تعذر النسخ، يرجى نسخ النص أدناه.',promoTitle:'صورة هورينوفا المختارة',promoAlt:'الملصق الرسمي للتوظيف من هورينوفا',promoPreview:'عرض رسالة الإعلان الجاهزة',promoShare:'مشاركة الصورة فقط',promoSave:'فتح / حفظ الصورة',promoRich:'✅ تم نسخ النص والرابط.',promoText:'✅ تم نسخ النص ورابط الترشح. شارك الصورة بشكل منفصل.',promoManual:'تعذّر النسخ التلقائي. افتح الرسالة بالأسفل وحددها لنسخها.',promoShared:'✅ فُتحت مشاركة الصورة. الصق الرسالة والرابط المنسوخين بعدها.',promoShareError:'تعذرت المشاركة هنا. افتح الصورة ثم الصق الرسالة المنسوخة.',promoSharedLink:'تمت مشاركة رابط الصورة. الصق رسالة التوظيف المنسوخة بعدها.',
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
 const lang=()=>T[(document.documentElement.lang||'fr').slice(0,2)]||T.fr;
 let model=null,loading=false;
 const text=(node,value)=>{node.textContent=value};
 function make(tag,cls,value){const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=value;return n}
 function button(label,cb){const b=make('button','hspa-action',label);b.type='button';b.addEventListener('click',cb);return b}
 function preparePromoCard(card,offer,row){
  const words=lang();
  const url=nextPromoImage();
  const message=buildPromoMessage(offer,row);
  card.querySelector('.hspa-promo-preview')?.remove();
  const panel=make('section','hspa-promo-preview');
  panel.setAttribute('aria-label',words.promoTitle);
  const heading=make('strong','hspa-promo-title',words.promoTitle);
  const img=make('img','hspa-promo-img');
  img.src=url;img.alt=words.promoAlt;
  img.loading='eager';img.decoding='async';
  const details=make('details','hspa-promo-details');
  details.append(make('summary','',words.promoPreview));
  const post=make('textarea','hspa-promo-text');
  post.readOnly=true;post.value=message;post.setAttribute('aria-label',words.promoPreview);
  post.rows=11;post.dir='auto';
  details.append(post);
  const tools=make('div','hspa-promo-tools');
  const local=make('p','hspa-local-feedback');local.setAttribute('role','status');local.setAttribute('aria-live','polite');
  let shareBlob=null,shareBusy=false;
  const share=button(words.promoShare,async()=>{
   if(shareBusy)return;
   shareBusy=true;share.disabled=true;
   const isFile=!!shareBlob;
   try{
    // Native share runs directly from the tap; an unavailable media file falls
    // back to sharing the public poster URL instead of a dead button.
    if(isFile)await sharePromo('',url,shareBlob);
    else await navigator.share({url,title:'HORENOVA | Recrutement'});
    text(local,isFile?lang().promoShared:lang().promoSharedLink);
   }catch(error){
    if(error?.name!=='AbortError')text(local,lang().promoShareError);
   }finally{shareBusy=false;share.disabled=false}
  });
  // Share only appears where supported, but is NEVER a permanently disabled
  // control: until the photo loads it shares its direct public link.
  if(typeof navigator.share==='function'){
   share.disabled=false;
   if(typeof File!=='undefined'){
    void fetchPosterBlob(url).then(blob=>{shareBlob=blob;share.dataset.posterReady='file'})
     .catch(()=>{share.dataset.posterReady='link'});
   }
  }else share.hidden=true;
  share.classList.add('hspa-promo-share');
  const save=make('a','hspa-action hspa-promo-save',words.promoSave);
  save.href=url;save.target='_blank';save.rel='noopener noreferrer';
  tools.append(share,save);
  panel.append(heading,img,details,tools,local);
  card.append(panel);
  return {url,message,note:local};
 }
 async function copyWithPoster(card,offer,row){
  const {url,message,note}=preparePromoCard(card,offer,row);
  const output=$('hspaFeedback');
  text(output,'');
  // Never put image/png on the clipboard: iOS/WhatsApp may then paste ONLY
  // the poster and silently discard the text/plain MIME part.
  const copied=await copyTextOnly(message);
  const words=lang();
  if(!copied){
   const preview=card.querySelector('.hspa-promo-preview');
   if(preview){const details=preview.querySelector('details');if(details){details.open=true;details.querySelector('textarea')?.focus();}}
  }
  const feedback=copied?words.promoText:words.promoManual;
  text(note,feedback);text(output,feedback);
 }
 async function copyShare(value,card,success){
  const content=String(value||'');
  if(!content)return;
  try{
   if(!await copyTextOnly(content))throw Error('clipboard unavailable');
   text($('hspaFeedback'),success);
  }catch{
   const area=make('textarea','hspa-fallback');
   area.readOnly=true;area.value=content;area.setAttribute('aria-label','Texte à copier');
   card.append(area);area.focus();area.select();
   text($('hspaFeedback'),lang().copyError);
  }
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
   const secondaryActions=make('div','hspa-channel-actions');
   if(rows.some(row=>row.status==='cancelled')&&rec.jobStatus==='VALIDEE'&&!rec.removed){
    card.append(make('p','hspa-error',w.syncIssue));
   }
   const link=make('a','hspa-action',w.view);link.href=rec.publicUrl;link.target='_self';actions.append(link);
   const whatsapp=rows.find(x=>x.channel==='whatsapp');
   const telegram=rows.find(x=>x.channel==='telegram');
   if(!rec.removed&&rec.jobStatus==='VALIDEE'){
    if(telegram){
     actions.append(button(w.copyTelegram,()=>copyWithPoster(card,rec,telegram)));
     if(model.telegramChannel){
      const tgLink=make('a','hspa-action hspa-telegram',w.openTelegram);
      tgLink.href=model.telegramChannel;tgLink.target='_self';
      secondaryActions.append(tgLink);
     }
    }
    if(whatsapp){
     actions.append(button(w.copy,()=>copyWithPoster(card,rec,whatsapp)));
     if(model.whatsappChannel){
      const waLink=make('a','hspa-action hspa-whatsapp',w.openWa);
      waLink.href=model.whatsappChannel;waLink.target='_self';waLink.rel='external';
      secondaryActions.append(waLink);
      secondaryActions.append(button(w.copyWaLink,()=>copyShare(model.whatsappChannel,card,lang().copiedLink)));
     }
    }
   }
   if(telegram?.status==='needs_review'&&!rec.removed&&rec.jobStatus==='VALIDEE'){
    const retry=button(w.retry,async()=>{
     if(!window.confirm(lang().retryConfirm))return;
     retry.disabled=true;
     try{
      await request('/api/community/publications/'+encodeURIComponent(rec.requestId)+'/retry',
       {method:'PATCH',body:{confirmedReviewed:true}});
      text($('hspaFeedback'),lang().retried);void refresh()
     }catch(err){text($('hspaFeedback'),lang().error+(err?.message||'Erreur'));retry.disabled=false}
    });secondaryActions.append(retry);
    if(telegram.lastError)card.append(make('p','hspa-error',w.lastError+' '+telegram.lastError));
   }
   card.append(actions);
   if(secondaryActions.childElementCount){
    const access=make('div','hspa-channel-options');
    access.append(make('strong','hspa-channel-title',w.moreOptions),secondaryActions);
    card.append(access);
   }
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
 const observer=new MutationObserver(draw);observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 draw();void refresh();
}
