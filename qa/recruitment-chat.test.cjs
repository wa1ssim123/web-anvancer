'use strict';
/* Contract tests for private HORENOVA messaging; no real Wix accounts or production database. */
const test=require('node:test'),assert=require('node:assert/strict');
const {createChatHandler,normalizedRoles,rolesOverlap}=require('../backend/chat.cjs');
const APP='11111111-1111-4111-8111-111111111111';
const REQ='22222222-2222-4222-8222-222222222222';
const THREAD='33333333-3333-4333-8333-333333333333';
const ADMIN='admin-a',CAND='candidate-a',REC='recruiter-a';
const err=(status,message)=>Object.assign(new Error(message),{status});
function harness({role='admin',id=ADMIN,consent=true,assigned=true,body={}}={}){
 const calls=[],user={role,id},direct={id:THREAD,recipient_wix_id:CAND,recipient_role:'candidate'};
 let created=false;const responses=[];
 const data={
  async query(sql,params=[]){
   calls.push({sql,params});
   if(sql.includes('SELECT candidate_wix_id FROM hr_applications'))return {rows:[{candidate_wix_id:CAND}]};
   if(sql.includes('SELECT recruiter_wix_id FROM hr_recruiter_requests'))return {rows:[{recruiter_wix_id:REC}]};
   if(sql.includes('INSERT INTO hr_direct_threads')){created=true;return {rows:[{id:THREAD}]}};
   if(sql.includes('SELECT id,recipient_wix_id,recipient_role FROM hr_direct_threads'))return {rows:[direct]};
   if(sql.includes('FROM hr_direct_threads d'))return {rows:[]};
   if(sql.includes('FROM hr_applications a')&&sql.includes('a.consent_to_intro'))return {rows:[]};
   if(sql.includes('FROM hr_direct_messages WHERE thread_id'))return {rows:[]};
   if(sql.includes('FROM hr_messages WHERE application_id'))return {rows:[]};
   if(sql.includes('INSERT INTO hr_messages'))return {rows:[{id:3,created_at:'2026-11-22T18:00:00Z'}]};
   if(sql.includes('FROM hr_applications WHERE')&&sql.includes('job_role ILIKE'))return {rows:[]};
   if(sql.includes('FROM hr_recruiter_requests')&&sql.includes('status=$4'))return {rows:[]};
   return {rows:[]};
  },
  async connect(){
   return {release(){},async query(sql,params=[]){
    calls.push({sql,params});
    if(sql.includes('INSERT INTO hr_direct_messages'))return {rows:[{id:10,created_at:'2026-11-22T18:00:00Z'}]};
    return {rows:[]};
   }};
  }
 };
 const handler=createChatHandler({
  pool:data,json:(res,status,value)=>{responses.push({status,value});return {status,...value}},
  read:async()=>body,rate:()=>{},auth:async()=>user,requireRole:(u,roles)=>{if(!roles.includes(u.role))throw err(403,'Accès refusé')},
  error:err,limit:(s,n=120)=>String(s??'').trim().slice(0,n),
  uuid:s=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s),
  application:async(appId,actor)=>{
   if(appId!==APP)throw err(404,'Introuvable');
   if(actor.role==='recruiter'&&actor.id!==REC)throw err(403,'Accès refusé');
   if(actor.role==='candidate'&&actor.id!==CAND)throw err(403,'Accès refusé');
   return {id:APP,candidate_wix_id:CAND,recruiter_wix_id:assigned?REC:null,consent_to_intro:consent};
  }
 });
 const request=url=>({url,headers:{origin:'https://horenova.com'}});
 return {handler,request,calls,get created(){return created},get responses(){return responses}};
}
test('compound candidate roles can match a single employer job',()=>{
 assert.deepEqual(normalizedRoles(' Serveur, Commis ; Barman '),['serveur','commis','barman']);
 assert.ok(rolesOverlap('serveur ,commis ,','Serveur'));
 assert.ok(rolesOverlap('Pâtissier','PATISSIER'));
 assert.ok(!rolesOverlap('Barista','Chef de cuisine'));
});
test('candidate and employer cannot browse private admin matching directory',async()=>{
 for(const role of ['candidate','recruiter']){
  const h=harness({role});
  await assert.rejects(h.handler(h.request('/api/admin/match-directory?kind=candidate'),{},'/api/admin/match-directory','GET'),{status:403});
 }
});
test('admin matching directory queries are parameterized',async()=>{
 const h=harness();
 const u='/api/admin/match-directory?kind=candidate&query=Amine&role=serveur&city=Casa&status=EN_ETUDE';
 await h.handler(h.request(u),{},'/api/admin/match-directory','GET');
 const q=h.calls.find(x=>x.sql.includes('candidate_email')&&x.sql.includes('ILIKE'));
 assert.ok(q);assert.deepEqual(q.params,['%Amine%','%serveur%','%Casa%','EN_ETUDE']);
});
test('only an administrator may open private contact from a known application',async()=>{
 const h=harness({role:'admin',body:{kind:'candidate',sourceId:APP}});
 const r=await h.handler(h.request('/api/chat/direct-threads'),{},'/api/chat/direct-threads','POST');
 assert.equal(r.status,200);assert.equal(r.id,THREAD);assert.ok(h.created);
 const h2=harness({role:'candidate',id:CAND,body:{kind:'candidate',sourceId:APP}});
 await assert.rejects(h2.handler(h2.request('/api/chat/direct-threads'),{},'/api/chat/direct-threads','POST'),{status:403});
});
test('candidate can read own direct chat, recruiter cannot eavesdrop',async()=>{
 const a=harness({role:'candidate',id:CAND});
 const res=await a.handler(a.request('/api/chat/direct/'+THREAD+'/messages'),{},'/api/chat/direct/'+THREAD+'/messages','GET');
 assert.equal(res.status,200);
 const r=harness({role:'recruiter',id:REC});
 await assert.rejects(r.handler(r.request('/api/chat/direct/'+THREAD+'/messages'),{},'/api/chat/direct/'+THREAD+'/messages','GET'),{status:404});
});
test('three-way room only opens after consent and assignment',async()=>{
 const u='/api/chat/match/'+APP+'/messages';
 for(const options of [{assigned:false},{consent:false}]){
  const h=harness({role:'candidate',id:CAND,...options});
  await assert.rejects(h.handler(h.request(u),{},u,'GET'),{status:403});
 }
 const a=harness({role:'candidate',id:CAND});assert.equal((await a.handler(a.request(u),{},u,'GET')).status,200);
 const r=harness({role:'recruiter',id:REC});assert.equal((await r.handler(r.request(u),{},u,'GET')).status,200);
 const outsider=harness({role:'candidate',id:'different-candidate'});await assert.rejects(outsider.handler(outsider.request(u),{},u,'GET'),{status:403});
});
test('direct replies are saved under the authenticated sender identity in a transaction',async()=>{
 const h=harness({role:'candidate',id:CAND,body:{body:'Bonjour, je suis disponible.'}});
 const u='/api/chat/direct/'+THREAD+'/messages';
 const res=await h.handler(h.request(u),{},u,'POST');
 assert.equal(res.status,201);assert.ok(h.calls.some(x=>x.sql==='BEGIN'));
 const insert=h.calls.find(x=>x.sql.includes('INSERT INTO hr_direct_messages'));
 assert.deepEqual(insert.params,[THREAD,CAND,'candidate','Bonjour, je suis disponible.']);
 assert.ok(h.calls.some(x=>x.sql==='COMMIT'));
});
test('empty messages are blocked',async()=>{
 const h=harness({role:'candidate',id:CAND,body:{body:'  '}});
 const u='/api/chat/direct/'+THREAD+'/messages';
 await assert.rejects(h.handler(h.request(u),{},u,'POST'),{status:422});
});
// Regression: a recruiter joining later must never receive historic admin-candidate messages.
test('three-way message history excludes pre-introduction private messages',async()=>{
 const h=harness({role:'recruiter',id:REC});
 const url='/api/chat/match/'+APP+'/messages';
 await h.handler(h.request(url),{},url,'GET');
 const query=h.calls.find(x=>x.sql.includes('FROM hr_messages m JOIN hr_applications a'));
 assert.ok(query,'Match chat must join the application introduction boundary');
 assert.match(query.sql,/m\.created_at>=a\.match_started_at/);
});
