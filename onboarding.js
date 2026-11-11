import { requireRole, getDemoSession } from "/mihna-global.js";
const scripts={
 ar:[
  'مرحباً بك في مهنة، منصة مصممة لمهن الضيافة والمطبخ والمقاهي والخدمة في المغرب. هدفنا أن نساعدك على تحويل مهارتك إلى فرص حقيقية بطريقة بسيطة ومهنية.',
  'ابدأ بملفك الشخصي. أضف معلوماتك الأساسية والمدينة والمهنة واللغات التي تتحدثها مع مستوى كل لغة. كلما كان ملفك واضحاً، أصبح من السهل على المؤسسات المناسبة أن تفهم نقاط قوتك.',
  'بعد ذلك سجّل فيديو تقديمياً قصيراً. هذا الفيديو خاص ولا يظهر في الملف العام. الهدف منه أن يسمع المسؤول عن التوظيف صوتك وطريقتك في التقديم عندما يكون مخولاً بمشاهدة الفيديو.',
  'قبل بعض الطلبات ستجد اختباراً صغيراً متعلقاً بالمهنة التي اخترتها. الاختبار لا يستبدل المقابلة، لكنه يساعدك على مراجعة الأساسيات ويعطي سياقاً إضافياً لطلبك.',
  'ومن خلال أكاديمية مهنة يمكنك تطوير مهاراتك، ثم متابعة الوظائف والشيفتات وحفظ الفرص المناسبة لك. خذ وقتك، أكمل ملفك، وابدأ خطوة بخطوة. أهلاً بك في مهنة.'
 ],
 fr:[
  'Bienvenue sur Horenova, la plateforme pensée pour les métiers de l’hospitalité, de la cuisine, du café et du service au Maroc. Notre objectif est simple : transformer votre savoir-faire en opportunités plus claires et plus humaines.',
  'Commencez par votre profil. Ajoutez vos informations essentielles, votre ville, votre métier et les langues que vous parlez avec votre niveau. Plus votre profil est précis, plus un établissement peut comprendre rapidement ce que vous savez faire.',
  'Ensuite, enregistrez une courte vidéo de présentation. Cette vidéo reste privée et ne s’affiche pas dans l’annuaire public. Elle sert à donner plus de contexte à un recruteur autorisé lorsque votre candidature l’intéresse.',
  'Avant certaines candidatures, Horenova vous proposera aussi un petit quiz lié à votre métier. Il ne remplace pas un entretien, mais il permet de vérifier quelques bases et de mieux préparer votre candidature.',
  'Enfin, Horenova Academy vous aide à progresser avec des mini-formations, pendant que les espaces Emplois et Shifts vous permettent de chercher des opportunités adaptées à votre rythme. Complétez votre profil, avancez étape par étape, et bienvenue dans Horenova.'
 ],
 en:[
  'Welcome to Horenova, a platform built for hospitality, kitchen, coffee and service professionals in Morocco. Our goal is simple: turn your skills into clearer and more human opportunities.',
  'Start with your profile. Add the essentials, your city, your profession and the languages you speak with your level. A clear profile helps the right venue understand your strengths quickly.',
  'Then record a short introduction video. This video is private and is not shown in the public directory. It gives an authorized recruiter more context when your application is relevant to them.',
  'Before some applications, Horenova also gives you a short quiz related to your profession. It does not replace an interview, but it helps review important basics and gives your application more context.',
  'Horenova Academy then helps you improve through short lessons, while Jobs and Shifts help you find opportunities that match your schedule. Complete your profile, move step by step, and welcome to Horenova.'
 ]
};
const labels={ar:'▶ استمع',fr:'▶ Écouter',en:'▶ Listen'};const captions={ar:'العربية · صوت واضح + فيديو حقيقي في الحركة',fr:'Français · narration claire + vidéo en mouvement',en:'English · clear narration + moving video'};
const role=new URLSearchParams(location.search).get('role')||getDemoSession()?.role||await (async()=>{const a=await requireRole(['candidate','recruiter','admin'],false);return a?.role})();
if(role==='recruiter')document.getElementById('onboardingNext').href='/recruiter-setup.html';else if(role==='admin')document.getElementById('onboardingNext').href='/admin.html';
let lang='ar',idx=0,playing=false,utter=null;const video=document.getElementById('welcomeVideo'),caption=document.getElementById('videoCaption'),voiceBtn=document.getElementById('onboardingVoice');
function chooseVoice(l){const prefix=l==='ar'?'ar':l==='en'?'en':'fr';const v=speechSynthesis.getVoices().filter(x=>x.lang?.toLowerCase().startsWith(prefix));return v[0]||null}
function stop(){speechSynthesis.cancel();video.pause();playing=false;voiceBtn.textContent=labels[lang];}
function next(){if(!playing)return;if(idx>=scripts[lang].length){stop();caption.textContent=lang==='ar'?'تمت المقدمة. يمكنك البدء الآن.':lang==='en'?'Introduction complete. You can start now.':'Présentation terminée. Vous pouvez commencer.';return;}const t=scripts[lang][idx++];caption.textContent=t;utter=new SpeechSynthesisUtterance(t);utter.lang=lang==='ar'?'ar-MA':lang==='en'?'en-GB':'fr-FR';utter.rate=.92;utter.volume=1;const v=chooseVoice(lang);if(v)utter.voice=v;utter.onend=next;utter.onerror=()=>{caption.textContent=lang==='ar'?'الصوت غير متوفر على هذا الجهاز.':'La voix n’est pas disponible sur cet appareil.';stop()};speechSynthesis.speak(utter)}
function start(){stop();playing=true;idx=0;voiceBtn.textContent='Ⅱ';video.muted=true;video.loop=true;video.play().catch(()=>{});next()}
voiceBtn.onclick=()=>{if(!playing){start();return}if(speechSynthesis.paused){speechSynthesis.resume();video.play();voiceBtn.textContent='Ⅱ'}else{speechSynthesis.pause();video.pause();voiceBtn.textContent=labels[lang]}};
document.querySelectorAll('[data-video-lang]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-video-lang]').forEach(x=>x.classList.toggle('active',x===b));lang=b.dataset.videoLang;stop();caption.textContent=captions[lang];voiceBtn.textContent=labels[lang]});
caption.textContent=captions[lang];voiceBtn.textContent=labels[lang];window.addEventListener('beforeunload',stop);
