'use strict';
/* Real Chromium regression for the public A-to-Z Matching guide. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'matching-guide.html'),'utf8');
const css=fs.readFileSync(path.join(root,'matching-guide.css'),'utf8');
const script=fs.readFileSync(path.join(root,'matching-guide.js'),'utf8');
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.match(home,/href="\/matching-guide.html"/,'Homepage must link directly to the guide');
assert.match(html,/href="\/enter\.html\?mode=signup&amp;returnTo=%2Fjobs\.html"/,'Signup must preserve jobs destination');
assert.match(html,/href="\/jobs\.html"/,'Job links must go to public vacancies');
assert.match(html,/href="\/shifts\.html"/,'Shift links must go to public shifts');
assert.match(html,/href="\/account\.html"/,'Track applications via member account');
assert.equal((html.match(/class="mg-step(?: mg-step-featured)?"/g)||[]).length,6,'Exactly 6 candidate steps');
const translations=JSON.parse(script.slice(script.indexOf('const messages =')+'const messages ='.length,script.indexOf(';\n  const locales')).trim());
const required=[...new Set([...html.matchAll(/data-msg(?:-html)?="([^"]+)"/g)].map(x=>x[1]))];
for(const key of required){
 assert.ok(translations[key],'Missing key '+key);
 for(const lang of ['fr','en','ar'])assert.ok(translations[key][lang]?.trim(),'Empty translation '+key+':'+lang);
}
assert.equal(Object.keys(translations).length,required.length);
const expected={
 fr:{title:'Le bon talent.',intro:'Créer un compte',step:'Créez votre espace candidat.',dir:'ltr'},
 en:{title:'The right talent.',intro:'Create an account',step:'Create your candidate account.',dir:'ltr'},
 ar:{title:'الموهبة المناسبة.',intro:'إنشاء حساب',step:'أنشئ حسابك كمرشح.',dir:'rtl'}
};
async function scenario(browser,lang,width,height){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',serviceWorkers:'block'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(lang=>{if(!sessionStorage.getItem('mg-qa-initialized')){localStorage.setItem('mihna-lang',lang);sessionStorage.setItem('mg-qa-initialized','1')}},lang);
 await page.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(url.hostname!=='horenova.test')return route.fulfill({status:204,body:''});
  if(url.pathname==='/matching-guide.html')return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
  if(url.pathname==='/matching-guide.css')return route.fulfill({status:200,contentType:'text/css; charset=utf-8',body:css});
  if(url.pathname==='/matching-guide.js')return route.fulfill({status:200,contentType:'text/javascript; charset=utf-8',body:script});
  return route.fulfill({status:204,body:''});
 });
 await page.goto('https://horenova.test/matching-guide.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(lang=>document.documentElement.lang===lang,lang);
 assert.equal(await page.locator('html').getAttribute('dir'),expected[lang].dir);
 assert.equal(await page.locator('#mg-language').inputValue(),lang);
 assert.equal((await page.locator('.mg-hero h1').innerText()).split('\n')[0],expected[lang].title);
 assert.equal((await page.locator('.mg-step:first-child h3').innerText()).trim(),expected[lang].step);
 assert.equal(await page.locator('.mg-step').count(),6);
 assert.ok((await page.locator('.mg-rail a').count())===6);
 const dims=await page.evaluate(()=>{
  const clipped=[...document.querySelectorAll('.mg-header-actions a,.mg-header-actions select,.mg-hero-actions a,.mg-step-link')].filter(el=>{
   const r=el.getBoundingClientRect(), style=getComputedStyle(el);
   return style.display!=='none'&&r.width>0&&(r.left < -2||r.right >innerWidth+2);
  }).slice(0,4).map(el=>({tag:el.tagName,cls:el.className,text:el.textContent?.trim().slice(0,28)}));
  return {innerWidth,scrollWidth:document.documentElement.scrollWidth,clipped};
 });
 assert.ok(dims.scrollWidth <= width+2,'Page scrolls horizontally '+lang+' '+width+': '+JSON.stringify(dims));
 assert.deepEqual(dims.clipped,[],'CTA outside viewport '+JSON.stringify(dims));
 const link=page.locator('.mg-primary[href="#guide-steps"]');
 await link.click();
 assert.equal(new URL(page.url()).hash,'#guide-steps');
 await page.locator('#mg-language').selectOption(lang==='en'?'ar':'en');
 const changed=lang==='en'?'ar':'en';
 assert.equal(await page.locator('html').getAttribute('lang'),changed);
 assert.equal(await page.locator('html').getAttribute('dir'),expected[changed].dir);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(lang=>document.documentElement.lang===lang,changed);
 assert.equal(await page.locator('#mg-language').inputValue(),changed,'Language selection must persist');
 assert.deepEqual(errors,[],'JavaScript errors: '+errors.join('; '));
 console.log('PASS matching guide '+lang+' '+width+'x'+height);
 await context.close();
}
(async()=>{const browser=await chromium.launch({headless:true});try{
 for(const lang of ['fr','en','ar']){
  for(const [width,height] of [[320,640],[390,844],[768,1024],[1280,800]]){
   await scenario(browser,lang,width,height);
  }
 }
}finally{await browser.close()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
