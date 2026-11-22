'use strict';
/* Exhaustive local browser sweep: every HORENOVA HTML page, phone and desktop.
   Uses only local assets and signed-out pages. No production mutations. */
const {chromium}=require('playwright');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const excluded=new Set(['offline.html']);
const htmlPages=fs.readdirSync(root).filter(p=>p.endsWith('.html')&&!excluded.has(p)).sort();
const sensitive=new Set(['index.html','jobs.html','shifts.html','shop.html','explore.html','academy.html','conversations.html','support.html','account.html','admin.html','apply.html','recruit.html','tech.html','tech-demo.html','tech-console.html','tech-menu.html']);
const gated=new Set(['admin.html','account.html','apply.html','recruit.html','recruiter-setup.html','trip.html','candidate-setup.html','onboarding.html','quiz.html','profile.html','matches.html','favorites.html']);
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.ico':'image/x-icon','.mp4':'video/mp4','.webm':'video/webm'};
const server=http.createServer((req,res)=>{
 try{
  const u=new URL(req.url,'http://localhost');
  const name=decodeURIComponent(u.pathname).replace(/^\/+/,'')||'index.html';
  const target=path.resolve(root,name);
  if(!target.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  const file=fs.existsSync(target)&&fs.statSync(target).isFile()?target:null;
  if(!file){res.writeHead(404);return res.end();}
  const ext=path.extname(file);
  if(['.mp4','.webm'].includes(ext)){res.writeHead(204);return res.end();}
  res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream','Cache-Control':'no-store'});
  return res.end(fs.readFileSync(file));
 }catch{res.writeHead(400);return res.end();}
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 const failures=[],warnings=[];let visited=0,phoneCases=0;
 const sizes=[{width:320,height:780},{width:390,height:844},{width:1440,height:900}];
 try{
  for(const size of sizes){
   const context=await browser.newContext({viewport:size,serviceWorkers:'block',reducedMotion:'reduce',isMobile:size.width<=390,hasTouch:size.width<=390});
   await context.route('**/*',route=>{
    const host=new URL(route.request().url()).hostname;
    if(host==='127.0.0.1')return route.continue();
    return route.fulfill({status:204,body:'',headers:{'Access-Control-Allow-Origin':'*'}});
   });
   for(const name of htmlPages){
    if(size.width===320 && !sensitive.has(name))continue;
    // Each page gets a fresh isolated tab. A protected page may schedule a login
    // redirect; its asynchronous redirect must never interrupt the next page.
    const page=await context.newPage();
    const scriptErrors=[];
    const pageError=e=>scriptErrors.push(e.message.slice(0,180));
    page.on('pageerror',pageError);
    try{
     const response=await page.goto(base+'/'+name,{waitUntil:'domcontentloaded',timeout:12000});
     assert.equal(response.status(),200,'Page unavailable');
     // Signed-out role-gated routes may redirect to the legitimate authentication portal.
     // This is a protection, not a blank-page failure.
     const destination=new URL(page.url()).pathname;
     if(destination!=='/'+name && gated.has(name) && ['/enter.html','/login.html'].includes(destination)){
       console.log('PASS role-gated redirect '+name+' -> '+destination);
       visited++;continue;
     }
     let state;
     try{state=await page.evaluate(()=>{
      const root=document.documentElement;
      return {title:document.title,bodyLength:document.body?.innerText?.trim().length||0,
        scrollWidth:root.scrollWidth,clientWidth:innerWidth,lang:root.lang,
        hasViewport:!!document.querySelector('meta[name="viewport"]'),
        hasMain:!!document.querySelector('main, [role="main"]'),
        visible:!!document.body?.getClientRects().length};
     });}catch(e){
       let current=new URL(page.url()).pathname;
       if(gated.has(name)&&!['/enter.html','/login.html'].includes(current)){
         // Some role guards redirect on a microtask between navigation and
         // DOM inspection. Wait for the expected sign-in URL before failing.
         await page.waitForURL(url=>['/enter.html','/login.html'].includes(new URL(url).pathname),{timeout:1800}).catch(()=>{});
         current=new URL(page.url()).pathname;
       }
       if(gated.has(name)&&['/enter.html','/login.html'].includes(current)){
         console.log('PASS safe role redirect during transition '+name+' -> '+current);
         visited++;continue;
       }
       throw e;
     }
     assert.ok(state.title.length>=3,'Missing title');
     assert.ok(state.hasViewport,'Missing responsive viewport');
     assert.ok(state.visible,'Page body not rendered');
     assert.ok(state.bodyLength>=8,'Page body empty');
     if(size.width<=390)phoneCases++;
     if(sensitive.has(name) && state.scrollWidth>state.clientWidth+6)
       failures.push(name+' @ '+size.width+'px: horizontal overflow '+JSON.stringify(state));
     if(scriptErrors.length)
       warnings.push(name+' @ '+size.width+'px: '+scriptErrors.slice(0,2).join(' | '));
     visited++;
    }catch(e){
      let expectedGate=false;
      if(gated.has(name)){
        await page.waitForURL(url=>['/enter.html','/login.html'].includes(new URL(url).pathname),{timeout:1800}).catch(()=>{});
        expectedGate=['/enter.html','/login.html'].includes(new URL(page.url()).pathname);
      }
      if(expectedGate){visited++;console.log('PASS protected navigation redirects to sign-in: '+name);}
      else failures.push(name+' @ '+size.width+'px: '+e.message.slice(0,350));
    }
    finally{page.off('pageerror',pageError);await page.close().catch(()=>{});}
   }
   await context.close();
  }
  const mustVisit=['index.html','jobs.html','shifts.html','account.html','admin.html','conversations.html','support.html','tech.html'];
  for(const p of mustVisit)assert.ok(htmlPages.includes(p),'Missing critical page '+p);
  console.log('FULL-APP SWEEP pages='+htmlPages.length+' navigations='+visited+' phoneChecks='+phoneCases+' scriptWarnings='+warnings.length);
  if(warnings.length)console.log('BROWSER WARNINGS (external services intentionally stubbed):\n'+warnings.slice(0,20).join('\n'));
  if(failures.length)throw Error(failures.length+' full-app browser defects:\n'+failures.slice(0,55).join('\n'));
  console.log('PASS every HTML page opens at phone/desktop widths; critical workspaces avoid horizontal overflow');
 } finally{await browser.close();server.close();}
})().catch(e=>{console.error('FAIL full-app stress: '+e.stack);process.exitCode=1;});
