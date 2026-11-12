'use strict';
/* Isolated backend access-control tests using a fake Wix identity and fake SQL.
   No Render, Wix, or PostgreSQL data is accessed or modified. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../backend/server.cjs'),'utf8');
const requestId='11111111-1111-4111-8111-111111111111';
const accounts={
 'candidate-token':{id:'candidate-1',role:'candidate'},
 'candidate-noquiz-token':{id:'candidate-2',role:'candidate'},
 'recruiter-token':{id:'recruiter-1',role:'recruiter'},
 'admin-token':{id:'admin-verified',role:'admin'}
};
function harness(){
 const log={db:[],wix:[]};
 let handler;
 class Pool{
  async query(sql,args=[]){
   log.db.push({sql,args});
   if(sql.startsWith('SELECT 1'))return {rows:[{ok:1}],rowCount:1};
   if(sql.startsWith('SELECT * FROM hr_applications WHERE id=$1'))return {rows:[{id:requestId,candidate_wix_id:'candidate-1',recruiter_wix_id:'recruiter-1',consent_to_intro:true}],rowCount:1};
   if(sql.startsWith('UPDATE hr_recruiter_requests'))return {rows:[{id:requestId,status:args[0]}],rowCount:1};
   if(sql.startsWith('INSERT INTO hr_applications'))return {rows:[{
     id:requestId,job_id:'job-1',job_title:'Service',job_role:'Serveur',
     candidate_wix_id:args[0],candidate_email:args[1],profile:{},
     consent_to_intro:true,status:'EN_ETUDE',created_at:'2026-11-12'
   }],rowCount:1};
   return {rows:[],rowCount:0};
  }
 }
 async function fakeFetch(url,opts={}){
  const token=opts.headers?.Authorization;
  const identity=accounts[token];
  const reply=(body,status=200)=>({ok:status>=200&&status<300,status,json:async()=>body});
  if(!identity)return reply({},401);
  if(url.includes('/members/v1/members/my'))return reply({member:{
    id:identity.id,status:'ACTIVE',loginEmail:identity.id+'@test.invalid'
  }});
  if(url.includes('/wix-data/v2/items/query')){
    const body=JSON.parse(opts.body);
    const owner=body?.query?.filter?._owner?.$eq;
    log.wix.push({collection:body.dataCollectionId,owner,identity:identity.id});
    if(owner!==identity.id)return reply({dataItems:[]});
    let items=[];
    if(body.dataCollectionId==='AccountRoles' && identity.role!=='admin')
      items=[{_owner:owner,role:identity.role}];
    if(body.dataCollectionId==='CandidateProfiles' && identity.role==='candidate')
      items=[{_owner:owner,profileComplete:true,videoFileId:'video-1',videoConsent:true,firstName:'Test'}];
    if(body.dataCollectionId==='QuizAttempts' && token==='candidate-token')
      items=[{_owner:owner,jobFamily:'Serveur',passed:true,score:100}];
    return reply({dataItems:items.map(data=>({data}))});
  }
  if(url.includes('/wix-data/v2/items/job-1?dataCollectionId=Jobs'))
    return reply({dataItem:{data:{_id:'job-1',active:true,title:'Service',role:'Serveur'}}});
  throw Error('Unexpected fake Wix endpoint: '+url);
 }
 const server={listen(){}};
 const sandbox={
  require(name){
   if(name==='node:http')return {createServer(fn){handler=fn;return server;}};
   if(name==='node:crypto')return require(name);
   if(name==='pg')return {Pool};
   throw Error('Unexpected require '+name);
  },
  fetch:fakeFetch,console,Buffer,URL,AbortSignal,
  process:{env:{DATABASE_URL:'postgres://test.invalid',ADMIN_WIX_ID:'admin-verified'}},
  setTimeout,clearTimeout
 };
 vm.runInNewContext(source,sandbox,{filename:'backend/server.cjs'});
 async function request(method,route,token,body){
  const headers={origin:'https://horenova.com'};
  if(token)headers.authorization=token;
  if(body!==undefined)headers['content-type']='application/json';
  const payload=body===undefined?null:Buffer.from(JSON.stringify(body));
  const req={method,url:route,headers,async *[Symbol.asyncIterator](){if(payload)yield payload;}};
  const res={
   status:null,body:null,headers:{},
   setHeader(key,value){this.headers[key]=value;},
   writeHead(status,headers){this.status=status;Object.assign(this.headers,headers||{});},
   end(value){this.body=value==null?null:String(value);}
  };
  await handler(req,res);
  return {status:res.status,data:res.body?JSON.parse(res.body):null};
 }
 return {request,log};
}
test('Unauthenticated callers cannot read private applications',async()=>{
 const h=harness();
 assert.equal((await h.request('GET','/api/applications')).status,401);
});
test('Candidate can read own applications but cannot administer recruiters or reviews',async()=>{
 const h=harness();
 assert.equal((await h.request('GET','/api/applications','candidate-token')).status,200);
 assert.equal((await h.request('PATCH','/api/recruiter-requests/'+requestId+'/status','candidate-token',{status:'VALIDEE'})).status,403);
 assert.equal((await h.request('GET','/api/reviews/moderation','candidate-token')).status,403);
 assert.ok(h.log.db.some(x=>x.sql.includes('WHERE candidate_wix_id=$1')&&x.args[0]==='candidate-1'));
 assert.ok(!h.log.db.some(x=>x.sql.startsWith('UPDATE hr_recruiter_requests')));
});
test('Recruiter can see own requests but not moderate candidates',async()=>{
 const h=harness();
 assert.equal((await h.request('GET','/api/recruiter-requests','recruiter-token')).status,200);
 assert.equal((await h.request('PATCH','/api/applications/'+requestId+'/status','recruiter-token',{status:'ENTRETIEN'})).status,403);
 assert.equal((await h.request('GET','/api/reviews/moderation','recruiter-token')).status,403);
 assert.ok(h.log.db.some(x=>x.sql.includes('WHERE recruiter_wix_id=$1')&&x.args[0]==='recruiter-1'));
});
test('Verified administrator can moderate recruitment requests',async()=>{
 const h=harness();
 assert.equal((await h.request('GET','/api/recruiter-requests','admin-token')).status,200);
 assert.equal((await h.request('PATCH','/api/recruiter-requests/'+requestId+'/status','admin-token',{status:'VALIDEE'})).status,200);
 assert.ok(h.log.db.some(x=>x.sql.startsWith('UPDATE hr_recruiter_requests')&&x.args[0]==='VALIDEE'));
});
test('Candidate application checks their own profile and their own passed quiz',async()=>{
 const h=harness();
 const response=await h.request('POST','/api/applications','candidate-token',{jobId:'job-1',consentToIntro:true});
 assert.equal(response.status,201);
 assert.equal(response.data?.item?.candidateWixId,'candidate-1');
 for(const collection of ['AccountRoles','CandidateProfiles','QuizAttempts']){
  assert.ok(h.log.wix.some(x=>x.collection===collection&&x.owner==='candidate-1'));
 }
});
test('Passing quiz belonging to a different user never authorizes application',async()=>{
 const h=harness();
 const response=await h.request('POST','/api/applications','candidate-noquiz-token',{jobId:'job-1',consentToIntro:true});
 assert.equal(response.status,422);
 assert.ok(!h.log.db.some(x=>x.sql.startsWith('INSERT INTO hr_applications')));
});
