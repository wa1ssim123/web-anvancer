import {hub} from '/hn-api.js';
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
  linkTelegram:'Configurer le canal Telegram ↗',render:'Ouvrir les paramètres Render ↗',
  copy:'Copier le message WhatsApp',copyTelegram:'Copier le message Telegram',copyWaLink:'Copier le lien WhatsApp',copied:'Message copié. Ouvrez le canal et collez-le pour le publier.',copiedLink:'Lien de la chaîne copié.',copyError:'Copie impossible : sélectionnez et copiez le texte ci-dessous.',
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
  linkTelegram:'Configure Telegram ↗',render:'Render settings ↗',
  copy:'Copy WhatsApp post',copyTelegram:'Copy Telegram post',copyWaLink:'Copy WhatsApp Channel link',copied:'Post copied. Open the channel and paste it.',copiedLink:'Channel link copied.',copyError:'Copy unavailable: select and copy the text below.',
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
  linkTelegram:'إعداد قناة تيليغرام ↗',render:'إعدادات Render ↗',
  copy:'نسخ رسالة واتساب',copyTelegram:'نسخ رسالة تيليغرام',copyWaLink:'نسخ رابط قناة واتساب',copied:'تم نسخ الرسالة. افتح القناة والصقها.',copiedLink:'تم نسخ رابط القناة.',copyError:'تعذر النسخ، يرجى نسخ النص أدناه.',
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
 async function copyShare(value,card,success){
  const content=String(value||'');
  if(!content)return;
  try{
   if(!navigator.clipboard?.writeText)throw Error('clipboard unavailable');
   await navigator.clipboard.writeText(content);
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
  const indicators=[
   {label:w.tg,detail:model?.configured?w.botReady:w.botMissing,ready:!!model?.configured},
   {label:w.tg,detail:model?.telegramChannel?w.channelReady:w.channelMissing,ready:!!model?.telegramChannel},
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
   const link=make('a','hspa-action',w.view);link.href=rec.publicUrl;link.target='_blank';link.rel='noopener noreferrer';actions.append(link);
   const whatsapp=rows.find(x=>x.channel==='whatsapp');
   const telegram=rows.find(x=>x.channel==='telegram');
   if(!rec.removed&&rec.jobStatus==='VALIDEE'){
    if(telegram){
     actions.append(button(w.copyTelegram,()=>copyShare(telegram.message,card,lang().copied)));
     if(model.telegramChannel){
      const tgLink=make('a','hspa-action hspa-telegram',w.openTelegram);
      tgLink.href=model.telegramChannel;tgLink.target='_self';
      actions.append(tgLink);
     }
    }
    if(whatsapp){
     actions.append(button(w.copy,()=>copyShare(whatsapp.message,card,lang().copied)));
     if(model.whatsappChannel){
      const waLink=make('a','hspa-action hspa-whatsapp',w.openWa);
      waLink.href=model.whatsappChannel;waLink.target='_self';waLink.rel='external';
      actions.append(waLink);
      actions.append(button(w.copyWaLink,()=>copyShare(model.whatsappChannel,card,lang().copiedLink)));
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
    });actions.append(retry);
    if(telegram.lastError)card.append(make('p','hspa-error',w.lastError+' '+telegram.lastError));
   }
   card.append(actions);host.append(card);
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
