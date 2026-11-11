import { subscribeMember, getMemberState, logout } from "/js/wix/member-store.js";
import { queryItems, insertItem, patchItemFields } from "/js/wix/items.js";

export const DEMO_ACCOUNTS={};
export const MEDIA={"onboarding_ar": "https://video.wixstatic.com/video/d0158d_5a5f4cbb3bad49eda3d898bbe664cf4d/file", "onboarding_fr": "https://video.wixstatic.com/video/d0158d_ae24988eac5b496ca7db05ad8c4d5c5c/file", "onboarding_en": "https://video.wixstatic.com/video/d0158d_423e146e2ef94cb2a0ebbc04fec23d18/file", "academy_service": "https://video.wixstatic.com/video/d0158d_4badab44e7fe4504b1f1c1312807ffe4/file", "academy_barista": "https://video.wixstatic.com/video/d0158d_40eb2f2b43314bfc8474ad5f101993d8/file", "academy_cuisine": "https://video.wixstatic.com/video/d0158d_ea11b4114cf442648369e16afbd4f1e5/file", "academy_hygiene": "https://video.wixstatic.com/video/d0158d_b48bc288bf1e4458b8ccd3a6d39ea457/file"};
const DEMO_KEY='mihna-demo-session-v1';
export const getDemoSession=()=>null;
export function clearDemoSession(){try{localStorage.removeItem(DEMO_KEY)}catch{}}
export function demoLogin(){return null;}

const VERIFIED_ADMIN_MEMBER_ID='d0158d67-a1cc-4b65-b3d3-67e20c84fdb3';
export async function getRole(){const st=getMemberState();if(st.loading)await new Promise(r=>{const u=subscribeMember(s=>{if(!s.loading){u();r()}})});const cur=getMemberState();if(!cur.loggedIn||!cur.member?.id)return null;if(cur.member.id===VERIFIED_ADMIN_MEMBER_ID)return 'admin';try{const p=await queryItems('AccountRoles',{limit:1});const role=p.items[0]?.role||null;return role==='admin'?null:role}catch{return null}}
export async function ensureRole(role,locale='fr'){if(!['candidate','recruiter'].includes(role))throw new Error('Rôle non autorisé pour une inscription publique.');const q=await queryItems('AccountRoles',{limit:1});if(q.items[0]){if(q.items[0].role==='admin')return q.items[0];if(q.items[0].role!==role)await patchItemFields('AccountRoles',q.items[0]._id,{role,locale});return q.items[0]}return insertItem('AccountRoles',{role,onboardingDone:false,locale})}
export async function roleRecord(){if(getDemoSession())return null;try{return (await queryItems('AccountRoles',{limit:1})).items[0]||null}catch{return null}}
export async function requireRole(allowed,redirect=true){const d=getDemoSession();if(d){if(allowed.includes(d.role))return {demo:true,role:d.role,member:{displayName:d.name,loginEmail:d.email}};if(redirect)location.replace('/account.html');return null}const st=getMemberState();if(st.loading)await new Promise(r=>{const u=subscribeMember(s=>{if(!s.loading){u();r()}})});const cur=getMemberState();if(!cur.loggedIn){if(redirect)location.replace('/login.html?returnTo='+encodeURIComponent(location.pathname+location.search));return null}const role=await getRole();if(!allowed.includes(role)){if(redirect)location.replace('/account.html');return null}return {demo:false,role,member:cur.member}}

