import {requireRole} from '/mihna-global.js';
import {hub} from '/hn-api.js';

const $=id=>document.getElementById(id);
const make=(tag,klass,text)=>{const el=document.createElement(tag);if(klass)el.className=klass;if(text!==undefined)el.textContent=String(text);return el};
const money=centimes=>(Number(centimes)/100).toLocaleString('fr-MA',{minimumFractionDigits:2,maximumFractionDigits:2})+' DH';
const int=(x,min,max)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
let venues=[],venue=null,products=[],cart=new Map(),pendingSaleRef=null,requestBusy=false;
const showMessage=(text,isError=false)=>{const el=$('proAlert');el.textContent=text;el.classList.toggle('error',isError);};
const setStatus=(message,live=false)=>{$('serverStatus').textContent=message;$('serverIndicator').classList.toggle('online',live);};
const toggle=(id,on)=>{$(id).hidden=!on;};
const removeChildren=root=>root.replaceChildren();
const route=id=>'/api/tech/venues/'+encodeURIComponent(id);
function guard(fn){return async event=>{if(requestBusy)return;requestBusy=true;const btn=event?.submitter||event?.currentTarget;if(btn && 'disabled' in btn)btn.disabled=true;try{await fn(event)}catch(e){showMessage(e.message||'Erreur du service.',true)}finally{requestBusy=false;if(btn&&'disabled'in btn)btn.disabled=false;}}}
function venueSelect(){
  const el=$('venueSelect');el.replaceChildren(new Option('Sélectionner…',''));
  venues.forEach(v=>el.append(new Option(v.name+' · '+v.city,v.id)));
  if(venue)el.value=venue.id;
}
async function loadVenues(preferred){
  const r=await hub('/api/tech/venues');
  venues=r.venues||[];
  const known=venues.some(v=>v.id===preferred)?preferred:venues[0]?.id;
  if(!known){venue=null;products=[];venueSelect();toggle('venueEmpty',true);toggle('venueContent',false);$('venueHeading').textContent='Mon établissement';return;}
  venue=venues.find(v=>v.id===known);venueSelect();toggle('venueEmpty',false);toggle('venueContent',true);
  await loadVenue();
}
async function loadVenue(){
  if(!venue)return;
  const r=await hub(route(venue.id));
  venue=r.venue;
  products=r.products||[];
  $('venueHeading').textContent=venue.name;
  $('proSalesCount').textContent=String(r.summary.salesCount);
  $('proRevenue').textContent=money(r.summary.revenueCentimes).replace(' DH','');
  $('proAlerts').textContent=String(r.summary.stockAlerts);
  venueSelect();
  renderPOS();renderCatalog();renderMenuLink();renderStockSelection();
}
function empty(root,text){
  const p=make('p','pro-closed',text);
  root.append(p);
}
function cartTotal(){let sum=0;for(const [id,q]of cart){const p=products.find(x=>x.id===id);if(p)sum+=p.priceCentimes*q;}return sum;}
function addToCart(id){
  const p=products.find(x=>x.id===id);
  if(!p||!p.active||p.stock<=0)return;
  const qty=cart.get(id)||0;
  if(qty>=p.stock){showMessage('Stock insuffisant pour '+p.name,true);return;}
  cart.set(id,qty+1);pendingSaleRef=null;renderCart();
}
function changeQty(id,delta){
  const q=(cart.get(id)||0)+delta;const p=products.find(x=>x.id===id);
  if(!p)return;if(q>p.stock){showMessage('Quantité non disponible.',true);return;}
  if(q<=0)cart.delete(id);else cart.set(id,q);
  pendingSaleRef=null;renderCart();
}
function renderPOS(){
  const root=$('proProductButtons');removeChildren(root);
  const active=products.filter(p=>p.active);
  if(!active.length)empty(root,'Aucun article disponible. Ajoutez vos articles dans le catalogue.');
  for(const p of active){
    const b=make('button');b.type='button';b.disabled=p.stock<=0;
    b.setAttribute('aria-label','Ajouter '+p.name+' au ticket');
    b.append(make('strong','',p.name),make('span','',money(p.priceCentimes)+' · Stock '+p.stock));
    b.addEventListener('click',()=>addToCart(p.id));root.append(b);
  }
  renderCart();
}
function renderCart(){
  const root=$('proCartRows');removeChildren(root);
  for(const [id,q]of [...cart]){
    const p=products.find(x=>x.id===id);
    if(!p||!p.active){cart.delete(id);continue;}
    const row=make('div','pro-cart-row');
    const label=make('div');
    label.append(make('strong','',p.name),make('small','',money(p.priceCentimes*q)));
    const controls=make('div','pro-qty');
    const minus=make('button','','−');minus.type='button';minus.setAttribute('aria-label','Retirer '+p.name);
    const plus=make('button','','+');plus.type='button';plus.disabled=q>=p.stock;plus.setAttribute('aria-label','Ajouter '+p.name);
    minus.addEventListener('click',()=>changeQty(id,-1));plus.addEventListener('click',()=>changeQty(id,+1));
    controls.append(minus,make('b','',q),plus);row.append(label,controls);root.append(row);
  }
  if(!cart.size)empty(root,'Ticket vide. Touchez un produit pour commencer.');
  $('proCartTotal').textContent=money(cartTotal());
  $('proCheckout').disabled=!cart.size||requestBusy;
}
function renderCatalog(){
  const root=$('proCatalogRows');removeChildren(root);
  if(!products.length)empty(root,'Votre catalogue est vide.');
  products.forEach(p=>{
    const row=make('div','pro-catalog-row');
    const main=make('div');
    main.append(make('strong','',p.name),make('small','',p.category+' · '+(p.sku||'Sans SKU')+' · Stock '+p.stock));
    const side=make('div');
    side.append(make('span','pro-price',money(p.priceCentimes)+' '));
    const visible=make('button','',p.menuVisible?'Masquer menu':'Afficher menu');visible.type='button';
    visible.addEventListener('click',guard(async()=>{
      await hub(route(venue.id)+'/products/'+p.id,{method:'PATCH',body:{menuVisible:!p.menuVisible}});
      await loadVenue();showMessage('Visibilité du menu mise à jour.');
    }));
    const active=make('button','',p.active?'Désactiver':'Activer');active.type='button';
    active.addEventListener('click',guard(async()=>{
      await hub(route(venue.id)+'/products/'+p.id,{method:'PATCH',body:{active:!p.active}});
      await loadVenue();showMessage('Statut article mis à jour.');
    }));
    side.append(visible,active);row.append(main,side);root.append(row);
  });
}
function renderStockSelection(){
  const select=$('stockProduct');select.replaceChildren(new Option('Choisir l’article',''));
  products.forEach(p=>select.append(new Option(p.name+' (stock '+p.stock+')',p.id)));
}
async function loadStock(){
  if(!venue)return;
  const r=await hub(route(venue.id)+'/movements');
  const root=$('stockMovements');removeChildren(root);
  if(!r.movements?.length)empty(root,'Aucun mouvement enregistré.');
  for(const m of (r.movements||[])){
    const row=make('div','pro-move-row');
    const date=new Date(m.createdAt).toLocaleString('fr-MA');
    const label=make('div');
    label.append(make('strong','',m.productName+' · '+m.reason),make('small','',date));
    row.append(label,make('b','pro-price',(m.delta>0?'+':'')+m.delta));root.append(row);
  }
}
async function loadSales(){
  if(!venue)return;
  const r=await hub(route(venue.id)+'/sales');
  const root=$('proSaleHistory');removeChildren(root);
  if(!r.sales?.length)empty(root,'Aucune vente enregistrée.');
  for(const s of (r.sales||[])){
    const row=make('div','pro-history-row'),label=make('div');
    const d=new Date(s.createdAt);
    label.append(make('strong','','Table '+s.table),make('small','',Number.isNaN(d.getTime())?'Date inconnue':d.toLocaleString('fr-MA')));
    row.append(label,make('b','pro-price',money(s.totalCentimes)));root.append(row);
  }
}
function menuUrl(){
  const url=new URL('/tech-menu.html',location.origin);
  url.searchParams.set('slug',venue.slug);
  return url.toString();
}
function renderMenuLink(){
  if(!venue)return;
  const url=menuUrl();const link=$('publicMenuLink');link.href=url;link.textContent=url;
  $('openMenuLink').href=url;
  const qr='https://quickchart.io/qr?size=600&format=png&margin=3&dark=163b32&light=ffffff&text='+encodeURIComponent(url);
  $('menuQrImage').src=qr;$('downloadQrLink').href=qr;
}
function switchTab(id){
  const tabs=['sale','catalog','stock','history','menu'];
  if(!tabs.includes(id))id='sale';
  for(const tab of tabs){$('pro'+tab[0].toUpperCase()+tab.slice(1)).hidden=tab!==id;}
  document.querySelectorAll('[data-tab]').forEach(x=>{const chosen=x.dataset.tab===id;x.classList.toggle('active',chosen);x.setAttribute('aria-selected',String(chosen));});
  if(id==='history')loadSales().catch(e=>showMessage(e.message,true));
  if(id==='stock')loadStock().catch(e=>showMessage(e.message,true));
}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
$('venueSelect').addEventListener('change',guard(async e=>{
  const target=e.target.value;if(!target)return;
  cart.clear();pendingSaleRef=null;
  await loadVenues(target);showMessage('Établissement chargé.');
}));
const openVenueForm=()=>{toggle('venueForm',true);$('venueForm').querySelector('input[name="name"]').focus();};
$('newVenueToggle').addEventListener('click',()=>{toggle('venueForm',$('venueForm').hidden);});
$('emptyCreateVenue').addEventListener('click',openVenueForm);
$('venueForm').addEventListener('submit',guard(async e=>{
  e.preventDefault();
  const d=new FormData(e.currentTarget);
  const r=await hub('/api/tech/venues',{method:'POST',body:{name:String(d.get('name')||'').trim(),city:String(d.get('city')||'').trim()}});
  await loadVenues(r.venue.id);toggle('venueForm',false);e.currentTarget.reset();showMessage('Établissement créé et isolé. Ajoutez vos premiers articles.');
}));
$('productForm').addEventListener('submit',guard(async e=>{
  e.preventDefault();if(!venue)return;
  const d=new FormData(e.currentTarget);
  const price=Math.round(Number(d.get('price'))*100),stock=Number(d.get('stock'));
  if(!int(price,0,100000000)||!int(stock,0,10000000))throw Error('Prix ou quantité invalide.');
  await hub(route(venue.id)+'/products',{method:'POST',body:{name:String(d.get('name')||'').trim(),category:String(d.get('category')||'').trim(),priceCentimes:price,stock,sku:String(d.get('sku')||'').trim(),menuVisible:d.get('menuVisible')==='on'}});
  e.currentTarget.reset();e.currentTarget.elements.menuVisible.checked=true;
  await loadVenue();showMessage('Article ajouté au catalogue et stock initial enregistré.');
}));
$('stockForm').addEventListener('submit',guard(async e=>{
  e.preventDefault();if(!venue)return;
  const d=new FormData(e.currentTarget),delta=Number(d.get('delta'));
  if(!int(delta,-100000,100000)||delta===0)throw Error('Variation de stock invalide.');
  await hub(route(venue.id)+'/stock',{method:'POST',body:{productId:String(d.get('productId')||''),delta,reason:String(d.get('reason')||'').trim()}});
  e.currentTarget.reset();await loadVenue();await loadStock();showMessage('Mouvement de stock enregistré avec son motif.');
}));
$('proClearCart').addEventListener('click',()=>{cart.clear();pendingSaleRef=null;renderCart();showMessage('Ticket vidé.');});
$('proCheckout').addEventListener('click',guard(async()=>{
  if(!venue||!cart.size)return;
  const items=[...cart].map(([productId,quantity])=>({productId,quantity}));
  if(!pendingSaleRef)pendingSaleRef=crypto.randomUUID().replace(/-/g,'');
  const result=await hub(route(venue.id)+'/sales',{method:'POST',body:{reference:pendingSaleRef,table:$('proTable').value.trim()||'COMPTOIR',items}});
  cart.clear();pendingSaleRef=null;await loadVenue();showMessage('Vente '+(result.duplicate?'déjà enregistrée':'enregistrée')+' : '+money(result.totalCentimes)+'.');
}));
$('refreshSales').addEventListener('click',guard(async()=>{await loadSales();showMessage('Historique actualisé.');}));
$('copyMenuLink').addEventListener('click',async()=>{
  if(!venue)return;
  try{await navigator.clipboard.writeText(menuUrl());showMessage('Lien copié. À écrire dans la puce NFC ou à partager.');}
  catch{showMessage('Copiez le lien affiché ci-dessus.',true);}
});

(async()=>{
  try{
    const logged=await requireRole(['admin','recruiter'],false);
    if(!logged){toggle('proGate',true);setStatus('Connexion professionnelle nécessaire');return;}
    toggle('proWorkspace',true);setStatus('Connexion serveur…');
    await loadVenues();
    setStatus('Connecté à HORENOVA · '+logged.role,true);
    showMessage('Espace sécurisé initialisé. Les données sont enregistrées sur le serveur.');
  }catch(e){toggle('proGate',true);toggle('proWorkspace',false);setStatus('Connexion indisponible');showMessage(e.message||'Impossible de charger le service.',true);}
})();