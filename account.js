import {requireRole,currentLang} from '/mihna-global.js?v=candidate-board-r4';
import {queryItems} from '/js/wix/items.js';
import {hub} from '/hn-api.js';
const auth=await requireRole(['candidate','recruiter','admin','manager'],false);
if(auth?.role==='manager'){location.replace('/manager.html');throw Error('Redirection manager');}
if(!auth){const {getMemberState}=await import('/js/wix/member-store.js');const member=getMemberState().member;location.replace(member?.id?'/enter.html?mode=signup&finish=1':'/enter.html?mode=signin&returnTo=%2Faccount.html');throw Error('Authentification ou rôle à finaliser');}
const dash=document.getElementById('accountDashboard'),identity=document.getElementById('accountIdentity');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const name=document.createElement('b'),email=document.createElement('span'),badge=document.createElement('em');
name.textContent=auth.member?.displayName||'Compte HORENOVA';email.textContent=auth.member?.loginEmail||'';badge.textContent='COMPTE HORENOVA';
identity.replaceChildren(name,email,badge);
const accountHero=document.querySelector('.hn12-hero-copy');
const roleHeroImage=document.querySelector('.hn12-hero .bg img');
if(accountHero){
 const kicker=accountHero.querySelector('.hn12-kicker'),heading=accountHero.querySelector('h1'),subtitle=accountHero.querySelector('p');
 const pages={
  recruiter:{
   kicker:'HORENOVA · ENTREPRISES',
   heading:'Vos recrutements.<br><em>Vos futurs talents.</em>',
   subtitle:'Un cockpit professionnel pour vos offres, shifts et candidatures. Aucun quiz ni vidéo de motivation ne vous sera demandé.',
   image:'https://headless-tfcfvgrbhgw-xwassim04-1409.wix-site-host.com/assets/restaurant.jpg'
  },
  candidate:{
   kicker:'HORENOVA · CANDIDATS',
   heading:'Votre talent.<br><em>Votre avenir.</em>',
   subtitle:'Profil, langues, vidéo confidentielle, quiz métier et candidatures : tous vos progrès en un endroit.',
   image:'https://headless-tfcfvgrbhgw-xwassim04-1409.wix-site-host.com/assets/chef-action.jpg'
  },
  admin:{
   kicker:'HORENOVA · ADMINISTRATION',
   heading:'Piloter.<br><em>Protéger. Recruter.</em>',
   subtitle:'Supervision nationale des offres, validations, candidatures et mises en relation.',
   image:'https://headless-tfcfvgrbhgw-xwassim04-1409.wix-site-host.com/assets/restaurant.jpg'
  }
 };
 const page=pages[auth.role];
 if(page){
  if(kicker)kicker.textContent=page.kicker;
  if(heading)heading.innerHTML=page.heading;
  if(subtitle)subtitle.textContent=page.subtitle;
  if(roleHeroImage)roleHeroImage.src=page.image;
 }
}
badge.textContent=auth.role==='recruiter'?'COMPTE RECRUTEUR':auth.role==='admin'?'SUPERVISEUR NATIONAL':'COMPTE CANDIDAT';

