'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createSocialPublisher,composePublication,tokenIsValid,publicLink}=require('../backend/social-publisher.cjs');
const ID='11111111-1111-4111-8111-111111111111';
const TOKEN='123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const item={id:ID,request_id:ID,job_title:'Chef pâtissier',
 business_name:'Hôtel HORENOVA',city:'Casablanca',kind:'job',
 status:'VALIDEE',removed_at:null,url:'https://t.me/HorenovaMaroc'};
const fakePool=(opts={})=>{
 let state=opts.state||'pending',attempts=0;
 const calls=[];
 return{
  calls,get state(){return state},get attempts(){return attempts},
  async query(sql,params=[]){
   calls.push({sql,params});
   if(!sql.includes('WITH claimed AS') && sql.includes('FROM hr_social_publications p JOIN hr_recruiter_requests r'))return {
    rows:[{...item,request_id:ID,channel:'telegram',status:state,attempts,
     telegram_message_id:state==='published'?42:null,last_error:null,sent_at:null}]};
   if(sql.includes('SELECT channel_type,url FROM hr_social_channels'))return {rows:[{channel_type:'telegram',url:item.url}]};
   if(sql.includes('WITH claimed AS')){
    if(state!=='pending'||opts.approved===false||opts.channelActive===false)return{rows:[]};
    state='sending';attempts++;return{rows:[item]};
   }
   if(sql.includes("SELECT 1 FROM hr_recruiter_requests WHERE id=$1 AND status='VALIDEE'")){
    return{rows:opts.approved===false?[]:[{exists:1}]};
   }
   if(sql.includes("status='published'")){if(state==='sending')state='published';return{rows:[{request_id:ID}]}};
   if(sql.includes("status='needs_review'")&&sql.includes('SET status=')){if(state==='sending')state='needs_review';return{rows:[]}};
   if(sql.includes("status='cancelled'")){state='cancelled';return{rows:[]}};
   if(sql.includes("SET status='pending'")){if(state==='needs_review'&&opts.approved!==false){state='pending';return{rows:[{request_id:ID}]}}return{rows:[]}};
   if(sql.includes("WHERE channel='telegram' AND status='sending'"))return{rows:[]};
   throw Error('Unexpected SQL '+sql);
  }
 }
};
test('Social post contains only public fields and canonical link',()=>{
 const text=composePublication({...item,job_title:'Chef contact@private.com +212612345678 https://evil.net'});
 assert.ok(text.includes(publicLink(ID)));
 assert.ok(!text.includes('contact@private.com'));
 assert.ok(!text.includes('612345678'));
 assert.ok(!text.includes('evil.net'));
 assert.ok(text.includes('Casablanca'));
 assert.ok(text.includes('EMPLOI'));
 assert.equal(tokenIsValid('TEST'),false);
});
test('No Telegram bot credential means no automatic publication and no token exposure',async()=>{
 const pool=fakePool();
 const publisher=createSocialPublisher({pool,token:undefined});
 // Default token is deliberately unset in the test runner.
 assert.equal(publisher.configured(),false);
 await publisher.run();
 assert.equal(pool.calls.length,0);
});
test('Telegram publishes once, uses official Bot API and never resends a completed job',async()=>{
 const pool=fakePool(),requests=[];
 const publisher=createSocialPublisher({
  pool,token:TOKEN,
  fetchImpl:async(url,options)=>{
   requests.push({url,options});
   return {ok:true,status:200,json:async()=>({ok:true,result:{message_id:42}})}
  }});
 await publisher.run();
 assert.equal(pool.state,'published');
 await publisher.run();
 assert.equal(requests.length,1,'idempotent: one send only');
 const args=JSON.parse(requests[0].options.body);
 assert.equal(args.chat_id,'@HorenovaMaroc');
 assert.ok(args.text.includes('/job.html?id='+ID));
 assert.ok(!args.text.includes('candidate_email'));
 const {configured,rows}=await publisher.status();
 assert.equal(configured,true);
 assert.equal(rows[0].status,'published');
 assert.ok(!JSON.stringify(rows).includes(TOKEN),'secret must not reach admin status response');
});
test('Rejected or withdrawn vacancies can never be sent to a channel',async()=>{
 for(const option of [{approved:false},{channelActive:false}]){
  const pool=fakePool(option);let sends=0;
  const publisher=createSocialPublisher({pool,token:TOKEN,fetchImpl:async()=>{sends++;return{}}});
  await publisher.run();
  assert.equal(sends,0);
  assert.equal(pool.state,'pending');
 }
});
test('Unknown Telegram outcome cannot automatically resend and needs review',async()=>{
 const pool=fakePool(),requests=[];
 const pub=createSocialPublisher({pool,token:TOKEN,log:{warn(){}},
  fetchImpl:async(url)=>{requests.push(url);throw Error('Timeout after sending')}});
 await pub.run();assert.equal(pool.state,'needs_review');
 await pub.run();assert.equal(requests.length,1,'must never blind-retry ambiguous delivery');
});
test('Telegram error 403 is visible for manual review, not treated as published',async()=>{
 const pool=fakePool();const pub=createSocialPublisher({
  pool,token:TOKEN,log:{warn(){}},
  fetchImpl:async()=>({ok:false,status:403,json:async()=>({ok:false,error_code:403})})});
 await pub.run();
 assert.equal(pool.state,'needs_review');
 assert.equal(pool.attempts,1);
});

test('Reapproved offers revive only unsent publications and never blindly resend',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const schema=fs.readFileSync(path.join(__dirname,'../backend/social-publications-schema.sql'),'utf8');
 assert.match(schema,/ON CONFLICT\(request_id,channel\) DO UPDATE/);
 assert.match(schema,/hr_social_publications\.status='cancelled'/);
 assert.match(schema,/hr_social_publications\.attempts=0/);
 assert.match(schema,/hr_social_publications\.sent_at IS NULL/);
 assert.match(schema,/hr_social_publications\.telegram_message_id IS NULL/);
 assert.match(schema,/hr_social_publications\.attempts>0[\s\S]*?THEN 'needs_review'/);
 assert.match(schema,/ELSE hr_social_publications\.status/,'Keep delivered or in-flight states unchanged');
 assert.doesNotMatch(schema,/ON CONFLICT\(request_id,channel\) DO NOTHING/);
});
