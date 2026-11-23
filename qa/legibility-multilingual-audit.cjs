'use strict';
/** Public site legibility + multilingual audit (read-only, mocked external calls).
 * No production accounts, applicant records, payments or publishing changes.
 */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const pages=[
 'index.html','jobs.html','shifts.html','talents.html','shop.html','shop-product.html',
 'academy.html','communaute.html','avis.html','explore.html','explore-guide.html',
 'explore-prices.html','explore-itinerary.html','explore-experiences.html','explore-help.html',
 'support.html','matching-guide.html','enter.html','tech.html','tech-demo.html','tech-menu.html'
];
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const name=decodeURIComponent(url.pathname).replace(/^\/+/,'')||'index.html';
  const file=path.resolve(root,name);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end('Missing local asset');}
  const ext=path.extname(file);
  if(ext==='.mp4'||ext==='.webm'){res.writeHead(204);return res.end();}
  res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(fs.readFileSync(file));
 }catch{res.writeHead(400);res.end();}
});
async function analyse(page){
 return page.evaluate(()=>{
  const rgb=x=>{const m=String(x||'').match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/);return m?[+m[1],+m[2],+m[3],m[4]===undefined?1:+m[4]]:null};
  const light=c=>{const x=c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return .2126*x[0]+.7152*x[1]+.0722*x[2]};
  const ratio=(a,b)=>{const x=light(a),y=light(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
  const background=el=>{
   for(let p=el;p;p=p.parentElement){
    const s=getComputedStyle(p);
    if(s.backgroundImage&&s.backgroundImage!=='none')return null; // Photograph or gradient: cannot know pixel contrast.
    const col=rgb(s.backgroundColor);
    if(col&&col[3]>.98)return col;
    if(col&&col[3]>.04)return null; // layered alpha: avoid false measurements
    if(s.opacity!=='1'&&Number(s.opacity)<.98)return null;
   }
   return [255,255,255,1];
  };
  const candidates=document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,small,label,a,button,b,strong,span,li,td,th,summary,option');
  const found=[],seen=new Set();let sampled=0,checked=0,skipped=0;
  for(const el of candidates){
   if(sampled++>2600)break;
   if(el.closest('[hidden],[aria-hidden="true"],[inert]'))continue;
   const t=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.nodeValue).join(' ').replace(/\s+/g,' ').trim();
   if(!t||t.length<3||/^[0-9\W]+$/u.test(t))continue;
   const st=getComputedStyle(el),r=el.getBoundingClientRect();
   if(st.display==='none'||st.visibility!=='visible'||+st.opacity<.2||r.width<2||r.height<2)continue;
   if(r.bottom<0||r.top>document.documentElement.scrollHeight||r.left>=innerWidth||r.right<=0)continue;
   if(st.webkitTextFillColor==='transparent'||st.backgroundClip==='text')continue;
   const fg=rgb(st.color),bg=background(el);
   if(!fg||!bg||fg[3]<.95){skipped++;continue;}
   const score=ratio(fg,bg),size=parseFloat(st.fontSize)||16,weight=parseInt(st.fontWeight)||400;
   const minimum=size>=24||(size>=18.6&&weight>=700)?3:4.5;
   checked++;
   if(score>=minimum)continue;
   const key=[t.slice(0,55),fg.slice(0,3).join(','),bg.slice(0,3).join(',')].join('|');
   if(seen.has(key))continue;seen.add(key);
   found.push({text:t.slice(0,100),ratio:+score.toFixed(2),required:minimum,tag:el.tagName,cls:String(el.className||'').slice(0,95),color:st.color,bg:bg.slice(0,3),size:+size.toFixed(1)});
  }
  return{width:innerWidth,scroll:document.documentElement.scrollWidth,lang:document.documentElement.lang,dir:document.documentElement.dir,textChecked:checked,ambiguousBackground:skipped,lowContrast:found.sort((a,b)=>a.ratio-b.ratio).slice(0,24)};
 });
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true});
 const report=[],fails=[];let total=0,bad=0;
 try{
  for(const width of [390,1440]){
   const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',reducedMotion:'reduce',isMobile:width<500,hasTouch:width<500});
   await context.route('**/*',route=>{
    const host=new URL(route.request().url()).hostname;
    if(host==='127.0.0.1')return route.continue();
    return route.fulfill({status:204,body:'',headers:{'Access-Control-Allow-Origin':'*'}});
   });
   for(const name of pages){
    for(const lang of ['fr','en','ar']){
     const page=await context.newPage(),errors=[];
     page.on('pageerror',e=>errors.push(e.message.slice(0,140)));
     try{
      await page.addInitScript(language=>{try{localStorage.setItem('mihna-lang',language)}catch{}},lang);
      const response=await page.goto(base+'/'+name,{waitUntil:'domcontentloaded',timeout:17000});
      if(response.status()!==200)throw Error('HTTP '+response.status());
      await page.waitForTimeout(120);
      const details=await analyse(page);
      if(details.lang!==lang)fails.push(name+' @ '+width+' '+lang+': locale '+details.lang);
      if(details.scroll>width+8)fails.push(name+' @ '+width+' '+lang+': horizontal overflow '+details.scroll);
      const entry={name,lang,width,...details,errorCount:errors.length};
      report.push(entry);total+=details.textChecked;bad+=details.lowContrast.length;
      console.log('AUDIT '+name+' '+lang+' '+width+'px text='+details.textChecked+' lowContrast='+details.lowContrast.length+' lang='+details.lang+' overflow='+(details.scroll-width));
      if(details.lowContrast.length)console.log('CONTRAST '+JSON.stringify({page:name,lang,width,examples:details.lowContrast.slice(0,6)}));
     }catch(e){fails.push(name+' @ '+width+' '+lang+': '+e.message.slice(0,220));}
     finally{await page.close().catch(()=>{});}
    }
   }
   await context.close();
  }
  const output=path.join(root,'horenova-deep-visual-audit.json');
  fs.writeFileSync(output,JSON.stringify({generatedAt:new Date().toISOString(),cases:report.length,textNodesSampled:total,lowContrastSamples:bad,failures:fails,casesByPage:report},null,2));
  console.log('AUDIT SUMMARY '+JSON.stringify({pages:pages.length,cases:report.length,textNodesSampled:total,lowContrastSamples:bad,technicalFailures:fails.length}));
  if(fails.length)throw Error('Navigation, localization or overflow failures:\n'+fails.slice(0,30).join('\n'));
  console.log('PASS visual/a11y audit completed. Contrast candidates are retained in the JSON report for remediation.');
 }finally{await browser.close();server.close();}
})().catch(err=>{console.error('FAIL deep audit: '+err.stack);process.exitCode=1;});
