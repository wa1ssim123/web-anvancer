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
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [320,390,1280]){
   const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'});
   await context.route('**/hn-api.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'export async function hub(){throw Error("Expected mocked request")};'}));
   await context.route('https://static.wixstatic.com/media/**',route=>route.fulfill({
    status:200,body:png,contentType:'image/png',
    headers:{'access-control-allow-origin':'*','cache-control':'max-age=300'}
   }));
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/test-social');
   await page.evaluate(async(id)=>{
    const {mountSocialPublications}=await import('/social-publications-admin.js');
    const record={requestId:id,channel:'telegram',status:'pending',title:'Serveur',
     city:'Casablanca',kind:'job',jobStatus:'VALIDEE',removed:false,attempts:0,sentAt:null,lastError:null,
     publicUrl:'https://horenova.com/job.html?id='+id,message:'🏢 Restaurant test\nhttps://horenova.com/job.html?id='+id};
    const whatsapp={...record,channel:'whatsapp',status:'manual'};
    window.__lastCopied=null;window.__copiedImages=[];
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
     writeText:async x=>{window.__lastCopied=x},
     write:async items=>{
      const item=items[0];window.__imageTypes=item.types;
      const blob=await item.getType('image/png');
      const image=await createImageBitmap(blob);
      window.__copiedImages.push({type:blob.type,size:blob.size,width:image.width,height:image.height});
      image.close();
     }
    }});
    mountSocialPublications(document.querySelector('#root'),async url=>{
     if(url==='/api/community/publications')return {
      configured:false,telegramChannel:'https://t.me/HORENOVA_Emploi_Maroc',
      whatsappChannel:'https://whatsapp.com/channel/0029Vb9VLZ5A2pLGFYQA6s2u',rows:[record,whatsapp]
     };
     throw Error('Unexpected route '+url);
    });
   },offerId);
   await page.locator('.hspa-post').waitFor({state:'visible'});
   const card=page.locator('.hspa-post');
   assert.equal(await card.locator('.hspa-post-actions a').count(),1);
   assert.equal(await card.locator('.hspa-post-actions button').count(),2);
   assert.equal(await card.locator('.hspa-channel-actions').count(),0,'No WhatsApp/Telegram channel controls');
   assert.equal(await card.locator('.hspa-channel-options').count(),0,'No secondary actions panel');
   assert.equal(await card.getByRole('button',{name:'Copier message + lien'}).count(),1);
   assert.equal(await card.getByRole('button',{name:'Copier photo aléatoire'}).count(),1);
   assert.equal(await card.getByRole('link',{name:/Voir l’annonce/}).getAttribute('href'),'https://horenova.com/job.html?id='+offerId);
   await card.getByRole('button',{name:'Copier message + lien'}).click();
   await page.waitForFunction(()=>window.__lastCopied?.includes('horenova.com/job.html'));
   const firstText=await page.evaluate(()=>window.__lastCopied);
   assert.match(firstText,/Serveur/);assert.match(firstText,/Restaurant test/);
   assert.match(firstText,/Casablanca/);assert.match(firstText,new RegExp(offerId));
   assert.equal(await card.locator('.hspa-photo-preview').count(),0,'Text copy must not select an image');
   assert.match(await card.locator('.hspa-local-feedback').innerText(),/Message complet et lien/);
   await card.getByRole('button',{name:'Copier photo aléatoire'}).click();
   await page.waitForFunction(()=>window.__copiedImages.length>=1);
   const firstImage=await card.locator('.hspa-photo-preview img').getAttribute('src');
   assert.match(firstImage,/^https:\/\/static\.wixstatic\.com\/media\/d0158d_/);
   assert.deepEqual(await page.evaluate(()=>window.__imageTypes),['image/png'],'Photo button must write only image/png, not text');
   assert.equal(await page.evaluate(()=>window.__lastCopied),firstText,'Photo copying does not mix in or replace text with caption');
   assert.equal((await page.evaluate(()=>window.__copiedImages[0])).type,'image/png');
   await card.getByRole('button',{name:'Copier photo aléatoire'}).click();
   await page.waitForFunction(()=>window.__copiedImages.length>=2);
   const secondImage=await card.locator('.hspa-photo-preview img').getAttribute('src');
   assert.notEqual(firstImage,secondImage,'Each successive photo copy selects a different poster');
   assert.match(await card.locator('.hspa-local-feedback').innerText(),/Photo copiée/);
   assert.equal(await card.locator('button').count(),2,'Only requested two buttons inside offer card');
   const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
   assert.ok(dimensions.scroll<=dimensions.width+4,'Horizontal overflow '+JSON.stringify(dimensions));
   // Browser denies writing images: present the real selected photo with long-press instructions.
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
    writeText:async x=>{window.__lastCopied=x},
    write:async()=>{throw new Error('NotAllowedError')}
   }}));
   await card.getByRole('button',{name:'Copier photo aléatoire'}).click();
   await page.waitForFunction(()=>document.querySelector('.hspa-local-feedback')?.textContent.includes('appuyez longuement'));
   assert.equal(await card.locator('.hspa-photo-preview img').count(),1);
   // Browser denies writing text too: show selectable full message and URL instead of false success.
   await page.evaluate(()=>{
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('NotAllowedError')}}});
    document.execCommand=()=>false;
   });
   await card.getByRole('button',{name:'Copier message + lien'}).click();
   await page.waitForFunction(()=>document.querySelector('.hspa-copy-fallback')?.value.includes('horenova.com/job.html'));
   assert.match(await card.locator('.hspa-local-feedback').innerText(),/Copie bloquée/);
   await page.evaluate(()=>{document.documentElement.lang='en'});
   await page.waitForFunction(()=>document.querySelector('.hspa-post-actions')?.textContent.includes('Copy random photo'));
   assert.equal(await card.getByRole('button',{name:'Copy random photo'}).count(),1);
   await page.evaluate(()=>{document.documentElement.lang='ar';document.documentElement.dir='rtl'});
   await page.waitForFunction(()=>document.querySelector('.hspa-post-actions')?.textContent.includes('نسخ صورة عشوائية'));
   assert.equal(await card.getByRole('button',{name:'نسخ الرسالة والرابط'}).count(),1);
   assert.deepEqual(errors,[],'Unexpected page errors '+JSON.stringify(errors));
   console.log('PASS HORENOVA '+width+'px: exactly 3 actions, text+link only, randomly changing photo only, no channel buttons, denied-copy fallbacks, FR/EN/AR');
   await context.close();
  }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error('FAIL HORENOVA simple social share '+e.stack);process.exitCode=1});
