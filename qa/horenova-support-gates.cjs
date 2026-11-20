'use strict';
/* Non-destructive QA: all conversations and credentials are simulated. */
const assert=require('node:assert/strict');
const {createSupportHandler}=require('../backend/support.cjs');
const threads=[],messages=[],presence=[];
const db={
 async query(statement,params=[]){
  const sql=String(statement).replace(/\s+/g,' ').trim();
  if(sql.startsWith('CREATE '))return {rows:[]};
  if(sql.startsWith('INSERT INTO hr_support_threads')){
   threads.push({id:params[0],member_wix_id:params[1],member_email:params[2],member_role:params[3],subject:params[4],category:params[5],status:'OPEN',created_at:new Date().toISOString(),updated_at:new Date().toISOString(),last_message_at:new Date().toISOString()});
   return {rows:[]};
  }
  if(sql.startsWith('INSERT INTO hr_support_messages')){
   messages.push({id:params[0],thread_id:params[1],sender_wix_id:params[2],sender_role:params[3],body:params[4],created_at:new Date().toISOString()});
   return {rows:[]};
  }
  if(sql.startsWith('SELECT * FROM hr_support_threads WHERE id='))return {rows:threads.filter(x=>x.id===params[0])};
  if(sql.startsWith('SELECT t.*, (SELECT COUNT(')){
   const rows=sql.includes('WHERE t.member_wix_id=$1')?threads.filter(x=>x.member_wix_id===params[0]):threads;
   return {rows:rows.map(x=>({...x,unread_count:messages.filter(m=>m.thread_id===x.id&&m.sender_role!=='admin').length}))};
  }
  if(sql.startsWith('SELECT id,sender_role,body,created_at FROM hr_support_messages'))
   return {rows:messages.filter(x=>x.thread_id===params[0]).slice().reverse()};
  if(sql.startsWith('UPDATE hr_support_threads SET last_message_at')){
   const t=threads.find(x=>x.id===params[0]);t.status=params[1];return {rows:[]};
  }
  if(sql.startsWith('UPDATE hr_support_threads SET status=')){
   const t=threads.find(x=>x.id===params[1]);t.status=params[0];return {rows:[]};
  }
  if(sql.startsWith('UPDATE hr_support_threads SET admin_last_read_at=')||sql.startsWith('UPDATE hr_support_threads SET member_last_read_at='))return {rows:[]};
  if(sql.startsWith('SELECT COUNT(*)::integer AS count FROM hr_support_presence'))return {rows:[{count:presence.length}]};
  if(sql.startsWith('INSERT INTO hr_support_presence')){if(!presence.includes(params[0]))presence.push(params[0]);return {rows:[]};}
  throw Error('Mock support SQL not implemented: '+sql.slice(0,130));
 },
 async connect(){return {query:async(q,p=[])=>['BEGIN','COMMIT','ROLLBACK'].includes(q)?{rows:[]}:db.query(q,p),release(){}};}
};
const {createRequire}=require('node:module');
const handler=createSupportHandler({
 pool:db,
 json:(res,status,value)=>{res.status=status;res.data=value;},
 read:async req=>req.body||{},
 auth:async req=>{if(!req.user){const e=new Error('Login required');e.status=401;throw e;}return req.user;},
 rate:()=>{},
 error:(status,message)=>Object.assign(new Error(message),{status}),
 limit:(value,n)=>String(value??'').trim().slice(0,n),
 uuid:value=>/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(value)
});
async function request(method,path,user,body){
 const res={status:0,data:null};
 try{await handler({user,body},res,path,method);}catch(error){res.status=error.status||500;res.data={error:error.message};}
 return res;
}
const cand={id:'candidate-a',email:'candidate@example.invalid',role:'candidate'};
const other={id:'candidate-b',email:'different@example.invalid',role:'candidate'};
const recruiter={id:'recruiter-a',email:'recruiter@example.invalid',role:'recruiter'};
const admin={id:'admin-a',email:'supervisor@example.invalid',role:'admin'};
async function main(){
 assert.equal((await request('GET','/api/support/threads',null)).status,401);
 assert.equal((await request('GET','/api/support/presence',cand)).data.online,false);
 assert.equal((await request('POST','/api/support/presence',cand)).status,403);
 const first=await request('POST','/api/support/threads',cand,{category:'Candidature & quiz',subject:'Quiz completed but blocked',message:'I completed the quiz and cannot apply.'});
 assert.equal(first.status,201);
 const id=first.data.id;
 assert.equal(threads.length,1);assert.equal(messages.length,1);
 assert.equal((await request('GET','/api/support/threads',other)).data.items.length,0);
 assert.equal((await request('GET','/api/support/threads/'+id+'/messages',other)).status,403);
 assert.equal((await request('GET','/api/support/threads/'+id+'/messages',recruiter)).status,403);
 const list=await request('GET','/api/support/threads',admin);assert.equal(list.status,200);assert.equal(list.data.items.length,1);
 const reply=await request('POST','/api/support/threads/'+id+'/messages',admin,{message:'Your quiz is being reviewed.'});
 assert.equal(reply.status,201);
 assert.equal((await request('PATCH','/api/support/threads/'+id+'/status',cand,{status:'CLOSED'})).status,403);
 assert.equal((await request('PATCH','/api/support/threads/'+id+'/status',admin,{status:'RESOLVED'})).status,200);
 const read=await request('GET','/api/support/threads/'+id+'/messages',cand);
 assert.equal(read.status,200);assert.equal(read.data.items.length,2);
 assert.equal(read.data.items[0].senderRole,'candidate');assert.equal(read.data.items[1].senderRole,'admin');
 assert.equal((await request('POST','/api/support/presence',admin)).status,200);
 assert.equal((await request('GET','/api/support/presence',cand)).data.online,true);
 assert.equal((await request('POST','/api/support/threads',cand,{category:'Autre',subject:'Bad message',message:'too short'})).status,422);
 console.log('PASS 13 customer support security, presence and conversation checks (mock data only).');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
