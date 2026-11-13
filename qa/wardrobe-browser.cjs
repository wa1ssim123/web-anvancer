'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
const base=process.env.HORENOVA_TEST_ORIGIN || 'https://horenova.com';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let pageErrors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>pageErrors.push(String(e)));
 await page.goto(base+'/shop.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.locator('.hx26-slot').first().waitFor({state:'visible',timeout:20000});
 assert.equal(await page.locator('.hx26-slot').count(),7,'Should have 7 independent clothes');
    const garmentImages=await page.locator('.hx26-slot img').evaluateAll(images=>images.map(img=>({ok:img.complete&&img.naturalWidth>0,src:img.currentSrc})));
    console.log('Garment image decode status:',JSON.stringify(garmentImages));
    assert.ok(garmentImages.every(i=>i.ok),'All seven garment images must load');
 assert.match(await page.locator('[data-hx26-name]').innerText(),/Executive Chef Jacket/);
 await page.locator('button[data-hx26="next"]').first().click();
 assert.match(await page.locator('[data-hx26-name]').innerText(),/Service Vest/);
 await page.locator('button[data-hx26="prev"]').first().click();
 assert.match(await page.locator('[data-hx26-name]').innerText(),/Executive Chef Jacket/);
 await page.locator('.hx26-card button[data-hx26="view"]').click();
 await page.locator('.hx26-dialog').waitFor({state:'visible',timeout:8000});
    await page.screenshot({path:'wardrobe-dialog.png',fullPage:false});
    console.log('Dialog photo pointer-events:',await page.locator('.hx26-dialog-photo img').evaluate(el=>getComputedStyle(el).pointerEvents));
 await page.locator('.hx26-dialog-faces button[data-hx26-face="back"]').click();
 assert.match(await page.locator('.hx26-dialog-photo').getAttribute('class'),/is-back/);
 await page.locator('button[data-hx26-step="1"]').click();
 await page.locator('button[data-hx26-size="M"]').click();
 await page.locator('button[data-hx26-step="add"]').click();
 assert.equal(await page.locator('.hx26-cart-item').count(),1,'Cart after adding');
 await page.locator('button.hx26-x').click();
 await page.screenshot({path:'wardrobe-desktop.png',fullPage:false});
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 await mobile.goto(base+'/shop.html',{waitUntil:'domcontentloaded',timeout:60000});
 await mobile.locator('.hx26-slot').first().waitFor({state:'visible',timeout:20000});
    console.log('Mobile wardrobe layout:',JSON.stringify(await mobile.evaluate(()=>{const rack=document.querySelector('.hx26-rack'),p=document.querySelector('.hx26-slot.is-selected'),items=document.querySelector('.hx26-items');return {width:innerWidth,rackWidth:rack?.clientWidth,scrollWidth:rack?.scrollWidth,scrollLeft:rack?.scrollLeft,selectedOffset:p?.offsetLeft,selectedRect:p?.getBoundingClientRect().toJSON(),rackRect:rack?.getBoundingClientRect().toJSON(),itemsRect:items?.getBoundingClientRect().toJSON()}})));
    await mobile.waitForFunction(()=>{
      const rack=document.querySelector('.hx26-rack'),picked=document.querySelector('.hx26-slot.is-selected');
      return rack&&picked&&Math.abs((picked.getBoundingClientRect().left+picked.getBoundingClientRect().width/2)-(rack.getBoundingClientRect().left+rack.getBoundingClientRect().width/2))<75;
    },null,{timeout:7500});
 assert.equal(await mobile.locator('.hx26-slot').count(),7);
 await mobile.screenshot({path:'wardrobe-mobile.png',fullPage:false});
 // Reproduce iPhone Safari bug reports: huge garment overlay, blocked modal scroll,
 // dock overlapping product card, and inability to scroll to collection.
 await mobile.locator('.hx26-slot.is-selected').click();
 await mobile.locator('.hx26-dialog').waitFor({state:'visible',timeout:7500});
 const layout=await mobile.evaluate(()=>{
   const photo=document.querySelector('.hx26-dialog-photo'),img=photo?.querySelector('img');
   const left=document.querySelector('.hx26-dialog-left');
   const right=document.querySelector('.hx26-dialog-right');
   const dialog=document.querySelector('.hx26-dialog');
   const rect=e=>e?.getBoundingClientRect().toJSON();
   return {photo:rect(photo),img:rect(img),left:rect(left),right:rect(right),
     imageOverflow:getComputedStyle(photo).overflow,
     imagePosition:getComputedStyle(img).position,
     modalOverflowY:getComputedStyle(dialog).overflowY,
     dialogHeight:dialog.clientHeight,dialogScrollHeight:dialog.scrollHeight};
 });
 console.log('IPHONE_MODAL_LAYOUT',JSON.stringify(layout));
 assert.equal(layout.modalOverflowY,'auto','Modal itself must scroll vertically');
 assert.match(layout.imageOverflow,/hidden|clip/,'Garment photo must be clipped');
 assert.equal(layout.imagePosition,'absolute','Garment should be positioned inside bounded photo');
 assert.ok(layout.img.height<=layout.photo.height+2,'Garment image too tall for photo container');
 assert.ok(layout.img.width<=layout.photo.width+2,'Garment image too wide for photo container');
 assert.ok(layout.left.bottom<=layout.right.top+3,'Picture must not overlap colour and size options');
 await mobile.screenshot({path:'wardrobe-dialog-mobile.png',fullPage:false});
 // The iPhone browser bars reduce the actually usable viewport height.
 await mobile.setViewportSize({width:390,height:610});
 const modalScroll=await mobile.locator('.hx26-dialog').evaluate(el=>{
   el.scrollTop=el.scrollHeight;
   return {scrollTop:el.scrollTop,max:el.scrollHeight-el.clientHeight};
 });
 console.log('IPHONE_MODAL_SCROLL',JSON.stringify(modalScroll));
 assert.ok(modalScroll.max>60&&modalScroll.scrollTop>60,
   'iPhone product modal must scroll to sizes and add-to-cart button');
 await mobile.locator('.hx26-x').click();
 const pageScroll=await mobile.evaluate(()=>{
   const dock=document.querySelector('.hn12-dock');
   const before=window.scrollY;
   window.scrollTo(0,Math.min(950,document.scrollingElement.scrollHeight));
   return {scrollY:window.scrollY,before,full:document.scrollingElement.scrollHeight,
     viewport:innerHeight,bodyOverflow:getComputedStyle(document.body).overflowY,
     dockPosition:getComputedStyle(dock).position};
 });
 console.log('IPHONE_PAGE_SCROLL',JSON.stringify(pageScroll));
 assert.ok(pageScroll.full>pageScroll.viewport+450,'Shop must contain content below rack');
 assert.ok(pageScroll.scrollY>150,'Vertical page scroll must be possible after closing the garment dialog');
 assert.notEqual(pageScroll.dockPosition,'fixed','Bottom navigation cannot cover shop card');
 await mobile.screenshot({path:'wardrobe-scrolled-mobile.png',fullPage:false});
 assert.equal(pageErrors.length,0,'Unexpected page errors: '+pageErrors.slice(0,3).join(' | '));
 console.log('PASS: Interactive wardrobe carousel, clothing images, preview front/back, size and cart; desktop & phone viewports.');
}finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
