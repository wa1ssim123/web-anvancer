'use strict';
/* Browser-backed candidate journey: one Wix member, one pending offer, no duplicate signup. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const authSource=fs.readFileSync(path.join(root,'login-page.js'),'utf8');
const transport=fs.readFileSync(path.join(root,'js/wix/auth.js'),'utf8');
const setup=fs.readFileSync(path.join(root,'candidate-setup.js'),'utf8');
const quiz=fs.readFileSync(path.join(root,'quiz.js'),'utf8');
const i18n=fs.readFileSync(path.join(root,'horenova-i18n.js'),'utf8');
assert.match(transport,/sessionStorage\.setItem\(PENDING_EMAIL_KEY/,'Wix challenge must survive a mail-app transition within the tab');
assert.match(transport,/savedPendingEmail\(\)/,'Email verification must reload its short-lived state token');
assert.match(setup,/location\.assign\(safeTarget\|\|'\/account\.html'\)/,'Optional profile must not force a quiz');
assert.match(quiz,/QUIZ_DRAFT_KEY/,'Quiz responses need to survive language switching');
assert.match(i18n,/location\.pathname\)/,'i18n must check the current page');
const formHtml=`<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><section>
<div class="auth-tabs"><button data-auth-tab="signin">Se connecter</button><button data-auth-tab="signup">Créer mon compte</button></div>
<form id="signinForm"><h2>Se connecter</h2><label>E-mail<input name="email" type="email" required></label><label>Mot de passe<input name="password" type="password" required></label><div data-captcha-area hidden></div><p data-error></p><button type="submit">Se connecter</button></form>
<form id="signupForm" hidden><h2>Créer votre compte</h2><div class="role-choice"><button type="button" data-role="candidate">Je cherche un travail</button><button type="button" data-role="recruiter">Je recrute</button></div><label>Prénom<input name="firstName" required></label><label>Nom<input name="lastName" required></label><label>E-mail<input name="email" type="email" required></label><label>Mot de passe<input name="password" type="password" required></label><div data-captcha-area></div><p data-error></p><button type="submit">Créer mon compte</button></form>
<form id="verifyForm" hidden><h2>Vérification e-mail</h2><label>Code<input name="code" required></label><p data-error></p><button type="submit">Vérifier</button></form>
</section><script type="module" src="/login-page.js"></script></body></html>`;
const store=`
export const getMemberState=()=>({member:window.__mockMember||null,loggedIn:!!window.__mockMember,loading:false,error:null});
export const subscribeMember=fn=>{queueMicrotask(()=>fn(getMemberState()));return ()=>{};};
export const refreshMember=async()=>{};
export const logout=async()=>{};
export const register=async()=>{window.__registerCount=(window.__registerCount||0)+1;return window.__scenario==='existing'?{state:'FAILURE',errorCode:'emailAlreadyExists'}:{state:'EMAIL_VERIFICATION_REQUIRED'};};
export const login=async()=>{window.__loginCount=(window.__loginCount||0)+1;window.__mockMember={id:'wix-fixture-123',loginEmail:'candidate@example.com'};return {state:'SUCCESS'};};
export const verifyEmail=async()=>{window.__mockMember={id:'wix-fixture-123',loginEmail:'candidate@example.com'};return {state:'SUCCESS'};};
`;
const items=`
export const queryItems=async()=>({items:window.__roleRecord?[{role:window.__roleRecord}]:[]});
export const insertItem=async (collection,data)=>{if(collection!=='AccountRoles')throw Error('Wrong CMS role collection');window.__roleRecord=data.role;window.__roleWrites=(window.__roleWrites||0)+1;return {_id:'role-fixture-001',...data};};
`;
const captcha=`
export const prepareCaptcha=async()=>{};
export const captchaTokensFor=async()=>({recaptchaToken:'fixture-token'});
export const resetCaptcha=()=>{};
export const invisibleCaptchaTokens=async()=>({recaptchaToken:'fixture-token'});
`;
async function one(browser,scenario){
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(name=>{window.__scenario=name;window.__registerCount=0;window.__roleWrites=0;},scenario);
 await page.route('https://horenova.test/**',route=>{
  const u=new URL(route.request().url());
  const p=u.pathname;
  const code=p==='/enter.html'?formHtml:p==='/login-page.js'?authSource:p==='/js/wix/member-store.js'?store:p==='/js/wix/items.js'?items:p==='/wix-captcha.js'?captcha:'<!doctype html><title>Destination</title>';
  return route.fulfill({status:200,contentType:p.endsWith('.js')?'text/javascript':'text/html',body:code});
 });
 const url='https://horenova.test/enter.html?mode=signup&returnTo='+encodeURIComponent('/apply.html?id=offer-001&role=Serveur');
 await page.goto(url);
 await page.locator('#signupForm').waitFor({state:'visible'});
 await page.locator('#signupForm [data-role="recruiter"]').click();
 assert.equal(await page.locator('#signupForm [data-role="recruiter"]').getAttribute('aria-pressed'),'true','Recruiter role must be selectable');
 assert.equal(await page.locator('#signupForm [data-role="recruiter"]').evaluate(x=>x.classList.contains('active')),true,'Recruiter selection must be visible');
 await page.locator('#signupForm [data-role="candidate"]').click();
 assert.equal(await page.locator('#signupForm [data-role="candidate"]').getAttribute('aria-pressed'),'true','Candidate must remain selectable');
 for(const [name,value] of Object.entries({firstName:'Samira',lastName:'Candidate',email:'candidate@example.com',password:'ExempleMotDePasse123'})){
  await page.locator('#signupForm [name="'+name+'"]').fill(value);
 }
 await page.locator('#signupForm button[type=submit]').click();
 if(scenario==='existing'){
  await page.locator('#signinForm').waitFor({state:'visible'});
  assert.equal(await page.locator('#signinForm [name=email]').inputValue(),'candidate@example.com');
  assert.equal(await page.evaluate(()=>window.__registerCount),1,'Existing members must not be re-registered');
  assert.ok((await page.locator('#signinForm').innerText()).includes('existe'),'Existing member should receive a clear explanation');
 }else{
  await page.locator('#verifyForm').waitFor({state:'visible'});
  assert.ok((await page.locator('.hn-verify-guide').innerText()).includes('Ne créez pas un deuxième compte'));
  const journey=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('hn-candidate-journey-v3')));
  assert.equal(journey.returnTo,'/apply.html?id=offer-001&role=Serveur');
  assert.equal(journey.role,'candidate');
  assert.equal(await page.evaluate(()=>window.__registerCount),1,'One registration attempt only');
  await page.locator('#verifyForm [name=code]').fill('123456');
  await page.locator('#verifyForm button[type=submit]').click();
  await page.waitForURL(/apply\.html\?id=offer-001/, {timeout:5500});
  assert.equal(new URL(page.url()).searchParams.get('id'),'offer-001','Offer ID must survive email verification');
  assert.equal(new URL(page.url()).pathname,'/apply.html','Email verification should resume the selected application, without any setup or quiz redirect');
 }
 assert.deepEqual(errors,[],'Browser JS exceptions: '+errors);
 console.log('PASS candidate registration scenario '+scenario);
 await context.close();
}
async function main(){const browser=await chromium.launch({headless:true});try{await one(browser,'existing');await one(browser,'new');}finally{await browser.close();}}
main().catch(e=>{console.error('FAIL candidate registration path: '+e.stack);process.exitCode=1});
