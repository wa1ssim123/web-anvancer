/* HORENOVA multilingual interface (FR/EN/AR), no translation of user-generated text. */
(function(){
'use strict';
const ROWS="Accueil|Home|الرئيسية\nConnexion|Sign in|تسجيل الدخول\nSe connecter|Sign in|تسجيل الدخول\nDéconnexion|Log out|تسجيل الخروج\nCréer un compte|Create account|إنشاء حساب\nCréer un compte ↗|Create account ↗|إنشاء حساب ↗\nCréer mon compte|Create my account|إنشاء حسابي\nCréer mon profil|Create my profile|إنشاء ملفي\nMon espace|My space|مساحتي\nMon espace ↗|My space ↗|مساحتي ↗\nOffres|Jobs|الوظائف\nEmplois|Jobs|الوظائف\nShifts|Shifts|مناوبات\nTalents|Talent|المواهب\nAcademy|Academy|الأكاديمية\nShop|Shop|المتجر\nMaroc|Morocco|المغرب\nExplore|Explore|استكشف\nProfil|Profile|الملف الشخصي\nFavoris|Favorites|المفضلة\nJe recrute|I'm hiring|أبحث عن موظفين\nJe recrute ↗|I'm hiring ↗|أبحث عن موظفين ↗\nExplore Touriste|Explore travel|استكشف السياحة\nHORENOVA EXPLORE · TOUT LE SÉJOUR|HORENOVA EXPLORE · ENTIRE STAY|استكشاف هورينوفا · طوال الإقامة\nGuide séjour|Travel guide|دليل الإقامة\nSécurité / anti-arnaques|Safety / scam prevention|السلامة / تجنب الاحتيال\nVérifier un prix|Check a price|تحقق من السعر\nItinéraire|Itinerary|مسار الرحلة\nExpériences|Experiences|التجارب\nAssistance|Assistance|المساعدة\nContinuer|Continue|متابعة\nEnregistrer|Save|حفظ\nVérifier|Verify|تحقق\nE-mail|Email|البريد الإلكتروني\nMot de passe|Password|كلمة المرور\nPrénom|First name|الاسم الشخصي\nNom|Last name|اسم العائلة\nPRÉNOM|FIRST NAME|الاسم الشخصي\nNOM|LAST NAME|اسم العائلة\nÂGE|AGE|العمر\nVILLE|CITY|المدينة\nTYPE|TYPE|النوع\nTÉLÉPHONE PROFESSIONNEL|BUSINESS PHONE|رقم هاتف العمل\nMÉTIER PRINCIPAL|MAIN OCCUPATION|المهنة الرئيسية\nPRÉSENTATION|INTRODUCTION|نبذة شخصية\nPROFIL CANDIDAT|CANDIDATE PROFILE|ملف المرشح\nPROFIL ÉTABLISSEMENT|BUSINESS PROFILE|ملف المؤسسة\nPROFIL RECRUTEUR|RECRUITER PROFILE|ملف صاحب العمل\nÉTABLISSEMENT|BUSINESS|المؤسسة\nIDENTITÉ|IDENTITY|الهوية\nDEMANDES|REQUESTS|الطلبات\nCANDIDATURE|APPLICATION|طلب ترشيح\nCANDIDATURES|APPLICATIONS|طلبات التوظيف\nCONVERSATIONS|CONVERSATIONS|المحادثات\nQUIZ MÉTIER|JOB QUIZ|اختبار مهني\nVIDÉO PRIVÉE|PRIVATE VIDEO|فيديو خاص\nPHOTO DE PROFIL · PRIVÉE|PROFILE PHOTO · PRIVATE|صورة الملف · خاصة\nOui|Yes|نعم\nNon|No|لا\nNiveau|Level|المستوى\nAutre|Other|آخر\nAutre langue|Other language|لغة أخرى\nServeur|Waiter|نادل\nBarista|Barista|باريستا\nChef de cuisine|Head chef|رئيس الطهاة\nCommis|Kitchen assistant|مساعد مطبخ\nBarman|Bartender|نادل بار\nPâtissier|Pastry chef|حلواني\nPlongeur|Dishwasher|غاسل الأواني\nRéceptionniste|Receptionist|موظف استقبال\nRestaurant|Restaurant|مطعم\nCafé|Café|مقهى\nHôtel / Riad|Hotel / Riad|فندق / رياض\nTraiteur / Événementiel|Catering / Events|تموين / مناسبات\nBoulangerie / Pâtisserie|Bakery / Pastry|مخبزة / حلويات\nCasablanca|Casablanca|الدار البيضاء\nMarrakech|Marrakesh|مراكش\nRabat|Rabat|الرباط\nTanger|Tangier|طنجة\nAgadir|Agadir|أكادير\nFès|Fez|فاس\nBouskoura|Bouskoura|بوسكورة\nEssaouira|Essaouira|الصويرة\nProfil enregistré|Profile saved|تم حفظ الملف\nÀ compléter|To complete|بحاجة للإكمال\nÀ passer|To take|لم يجتز بعد\nValidé|Validated|تم التحقق\nValidée|Approved|تمت الموافقة\nRefusée|Rejected|مرفوضة\nÀ examiner|To review|قيد المراجعة\nEn étude|Under review|قيد الدراسة\nPrésélection|Shortlisted|اختيار أولي\nEntretien|Interview|مقابلة\nMise en relation|Introduction|الربط بين الطرفين\nRetenue|Selected|تم الاختيار\nClôturée|Closed|مغلقة\nEnregistrée|Saved|تم الحفظ\nAbsente|Missing|غير موجودة\nManquante|Missing|ناقصة\nNon validé|Not validated|غير مؤكد\nSuivi indisponible|Tracking unavailable|المتابعة غير متاحة\nÉTABLISSEMENT|BUSINESS|المؤسسة\nVIDÉO PRIVÉE|PRIVATE VIDEO|فيديو خاص\nCréer votre compte|Create your account|أنشئ حسابك\nJe cherche un travail|I'm looking for work|أبحث عن عمل\nEmplois · shifts · Academy|Jobs · shifts · Academy|وظائف · مناوبات · أكاديمية\nOffres · talents · candidatures|Jobs · talent · applications|وظائف · مواهب · طلبات توظيف\nVérification de sécurité|Security verification|التحقق الأمني\nChargement de la vérification…|Loading verification…|جارٍ تحميل التحقق…\nVérification e-mail|Email verification|تأكيد البريد الإلكتروني\nEntrez le code reçu par e-mail.|Enter the email code.|أدخل الرمز الذي وصلك عبر البريد الإلكتروني.\nCode|Code|الرمز\nCréer mon espace recruteur ↗|Create recruiter space ↗|إنشاء مساحة صاحب العمل ↗\nEnregistrer et passer au quiz ↗|Save and go to quiz ↗|احفظ وانتقل إلى الاختبار ↗\nSoumettre ou synchroniser|Submit or sync|إرسال أو مزامنة\nSynchroniser cette demande|Sync this request|مزامنة هذا الطلب\nEnregistrement de votre demande…|Saving your request…|جارٍ حفظ الطلب…\nTransmission au suivi central HORENOVA…|Sending to HORENOVA tracking…|جارٍ الإرسال إلى هورينوفا…\nEnregistrement du statut…|Saving status…|جارٍ حفظ الحالة…\nDécision administrative|Administrative decision|قرار الإدارة\nValidée administrativement|Approved by admin|تمت الموافقة إداريًا\nStatut|Status|الحالة\nRechercher|Search|بحث\nRechercher un candidat ou une offre…|Search candidates or jobs…|ابحث عن مرشح أو وظيفة…\nActualiser|Refresh|تحديث\nPiloter Horenova.|Manage Horenova.|إدارة هورينوفا.\nTout voir.|See everything.|شاهد كل شيء.\nTout contrôler.|Control everything.|تحكم في كل شيء.\nMon espace.|My space.|مساحتي.\nChargement de votre profil…|Loading profile…|جارٍ تحميل الملف…\nProfil|Profile|الملف الشخصي\nQuiz métier|Career quiz|اختبار مهني\nMatchs & candidatures|Matches & applications|مطابقات وترشيحات\nUn profil.|One profile.|ملف واحد.\nPlus de possibilités.|More possibilities.|فرص أكثر.\nBienvenue dans Horenova|Welcome to Horenova|مرحبًا بك في هورينوفا\nBIENVENUE DANS HORENOVA|WELCOME TO HORENOVA|مرحبًا بك في هورينوفا\nComprendre Horenova|Discover Horenova|تعرّف على هورينوفا\navant de commencer.|before getting started.|قبل البدء.\nMontrez qui vous êtes.|Show who you are.|عرّف بنفسك.\nSimplement.|Simply.|ببساطة.\nVotre établissement.|Your business.|مؤسستك.\nLes bons talents.|The right talent.|المواهب المناسبة.\nUn petit test.|A short test.|اختبار قصير.\nPas un examen.|Not an exam.|ليس امتحانًا.\nUne candidature.|One application.|طلب ترشيح واحد.\nClaire et préparée.|Clear and prepared.|واضح ومجهّز.\nVérifier.|Check.|تحقّق.\nPuis envoyer.|Then submit.|ثم أرسل.\nChoisissez un jour.|Choose a day.|اختر يومًا.\nPrenez votre place.|Take your place.|احجز مكانك.\nMes dossiers|My cases|ملفاتي\nCandidatures et mises en relation|Applications and introductions|الترشيحات وعمليات الربط\nSélectionnez un dossier à gauche.|Select a case on the left.|اختر ملفًا من اليسار.\nConversation|Conversation|المحادثة\nConversations HORENOVA|HORENOVA conversations|محادثات هورينوفا\n";
const catalog=new Map();
for(const line of ROWS.split('\n')){const parts=line.split('|').map(x=>x.trim());if(parts.length===3&&parts[0])for(const p of parts)catalog.set(p,parts);}
const available=new Set(['fr','ar','en']);
const getLang=()=>{try{const v=localStorage.getItem('mihna-lang');return available.has(v)?v:'fr'}catch{return 'fr'}};
const setLang=code=>{if(!available.has(code))return;try{localStorage.setItem('mihna-lang',code)}catch{}location.reload()};
const originalNodes=new WeakMap(),originalAttrs=new WeakMap();
const exclude='script,style,noscript,textarea,pre,code,[contenteditable="true"],[data-no-translate]';
const normalized=s=>String(s||'').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
let applying=false,queued=false;
function target(text,lang){const record=catalog.get(normalized(text));return record?record[lang==='ar'?2:lang==='en'?1:0]:null}
function doText(node,lang){
 if(node.nodeType!==3)return;
 const parent=node.parentElement;
 if(!parent||parent.closest(exclude))return;
 const current=node.nodeValue||'',old=originalNodes.get(node)||current;
 const dest=target(old,lang)||target(current,lang);
 if(!dest)return;
 if(!originalNodes.has(node))originalNodes.set(node,old);
 const head=old.match(/^\s*/)[0],tail=old.match(/\s*$/)[0];
 const next=head+dest+tail;
 if(current!==next)node.nodeValue=next;
}
function doAttr(el,attr,lang){
 if(!el.hasAttribute(attr))return;
 let orig=originalAttrs.get(el);
 if(!orig){orig={};originalAttrs.set(el,orig);}
 if(!(attr in orig))orig[attr]=el.getAttribute(attr);
 const dest=target(orig[attr],lang);
 if(dest&&el.getAttribute(attr)!==dest)el.setAttribute(attr,dest);
}
function translate(){
 if(applying||!document.body)return;
 applying=true;
 try{
  const lang=getLang();
  document.documentElement.lang=lang;
  document.documentElement.dir=lang==='ar'?'rtl':'ltr';
  document.body.classList.toggle('hn-rtl',lang==='ar');
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  let n;const nodes=[];while((n=walker.nextNode()))nodes.push(n);
  for(const text of nodes)doText(text,lang);
  document.querySelectorAll('[placeholder],[title],[aria-label]').forEach(el=>{for(const attr of ['placeholder','title','aria-label'])doAttr(el,attr,lang)});
  document.querySelectorAll('[data-hn-language]').forEach(el=>{if(el.value!==lang)el.value=lang});
 }finally{applying=false}
}
function schedule(){if(applying||queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(()=>{queued=false;translate()})}
function mountStyle(){
 if(document.getElementById('hn-i18n-style'))return;
 const s=document.createElement('style');s.id='hn-i18n-style';
 s.textContent='.hn-lang-control{display:inline-block;min-width:51px;max-width:94px;height:39px;padding:0 4px;border-radius:11px;border:1px solid #b99e63;background:#122020;color:#ffdb8e;font:700 12px system-ui;flex-shrink:0;cursor:pointer;touch-action:manipulation}.hn-lang-control:focus-visible{outline:3px solid #f6ac4c;outline-offset:2px}.hn-lang-floating{position:fixed;right:12px;bottom:max(84px,env(safe-area-inset-bottom));z-index:1100;box-shadow:0 5px 15px #0004}.hn-rtl input[type=email],.hn-rtl input[type=tel],.hn-rtl input[type=url]{direction:ltr;text-align:left}.hn-rtl .hn12-actions,.hn-rtl .hn-home-actions,.hn-rtl .hn12-dock{direction:ltr}.hn-rtl .wizard-form,.hn-rtl .recruit-form,.hn-rtl .hub-root,.hn-rtl .enter-panel{text-align:start}@media(max-width:700px){.hn-lang-control{max-width:68px;min-width:48px;height:35px;font-size:11px}}';
 document.head.appendChild(s);
}
function mountControl(){
 if(document.getElementById('hn-language-control'))return;
 const control=document.createElement('select');control.id='hn-language-control';control.className='hn-lang-control';
 control.setAttribute('data-hn-language','');control.setAttribute('aria-label','Language / Langue / اللغة');
 for(const [id,name]of [['fr','FR'],['ar','العربية'],['en','EN']]){
  const option=document.createElement('option');option.value=id;option.textContent=name;control.appendChild(option);
 }
 control.value=getLang();
 control.addEventListener('change',()=>setLang(control.value));
 const holder=document.querySelector('.hn12-actions,.hn-home-actions,.enter-top,.rv-header nav,header');
 if(holder){
  const menu=holder.querySelector('#menuBtn');
  if(menu)holder.insertBefore(control,menu);else holder.appendChild(control);
 }else{control.classList.add('hn-lang-floating');document.body.appendChild(control);}
}
function boot(){
 mountStyle();mountControl();translate();
 const observer=new MutationObserver(records=>{if(!applying&&records.length)schedule()});
 observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label']});
 window.addEventListener('pageshow',schedule);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
