'use strict';
/* Private channel configuration regression tests; no real user/account mutation. */
const test=require('node:test'),assert=require('node:assert/strict');
const {createCommunityHandler,normalizeChannelUrl}=require('../backend/community.cjs');
const VALID='https://whatsapp.com/channel/0029VaABCDEFGH12345';
const problem=(status,message)=>Object.assign(new Error(message),{status});
function createHarness(role='admin'){
 let record=null;const writes=[],rates=[];
 const pool={async query(sql,args=[]){
   if(sql.includes('SELECT url,updated_at FROM hr_social_channels'))
     return {rows:record?[{url:record,updated_at:'2026-11-22'}]:[]};
   if(sql.includes('INSERT INTO hr_social_channels')){
     record=args[0];writes.push({type:'upsert',args});return {rows:[{url:record,updated_at:'2026-11-22'}]};
   }
   if(sql.startsWith('DELETE FROM hr_social_channels')){record=null;writes.push({type:'delete'});return {rows:[]}};
   if(sql.includes('INSERT INTO hr_audit')){writes.push({type:'audit',args});return {rows:[]}};
   throw Error('Unexpected query: '+sql);
 }};
 const handler=createCommunityHandler({
   pool,rate:(...args)=>rates.push(args),json:(res,status,body)=>({status,body}),
   read:async req=>req.body,auth:async req=>{if(!req.user)throw problem(401,'Not signed in');return req.user;},
   requireRole:(user,allowed)=>{if(!allowed.includes(user.role))throw problem(403,'Forbidden');},
   error:problem
 });
 const run=(method,body,userRole=role)=>handler({body,user:userRole?{id:'user-123',role:userRole}:null},{},'/api/community/channel',method);
 return{run,writes,rates,get url(){return record;}};
}
test('No official channel URL means no misleading link for visitors',async()=>{
 const h=createHarness();const response=await h.run('GET',undefined,null);
 assert.deepEqual(response.body,{active:false,url:null,updatedAt:null});
 assert.equal(h.writes.length,0);
});
test('Published link is visible publicly but contains no admin identity',async()=>{
 const h=createHarness();
 await h.run('PATCH',{url:VALID});
 const pub=await h.run('GET',undefined,null);
 assert.equal(pub.status,200);
 assert.equal(pub.body.active,true);
 assert.equal(pub.body.url,VALID);
 assert.ok(!JSON.stringify(pub.body).includes('user-123'));
});
test('Only verified admins can configure or delete the public WhatsApp channel',async()=>{
 for(const role of ['candidate','recruiter',null]){
  const h=createHarness(role);
  for(const method of ['PATCH','DELETE']){
   await assert.rejects(h.run(method,{url:VALID},role),{status:role===null?401:403});
  }
  assert.equal(h.writes.length,0);
 }
});
test('Valid official URLs are normalized to their canonical form',()=>{
 assert.equal(normalizeChannelUrl(' https://www.whatsapp.com/channel/0029VaABCDEFGH12345/ '),VALID);
});
test('Reject fake WhatsApp, XSS, credentials, tracking and unrelated WhatsApp links',async()=>{
 const harmful=[
  'https://whatsapp.com.evil.net/channel/0029VaABCDEFGH12345',
  'http://whatsapp.com/channel/0029VaABCDEFGH12345',
  'https://wa.me/212648377009',
  'https://whatsapp.com/send?phone=212648377009',
  'javascript:alert(1)','https://whatsapp.com@evil.net/channel/0029VaABCDEFGH12345',
  'https://whatsapp.com/channel/short',
  'https://whatsapp.com/channel/0029VaABCDEFGH12345?redirect=evil',
  'https://whatsapp.com/channel/0029VaABCDEFGH12345#test',
  'https://whatsapp.com/channel/0029VaABCDEFGH12345?utm_source=foo',
  'https://whatsapp.com:444/channel/0029VaABCDEFGH12345',
  '<img src=x onerror=alert(1)>',42,null,undefined
 ];
 for(const value of harmful){
  const h=createHarness();
  await assert.rejects(h.run('PATCH',{url:value}),{status:422},String(value));
  assert.equal(h.writes.length,0,'No persistence from forged URL');
 }
});
test('Changing and removing the channel is audited and cannot be done anonymously',async()=>{
 const h=createHarness();
 await h.run('PATCH',{url:VALID});
 assert.equal(h.writes.filter(x=>x.type==='audit').length,1);
 const result=await h.run('DELETE');
 assert.equal(result.body.active,false);
 assert.equal(h.url,null);
 assert.equal(h.writes.filter(x=>x.type==='audit').length,2);
});
test('Invalid route fails closed',async()=>{
 const h=createHarness();
 await assert.rejects(h.run('HEAD'),{status:405});
 assert.equal(h.writes.length,0);
});
