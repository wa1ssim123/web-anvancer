'use strict';
/* HORENOVA home smoke: real DOM/CSS, Shop, Academy, Matching and brand story, FR/EN/AR. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const html=read('index.html');
const i18n=read('horenova-i18n.js');
const home=read('horenova-home.js');
const css=read('horenova-home-story-20261120.css');
assert.match(html,/class="hn-intro-shortcut hn-intro-shortcut-shop" href="\/shop.html"/);
assert.match(html,/class="hn-intro-shortcut hn-intro-shortcut-academy" href="\/academy.html"/);
assert.match(html,/class="hn-intro-shortcut hn-intro-shortcut-matching" href="\/matching-guide.html"/);
assert.match(html,/id="notre-histoire"/);
assert.match(css,/max-width:360px/);
const store="export const getMemberState=()=>({loggedIn:false,member:null});export const subscribeMember=()=>()=>{};";
async function scenario(browser,lang,width,height){
 const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block',reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 await page.addInitScript(language=>localStorage.setItem('mihna-lang',language),lang);
 await page.route('**/*',async route=>{
  const request=route.request();const url=new URL(request.url());
  if(url.hostname!=='horenova.test'){
   // Decorative remote images and video are not necessary for layout QA.
   return route.fulfill({status:204,body:''});
  }
  const pathName=url.pathname;
  if(pathName==='/')return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
  if(pathName==='/js/wix/member-store.js')return route.fulfill({status:200,contentType:'text/javascript',body:store});
  if(pathName==='/horenova-home.js')return route.fulfill({status:200,contentType:'text/javascript',body:home});
  if(pathName==='/horenova-i18n.js')return route.fulfill({status:200,contentType:'text/javascript',body:i18n});
  if(pathName.endsWith('.js'))return route.fulfill({status:200,contentType:'text/javascript',body:''});
  if(pathName.endsWith('.css')&&fs.existsSync(path.join(root,pathName.slice(1))))
   return route.fulfill({status:200,contentType:'text/css',body:read(pathName.slice(1))});
  return route.fulfill({status:204,body:''});
 });
 await page.goto('https://horenova.test/',{waitUntil:'domcontentloaded'});
 await page.locator('.hn-intro.open').waitFor({timeout:6000});
 await page.waitForFunction(l=>document.documentElement.lang===l,lang);
 assert.equal(await page.locator('.hn-intro-shortcut-shop').getAttribute('href'),'/shop.html');
 assert.equal(await page.locator('.hn-intro-shortcut-academy').getAttribute('href'),'/academy.html');
 assert.equal(await page.locator('.hn-intro-shortcut-matching').getAttribute('href'),'/matching-guide.html');
 assert.equal(await page.locator('.hn-intro-shortcut-tech').getAttribute('href'),'/tech.html');
 assert.equal(await page.locator('.hn-intro-shortcut').count(),5,'SHOP, ACADEMY, MATCHING, TECH and CANAUX');
 assert.equal(await page.locator('.hn-home-channel-strip').count(),0,'Old mobile banner cannot overlap the header');
 assert.equal(await page.locator('.hn-intro-shortcut-social').count(),1);
 assert.equal(await page.locator('#hnSocialWA').getAttribute('href'),'https://whatsapp.com/channel/0029Vb9VLZ5A2pLGFYQA6s2u');
 assert.equal(await page.locator('#hnSocialTG').isHidden(),true,'Future Telegram link must remain disabled');
 const translated={
  fr:['POUR S’ÉQUIPER','POUR APPRENDRE','POUR TROUVER SA PLACE','POUR INNOVER','Deux horizons.'],
  en:['TO EQUIP YOURSELF','TO LEARN','FIND YOUR PLACE','TO INNOVATE','Two horizons.'],
  ar:['للتجهيز','للتعلم','لتجد مكانك المناسب','للابتكار','أفقان.']
 }[lang];
 const actual=await page.evaluate(()=>[
  document.querySelector('.hn-intro-shortcut-shop .hn-intro-shortcut-overline')?.textContent?.trim(),
  document.querySelector('.hn-intro-shortcut-academy .hn-intro-shortcut-overline')?.textContent?.trim(),
  document.querySelector('.hn-intro-shortcut-matching .hn-intro-shortcut-overline')?.textContent?.trim(),
  document.querySelector('.hn-intro-shortcut-tech .hn-intro-shortcut-overline')?.textContent?.trim(),
  document.querySelector('#hn-origin-title')?.firstChild?.textContent?.trim()
 ]);
 assert.deepEqual(actual,translated);
 const layout=await page.evaluate(()=>{
  const el=document.querySelector('.hn-intro-shortcuts'),rect=el.getBoundingClientRect();
  const origin=document.querySelector('.hn-origin'),originRect=origin.getBoundingClientRect();
  return {documentWidth:document.documentElement.scrollWidth,windowWidth:innerWidth,
   tilesLeft:rect.left,tilesRight:rect.right,originWidth:originRect.width,
   scrollableIntro:document.querySelector('.hn-intro').scrollHeight>=document.querySelector('.hn-intro').clientHeight,
   flags:[...document.querySelectorAll('.hn-origin-flags svg[role="img"]')].map(n=>{
     const rect=n.getBoundingClientRect();
     const css=getComputedStyle(n);
     const shapes=[...n.querySelectorAll('rect,path')];
     return {label:n.getAttribute('aria-label'),width:rect.width,height:rect.height,
       display:css.display,visibility:css.visibility,opacity:css.opacity,
       shapes:shapes.length,svgNamespace:n.namespaceURI,
       drawn:shapes.every(shape=>getComputedStyle(shape).visibility!=='hidden')};
   })
  };
 });
 assert.ok(layout.tilesLeft>=-1&&layout.tilesRight<=width+1,'Intro quick links overflow '+JSON.stringify(layout));
 assert.ok(layout.originWidth<=width+1,'Origin section exceeds viewport '+JSON.stringify(layout));
 assert.equal(layout.flags.length,2,'Two standalone SVG flags must be available without emoji fonts');
 assert.deepEqual(layout.flags.map(x=>x.label),lang==='en'?['Flag of Morocco','Flag of Canada']:lang==='ar'?['علم المغرب','علم كندا']:['Drapeau du Maroc','Drapeau du Canada']);
 for(const flag of layout.flags){
  assert.ok(flag.width>=26&&flag.height>=18,'Flag not visible on screen: '+JSON.stringify(flag));
  assert.equal(flag.display,'block');
  assert.equal(flag.visibility,'visible');
  assert.ok(Number(flag.opacity)>.8,'Flag is transparent');
  assert.ok(flag.shapes>=2&&flag.drawn,'Flag SVG shapes are missing');
  assert.equal(flag.svgNamespace,'http://www.w3.org/2000/svg');
 }
 assert.equal(await page.locator('.hn-origin-values .hn-origin-value').count(),3);
 await page.locator('button.hn-intro-enter').click();
 await page.locator('.hn-intro.gone').waitFor({timeout:4000});
 assert.deepEqual(errors,[],'Browser errors: '+errors.join('; '));
 console.log('PASS home brand '+lang+' '+width+'x'+height);
 await context.close();
}
(async()=>{const browser=await chromium.launch({headless:true});try{
 for(const language of ['fr','en','ar']){
  for(const [width,height] of [[320,640],[390,844],[768,1024],[1280,800]]){
   await scenario(browser,language,width,height);
  }
 }
}finally{await browser.close()}})().catch(error=>{console.error('FAIL home brand: '+error.stack);process.exitCode=1});
