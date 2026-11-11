import { login, register, verifyEmail, subscribeMember, getMemberState } from "/js/wix/member-store.js";
import { queryItems, insertItem, patchItemFields } from "/js/wix/items.js";

const DEMO_KEY='mihna-demo-session-v1';
const HINT_KEY='horenova-session-hint-v1';
const DEMO_ACCOUNTS={
  admin:{email:'admin-demo@mihna.app',password:'MiH!Admin_6Qp9#27',role:'admin',name:'Admin Horenova'},
  recruiter:{email:'recruteur-demo@mihna.app',password:'MiH!Rec_4Vk8#52',role:'recruiter',name:'Riad Démo'},
  candidate:{email:'candidat-demo@mihna.app',password:'MiH!Tal_8Ns3#64',role:'candidate',name:'Yasmine Demo'}
};

function demoLogin(email,password){
  for(const [key,a] of Object.entries(DEMO_ACCOUNTS)){
    if(a.email===email && a.password===password){
      const s={...a,key,demo:true};
      localStorage.setItem(DEMO_KEY,JSON.stringify(s));
      return s;
    }
  }
  return null;
}

const params=new URLSearchParams(location.search);
const requestedMode=params.get('mode');
const requestedReturn=params.get('returnTo')||'';
const safeReturn=requestedReturn.startsWith('/')&&!requestedReturn.startsWith('//')?requestedReturn:'';
// AUTO EXISTING SESSION
let __autoDone=false;const __auto=s=>{if(__autoDone||s.loading)return;if(s.loggedIn){__autoDone=true;location.replace(safeReturn||'/account.html')}};subscribeMember(__auto);__auto(getMemberState());
let role='candidate', pendingRole=null;

function currentLang(){return localStorage.getItem('mihna-lang')||'fr'}
async function ensureRole(role,locale='fr'){
  const q=await queryItems('AccountRoles',{limit:1});
  if(q.items[0]){
    if(q.items[0].role!==role || q.items[0].locale!==locale) await patchItemFields('AccountRoles',q.items[0]._id,{role,locale});
    return q.items[0];
  }
  return insertItem('AccountRoles',{role,onboardingDone:false,locale});
}
function redirectFor(r){
  if(safeReturn){location.assign(safeReturn);return}
  location.assign(r==='candidate'?'/onboarding.html?role=candidate':r==='recruiter'?'/onboarding.html?role=recruiter':'/admin.html');
}
function esc(s){return String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}