const card=(tag,title,desc,links)=>'<div class="dash-card"><span>'+esc(tag)+'</span><h3>'+esc(title)+'</h3><p>'+esc(desc)+'</p>'+links.map(x=>'<a href="'+esc(x[1])+'">'+esc(x[0])+' ↗</a>').join(' · ')+'</div>';
const section=()=>'<p class="hub-muted">En cas de problème temporaire, actualisez la page. Aucune information personnelle n’est publiée dans l’annuaire.</p>';
if(auth.role==='candidate'){
 const language=currentLang();
 const translations={
  fr:{title:'Mon espace candidat.<br><em>Mes candidatures.</em>',intro:'Postulez facilement, suivez vos offres et complétez votre profil si vous le souhaitez.',heading:'Bienvenue dans votre espace',subtitle:'Une photo et vos informations suffisent pour postuler. Le quiz et la vidéo sont facultatifs.',jobs:'Découvrir les offres',shifts:'Voir les shifts',my:'Mes candidatures',none:'Vous n’avez pas encore envoyé de candidature.',status:'Suivi des demandes',profile:'Mon profil (facultatif)',profileDesc:'Ajoutez vos langues, votre expérience ou une vidéo pour enrichir votre présentation.',quiz:'Quiz métier (facultatif)',quizDesc:'Un petit exercice pour valoriser votre savoir-faire, sans bloquer vos candidatures.',edit:'Modifier mon profil',start:'Postuler maintenant'},
  en:{title:'My candidate space.<br><em>My applications.</em>',intro:'Apply easily, track jobs and improve your profile whenever you want.',heading:'Welcome to your space',subtitle:'Your details and a photo are enough. The quiz and video are optional.',jobs:'Browse jobs',shifts:'Browse shifts',my:'My applications',none:'You have not applied for a job yet.',status:'Application tracking',profile:'My profile (optional)',profileDesc:'Add languages, experience or a video to strengthen your profile.',quiz:'Job quiz (optional)',quizDesc:'Show your skills with a short quiz. It is not required to apply.',edit:'Edit my profile',start:'Apply now'},
  ar:{title:'فضاء المرشح.<br><em>ترشيحاتي.</em>',intro:'ترشح بسهولة، وتابع عروض العمل، وأكمل ملفك عندما ترغب.',heading:'مرحباً بك في حسابك',subtitle:'تكفي معلوماتك الشخصية وصورتك للتقديم. الاختبار والفيديو اختياريان.',jobs:'تصفح الوظائف',shifts:'تصفح المناوبات',my:'ترشيحاتي',none:'لم ترسل أي ترشيح بعد.',status:'متابعة الطلبات',profile:'ملفي الشخصي (اختياري)',profileDesc:'أضف اللغات والخبرة أو فيديو لتقوية ملفك.',quiz:'اختبار المهنة (اختياري)',quizDesc:'اختبار قصير لإبراز مهاراتك، وليس شرطاً للتقديم.',edit:'تعديل ملفي',start:'ترشح الآن'}
 };
 const t=translations[language]||translations.fr;
 document.getElementById('accountTitle').innerHTML=t.title;
 document.getElementById('accountSubtitle').textContent=t.intro;
 const fetched=await Promise.allSettled([hub('/api/applications'),queryItems('CandidateProfiles',{filters:[{field:'_owner',op:'eq',value:auth.member.id}],limit:1}),hub('/api/profile/candidate')]);
 const apps=fetched[0].status==='fulfilled'?fetched[0].value.items||[]:null;
 const wixProfile=fetched[1].status==='fulfilled'?fetched[1].value.items?.[0]||null:null;
 const central=fetched[2].status==='fulfilled'?fetched[2].value.profile:null;
 const profile={...wixProfile,...central};
 const incomplete=(apps||[]).filter(a=>!a.profile?.age||!String(a.profile?.bio||'').trim()||!['arabic','french','english'].every(k=>typeof a.profile?.[k]==='boolean'));
 const repairText={fr:['Complétez vos dossiers existants','Votre âge, votre présentation ou vos langues manquent dans un ou plusieurs dossiers. Enregistrez votre profil une seule fois : vos candidatures seront complétées automatiquement, sans postuler à nouveau.','Compléter mes informations'],en:['Complete your existing applications','Your age, introduction or languages are missing from one or more applications. Save your profile once to update your existing applications automatically; no need to apply again.','Complete my information'],ar:['أكمل طلباتك الحالية','ينقص العمر أو النبذة الشخصية أو اللغات في أحد طلباتك. احفظ ملفك مرة واحدة وسيتم استكمال طلباتك تلقائيا دون إعادة التقديم.','أكمل معلوماتي']};
 const rt=repairText[language]||repairText.fr;
 const repair=incomplete.length?'<section class="dash-card wide" role="status" style="border:2px solid #b45309;background:#fff7ed;color:#432407"><h3 style="color:#432407">'+esc(rt[0])+' · '+incomplete.length+'</h3><p style="color:#432407">'+esc(rt[1])+'</p><a class="hn-role-primary" href="/candidate-setup.html?returnTo=%2Faccount.html">'+esc(rt[2])+' ↗</a></section>':'';
 dash.innerHTML=repair+'<section class="hn-candidate-progress hn-easy-dashboard"><span class="small-title">HORENOVA · '+esc(t.my)+'</span>'+
  '<h3>'+esc(t.heading)+'</h3><p>'+esc(t.subtitle)+'</p>'+
  '<div class="hn-easy-dashboard-actions"><a class="hn-role-primary" href="/jobs.html">'+esc(t.jobs)+' ↗</a><a class="soft-btn" href="/shifts.html">'+esc(t.shifts)+' ↗</a></div></section>'+
  '<section class="dash-card wide"><span>'+esc(t.status)+'</span><h3>'+esc(t.my)+(apps===null?'': ' · '+apps.length)+'</h3>'+
  '<div class="mini-list">'+(apps===null?'<p>Suivi temporairement indisponible.</p>':apps.length?apps.map(a=>'<p><b>'+esc(a.jobTitle||'Candidature')+'</b><span>'+esc(a.status||'En étude')+'</span></p>').join(''):'<p>'+esc(t.none)+'</p>')+'</div>'+
  '<a href="/jobs.html">'+esc(t.start)+' ↗</a></section>'+
  card('HORENOVA · MESSAGES',language==='en'?'My private conversations':language==='ar'?'رسائلي الخاصة':'Mes conversations privées',
    language==='en'?'Reply to HORENOVA and join an approved three-way recruitment discussion.':language==='ar'?'تواصل مع هورينوفا وشارك في المحادثات المهنية الثلاثية بعد الموافقة.':'Répondez à HORENOVA et participez aux mises en relation à trois après validation.',
    [[language==='en'?'Open my inbox':language==='ar'?'فتح الرسائل':'Ouvrir ma messagerie','/conversations.html']])+
  card(t.profile,profile?.jobFamily||t.profile,t.profileDesc,[[t.edit,'/candidate-setup.html']])+
  card(t.quiz,t.quiz,t.quizDesc,[[t.quiz,'/quiz.html?role='+encodeURIComponent(profile?.jobFamily||'Serveur')]]);
}
else if(auth.role==='recruiter'){
 document.getElementById('accountTitle').innerHTML='Espace recruteur.<br><em>Pilotez vos recrutements.</em>';
 const info=await Promise.allSettled([
  queryItems('RecruiterProfiles',{filters:[{field:'_owner',op:'eq',value:auth.member.id}],limit:1}),
  hub('/api/recruiter-requests'),
  hub('/api/applications'),
  hub('/api/jobs/public')
 ]);
 const p=info[0].status==='fulfilled'?info[0].value.items?.[0]||null:null;
 const requests=info[1].status==='fulfilled'?info[1].value.items||[]:null;
 const candidates=info[2].status==='fulfilled'?info[2].value.items||[]:null;
 const approvedPublic=info[3].status==='fulfilled'?info[3].value.items||[]:null;
 const publicIds=new Set((approvedPublic||[]).map(x=>x.id));
 const liveCount=requests===null||approvedPublic===null?'—':requests.filter(x=>x.status==='VALIDEE'&&publicIds.has(x.id)).length;
 const pendingCount=requests===null?'—':requests.filter(x=>x.status==='A_EXAMINER').length;
 const needsReview=requests===null||approvedPublic===null?'—':requests.filter(x=>x.status==='VALIDEE'&&!publicIds.has(x.id)).length;
 const refusedCount=requests===null?'—':requests.filter(x=>x.status==='REFUSEE').length;
 const translations={
 fr:['ESPACE RECRUTEUR · HORENOVA','Votre équipe commence ici.','Suivez vos vraies annonces et préparez votre prochain recrutement.','En ligne','En attente','À vérifier','Refusées','＋ Nouvelle annonce','Toutes mes annonces'],
 en:['HORENOVA · EMPLOYER HUB','Build your next team.','Track verified listings and your next recruitment campaign.','Live','Pending','Check status','Rejected','＋ New job post','All my listings'],
 ar:['هورينوفا · فضاء المشغّل','ابنِ فريقك القادم.','تابع إعلاناتك المؤكدة وجهّز فرص العمل القادمة.','منشورة','قيد المراجعة','تحتاج إلى تحقق','مرفوضة','＋ إعلان جديد','جميع إعلاناتي']
 };
 const tx=translations[currentLang()]||translations.fr;
 const overview='<section class="hn-rec-command" id="recruiterCockpit"><div class="hn-rec-head"><div><span class="hn-rec-eyebrow">'+esc(tx[0])+'</span><h2>'+esc(tx[1])+'</h2><p>'+esc(tx[2])+'</p></div><a href="/recruit.html#liveRecruitForm" class="hn-rec-create">'+esc(tx[7])+'</a></div>'+
 '<div class="hn-rec-kpis">'+[[tx[3],liveCount],[tx[4],pendingCount],[tx[5],needsReview],[tx[6],refusedCount]].map(([name,num])=>'<div class="hn-rec-kpi"><span>'+esc(name)+'</span><strong>'+esc(num)+'</strong></div>').join('')+'</div><p><a href="/recruit.html" style="color:#fff;text-decoration:underline;font-weight:800">'+esc(tx[8])+' ↗</a></p></section>';

 const pending=requests?.filter(x=>x.status==='A_EXAMINER').length??null;
 const approved=requests?.filter(x=>x.status==='VALIDEE').length??null;
 const declined=requests?.filter(x=>x.status==='REFUSEE').length??null;
 const shifts=requests?.filter(x=>x.kind==='shift').length??null;
 document.body.dataset.accountRole='recruiter';
 document.getElementById('accountSubtitle').textContent=p?
   'Votre espace professionnel · '+(p.businessName||'Établissement')+' · '+(p.city||'Maroc'):
   'Commencez par présenter votre établissement pour diffuser vos besoins en recrutement.';
 const countOrUnavailable=x=>x===null?'Indisponible':String(x);
 dash.innerHTML=overview+
 '<div class="hn-role-welcome"><span>ESPACE PROFESSIONNEL / HORENOVA</span><h3>Recruter, simplement.<br>Avec un vrai suivi.</h3><p>Vous décrivez votre besoin. HORENOVA vérifie l’annonce avant publication et organise les mises en relation avec les candidats consentants.</p><a href="/recruit.html" class="hn-role-primary">+ Déposer une offre ou un shift ↗</a></div>'+
 card('01 · MON ÉTABLISSEMENT',p?.businessName||'À compléter',
   p?(p.businessType||'')+' · '+(p.city||''):'Renseignez votre établissement, sa ville et ses coordonnées professionnelles.',
   [['Gérer mon établissement','/recruiter-setup.html']])+
 card('02 · DEMANDES D’EMPLOI',countOrUnavailable(requests?.filter(x=>x.kind!=='shift').length??null),
   'Annonces soumises à HORENOVA, avec modération avant publication.',
   [['Créer une annonce','/recruit.html'],['Voir mes demandes','/recruit.html#liveRecruitJobs']])+
 card('03 · MISSIONS / SHIFTS',countOrUnavailable(shifts),
   'Précisez la date, les horaires, le métier, le nombre de postes et la rémunération.',
   [['Publier un shift','/recruit.html'],['Voir mes shifts','/recruit.html#liveRecruitJobs']])+
 card('04 · TALENTS AU MAROC','Annuaire national',
   'Découvrez les profils anonymisés par métier et par ville, sans informations privées.',
   [['Explorer les talents','/talents.html']])+
 card('05 · CANDIDATURES',countOrUnavailable(candidates?.length??null),
   'Les dossiers deviennent visibles après validation et affectation par HORENOVA.',
   [['Mes candidatures','/conversations.html']])+
 card('06 · CONVERSATIONS','Messagerie professionnelle',
   'Échange privé avec HORENOVA, puis conversation à trois avec le candidat après autorisation.',
   [['Ouvrir le chat','/conversations.html']])+
 '<div id="recruitment" class="dash-card wide"><span>ÉTAT RÉEL DE MES ANNONCES</span><h3>Votre suivi HORENOVA.</h3>'+
 (requests===null?'<p>Le serveur des demandes est temporairement inaccessible. Aucun statut n’est présumé.</p>':
 '<div class="hn-recruit-stats"><span>'+esc(tx[4])+' <b>'+pending+'</b></span><span>'+esc(tx[3])+' <b>'+liveCount+'</b></span><span>'+esc(tx[6])+' <b>'+declined+'</b></span></div>'+
 (requests.length?requests.slice(0,12).map(r=>'<p class="hn-recruit-record"><b>'+esc(r.job_title||'Demande')+'</b><span>'+esc(r.kind==='shift'?'Shift':'Emploi')+' · '+esc(r.city||'')+'</span><em>'+esc(r.status==='VALIDEE'?'Publiée':r.status==='REFUSEE'?'Refusée':'À examiner')+'</em></p>').join(''):
 '<p>Aucune demande pour le moment. Commencez par publier votre première annonce.</p>'))+
 '<a href="/recruit.html">Gérer toutes mes annonces ↗</a></div>';
}

