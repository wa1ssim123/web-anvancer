'use strict';
/* Regression suite for admin-only analytics, historical backfill and session dedup.
 * Operates exclusively on in-memory database mocks. Never touches real members. */
const test=require('node:test');
const assert=require('node:assert/strict');
const {createAnalyticsHandler}=require('../backend/analytics.cjs');
const MEMBER='b1111111-1111-4111-8111-111111111111';
const SESSION='c2222222-2222-4222-8222-222222222222';
const OTHER='d3333333-3333-4333-8333-333333333333';
const validUUID=s=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
const fail=(status,message)=>Object.assign(new Error(message),{status});
function harness({role='admin',id='admin-test',rejectAuth=false}={}){
 const calls=[],sessions=new Map(),roles=new Map([['old-candidate','candidate'],['old-recruiter','recruiter']]);
 const pool={
  async query(sql,args=[]){
   calls.push({sql,args});
   if(sql.startsWith('INSERT INTO hr_analytics_sessions')){
    if(!sessions.has(args[0]))sessions.set(args[0],args[1]);
    return {rowCount:1,rows:[]};
   }
   if(sql.startsWith('INSERT INTO hr_analytics_roles')){
    roles.set(args[0],args[1]);return {rowCount:1,rows:[]};
   }
   if(sql.includes('GROUP BY role')&&!sql.includes('registered_at'))return {rows:[{role:'candidate',total:27},{role:'recruiter',total:8}]};
   if(sql.includes('AS unique_browsers'))return {rows:[{sessions:sessions.size,unique_browsers:new Set([...sessions.values()]).size,today_sessions:sessions.size,last_7_days:sessions.size,first_recorded:null}]};
   if(sql.includes('FROM hr_analytics_wix_summary'))return {rows:[{first_day:'2026-11-10',through_day:'2026-11-22',sessions:318,unique_visitors:253,imported_at:'2026-11-22T20:00:00Z'}]};
   if(sql.includes('FROM hr_analytics_wix_daily'))return {rows:[{day:'2026-11-20',sessions:160,daily_unique_visitors:142}]};
   if(sql.includes('FROM hr_analytics_sessions WHERE'))return {rows:[]};
   if(sql.includes('FROM hr_analytics_roles WHERE'))return {rows:[]};
   throw Error('Unexpected SQL '+sql.slice(0,120));
  }
 };
 let response;
 const handler=createAnalyticsHandler({
  pool,json:(res,status,data)=>{response={status,data};return response;},
  read:async(req)=>req.body,
  rate:()=>{},
  auth:async()=>{if(rejectAuth)throw fail(401,'Connexion nécessaire');return {id,role};},
  requireRole:(u,allowed)=>{if(!allowed.includes(u.role))throw fail(403,'Non autorisé');},
  error:fail,uuid:validUUID
 });
 const req=body=>({body,socket:{remoteAddress:'127.0.0.1'}});
 return {handler,req,calls,sessions,roles,get response(){return response;}};
}
test('historical Wix member roles and traffic are returned to a real admin without merging sources',async()=>{
 const h=harness();
 const r=await h.handler(h.req(),{},'/api/analytics/admin','GET');
 assert.equal(r.status,200);
 assert.equal(r.data.registrations.candidates,27);
 assert.equal(r.data.registrations.recruiters,8);
 assert.equal(r.data.registrations.total,35);
 assert.equal(r.data.wixHistory.uniqueVisitors,253);
 assert.equal(r.data.wixHistory.sessions,318);
 assert.equal(r.data.firstParty.sessions,0);
 assert.equal(r.data.wixHistory.daily[0].sessions,160);
 assert.match(r.data.precision,/non additionnés/);
});
test('candidate and recruiter cannot retrieve aggregate private admin dashboard',async()=>{
 for(const role of ['candidate','recruiter','none']){
  const h=harness({role});
  await assert.rejects(h.handler(h.req(),{},'/api/analytics/admin','GET'),{status:403});
  assert.ok(!h.calls.some(x=>x.sql.includes('FROM hr_analytics_roles')));
 }
});
test('anonymous user cannot retrieve the admin dashboard',async()=>{
 const h=harness({rejectAuth:true});
 await assert.rejects(h.handler(h.req(),{},'/api/analytics/admin','GET'),{status:401});
});
test('visitor submission is unprivileged but stores only hashed random tokens',async()=>{
 const h=harness({role:'none'});
 const r=await h.handler(h.req({browserId:MEMBER,sessionId:SESSION}),{},'/api/analytics/visit','POST');
 assert.equal(r.status,200);
 const inserted=h.calls.find(x=>x.sql.startsWith('INSERT INTO hr_analytics_sessions'));
 assert.equal(inserted.args.length,2);
 assert.ok(inserted.args.every(x=>/^[a-f0-9]{64}$/.test(x)));
 assert.ok(!JSON.stringify(h.calls).includes(MEMBER));
 assert.ok(!JSON.stringify(h.calls).includes(SESSION));
});
test('same session token replays cannot increase visit count',async()=>{
 const h=harness();
 await h.handler(h.req({browserId:MEMBER,sessionId:SESSION}),{},'/api/analytics/visit','POST');
 await h.handler(h.req({browserId:MEMBER,sessionId:SESSION}),{},'/api/analytics/visit','POST');
 assert.equal(h.sessions.size,1,'Unique session hash is the primary key');
 const status=await h.handler(h.req(),{},'/api/analytics/admin','GET');
 assert.equal(status.data.firstParty.sessions,1);
});
test('same visitor across multiple sessions is one estimated unique browser',async()=>{
 const h=harness();
 await h.handler(h.req({browserId:MEMBER,sessionId:SESSION}),{},'/api/analytics/visit','POST');
 await h.handler(h.req({browserId:MEMBER,sessionId:OTHER}),{},'/api/analytics/visit','POST');
 const status=await h.handler(h.req(),{},'/api/analytics/admin','GET');
 assert.equal(status.data.firstParty.sessions,2);
 assert.equal(status.data.firstParty.uniqueBrowsers,1);
});
test('malformed browser IDs cannot contaminate the analytics totals',async()=>{
 for(const bad of ['not-uuid','<svg/onload=alert(1)>','','0'.repeat(200),null,15]){
  const h=harness();
  await assert.rejects(h.handler(h.req({browserId:bad,sessionId:SESSION}),{},'/api/analytics/visit','POST'),{status:422});
  assert.equal(h.calls.length,0);
 }
});
test('user-declared role cannot spoof an admin or recruiter registration',async()=>{
 const h=harness({role:'candidate',id:MEMBER});
 const result=await h.handler(h.req({role:'admin',id:OTHER}),{},'/api/analytics/role-sync','POST');
 assert.equal(result.status,200);
 const insert=h.calls.find(x=>x.sql.startsWith('INSERT INTO hr_analytics_roles'));
 assert.deepEqual(insert.args,[MEMBER,'candidate']);
});
test('anonymous and unassigned users cannot invent a membership role',async()=>{
 const unsigned=harness({rejectAuth:true});
 await assert.rejects(unsigned.handler(unsigned.req({role:'candidate'}),{},'/api/analytics/role-sync','POST'),{status:401});
 const noRole=harness({role:'none'});
 await assert.rejects(noRole.handler(noRole.req({role:'candidate'}),{},'/api/analytics/role-sync','POST'),{status:403});
});
test('role synchronization remains idempotent across multiple logins',async()=>{
 const h=harness({role:'recruiter',id:MEMBER});
 for(let i=0;i<5;i++)await h.handler(h.req({}),{},'/api/analytics/role-sync','POST');
 assert.equal(h.roles.get(MEMBER),'recruiter');
 assert.equal([...h.roles].filter(([id])=>id===MEMBER).length,1);
});
