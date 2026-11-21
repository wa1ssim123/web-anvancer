'use strict';
/* HORENOVA TECH regression checks: real Chromium DOM with local project assets.
   The browser never sends orders, payments or personal data. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const files=['tech.html','tech.css','tech.js','tech-demo.html','tech-demo.js','tech-demo-i18n.js','tech-home.css'];
for(const f of files)assert.ok(fs.existsSync(path.join(root,f)),f+' must exist');
assert.match(read('tech.js'),/mihna-lang/,'Tech shares language with Horenova');
assert.match(read('tech.html'),/Prix|Tarifs/,'Catalog discloses that prices are unconfirmed');
assert.match(read('tech-demo.html'),/PAS UN LOGICIEL DE PRODUCTION/,'No claim of live production software');

async function openPage(browser,filename,viewport){
  const context=await browser.newContext({viewport,serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.hostname!=='horenova.test')return route.fulfill({status:204,body:''});
    const name=url.pathname.replace(/^\//,'')||'index.html';
    const file=path.resolve(root,name);
    if(!file.startsWith(root+path.sep)&&file!==root)return route.fulfill({status:403});
    if(!fs.existsSync(file))return route.fulfill({status:404,body:'not found '+name});
    const type=name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':name.endsWith('.html')?'text/html':name.endsWith('.svg')?'image/svg+xml':'text/plain';
    return route.fulfill({status:200,contentType:type,body:fs.readFileSync(file)});
  });
  await page.goto('https://horenova.test/'+filename,{waitUntil:'load'});
  return {context,page,errors};
}
async function shopCase(browser,viewport){
 const {page,context,errors}=await openPage(browser,'tech.html',viewport);
 await page.waitForFunction(()=>document.querySelector('#quoteTrigger')&&document.querySelector('.product-add'));
 assert.equal(await page.locator('article.product').count(),6);
 await page.locator('[data-filter="nfc"]').click();
 assert.equal(await page.locator('article.product:visible').count(),1,'NFC filter isolates NFC solution');
 await page.locator('[data-filter="all"]').click();
 assert.equal(await page.locator('article.product:visible').count(),6);
 await page.locator('[data-add="POS"]').click();
 await page.locator('[data-add="NFC"]').click();
 assert.equal(await page.locator('#quoteCount').textContent(),'2');
 await page.locator('#quoteTrigger').click();
 assert.equal(await page.locator('.quote-item').count(),2);
 await page.locator('#closeQuote').click();
 await page.reload({waitUntil:'load'});
 assert.equal(await page.locator('#quoteCount').textContent(),'2','Quote persists after reload');
 await page.locator('#techLanguage').selectOption('en');
 assert.equal(await page.evaluate(()=>document.documentElement.lang),'en');
 assert.match(await page.locator('#heroTitle').innerText(),/Technology/);
 await page.locator('#techLanguage').selectOption('ar');
 assert.equal(await page.evaluate(()=>document.documentElement.dir),'rtl');
 assert.match(await page.locator('#heroTitle').innerText(),/تكنولوجيا/);
 await page.locator('#techLanguage').selectOption('fr');
 const box=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:innerWidth}));
 assert.ok(box.scroll<=box.inner+2,'horizontal overflow tech '+JSON.stringify({viewport,box}));
 assert.deepEqual(errors,[],'TECH JS errors');
 await context.close();
}
async function labCase(browser,viewport){
 const {page,context,errors}=await openPage(browser,'tech-demo.html',viewport);
 await page.waitForFunction(()=>document.querySelectorAll('.pos-product').length===9);
 assert.equal(await page.locator('#posProductGrid .pos-product').count(),9);
 await page.locator('.pos-product[aria-label*="Espresso"]').click();
 assert.equal(await page.locator('#orderTotal').textContent(),'22 DH');
 await page.locator('#completeSale').click();
 assert.equal(await page.locator('#saleCount').textContent(),'1');
 assert.equal(await page.locator('#revenueTotal').textContent(),'22 DH');
 await page.locator('[data-view="stock"]').click();
 const firstStock=await page.locator('#stockList .stock-item .stock-qty').first().textContent();
 assert.equal(firstStock,'24','POS sale decrements matching inventory');
 assert.equal(await page.locator('#salesLog .history-item').count(),1);
 await page.locator('[data-view="menu"]').click();
 assert.equal(await page.locator('#menuItems .menu-item').count(),9);
 await page.locator('#labLanguage').selectOption('en');
 await page.waitForFunction(()=>document.documentElement.lang==='en');
 assert.match(await page.locator('h1').innerText(),/From POS/);
 await page.locator('#labLanguage').selectOption('ar');
 await page.waitForFunction(()=>document.documentElement.dir==='rtl');
 assert.match(await page.locator('h1').innerText(),/الكاشير/);
 const box=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:innerWidth}));
 assert.ok(box.scroll<=box.inner+2,'horizontal overflow demo '+JSON.stringify({viewport,box}));
 page.once('dialog',d=>d.accept());
 await page.locator('#resetDemo').click();
 assert.equal(await page.locator('#saleCount').textContent(),'0');
 await page.locator('[data-view="stock"]').click();
 assert.equal(await page.locator('#stockList .stock-item .stock-qty').first().textContent(),'25');
 assert.deepEqual(errors,[],'TECH LAB JS errors');
 await context.close();
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const size of [{width:390,height:844},{width:1440,height:900}]){
    await shopCase(browser,size);
    console.log('PASS Tech Shop '+size.width+'x'+size.height+' catalog, quote, FR EN AR and viewport');
    await labCase(browser,size);
    console.log('PASS Tech Lab '+size.width+'x'+size.height+' POS, sales, inventory, menu, FR EN AR and reset');
  }
 }finally{await browser.close();}
})().catch(e=>{console.error('FAIL HORENOVA TECH QA: '+e.stack);process.exitCode=1;});