else{
 document.getElementById('accountTitle').innerHTML='Administration HORENOVA.<br><em>Supervision nationale.</em>';
 document.body.dataset.accountRole='admin';
 const res=await Promise.allSettled([hub('/api/recruiter-requests'),hub('/api/applications'),hub('/api/analytics/admin')]);
 const reqs=res[0].status==='fulfilled'?res[0].value.items||[]:null;
 const apps=res[1].status==='fulfilled'?res[1].value.items||[]:null;
 const pending=reqs?.filter(x=>x.status==='A_EXAMINER').length??null;
 const audience=res[2].status==='fulfilled'&&res[2].value?.registrations?res[2].value:null;
 const langAudience=currentLang();
 const audienceText=({
  fr:{name:'STATISTIQUES DU SITE',label:'candidats',recruiters:'recruteurs',info:'Visiteurs et inscriptions historiques, avec compteurs séparés par source.',link:'Voir les statistiques'},
  en:{name:'SITE ANALYTICS',label:'candidates',recruiters:'recruiters',info:'Visitors and historical signups, with separate data sources.',link:'View analytics'},
  ar:{name:'إحصائيات الموقع',label:'مرشحاً',recruiters:'مشغّلين',info:'الزوار والتسجيلات منذ البداية مع فصل بيانات كل مصدر.',link:'عرض الإحصائيات'}
 })[langAudience]||{name:'STATISTIQUES DU SITE',label:'candidats',recruiters:'recruteurs',info:'Visiteurs et inscriptions.',link:'Voir les statistiques'};
 const audienceSummary=audience?String(audience.registrations.candidates)+' '+audienceText.label+' · '+String(audience.registrations.recruiters)+' '+audienceText.recruiters:'—';
 document.getElementById('accountSubtitle').textContent='Gestion privée · modération · candidatures · mise en relation.';
 dash.innerHTML=
 '<div class="hn-role-welcome"><span>CENTRE DE CONTRÔLE</span><h3>Un seul objectif.<br>Des recrutements sérieux.</h3><p>Validez les offres, coordonnez les candidatures et supervisez les conversations tout en protégeant les données personnelles.</p><a class="hn-role-primary" href="/admin.html">Ouvrir l’administration ↗</a></div>'+
 card('DEMANDES À EXAMINER',pending===null?'Indisponible':String(pending),
   'Vérification des entreprises et des offres avant publication nationale.',[['Modérer les demandes','/admin.html']])+
 card('DOSSIERS CANDIDATS',apps===null?'Indisponible':String(apps.length),
   'Candidatures, statuts et affectations recruteurs.',[['Centre candidatures','/admin.html']])+
 card(audienceText.name,audienceSummary,audienceText.info,[[audienceText.link,'/admin.html#hnAdminAnalytics']])+
 card('CHATS SUPERVISÉS','Administration',
   'Recherche par nom, métier et ville ; discussions privées et mises en relation à trois.',[['Ouvrir les conversations','/conversations.html'],['Matching & recherche','/conversations.html?mode=matching']])+
 card('ÉTABLISSEMENTS',reqs===null?'Indisponible':String(new Set(reqs.map(x=>x.recruiter_wix_id)).size),
   'Suivi des recruteurs actifs et de leurs demandes.',[['Gérer les recruteurs','/admin.html']])+
 card('SERVICES HORENOVA','Plateforme',
   'Gestion des fonctionnalités commerciales et outils professionnels.',[['Outils business','/business.html']]);
}



