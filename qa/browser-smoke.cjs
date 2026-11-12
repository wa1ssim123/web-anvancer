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
 const pages=['/','/jobs.html','/shifts.html','/talents.html','/shop.html','/explore.html','/explore-guide.html','/avis.html','/enter.html'];
 const failures=[];
 try{
  for(const url of pages){
   const context=await browser.newContext({serviceWorkers:'block'});
   const page=await context.newPage();
   try{
    const response=await page.goto(base+url,{waitUntil:'domcontentloaded',timeout:20000});
    assert.equal(response.status(),200,'Page HTTP status');
    const control=page.locator('#hn-language-control');
    await control.waitFor({state:'attached',timeout:10000});
    assert.equal(await page.locator('html').getAttribute('lang'),'fr');
    const french=await page.locator('body').innerText();
    await control.selectOption('ar',{force:true});
    await page.waitForFunction(()=>document.documentElement.lang==='ar'&&document.documentElement.dir==='rtl',{timeout:6000});
    const arabic=await page.locator('body').innerText();
    assert.notEqual(arabic,french,'Arabic selection changed no displayed text');
    await control.selectOption('en',{force:true});
    await page.waitForFunction(()=>document.documentElement.lang==='en'&&document.documentElement.dir==='ltr',{timeout:6000});
    const english=await page.locator('body').innerText();
    assert.notEqual(english,arabic,'English selection changed no displayed text');
    await control.selectOption('fr',{force:true});
    await page.waitForFunction(()=>document.documentElement.lang==='fr'&&document.documentElement.dir==='ltr',{timeout:6000});
    console.log('PASS browser locale FR → AR → EN → FR: '+url);
   }catch(error){
    failures.push(url+': '+error.message.slice(0,500));
    console.error('FAIL browser locale: '+url+' — '+error.message.slice(0,240));
   }finally{await context.close();}
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
 if(failures.length){console.error('Failures: '+failures.join('\n'));process.exitCode=1;}
 else console.log('PASS: '+pages.length+' public pages exercised in real Chromium, across three languages.');
}
run().catch(e=>{console.error(e);process.exitCode=1;server.close();});
