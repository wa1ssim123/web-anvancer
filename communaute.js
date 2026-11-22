import {queryItems} from '/js/wix/items.js';
/* HORENOVA community page. Only public Wix active jobs and admin-approved
 * central vacancies are listed. Never import private applicants or contacts.
 * WhatsApp link is enabled only after verified admin publication in the API. */
const API='https://horenova-hub-api.onrender.com';
const LOCAL={
 fr:{
  navJobs:'Offres',navShifts:'Shifts',mySpace:'Mon espace',
  overline:'HORENOVA · LE FIL OFFICIEL',heroTitle:'Les opportunités viennent à vous.',
  heroDesc:"Retrouvez les emplois, les shifts et les nouveautés des métiers de l'hôtellerie, de la restauration et du tourisme au Maroc. Accès libre, sans compte pour consulter.",
  seeOffers:'Explorer les offres ↘',hire:'Je recrute ↗',verified:'Annonces validées',country:'Tout le Maroc',public:'Accès libre',liveFeed:'LE FIL HORENOVA',
  jobCategory:"Offres d'emploi",jobSubtitle:'Service · cuisine · hôtellerie',shiftCategory:'Shifts & extras',shiftSubtitle:'Missions flexibles au Maroc',
  updatesCategory:'Actualités & formations',updatesSubtitle:'Conseils · nouveautés · Academy',waLabel:'LE CANAL WHATSAPP OFFICIEL',waTitle:'Ne manquez pas la prochaine opportunité.',
  waDesc:'Abonnez-vous pour voir les annonces et les nouvelles publications HORENOVA directement dans WhatsApp.',
  follow:'Suivre sur WhatsApp ↗',waPending:'Le lien du canal officiel sera publié ici dès son activation.',waUnavailable:'Le lien du canal est temporairement indisponible. Consultez nos offres ci-dessous.',
  waPrivacy:"Canal d'informations · pas de discussion publique",latest:'OPPORTUNITÉS PUBLIÉES',opportunities:'Les offres réelles, au même endroit.',
  opportunitiesDesc:'Uniquement les offres ouvertes ou validées sur HORENOVA. Aucune annonce fictive.',searchLabel:'Rechercher une opportunité',searchPlaceholder:'Métier, établissement ou ville…',
  cityLabel:'Ville',allCities:'Toutes les villes',all:'Tout voir',jobs:'Emplois',shifts:'Shifts',loading:'Chargement des offres publiées…',
  count:n=>n+' opportunité'+(n>1?'s':'')+' publiée'+(n>1?'s':''),none:'Aucune offre publiée ne correspond à votre recherche.',
  noPublish:'Aucune offre vérifiée disponible pour le moment. Revenez découvrir les prochaines publications.',
  feedError:'Impossible de charger les offres en ce moment. Vous pouvez toujours ouvrir les pages Offres et Shifts.',
  more:"Voir plus d'offres ↓",allJobs:'Toutes les offres ↗',allShifts:'Toutes les missions ↗',jobLabel:'EMPLOI',shiftLabel:'SHIFT',cityFallback:'Maroc',
  employerFallback:'Établissement HORENOVA',consult:'Voir l’offre ↗',share:'Partager',shareTitle:'Offre HORENOVA',universe:'TOUS NOS UNIVERS',moreTitle:"Plus qu'un site d'emploi.",
  academyTitle:'Développer ses compétences',academyDesc:"Découvrir les formations pour les métiers de l'hospitalité.",
  shopTitle:"S'équiper pour son métier",shopDesc:'Explorer les tenues, accessoires et équipements professionnels.',
  exploreTitle:'Découvrir le Maroc',exploreDesc:'Voyages, tourisme, guides et expériences.',
  techTitle:'Moderniser son établissement',techDesc:'Logiciels, caisse, gestion et menus NFC.',
  footer:'Emploi, restauration & tourisme · Maroc',support:'Assistance',hireFooter:'Publier une offre'
 },
 en:{
  navJobs:'Jobs',navShifts:'Shifts',mySpace:'My account',
  overline:'HORENOVA · OFFICIAL NEWS',heroTitle:'Opportunities come to you.',
  heroDesc:'Find jobs, flexible shifts and updates in hospitality, restaurants and tourism across Morocco. Browse without creating an account.',
  seeOffers:'Explore jobs ↘',hire:'I am hiring ↗',verified:'Reviewed listings',country:'Across Morocco',public:'Open to everyone',liveFeed:'HORENOVA NEWS',
  jobCategory:'Job offers',jobSubtitle:'Service · kitchen · hospitality',shiftCategory:'Shifts & extras',shiftSubtitle:'Flexible work across Morocco',
  updatesCategory:'News & training',updatesSubtitle:'Tips · updates · Academy',waLabel:'OFFICIAL WHATSAPP CHANNEL',waTitle:'Never miss your next opportunity.',
  waDesc:'Follow our official updates on jobs, shifts and HORENOVA news directly in WhatsApp.',
  follow:'Follow on WhatsApp ↗',waPending:'Our official WhatsApp channel link will appear here after activation.',waUnavailable:'Channel link temporarily unavailable. Browse our open positions below.',
  waPrivacy:'One-way information channel · not a group chat',latest:'PUBLISHED OPPORTUNITIES',opportunities:'Real opportunities, together.',
  opportunitiesDesc:'Only active or approved HORENOVA vacancies. No invented jobs.',searchLabel:'Find an opportunity',searchPlaceholder:'Job, business or city…',
  cityLabel:'City',allCities:'All cities',all:'All',jobs:'Jobs',shifts:'Shifts',loading:'Loading published jobs…',
  count:n=>n+' published opportunit'+(n===1?'y':'ies'),none:'No published openings match your search.',
  noPublish:'No verified openings at the moment. Check back for updates.',
  feedError:'Job listings are temporarily unavailable. You can still visit the Jobs and Shifts pages.',
  more:'Show more ↓',allJobs:'All jobs ↗',allShifts:'All shifts ↗',jobLabel:'JOB',shiftLabel:'SHIFT',cityFallback:'Morocco',
  employerFallback:'HORENOVA business',consult:'View offer ↗',share:'Share',shareTitle:'HORENOVA vacancy',
  universe:'OUR UNIVERSE',moreTitle:'More than a job board.',
  academyTitle:'Build your skills',academyDesc:'Explore training for hospitality careers.',
  shopTitle:'Equip your team',shopDesc:'Browse uniforms, accessories and equipment.',
  exploreTitle:'Discover Morocco',exploreDesc:'Travel, tourism, guides and experiences.',
  techTitle:'Modernize your business',techDesc:'POS, stock management and NFC menus.',
  footer:'Hospitality, jobs & tourism · Morocco',support:'Support',hireFooter:'Post a job'
 },
 ar:{
  navJobs:'الوظائف',navShifts:'المهام',mySpace:'حسابي',
  overline:'هورينوفا · الأخبار الرسمية',heroTitle:'الفرص تصل إليك.',
  heroDesc:'اكتشف فرص الشغل والمهام المرنة وآخر أخبار الفنادق والمطاعم والسياحة في المغرب. تصفح بدون إنشاء حساب.',
  seeOffers:'اكتشف الفرص ↙',hire:'أبحث عن موظفين ↗',verified:'إعلانات تمت مراجعتها',country:'جميع أنحاء المغرب',public:'التصفح مفتوح للجميع',liveFeed:'أخبار هورينوفا',
  jobCategory:'فرص العمل',jobSubtitle:'الخدمة · المطبخ · الفنادق',shiftCategory:'المهام والعمل الإضافي',shiftSubtitle:'مهام مرنة في المغرب',
  updatesCategory:'الأخبار والتكوين',updatesSubtitle:'نصائح · مستجدات · أكاديمي',waLabel:'قناة واتساب الرسمية',waTitle:'لا تفوّت فرصة عمل جديدة.',
  waDesc:'تابع إعلانات العمل والمهام وآخر أخبار هورينوفا مباشرة عبر واتساب.',
  follow:'تابع على واتساب ↗',waPending:'سيظهر رابط قناة واتساب الرسمية هنا بعد تفعيلها.',waUnavailable:'رابط القناة غير متاح مؤقتاً. يمكنك تصفح فرص العمل أدناه.',
  waPrivacy:'قناة لنشر الأخبار · وليست دردشة جماعية',latest:'الفرص المنشورة',opportunities:'عروض حقيقية في مكان واحد.',
  opportunitiesDesc:'نعرض فقط الإعلانات النشطة أو المعتمدة في هورينوفا، بدون عروض وهمية.',searchLabel:'ابحث عن فرصة',searchPlaceholder:'المهنة أو المؤسسة أو المدينة…',
  cityLabel:'المدينة',allCities:'جميع المدن',all:'الكل',jobs:'وظائف',shifts:'مهام',loading:'جارٍ تحميل الفرص المنشورة…',
  count:n=>n+' من الفرص المنشورة',none:'لا توجد عروض تطابق البحث.',
  noPublish:'لا توجد عروض معتمدة حالياً. تابع الصفحة لمعرفة الجديد.',
  feedError:'تعذر تحميل العروض مؤقتاً. يمكنك زيارة صفحات الوظائف والمهام.',
  more:'المزيد من الفرص ↓',allJobs:'جميع الوظائف ↗',allShifts:'جميع المهام ↗',jobLabel:'وظيفة',shiftLabel:'مهمة',cityFallback:'المغرب',
  employerFallback:'مؤسسة هورينوفا',consult:'تفاصيل العرض ↗',share:'مشاركة',shareTitle:'عرض عمل هورينوفا',
  universe:'عالم هورينوفا',moreTitle:'أكثر من مجرد منصة توظيف.',
  academyTitle:'تطوير المهارات',academyDesc:'اكتشف التكوين في المهن السياحية والفندقية.',
  shopTitle:'معدات وملابس العمل',shopDesc:'تصفح الأزياء والمستلزمات المهنية.',
  exploreTitle:'اكتشف المغرب',exploreDesc:'السفر والسياحة والمرشدون والتجارب.',
  techTitle:'طوّر مؤسستك',techDesc:'نظام الصندوق والتسيير وقوائم NFC.',
  footer:'الوظائف والمطاعم والسياحة · المغرب',support:'المساعدة',hireFooter:'نشر إعلان'
 }
};
const root=document,element=id=>root.getElementById(id);
let locale='fr',allJobs=[],selected='all',visibleCount=9,loaded=false,failed=false,channelFailed=false;
const phrase=key=>LOCAL[locale][key];
const localeFromStorage=()=>{try{return localStorage.getItem('mihna-lang')||'fr'}catch{return 'fr'}};
function setLocale(code){
 locale=['fr','en','ar'].includes(code)?code:'fr';
 try{localStorage.setItem('mihna-lang',locale)}catch{}
 root.documentElement.lang=locale;
 root.documentElement.dir=locale==='ar'?'rtl':'ltr';
 element('hn-language-control').value=locale;
 for(const el of root.querySelectorAll('[data-i18n]')){
  const translation=phrase(el.dataset.i18n);
  if(typeof translation==='string')el.textContent=translation;
 }
 for(const el of root.querySelectorAll('[data-i18n-placeholder]')){
  const translation=phrase(el.dataset.i18nPlaceholder);
  if(typeof translation==='string')el.placeholder=translation;
 }
 root.title=locale==='ar'?'مجتمع هورينوفا · الوظائف وقناة واتساب':locale==='en'?'HORENOVA Community · Jobs and WhatsApp Channel':'Communauté HORENOVA — Offres, shifts et canal WhatsApp';
 element('hcWaiting').textContent=channelFailed?phrase('waUnavailable'):phrase('waPending');
 render();
}
function validChannel(value){
 try{
  const u=new URL(value);
  const match=u.pathname.match(/^\/channel\/([A-Za-z0-9_-]{12,128})\/?$/);
  return u.protocol==='https:'&&['whatsapp.com','www.whatsapp.com'].includes(u.hostname)&&!u.port&&!u.username&&!u.password&&!u.search&&!u.hash&&match
   ?'https://whatsapp.com/channel/'+match[1]:null;
 }catch{return null}
}
async function loadChannel(){
 const button=element('hcFollow'),waiting=element('hcWaiting');
 try{
  const response=await fetch(API+'/api/community/channel',{cache:'no-store',signal:AbortSignal.timeout(12500)});
  if(!response.ok)throw Error('Channel not readable');
  const data=await response.json();
  channelFailed=false;
  const canonical=data.active?validChannel(data.url):null;
  if(canonical){button.href=canonical;button.hidden=false;waiting.hidden=true;}
  else{button.removeAttribute('href');button.hidden=true;waiting.hidden=false;}
 }catch{
  channelFailed=true;
  button.hidden=true;button.removeAttribute('href');waiting.hidden=false;
  waiting.textContent=phrase('waUnavailable');
 }
}
const clean=v=>String(v??'').trim();
const normalizeJob=(item,source)=>{
 const rawId=clean(item.id||item._id);
 if(!rawId||rawId.length>140)return null;
 const kind=item.kind==='shift'?'shift':'job';
 const job={
  id:rawId,kind,
  title:clean(item.title||item.jobTitle||''),
  role:clean(item.role||item.jobRole||''),
  business:clean(item.businessName||item.business||''),
  city:clean(item.city||''),
  pay:clean(item.salaryText||item.pay||''),
  published:clean(item.createdAt||item._createdDate||''),
  date:clean(item.startDate||''),
  source
 };
 if(!job.title)return null;
 if(kind==='shift'&&/^\d{4}-\d{2}-\d{2}$/.test(job.date)){
  const today=new Date();const now=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
  if(job.date<now)return null;
 }
 return job;
};
async function getCentralJobs(){
 const response=await fetch(API+'/api/jobs/public',{cache:'no-store',signal:AbortSignal.timeout(12500)});
 if(!response.ok)throw Error('Approved jobs unavailable');
 const data=await response.json();
 return Array.isArray(data.items)?data.items:[];
}
async function loadJobs(){
 failed=false;loaded=false;
 element('hcResultStatus').textContent=phrase('loading');
 const results=await Promise.allSettled([
  queryItems('Jobs',{filters:[{field:'active',op:'eq',value:true}],sort:[{field:'_createdDate',direction:'desc'}],limit:100}),
  getCentralJobs()
 ]);
 const successful=results.filter(x=>x.status==='fulfilled');
 failed=successful.length===0;
 const wix=results[0].status==='fulfilled'?results[0].value.items||[]:[];
 const central=results[1].status==='fulfilled'?results[1].value:[];
 const unique=new Map();
 for(const item of wix){
  if(item.active!==true)continue;
  const job=normalizeJob(item,'wix');if(job)unique.set(job.id,job);
 }
 for(const item of central){
  const job=normalizeJob(item,'central');if(job)unique.set(job.id,job);
 }
 allJobs=[...unique.values()].sort((a,b)=>Date.parse(b.published||0)-Date.parse(a.published||0));
 loaded=true;fillCities();render();
}
function fillCities(){
 const city=element('hcCity'),selectedCity=city.value,cities=[...new Set(allJobs.map(j=>j.city).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
 city.replaceChildren();
 const any=root.createElement('option');any.value='';any.textContent=phrase('allCities');city.append(any);
 for(const name of cities){const o=root.createElement('option');o.value=name;o.textContent=name;city.append(o)}
 city.value=cities.includes(selectedCity)?selectedCity:'';
}
function jobCard(job){
 const article=root.createElement('article');article.className='hc-offer';
 const head=root.createElement('div');head.className='hc-offer-top';
 const type=root.createElement('span');type.className='hc-type'+(job.kind==='shift'?' hc-type-shift':'');type.textContent=phrase(job.kind==='shift'?'shiftLabel':'jobLabel');
 const role=root.createElement('span');role.textContent=job.role||'HORENOVA';head.append(type,role);
 const title=root.createElement('h3');title.textContent=job.title;
 const descr=root.createElement('p');descr.textContent=(job.business||phrase('employerFallback'))+' · '+(job.city||phrase('cityFallback'))+(job.pay?' · '+job.pay:'');
 const foot=root.createElement('div');foot.className='hc-offer-foot';
 const link=root.createElement('a');link.href='/job.html?id='+encodeURIComponent(job.id);link.textContent=phrase('consult');
 const share=root.createElement('button');share.type='button';share.textContent=phrase('share');
 share.setAttribute('aria-label',phrase('share')+' '+job.title);
 share.addEventListener('click',async()=>{
  const url=new URL(link.getAttribute('href'),location.origin).href;
  const text=[job.title,job.city||phrase('cityFallback'),url].join(' · ');
  try{if(navigator.share)await navigator.share({title:phrase('shareTitle'),text,url});
  else if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text);
  else location.assign('https://wa.me/?text='+encodeURIComponent(text));
  }catch{/* User cancelled native share. */}
 });
 foot.append(link,share);article.append(head,title,descr,foot);return article;
}
function render(){
 if(!loaded){element('hcResultStatus').textContent=phrase('loading');return;}
 const search=element('hcSearch').value.trim().toLocaleLowerCase(),city=element('hcCity').value;
 const filtered=allJobs.filter(j=>(selected==='all'||j.kind===selected)&&(!city||j.city===city)&&
   (!search||[j.title,j.role,j.city,j.business].some(v=>v.toLocaleLowerCase().includes(search))));
 element('hcResultStatus').textContent=failed?phrase('feedError'):allJobs.length===0?phrase('noPublish'):typeof phrase('count')==='function'?phrase('count')(filtered.length):'';
 const grid=element('hcOffers');grid.replaceChildren();
 if(filtered.length===0){
  const empty=root.createElement('p');empty.className='hc-empty';
  empty.textContent=failed?phrase('feedError'):allJobs.length===0?phrase('noPublish'):phrase('none');
  grid.append(empty);
 }else{for(const j of filtered.slice(0,visibleCount))grid.append(jobCard(j))}
 element('hcPager').hidden=filtered.length<=visibleCount;
 for(const b of root.querySelectorAll('[data-kind]')){
  const pressed=b.dataset.kind===selected;b.classList.toggle('hc-active',pressed);b.setAttribute('aria-pressed',String(pressed));
 }
 // Keep the selected city label translated after locale changes.
 element('hcCity').querySelector('option[value=""]').textContent=phrase('allCities');
}
const control=element('hn-language-control');control.value=['fr','en','ar'].includes(localeFromStorage())?localeFromStorage():'fr';
control.addEventListener('change',()=>setLocale(control.value));
element('hcSearch').addEventListener('input',()=>{visibleCount=9;render()});
element('hcCity').addEventListener('change',()=>{visibleCount=9;render()});
root.querySelectorAll('[data-kind]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.kind;visibleCount=9;render()}));
element('hcMore').addEventListener('click',()=>{visibleCount+=9;render()});
setLocale(control.value);
void Promise.allSettled([loadChannel(),loadJobs()]);