const supportLang=currentLang();
const supportTxt={
 fr:{title:'Assistance HORENOVA',desc:'Posez votre question à nos superviseurs, suivez votre demande et retrouvez les réponses. Ligne directe : 0648377009.',chat:'Écrire au support',call:'Appeler le support'},
 en:{title:'HORENOVA support',desc:'Message our supervisors, track your requests and view replies. Phone: 0648377009.',chat:'Open support chat',call:'Call support'},
 ar:{title:'دعم هورينوفا',desc:'أرسل استفسارك إلى المشرفين، تابع طلبك واطلع على الردود. الهاتف: 0648377009.',chat:'محادثة الدعم',call:'اتصل بالدعم'}
}[supportLang]||{title:'Assistance HORENOVA',desc:'Parlez avec notre équipe. Téléphone : 0648377009.',chat:'Support',call:'Appeler'};
dash.insertAdjacentHTML('beforeend',card('HORENOVA · SUPPORT',supportTxt.title,supportTxt.desc,[[supportTxt.chat,'/support.html'],[supportTxt.call,'tel:+212648377009']]));

const language=currentLang();
const roleCopies={"en":{"ESPACE PROFESSIONNEL / HORENOVA":"HORENOVA / EMPLOYER HUB","Recruter, simplement.":"Recruit with confidence.","Avec un vrai suivi.":"With transparent tracking.","Vous décrivez votre besoin. HORENOVA vérifie l’annonce avant publication et organise les mises en relation avec les candidats consentants.":"Describe your needs. HORENOVA reviews the vacancy before publication and coordinates introductions with consenting candidates.","+ Déposer une offre ou un shift":"+ Post a job or shift","01 · MON ÉTABLISSEMENT":"01 · MY BUSINESS","02 · DEMANDES D’EMPLOI":"02 · JOB REQUESTS","03 · MISSIONS / SHIFTS":"03 · SHIFTS","04 · TALENTS AU MAROC":"04 · TALENT ACROSS MOROCCO","05 · CANDIDATURES":"05 · APPLICATIONS","06 · CONVERSATIONS":"06 · CONVERSATIONS","ÉTAT RÉEL DE MES ANNONCES":"MY LIVE LISTING STATUS","Votre suivi HORENOVA.":"Your HORENOVA overview.","En attente":"Pending","Publiées":"Published","Refusées":"Rejected","Gérer toutes mes annonces":"Manage all my requests","Gérer mon établissement":"Manage my business","Créer une annonce":"Create a job","Voir mes demandes":"View requests","Publier un shift":"Post a shift","Voir mes shifts":"View shifts","Explorer les talents":"Browse talents","Mes candidatures":"My applications","Ouvrir le chat":"Open chat","Votre espace professionnel":"Your employer hub","Aucune demande pour le moment. Commencez par publier votre première annonce.":"No requests yet. Start by posting your first vacancy.","CENTRE DE CONTRÔLE":"CONTROL CENTER","Un seul objectif.":"One shared goal.","Des recrutements sérieux.":"Trusted recruitment.","Ouvrir l’administration":"Open administration","DEMANDES À EXAMINER":"REQUESTS TO REVIEW","DOSSIERS CANDIDATS":"CANDIDATE APPLICATIONS","CHATS SUPERVISÉS":"SUPERVISED CHATS","ÉTABLISSEMENTS":"BUSINESSES","SERVICES HORENOVA":"HORENOVA SERVICES","Modérer les demandes":"Review requests","Centre candidatures":"Applications center","Ouvrir les conversations":"Open conversations","Gérer les recruteurs":"Manage employers","Outils business":"Business tools","Indisponible":"Unavailable","À compléter":"To complete","COMPTE RECRUTEUR":"EMPLOYER ACCOUNT","COMPTE ADMINISTRATEUR":"ADMIN ACCOUNT","COMPTE CANDIDAT":"CANDIDATE ACCOUNT"},"ar":{"ESPACE PROFESSIONNEL / HORENOVA":"هورينوفا / فضاء المشغّل","Recruter, simplement.":"وظّف بكل سهولة.","Avec un vrai suivi.":"وتابع كل خطوة.","Vous décrivez votre besoin. HORENOVA vérifie l’annonce avant publication et organise les mises en relation avec les candidats consentants.":"حدّد احتياجات مؤسستك، وسيقوم فريق هورينوفا بمراجعة الإعلان قبل نشره وتنظيم التواصل مع المرشحين بعد موافقتهم.","+ Déposer une offre ou un shift":"+ إضافة وظيفة أو مهمة قصيرة","01 · MON ÉTABLISSEMENT":"01 · مؤسستي","02 · DEMANDES D’EMPLOI":"02 · إعلانات التوظيف","03 · MISSIONS / SHIFTS":"03 · المهام القصيرة","04 · TALENTS AU MAROC":"04 · المواهب في المغرب","05 · CANDIDATURES":"05 · الترشيحات","06 · CONVERSATIONS":"06 · المحادثات","ÉTAT RÉEL DE MES ANNONCES":"حالة إعلاناتي الفعلية","Votre suivi HORENOVA.":"متابعة نشاطك على هورينوفا.","En attente":"قيد المراجعة","Publiées":"المنشورة","Refusées":"المرفوضة","Gérer toutes mes annonces":"إدارة جميع الإعلانات","Gérer mon établissement":"إدارة المؤسسة","Créer une annonce":"إنشاء إعلان","Voir mes demandes":"عرض طلباتي","Publier un shift":"نشر مهمة قصيرة","Voir mes shifts":"عرض المهمات","Explorer les talents":"استكشاف المواهب","Mes candidatures":"الترشيحات الخاصة بي","Ouvrir le chat":"فتح المحادثة","Votre espace professionnel":"فضاؤك المهني","Aucune demande pour le moment. Commencez par publier votre première annonce.":"ليس لديك أي إعلان حالياً. ابدأ بإضافة أول وظيفة.","CENTRE DE CONTRÔLE":"مركز الإدارة","Un seul objectif.":"هدف واحد.","Des recrutements sérieux.":"توظيف موثوق.","Ouvrir l’administration":"فتح الإدارة","DEMANDES À EXAMINER":"طلبات قيد المراجعة","DOSSIERS CANDIDATS":"ملفات المرشحين","CHATS SUPERVISÉS":"محادثات خاضعة للإشراف","ÉTABLISSEMENTS":"المؤسسات","SERVICES HORENOVA":"خدمات هورينوفا","Modérer les demandes":"مراجعة الطلبات","Centre candidatures":"مركز الترشيحات","Ouvrir les conversations":"فتح المحادثات","Gérer les recruteurs":"إدارة المشغّلين","Outils business":"أدوات الأعمال","Indisponible":"غير متاح","À compléter":"غير مكتمل","COMPTE RECRUTEUR":"حساب المشغّل","COMPTE ADMINISTRATEUR":"حساب المدير","COMPTE CANDIDAT":"حساب المرشح"}};
if((language==='en'||language==='ar')&&roleCopies[language]){
  const dictionary=roleCopies[language];
  const translateMarkup=str=>{
    let value=String(str||'');
    for(const [fr,tr] of Object.entries(dictionary))value=value.split(fr).join(tr);
    return value;
  };
  if(auth.role!=='candidate'){
    dash.innerHTML=translateMarkup(dash.innerHTML);
    const subtitle=document.getElementById('accountSubtitle');
    if(subtitle)subtitle.textContent=translateMarkup(subtitle.textContent);
  }
  badge.textContent=translateMarkup(badge.textContent);
  const heading=document.getElementById('accountTitle');
  if(heading && auth.role==='recruiter')heading.innerHTML=language==='ar'
    ? 'فضاء المشغّل.<br><em>أدر احتياجات مؤسستك.</em>'
    : 'Employer dashboard.<br><em>Manage your recruitment.</em>';
  if(heading && auth.role==='admin')heading.innerHTML=language==='ar'
    ? 'إدارة هورينوفا.<br><em>متابعة التوظيف الوطني.</em>'
    : 'HORENOVA Admin.<br><em>National recruitment oversight.</em>';
  if(accountHero){
    const heroHeading=accountHero.querySelector('h1');
    const heroSubtitle=accountHero.querySelector('p');
    const translated={
      recruiter:{
        en:['Your next team.<br><em>Your best talent.</em>','A professional space for jobs, shifts, talent and applications. No quiz or motivation video required.'],
        ar:['فريق مؤسستك.<br><em>يبدأ من هنا.</em>','فضاء مهني للوظائف والمهام القصيرة والمواهب والترشيحات. دون اختبار مهني أو فيديو تحفيزي للمشغّل.']
      },
      admin:{
        en:['Lead.<br><em>Protect. Connect.</em>','Supervise job moderation, applications and approved recruitment introductions across Morocco.'],
        ar:['أدِر.<br><em>احمِ. واصل.</em>','راقب إعلانات الوظائف والترشيحات وعمليات الربط بين المرشحين والمؤسسات في المغرب.']
      }
    }[auth.role]?.[language];
    if(translated){
      if(heroHeading)heroHeading.innerHTML=translated[0];
      if(heroSubtitle)heroSubtitle.textContent=translated[1];
    }
  }
}

if(['candidate','recruiter'].includes(auth.role)){const link=document.createElement('a');link.href='/professional-reviews.html';link.className='hn-role-primary';link.textContent=currentLang()==='ar'?'التقييمات المهنية ★':currentLang()==='en'?'Professional reviews ★':'Avis professionnels ★';const section=document.createElement('section');section.className='dash-card wide';section.append(link);dash.prepend(section);}

