'use strict';
/* Chromium smoke test for PUBLIC local pages. This does not log into live accounts. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const MIME={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 let u;try{u=new URL(req.url,'http://localhost');}catch{res.writeHead(400);return res.end();}
 let relative;try{relative=decodeURIComponent(u.pathname);}catch{res.writeHead(400);return res.end();}
 let target=path.resolve(root,'.'+relative);
 if(!target.startsWith(root+path.sep)&&target!==root){res.writeHead(403);return res.end();}
 if(target===root)target=path.join(root,'index.html');
 fs.readFile(target,(err,data)=>{
  if(err){res.writeHead(404);res.end('Not found');return;}
  res.writeHead(200,{'Content-Type':MIME[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(data);
 });
});
async function run(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 const pages=['/','/jobs.html','/shifts.html','/talents.html','/shop.html','/explore.html','/explore-guide.html','/explore-safety.html','/explore-prices.html','/explore-itinerary.html','/explore-experiences.html','/explore-help.html','/academy.html','/job.html','/trip.html','/favorites.html','/avis.html','/enter.html'];
 const failures=[];
 try{
  for(const url of pages){
   const context=await browser.newContext({serviceWorkers:'block'});
   const page=await context.newPage();
   const issues=[];
   page.on('pageerror',e=>issues.push('pageerror: '+e.message));
   page.on('console',msg=>{if(msg.type()==='error')issues.push('console: '+msg.text().slice(0,200));});
   try{
    const response=await page.goto(base+url,{waitUntil:'domcontentloaded',timeout:20000});
    assert.equal(response.status(),200,'Page HTTP status');
    const control=page.locator('#hn-language-control');
    await control.waitFor({state:'attached',timeout:4500});
    assert.equal(await page.locator('html').getAttribute('lang'),'fr');
    const french=await page.locator('body').innerText();
    await control.selectOption('ar',{force:true});
    await page.waitForFunction(()=>document.documentElement.lang==='ar'&&document.documentElement.dir==='rtl',null,{timeout:6000});
    const arabic=await page.locator('body').innerText();
    assert.notEqual(arabic,french,'Arabic selection changed no displayed text');
    await control.selectOption('en',{force:true});
    await page.waitForFunction(()=>document.documentElement.lang==='en'&&document.documentElement.dir==='ltr',null,{timeout:6000});
    const english=await page.locator('body').innerText();
    assert.notEqual(english,arabic,'English selection changed no displayed text');
    await control.selectOption('fr',{force:true});
    await page.waitForFunction(()=>document.documentElement.lang==='fr'&&document.documentElement.dir==='ltr',{timeout:6000});
    console.log('PASS browser locale FR → AR → EN → FR: '+url);
   }catch(error){
    const where=page.url();
    const pageText=await page.locator('body').innerText({timeout:2000}).catch(()=>'<body unavailable>');
    failures.push(url+': '+error.message.slice(0,500)+' URL='+where+' BODY='+pageText.slice(0,260)+' ERRORS='+issues.slice(0,5).join(' | '));
    console.error('FAIL browser locale: '+url+' — '+error.message.slice(0,180)+' URL='+where+' BODY='+pageText.slice(0,260)+' ERRORS='+issues.slice(0,5).join(' | '));
   }finally{await context.close();}
  }
  // End-to-end showroom: rack → garment front/back → colour and size →
  // persistent selection → quote download, on desktop and phone. Never fake prices.
  for(const width of [1440,390]){
   const context=await browser.newContext({viewport:{width,height:900},isMobile:width<600,hasTouch:width<600,serviceWorkers:'block',acceptDownloads:true});
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.goto(base+'/shop.html',{waitUntil:'domcontentloaded',timeout:20000});
    await page.locator('#hx-showroom .hx-hanger').first().waitFor({timeout:7000});
    assert.equal(await page.locator('#hx-showroom .hx-hanger').count(),7,'Exactly 7 showcase garments');
    await page.evaluate(()=>{document.getElementById('hn-fullscreen-entry')?.remove()});
    await page.locator('[data-hx-product="chef-jacket"]').click({force:true});
    await page.locator('#hx-dialog .hx-options').waitFor({timeout:5000});
    assert.equal(await page.locator('#hx-dialog .hx-cta[data-hx-add]').isDisabled(),true,'Must choose a size');
    await page.locator('[data-hx-side="back"]').click();
    assert.equal(await page.locator('[data-hx-side="back"]').getAttribute('aria-pressed'),'true');
    await page.locator('[data-hx-color="1"]').click();
    assert.equal(await page.locator('[data-hx-color="1"]').getAttribute('aria-pressed'),'true');
    await page.locator('[data-hx-size="2"]').click();
    await page.locator('[data-hx-qty="1"]').click();
    await page.locator('#hx-dialog .hx-cta[data-hx-add]').click();
    assert.equal(await page.locator('#hx-dialog .hx-cart-line').count(),1,'Chosen variant did not enter selection');
    assert.match(await page.locator('#hx-dialog .hx-cart-line').innerText(),/Noir/);
    assert.match(await page.locator('#hx-dialog .hx-cart-line').innerText(),/× 2/);
    assert.ok(!(await page.locator('#hx-dialog').innerText()).includes('COMPLÉTER LE PAIEMENT'),'Do not fabricate checkout');
    const downloadWait=page.waitForEvent('download');
    await page.locator('[data-hx-export]').click();
    const download=await downloadWait;
    assert.match(download.suggestedFilename(),/horenova-uniformes-demande\.txt/);
    await page.locator('[data-hx-close]').last().click({force:true});
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#hx-showroom').waitFor();
    assert.equal(await page.locator('[data-hx-count]').first().innerText(),'2','Selection must survive refresh');
    assert.equal(errors.length,0,'Shop JS exceptions: '+errors.join(' / '));
    console.log('PASS hospitality showroom '+width+'px: seven vectors, front/back, colours, sizes, quantity, cart, export, persistence');
   }catch(e){
    failures.push('Showroom '+width+': '+e.message.slice(0,500)+' JS='+errors.join(' / '));
    console.error('FAIL showroom '+width+': '+e.message.slice(0,420)+' JS='+errors.join(' / '));
   }finally{await context.close();}
  }
  // Illustrative service cards must stay separate from authentic review statistics.
  {
   const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
   const page=await context.newPage();
   const problems=[];
   page.on('pageerror',e=>problems.push(e.message));
   try{
    await page.route('https://horenova-hub-api.onrender.com/api/reviews/public',r=>r.fulfill({
     status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},
     body:JSON.stringify({count:0,average:null,items:[]})
    }));
    await page.goto(base+'/avis.html',{waitUntil:'domcontentloaded',timeout:20000});
    await page.locator('.rv-x-card').first().waitFor({timeout:6000});
    assert.equal(await page.locator('.rv-x-card').count(),32,'All sample cards must be visible initially');
    assert.equal(await page.locator('.rv-x-demo').count(),32,'Every sample needs disclosure');
    const publicCount=await page.locator('#reviewSummary').innerText();
    assert.match(publicCount,/0 avis publié/,'Sample cards must not affect authentic review count');
    await page.locator('#experienceMore').click();
    assert.equal(await page.locator('.rv-x-card').count(),12,'Collapse sample gallery');
    await page.locator('#experienceMore').click();
    assert.equal(await page.locator('.rv-x-card').count(),32,'Expand all 32 sample scenarios');
    await page.locator('[data-example-filter="recruiter"]').click();
    assert.equal(await page.locator('.rv-x-card').count(),8,'Recruiter filter');
    await page.locator('[data-example-filter="academy"]').click();
    assert.equal(await page.locator('.rv-x-card').count(),6,'Academy filter');
    await page.locator('[data-example-filter="all"]').click();
    await page.locator('#hn-language-control').selectOption('ar',{force:true});
    await page.waitForFunction(()=>document.documentElement.lang==='ar',null,{timeout:5000});
    assert.match(await page.locator('#experienceEyebrow').innerText(),/أمثلة/);
    assert.match(await page.locator('.rv-x-demo').first().innerText(),/توضيحي/);
    await page.locator('#hn-language-control').selectOption('en',{force:true});
    await page.waitForFunction(()=>document.documentElement.lang==='en',null,{timeout:5000});
    assert.match(await page.locator('.rv-x-demo').first().innerText(),/illustrative/i);
    assert.equal(problems.length,0,'Unexpected JS errors: '+problems.join(' | '));
    console.log('PASS gallery: 32 illustrative examples, filters, FR/AR/EN, zero effect on authentic reviews');
   }catch(e){
    failures.push('Illustrative gallery: '+e.message.slice(0,550)+' JS='+problems.join(' | '));
    console.error('FAIL gallery: '+e.message.slice(0,380)+' JS='+problems.join(' | '));
   }finally{await context.close();}
  }
  // Real phone-width layout checks: the wordmark must never be covered by signup.
  for(const width of [320,375,390,430,700,768]){
   const context=await browser.newContext({viewport:{width,height:844},isMobile:width<=700,hasTouch:width<=700,serviceWorkers:'block'});
   const page=await context.newPage();
   try{
    await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:20000});
    await page.locator('#hn-language-control').waitFor({state:'attached',timeout:6000});
    const layout=await page.evaluate(()=>{
      const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
      return{brand:box('.hn-home-brand'),brandText:box('.hn-home-brand strong'),cta:box('.hn-home-actions a.primary'),language:box('#hn-language-control'),scrollWidth:document.documentElement.scrollWidth,innerWidth:innerWidth};
    });
    const nonOverlapping=(a,b)=>a.right<=b.x+1||b.right<=a.x+1||a.bottom<=b.y+1||b.bottom<=a.y+1;
    assert.ok(nonOverlapping(layout.brandText,layout.cta),'Signup overlaps wordmark at '+width+': '+JSON.stringify(layout));
    assert.ok(nonOverlapping(layout.brandText,layout.language),'Language overlaps wordmark at '+width+': '+JSON.stringify(layout));
    assert.ok(layout.brand.width>=110,'Brand squeezed at '+width+': '+JSON.stringify(layout));
    if(width<=700)assert.ok(layout.cta.y>=layout.brand.bottom-1,'CTA must have separate mobile row at '+width);
    assert.ok(layout.scrollWidth<=layout.innerWidth+2,'Page overflow at '+width+': '+JSON.stringify(layout));
    const media=await page.locator('.hn-intro-film video, .hn-cinema-strip video, .hn-academy-film video').evaluateAll(vs=>vs.map(v=>({controls:v.controls,muted:v.muted,loop:v.loop,inline:v.playsInline,autoplay:v.autoplay})));
    assert.ok(media.length>=4,'Expected cinematic video surfaces');
    assert.ok(media.every(v=>!v.controls && !v.autoplay && v.muted && v.loop && v.inline),'Decorative media must not use native player UI: '+JSON.stringify(media));
    console.log('PASS HORENOVA phone header/CTA separation and background video attributes: '+width);
   }catch(e){failures.push('Home mobile '+width+': '+e.message.slice(0,650));console.error('FAIL HORENOVA mobile '+width+': '+e.message.slice(0,420));}
   finally{await context.close();}
  }
  // Simulated playable media verifies the crossfade controller waits for PLAYING.
  {
   const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   await context.addInitScript(()=>{
    const proto=HTMLMediaElement.prototype;
    Object.defineProperty(proto,'paused',{configurable:true,get(){return this.__mockPaused!==false}});
    Object.defineProperty(proto,'readyState',{configurable:true,get(){return 4}});
    proto.load=function(){};
    proto.play=function(){this.__mockPaused=false;return Promise.resolve()};
    proto.pause=function(){this.__mockPaused=true};
   });
   const page=await context.newPage();
   try{
    await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:20000});
    await page.waitForFunction(()=>document.querySelector('.hn-film-clip')?.classList.contains('is-playing'),null,{timeout:6000});
    assert.ok(await page.locator('.hn-film-clip').first().evaluate(v=>!v.paused));
    await page.waitForFunction(()=>document.querySelectorAll('.hn-film-clip')[1]?.classList.contains('is-active'),null,{timeout:11500});
    assert.ok(await page.locator('.hn-film-clip').nth(1).evaluate(v=>!v.paused));
    console.log('PASS cinematic crossfade after second clip begins playing');
   }catch(e){failures.push('Cinematic loop: '+e.message.slice(0,600));console.error('FAIL cinematic loop: '+e.message.slice(0,350));}
   finally{await context.close();}
  }
  // Reproduce iOS Low Power Mode: browser refuses every programmatic video play.
  // Animated backdrops must remain available, without native autoplay overlays.
  for(const url of ['/','/academy.html','/shop.html','/explore.html','/shifts.html']){
   const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   await context.addInitScript(()=>{
    HTMLMediaElement.prototype.play=function(){
     return Promise.reject(new DOMException('Simulated energy saving restriction','NotAllowedError'));
    };
   });
   const page=await context.newPage();
   const problems=[];page.on('pageerror',e=>problems.push(e.message));
   try{
    await page.goto(base+url,{waitUntil:'domcontentloaded',timeout:20000});
    const decorative=await page.locator('video[muted][loop]').evaluateAll(vs=>vs.map(v=>({
     autoplay:v.autoplay,controls:v.controls
    })));
    assert.ok(decorative.length>0,'No decorative video on '+url);
    assert.ok(decorative.every(v=>!v.autoplay&&!v.controls),'Safari low-power native overlay may appear: '+JSON.stringify(decorative));
    if(url==='/'){
     await page.locator('.hn-intro-film').waitFor({state:'attached'});
     const fallback=await page.locator('.hn-intro-film').evaluate(el=>getComputedStyle(el,'::before').animationName);
     assert.notEqual(fallback,'none','Homepage must show animated poster');
    }else if(url==='/shifts.html'){
     await page.locator('video.hn-ambient-managed').waitFor({state:'attached',timeout:6000});
     await page.locator('.hn-ambient-cover').first().waitFor({state:'attached',timeout:6000});
    }else{
     await page.locator('.hn-entry__video').waitFor({state:'attached'});
     const fallback=await page.locator('.hn-entry').evaluate(el=>getComputedStyle(el,'::before').animationName);
     assert.notEqual(fallback,'none','Intro poster should move even when video playback is denied');
    }
    assert.equal(problems.length,0,'Uncaught errors: '+problems.join(' / '));
    console.log('PASS simulated Safari Low Power Mode: no native player, animated fallback '+url);
   }catch(e){
    failures.push('Low Power Mode '+url+': '+e.message.slice(0,550));
    console.error('FAIL simulated Low Power Mode '+url+': '+e.message.slice(0,350));
   }finally{await context.close();}
  }
  // iPhone Safari branch: video under full-HD still until playback starts.
  // No CPU-heavy animated GIF/WebP on devices in Low Power Mode.
  {
   const context=await browser.newContext({
    viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,
    serviceWorkers:'block',
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
   });
   // Emulate Safari Low Power Mode blocking native video autoplay.
   await context.addInitScript(()=>{
    HTMLMediaElement.prototype.play=function(){
     return Promise.reject(new DOMException('Autoplay blocked by power saving','NotAllowedError'));
    };
   });
   const page=await context.newPage();
   try{
    await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:20000});
    await page.waitForFunction(()=>document.querySelector('.hn-intro')?.classList.contains('open'),null,{timeout:6000});
    await page.waitForFunction(()=>document.querySelector('.hn-intro-film.hn-ios-loop-active')&&document.querySelectorAll('.hn-intro-film video').length===1,null,{timeout:6000});
    await page.locator('.hn-ios-enable-hd').waitFor({state:'visible',timeout:5500});
    const image=page.locator('.hn-ios-motion');
    await image.waitFor({state:'attached',timeout:5000});
    await page.waitForFunction(()=>document.querySelector('.hn-ios-motion')?.complete,null,{timeout:9000});
    const state=await page.evaluate(()=>{
      const title=document.querySelector('.hn-intro-inner h1');
      const range=document.createRange();range.selectNodeContents(title);
      const text=range.getBoundingClientRect();
      const p=document.querySelector('.hn-intro-inner p').getBoundingClientRect();
      const pic=document.querySelector('.hn-ios-motion');
      const viewport=visualViewport?.width||innerWidth;
      return {
       videoCount:document.querySelectorAll('.hn-intro-film video').length,
       imageLoaded:pic.naturalWidth>0, imageWidth:pic.naturalWidth,
       imageVisible:getComputedStyle(pic).display!=='none',imageFit:getComputedStyle(pic).objectFit,
       imageSrc:pic.currentSrc, imageBox:pic.getBoundingClientRect().toJSON(),
       viewport,textLeft:text.left,textRight:text.right,pLeft:p.left,pRight:p.right,
       horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2
      };
    });
    assert.equal(state.videoCount,1,'A muted HD MP4 must remain behind the poster to allow tap-unlock');
    assert.ok(state.imageLoaded&&state.imageWidth>=1080,'1080p JPEG fallback missing: '+JSON.stringify(state));
    assert.ok(state.imageSrc.includes('/assets/horenova-mobile-tourism-poster.jpg'),'Still decoding a heavy animated WebP on iPhone: '+JSON.stringify(state));
    assert.ok(state.imageVisible&&state.imageFit==='cover','HD image not visible or not cover: '+JSON.stringify(state));
    assert.ok(state.imageBox.width>=state.viewport-2,'HD image not filling phone viewport: '+JSON.stringify(state));
    assert.ok(state.textLeft>=-2&&state.textRight<=state.viewport+2,'Intro wordmark cropped: '+JSON.stringify(state));
    assert.ok(state.pLeft>=-2&&state.pRight<=state.viewport+2,'Subtitle cropped: '+JSON.stringify(state));
    assert.equal(state.horizontalOverflow,false,'Horizontal scrolling on iPhone intro: '+JSON.stringify(state));
    await page.locator('.hn-intro-inner>button').first().click();
    await page.waitForFunction(()=>document.querySelector('.hn-intro')?.classList.contains('gone'),null,{timeout:3000});
    console.log('PASS simulated iPhone Low Power: crisp 1080p poster, no heavy animated image, discreet HD activation, readable title and Enter action');
   }catch(e){
    failures.push('Safari low power and title: '+e.message.slice(0,550));
    console.error('FAIL Safari low-power fallback '+e.message.slice(0,550));
   }finally{await context.close();}
  }
  // On an iPhone where muted autoplay is granted, promote a hidden H.264
  // video only after actual playback begins, never expose native play controls.
  {
   const context=await browser.newContext({
    viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block',
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
   });
   await context.addInitScript(()=>{
    const proto=HTMLMediaElement.prototype;
    Object.defineProperty(proto,'paused',{configurable:true,get(){return this.__fakePaused!==false}});
    Object.defineProperty(proto,'readyState',{configurable:true,get(){return 4}});
    proto.play=function(){
     this.__fakePaused=false;
     this.dispatchEvent(new Event('playing'));
     return Promise.resolve();
    };
    proto.pause=function(){this.__fakePaused=true;this.dispatchEvent(new Event('pause'))};
   });
   const page=await context.newPage();
   try{
    await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:20000});
    await page.locator('.hn-ios-native-hq.is-playing-hq').waitFor({timeout:7500});
    const state=await page.evaluate(()=>{
     const video=document.querySelector('.hn-ios-native-hq');
     const film=document.querySelector('.hn-intro-film');
     return{
      src:video.currentSrc,controls:video.controls,loop:video.loop,muted:video.muted,
      opacity:getComputedStyle(video).opacity,playing:film.classList.contains('hn-ios-native-playing'),
      originalClips:film.querySelectorAll('.hn-film-clip').length
     };
    });
    assert.ok(state.src.includes('horenova-mobile-cinema-1080p30.mp4'),'Old or wrong source: '+JSON.stringify(state));
    assert.equal(state.controls,false);
    assert.equal(state.muted,true);
    assert.equal(state.loop,true);
    assert.equal(state.originalClips,0);
    assert.equal(state.playing,true);
    console.log('PASS iPhone Safari autoplay granted: real-time 1080p 30fps H264 MP4 promoted with no native controls');
   }catch(e){
    failures.push('Safari HD native playback: '+e.message.slice(0,550));
    console.error('FAIL Safari HD native playback: '+e.message.slice(0,450));
   }finally{await context.close();}
  }
  // Safari Low Power Mode recovery: one user tap unlocks native HD playback.
  {
   const context=await browser.newContext({
    viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block',
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
   });
   await context.addInitScript(()=>{
    const proto=HTMLMediaElement.prototype;
    Object.defineProperty(proto,'paused',{configurable:true,get(){return this.__qaPaused!==false}});
    Object.defineProperty(proto,'readyState',{configurable:true,get(){return 4}});
    proto.play=function(){
      if(!this.__qaAllowed)return Promise.reject(new DOMException('Battery saver autoplay denied','NotAllowedError'));
      this.__qaPaused=false;
      this.dispatchEvent(new Event('playing'));
      return Promise.resolve();
    };
    proto.pause=function(){this.__qaPaused=true;this.dispatchEvent(new Event('pause'))};
   });
   const page=await context.newPage();
   try{
    await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:20000});
    await page.locator('.hn-ios-enable-hd').waitFor({state:'visible',timeout:7000});
    await page.evaluate(()=>{document.querySelector('.hn-ios-native-premium').__qaAllowed=true;});
    // The button removes itself as soon as HD playback starts. Dispatch its
    // click directly to avoid Playwright retrying an already-detached element.
    await page.locator('.hn-ios-enable-hd').evaluate(el=>el.click());
    await page.locator('.hn-ios-native-premium.is-playing-hq').waitFor({timeout:5000});
    assert.equal(await page.locator('.hn-ios-enable-hd').count(),0,'HD unlock button must disappear when movie plays');
    console.log('PASS Safari battery saver: user tap unlocks HD H264 and removes activation control');
   }catch(e){
    failures.push('Safari HD unlock: '+e.message.slice(0,520));
    console.error('FAIL Safari HD unlock: '+e.message.slice(0,430));
   }finally{await context.close();}
  }
  // Real Chromium navigation for the two account screens. No test accounts are created.
  for(const startingMode of ['signin','signup']){
   const context=await browser.newContext({serviceWorkers:'block'});
   const page=await context.newPage();
   const authErrors=[];
   page.on('pageerror',e=>authErrors.push('JS '+e.message));
   page.on('console',m=>{if(m.type()==='error')authErrors.push('Console '+m.text().slice(0,200));});
   try{
    await page.goto(base+'/enter.html?mode='+startingMode,{waitUntil:'domcontentloaded',timeout:20000});
    await page.locator('html[data-auth-ui-ready="1"]').waitFor({timeout:8000});
    assert.equal(await page.locator('#signupForm').isVisible(),startingMode==='signup');
    for(const mode of ['signup','signin','signup']){
     await page.locator('[data-auth-tab="'+mode+'"]').click();
     assert.equal(await page.locator('#signupForm').isVisible(),mode==='signup');
     assert.equal(await page.locator('#signinForm').isVisible(),mode==='signin');
     assert.equal(new URL(page.url()).searchParams.get('mode'),mode);
    }
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('html[data-auth-ui-ready="1"]').waitFor({timeout:8000});
    assert.equal(await page.locator('#signupForm').isVisible(),true,'Signup tab lost after reload');
    console.log('PASS browser registration/sign-in switching and refresh: '+startingMode);
   }catch(e){
    const details=' URL='+page.url()+' ERRORS='+authErrors.slice(0,5).join(' / ');
    failures.push('Account navigation '+startingMode+': '+e.message.slice(0,250)+details);
    console.error('FAIL browser account navigation '+startingMode+': '+e.message.slice(0,220)+details);
   }finally{await context.close();}
  }
  for(const url of ['/jobs.html','/shifts.html','/explore-guide.html']){
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
   const page=await context.newPage();
   try{
    await page.goto(base+url,{waitUntil:'domcontentloaded',timeout:20000});
    const menu=page.locator('#menuBtn');
    const panel=page.locator('#mobileMenu');
    await menu.waitFor({state:'visible',timeout:6000});
    await menu.click();
    assert.equal(await menu.getAttribute('aria-expanded'),'true');
    assert.equal(await panel.getAttribute('hidden'),null);
    await page.keyboard.press('Escape');
    assert.equal(await menu.getAttribute('aria-expanded'),'false');
    assert.notEqual(await panel.getAttribute('hidden'),null);
    const control=page.locator('#hn-language-control');
    await control.selectOption('ar',{force:true});
    await page.waitForFunction(()=>document.documentElement.dir==='rtl',null,{timeout:6000});
    console.log('PASS mobile menu, Escape and Arabic RTL: '+url);
   }catch(error){failures.push('Mobile '+url+': '+error.message.slice(0,500));console.error('FAIL mobile: '+url+' — '+error.message.slice(0,350));}
   finally{await context.close();}
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
 if(failures.length){console.error('Failures: '+failures.join('\n'));process.exitCode=1;}
 else console.log('PASS: '+pages.length+' public pages exercised in real Chromium, across three languages.');
}
run().catch(e=>{console.error(e);process.exitCode=1;server.close();});