const I18N={
 fr:{'nav.home':'Accueil','nav.matches':'✧ Matchs','nav.matchesShort':'Matchs','nav.jobs':'Emplois','nav.shifts':'Shifts','nav.shiftsShort':'Shifts','nav.talents':'Talents','nav.academy':'Academy','nav.shop':'Shop','nav.explore':'Explore ◉','nav.login':'Connexion','nav.account':'MON COMPTE','nav.accountShort':'Mon espace','nav.recruit':'Je recrute ↗','nav.universe':'Univers','footer.tag':'Le nouvel écosystème de l’hospitalité au Maroc — travailler, apprendre, s’équiper, gérer et explorer.','auth.signin':'Se connecter','auth.signup':'Créer mon compte','auth.email':'E-mail','auth.password':'Mot de passe','auth.candidate':'Je cherche un travail','auth.recruiter':'Je recrute','common.continue':'Continuer','common.save':'Enregistrer','common.logout':'Déconnexion'},
 en:{'nav.home':'Home','nav.matches':'✧ Matches','nav.matchesShort':'Matches','nav.jobs':'Jobs','nav.shifts':'Shifts','nav.shiftsShort':'Shifts','nav.talents':'Talent','nav.academy':'Academy','nav.shop':'Shop','nav.explore':'Explore ◉','nav.login':'Sign in','nav.account':'MY ACCOUNT','nav.accountShort':'My account','nav.recruit':'I’m hiring ↗','nav.universe':'Universe','footer.tag':'Morocco’s hospitality ecosystem — work, learn, equip, manage and explore.','auth.signin':'Sign in','auth.signup':'Create my account','auth.email':'Email','auth.password':'Password','auth.candidate':'I’m looking for work','auth.recruiter':'I’m hiring','common.continue':'Continue','common.save':'Save','common.logout':'Log out'},
 ar:{'nav.home':'الرئيسية','nav.matches':'✧ المطابقات','nav.matchesShort':'مطابقات','nav.jobs':'الوظائف','nav.shifts':'الشيفتات','nav.shiftsShort':'شيفتات','nav.talents':'المواهب','nav.academy':'الأكاديمية','nav.shop':'المتجر','nav.explore':'استكشف ◉','nav.login':'تسجيل الدخول','nav.account':'حسابي','nav.accountShort':'حسابي','nav.recruit':'أبحث عن موظفين ↗','nav.universe':'العالم','footer.tag':'منظومة الضيافة في المغرب — عمل، تعلم، تجهيز، إدارة واستكشاف.','auth.signin':'تسجيل الدخول','auth.signup':'إنشاء حساب','auth.email':'البريد الإلكتروني','auth.password':'كلمة المرور','auth.candidate':'أبحث عن عمل','auth.recruiter':'أبحث عن موظفين','common.continue':'متابعة','common.save':'حفظ','common.logout':'تسجيل الخروج'}
};

const LEGACY={
 en:{'Les emplois.':'Jobs.','Les shifts.':'Shifts.','Les talents.':'Talent.','Votre agenda':'Your schedule','Voir le shift ↗':'View shift ↗','Voir l’offre ↗':'View job ↗','Mes matchs.':'My matches.','Vos matchs.':'Your matches.','Mon espace.':'My account.','Favoris':'Favorites','Voir mes favoris':'View favorites','Aucun match pour le moment.':'No matches right now.','Pas de shift ce jour.':'No shift on this day.','Essayez une autre date.':'Try another date.','Je recrute.':'I’m hiring.','Publiez simplement.':'Publish simply.','Bientôt disponible':'Coming soon','Prix à configurer par l’administration.':'Price to be configured by admin.','Ajouter à ma liste':'Add to my list'},
 ar:{'Les emplois.':'الوظائف.','Les shifts.':'الشيفتات.','Les talents.':'المواهب.','Votre agenda':'جدولك','Voir le shift ↗':'عرض الشيفت ↗','Voir l’offre ↗':'عرض الوظيفة ↗','Mes matchs.':'مطابقاتي.','Vos matchs.':'مطابقاتك.','Mon espace.':'حسابي.','Favoris':'المفضلة','Voir mes favoris':'عرض المفضلة','Aucun match pour le moment.':'لا توجد مطابقات حالياً.','Pas de shift ce jour.':'لا توجد شيفتات في هذا اليوم.','Essayez une autre date.':'جرّب تاريخاً آخر.','Je recrute.':'أبحث عن موظفين.','Publiez simplement.':'انشر بسهولة.','Bientôt disponible':'قريباً','Prix à configurer par l’administration.':'السعر يحدده المشرف.','Ajouter à ma liste':'أضف إلى قائمتي'}
};
function translateLegacy(lang){if(lang==='fr')return;const map=LEGACY[lang]||{};const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const n of nodes){if(n.parentElement?.closest('script,style'))continue;const raw=n.nodeValue,trim=raw.trim();if(map[trim])n.nodeValue=raw.replace(trim,map[trim])}}

