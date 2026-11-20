'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {renderMail,localeOf}=require('../backend/mail-templates.cjs');
const {createTransactionalMailer}=require('../backend/transactional-mail.cjs');
const root=path.join(__dirname,'..');
const src=file=>fs.readFileSync(path.join(root,file),'utf8');
const validId='11111111-1111-4111-8111-111111111111';
const email='<script>alert("secret")</script>';
for(const locale of ['fr','en','ar']){
 for(const kind of ['candidate','job','shift']){
  const m=renderMail(kind,{firstName:'Samira',contactName:'Youssef',
    jobTitle:'Serveur & '+email,businessName:'Café Atlas',city:'Casablanca',
    scheduleText:'Demain · 18:00–22:00'},locale);
  assert.equal(m.locale,locale);
  assert.match(m.subject,/HORENOVA|هورينوفا/);
  assert.match(m.html,/<table role="presentation"/);
  assert.match(m.html,/<style>[\s\S]*@keyframes hn-confirm-pop/);
  assert.match(m.html,/horenova-email-(candidate|recruiter)\.gif/);
  assert.ok(!m.html.includes('<script>'),kind+' must escape user HTML');
  assert.match(m.html,/&lt;script&gt;/);
  assert.ok(m.text.includes(m.ctaUrl),'Plain text must include actionable account URL');
  assert.ok(m.html.includes('dir="'+(locale==='ar'?'rtl':'ltr')+'"'));
  if(kind==='candidate'){
   assert.ok(!m.html.includes('Café Atlas'),'Candidate must never receive confidential recruiter information');
   assert.match(m.html,/account\.html/);
  }else{
   assert.match(m.html,/recruit\.html/);
   assert.ok(kind!=='shift'||m.text.includes('18:00'),'Shift notice includes schedule');
   assert.ok(!m.html.includes('déjà publiée')&&!m.html.includes('is live'),'Do not claim unapproved ads are live');
  }
 }
}
assert.equal(localeOf('AR-ma'),'ar');
for(const file of ['assets/horenova-email-candidate.gif','assets/horenova-email-recruiter.gif']){
 const buf=fs.readFileSync(path.join(root,file));
 assert.equal(buf.subarray(0,6).toString('ascii'),'GIF89a');
 assert.equal(buf[buf.length-1],0x3b);
 assert.ok(buf.length>1000&&buf.length<300000);
 assert.ok(buf.includes(Buffer.from('NETSCAPE2.0')),'Must be animated GIF');
}
class MockPool{
 constructor(){this.rows=new Map();this.sql=[];}
 async query(sql,params=[]){
  this.sql.push(sql);
  if(/CREATE TABLE|CREATE INDEX/i.test(sql))return {rows:[]};
  if(sql.includes('INSERT INTO hr_email_outbox')){
   const [key,kind,to,locale,data]=params;
   if(this.rows.has(key))return {rows:[]};
   this.rows.set(key,{event_key:key,event_kind:kind,recipient_email:to,
    locale,payload:JSON.parse(data),state:'queued',attempts:0});
   return {rows:[{event_key:key}]};
  }
  if(sql.includes('WITH selected AS')){
   const items=[...this.rows.values()].filter(x=>x.state==='queued').slice(0,8);
   items.forEach(x=>{x.state='sending';x.attempts++});
   return {rows:items};
  }
  if(sql.includes("SET state='sent'")){
   const x=this.rows.get(params[0]);x.state='sent';x.provider_id=params[1];return {rows:[]};
  }
  if(sql.includes('SET state=$2')){
   const x=this.rows.get(params[0]);x.state=params[1];x.last_error=params[2];return {rows:[]};
  }
  if(sql.startsWith('SELECT state,COUNT(*)')){
   return {rows:[...this.rows.values()].reduce((a,row)=>{
     let x=a.find(v=>v.state===row.state);
     if(!x){x={state:row.state,total:0};a.push(x)}
     x.total++;return a;},[])};
  }
  throw Error('Unexpected SQL: '+sql.slice(0,120));
 }
}
(async()=>{
 const pool=new MockPool(),sent=[];
 const service=createTransactionalMailer({
  pool,env:{RESEND_API_KEY:'TEST_ONLY',MAIL_FROM:'HORENOVA <mail@example.org>'},
  schedule:()=>{},log:{warn(){}},
  fetcher:async(url,opts)=>{
   sent.push({url,opts,body:JSON.parse(opts.body)});
   return {ok:true,json:async()=>({id:'provider-confirmed-id'})};
  }
 });
 const event={key:'candidate:'+validId,kind:'candidate',to:'candidate@example.org',
  locale:'ar',payload:{firstName:'Samira',jobTitle:'Barista'}};
 assert.equal((await service.enqueue(event)).queued,true);
 assert.equal((await service.enqueue(event)).alreadyQueued,true);
 assert.equal(pool.rows.size,1,'Idempotent enqueue must never duplicate');
 assert.equal((await service.drain()).processed,1);
 assert.equal((await service.drain()).processed,0);
 assert.equal(sent.length,1,'Only one email per new business event');
 assert.equal(sent[0].opts.headers['Idempotency-Key'],'horenova/candidate:'+validId);
 assert.equal(sent[0].body.to[0],'candidate@example.org');
 assert.equal(sent[0].body.from,'HORENOVA <mail@example.org>');
 assert.ok(sent[0].body.html.includes('dir="rtl"'));
 assert.ok(sent[0].body.text.includes('https://horenova.com/account.html'));
 assert.equal((await service.stats()).states[0].state,'sent');
 const noConfig=new MockPool(),offline=createTransactionalMailer({
  pool:noConfig,env:{},schedule:()=>{},log:{warn(){}},fetcher:async()=>{throw Error('Never call provider without configuration')}
 });
 await offline.enqueue({key:'job:'+validId,kind:'job',to:'employer@example.org',
  locale:'en',payload:{jobTitle:'Chef',businessName:'Example Café'}});
 assert.equal((await offline.drain()).enabled,false);
 assert.equal(noConfig.rows.get('job:'+validId).state,'queued','Keep pending email until provider is configured');
 assert.equal((await offline.enqueue({...event,to:'invalid-address'})).queued,false);
 console.log('PASS: 9 responsive-language email variants, escaped HTML, animated GIF assets, safe recipients, idempotent outbox and offline queue.');
})().catch(e=>{console.error(e);process.exitCode=1});
