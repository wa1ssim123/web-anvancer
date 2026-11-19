'use strict';
/**
 * HORENOVA release gates (static CI, no personal data, no production mutations).
 * Does NOT replace a three-account E2E run, email inbox verification or real device tests.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const child=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function source(file){return fs.readFileSync(path.join(root,file),'utf8');}
function checkSyntax(file,isModule){
  const args=isModule?['--input-type=module','--check']:['--check'];
  const result=child.spawnSync(process.execPath,args,{input:source(file),encoding:'utf8'});
  assert.equal(result.status,0,file+' JS syntax failed: '+result.stderr);
}
for(const file of ['backend/server.cjs','app.js']){
  checkSyntax(file,false);
}
for(const file of ['live-data.js','recruit-live.js','recruiter-setup.js',
  'login-page.js','account.js','apply.js','admin.js','admin-overview.js','conversations.js','hn-api.js',
  'js/wix/client.js','js/wix/auth.js','candidate-setup.js']){
  checkSyntax(file,true);
}
console.log('PASS JavaScript syntax (15 files)');
const shop=source('shop.html');
assert.match(shop,/hn-shop-exit/);
assert.match(shop,/href="\/index.html" class="hn-shop-exit"/);
assert.match(source('enter.html'),/mot-de-passe-oublie\.html/);
assert.match(source('mot-de-passe-oublie.html'),/\/_api\/iam\/recovery\/v1\/send-email/);
console.log('PASS Shop exit + Wix recovery');
const authPage=source('login-page.js');
const authShell=source('enter.html');
const tokenStore=source('js/wix/client.js');
assert.doesNotMatch(authPage,/Connexion bloquée par ce navigateur intégré/);
assert.doesNotMatch(authPage,/signin\.querySelector\('button\[type="submit"\]'\)\.disabled\s*=\s*true/);
assert.match(authPage,/Votre navigateur limite le stockage de session/);
assert.match(tokenStore,/if \(typeof localStorage === "undefined"\) return null/);
assert.match(tokenStore,/if \(typeof localStorage === "undefined"\) return;/);
assert.match(authShell,/android-signin-20261120-3/);
assert.match(authPage,/ADMIN_MEMBER_IDS/);
console.log('PASS Android Chrome sign-in stays enabled; token storage is exception-safe and four admin identities are recognized');
const recruiter=source('recruit-live.js');
assert.match(recruiter,/recruitShiftFields/);
assert.match(recruiter,/data\.kind==='shift'/);
assert.match(recruiter,/\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$/);
assert.match(recruiter,/name='shiftDate'/);
assert.match(source('recruiter-setup.html'),/name="businessAddress"/);
assert.match(source('recruiter-setup.html'),/name="businessEmail"/);
assert.match(source('recruiter-setup.html'),/name="ice"/);
assert.match(source('recruiter-setup.js'),/businessAddress/);
console.log('PASS Recruiter setup and shift validation');
const backend=source('backend/server.cjs');
assert.match(backend,/path==='\/api\/jobs\/public'/);
assert.match(backend,/status='VALIDEE'/);
assert.match(backend,/SELECT r\.id,r\.business_name,r\.business_type/);
assert.match(backend,/SELECT id,job_title,job_role FROM hr_recruiter_requests/);
assert.match(backend,/requireRole\(user,\['admin'\]\)/);
assert.match(backend,/\/api\/applications/);
assert.match(backend,/action==='messages'/);
assert.doesNotMatch(backend.slice(backend.indexOf("if(path==='/api/jobs/public'"),backend.indexOf("const user=await auth(req);")),/SELECT \*/);
console.log('PASS Admin moderation, sanitized public jobs, applications and messages are wired in code');
const dossier=source('apply.js');
assert.match(dossier,/hubUploadPhoto/);
assert.match(dossier,/experienceYears/);
assert.match(dossier,/motivation/);
assert.match(dossier,/consentToIntro:true,application/);
assert.match(recruiter,/hubUploadWorkplacePhoto/);
assert.match(recruiter,/workplacePhoto/);
assert.match(backend,/hr_workplace_photos/);
assert.match(backend,/workplace-photo/);
assert.match(source('admin-overview.js'),/mountAdminOverview/);
console.log('PASS Rich application, workplace photo upload and admin publishing board');
const listing=source('live-data.js');
assert.match(listing,/centralVacancies/);
assert.match(listing,/CandidatePublicProfiles/);
assert.match(listing,/renderJobDetail/);
const app=source('app.js');
assert.match(app,/window\.renderJobDetail=renderJobDetail/);
assert.match(app,/selectedDay===-1/);
assert.match(source('apply.js'),/requireRole\(\['candidate'\]\)/);
assert.match(source('quiz.js'),/requireRole\(\['candidate'\]\)/);
assert.match(source('recruiter-setup.js'),/requireRole\(\['recruiter'\]\)/);
console.log('PASS UI rerender, public talents, candidates-only quiz and protected recruiter onboarding');
console.log('STATIC QA COMPLETE. Live three-account E2E, mailbox delivery and database persistence not tested here.');
