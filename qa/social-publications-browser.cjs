'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const baseDir=path.resolve(__dirname,'..');
const mime={'.js':'application/javascript','.css':'text/css'};
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/test-social'){res.writeHead(200,{'Content-Type':'text/html'});return res.end('<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/channel-admin.css"><link rel="stylesheet" href="/social-publications-admin.css"></head><body><main id="root"></main></body></html>')}
 const file=path.resolve(baseDir,pathname.slice(1));
 if(!file.startsWith(baseDir+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end()}
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'text/plain'});res.end(fs.readFileSync(file));
});
const offerId='11111111-1111-4111-8111-111111111111';
const onePixelPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGPgUbIAAACkAGeY0OCYAAAAAElFTkSuQmCC','base64');
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [320,390,1280]){
   const context=await browser.newContext({viewport:{width,height:840},serviceWorkers:'block'});
   await context.route('**/hn-api.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'export async function hub(){throw Error("Mock needed");}'}));
   await context.route('https://static.wixstatic.com/media/**',route=>route.fulfill({
    status:200,body:onePixelPng,contentType:'image/png',headers:{'access-control-allow-origin':'*','cache-control':'max-age=300'}
   }));
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/test-social');
   await page.evaluate(async(id)=>{
    const module=await import('/social-publications-admin.js');
    const record={requestId:id,channel:'telegram',status:'pending',title:'Serveur',
     city:'Casablanca',kind:'job',jobStatus:'VALIDEE',removed:false,attempts:0,sentAt:null,lastError:null,
     publicUrl:'https://horenova.com/job.html?id='+id,message:'Nouvelle offre HORENOVA\nhttps://horenova.com/job.html?id='+id};
    const whatsapp={...record,channel:'whatsapp',status:'manual'};
    window.__calls=[];
    const stub=async(route,opts)=>{window.__calls.push([route,opts?.method||'GET']);
      if(route==='/api/community/publications')return {configured:false,telegramChannel:'https://t.me/HORENOVA_Emploi_Maroc',
       whatsappChannel:'https://whatsapp.com/channel/0029Vb9VLZ5A2pLGFYQA6s2u',
       rows:[record,whatsapp]};
      throw Error('Unexpected call '+route);
    };
    module.mountSocialPublications(document.getElementById('root'),stub);
   },offerId);
   await page.locator('#hnAdminSocialPublications .hspa-post').waitFor();
   assert.equal(await page.locator('.hspa-post').count(),1);
   assert.match(await page.locator('#hspaConnections').innerText(),/Envoi automatique inactif/);
   assert.equal(await page.locator('a[href="https://horenova.com/job.html?id='+offerId+'"]').count(),1);
   assert.equal(await page.locator('.hspa-channel-options').count(),1,'Secondary channel links must be grouped');
   assert.equal(await page.locator('#hspaConnections .hspa-connection').count(),2,'No duplicate Telegram status tile');
   assert.equal(await page.locator('.hspa-channel-options .hspa-channel-actions').isVisible(),true,'Channel open buttons must be visible without an extra tap');
   assert.equal(await page.locator('.hspa-whatsapp').getAttribute('href'),'https://whatsapp.com/channel/0029Vb9VLZ5A2pLGFYQA6s2u');
   assert.equal(await page.getByRole('button',{name:'Copier message + lien Telegram'}).count(),1);
   assert.equal(await page.getByRole('button',{name:'Copier message + lien WhatsApp'}).count(),1);
   assert.equal(await page.getByRole('button',{name:'Copier le lien WhatsApp'}).count(),1);
   assert.equal(await page.getByRole('link',{name:/Ouvrir le canal Telegram/}).getAttribute('href'),'https://t.me/HORENOVA_Emploi_Maroc');
   assert.equal(await page.locator('.hspa-whatsapp').getAttribute('target'),'_self','Do not open an iOS-blocked popup');
   assert.equal(await page.getByRole('link',{name:/Ouvrir le canal Telegram/}).getAttribute('target'),'_self');
   assert.equal(await page.locator('#hspaGuideDetails').count(),0,'Technical setup copy must not appear in the admin panel');
   assert.equal(await page.locator('#hspaRender').count(),0,'No Render setup prompts in public admin outbox');
   await page.evaluate(()=>{
    window.__writeBinaryCount=0;window.__textCopyCount=0;
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
     write:async()=>{window.__writeBinaryCount++;throw Error('Image clipboard must never overwrite text')},
     writeText:async text=>{window.__textCopyCount++;window.__lastCopied=text}
    }});
    Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
    Object.defineProperty(navigator,'share',{configurable:true,value:async ({files,text,url})=>{
     window.__share={file:files?.[0]?.name,type:files?.[0]?.type,text,url};
    }});
   });
   await page.getByRole('button',{name:'Copier message + lien Telegram'}).click();
   await page.locator('.hspa-promo-preview img').waitFor();
   const first=await page.locator('.hspa-promo-img').getAttribute('src');
   const firstMessage=await page.locator('.hspa-promo-text').inputValue();
   assert.match(first,/^https:\/\/static\.wixstatic\.com\/media\/d0158d_/);
   assert.match(firstMessage,/HORENOVA/);
   assert.match(firstMessage,/Serveur/);
   assert.match(firstMessage,/Casablanca/);
   assert.match(firstMessage,new RegExp(offerId));
   assert.match(firstMessage,/horenova.com\/job.html\?id=/);
   await page.getByRole('button',{name:'Copier message + lien WhatsApp'}).click();
   const second=await page.locator('.hspa-promo-img').getAttribute('src');
   await page.locator('.hspa-local-feedback').waitFor({state:'visible'});
   assert.notEqual(second,first,'Every successive copy rotates to a different actual poster');
   assert.match(await page.locator('.hspa-promo-text').inputValue(),/HORENOVA/);
   const clipboardState=await page.evaluate(()=>({
    text:window.__lastCopied,binaryCalls:window.__writeBinaryCount,textCalls:window.__textCopyCount
   }));
   assert.match(clipboardState.text,/Serveur/);
   assert.match(clipboardState.text,/Casablanca/);
   assert.match(clipboardState.text,/horenova.com\/job.html\?id=/);
   assert.equal(clipboardState.binaryCalls,0,'Do not write an image: WhatsApp/iOS can discard text and link');
   assert.equal(clipboardState.textCalls,2,'Both channels copy complete plain-text messages');
   await page.waitForFunction(()=>document.querySelector('.hspa-promo-share')?.dataset.posterReady==='file');
   await page.getByRole('button',{name:'Partager uniquement la photo'}).click();
   await page.waitForFunction(()=>window.__share?.file);
   const shared=await page.evaluate(()=>window.__share);
   assert.ok(shared.file.startsWith('HORENOVA-recrutement.'));
   assert.equal(shared.text,undefined,'Photo share must never replace the copied job message with media text');
   assert.equal(shared.url,undefined,'When file is ready, share actual image data rather than the image link');
   assert.match(await page.evaluate(()=>window.__lastCopied),/horenova.com\/job.html\?id=/,'Sharing photo preserves the already-copied text');
   // CORS/network denial must never leave a broken Share control.
   await page.evaluate(()=>{
    const original=window.fetch.bind(window);
    window.fetch=(url,...args)=>String(url).includes('static.wixstatic.com')?
      Promise.reject(Error('CORS blocked')):original(url,...args);
    window.__share=null;
   });
   await page.getByRole('button',{name:'Copier message + lien Telegram'}).click();
   await page.waitForFunction(()=>document.querySelector('.hspa-promo-share')?.dataset.posterReady==='link');
   assert.equal(await page.getByRole('button',{name:'Partager uniquement la photo'}).isEnabled(),true,'Share poster URL is a functional fallback if image cannot be fetched');
   await page.getByRole('button',{name:'Partager uniquement la photo'}).click();
   await page.waitForFunction(()=>window.__share?.url);
   assert.match(await page.evaluate(()=>window.__share.url),/^https:\/\/static\.wixstatic\.com\/media\//);
   assert.match(await page.evaluate(()=>window.__lastCopied),/horenova.com\/job.html\?id=/,'Poster fallback must preserve the copied job message');
   // Safari clipboard permission denied must show manual selection instead of fake "copied".
   await page.evaluate(()=>{
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('NotAllowedError')}}});
    document.execCommand=()=>false;
   });
   await page.getByRole('button',{name:'Copier message + lien WhatsApp'}).click();
   await page.waitForFunction(()=>document.querySelector('.hspa-promo-details')?.open===true);
   assert.match(await page.locator('.hspa-local-feedback').innerText(),/navigateur bloque la copie automatique/);
   // Restore permitted clipboard for the independent WhatsApp channel link button.
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
    writeText:async text=>{window.__lastCopied=text}
   }}));
   await page.getByRole('button',{name:'Copier le lien WhatsApp'}).click();
   assert.equal(await page.evaluate(()=>window.__lastCopied),'https://whatsapp.com/channel/0029Vb9VLZ5A2pLGFYQA6s2u');
   assert.equal(await page.locator('button').filter({hasText:'Relancer'}).count(),0);
   const size=await page.evaluate(()=>({screen:innerWidth,body:document.documentElement.scrollWidth}));
   assert.ok(size.body<=size.screen+4,'overflow at '+width+' '+JSON.stringify(size));
   await page.evaluate(()=>{document.documentElement.lang='ar';document.documentElement.dir='rtl'});
   await page.waitForFunction(()=>document.querySelector('#hspaTitle').textContent.includes('كل عرض'));
   assert.equal(await page.locator('.hspa-post').count(),1);
   assert.deepEqual(errors,[]);
   console.log('PASS HORENOVA social iPhone '+width+'px: plain text and job URL copied, image separately shared, channel links visible, 5-photo rotation, FR/AR');
   await context.close();
  }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error('FAIL HORENOVA social admin UI '+e.stack);process.exitCode=1});
