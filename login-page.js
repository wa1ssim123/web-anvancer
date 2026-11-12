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
const safeReturn=validReturn(requestedReturn);
const HINT_KEY='horenova-session-hint-v1';
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
  $('[data-auth-tab]').forEach(el=>{
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
}
function updateButton(form,text){
  const b=form.querySelector('button[type="submit"]');
  if(b){b.disabled=working;b.textContent=text}
}
function go(destination){
  if(navigating)return;
  navigating=true;
  location.replace(destination);
}
function roleDestination(role,firstTime=false){
  if(safeReturn)return safeReturn;
  if(firstTime && supportedRoles.includes(role))return '/onboarding.html?role='+encodeURIComponent(role);
  return '/account.html';
}
async function existingRole(){
  const member=verifiedMember();
  if(!member)return null;
  const result=await queryItems('AccountRoles',{filters:[{field:'_owner',op:'eq',value:member.id}],limit:1});
  const record=result.items?.[0];
  return supportedRoles.includes(record?.role)||record?.role==='admin' ? record.role : null;
}
async function ensureRole(role){
  if(!verifiedMember())throw Error('La session membre n’est pas encore confirmée. Reconnectez-vous puis terminez votre inscription.');
  const current=await existingRole();
  if(current)return current; // Never silently switch an existing member's role.
  if(!supportedRoles.includes(role))throw Error('Choisissez candidat ou recruteur.');
  await insertItem('AccountRoles',{role,onboardingDone:false,locale:'fr'});
  const stored=await existingRole();
  if(stored!==role)throw Error('Compte créé mais le rôle n’a pas été confirmé. Réessayez « Terminer mon compte » sans créer un autre compte.');
  return stored;
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
  updateButton(signup,'Terminer mon compte');
  info(signup,'Votre compte Wix existe. Choisissez « Je cherche un travail » ou « Je recrute » et terminez le profil. Aucun deuxième compte ne sera créé.');
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
      if(activeMode==='signup'){
        showRegisteredAccount();
      } else {
        go(roleDestination(role));
      }
    } else {
      finishExistingMode();
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
 if(r?.errorCode==='emailAlreadyExists')return 'Cette adresse e-mail possède déjà un compte. Utilisez « Se connecter ».';
 return r?.error||fallback;
}
function init(){
 if(!signin||!signup||!verify)return;
 $('[data-auth-tab]').forEach(b=>b.addEventListener('click',()=>{
   if(working)return;
   changeMode(b.dataset.authTab);
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
   $$('[data-role]').forEach(x=>x.classList.toggle('active',x===b));
 }));
 signin.addEventListener('submit',async event=>{
   event.preventDefault();if(working||navigating||!signin.reportValidity())return;
   working=true;err(signin,'');const btn=signin.querySelector('button[type="submit"]');const old=btn.textContent;updateButton(signin,'Connexion…');
   try{
     const email=signin.elements.email.value.trim(),password=signin.elements.password.value;
     const area=signin.querySelector('[data-captcha-area]');
     const captcha=area&&!area.hidden?await captchaTokensFor(signin):undefined;
     const r=await login(email,password,{...(captcha?{captchaTokens:captcha}:{})});
     if(r.state==='EMAIL_VERIFICATION_REQUIRED'){pendingRole=null;signin.hidden=true;verify.hidden=false;return;}
     if(r.state==='OWNER_APPROVAL_REQUIRED')throw Error('Compte en attente d’approbation.');
     if(r.state!=='SUCCESS'){
       if(captchaError(r)){await prepareCaptcha(signin);resetCaptcha(signin)}
       throw Error(failureMessage(r,'Connexion impossible. Vérifiez vos identifiants.'));
     }
     const confirmed=await confirmedSession();
     if(!confirmed)throw Error('Connexion acceptée, mais la session Wix n’est pas encore vérifiée. Réessayez dans un instant.');
     localStorage.setItem(HINT_KEY,'1');
     const role=await existingRole();
     if(role)go(roleDestination(role));
     else{finishExistingMode();info(signup,'Connexion réussie. Finalisez maintenant votre profil sans recréer de compte.');}
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
       localStorage.setItem(HINT_KEY,'1');
       go(roleDestination(role,true));
       return;
     }
     const f=signup.elements;
     const options={captchaTokens:await captchaTokensFor(signup)};
     const data=[f.email.value.trim(),f.password.value,{firstName:f.firstName.value.trim(),lastName:f.lastName.value.trim()}];
     let r=await register(...data,options);
     if(captchaError(r)){
       try{options.captchaTokens=await invisibleCaptchaTokens();r=await register(...data,options)}
       catch(e){throw Error(e.message||'La vérification anti-robot est indisponible.');}
     }
     if(r.state==='EMAIL_VERIFICATION_REQUIRED'){
       pendingRole=selectedRole;signup.hidden=true;verify.hidden=false;return;
     }
     if(r.state==='OWNER_APPROVAL_REQUIRED')throw Error('Compte enregistré, en attente d’approbation. N’essayez pas de créer un second compte.');
     if(r.state!=='SUCCESS'){
       resetCaptcha(signup);
       throw Error(failureMessage(r,'Inscription impossible.'));
     }
     const confirmed=await confirmedSession();
     if(!confirmed)throw Error('Compte créé, mais la session doit être confirmée. Connectez-vous pour terminer sans recréer le compte.');
     const role=await ensureRole(selectedRole);
     localStorage.setItem(HINT_KEY,'1');
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
     const role=await ensureRole(pendingRole||selectedRole);
     localStorage.setItem(HINT_KEY,'1');go(roleDestination(role,true));
   }catch(e){err(verify,e.message||'Impossible de vérifier le code.');}
   finally{working=false;btn.disabled=false;}
 });
 changeMode(requestedMode);
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
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();