import { login, register, verifyEmail, logout, subscribeMember, getMemberState, refreshMember } from "/js/wix/member-store.js";
import { queryItems, insertItem } from "/js/wix/items.js";
import { prepareCaptcha, captchaTokensFor, resetCaptcha, invisibleCaptchaTokens } from "/wix-captcha.js";

const params=new URLSearchParams(location.search);
const requestedMode=params.get('mode')==='signup'?'signup':'signin';
const requestedReturn=params.get('returnTo')||'';
function validReturn(value){
  if(!value.startsWith('/')||value.startsWith('//')||value.includes('\\'))return '';
  try{
    const u=new URL(value,location.origin);
    if(u.origin!==location.origin) return '';
    if(['/enter.html','/login.html'].includes(u.pathname)) return '';
    return u.pathname+u.search+u.hash;
  }catch{return ''}
}
const PENDING_INTENT_KEY='hn-candidate-journey-v3';
const SAFE_RETURN_KEY='hn-public-application-return-v1';
function readJourney(){
 try{
  const value=JSON.parse(sessionStorage.getItem(PENDING_INTENT_KEY)||'null');
  if(value?.at&&Date.now()-value.at<24*60*60*1000)return value;
  sessionStorage.removeItem(PENDING_INTENT_KEY);
 }catch{}
 // Non-secret destination may survive a separate tab opened by an email app.
 // Never put the Wix state token, password or member tokens in localStorage.
 try{
  const saved=JSON.parse(localStorage.getItem(SAFE_RETURN_KEY)||'null');
  if(saved?.at&&Date.now()-saved.at<24*60*60*1000
      &&(validReturn(saved.returnTo||'')||saved.status==='verification'))return saved;
  localStorage.removeItem(SAFE_RETURN_KEY);
 }catch{}
 return null;
}
const arrivedFromEmail=params.has('verified')||params.has('emailVerified')||params.get('flow')==='verify'||params.has('verificationCode');
const existingJourney=readJourney();
const safeReturn=validReturn(requestedReturn)||validReturn(existingJourney?.returnTo||'');
// Keeping a return link does not require storing any password or Wix security token.

