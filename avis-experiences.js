/* HORENOVA service experience showcase.
 * All cards are FICTIONAL EXAMPLES, not submitted reviews or verified ratings.
 * Never merge them with /api/reviews/public or its published counts. */
(function(){
 'use strict';
 const scenarios=[["candidate","Sara B.",5,"Un profil qui me ressemble","Je découvre comment présenter mon métier, ma ville et mes langues dans un seul espace.","A profile that fits me","I can see how to present my profession, city and languages in one place.","ملف يعبر عني","أتعرف على طريقة عرض مهنتي ومدينتي ولغاتي في مساحة واحدة."],["candidate","Yassine M.",5,"Des offres plus faciles à explorer","Je parcours les métiers de la restauration sans me perdre dans une longue liste.","Easier job discovery","I browse hospitality roles without getting lost in endless listings.","استكشاف الوظائف بسهولة","أتصفح وظائف الضيافة دون الضياع في قوائم طويلة."],["candidate","Imane R.",4,"Mon parcours, étape par étape","Je comprends le chemin entre la création du profil, le quiz et la candidature.","My journey, step by step","I understand the path from profile creation to the quiz and application.","مساري خطوة بخطوة","أفهم المراحل من إنشاء الملف إلى الاختبار ثم الترشح."],["candidate","Hamza E.",5,"La vidéo de présentation","Je peux montrer ma motivation grâce à une présentation vidéo privée.","A video introduction","I can show motivation through a private video introduction.","فيديو التعريف","أستطيع إظهار حماسي من خلال فيديو تعريفي خاص."],["candidate","Meryem L.",5,"Plusieurs langues, un seul profil","Je trouve pratique de pouvoir indiquer mon niveau en arabe, français et anglais.","Languages in one profile","I like being able to indicate my Arabic, French and English levels.","اللغات في ملف واحد","يعجبني إمكانية تحديد مستواي في العربية والفرنسية والإنجليزية."],["candidate","Othmane F.",4,"Un quiz pour se préparer","Les questions métier donnent un aperçu des compétences à mettre en avant.","A quiz to prepare","The job quiz highlights the skills worth presenting.","اختبار للاستعداد","يساعد اختبار المهنة على إبراز المهارات المهمة."],["candidate","Amina K.",5,"Un suivi plus lisible","Je vois comment consulter les étapes de mon dossier depuis mon espace personnel.","Clearer application tracking","I can see how to follow application steps from my account.","متابعة أوضح للطلب","أتعرف على متابعة مراحل ترشحي من حسابي."],["candidate","Nabil A.",4,"Des missions à découvrir","Je consulte aussi les shifts et missions ponctuelles, pas seulement les emplois classiques.","Explore short shifts","I can browse shifts and short missions, not only regular jobs.","استكشاف المناوبات","أستطيع تصفح المناوبات والمهام المؤقتة إلى جانب الوظائف."],["recruiter","Khadija T.",5,"Une demande structurée","Le formulaire me guide pour préciser le métier, la ville, les horaires et la rémunération.","A structured hiring request","The form helps me describe the role, city, schedule and pay.","طلب توظيف منظم","يساعدني النموذج على تحديد المهنة والمدينة والمواعيد والأجر."],["recruiter","Rachid H.",5,"Un espace pour mon établissement","Je visualise un parcours dédié aux cafés, restaurants et hébergements.","A space for my business","I can explore a dedicated path for cafés, restaurants and accommodation.","مساحة لمؤسستي","أستكشف مسارا مخصصا للمقاهي والمطاعم وأماكن الإقامة."],["recruiter","Nora D.",4,"Des profils anonymisés","Le principe d’une mise en relation encadrée me permet de découvrir les talents sans exposition inutile.","Anonymized talent profiles","A managed introduction helps explore talent without needless exposure.","ملفات مواهب مجهولة","يساعد التعارف المنظم على اكتشاف المواهب دون كشف بيانات غير ضرورية."],["recruiter","Mehdi S.",5,"Une équipe au centre des échanges","J’aime l’idée d’un intermédiaire HORENOVA pour organiser la discussion entre les parties.","A team coordinating conversations","I like having HORENOVA coordinate communication between parties.","فريق ينظم التواصل","تعجبني فكرة تنسيق هورينوفا للتواصل بين الأطراف."],["recruiter","Salma C.",4,"Des statuts compréhensibles","Les demandes peuvent suivre un processus de vérification au lieu de disparaître après l’envoi.","Clear request statuses","Hiring requests can follow a review process instead of vanishing after submission.","حالات طلب واضحة","يمكن للطلبات المرور بمراحل مراجعة واضحة بعد الإرسال."],["recruiter","Adil B.",5,"Recruter pour un shift","Je peux formuler un besoin ponctuel avec des informations concrètes sur la mission.","Hiring for a shift","I can outline a short assignment with concrete mission details.","توظيف لمناوبة","أستطيع وصف حاجة مؤقتة بتفاصيل واضحة عن المهمة."],["recruiter","Fatima Z.",4,"Les métiers à l’honneur","Les catégories serveur, barista, cuisine et réception parlent directement à notre secteur.","Roles that fit hospitality","Waiter, barista, kitchen and reception categories match our industry.","مهن الضيافة في الواجهة","فئات النادل والباريستا والمطبخ والاستقبال تناسب قطاعنا."],["recruiter","Ilyas O.",5,"Une présentation professionnelle","La page de recrutement aide à organiser les informations avant toute mise en relation.","A professional presentation","The recruitment page organizes details before any introduction.","عرض احترافي","تنظم صفحة التوظيف المعلومات قبل بدء التواصل بين الأطراف."],["academy","Lina P.",5,"Découvrir le service en salle","L’univers Academy met en valeur les gestes et les connaissances du service.","Explore front-of-house service","Academy brings service skills and knowledge into focus.","اكتشاف خدمة القاعة","تسلط الأكاديمية الضوء على مهارات ومعارف الخدمة."],["academy","Ayoub J.",4,"L’univers barista","Je trouve une porte d’entrée pour explorer les techniques et les codes du café.","The barista world","I find an introduction to coffee techniques and service culture.","عالم الباريستا","أجد مدخلا لاستكشاف تقنيات القهوة وثقافة خدمتها."],["academy","Hajar N.",5,"Apprendre autour de la cuisine","Les contenus de cuisine donnent envie d’approfondir les bases du métier.","Explore culinary skills","The cooking content encourages me to explore the fundamentals.","التعلم في مجال الطبخ","يشجعني محتوى الطبخ على استكشاف أساسيات المهنة."],["academy","Zakaria V.",4,"L’hygiène au premier plan","La thématique hygiène montre que les bonnes pratiques comptent autant que la présentation.","Hygiene comes first","The hygiene theme shows why good practices matter as much as presentation.","النظافة أولا","يوضح قسم النظافة أهمية الممارسات الجيدة في العمل."],["academy","Asmae G.",5,"Une formation dans le même univers","Je découvre la partie apprentissage sans quitter l’écosystème HORENOVA.","Learning in one place","I can explore learning resources within the HORENOVA ecosystem.","التعلم في مكان واحد","أستكشف موارد التعلم داخل منظومة هورينوفا."],["academy","Karim W.",4,"Des métiers concrets","Le parcours présente des métiers réels de l’hospitalité avec une identité moderne.","Real-world professions","The experience showcases hospitality professions with a modern identity.","مهن واقعية","تعرض التجربة مهن الضيافة بأسلوب عصري."],["tourism","Inès A.",5,"Découvrir le Maroc autrement","La partie Explore rassemble des pistes pour préparer une visite plus sereine.","See Morocco differently","Explore brings together ideas for planning a smoother visit.","اكتشاف المغرب بطريقة مختلفة","يجمع قسم الاستكشاف أفكارا للمساعدة على التخطيط للزيارة."],["tourism","Bilal R.",4,"Un guide de séjour accessible","Je peux parcourir des repères utiles avant de choisir mes activités.","A useful travel guide","I can browse helpful pointers before choosing activities.","دليل سفر مفيد","أطالع نصائح مفيدة قبل اختيار الأنشطة."],["tourism","Sofia M.",5,"Penser à la sécurité","Les conseils de prudence m’aident à préparer mes déplacements avec plus d’attention.","Safety in mind","Practical safety tips help me plan trips more carefully.","الاهتمام بالسلامة","تساعدني نصائح السلامة على التخطيط لتنقلاتي بعناية."],["tourism","Reda K.",4,"Comparer avant de partir","La rubrique des prix encourage à vérifier les informations avant de réserver une activité.","Compare before going","The pricing guide encourages checking information before booking an activity.","المقارنة قبل الانطلاق","يشجع دليل الأسعار على التحقق من المعلومات قبل حجز أي نشاط."],["tourism","Yousra H.",5,"Des itinéraires à imaginer","L’outil d’itinéraire donne des idées pour organiser les étapes d’une journée.","Plan an itinerary","The itinerary section gives ideas for arranging a day’s stops.","تخطيط المسار","يقدم قسم المسارات أفكارا لتنظيم محطات اليوم."],["tourism","Adam Q.",4,"Gastronomie et découverte","Je peux passer des bonnes adresses aux idées d’expériences touristiques dans le même univers.","Food and discovery","I can explore food and travel experience ideas in the same place.","الطعام والاكتشاف","أستكشف أفكار الطعام والتجارب السياحية في مكان واحد."],["platform","Naïma E.",5,"Un site dans ma langue","J’apprécie de pouvoir parcourir les pages en français, en anglais ou en arabe.","A site in my language","I like being able to browse in French, English or Arabic.","موقع بلغتي","أحب إمكانية تصفح الصفحات بالعربية والفرنسية والإنجليزية."],["platform","Samir D.",4,"Un seul univers, plusieurs services","Emploi, recrutement, Academy et Explore se retrouvent dans un parcours cohérent.","Many services, one universe","Jobs, recruiting, Academy and Explore belong to one connected experience.","خدمات متعددة في عالم واحد","تجتمع الوظائف والتوظيف والأكاديمية والاستكشاف في تجربة متكاملة."],["platform","Chaimae L.",5,"Un design pensé pour le mobile","Les pages et les menus me paraissent faciles à parcourir sur téléphone.","Designed for mobile","The pages and menus are designed for browsing on a phone.","تصميم مناسب للهاتف","صممت الصفحات والقوائم لتكون مريحة على الهاتف."],["platform","Walid T.",4,"Une marque qui se distingue","Les couleurs, les titres et les espaces mettent en scène l’univers de l’hospitalité.","A distinctive identity","The colors, typography and layout celebrate the hospitality world.","هوية متميزة","تبرز الألوان والخطوط والتنسيق عالم الضيافة."]];
 const I18N={"fr":{"eyebrow":"PARCOURS EN IMAGES · EXEMPLES","heading":"Imaginez votre expérience.","subtitle":"Des mises en situation pour découvrir ce que les différents univers HORENOVA proposent. Ces personnages et étoiles sont illustratifs, pas des avis déposés par des clients.","all":"Tous","candidate":"Candidats","recruiter":"Recruteurs","academy":"Academy","tourism":"Tourisme","platform":"Plateforme","demo":"Scénario illustratif","foot":"Profil fictif · présentation du service","star":"Étoiles de démonstration, pas une note client","more":"Voir plus de scénarios","less":"Voir moins","visible":"scénarios présentés","authentic":"Voir les avis authentiques"},"en":{"eyebrow":"ILLUSTRATED JOURNEYS · EXAMPLES","heading":"Imagine your experience.","subtitle":"Illustrative scenarios to discover what HORENOVA offers across its services. These characters and stars are examples, not reviews from actual customers.","all":"All","candidate":"Candidates","recruiter":"Employers","academy":"Academy","tourism":"Travel","platform":"Platform","demo":"Illustrative scenario","foot":"Fictional profile · service showcase","star":"Decorative stars, not a customer rating","more":"Show more scenarios","less":"Show fewer","visible":"scenarios displayed","authentic":"See authentic reviews"},"ar":{"eyebrow":"تجارب توضيحية · أمثلة","heading":"تخيل تجربتك.","subtitle":"سيناريوهات توضيحية لاكتشاف خدمات هورينوفا. الشخصيات والنجوم في هذه البطاقات أمثلة وليست تقييمات من عملاء حقيقيين.","all":"الكل","candidate":"المرشحون","recruiter":"أصحاب العمل","academy":"الأكاديمية","tourism":"السياحة","platform":"المنصة","demo":"سيناريو توضيحي","foot":"شخصية افتراضية · عرض للخدمة","star":"نجوم توضيحية وليست تقييما من عميل","more":"عرض المزيد","less":"عرض أقل","visible":"سيناريوهات معروضة","authentic":"شاهد الآراء الحقيقية"}};
 const kinds=['all','candidate','recruiter','academy','tourism','platform'];
 const root=document.getElementById('experienceGallery');
 if(!root)return;
 const $=id=>document.getElementById(id);
 let filter='all', expanded=true;
 const locale=()=>['fr','en','ar'].includes(document.documentElement.lang)?document.documentElement.lang:'fr';
 const position=lang=>lang==='en'?5:lang==='ar'?7:3;
 function newEl(tag,className,text){
  const n=document.createElement(tag);
  if(className)n.className=className;
  if(text!==undefined)n.textContent=String(text);
  return n;
 }
 function render(){
  const lang=locale(),tr=I18N[lang],base=position(lang);
  $('experienceEyebrow').textContent=tr.eyebrow;
  $('experienceTitle').textContent=tr.heading;
  $('experienceSubtitle').textContent=tr.subtitle;
  $('experienceRealLink').textContent=tr.authentic+' ↗';
  const filters=$('experienceFilters');
  filters.replaceChildren();
  for(const id of kinds){
   const button=newEl('button','rv-x-filter'+(filter===id?' is-active':''),tr[id]);
   button.type='button';button.dataset.exampleFilter=id;
   button.setAttribute('aria-pressed',String(filter===id));
   button.addEventListener('click',()=>{filter=id;expanded=false;render();});
   filters.append(button);
  }
  const selected=scenarios.filter(row=>filter==='all'||row[0]===filter);
  const shown=expanded?selected:selected.slice(0,12);
  root.replaceChildren();
  for(const [category,name,rating,frTitle,frText,enTitle,enText,arTitle,arText] of shown){
   const row=[category,name,rating,frTitle,frText,enTitle,enText,arTitle,arText];
   const card=newEl('article','rv-x-card');
   const top=newEl('div','rv-x-top');
   const avatar=newEl('span','rv-x-avatar',name.slice(0,1));
   avatar.setAttribute('aria-hidden','true');
   const person=newEl('div','rv-x-person');
   person.append(newEl('strong','',name),newEl('small','',tr[category]));
   const stars=newEl('span','rv-x-stars','★'.repeat(rating)+'☆'.repeat(5-rating));
   stars.setAttribute('aria-label',tr.star);
   stars.title=tr.star;
   top.append(avatar,person,stars);
   const description=newEl('p','rv-x-text',row[base+1]);
   const title=newEl('h3','rv-x-title',row[base]);
   const marker=newEl('span','rv-x-demo',tr.demo);
   const foot=newEl('div','rv-x-foot',tr.foot);
   card.append(top,marker,title,description,foot);
   root.append(card);
  }
  $('experienceCount').textContent=shown.length+' / '+selected.length+' '+tr.visible;
  const more=$('experienceMore');
  more.hidden=selected.length<=12;
  more.textContent=expanded?tr.less:tr.more+' ('+(selected.length-12)+')';
  more.setAttribute('aria-expanded',String(expanded));
 }
 $('experienceMore').addEventListener('click',()=>{expanded=!expanded;render();});
 // The global translator may assign the same lang repeatedly on DOM updates.
 // Only rerender when the actual language changes to avoid a mutation loop.
 let lastLanguage=locale();
 const mo=new MutationObserver(()=>{
  const nextLanguage=locale();
  if(nextLanguage===lastLanguage)return;
  lastLanguage=nextLanguage;
  render();
 });
 mo.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 render();
})();
