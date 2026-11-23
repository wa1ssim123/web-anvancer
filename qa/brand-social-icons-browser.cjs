'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const base=path.resolve(__dirname,'..');
const markup="<!doctype html><html lang=\"fr\"><head><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><link rel=\"stylesheet\" href=\"/social-brand-icons.css\"></head><body>\n<section id=\"canal\"><div class=\"hc-channel-symbol\">◉</div><a id=\"hcFollow\" href=\"https://whatsapp.com/channel/0029Vb9VLZ5A2pLGFYQA6s2u\">Suivre sur WhatsApp ↗</a></section>\n<section id=\"telegram\"><div class=\"hc-channel-symbol\">➤</div><a id=\"hcTelegramFollow\" href=\"https://t.me/HORENOVA_Emploi_Maroc\">Suivre sur Telegram ↗</a></section>\n<a id=\"hnSocialWA\" href=\"https://whatsapp.com/channel/0029Vb9VLZ5A2pLGFYQA6s2u\">WhatsApp ↗</a><a id=\"hnSocialTG\" href=\"https://t.me/HORENOVA_Emploi_Maroc\">Telegram ↗</a>\n<span id=\"hnSocialTGPending\">Telegram bientôt</span><div id=\"hnAdminSocialPublications\"><div class=\"hspa-connection\"><b>WhatsApp</b></div><div class=\"hspa-connection\"><b>Telegram</b></div><div class=\"hspa-pill\">Telegram · Auto inactive</div></div>\n<a id=\"communityNav\" href=\"/communaute.html\">WhatsApp, Telegram & actualités</a><a id=\"unrelated\" href=\"/jobs.html\">Offres</a><script defer src=\"/social-brand-icons.js\"></script></body></html>";
const server=http.createServer((req,res)=>{
 const name=new URL(req.url,'http://localhost').pathname;
 if(name==='/test'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(markup)}
 const file=path.resolve(base,name.slice(1));
 if(!file.startsWith(base+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end('not found')}
 const ext=path.extname(file),mime=ext==='.svg'?'image/svg+xml':ext==='.css'?'text/css':ext==='.js'?'application/javascript':'text/html';
 res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store'});res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [320,390,1200]){
   const context=await browser.newContext({viewport:{width,height:850}});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/test');
   await page.waitForFunction(()=>document.querySelectorAll('img.hn-brand-logo').length>=10);
   for(const [id,brand] of [
    ['hcFollow','whatsapp'],['hcTelegramFollow','telegram'],
    ['hnSocialWA','whatsapp'],['hnSocialTG','telegram']]){
    const el=page.locator('#'+id);assert.equal(await el.locator('img.hn-brand-logo-'+brand).count(),1);
    assert.ok((await el.getAttribute('href')).includes(brand==='whatsapp'?'whatsapp.com':'t.me'));
   }
   for(const [id,brand] of [['canal','whatsapp'],['telegram','telegram']]){
    const img=page.locator('#'+id+' .hc-channel-symbol img');
    assert.equal(await img.count(),1);
    assert.equal(await img.getAttribute('src'),'/assets/brand-'+brand+'.svg');
    await img.evaluate(el=>el.decode());
    assert.ok(await img.evaluate(el=>el.naturalWidth>0&&el.naturalHeight>0));
   }
   assert.equal(await page.locator('#unrelated .hn-brand-logo').count(),0);
   assert.equal(await page.locator('#communityNav .hn-brand-logo').count(),2);
   assert.equal(await page.locator('.hspa-connection b>.hn-brand-logo').count(),2);
   assert.equal(await page.locator('.hspa-pill>.hn-brand-logo').count(),1);
   // Late-mounted admin settings must replace fake emoji drawings.
   await page.evaluate(()=>{
    for(const [id,tag,emoji] of [
     ['hnWhatsappChannelAdmin','whatsapp','◉'],['hnTelegramChannelAdmin','telegram','➤']]){
     const section=document.createElement('section');section.id=id;
     section.innerHTML='<div class="hca-badge">'+emoji+'</div><button id="'+(tag==='whatsapp'?'hcaSave':'htgSave')+'">Activer '+tag+'</button>';
     document.body.append(section);
    }
   });
   await page.waitForFunction(()=>document.querySelectorAll('.hca-badge img.hn-brand-logo').length===2);
   assert.equal(await page.locator('#hnWhatsappChannelAdmin .hca-badge .hn-brand-logo-whatsapp').count(),1);
   assert.equal(await page.locator('#hnTelegramChannelAdmin .hca-badge .hn-brand-logo-telegram').count(),1);
   assert.equal(await page.locator('#hcaSave .hn-brand-logo-whatsapp').count(),1);
   assert.equal(await page.locator('#htgSave .hn-brand-logo-telegram').count(),1);
   // Language switches often reset button textContent; logos must be restored once.
   await page.evaluate(()=>{
    document.querySelector('#hcFollow').textContent='Follow on WhatsApp ↗';
    document.querySelector('#hcTelegramFollow').textContent='متابعة قناة تيليغرام';
   });
   await page.waitForFunction(()=>document.querySelector('#hcFollow>.hn-brand-logo-whatsapp')&&
    document.querySelector('#hcTelegramFollow>.hn-brand-logo-telegram'));
   await page.waitForTimeout(50);
   assert.equal(await page.locator('#hcFollow>.hn-brand-logo').count(),1);
   assert.equal(await page.locator('#hcTelegramFollow>.hn-brand-logo').count(),1);
   assert.deepEqual(errors,[]);
   console.log('PASS brand logos '+width+'px: authentic SVGs, public buttons, admin, home and FR EN AR labels');
   await context.close();
  }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
