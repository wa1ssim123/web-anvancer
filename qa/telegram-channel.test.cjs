'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {normalizeTelegramUrl,createCommunityHandler}=require('../backend/community.cjs');
const LINK='https://t.me/Horenova_Maroc';
const bad=(status,message)=>Object.assign(new Error(message),{status});
function harness(role='admin'){
 const data=new Map([['whatsapp','https://whatsapp.com/channel/0029Vb9VLZ5A2pLGFYQA6s2u']]),logs=[],rateKeys=[];
 const pool={async query(sql,args=[]){
   logs.push({sql,args});
   if(sql.includes("WHERE channel_type='telegram' LIMIT 1"))return {rows:data.get('telegram')?[{url:data.get('telegram'),updated_at:'2026-11-22'}]:[]};
   if(sql.includes("WHERE channel_type='whatsapp' LIMIT 1"))return {rows:data.get('whatsapp')?[{url:data.get('whatsapp'),updated_at:'2026-11-22'}]:[]};
   if(sql.startsWith('INSERT INTO hr_social_channels')){data.set('telegram',args[0]);return {rows:[{url:args[0],updated_at:'2026-11-22'}]}};
   if(sql.startsWith("DELETE FROM hr_social_channels WHERE channel_type='telegram'")){data.delete('telegram');return {rows:[]}};
   if(sql.includes('INSERT INTO hr_audit'))return {rows:[]};
   throw Error('Unexpected SQL: '+sql);
 }};
 const handler=createCommunityHandler({
   pool,json:(res,status,body)=>({status,body}),
   read:async req=>req.body,rate:key=>rateKeys.push(key),
   auth:async req=>{if(!req.user)throw bad(401,'Login');return req.user},
   requireRole:(user,allowed)=>{if(!allowed.includes(user.role))throw bad(403,'Forbidden')},
   error:bad
 });
 const call=(method,body,userRole=role,path='/api/community/telegram')=>handler({body,user:userRole?{id:'user',role:userRole}:null},{},path,method);
 return {call,logs,rateKeys,data};
}
test('No fake Telegram channel is exposed until admin configures it',async()=>{
 const h=harness();
 assert.deepEqual((await h.call('GET',null,null)).body,{active:false,url:null,updatedAt:null});
 assert.equal(h.data.get('whatsapp'),'https://whatsapp.com/channel/0029Vb9VLZ5A2pLGFYQA6s2u');
});
test('Only admin may publish or remove a Telegram URL',async()=>{
 for(const role of [null,'candidate','recruiter']){
  const h=harness(role);
  for(const method of ['PATCH','DELETE'])
   await assert.rejects(h.call(method,{url:LINK},role),{status:role?403:401});
  assert.ok(!h.data.has('telegram'));
 }
});
test('Telegram publisher normalizes real public channel username',async()=>{
 const h=harness();
 assert.equal(normalizeTelegramUrl('  https://telegram.me/Horenova_Maroc/ '),LINK);
 const r=await h.call('PATCH',{url:'https://telegram.me/Horenova_Maroc/'});
 assert.equal(r.status,200);assert.equal(r.body.url,LINK);
 const pub=await h.call('GET',null,null);
 assert.equal(pub.body.active,true);assert.equal(pub.body.url,LINK);
 assert.equal(h.data.get('whatsapp'),'https://whatsapp.com/channel/0029Vb9VLZ5A2pLGFYQA6s2u','WhatsApp must be unaffected');
 assert.equal(h.logs.filter(x=>x.sql.includes("TELEGRAM_CHANNEL_LINK_UPDATED")).length,1);
});
test('Telegram rejects malicious URLs, private invites, and unrelated Telegram links',async()=>{
 const cases=['http://t.me/Horenova_Maroc','https://t.me.evil.net/Horenova_Maroc','https://t.me/+PrivateInviteHash','https://t.me/joinchat/AAAAAA',
 'https://t.me/share/url','https://t.me/s/Horenova_Maroc','https://t.me/ab','https://t.me/123456',
 'https://t.me/Horenova_Maroc?next=evil','https://t.me/Horenova_Maroc#foo',
 'https://t.me@evil.net/Horenova_Maroc','https://t.me:444/Horenova_Maroc','javascript:alert(1)',{},null];
 for(const url of cases){
  const h=harness();await assert.rejects(h.call('PATCH',{url}),{status:422},String(url));
  assert.equal(h.data.has('telegram'),false);
 }
});
test('Deleting Telegram never deletes WhatsApp and audit remains recorded',async()=>{
 const h=harness();
 await h.call('PATCH',{url:LINK});await h.call('DELETE');
 assert.deepEqual((await h.call('GET',null,null)).body,{active:false,url:null,updatedAt:null});
 assert.ok(h.data.has('whatsapp'));
 assert.equal(h.logs.filter(x=>x.sql.includes("TELEGRAM_CHANNEL_LINK_REMOVED")).length,1);
});
