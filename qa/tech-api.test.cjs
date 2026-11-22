'use strict';
/* Isolated unit suite for HORENOVA TECH transactional backend without production DB mutation. */
const test=require('node:test');
const assert=require('node:assert/strict');
const {createTechHandler}=require('../backend/tech.cjs');
const OWN='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const VENUE='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const PRODUCT='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const SALE='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const makeError=(status,message)=>Object.assign(new Error(message),{status});
const venue={id:VENUE,owner_wix_id:OWN,name:'Café test',slug:'cafe-test-1234567890',city:'Casablanca',status:'PILOT'};
const product={id:PRODUCT,name:'Espresso',price_centimes:2200,stock_qty:10,active:true,category:'Café',sku:null,menu_visible:true};
function createHarness({role='recruiter',userId=OWN,body={},respond,stock=10,existingSale=false}={}){
 const calls=[];
 let jsonResponse=null,authCalls=0,updates=0,committed=false,rolledBack=false;
 const user={id:userId,role};
 const pool={
  async query(sql,params){
    calls.push({sql,params});
    if(/SELECT \* FROM ht_venues WHERE id/.test(sql))return {rows:[venue]};
    if(/SELECT id,name,city FROM ht_venues/.test(sql))return {rows:[{id:VENUE,name:venue.name,city:venue.city}]};
    if(/SELECT id,sku,name,category/.test(sql))return {rows:[product]};
    if(/INSERT INTO ht_venues/.test(sql))return {rows:[{...venue,created_at:'2026-11-21'}]};
    return {rows:[]};
  },
  async connect(){
    return {release(){},async query(sql,params){
      calls.push({sql,params});
      if(sql==='COMMIT'){committed=true;return {rows:[]};}
      if(sql==='ROLLBACK'){rolledBack=true;return {rows:[]};}
      if(sql==='BEGIN')return {rows:[]};
      if(sql.includes('SELECT id,total_centimes FROM ht_sales'))return {rows:existingSale?[{id:SALE,total_centimes:4400}]:[]};
      if(sql.includes('SELECT product_id,quantity FROM ht_sale_lines'))return {rows:[{product_id:PRODUCT,quantity:2}]};
      if(sql.includes('FROM ht_products')&&sql.includes('FOR UPDATE'))return {rows:[{...product,stock_qty:stock}]};
      if(sql.includes('INSERT INTO ht_sales'))return {rows:[{id:SALE,created_at:'2026-11-21'}]};
      if(sql.includes('UPDATE ht_products')){updates++;return {rows:[{...product,stock_qty:stock+(params[0]||0)}]};}
      if(sql.includes('INSERT INTO ht_stock_movements'))return {rows:[]};
      if(sql.includes('INSERT INTO ht_sale_lines'))return {rows:[]};
      if(sql.includes('INSERT INTO ht_products'))return {rows:[product]};
      return {rows:[]};
    }};
  }
 };
 const handler=createTechHandler({
  pool,read:async()=>body,rate:()=>{},auth:async()=>{authCalls++;return user},
  requireRole:(u,allowed)=>{if(!allowed.includes(u.role))throw makeError(403,'forbidden');},
  error:makeError,limit:(value,n=120)=>String(value??'').trim().slice(0,n),
  uuid:id=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id),
  json:(res,status,data)=>{jsonResponse={status,data};return jsonResponse;}
 });
 const req={socket:{remoteAddress:'127.0.0.1'}};
 return {handler,req,calls,pool,get response(){return jsonResponse;},get authCalls(){return authCalls;},get updates(){return updates;},get committed(){return committed;},get rolledBack(){return rolledBack;}};
}
test('public NFC menu exposes only public restaurant and visible product fields, no auth',async()=>{
 const h=createHarness();const r=await h.handler(h.req,{},'/api/tech/menu/cafe-test-1234567890','GET');
 assert.equal(r.status,200);
 assert.equal(h.authCalls,0);
 assert.equal(r.data.venue.name,'Café test');
 assert.ok(!('owner_wix_id' in r.data.venue));
 assert.deepEqual(Object.keys(r.data.items[0]).sort(),['category','id','name','priceCentimes'].sort());
});
test('merchant role is checked on every protected route',async()=>{
 const h=createHarness({role:'candidate'});
 await assert.rejects(h.handler(h.req,{},'/api/tech/venues','GET'),{status:403});
 assert.equal(h.authCalls,1);
});
test('tenant isolation rejects venue not owned by authenticated recruiter',async()=>{
 const h=createHarness({userId:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'});
 await assert.rejects(h.handler(h.req,{},'/api/tech/venues/'+VENUE,'GET'),{status:404});
});
test('sale is committed atomically with stock and immutable ledger entries',async()=>{
 const h=createHarness({body:{reference:'test-sale-00001',table:'07',items:[{productId:PRODUCT,quantity:2}]}});
 const r=await h.handler(h.req,{},'/api/tech/venues/'+VENUE+'/sales','POST');
 assert.equal(r.status,201);
 assert.equal(r.data.totalCentimes,4400);
 assert.equal(h.committed,true);assert.equal(h.rolledBack,false);assert.equal(h.updates,1);
 assert.ok(h.calls.some(x=>x.sql.includes('INSERT INTO ht_sale_lines')));
 assert.ok(h.calls.some(x=>x.sql.includes('INSERT INTO ht_stock_movements')));
});
test('insufficient stock rejects sale and rolls back without mutations',async()=>{
 const h=createHarness({body:{reference:'test-sale-00002',table:'07',items:[{productId:PRODUCT,quantity:2}]},stock:1});
 await assert.rejects(h.handler(h.req,{},'/api/tech/venues/'+VENUE+'/sales','POST'),{status:409});
 assert.equal(h.rolledBack,true);assert.equal(h.committed,false);assert.equal(h.updates,0);
});
test('client reference deduplicates repeated sales before stock mutation',async()=>{
 const h=createHarness({body:{reference:'test-sale-00002',items:[{productId:PRODUCT,quantity:2}]},existingSale:true});
 const r=await h.handler(h.req,{},'/api/tech/venues/'+VENUE+'/sales','POST');
 assert.equal(r.status,200);assert.equal(r.data.duplicate,true);assert.equal(h.updates,0);
});
test('altered duplicate receipt cannot silently masquerade as previous sale',async()=>{
 const h=createHarness({body:{reference:'test-sale-00002',items:[{productId:PRODUCT,quantity:1}]},existingSale:true});
 await assert.rejects(h.handler(h.req,{},'/api/tech/venues/'+VENUE+'/sales','POST'),{status:409});
 assert.equal(h.updates,0);
});
test('malformed item fails with validation error rather than internal crash',async()=>{
 const h=createHarness({body:{reference:'test-sale-00002',items:[null]}});
 await assert.rejects(h.handler(h.req,{},'/api/tech/venues/'+VENUE+'/sales','POST'),{status:422});
 assert.equal(h.updates,0);
});
test('UUID case cannot corrupt the cart-to-inventory quantity mapping',async()=>{
 const h=createHarness({body:{reference:'test-sale-00004',items:[{productId:PRODUCT.toUpperCase(),quantity:1}]}});
 const result=await h.handler(h.req,{},'/api/tech/venues/'+VENUE+'/sales','POST');
 assert.equal(result.status,201);assert.equal(result.data.totalCentimes,2200);
});
test('zero or negative sale quantities are rejected',async()=>{
 const h=createHarness({body:{reference:'test-sale-00003',items:[{productId:PRODUCT,quantity:0}]}});
 await assert.rejects(h.handler(h.req,{},'/api/tech/venues/'+VENUE+'/sales','POST'),{status:422});
 assert.equal(h.updates,0);
});
test('creates a venue scoped to the authenticated owner identity',async()=>{
 const h=createHarness({body:{name:'Mon Restaurant',city:'Casablanca'}});
 const r=await h.handler(h.req,{},'/api/tech/venues','POST');
 assert.equal(r.status,201);
 const insert=h.calls.find(x=>x.sql.includes('INSERT INTO ht_venues'));
 assert.ok(insert);assert.equal(insert.params[0],OWN);
 assert.match(insert.params[3],/^mon-restaurant-[0-9a-f]{10}$/);
});