export function currentLang(){return localStorage.getItem('mihna-lang')||'fr'}
export function setLang(lang){localStorage.setItem('mihna-lang',lang);location.reload()}
export function applyLanguage(lang=currentLang()){document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';document.body?.classList.toggle('rtl',lang==='ar');document.querySelectorAll('[data-i18n]').forEach(el=>{const v=I18N[lang]?.[el.dataset.i18n];if(v)el.textContent=v});document.querySelectorAll('[data-fr][data-en][data-ar]').forEach(el=>{el.innerHTML=el.dataset[lang]||el.dataset.fr});document.querySelectorAll('.lang-switch button').forEach(b=>b.classList.toggle('active',b.dataset.lang===lang));translateLegacy(lang);}
function injectLang(){const html='<div class="lang-switch"><button data-lang="fr">FR</button><button data-lang="ar">ع</button><button data-lang="en">EN</button></div>';for(const id of ['langMount','mobileLangMount']){const m=document.getElementById(id);if(m)m.innerHTML=html}document.querySelectorAll('.lang-switch button').forEach(b=>b.onclick=()=>setLang(b.dataset.lang));applyLanguage()}
function renderSession(s){const d=getDemoSession();document.querySelectorAll('[data-session-link]').forEach(el=>{if(d){el.href='/account.html';if(el.classList.contains('space-btn'))el.textContent=d.role==='admin'?'Admin Horenova':d.role==='recruiter'?'Espace recruteur':'Mon espace'}else if(s.loading){if(el.classList.contains('space-btn'))el.textContent='…'}else if(s.loggedIn){el.href='/account.html';if(el.classList.contains('space-btn'))el.textContent=s.member?.displayName||s.member?.firstName||'Mon espace'}else{el.href='/login.html';if(el.classList.contains('space-btn'))el.setAttribute('data-i18n','nav.login')}});applyLanguage()}

function initArtSystem(){
  const raw=(location.pathname.split('/').pop()||'index.html').replace(/\.html$/,'').replace(/[^a-z0-9-]/gi,'-').toLowerCase();
  const slug=raw||'index';
  document.body.classList.add('mihna-art-app','mihna-page-'+slug);
  if(!document.body.dataset.page && slug!=='index') document.body.dataset.page=slug;
  if(slug!=='index' && !document.querySelector('.mihna-art-canvas')){
    const art=document.createElement('div');
    art.className='mihna-art-canvas';
    art.setAttribute('aria-hidden','true');
    art.innerHTML=`<img class="art-sketch sketch-a" src="/assets/art-whisk.svg" alt=""><img class="art-sketch sketch-b" src="/assets/art-chefhat.svg" alt=""><img class="art-sketch sketch-c" src="/assets/art-coffee.svg" alt=""><img class="art-sketch sketch-d" src="/assets/art-zellige.svg" alt=""><div class="art-glow glow-a"></div><div class="art-glow glow-b"></div>`;
    document.body.prepend(art);
  }
  document.querySelectorAll('main > section').forEach((el,i)=>{
    if(i>0 && !el.hasAttribute('data-art-reveal')) el.setAttribute('data-art-reveal','');
  });
  const reveal=[...document.querySelectorAll('[data-art-reveal]')];
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('art-visible');io.unobserve(e.target)}}),{threshold:.08});
    reveal.forEach(x=>io.observe(x));
  } else reveal.forEach(x=>x.classList.add('art-visible'));
}
function init(){initArtSystem();injectLang();const menu=document.getElementById('menuBtn'),panel=document.getElementById('mobileMenu');if(menu&&panel&&!menu.dataset.bound&&!document.querySelector('script[src*="mobile-nav-v15.js"]')){menu.dataset.bound='legacy';menu.onclick=()=>{panel.hidden=!panel.hidden;menu.textContent=panel.hidden?'☰':'×'}}renderSession(getMemberState());subscribeMember(renderSession);document.addEventListener('click',async e=>{if(e.target.closest('[data-global-logout]')){e.preventDefault();localStorage.removeItem('horenova-session-hint-v1');if(getDemoSession()){clearDemoSession();location.assign('/index.html')}else await logout('/index.html')}})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
const mo=new MutationObserver(()=>{const l=currentLang();if(l!=='fr')translateLegacy(l)});if(document.body)mo.observe(document.body,{childList:true,subtree:true});else document.addEventListener('DOMContentLoaded',()=>mo.observe(document.body,{childList:true,subtree:true}));
