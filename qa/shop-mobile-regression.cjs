'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({headless:true});
try{
for(const width of [390,1440]){
 const ctx=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,isMobile:width<600,hasTouch:width<600});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const response=await page.goto('https://horenova.com/shop.html?qa=mobile-'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForTimeout(1700);
 const data=await page.evaluate(()=>{
 const target=['html','body','main.shop17-page','#hx-showroom','.hx26-hero','.hx26-layout','.shop17-hero','.shop17-campaign','.shop17-filterbar','#products','.shop17-shophead','#shop17Grid','.shop17-grid','.shop17-editorial','.shop17-lookbook','.hn-shop-tech-pill','.hn-shop-exit'];
 const sel=s=>{const el=document.querySelector(s);if(!el)return null;const b=el.getBoundingClientRect(),css=getComputedStyle(el);return{count:document.querySelectorAll(s).length,box:{x:Math.round(b.x),y:Math.round(b.y),width:Math.round(b.width),height:Math.round(b.height)},scrollHeight:el.scrollHeight,display:css.display,visibility:css.visibility,opacity:css.opacity,position:css.position}};
 return{scrollHeight:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth,readyState:document.readyState,viewportWidth:innerWidth,shopProducts:document.querySelectorAll('#shop17Grid .shop17-product').length,scripts:[...document.scripts].map(s=>s.src?.split('/').pop()).filter(Boolean).slice(-12),regions:Object.fromEntries(target.map(k=>[k,sel(k)]))};
 });
 console.log('SHOP_DIAG '+JSON.stringify({width,status:response.status(),errors,data}));
 if(width===390){await page.screenshot({path:'shop-full-mobile.png',fullPage:true});}
 const home=await page.goto('https://horenova.com/?qa=home-'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});await page.waitForTimeout(600);
 const footer=await page.evaluate(()=>{const e=document.querySelector('.hn-home-footer');const h=document.querySelector('.hn-home-head');const r=e?.getBoundingClientRect();return{footer:r?.toJSON(),header:h?.getBoundingClientRect().toJSON(),footerLinks:e?.querySelectorAll('a').length,footerFont:e&&getComputedStyle(e).fontSize,links:e&&[...e.querySelectorAll('a')].slice(0,3).map(x=>({text:x.textContent,color:getComputedStyle(x).color,font:getComputedStyle(x).fontSize}))};});
 console.log('FOOTER_DIAG '+JSON.stringify({width,status:home.status(),footer}));
 await ctx.close();
}
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
