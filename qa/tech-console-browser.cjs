'use strict';
/* Browser integration for authenticated Tech Pro UI with mocked server; no live account changes. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const fakeHub=`
const vid='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',pid='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
let venues=[],products=[],sales=[],moves=[];
function result(){return {venue:venues[0],products:products.map(x=>({...x})),summary:{salesCount:sales.length,revenueCentimes:sales.reduce((n,s)=>n+s.totalCentimes,0),stockAlerts:products.filter(p=>p.stock<=5).length}};}
export async function hub(url,options={}){
const method=options.method||'GET',d=options.body||{},seg=url.split('/');
if(url==='/api/tech/venues'){
  if(method==='GET')return {venues};
  if(method==='POST'){let v={id:vid,name:d.name,city:d.city,slug:'mock-restaurant-aaaaaaaaaa',status:'PILOT'};venues=[v];return {venue:v};}
}
if(!venues.length)throw Error('No establishment');
if(seg.length===5&&method==='GET')return result();
if(url.endsWith('/products')&&method==='POST'){
  products.push({id:pid,name:d.name,category:d.category,priceCentimes:d.priceCentimes,stock:d.stock,sku:d.sku,menuVisible:d.menuVisible,active:true});
  return {ok:true};
}
if(url.includes('/products/')&&method==='PATCH'){
  const p=products.find(x=>x.id===seg.at(-1));Object.assign(p,d);return {ok:true};
}
if(url.endsWith('/stock')&&method==='POST'){
  const p=products.find(x=>x.id===d.productId);if(p.stock+d.delta<0)throw Error('Insufficient stock');
  p.stock+=d.delta;moves.unshift({productName:p.name,delta:d.delta,reason:d.reason,createdAt:new Date().toISOString()});return {ok:true};
}
if(url.endsWith('/sales')&&method==='POST'){
  const totalCentimes=d.items.reduce((s,i)=>s+products.find(p=>p.id===i.productId).priceCentimes*i.quantity,0);
  for(const x of d.items)products.find(p=>p.id===x.productId).stock-=x.quantity;
  sales.unshift({id:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',table:d.table,totalCentimes,createdAt:new Date().toISOString()});
  return {ok:true,totalCentimes};
}
if(url.endsWith('/sales')&&method==='GET')return {sales};
if(url.endsWith('/movements')&&method==='GET')return {movements:moves};
throw Error('Unexpected mocked endpoint '+method+' '+url);
}`;
(async()=>{
const browser=await chromium.launch({headless:true});
try {
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>localStorage.setItem('mihna-lang','fr'));
await page.route('**/*',async route=>{
const u=new URL(route.request().url());
if(u.hostname!=='horenova.test')return route.fulfill({status:204,body:''});
if(u.pathname==='/mihna-global.js')return route.fulfill({status:200,contentType:'application/javascript',body:"export async function requireRole(){return {role:'recruiter'};}"});
if(u.pathname==='/hn-api.js')return route.fulfill({status:200,contentType:'application/javascript',body:fakeHub});
const file=path.join(root,u.pathname.replace(/^\//,''));
if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404});
const ct=file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'image/svg+xml';
return route.fulfill({status:200,contentType:ct,body:fs.readFileSync(file)});
});
await page.goto('https://horenova.test/tech-console.html',{waitUntil:'load'});
await page.locator('#proWorkspace:visible').waitFor({timeout:15000});
await page.locator('#emptyCreateVenue').click();
await page.locator('#venueForm [name="name"]').fill('Restaurant Atlas');
await page.locator('#venueForm [name="city"]').fill('Casablanca');
await page.locator('#venueForm button[type=submit]').click();
await page.locator('#venueHeading').getByText('Restaurant Atlas').waitFor({timeout:5000});
await page.locator('[data-tab="catalog"]').click();
await page.locator('#productForm [name="name"]').fill('Espresso');
await page.locator('#productForm [name="category"]').fill('Café');
await page.locator('#productForm [name="price"]').fill('22.00');
await page.locator('#productForm [name="stock"]').fill('10');
await page.locator('#productForm button[type=submit]').click();
await page.locator('#proCatalogRows .pro-catalog-row').first().waitFor({timeout:5000});
await page.locator('#proCatalogRows button:has-text("Modifier")').click();
await page.locator('#productFormTitle').getByText('Modifier Espresso').waitFor({timeout:5000});
await page.locator('#productForm [name="price"]').fill('24.00');
await page.locator('#productSubmit').click();
await page.waitForFunction(()=>document.querySelector('#proCatalogRows')?.textContent.includes('24,00'));
await page.locator('[data-tab="sale"]').click();
await page.getByRole('button',{name:'Ajouter Espresso au ticket'}).click();
await page.locator('#proCartTotal').getByText('24,00 DH').waitFor();
await page.locator('#proCheckout').click();
await page.waitForFunction(()=>document.querySelector('#proSalesCount')?.textContent==='1');
assert.match(await page.locator('#proRevenue').textContent(),/24,00/);
await page.locator('[data-tab="stock"]').click();
await page.locator('#stockProduct').selectOption('cccccccc-cccc-4ccc-8ccc-cccccccccccc');
await page.locator('#stockForm [name="delta"]').fill('5');
await page.locator('#stockForm [name="reason"]').fill('Réception fournisseur');
await page.locator('#stockForm button[type=submit]').click();
await page.locator('#stockMovements').getByText('Réception fournisseur').waitFor({timeout:5000});
await page.locator('[data-tab="menu"]').click();
assert.match(await page.locator('#publicMenuLink').getAttribute('href'),/tech-menu\.html\?slug=mock-restaurant/);
assert.match(await page.locator('#menuQrImage').getAttribute('src'),/^https:\/\/quickchart\.io\/qr\?/);
const box=await page.evaluate(()=>({width:document.documentElement.scrollWidth,view:innerWidth}));
assert.ok(box.width<=box.view+2,'Tech Pro horizontal scroll '+JSON.stringify(box));
assert.deepEqual(errors,[],'Browser JS errors: '+errors.join('; '));
console.log('PASS HORENOVA TECH PRO authenticated UI: create venue, add/edit article, POS sale, stock receipt and NFC link on mobile');
await context.close();
}finally{await browser.close();}
})().catch(e=>{console.error('FAIL HORENOVA TECH PRO: '+e.stack);process.exitCode=1;});