function init(){
  const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
  const signin=q('#signinForm'), signup=q('#signupForm'), verify=q('#verifyForm');
  if(!signin || !signup || !verify){console.error('Horenova auth forms missing');return}

  function show(which){
    signin.hidden=which!=='signin'; signup.hidden=which!=='signup'; verify.hidden=true;
    qa('[data-auth-tab]').forEach(b=>b.classList.toggle('active',b.dataset.authTab===which));
  }
  function err(form,msg){const el=form.querySelector('[data-error]');if(el)el.textContent=msg||''}
  function status(msg){const el=q('#signinStatus');if(el)el.textContent=msg||''}
  qa('[data-auth-tab]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.authTab)));
  qa('[data-role]').forEach(b=>b.addEventListener('click',()=>{role=b.dataset.role;qa('[data-role]').forEach(x=>x.classList.toggle('active',x===b))}));

  signin.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!signin.reportValidity()) return;
    const btn=q('#signinSubmit')||signin.querySelector('button[type=submit]');
    err(signin,''); status('Connexion en cours…'); btn.disabled=true; btn.textContent='Connexion…';
    const email=signin.elements.email.value.trim(), password=signin.elements.password.value;
    const demo=demoLogin(email,password);
    if(demo){localStorage.setItem(HINT_KEY,'1');status('Connexion réussie. Ouverture de votre espace…');redirectFor(demo.role);return}
    try{
      localStorage.setItem(HINT_KEY,'1');const r=await login(email,password,{returnTo:safeReturn||'/account.html'});
      if(r.state==='SUCCESS'){status('Connexion réussie. Ouverture…');location.assign(safeReturn||'/account.html');return}
      if(r.state==='EMAIL_VERIFICATION_REQUIRED'){status('');verify.hidden=false;signin.hidden=true;return}
      if(r.state==='OWNER_APPROVAL_REQUIRED'){status('');err(signin,'Votre compte doit être approuvé avant la connexion.');return}
      localStorage.removeItem(HINT_KEY);status('');err(signin,r.error||'Connexion impossible. Vérifiez votre e-mail et votre mot de passe.');
    }catch(x){localStorage.removeItem(HINT_KEY);status('');err(signin,x?.message||String(x))}
    finally{btn.disabled=false;btn.textContent='Se connecter'}
  });

  signup.addEventListener('submit',async e=>{
    e.preventDefault(); if(!signup.reportValidity()) return;
    const btn=signup.querySelector('button[type=submit]');err(signup,'');btn.disabled=true;const old=btn.textContent;btn.textContent='Création…';pendingRole=role;
    try{
      const f=signup.elements;
      localStorage.setItem(HINT_KEY,'1');const r=await register(f.email.value.trim(),f.password.value,{firstName:f.firstName.value.trim(),lastName:f.lastName.value.trim()},{returnTo:safeReturn||'/onboarding.html'});
      if(r.state==='SUCCESS'){await ensureRole(role,currentLang());redirectFor(role);return}
      if(r.state==='EMAIL_VERIFICATION_REQUIRED'){verify.hidden=false;signup.hidden=true;return}
      if(r.state==='OWNER_APPROVAL_REQUIRED'){err(signup,'Compte créé. Il doit être approuvé avant connexion.');return}
      localStorage.removeItem(HINT_KEY);err(signup,r.error||'Inscription impossible.');
    }catch(x){localStorage.removeItem(HINT_KEY);err(signup,x?.message||String(x))}
    finally{btn.disabled=false;btn.textContent=old}
  });

  verify.addEventListener('submit',async e=>{
    e.preventDefault(); if(!verify.reportValidity()) return;
    const btn=verify.querySelector('button[type=submit]');btn.disabled=true;
    try{
      const r=await verifyEmail(verify.elements.code.value.trim());
      if(r.state==='SUCCESS'){localStorage.setItem(HINT_KEY,'1');if(pendingRole)await ensureRole(pendingRole,currentLang());redirectFor(pendingRole||'candidate');return}
      err(verify,r.error||'Code invalide.');
    }catch(x){err(verify,x?.message||String(x))} finally{btn.disabled=false}
  });

  const showDemo=q('#showDemo'), demoAccess=q('#demoAccess');
  if(showDemo&&demoAccess) showDemo.addEventListener('click',()=>{
    demoAccess.hidden=!demoAccess.hidden;
    if(demoAccess.hidden)return;
    demoAccess.innerHTML=Object.values(DEMO_ACCOUNTS).map(a=>`<button type="button" class="demo-login" data-email="${esc(a.email)}" data-pass="${esc(a.password)}"><b>${esc(a.role.toUpperCase())}</b><span>${esc(a.email)}</span><small>${esc(a.password)}</small></button>`).join('');
    demoAccess.querySelectorAll('.demo-login').forEach(b=>b.addEventListener('click',()=>{const d=demoLogin(b.dataset.email,b.dataset.pass);if(d){localStorage.setItem(HINT_KEY,'1');redirectFor(d.role)}}));
  });

  // If already signed in, never leave the user stuck on login.
  const state=getMemberState();
  const go=s=>{if(!s.loading&&s.loggedIn) location.replace(safeReturn||'/account.html')};
  subscribeMember(go); go(state);
  if(requestedMode==='signup') show('signup'); else show('signin');
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