function rememberJourney(change){
 try{
  const prev=readJourney()||{};
  const current={...prev,...change,returnTo:safeReturn||prev.returnTo||'',at:Date.now()};
  sessionStorage.setItem(PENDING_INTENT_KEY,JSON.stringify(current));
  try{
    const returnTo=validReturn(current.returnTo);
    // The pending step is non-secret and can be recovered by a mail link opening
    // a new tab. Store NO Wix state token or password in persistent storage.
    if(returnTo||current.status==='verification')
      localStorage.setItem(SAFE_RETURN_KEY,JSON.stringify({role:current.role,returnTo,status:current.status,at:Date.now()}));
   }catch{}
 }catch{}
}
function verifiedJourneyRole(){
 const journey=readJourney();
 const member=verifiedMember();
 if(!member||!journey||!['candidate','recruiter'].includes(journey.role))return null;
 const memberEmail=String(member.loginEmail||'').trim().toLowerCase();
 const expectedEmail=String(journey.email||'').trim().toLowerCase();
 // Never infer a role from a different person's pending registration.
 if(!memberEmail||!expectedEmail||memberEmail!==expectedEmail)return null;
 return journey.role;
}
function requestedCandidateApplication(){
 return /^\/apply\.html$/.test(new URL(safeReturn||'/',location.origin).pathname);
}
function resumeRole(){
 return verifiedJourneyRole()||(requestedCandidateApplication()?'candidate':null);
}
const HINT_KEY='horenova-session-hint-v1';
const ADMIN_MEMBER_IDS=new Set(['d0158d67-a1cc-4b65-b3d3-67e20c84fdb3','d9be4582-6401-48d6-b68c-77c6e268d3bd','9f0ec78b-0150-4be9-9daf-8b874a7caa18','854202b1-66c0-4c31-9dff-862bda95f9b0','1711eb68-181b-465c-95ef-3d78b25fdd14']);
let selectedRole='candidate',pendingRole=null,working=false,navigating=false,initialCheckComplete=false;
let existingCompletionMode=false,registeredSession=false;
let activeMode=requestedMode;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const signin=$('#signinForm'),signup=$('#signupForm'),verify=$('#verifyForm');
const supportedRoles=['candidate','recruiter'];
function verifiedMember(){
  const st=getMemberState();
  return !st.loading&&st.loggedIn&&st.member?.id ? st.member : null;
}
function err(form,message){const output=form?.querySelector('[data-error]');if(output)output.textContent=message||''}
function info(form,message){
  let node=form.querySelector('[data-auth-info]');
  if(!node){
    node=document.createElement('p');
    node.dataset.authInfo='1';
    node.setAttribute('role','status');
    node.style.cssText='font-size:13px;line-height:1.6;color:#2a4637;margin:12px 0';
    form.insertBefore(node,form.querySelector('button[type="submit"]'));
  }
  node.textContent=message||'';
}
function changeMode(mode){
  activeMode=mode==='signup'?'signup':'signin';
  signin.hidden=activeMode!=='signin';signup.hidden=activeMode!=='signup';verify.hidden=true;
  $$('[data-auth-tab]').forEach(el=>{
    const on=el.dataset.authTab===activeMode;
    el.classList.toggle('active',on);
    el.setAttribute('aria-selected',String(on));
  });
  if(activeMode==='signup'&&!existingCompletionMode){
    const state=getMemberState();
    if(!state.loading && !state.loggedIn) {
      prepareCaptcha(signup).catch(e=>{
        if(!existingCompletionMode&&!verifiedMember()&&!signup.hidden)err(signup,e.message);
      });
    }
  }
}
function showRegisteredAccount(){
  if(!verifiedMember()||existingCompletionMode)return;
  registeredSession=true;
  // A second account cannot be registered while Wix has authenticated a first one.
  // Never silently switch roles or redirect the Create account tab back to Sign in.
  changeMode('signup');
  signup.querySelector('.role-choice').hidden=true;
  for(const field of signup.querySelectorAll('input')){
    field.required=false;
    field.disabled=true;
    const label=field.closest('label');if(label)label.hidden=true;
  }
  signup.querySelector('[data-captcha-area]').hidden=true;
  signup.querySelector('button[type="submit"]').hidden=true;
  let block=signup.querySelector('[data-switch-account]');
  if(!block){
    block=document.createElement('div');
    block.dataset.switchAccount='1';
    const message=document.createElement('p');
    message.textContent='Vous êtes déjà connecté à un compte HORENOVA. Pour créer un autre compte avec une autre adresse e-mail, déconnectez-vous d’abord.';
    message.style.cssText='font-size:14px;line-height:1.7;color:#293329';
    const link=document.createElement('a');link.href='/account.html';link.textContent='Ouvrir mon espace ↗';
    link.style.cssText='display:block;color:#173c34;font-weight:700;margin:12px 0';
    const button=document.createElement('button');button.type='button';button.className='cta-main';
    button.textContent='Me déconnecter et créer un autre compte';
    button.addEventListener('click',async()=>{
      if(working)return;
      working=true;button.disabled=true;err(signup,'');
      try{await logout('/enter.html?mode=signup');}
      catch(e){err(signup,e.message||'Déconnexion impossible.');working=false;button.disabled=false;}
    });
    block.append(message,link,button);
    signup.append(block);
  }
}
function restoreSignupForVisitor(){
  registeredSession=false;existingCompletionMode=false;
  signup.querySelector('.role-choice').hidden=false;
  signup.querySelector('button[type="submit"]').hidden=false;
  signup.querySelector('[data-switch-account]')?.remove();
  restoreSignupFields();
  signup.querySelector('h2').textContent='Créer votre compte';
  const tab=document.querySelector('[data-auth-tab="signup"]');if(tab)tab.textContent='Créer mon compte';
}
function updateButton(form,text){
  const b=form.querySelector('button[type="submit"]');
  if(b){b.disabled=working;b.textContent=text}
}
function go(destination){
  if(navigating)return;
  navigating=true;
  // Clear the consumed job destination after login; never affect another member.
  try{sessionStorage.removeItem(PENDING_INTENT_KEY);localStorage.removeItem(SAFE_RETURN_KEY);}catch{}
  location.replace(destination);
}
function roleDestination(role,firstTime=false){
  if(safeReturn)return safeReturn;
  if(firstTime&&role==='candidate')return '/account.html';
  if(firstTime && role==='recruiter')return '/recruiter-setup.html';
  return '/account.html';
}
async function existingRole(){
  const member=verifiedMember();
  if(!member)return null;
  // Admin identity is verified against the same Wix member id as mihna-global.js.
  // Never ask the administrator to create a public candidate/recruiter role.
  if(ADMIN_MEMBER_IDS.has(member.id))return 'admin';
  const result=await queryItems('AccountRoles',{filters:[{field:'_owner',op:'eq',value:member.id}],limit:1});
  const record=result.items?.[0];
  return supportedRoles.includes(record?.role)||record?.role==='admin' ? record.role : null;
}
async function ensureRole(role){
  if(!verifiedMember())throw Error('La session membre n’est pas encore confirmée. Reconnectez-vous puis terminez votre inscription.');
  const current=await existingRole();
  if(current)return current; // Never silently switch an existing member's role.
  if(!supportedRoles.includes(role))throw Error('Choisissez candidat ou recruteur.');
  const locale=(()=>{try{const v=localStorage.getItem('mihna-lang');return ['fr','en','ar'].includes(v)?v:'fr';}catch{return 'fr'}})();
  const saved=await insertItem('AccountRoles',{role,onboardingDone:false,locale});
  if(!saved?._id)throw Error('Le profil n’a pas été enregistré. Réessayez sans créer de second compte.');
  // A successful CMS insert can be briefly invisible to an eventual-consistency query.
  // Trust the insertion receipt for navigation; page authorization still checks Wix ownership.
  return role;
}
function finishExistingMode(){
  existingCompletionMode=true;registeredSession=false;
  signup.querySelector('[data-switch-account]')?.remove();
  signup.querySelector('.role-choice').hidden=false;
  signup.querySelector('button[type="submit"]').hidden=false;
  err(signup,'');
  changeMode('signup');
  for(const name of ['firstName','lastName','email','password']){
    const field=signup.elements.namedItem(name);
    if(!field)continue;
    field.required=false;
    field.disabled=true;
    const label=field.closest('label');
    if(label)label.hidden=true;
  }
  const area=signup.querySelector('[data-captcha-area]');if(area)area.hidden=true;
  signup.querySelector('h2').textContent='Finaliser mon espace';
  const tab=signup.querySelector('[data-auth-tab="signup"]')||document.querySelector('[data-auth-tab="signup"]');
  if(tab)tab.textContent='Finaliser mon espace';
  updateButton(signup,'Accéder à mon espace');
  info(signup,'Votre adresse e-mail existe déjà. Choisissez uniquement votre espace candidat ou recruteur : vous ne devez plus saisir votre e-mail ni créer un autre mot de passe.');
}
function restoreSignupFields(){
  for(const name of ['firstName','lastName','email','password']){
    const field=signup.elements.namedItem(name);
    if(!field)continue;
    field.disabled=false;
    field.required=true;
    const label=field.closest('label');if(label)label.hidden=false;
  }
  const area=signup.querySelector('[data-captcha-area]');if(area)area.hidden=false;
}
async function checkSession(){
  if(working||navigating)return;
  const member=verifiedMember();
  if(!member)return;
  try{
    const role=await existingRole();
    if(working||navigating)return;
    if(role){
      if(activeMode==='signup'&&!safeReturn&&!arrivedFromEmail){
        showRegisteredAccount();
      }else go(roleDestination(role));
    } else {
      const resumed=resumeRole();
      if(resumed){
        const assigned=await ensureRole(resumed);
        go(roleDestination(assigned,true));
      }else finishExistingMode();
    }
  }catch(e){
    // A temporary CMS error should never trigger another redirect.
    if(!working)info(signin,'Session reconnue. Vérification du profil momentanément indisponible. Actualisez cette page pour réessayer.');
  }
}
async function confirmedSession(){
  if(verifiedMember())return true;
  await refreshMember();
  return Boolean(verifiedMember());
}
function captchaError(r){
 return ['missingCaptchaToken','invalidCaptchaToken','captchaRequired'].includes(r?.errorCode)||/captcha/i.test(r?.error||'');
}
function failureMessage(r,fallback){
 if(captchaError(r))return 'La vérification anti-robot doit être recommencée.';
 if(r?.errorCode==='emailAlreadyExists')return 'Ce compte existe déjà. Connectez-vous avec cette adresse et votre mot de passe : inutile de recommencer l’inscription.';
 return r?.error||fallback;
}
function init(){
 if(!signin||!signup||!verify)return;
 const guide=document.createElement('div');guide.className='hn-auth-guide';
 guide.innerHTML='<span class="hn-auth-guide-kicker">INSCRIPTION EN 3 ÉTAPES</span><div class="hn-auth-stepper"><span><b>1</b> Mon compte</span><span><b>2</b> Vérification</span><span><b>3</b> Mon profil</span></div><p>Une seule adresse e-mail, un seul mot de passe. Après vérification, continuez directement votre candidature.</p>';
 signup.insertBefore(guide,signup.querySelector('h2').nextSibling);
 if(requestedCandidateApplication()){
  guide.querySelector('p').textContent='Votre compte donne accès immédiatement à la candidature. Aucune vidéo ni quiz obligatoire.';
  const step=guide.querySelector('.hn-auth-stepper span:last-child');if(step)step.innerHTML='<b>3</b> Postuler';
 }
 const verificationInfo=document.createElement('div');verificationInfo.className='hn-verify-guide';
 verificationInfo.innerHTML='<strong>Votre compte est déjà créé.</strong><p>Ouvrez l’e-mail de Wix, récupérez le code de vérification et saisissez-le ici. Ne créez pas un deuxième compte. Si votre messagerie ouvre un nouvel onglet, revenez sur cette page.</p>';
 verify.insertBefore(verificationInfo,verify.querySelector('h2').nextSibling);
 // The Wix email contains a six-digit code. A new browser tab cannot re-use
 // the prior tab's ephemeral security token: sign-in starts a fresh trusted challenge.
 info(verify,'Utilisez les 6 chiffres reçus par e-mail. Restez sur cette page pendant la vérification.');
 const returnButton=document.createElement('button');returnButton.type='button';returnButton.className='hn-auth-return';returnButton.textContent='Déjà vérifié ? Se connecter à mon compte →';
 returnButton.addEventListener('click',()=>{
   changeMode('signin');
   const email=readJourney()?.email;
   if(email)signin.elements.email.value=email;
   info(signin,'Votre adresse e-mail a déjà été enregistrée. Entrez simplement votre mot de passe. Si Wix exige un nouveau code, nous afficherons la vérification ici.');
 });
 verify.append(returnButton);
 if(safeReturn){
  const notice=document.createElement('p');notice.className='hn-auth-return-context';notice.textContent=requestedCandidateApplication()?'✓ L’annonce sélectionnée sera conservée pendant votre inscription.':'✓ Vous retrouverez votre page après connexion.';
  signin.prepend(notice);signup.prepend(notice.cloneNode(true));
 }

 // Storage may be disabled by browser privacy settings or an embedding context.
 // Do not disable sign-in: Wix's token store has an in-memory fallback.
 // If persistence is unavailable, the user can still attempt authentication.
 try{
   const key='hn-auth-storage-test';
   window.localStorage.setItem(key,'1');
   window.localStorage.removeItem(key);
 }catch{
   const note=document.createElement('p');
   note.setAttribute('role','status');
   note.style.cssText='padding:12px 14px;margin:12px 0;border-radius:10px;background:#fff4e9;color:#65350e;font:500 13px/1.5 system-ui';
   note.textContent='Votre navigateur limite le stockage de session. Vous pouvez vous connecter, mais la connexion pourrait ne pas être conservée après un rechargement.';
   signin.prepend(note);
 }

 $$('[data-auth-tab]').forEach(b=>b.addEventListener('click',()=>{
   if(working)return;
   changeMode(b.dataset.authTab);
   // Preserve the selected screen through refresh/back navigation, including on iPhone.
   const nextUrl=new URL(location.href);
   if(activeMode==='signup')rememberJourney({role:selectedRole,status:'started'});
   nextUrl.searchParams.set('mode',activeMode);
   history.replaceState(null,'',nextUrl.pathname+nextUrl.search+nextUrl.hash);
   if(verifiedMember()){
     if(activeMode==='signup'){
       if(existingCompletionMode)finishExistingMode();
       else if(registeredSession)showRegisteredAccount();
       else void checkSession();
     }
     // A tab click is never a navigation to another page. Sign-in remains visible.
   }else if(activeMode==='signup'&&registeredSession){
     restoreSignupForVisitor();
   }
 }));
 $$('[data-role]').forEach(b=>b.addEventListener('click',()=>{
   if(working)return;
   selectedRole=b.dataset.role;
   rememberJourney({role:selectedRole});
   $('[data-role]').forEach(x=>x.classList.toggle('active',x===b));
 }));
 signin.addEventListener('submit',async event=>{
   event.preventDefault();if(working||navigating||!signin.reportValidity())return;
   working=true;err(signin,'');const btn=signin.querySelector('button[type="submit"]');const old=btn.textContent;updateButton(signin,'Connexion…');
   try{
     const email=signin.elements.email.value.trim(),password=signin.elements.password.value;
     const area=signin.querySelector('[data-captcha-area]');
     const captcha=area&&!area.hidden?await captchaTokensFor(signin):undefined;
     const r=await login(email,password,{...(captcha?{captchaTokens:captcha}:{})});
     if(r.state==='EMAIL_VERIFICATION_REQUIRED'){
       pendingRole=resumeRole();
       rememberJourney({email,role:pendingRole||readJourney()?.role||'candidate',status:'verification'});
       signin.hidden=true;signup.hidden=true;verify.hidden=false;verify.querySelector('input[name="code"]').setAttribute('autocomplete','one-time-code');verify.querySelector('input[name="code"]').focus();
       return;
     }
     if(r.state==='OWNER_APPROVAL_REQUIRED')throw Error('Compte en attente d’approbation.');
     if(r.state!=='SUCCESS'){
       if(captchaError(r)){await prepareCaptcha(signin);resetCaptcha(signin)}
       throw Error(failureMessage(r,'Connexion impossible. Vérifiez vos identifiants.'));
     }
     const confirmed=await confirmedSession();
     if(!confirmed)throw Error('Connexion acceptée, mais la session Wix n’est pas encore vérifiée. Réessayez dans un instant.');
     try{window.localStorage.setItem(HINT_KEY,'1')}catch{/* Private browsing, embedded browsers and restricted storage: Wix member session remains in memory. */}
     const role=await existingRole();
     if(role)go(roleDestination(role));
     else{
       const chosen=resumeRole();
       if(chosen){
         const assigned=await ensureRole(chosen);
         go(roleDestination(assigned,true));
       }else{
         finishExistingMode();
         info(signup,'Connexion réussie. Votre compte existe déjà : choisissez votre espace pour continuer, sans créer un nouveau compte.');
       }
     }
   }catch(e){err(signin,e.message||'Connexion impossible.');}
   finally{working=false;btn.disabled=false;btn.textContent=old;}
 });
 signup.addEventListener('submit',async event=>{
   event.preventDefault();if(working||navigating||registeredSession||!signup.reportValidity())return;
   working=true;err(signup,'');const btn=signup.querySelector('button[type="submit"]');const old=btn.textContent;
   updateButton(signup,verifiedMember()?'Enregistrement…':'Création…');pendingRole=selectedRole;
   try{
     if(verifiedMember()){
       const role=await ensureRole(selectedRole);
       try{window.localStorage.setItem(HINT_KEY,'1')}catch{/* Private browsing, embedded browsers and restricted storage: Wix member session remains in memory. */}
       go(roleDestination(role,true));
       return;
     }
     const f=signup.elements;
     rememberJourney({role:selectedRole,email:f.email.value.trim().toLowerCase(),status:'creating'});
     const options={captchaTokens:await captchaTokensFor(signup)};
     const data=[f.email.value.trim(),f.password.value,{firstName:f.firstName.value.trim(),lastName:f.lastName.value.trim()}];
     let r=await register(...data,options);
     if(captchaError(r)){
       try{options.captchaTokens=await invisibleCaptchaTokens();r=await register(...data,options)}
       catch(e){throw Error(e.message||'La vérification anti-robot est indisponible.');}
     }
     if(r.state==='EMAIL_VERIFICATION_REQUIRED'){
       pendingRole=selectedRole;rememberJourney({role:selectedRole,email:f.email.value.trim().toLowerCase(),status:'verification'});
       signin.hidden=true;signup.hidden=true;verify.hidden=false;
       verify.querySelector('input[name="code"]').setAttribute('autocomplete','one-time-code');verify.querySelector('input[name="code"]').focus();return;
     }
     if(r.state==='OWNER_APPROVAL_REQUIRED')throw Error('Compte enregistré, en attente d’approbation. N’essayez pas de créer un second compte.');
     if(r.state!=='SUCCESS'){
       resetCaptcha(signup);
       if(r?.errorCode==='emailAlreadyExists'){
         changeMode('signin');
         signin.elements.email.value=f.email.value.trim();
         info(signin,'Votre compte existe déjà. Connectez-vous pour terminer la vérification ou ouvrir votre portail. Ne recommencez pas l’inscription.');
         return;
       }
       throw Error(failureMessage(r,'Inscription impossible.'));
     }
     const confirmed=await confirmedSession();
     if(!confirmed)throw Error('Compte créé, mais la session doit être confirmée. Connectez-vous pour terminer sans recréer le compte.');
     const role=await ensureRole(selectedRole);
     try{window.localStorage.setItem(HINT_KEY,'1')}catch{/* Private browsing, embedded browsers and restricted storage: Wix member session remains in memory. */}
     go(roleDestination(role,true));
   }catch(e){
     err(signup,e.message||'Inscription impossible.');
     if(verifiedMember())finishExistingMode();
   }finally{working=false;btn.disabled=false;btn.textContent=verifiedMember()?'Terminer mon compte':old;}
 });
 verify.addEventListener('submit',async e=>{
   e.preventDefault();if(working||!verify.reportValidity())return;
   working=true;const btn=verify.querySelector('button[type="submit"]');btn.disabled=true;
   try{
     const r=await verifyEmail(verify.elements.code.value.trim());
     if(r.state!=='SUCCESS')throw Error(r.error||'Code de vérification invalide.');
     if(!await confirmedSession())throw Error('Vérification acceptée. Reconnectez-vous pour terminer votre compte.');
     const role=await ensureRole(verifiedJourneyRole()||pendingRole||selectedRole);
     rememberJourney({status:'verified'});
     try{window.localStorage.setItem(HINT_KEY,'1')}catch{/* Private browsing, embedded browsers and restricted storage: Wix member session remains in memory. */}go(roleDestination(role,true));
   }catch(e){err(verify,e.message||'Impossible de vérifier le code.');}
   finally{working=false;btn.disabled=false;}
 });
 const pending=readJourney();

 // Return to the code screen after checking email if this same browser tab
 // still has the short-lived Wix challenge. A user must never sign up twice.
 const pendingChallenge=(()=>{
   try{
     const value=JSON.parse(sessionStorage.getItem('hn-wix-email-challenge-v2')||'null');
     return Boolean(value?.token&&Number.isFinite(value.at)&&Date.now()-value.at<15*60*1000);
   }catch{return false;}
 })();
 if(pendingChallenge&&(pending?.status==='verification'||arrivedFromEmail)){
   changeMode('signin');
   signin.hidden=true;signup.hidden=true;verify.hidden=false;
   info(verify,'Saisissez les 6 chiffres de votre e-mail. Votre compte existe déjà : ne recommencez pas l’inscription.');
   const code=String(params.get('verificationCode')||'').trim();
   if(/^\d{6}$/.test(code)){
     verify.elements.code.value=code;
     const clean=new URL(location.href);
     clean.searchParams.delete('verificationCode');
     history.replaceState(null,'',clean.pathname+clean.search+clean.hash);
     queueMicrotask(()=>verify.requestSubmit());
   }else verify.elements.code.focus();
 }else if(pending?.status==='verification'||arrivedFromEmail){
   changeMode('signin');
   if(pending?.email)signin.elements.email.value=pending.email;
   info(signin,'Votre compte est déjà créé. Connectez-vous avec le même e-mail et mot de passe pour accéder à votre offre. Ne créez pas de second compte.');
 }else changeMode(requestedMode);
 const off=subscribeMember(s=>{
    if(!initialCheckComplete && !s.loading){
      initialCheckComplete=true;
      if(!s.loggedIn && requestedMode==='signup' && !existingCompletionMode){
        prepareCaptcha(signup).catch(e=>{
          if(!existingCompletionMode&&!signup.hidden)err(signup,e.message);
        });
      }
      void checkSession();
    }
  });
 const state=getMemberState();
 if(!state.loading&&!initialCheckComplete){initialCheckComplete=true;void checkSession();}
 window.addEventListener('pagehide',()=>{off();},{once:true});
 document.documentElement.dataset.authUiReady='1';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();