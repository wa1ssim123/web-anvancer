'use strict';
/*
 * HORENOVA transactional notifications. Safe HTML for Gmail, Outlook and mobile:
 * email-client-friendly tables and inline styles; CSS motion is progressive only.
 * No JavaScript, sensitive profile/photo links, tracking pixels, or external fonts.
 */
const BASE='https://horenova.com';
const LOGO='https://static.wixstatic.com/media/d0158d_15046d228f1e47f583745d092ef2c695~mv2.png';
const escapeHtml = value => String(value??'')
  .replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const clean = (v,max=120) => String(v??'').replace(/[\r\n\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);
const localeOf = v => ['fr','en','ar'].includes(String(v||'').toLowerCase().slice(0,2)) ?
  String(v).toLowerCase().slice(0,2) : 'fr';
const copy={
 fr:{
   tag:'UNE NOUVELLE ÉTAPE COMMENCE',candidateSubject:'HORENOVA · Votre candidature a bien été reçue',
   recruiterSubject:'HORENOVA · Votre demande d’emploi a bien été reçue',
   shiftSubject:'HORENOVA · Votre demande de shift a bien été reçue',
   candidateTitle:'Votre candidature est entre de bonnes mains.',
   jobTitle:'Votre prochaine équipe commence ici.',
   shiftTitle:'Votre prochain shift prend forme.',
   hello:name=>name?'Bonjour '+name+',':'Bonjour,',
   candidateText:'Bonne nouvelle : votre candidature a bien été enregistrée sur HORENOVA. Notre équipe prendra le temps de l’étudier. Nous reviendrons vers vous dans les meilleurs délais, dès qu’une mise à jour sera disponible.',
   recruiterText:'Votre demande de recrutement a bien été enregistrée et transmise à HORENOVA. Elle sera examinée avant toute publication. Vous pourrez retrouver son évolution depuis votre espace recruteur.',
   shiftText:'Votre demande de shift a bien été reçue par HORENOVA. Notre équipe vérifiera les informations de la mission avant de la publier. Son statut sera disponible dans votre espace recruteur.',
   candidateStatus:'CANDIDATURE ENREGISTRÉE',recruiterStatus:'DEMANDE REÇUE · EN EXAMEN',
   role:'Poste',mission:'Mission',business:'Établissement',city:'Ville',schedule:'Horaires',type:'Type de demande',
   job:'Offre d’emploi',shift:'Shift / mission',
   candidateButton:'Suivre ma candidature',recruiterButton:'Suivre ma demande',
   candidateNote:'Une candidature envoyée ne garantit pas un entretien. HORENOVA vous informera des évolutions disponibles dans votre espace.',
   recruiterNote:'La demande est reçue, mais elle n’est pas encore publiée. Sa mise en ligne dépend de la validation HORENOVA.',
   signoff:'Merci de faire confiance à HORENOVA. Les métiers nous rapprochent, les talents nous inspirent.',
   security:'E-mail automatique lié à une action sur HORENOVA. Ne répondez pas à cette adresse si elle est configurée pour l’envoi uniquement. Ne partagez jamais votre mot de passe.',
   footer:'HORENOVA · L’humain avant l’algorithme',view:'Voir mon espace',caption:'LE BON TALENT. LA BONNE RENCONTRE.'
 },
 en:{
   tag:'A NEW CHAPTER BEGINS',candidateSubject:'HORENOVA · Your application has been received',
   recruiterSubject:'HORENOVA · Your job request has been received',
   shiftSubject:'HORENOVA · Your shift request has been received',
   candidateTitle:'Your application is in good hands.',
   jobTitle:'Your next team starts here.',
   shiftTitle:'Your next shift is taking shape.',
   hello:name=>name?'Hello '+name+',':'Hello,',
   candidateText:'Good news: your application has been successfully recorded on HORENOVA. Our team will review it carefully. We will get back to you as soon as there is an update.',
   recruiterText:'Your recruitment request has been recorded and forwarded to HORENOVA. Our team will review it before any public listing goes live. You can follow its status from your recruiter account.',
   shiftText:'HORENOVA has received your shift request. Our team will review the details of the mission before publishing it. Track the status from your recruiter account.',
   candidateStatus:'APPLICATION RECEIVED',recruiterStatus:'REQUEST RECEIVED · UNDER REVIEW',
   role:'Position',mission:'Mission',business:'Business',city:'City',schedule:'Schedule',type:'Request type',
   job:'Job opening',shift:'Shift / mission',
   candidateButton:'Track my application',recruiterButton:'Track my request',
   candidateNote:'Submitting an application does not guarantee an interview. HORENOVA will show available status updates in your account.',
   recruiterNote:'Your request has been received but is not yet public. Publication is subject to HORENOVA approval.',
   signoff:'Thank you for trusting HORENOVA. Our professions connect us; our talents inspire us.',
   security:'Automated email following an action on HORENOVA. Do not reply if this is a send-only address. Never share your password.',
   footer:'HORENOVA · People before algorithms',view:'Open my account',caption:'THE RIGHT TALENT. THE RIGHT CONNECTION.'
 },
 ar:{
   tag:'بداية خطوة جديدة',candidateSubject:'هورينوفا · تم استلام طلب ترشحك بنجاح',
   recruiterSubject:'هورينوفا · تم استلام طلب التوظيف الخاص بك',
   shiftSubject:'هورينوفا · تم استلام طلب المناوبة الخاص بك',
   candidateTitle:'طلب ترشحك بين أيدٍ أمينة.',
   jobTitle:'فريق عملك القادم يبدأ من هنا.',
   shiftTitle:'مناوبتك القادمة بدأت تتشكل.',
   hello:name=>name?'مرحباً '+name+'،':'مرحباً،',
   candidateText:'خبر سار: تم تسجيل طلب ترشحك بنجاح في هورينوفا. سيقوم فريقنا بدراسته بعناية، وسنوافيك بالمستجدات في أقرب وقت ممكن عند توفر تحديث.',
   recruiterText:'تم تسجيل طلب التوظيف الخاص بك وإرساله إلى فريق هورينوفا. ستتم مراجعته قبل نشر أي إعلان للعموم. يمكنك متابعة حالته من حساب صاحب العمل.',
   shiftText:'توصلت هورينوفا بطلب المناوبة الخاص بك. سيتحقق فريقنا من تفاصيل المهمة قبل نشرها. يمكنك متابعة الحالة من حساب صاحب العمل.',
   candidateStatus:'تم استلام طلب الترشح',recruiterStatus:'تم استلام الطلب · قيد المراجعة',
   role:'المنصب',mission:'المهمة',business:'المؤسسة',city:'المدينة',schedule:'التوقيت',type:'نوع الطلب',
   job:'عرض عمل',shift:'مناوبة / مهمة',
   candidateButton:'متابعة طلب ترشحي',recruiterButton:'متابعة طلبي',
   candidateNote:'إرسال طلب الترشح لا يضمن مقابلة أو توظيفاً. ستظهر المستجدات المتاحة داخل حسابك على هورينوفا.',
   recruiterNote:'تم استلام طلبك، لكنه لم يُنشر بعد. يخضع النشر لموافقة فريق هورينوفا.',
   signoff:'شكراً لثقتك بهورينوفا. المهن تجمعنا، والمواهب تلهمنا.',
   security:'رسالة آلية مرتبطة بإجراء قمت به على هورينوفا. لا ترد على عنوان مخصص للإرسال فقط، ولا تشارك كلمة مرورك مطلقاً.',
   footer:'هورينوفا · الإنسان قبل الخوارزمية',view:'الدخول إلى حسابي',caption:'الموهبة المناسبة. والفرصة التي تليق بها.'
 }
};
function renderMail(kind,input={},requestedLocale='fr'){
 const lang=localeOf(requestedLocale),t=copy[lang],rtl=lang==='ar';
 if(!['candidate','job','shift'].includes(kind))throw Error('Unknown HORENOVA email type');
 const candidate=kind==='candidate';
 const name=clean(input.firstName||input.contactName||'',65);
 const title=clean(input.jobTitle||'',140),business=clean(input.businessName||'',100);
 const city=clean(input.city||'',75),schedule=clean(input.scheduleText||'',130);
 const subject=candidate?t.candidateSubject:kind==='shift'?t.shiftSubject:t.recruiterSubject;
 const headline=candidate?t.candidateTitle:kind==='shift'?t.shiftTitle:t.jobTitle;
 const explanation=candidate?t.candidateText:kind==='shift'?t.shiftText:t.recruiterText;
 const status=candidate?t.candidateStatus:t.recruiterStatus;
 const note=candidate?t.candidateNote:t.recruiterNote;
 const cta=candidate?t.candidateButton:t.recruiterButton;
 const url=candidate?BASE+'/account.html':BASE+'/recruit.html';
 const heroColor=candidate?'#c5e8cb':'#f5d2a5';
 const borderColor=candidate?'#608b6f':'#ac8050';
 const check=candidate?'✓':'✦';
 const rows=[
   [t.role,title],
   ...(!candidate?[[t.type,kind==='shift'?t.shift:t.job],[t.business,business]]:[]),
   ...(!candidate&&city?[[t.city,city]]:[]),
   ...(!candidate&&kind==='shift'&&schedule?[[t.schedule,schedule]]:[])
 ].filter(([,value])=>value);
 const info=rows.map(([label,value],i)=>`<tr><td align="${rtl?'right':'left'}" style="padding:13px 17px;border-bottom:${i===rows.length-1?'0':'1px solid #e6e5dc'};font:700 11px/1.4 Arial,Helvetica,sans-serif;color:#607067;white-space:nowrap">${escapeHtml(label)}</td><td align="${rtl?'left':'right'}" style="padding:13px 17px;border-bottom:${i===rows.length-1?'0':'1px solid #e6e5dc'};font:700 13px/1.45 Arial,Helvetica,sans-serif;color:#18342b">${escapeHtml(value)}</td></tr>`).join('');
 const html=`<!doctype html><html lang="${lang}" dir="${rtl?'rtl':'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(subject)}</title><style>
 @keyframes hn-confirm-pop{0%{transform:scale(.86);opacity:.8}50%{transform:scale(1.11);opacity:1}100%{transform:scale(1);opacity:1}}
 @keyframes hn-mail-line{from{opacity:.55}to{opacity:1}}
 .hn-success-mark{animation:hn-confirm-pop 1.3s ease-out 1}
 .hn-mail-accent{animation:hn-mail-line 2.4s ease-in-out infinite alternate}
 @media(max-width:600px){.hn-email-shell{width:100%!important}.hn-email-pad{padding:28px 22px!important}.hn-email-headline{font-size:31px!important}.hn-email-body{font-size:15px!important}}
 @media(prefers-reduced-motion:reduce){.hn-success-mark,.hn-mail-accent{animation:none!important}}
 </style></head><body style="margin:0;padding:0;background:#101917">
 <div style="display:none;font-size:1px;line-height:1px;max-height:0;overflow:hidden;opacity:0">${escapeHtml(explanation.slice(0,125))}&nbsp;&#8204;&nbsp;&#8204;</div>
 <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;background:#101917"><tr><td align="center" style="padding:34px 12px 42px">
 <table role="presentation" class="hn-email-shell" width="620" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:620px;border-collapse:separate;border-spacing:0;border:1px solid #34423a;border-radius:22px;overflow:hidden;background:#fcfaf4">
 <tr><td style="background:#122520;padding:26px 30px 24px">
   <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
   <td align="${rtl?'right':'left'}" style="vertical-align:middle"><img src="${LOGO}" alt="" width="36" height="36" style="display:inline-block;width:36px;height:36px;max-width:36px;vertical-align:middle;border:0"><span style="font:900 20px/1.3 Arial,Helvetica,sans-serif;letter-spacing:2px;color:#f6ecd9;vertical-align:middle"> HORENOVA<span style="color:#ef9c64">.</span></span></td>
   <td align="${rtl?'left':'right'}" style="font:700 10px/1.4 Arial,Helvetica,sans-serif;color:#d7aa80;letter-spacing:.1em;vertical-align:middle">MADE FOR PEOPLE</td></tr></table>
 </td></tr>
 <tr><td class="hn-mail-accent" height="5" style="height:5px;font-size:0;line-height:0;background:${borderColor}">&nbsp;</td></tr>
 <tr><td class="hn-email-pad" style="padding:43px 46px 40px;text-align:${rtl?'right':'left'}">
  <div style="font:800 11px/1.5 Arial,Helvetica,sans-serif;letter-spacing:1.6px;color:#a5754c;margin-bottom:19px">${escapeHtml(t.tag)}</div>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;margin-bottom:21px"><tr><td class="hn-success-mark" width="62" height="62" align="center" valign="middle" style="width:62px;height:62px;background:#24493a;color:${heroColor};border:2px solid ${borderColor};border-radius:50%;font:800 35px/1 Arial,Helvetica,sans-serif">${check}</td><td style="width:15px"></td><td style="font:800 12px/1.45 Arial,Helvetica,sans-serif;color:#33684e">${escapeHtml(status)}</td></tr></table>
  <h1 class="hn-email-headline" style="margin:0 0 24px;color:#173329;font:500 39px/1.18 Georgia,serif;letter-spacing:-.8px">${escapeHtml(headline)}</h1>
  <p style="font:700 16px/1.6 Arial,Helvetica,sans-serif;color:#25483a;margin:0 0 15px">${escapeHtml(t.hello(name))}</p>
  <p class="hn-email-body" style="font:400 16px/1.85 Arial,Helvetica,sans-serif;color:#45574e;margin:0 0 28px">${escapeHtml(explanation)}</p>
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:separate;border:1px solid #e1e5da;border-radius:14px;background:#f3f6ee;margin-bottom:26px">${info}</table>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" bgcolor="#173f32" style="border-radius:99px;background:#173f32">
   <a href="${url}" style="display:inline-block;min-height:22px;padding:16px 25px;font:800 14px/1.4 Arial,Helvetica,sans-serif;color:#fff5e7;text-decoration:none;border-radius:99px">${escapeHtml(cta)} &nbsp;↗</a>
  </td></tr></table>
  <p style="font:400 12px/1.75 Arial,Helvetica,sans-serif;color:#68766a;margin:26px 0 12px">${escapeHtml(note)}</p>
  <p style="font:500 13px/1.7 Georgia,serif;color:#678171;margin:0">${escapeHtml(t.signoff)}</p>
 </td></tr>
 <tr><td style="padding:23px 30px;background:#e8ede5;border-top:1px solid #dce4d8;text-align:${rtl?'right':'left'}">
   <p style="margin:0 0 12px;font:400 11px/1.7 Arial,Helvetica,sans-serif;color:#607267">${escapeHtml(t.security)}</p>
   <p style="margin:0;font:800 11px/1.6 Arial,Helvetica,sans-serif;letter-spacing:.07em;color:#1e4738">${escapeHtml(t.footer)} &nbsp; · &nbsp; <a href="${BASE}" style="color:#1e4738;text-decoration:underline">horenova.com</a></p>
 </td></tr></table>
 </td></tr></table>
 </body></html>`;
 const text=[t.hello(name),headline,explanation,...rows.map(([k,v])=>k+': '+v),cta+': '+url,note,t.security].join('\n\n');
 return {subject,html,text,locale:lang,kind,ctaUrl:url};
}
module.exports={renderMail,localeOf,escapeHtml};
