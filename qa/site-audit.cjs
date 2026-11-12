'use strict';
/* HORENOVA static release checks. Run with: node qa/site-audit.cjs
   These checks DO NOT simulate signed-in browser sessions or a live database. */
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const own=p=>fs.readFileSync(path.join(root,p),'utf8');
const list=(dir='')=>fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>{
  if(e.name==='.git'||e.name==='node_modules')return [];
  const rel=path.posix.join(dir,e.name);
  return e.isDirectory()?list(rel):[rel];
});
const files=list();
const failures=[];
const fail=(scope,problem)=>failures.push(scope+': '+problem);
let scripts=0,links=0,pages=0;
for(const file of files.filter(x=>/\.(?:js|cjs)$/.test(x))){
  const source=own(file);
  const args=file.endsWith('.cjs')?['--check']:['--check','--input-type=module'];
  const result=cp.spawnSync(process.execPath,args,{input:source,encoding:'utf8'});
  if(result.status!==0)fail(file,(result.stderr||'JavaScript syntax error').trim().slice(0,500));
  scripts++;
}
for(const file of files.filter(x=>x.endsWith('.html'))){
  pages++;
  const html=own(file);
  if(file!=='offline.html'&&!html.includes('horenova-i18n.js'))fail(file,'missing FR/EN/AR locale loader');
  for(const match of html.matchAll(/(?:src|href)\s*=\s*["'](\/[^"'\s]+)["']/gi)){
    let url=match[1];if(url.startsWith('//'))continue;
    const local=url.split(/[?#]/,1)[0].slice(1);
    if(!local||!/\.(?:html|js|css|png|svg|ico|jpg|jpeg|webp|json|txt|woff2?)$/i.test(local))continue;
    links++;
    try{if(!fs.existsSync(path.join(root,decodeURIComponent(local))))fail(file,'missing local asset '+url)}
    catch{fail(file,'invalid asset path '+url)}
  }
}
const locale=own('horenova-i18n.js');
const match=locale.match(/const ROWS=("(?:\\.|[^"\\])*");/s);
assert.ok(match,'Translation catalog must be a JSON string');
const rows=JSON.parse(match[1]).split('\n').filter(Boolean);
for(let i=0;i<rows.length;i++){
  const parts=rows[i].split('|');
  if(parts.length!==3||parts.some(s=>!s.trim()))fail('horenova-i18n.js','invalid FR/EN/AR entry '+(i+1));
}
// Low Power Mode on Safari may add a giant native play overlay to <video autoplay>.
for(const page of ['index.html','academy.html','business.html','explore.html','shop.html','shifts.html']){
 const html=own(page);
 const videos=[...html.matchAll(/<video\\b[^>]*>/gi)].map(m=>m[0]);
 if(!videos.length)fail(page,'expected at least one decorative video');
 for(const video of videos){
  if(/\\sautoplay(?:\\s|>)/i.test(video))fail(page,'native autoplay attribute on a decorative video (Safari overlay risk)');
 }
}
for(const page of ['index.html','academy.html','business.html','explore.html','shifts.html']){
 if(!own(page).includes('/horenova-ambient-video.js'))fail(page,'missing continuous decorative video controller');
}
for(const page of ['academy.html','explore.html','shop.html']){
 if(!own(page).includes('/horenova-entry.js'))fail(page,'missing fullscreen intro recovery script');
}
const protectedModules={
  'admin.js':/requireRole\(\['admin'\]/,
  'business-gate.js':/requireRole\(\['admin'\]/,
  'recruit-live.js':/requireRole\(\['recruiter'\]/,
  'candidate-setup.js':/requireRole\(\['candidate'\]/,
  'recruiter-setup.js':/requireRole\(\['recruiter'\]/,
  'quiz.js':/requireRole\(\['candidate'\]/,
  'apply.js':/requireRole\(\['candidate'\]/
};
for(const [file,pattern]of Object.entries(protectedModules))if(!pattern.test(own(file)))fail(file,'expected role gate not found');
const backend=own('backend/server.cjs');
if(!backend.includes("filter:{_owner:{$eq:ownerId}}"))fail('backend/server.cjs','Wix owner scoping is missing');
for(const file of ['mihna-global.js','login-page.js','account.js','apply.js','candidate-setup.js','recruiter-setup.js','recruit-live.js','quiz.js']){
  if(!own(file).includes("field:'_owner'"))fail(file,'private data query must be owner-scoped');
}
if(failures.length){
  console.error('FAIL: '+failures.length+' release checks\n'+failures.join('\n'));
  process.exitCode=1;
}else console.log('PASS: '+scripts+' JavaScript syntax checks; '+pages+' pages; '+links+' local resource references; '+rows.length+' FR/EN/AR translations; required access-control guards.');
