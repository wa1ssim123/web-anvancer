import {requireRole,currentLang} from '/mihna-global.js';
import {queryItems} from '/js/wix/items.js';
import {hub} from '/hn-api.js';
const auth=await requireRole(['candidate','recruiter','admin'],false);
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
 const language=currentLang();const l={
  fr:{title:'Mon espace candidat.<br><em>Votre progression.</em>',intro:'Votre parcours professionnel, étape par étape.',heading:'Préparez votre candidature',complete:'Prêt à postuler',progress:'Votre inscription avance',stepProfile:'Profil et informations',stepVideo:'Présentation vidéo privée',stepQuiz:'Quiz du métier',stepPhoto:'Photo privée',action:'Compléter mon dossier',quizAction:'Passer le quiz métier',unknown:'À vérifier',missing:'À compléter',done:'Validé',only:'Vous pouvez postuler aux offres correspondant à votre quiz métier.',mismatch:'Un quiz validé pour un métier différent ne débloque pas cette candidature.'},
  en:{title:'My candidate space.<br><em>Your progress.</em>',intro:'Your professional journey, step by step.',heading:'Prepare your application',complete:'Ready to apply',progress:'Your registration progress',stepProfile:'Profile and information',stepVideo:'Private introduction video',stepQuiz:'Profession quiz',stepPhoto:'Private portrait',action:'Complete my file',quizAction:'Take the profession quiz',unknown:'To check',missing:'To complete',done:'Completed',only:'You may apply to jobs matching your profession quiz.',mismatch:'A quiz passed for another profession will not unlock this application.'},
  ar:{title:'فضاء المرشح.<br><em>تقدّم ملفك.</em>',intro:'ملفك المهني خطوة بخطوة.',heading:'جهّز ترشيحك',complete:'جاهز للتقديم',progress:'تقدّم التسجيل',stepProfile:'المعلومات الشخصية',stepVideo:'الفيديو التعريفي الخاص',stepQuiz:'اختبار المهنة',stepPhoto:'الصورة الخاصة',action:'إكمال ملفي',quizAction:'اجتياز اختبار المهنة',unknown:'بانتظار التحقق',missing:'غير مكتمل',done:'مكتمل',only:'يمكنك الترشح للإعلانات المطابقة لاختبار مهنتك.',mismatch:'اختبار مهنة أخرى لا يفتح الترشح لهذه الوظيفة.'}
 }[language]||null;
 const t=l||{title:'Mon espace candidat.<br><em>Votre progression.</em>',intro:'Votre parcours professionnel, étape par étape.',heading:'Préparez votre candidature',complete:'Prêt à postuler',progress:'Votre inscription avance',stepProfile:'Profil et informations',stepVideo:'Présentation vidéo privée',stepQuiz:'Quiz du métier',stepPhoto:'Photo privée',action:'Compléter mon dossier',quizAction:'Passer le quiz métier',unknown:'À vérifier',missing:'À compléter',done:'Validé',only:'Vous pouvez postuler aux offres correspondant à votre quiz métier.',mismatch:'Un quiz validé pour un métier différent ne débloque pas cette candidature.'};
 document.getElementById('accountTitle').innerHTML=t.title;
 let p=null,apps=null,attempts=null,photo=null,profileState='unknown';
 const results=await Promise.allSettled([
  queryItems('CandidateProfiles',{filters:[{field:'_owner',op:'eq',value:auth.member.id}],limit:1}),
  hub('/api/applications'),
  queryItems('QuizAttempts',{filters:[{field:'_owner',op:'eq',value:auth.member.id}],limit:100}),
  hub('/api/profile/photo/status')
 ]);
 if(results[0].status==='fulfilled'){p=results[0].value.items?.[0]||null;profileState=p?.profileComplete?'complete':'missing';}
 if(results[1].status==='fulfilled')apps=results[1].value.items||[];
 if(results[2].status==='fulfilled')attempts=results[2].value.items||[];
 if(results[3].status==='fulfilled')photo=!!results[3].value.hasPhoto;
 const family=p?.jobFamily||'Serveur';
 const best=attempts?.filter(x=>x.passed&&x.jobFamily===family).sort((a,b)=>(Number(b.score)||0)-(Number(a.score)||0))[0];
 const quizReady=!!best,videoReady=!!(p?.videoFileId&&p?.videoConsent);
 const steps=[
  [t.stepProfile,profileState==='complete'?true:profileState==='unknown'?null:false,'/candidate-setup.html'],
  [t.stepVideo,profileState==='unknown'?null:videoReady,'/candidate-setup.html'],
  [t.stepQuiz,attempts===null?null:quizReady,'/quiz.html?role='+encodeURIComponent(family)],
  [t.stepPhoto,photo,'/candidate-setup.html']
 ];
 const ready=steps.every(x=>x[1]===true);
 const progress=steps.filter(x=>x[1]===true).length;
 document.getElementById('accountSubtitle').textContent=t.intro;
 dash.innerHTML='<section class="hn-candidate-progress"><span class="small-title">HORENOVA · '+esc(t.progress)+'</span><h3>'+esc(ready?t.complete:t.heading)+' · '+progress+'/4</h3>'+
 '<ol>'+steps.map(([label,ok,url])=>'<li>'+(ok===true?'✓ ':ok===false?'○ ':'? ')+esc(label)+' — <strong>'+esc(ok===true?t.done:ok===false?t.missing:t.unknown)+'</strong>'+(ok===true?'':' · <a href="'+esc(url)+'">'+esc(t.action)+'</a>')+'</li>').join('')+'</ol>'+
 '<p>'+esc(t.only)+'</p><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px"><a class="hn-role-primary" href="'+(profileState!=='complete'||!videoReady?'/candidate-setup.html':'/quiz.html?role='+encodeURIComponent(family))+'">'+esc(ready?t.quizAction:t.action)+' ↗</a><a class="soft-btn" href="/jobs.html">Offres HORENOVA →</a></div></section>'+
 card(t.stepProfile,p?.profileComplete?t.done:t.missing,p?(p.jobFamily||'')+' · '+(p.city||''):'Votre identité et votre métier.',[[t.action,'/candidate-setup.html']])+
 card(t.stepQuiz,best?best.score+' %':attempts===null?t.unknown:t.missing,t.mismatch,[[t.quizAction,'/quiz.html?role='+encodeURIComponent(family)]])+
 card(t.stepVideo,videoReady?t.done:t.missing,'Document privé réservé aux recrutements autorisés.',[[t.action,'/candidate-setup.html']])+
 '<div class="dash-card wide"><span>CANDIDATURES · HORENOVA</span><h3>'+(apps===null?t.unknown:apps.length)+'</h3><div class="mini-list">'+(apps===null?'<p>Suivi temporairement indisponible.</p>':apps.length?apps.map(a=>'<p><b>'+esc(a.jobTitle||'Candidature')+'</b><span>'+esc(a.status||'En étude')+'</span></p>').join(''):'<p>Aucune candidature déposée.</p>')+'</div><a href="/jobs.html">Voir les offres ↗</a> · <a href="/conversations.html">Mes conversations ↗</a></div>';
}
else if(auth.role==='recruiter'){
 document.getElementById('accountTitle').innerHTML='Espace recruteur.<br><em>Pilotez vos recrutements.</em>';
 const info=await Promise.allSettled([
  queryItems('RecruiterProfiles',{filters:[{field:'_owner',op:'eq',value:auth.member.id}],limit:1}),
  hub('/api/recruiter-requests'),
  hub('/api/applications')
 ]);
 const p=info[0].status==='fulfilled'?info[0].value.items?.[0]||null:null;
 const requests=info[1].status==='fulfilled'?info[1].value.items||[]:null;
 const candidates=info[2].status==='fulfilled'?info[2].value.items||[]:null;
 const pending=requests?.filter(x=>x.status==='A_EXAMINER').length??null;
 const approved=requests?.filter(x=>x.status==='VALIDEE').length??null;
 const declined=requests?.filter(x=>x.status==='REFUSEE').length??null;
 const shifts=requests?.filter(x=>x.kind==='shift').length??null;
 document.body.dataset.accountRole='recruiter';
 document.getElementById('accountSubtitle').textContent=p?
   'Votre espace professionnel · '+(p.businessName||'Établissement')+' · '+(p.city||'Maroc'):
   'Commencez par présenter votre établissement pour diffuser vos besoins en recrutement.';
 const countOrUnavailable=x=>x===null?'Indisponible':String(x);
 dash.innerHTML=
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
 card('06 · CONVERSATIONS','Espace sécurisé',
   'Chat candidat + recruteur + administrateur, après accord et mise en relation.',
   [['Ouvrir le chat','/conversations.html']])+
 '<div id="recruitment" class="dash-card wide"><span>ÉTAT RÉEL DE MES ANNONCES</span><h3>Votre suivi HORENOVA.</h3>'+
 (requests===null?'<p>Le serveur des demandes est temporairement inaccessible. Aucun statut n’est présumé.</p>':
 '<div class="hn-recruit-stats"><span>En attente <b>'+pending+'</b></span><span>Publiées <b>'+approved+'</b></span><span>Refusées <b>'+declined+'</b></span></div>'+
 (requests.length?requests.slice(0,12).map(r=>'<p class="hn-recruit-record"><b>'+esc(r.job_title||'Demande')+'</b><span>'+esc(r.kind==='shift'?'Shift':'Emploi')+' · '+esc(r.city||'')+'</span><em>'+esc(r.status==='VALIDEE'?'Publiée':r.status==='REFUSEE'?'Refusée':'À examiner')+'</em></p>').join(''):
 '<p>Aucune demande pour le moment. Commencez par publier votre première annonce.</p>'))+
 '<a href="/recruit.html">Gérer toutes mes annonces ↗</a></div>';
}

