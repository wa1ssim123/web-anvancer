'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const base=path.resolve(__dirname,'..');
const offerId='11111111-1111-4111-8111-111111111111';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGPgUbIAAACkAGeY0OCYAAAAAElFTkSuQmCC','base64');
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://127.0.0.1').pathname;
 if(pathname==='/test-social'){
  res.writeHead(200,{'Content-Type':'text/html'});
  return res.end('<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/social-publications-admin.css"><link rel="stylesheet" href="/horenova-adaptive-v1.css"><link rel="stylesheet" href="/horenova-admin-cases-v2.css"><link rel="stylesheet" href="/admin-social-mobile-fix.css"></head><body data-hn12="admin"><main id="adminGate"><section class="hub-panel" id="root"></section></main></body></html>');
 }
 const file=path.resolve(base,pathname.slice(1));
 if(!file.startsWith(base+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end('not found')}
 const ext=path.extname(file),type=ext==='.js'?'application/javascript':ext==='.css'?'text/css':'text/plain';
 res.writeHead(200,{'Content-Type':type});res.end(fs.readFileSync(file));
});
const contrast=(a,b)=>{
 const linear=c=>{c=c/255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4)};
 const rgb=s=>{const nums=s.match(/[\d.]+/g)||[];return nums.slice(0,3).map(Number)};
 const lum=s=>{const c=rgb(s).map(linear);return c[0]*.2126+c[1]*.7152+c[2]*.0722};
 const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
};
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [320,390,1280]){
   const context=await browser.newContext({viewport:{width,height:840},serviceWorkers:'block'});
   await context.route('**/hn-api.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'export async function hub(){throw Error("A mock API is required")};'}));
   await context.route('https://static.wixstatic.com/media/**',route=>route.fulfill({
    status:200,body:png,contentType:'image/png',
    headers:{'access-control-allow-origin':'*','cache-control':'max-age=300'}
   }));
   await context.route('https://whatsapp.com/channel/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<h1>WhatsApp Channel route reached</h1>'}));
   await context.route('https://t.me/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<h1>Telegram Channel route reached</h1>'}));
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/test-social');
   await page.evaluate(async(id)=>{
    const {mountSocialPublications}=await import('/social-publications-admin.js');
    const record={requestId:id,channel:'telegram',status:'pending',title:'Serveur',
     city:'Casablanca',kind:'job',jobStatus:'VALIDEE',removed:false,attempts:0,sentAt:null,lastError:null,
     publicUrl:'https://horenova.com/job.html?id='+id,message:'🏢 Restaurant test\nhttps://horenova.com/job.html?id='+id};
    const whatsapp={...record,channel:'whatsapp',status:'manual'};
    window.__shares=[];window.__lastCopied=null;window.__copiedImages=[];
    Object.defineProperty(navigator,'share',{configurable:true,value:async a=>{
     window.__shares.push({name:a.files?.[0]?.name,blobType:a.files?.[0]?.type,text:a.text,url:a.url,posterUrl:a.url});
    }});
    Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
     writeText:async x=>{window.__lastCopied=x},
     write:async items=>{
      const blob=await items[0].getType('image/png');
      const bmp=await createImageBitmap(blob);
      window.__copiedImages.push({size:blob.size,width:bmp.width,height:bmp.height});
      bmp.close();
     }
    }});
    mountSocialPublications(document.querySelector('#root'),async url=>{
     if(url==='/api/community/publications')return {
      configured:false,telegramChannel:'https://t.me/HORENOVA_Emploi_Maroc',
      whatsappChannel:'https://whatsapp.com/channel/0029Vb9VLZ5A2pLGFYQA6s2u',rows:[record,whatsapp]
     };
     throw Error('Unexpected mock route '+url);
    });
   },offerId);
   await page.locator('.hspa-post').waitFor({state:'visible'});
   await page.waitForFunction(()=>Number(document.querySelector('#hnAdminSocialPublications')?.dataset.posterReadyCount)>=5);
   assert.equal(await page.locator('.hspa-post').count(),1);
   assert.equal(await page.locator('.hspa-connection').count(),2);
   assert.equal(await page.locator('.hspa-channel-actions').isVisible(),true);
   assert.equal(await page.getByRole('link',{name:/Ouvrir le canal WhatsApp/}).getAttribute('href'),'https://whatsapp.com/channel/0029Vb9VLZ5A2pLGFYQA6s2u');
   assert.equal(await page.getByRole('link',{name:/Ouvrir le canal Telegram/}).getAttribute('href'),'https://t.me/HORENOVA_Emploi_Maroc');
   assert.equal(await page.locator('.hspa-whatsapp').getAttribute('target'),'_blank');
   assert.equal(await page.locator('.hspa-telegram').getAttribute('target'),'_blank');
   assert.equal(await page.getByRole('button',{name:'Copier le lien Telegram'}).count(),1);
   const colors=await page.evaluate(()=>{
    const get=sel=>document.querySelector(sel);
    return {
     background:getComputedStyle(get('#hnAdminSocialPublications')).backgroundColor,
     heading:getComputedStyle(get('.hspa-heading h2')).color,
     description:getComputedStyle(get('.hspa-heading p')).color,
     label:getComputedStyle(get('.hspa-connection b')).color,
     connection:getComputedStyle(get('.hspa-connection')).backgroundColor,
     footer:getComputedStyle(get('#hspaInfo')).color
    }
   });
   assert.ok(contrast(colors.heading,colors.background)>=7,'Unreadable heading '+JSON.stringify(colors));
   assert.ok(contrast(colors.description,colors.background)>=4.5,'Unreadable subheading '+JSON.stringify(colors));
   assert.ok(contrast(colors.label,colors.connection)>=4.5,'Unreadable channel status '+JSON.stringify(colors));
   assert.ok(contrast(colors.footer,colors.background)>=4.5,'Unreadable footer '+JSON.stringify(colors));
   await page.getByRole('button',{name:'Copier affiche complète Telegram'}).click();
   await page.waitForFunction(()=>window.__copiedImages?.length>=1);
   const firstImage=await page.locator('.hspa-promo-img').getAttribute('src');
   const firstCopy=await page.evaluate(()=>window.__copiedImages[0]);
   assert.ok(firstCopy.size>2000,'Complete picture must be a real composed PNG, not a 1x1 original');
   assert.equal(firstCopy.width,1080,'Full job details must be baked into a readable image');
   assert.ok(firstCopy.height>1000,'Picture must include a distinct job caption and full link footer');
   assert.match(await page.locator('.hspa-local-feedback').innerText(),/Affiche copiée/);
   await page.getByRole('button',{name:'Copier affiche complète WhatsApp'}).click();
   await page.waitForFunction(()=>window.__copiedImages?.length>=2);
   const secondImage=await page.locator('.hspa-promo-img').getAttribute('src');
   assert.notEqual(firstImage,secondImage,'Every copy rotates to a different original HORENOVA poster');
   assert.match(await page.locator('.hspa-promo-text').inputValue(),new RegExp(offerId));
   await page.getByRole('button',{name:'Copier message et lien'}).click();
   await page.waitForFunction(()=>window.__lastCopied?.includes('horenova.com/job.html'));
   assert.match(await page.evaluate(()=>window.__lastCopied),/Restaurant test/);
   assert.match(await page.evaluate(()=>window.__lastCopied),new RegExp(offerId));
   await page.waitForFunction(()=>document.querySelector('.hspa-promo-share')?.dataset.posterReady==='file');
   await page.getByRole('button',{name:'Partager photo + message + lien'}).click();
   await page.waitForFunction(()=>window.__shares.length>=1);
   const shared=await page.evaluate(()=>window.__shares[0]);
   assert.equal(shared.blobType,'image/png');
   assert.match(shared.text,/Restaurant test/);
   assert.match(shared.text,new RegExp(offerId));
   assert.equal(shared.url,'https://horenova.com/job.html?id='+offerId,'Native share includes clickable job URL where the target supports it');
   await page.getByRole('button',{name:'Copier le lien Telegram'}).click();
   assert.equal(await page.evaluate(()=>window.__lastCopied),'https://t.me/HORENOVA_Emploi_Maroc');
   await page.getByRole('button',{name:'Copier le lien WhatsApp'}).click();
   assert.equal(await page.evaluate(()=>window.__lastCopied),'https://whatsapp.com/channel/0029Vb9VLZ5A2pLGFYQA6s2u');
   for(const [sel,expected] of [['.hspa-whatsapp','https://whatsapp.com/channel/0029Vb9VLZ5A2pLGFYQA6s2u'],['.hspa-telegram','https://t.me/HORENOVA_Emploi_Maroc']]){
    const [popup]=await Promise.all([page.waitForEvent('popup'),page.locator(sel).click()]);
    await popup.waitForLoadState('domcontentloaded');
    assert.equal(popup.url(),expected,'Actual external channel must open after user tap');
    await popup.close();
   }
   // Clipboard image unsupported: retain a clickable job URL via plain-text fallback.
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__lastCopied=value}}}));
   await page.getByRole('button',{name:'Copier affiche complète WhatsApp'}).click();
   assert.match(await page.evaluate(()=>window.__lastCopied),new RegExp(offerId));
   const size=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
   assert.ok(size.scroll<=size.width+4,'Horizontal overflow '+JSON.stringify(size));
   await page.evaluate(()=>{document.documentElement.lang='ar';document.documentElement.dir='rtl'});
   await page.waitForFunction(()=>document.querySelector('#hspaTitle')?.textContent.includes('كل عرض'));
   assert.equal(await page.getByRole('button',{name:'نسخ الرسالة ورابط الترشح'}).count(),0,'Caption button is visible only after selecting a poster');
   assert.deepEqual(errors,[],'Uncaught browser errors '+JSON.stringify(errors));
   console.log('PASS HORENOVA social '+width+'px: legible contrast, clickable channel links, copy PNG containing poster + title + city + URL, random images, Share file+text+URL and clickable-text fallback');
   await context.close();
  }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error('FAIL HORENOVA social iPhone regression '+e.stack);process.exitCode=1});
