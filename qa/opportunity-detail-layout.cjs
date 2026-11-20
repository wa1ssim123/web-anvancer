'use strict';
/* Shared job/shift permalink visual QA. All data mocked; no production writes. */
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const jobHtml=fs.readFileSync(path.join(root,'job.html'),'utf8');
const shiftHtml=fs.readFileSync(path.join(root,'shifts.html'),'utf8');
assert.ok(jobHtml.includes('id="jobDetail"'),'Same existing job permalink container must remain');
assert.ok(jobHtml.includes('/horenova-opportunities-v1.css?v=opportunity-20261120-r1'),'Job detail must cache-bust new styles');
assert.ok(shiftHtml.includes('/horenova-opportunities-v1.css?v=opportunity-20261120-r1'),'Shift listing must use matching styles');
assert.ok(jobHtml.includes('/app.js?v=opportunity-20261120-r1'),'Job detail must cache-bust JS');
const logo='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="940" height="530"><rect width="100%" height="100%" fill="#111820"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffac70" font-size="72">SWISRA</text></svg>');
const mock={id:'qa-shared-link-1',kind:'job',title:'serveur ,commis ,',role:'Serveur',business:'Complexe Swisra',city:'Casablanca',businessType:'Complexe de loisirs',img:logo,pay:'150',period:'/ mois',time:'10–21',details:'Sens des responsabilités et attitude professionnelle.',workplaceAddress:'Oulad Salah et Jemâat',contractType:'Autre',openings:12,startDate:'2026-11-22',requirements:'Excellent sens de l’accueil et du service client. Bonne communication et esprit d’équipe. Maîtrise des techniques de service et de prise de commande.',hasWorkplacePhoto:true};
function fixture(){
 return '<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body data-hn12="job"><header class="hn12-top"><a class="hn12-logo" href="/"><span>HORENOVA</span></a><div class="hn12-actions"><a class="profile" href="/account.html">Mon espace</a><button class="hn12-menu">☰</button></div></header><main class="hn12-page"><section class="hn12-section hn12-paper hn-opportunity-frame"><div id="jobDetail"></div></section></main><nav class="hn12-dock"><a href="/jobs.html">Offres</a></nav></body></html>';
}
async function main(){
 const browser=await chromium.launch({headless:true});
 try{
 for(const kind of ['job','shift']){
  for(const width of [320,375,390,430,768,1024]){
   const context=await browser.newContext({viewport:{width,height:840},serviceWorkers:'block'});
   const page=await context.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.setContent(fixture());
   for(const name of ['styles.css','horenova-v12.css','support.css','horenova-opportunities-v1.css'])
    await page.addStyleTag({path:path.join(root,name)});
   await page.evaluate(item=>{window.HORENOVA_LIVE_JOBS=[item]}, {...mock,kind});
   await page.addScriptTag({path:path.join(root,'app.js')});
   await page.evaluate(()=>window.renderJobDetail());
   const s=await page.evaluate(()=>{
    const one=selector=>document.querySelector(selector);
    const rect=selector=>one(selector)?.getBoundingClientRect();
    return{
      viewport:innerWidth,scroll:document.documentElement.scrollWidth,
      headerPosition:getComputedStyle(one('.hn12-top')).position,
      navDisplay:getComputedStyle(one('.hn12-dock')).display,
      imageHeight:rect('.hn-opportunity-visual')?.height,
      title:one('.hn-opportunity-title')?.textContent,
      titleRight:rect('.hn-opportunity-title')?.right,
      titleFont:parseFloat(getComputedStyle(one('.hn-opportunity-title')).fontSize),
      factCount:document.querySelectorAll('.hn-opportunity-fact').length,
      requirementVisible:!!one('.hn-opportunity-requirements'),
      applyHref:one('.hn-opportunity-apply-btn')?.getAttribute('href'),
      applyVisible:!!one('.hn-opportunity-apply-btn'),
      shareControls:document.querySelectorAll('.hn-opportunity-tool').length,
      photo:one('.hn-opportunity-visual img')?.getAttribute('src'),
      typeTag:one('.hn-opportunity-tag')?.textContent,
      imageObjectFit:getComputedStyle(one('.hn-opportunity-visual img')).objectFit
    };
   });
   assert.ok(s.scroll<=width+2,'Overflow '+kind+' '+width+': '+JSON.stringify(s));
   assert.equal(s.headerPosition,'relative','Shared link header must scroll with the page');
   assert.equal(s.navDisplay,'none','Bottom dock must not block an announcement');
   assert.equal(s.title,'serveur · commis','Job title whitespace should be beautifully normalized');
   assert.ok(s.titleRight<=width+2,'Headline overflows mobile viewport');
   assert.ok(s.factCount===4&&s.requirementVisible,'Real job facts and requirements retained');
   assert.ok(s.applyHref.includes('id=qa-shared-link-1'),'Original id preserved for application');
   assert.equal(s.shareControls,3,'Concentrated share/WhatsApp/favorites controls');
   assert.equal(s.imageObjectFit,'contain','Employer-provided logo must not be cropped');
   assert.ok(s.typeTag.includes(kind==='job'?'EMPLOI':'SHIFT'),'Correct job/shift type shown');
   if(width<=960){assert.ok(s.imageHeight<=220,'Image must not fill the full viewport');assert.ok(s.titleFont<=39,'Title too large on phone');}
   assert.equal(errors.length,0,'Frontend JS errors: '+errors.join('; '));
   console.log('PASS shared '+kind+' announcement '+width+'px');
   await context.close();
  }
 }
 }finally{await browser.close();}
}
main().catch(error=>{console.error('FAIL shared opportunity layout: '+error.message);process.exitCode=1;});