else{
 document.getElementById('accountTitle').innerHTML='Administration HORENOVA.<br><em>Supervision nationale.</em>';
 document.body.dataset.accountRole='admin';
 const res=await Promise.allSettled([hub('/api/recruiter-requests'),hub('/api/applications')]);
 const reqs=res[0].status==='fulfilled'?res[0].value.items||[]:null;
 const apps=res[1].status==='fulfilled'?res[1].value.items||[]:null;
 const pending=reqs?.filter(x=>x.status==='A_EXAMINER').length??null;
 document.getElementById('accountSubtitle').textContent='Gestion privée · modération · candidatures · mise en relation.';
 dash.innerHTML=
 '<div class="hn-role-welcome"><span>CENTRE DE CONTRÔLE</span><h3>Un seul objectif.<br>Des recrutements sérieux.</h3><p>Validez les offres, coordonnez les candidatures et supervisez les conversations tout en protégeant les données personnelles.</p><a class="hn-role-primary" href="/admin.html">Ouvrir l’administration ↗</a></div>'+
 card('DEMANDES À EXAMINER',pending===null?'Indisponible':String(pending),
   'Vérification des entreprises et des offres avant publication nationale.',[['Modérer les demandes','/admin.html']])+
 card('DOSSIERS CANDIDATS',apps===null?'Indisponible':String(apps.length),
   'Candidatures, statuts et affectations recruteurs.',[['Centre candidatures','/admin.html']])+
 card('CHATS SUPERVISÉS','Administration',
   'Accès encadré aux conversations liées à chaque candidature.',[['Ouvrir les conversations','/conversations.html']])+
 card('ÉTABLISSEMENTS',reqs===null?'Indisponible':String(new Set(reqs.map(x=>x.recruiter_wix_id)).size),
   'Suivi des recruteurs actifs et de leurs demandes.',[['Gérer les recruteurs','/admin.html']])+
 card('SERVICES HORENOVA','Plateforme',
   'Gestion des fonctionnalités commerciales et outils professionnels.',[['Outils business','/business.html']]);
}


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
