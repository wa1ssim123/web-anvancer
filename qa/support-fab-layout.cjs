'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
async function main(){
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [320,375,390,430,768,1024,1280]){
   const context=await browser.newContext({viewport:{width,height:850},serviceWorkers:'block'});
   const page=await context.newPage();
   const nav=Array.from({length:8},(_,i)=>'<a href="/'+i+'.html"><b>✦</b><span>'+(i===0?'Administration':i===1?'Demandes':i===2?'Candidatures':'Navigation '+i)+'</span></a>').join('');
   await page.setContent('<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body data-hn12="admin"><main style="min-height:1600px;background:#f7f4ef"></main><nav class="hn12-dock">'+nav+'</nav></body></html>');
   await page.addStyleTag({path:path.join(root,'horenova-v12.css')});
   await page.addStyleTag({path:path.join(root,'support.css')});
   await page.addScriptTag({path:path.join(root,'pwa-register.js')});
   await page.locator('.hs-fab-trigger').waitFor({state:'visible'});
   let state=await page.evaluate(()=>{
    const dock=document.querySelector('.hn12-dock'),fab=document.querySelector('.hs-fab-trigger'),wrap=document.querySelector('.hs-launcher');
    const dockRect=dock.getBoundingClientRect(),fabRect=fab.getBoundingClientRect();
    const links=[...dock.querySelectorAll(':scope>a')].filter(el=>getComputedStyle(el).display!=='none');
    return {
     width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
     navHeight:Math.round(dockRect.height),navTop:dockRect.top,
     visible:links.length,rows:new Set(links.map(x=>Math.round(x.getBoundingClientRect().top))).size,
     fabCount:document.querySelectorAll('.hs-fab-trigger').length,actionCount:document.querySelectorAll('.hs-fab-action').length,
     fabBottom:fabRect.bottom,fabHeight:fabRect.height,legacyPills:document.querySelectorAll('.hs-launcher>a').length,
     launcherBottom:getComputedStyle(wrap).bottom
    };
   });
   assert.equal(state.fabCount,1,'Exactly one support launcher, not two large pills');
   assert.equal(state.actionCount,2,'Popover must contain chat and phone');
   assert.equal(state.legacyPills,0,'Legacy floating support links must be gone');
   assert.ok(state.scrollWidth<=width+2,'Horizontal overflow at '+width+': '+JSON.stringify(state));
   if(width<=960){
    assert.equal(state.visible,5,'Bottom dock must show five shortcuts only: '+JSON.stringify(state));
    assert.equal(state.rows,1,'Dock must not wrap on a second row: '+JSON.stringify(state));
    assert.ok(state.navHeight<=74,'Bottom navigation is too tall: '+JSON.stringify(state));
    assert.ok(state.fabHeight<=54,'Floating support is oversized: '+JSON.stringify(state));
    assert.ok(state.fabBottom<=state.navTop-7,'Floating support must not overlap bottom navigation: '+JSON.stringify(state));
   } else{
    assert.ok(state.fabHeight<=52,'Desktop floating support is oversized');
   }
   await page.locator('.hs-fab-trigger').click();
   assert.equal(await page.locator('.hs-fab-trigger').getAttribute('aria-expanded'),'true');
   assert.equal(await page.locator('.hs-fab-panel').isVisible(),true,'Help menu must open');
   assert.equal(await page.locator('.hs-fab-action.hs-fab-chat').getAttribute('href'),'/support.html');
   assert.equal(await page.locator('.hs-fab-action.hs-fab-phone').getAttribute('href'),'tel:+212648377009');
   const panel=await page.locator('.hs-fab-panel').boundingBox();
   assert.ok(panel&&panel.x>=0&&panel.x+panel.width<=width+2&&panel.y>=5,'Help menu must stay within the viewport: '+JSON.stringify(panel));
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('.hs-fab-panel').isVisible(),false,'Escape must close support menu');
   assert.equal(await page.locator('.hs-fab-trigger').getAttribute('aria-expanded'),'false');
   await context.close();
   console.log('PASS compact HORENOVA help FAB + five-link single-row dock at '+width+'px');
  }
 }finally{await browser.close();}
}
main().catch(err=>{console.error('FAIL support FAB: '+err.message);process.exitCode=1;});
