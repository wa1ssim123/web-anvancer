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
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [320,390,1280]){
   const context=await browser.newContext({viewport:{width,height:840},serviceWorkers:'block'});
   await context.route('**/hn-api.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'export async function hub(){throw Error("Mock needed");}'}));
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
   assert.equal(await page.locator('.hspa-whatsapp').getAttribute('href'),'https://whatsapp.com/channel/0029Vb9VLZ5A2pLGFYQA6s2u');
   assert.equal(await page.getByRole('button',{name:'Copier le message Telegram'}).count(),1);
   assert.equal(await page.getByRole('button',{name:'Copier le message WhatsApp'}).count(),1);
   assert.equal(await page.getByRole('button',{name:'Copier le lien WhatsApp'}).count(),1);
   assert.equal(await page.getByRole('link',{name:/Ouvrir le canal Telegram/}).getAttribute('href'),'https://t.me/HORENOVA_Emploi_Maroc');
   assert.equal(await page.locator('.hspa-whatsapp').getAttribute('target'),'_self','Do not open an iOS-blocked popup');
   assert.equal(await page.getByRole('link',{name:/Ouvrir le canal Telegram/}).getAttribute('target'),'_self');
   assert.equal(await page.locator('#hspaGuideDetails').count(),0,'Technical setup copy must not appear in the admin panel');
   assert.equal(await page.locator('#hspaRender').count(),0,'No Render setup prompts in public admin outbox');
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__lastCopied=text}}}));
   await page.getByRole('button',{name:'Copier le message Telegram'}).click();
   assert.match(await page.evaluate(()=>window.__lastCopied),/horenova.com\/job.html/);
   await page.getByRole('button',{name:'Copier le lien WhatsApp'}).click();
   assert.equal(await page.evaluate(()=>window.__lastCopied),'https://whatsapp.com/channel/0029Vb9VLZ5A2pLGFYQA6s2u');
   assert.equal(await page.locator('button').filter({hasText:'Relancer'}).count(),0);
   const size=await page.evaluate(()=>({screen:innerWidth,body:document.documentElement.scrollWidth}));
   assert.ok(size.body<=size.screen+4,'overflow at '+width+' '+JSON.stringify(size));
   await page.evaluate(()=>{document.documentElement.lang='ar';document.documentElement.dir='rtl'});
   await page.waitForFunction(()=>document.querySelector('#hspaTitle').textContent.includes('كل عرض'));
   assert.equal(await page.locator('.hspa-post').count(),1);
   assert.deepEqual(errors,[]);
   console.log('PASS HORENOVA admin social approvals '+width+'px: Telegram copy, WhatsApp copy/open, no technical setup, readable state, FR/AR');
   await context.close();
  }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error('FAIL HORENOVA social admin UI '+e.stack);process.exitCode=1});
