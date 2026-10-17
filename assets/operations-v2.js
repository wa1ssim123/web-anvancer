/* HORENZA — Démonstration commerciale interactive v2.
 * Données synthétiques stockées dans CE navigateur uniquement.
 * Aucune comptabilité réglementaire, mesure physique ou tâche serveur en arrière-plan.
 */
(() => {
'use strict';
const KEY='horenza.demo.operations.v2';
const $=id=>document.getElementById(id);
const round=(n,p=3)=>Number((Number(n)||0).toFixed(p));
const money=n=>round(n,2);
const price=n=>money(n).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' DH';
const qty=n=>round(n).toLocaleString('fr-FR',{maximumFractionDigits:3});
const esc=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const localDate=t=>new Date(t).toLocaleString('fr-MA',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
const today=t=>new Date(t).toLocaleDateString('fr-CA');
const iso=()=>new Date().toISOString();
const tracked=i=>i&&i.kind==='article';
const sellable=i=>i&&i.active!==false&&i.price>0;
const item=s=>ops.items.find(i=>i.sku===s);
const next=prefix=>prefix+'-'+String(++ops.seq).padStart(5,'0');
const itemBase=(sku,name,cat,unit,cost,amount,min,priceValue=0)=>({sku,name,cat,kind:'article',unit,cost,qty:amount,min,price:priceValue,recipe:[],active:true});
const dishBase=(sku,name,cat,priceValue,recipe)=>({sku,name,cat,kind:'produit',unit:'portion',cost:0,qty:null,min:0,price:priceValue,recipe:recipe.map(([s,q])=>({sku:s,qty:q})),active:true});
const sampleItems=()=>[
 itemBase('CAF-001','Café en grains','Matières premières','kg',180,9.5,2.5),
 itemBase('LAI-001','Lait frais','Matières premières','L',11,18,7),
 itemBase('THE-001','Thé vert','Matières premières','kg',110,1.2,.5),
 itemBase('MEN-001','Menthe fraîche','Matières premières','kg',28,.7,1),
 itemBase('ORA-001','Oranges','Fruits','kg',15,11,5),
 itemBase('FAR-001','Farine','Cuisine','kg',7,26,7),
 itemBase('MOZ-001','Mozzarella','Cuisine','kg',64,4.2,5),
 itemBase('SAU-001','Sauce tomate','Cuisine','kg',22,7,3),
 itemBase('BOE-001','Steak haché','Cuisine','kg',110,3,1.2),
 itemBase('PAI-001','Pain burger','Boulangerie','u',3.5,45,12),
 itemBase('POU-001','Poulet','Cuisine','kg',49,7.5,3),
 itemBase('BAG-001','Pain sandwich','Boulangerie','u',1.8,32,10),
 itemBase('GOB-001','Gobelet carton','Emballages','u',.65,220,50),
 itemBase('BOI-001','Boîte pizza','Emballages','u',2.5,70,20),
 itemBase('DES-001','Base desserts','Desserts','kg',32,5,2),
 itemBase('EAU-001','Eau minérale 50 cl','Boissons','u',2.6,58,18,9),
 dishBase('POS-ESP','Espresso','Café',14,[['CAF-001',.018],['GOB-001',1]]),
 dishBase('POS-CAP','Cappuccino','Café',22,[['CAF-001',.018],['LAI-001',.12],['GOB-001',1]]),
 dishBase('POS-THE','Thé à la menthe','Boissons',15,[['THE-001',.006],['MEN-001',.03],['GOB-001',1]]),
 dishBase('POS-JUS','Jus d’orange','Boissons',26,[['ORA-001',.27],['GOB-001',1]]),
 dishBase('POS-PIZ','Pizza Margherita','Cuisine',62,[['FAR-001',.25],['MOZ-001',.12],['SAU-001',.08],['BOI-001',1]]),
 dishBase('POS-BUR','Burger signature','Cuisine',69,[['BOE-001',.16],['PAI-001',1]]),
 dishBase('POS-SAN','Sandwich poulet','Cuisine',42,[['POU-001',.14],['BAG-001',1]]),
 dishBase('POS-TIR','Tiramisu','Desserts',34,[['DES-001',.18]]),
 dishBase('POS-CHE','Cheesecake','Desserts',38,[['DES-001',.2]])
];
function fresh(){return {version:2,items:sampleItems(),moves:[],journal:[],sales:[],expenses:[],snapshots:[],seq:100,period:{mode:'weekly',every:7,time:'03:00',anchor:iso()},audit:[],lastRun:iso()};}
function read(){try{const d=JSON.parse(localStorage.getItem(KEY));if(d&&d.version===2&&Array.isArray(d.items)&&Array.isArray(d.moves)&&Array.isArray(d.journal)&&d.period&&Array.isArray(d.snapshots))return d;}catch(e){}return null;}
let ops=read();
const isNew=!ops;
if(!ops)ops=fresh();
function store(){try{localStorage.setItem(KEY,JSON.stringify(ops));}catch(e){console.warn('Stockage local indisponible',e);}}
function audit(action,ref){ops.audit.unshift({date:iso(),action,ref});ops.audit=ops.audit.slice(0,400);}
function journal(description,ref,lines,date=iso()){
 const ld=round(lines.reduce((s,l)=>s+l.debit,0),2),lc=round(lines.reduce((s,l)=>s+l.credit,0),2);
 if(Math.abs(ld-lc)>0.01)throw Error('Journal déséquilibré, opération annulée');
 ops.journal.unshift({id:next('JRN'),date,description,ref,lines:lines.map(l=>({...l,debit:money(l.debit),credit:money(l.credit)}))});
}
function pair(description,ref,debitAccount,creditAccount,value,date=iso()){
 const v=money(value);if(v<=0)return;
 journal(description,ref,[{account:debitAccount,debit:v,credit:0},{account:creditAccount,debit:0,credit:v}],date);
}
function movement(sku,delta,type,reference,note='',date=iso(),newCost=null){
 const i=item(sku); if(!tracked(i))throw Error('Article de stock inexistant');
 delta=round(delta);if(!Number.isFinite(delta)||Math.abs(delta)<.0005)throw Error('Quantité invalide');
 const before=round(i.qty);if(round(before+delta)<-.0001)throw Error('Stock insuffisant pour '+i.name);
 const oldCost=i.cost;
 if(delta>0&&newCost!==null){const c=money(newCost);if(c<0)throw Error('Coût négatif');i.cost=money((before*oldCost+delta*c)/(before+delta));}
 i.qty=round(before+delta);
 const cost=money((delta>0&&newCost!==null?newCost:oldCost)*Math.abs(delta));
 const rec={id:next('MVT'),date,sku,name:i.name,type,delta,before,after:i.qty,unit:i.unit,cost,note,reference};
 ops.moves.unshift(rec);return rec;
}
function need(cart){const demand=new Map();let warnings=[];
 for(const [sku,n] of Object.entries(cart)){
  const p=item(sku);if(!sellable(p)||!Number.isInteger(n)||n<=0)continue;
  if(tracked(p))demand.set(sku,round((demand.get(sku)||0)+n));
  else if(p.recipe.length){for(const x of p.recipe)demand.set(x.sku,round((demand.get(x.sku)||0)+x.qty*n));}
  else warnings.push(`${p.name} : recette non configurée (aucune sortie de matière)`);
 }
 const shortages=[];
 for(const [sku,n] of demand){const i=item(sku);if(!tracked(i)||i.active===false||i.qty+.00001<n)shortages.push(`${i?.name||sku} : besoin ${qty(n)}, disponible ${qty(i?.qty||0)}`);}
 return {demand,shortages,warnings};
}
function sell(cart,date=iso(),method='Espèces'){
 const lines=Object.entries(cart).filter(([sku,n])=>sellable(item(sku))&&n>0).map(([sku,n])=>({sku,quantity:n,price:item(sku).price,name:item(sku).name}));
 if(!lines.length)throw Error('Panier vide');
 const {demand,shortages,warnings}=need(cart);
 if(shortages.length)throw Error(shortages[0]);
 const amount=money(lines.reduce((s,l)=>s+l.quantity*l.price,0));
 const id=next('TCK');let costs=0;
 for(const [sku,n] of demand){const rec=movement(sku,-n,'VENTE',id,'Déduction POS automatique',date);costs+=rec.cost;}
 costs=money(costs);
 ops.sales.unshift({id,date,amount,cost:costs,lines,method});
 pair('Vente enregistrée automatiquement',id,method==='Carte'?'Encaissements carte':'Caisse','Ventes',amount,date);
 pair('Consommation des articles / coût matière',id,'Coût des ventes','Stock',costs,date);
 audit('Vente POS',id);return {id,amount,cost:costs,warnings};
}
function initialSeed(){
 const base=new Date();
 const baskets=[{'POS-ESP':2,'POS-CAP':1,'POS-THE':1},{'POS-PIZ':2,'POS-JUS':2},{'POS-BUR':1,'POS-SAN':2,'EAU-001':2},{'POS-CAP':3,'POS-TIR':2},{'POS-PIZ':1,'POS-BUR':2},{'POS-ESP':2},{'POS-THE':2,'POS-JUS':1,'POS-CHE':2},{'POS-PIZ':2,'POS-CAP':1},{'POS-SAN':2,'POS-BUR':1,'EAU-001':1},{'POS-CAP':2,'POS-ESP':2,'POS-TIR':1},{'POS-PIZ':2,'POS-BUR':1,'POS-JUS':1}];
 baskets.forEach((cart,n)=>{
  const d=new Date(base);d.setDate(base.getDate()-(6-Math.floor(n*6/baskets.length)));d.setHours(10+(n%9),n*7%60,0,0);
  try{sell(cart,d.toISOString(),n%3===0?'Carte':'Espèces');}catch(e){console.warn('Données démo non insérées',e.message);}
 });
 // Stock d'ouverture comptable fictif valorisé après les commandes fictives de départ.
 const value=money(ops.items.filter(tracked).reduce((s,i)=>s+i.qty*i.cost,0)+ops.sales.reduce((s,t)=>s+t.cost,0));
 pair('Solde d’ouverture fictif','OUVERTURE','Stock','Capital initial',value,new Date(base.getTime()-9*864e5).toISOString());
 ops.snapshots.unshift(makeSnapshot('initialisation',base.toISOString()));
 store();
}
function makeSnapshot(source='manuel',date=iso(),scheduled=null){
 const lines=ops.items.filter(tracked).map(i=>({sku:i.sku,name:i.name,quantity:i.qty,unit:i.unit,cost:i.cost,value:money(i.qty*i.cost),below:i.qty<i.min}));
 return {id:next('INV'),date,source,scheduled,lines,value:money(lines.reduce((s,l)=>s+l.value,0)),missing:lines.filter(l=>l.below).length};
}
function snapshot(source='manuel',scheduled=null){const rec=makeSnapshot(source,iso(),scheduled);ops.snapshots.unshift(rec);ops.lastRun=rec.date;audit('Instantané inventaire théorique',rec.id);store();renderAll();notify('Inventaire théorique '+rec.id+' enregistré');return rec;}
function addMonths(d,months){let c=new Date(d),day=c.getDate();c.setDate(1);c.setMonth(c.getMonth()+months);let last=new Date(c.getFullYear(),c.getMonth()+1,0).getDate();c.setDate(Math.min(day,last));return c;}
function nextDate(){const p=ops.period,base=new Date(ops.lastRun||p.anchor||iso());
 let n=p.mode==='daily'?1:p.mode==='weekly'?7:p.mode==='monthly'?0:Math.max(1,Math.min(365,Number(p.every)||7));
 let target=p.mode==='monthly'?addMonths(base,1):new Date(base.getTime()+n*86400000);
 const [h,m]=String(p.time||'03:00').split(':').map(Number);target.setHours(h||0,m||0,0,0);
 // Si la date calculée est passée par rapport à la dernière exécution, passer au jour suivant.
 if(target<=base)target=p.mode==='monthly'?addMonths(target,1):new Date(target.getTime()+n*86400000);
 return target;
}
function checkAuto(){const target=nextDate();if(Date.now()>=target.getTime())snapshot('automatique — à l’ouverture',target.toISOString());}
if(isNew)initialSeed();
function notify(s){if(typeof toast==='function')toast(s);}
const stockList=()=>ops.items.filter(tracked);
function issues(){return stockList().filter(i=>i.active!==false&&i.qty<i.min)}
function turnover(){return money(ops.sales.reduce((s,t)=>s+t.amount,0));}
function margin(){return money(ops.sales.reduce((s,t)=>s+t.amount-t.cost,0)-ops.expenses.reduce((s,e)=>s+e.amount,0));}
function valuation(){return money(stockList().reduce((s,i)=>s+i.qty*i.cost,0));}
function safeFormData(formId){const f=$(formId);return f?new FormData(f):new FormData();}
function resetDemo(){if(!confirm('Réinitialiser toutes les données fictives de cette démo dans ce navigateur ?'))return;try{localStorage.removeItem(KEY)}catch(e){}location.reload();}

const css=`<style>
.hz-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.hz-select,.hz-input{border:1px solid rgba(224,186,115,.28);color:#f1f4ee;background:#0a2530;border-radius:10px;padding:10px 12px;min-width:0;width:100%}.hz-input:focus,.hz-select:focus{outline:2px solid rgba(225,189,119,.7);outline-offset:1px}.hz-input::placeholder{color:#81999c}.hz-label{display:flex;flex-direction:column;gap:7px;color:#b1c5c6;font-size:12px;min-width:0}.hz-formgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.hz-formgrid.two{grid-template-columns:repeat(2,minmax(0,1fr))}.hz-formgrid.four{grid-template-columns:repeat(4,minmax(0,1fr))}.hz-formgrid .hz-span{grid-column:1/-1}.hz-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.hz-btn{border:1px solid rgba(234,189,117,.43);background:rgba(232,188,120,.08);border-radius:9px;color:#eac58f;font-size:12px;font-weight:650;padding:9px 12px}.hz-btn:hover{border-color:var(--gold)}.hz-btn.positive{background:#1e977e;color:white;border-color:#2ca58e}.hz-btn.danger{border-color:#ba7373;color:#ffc0bf}.hz-card{border:1px solid rgba(226,191,128,.16);background:rgba(14,40,49,.77);border-radius:12px;padding:14px}.hz-muted{color:var(--muted);font-size:12px}.hz-value{font-size:24px;line-height:1.15;color:var(--lightgold);font-weight:750}.hz-help{font-size:11px;color:#9cb2b7;padding-top:6px}.hz-tiny{font-size:10px;color:var(--muted)}.hz-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.hz-scroller{overflow:auto;max-height:480px}.hz-scroller table{width:100%;border-collapse:collapse;min-width:660px}.hz-scroller th{color:#a7bbc0;text-align:left;font-size:11px;padding:11px 9px;background:#102d38;position:sticky;top:0}.hz-scroller td{padding:10px 9px;border-bottom:1px solid rgba(255,255,255,.06);font-size:12px}.hz-detail{margin-top:14px}.hz-detail summary{cursor:pointer;color:var(--gold);font-weight:650}.hz-sideitem{margin-top:1px}.hz-tabs{display:flex;gap:8px;flex-wrap:wrap}.hz-bubble{display:inline-flex;border-radius:50px;background:#174338;padding:5px 9px;font-size:11px;color:#c0f5de}.hz-error{color:#ffacb5}.hz-warning{color:#f2cb8d}.hz-separator{height:1px;background:rgba(226,190,130,.16);margin:17px 0}.hz-recipe-row{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr) auto;gap:8px;margin:8px 0;align-items:center}.hz-inline-title{font-size:18px;margin:0 0 12px}.hz-state-good{color:#8de8c7}.hz-note{padding:12px 14px;border-left:3px solid #d8af71;background:rgba(236,190,115,.055);border-radius:5px;font-size:12px;color:#cbd7d2}.hz-shortcut{cursor:pointer;text-align:left}.hz-shortcut:hover{border-color:rgba(232,190,122,.65)}.hz-print{display:none}
@media(max-width:1100px){.hz-formgrid.four{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:720px){.hz-formgrid,.hz-formgrid.four,.hz-formgrid.two,.hz-kpis{grid-template-columns:1fr 1fr}.hz-main-form{grid-template-columns:1fr}.hz-toolbar{display:grid;grid-template-columns:1fr 1fr}.hz-value{font-size:20px}}
@media(max-width:460px){.hz-formgrid,.hz-formgrid.four,.hz-formgrid.two,.hz-kpis{grid-template-columns:1fr}.hz-toolbar{grid-template-columns:1fr}.hz-recipe-row{grid-template-columns:1fr 80px auto}}
</style>`;
document.head.insertAdjacentHTML('beforeend',css);
const views=`
<section class="view" id="catalog">
 <div class="topline"><div><h2>Produits & articles</h2><p>Références, catégories, recettes et seuils d’alerte.</p></div><span class="tag">Catalogue local démo</span></div>
 <div class="grid2"><div class="panel">
  <h3 class="hz-inline-title">Créer / modifier une fiche</h3>
  <form id="hz-catalog-form" class="hz-formgrid hz-main-form">
   <label class="hz-label">Référence / SKU<input name="sku" id="hz-catalog-sku" class="hz-input" maxlength="24" placeholder="EX : CAF-023" required></label>
   <label class="hz-label">Nom<input name="name" class="hz-input" maxlength="75" placeholder="Nom de l'article" required></label>
   <label class="hz-label">Type<select name="kind" class="hz-select" id="hz-kind"><option value="article">Article stocké (matière, emballage, marchandise)</option><option value="produit">Produit / plat à recette</option></select></label>
   <label class="hz-label">Catégorie<input name="cat" class="hz-input" placeholder="Ex : Boissons" required></label>
   <label class="hz-label">Unité<select name="unit" class="hz-select"><option value="u">Unité (u)</option><option value="kg">Kilogramme (kg)</option><option value="L">Litre (L)</option><option value="portion">Portion</option></select></label>
   <label class="hz-label">Prix de vente (DH)<input name="price" type="number" min="0" step=".01" class="hz-input" value="0" required></label>
   <label class="hz-label">Coût unitaire moyen (DH)<input name="cost" type="number" min="0" step=".01" class="hz-input" value="0" required></label>
   <label class="hz-label">Seuil d'alerte<input name="min" type="number" min="0" step=".001" class="hz-input" value="5" required></label>
   <label class="hz-label" id="hz-initial-wrap">Stock initial (création uniquement)<input name="opening" type="number" min="0" step=".001" class="hz-input" value="0"></label>
   <div class="hz-span" id="hz-recipe-wrap" style="display:none"><strong>Recette / nomenclature</strong><p class="hz-muted">Pour un produit préparé, chaque vente déclenche la sortie de ces ingrédients et emballages.</p><div id="hz-recipe"></div><button type="button" class="hz-btn" id="hz-add-recipe">+ Ajouter un ingrédient</button></div>
   <div class="hz-span hz-actions"><button type="submit" class="pill" id="hz-save-item">Enregistrer la fiche</button><button type="button" class="hz-btn" id="hz-cancel-item">Nouvelle fiche</button></div>
  </form><p class="hz-help">Après création, les quantités de stock se modifient exclusivement par entrée, sortie ou inventaire.</p>
 </div><div class="panel"><div class="hz-row"><h3 class="hz-inline-title">Catalogue</h3><input id="hz-search-catalog" class="hz-input" placeholder="Rechercher nom ou référence" style="max-width:245px"></div><div class="hz-scroller" id="hz-catalog-list"></div><p class="hz-help">« Archiver » masque un produit sans supprimer son historique.</p></div></div>
</section>
<section class="view" id="movements">
 <div class="topline"><div><h2>Entrées & sorties de stock</h2><p>Un journal de mouvements traçable : achats, sorties, pertes et ventes.</p></div><button class="ghost" onclick="HZ.csv('movements')">Exporter les mouvements CSV ↓</button></div>
 <div class="grid2"><div class="panel"><h3 class="hz-inline-title">Enregistrer un mouvement</h3><form id="hz-move-form" class="hz-formgrid two">
  <label class="hz-label">Opération<select name="type" class="hz-select"><option value="entree">Entrée fournisseur / réception</option><option value="sortie">Sortie manuelle / consommation</option><option value="perte">Perte / casse</option><option value="retour">Retour en stock</option></select></label>
  <label class="hz-label">Article<select name="sku" id="hz-move-sku" class="hz-select" required></select></label>
  <label class="hz-label">Quantité<input type="number" name="amount" min=".001" step=".001" class="hz-input" required placeholder="0"></label>
  <label class="hz-label">Coût unitaire DH (entrées)<input type="number" name="unitCost" min="0" step=".01" class="hz-input" placeholder="Moyenne actuelle"></label>
  <label class="hz-label">Référence document<input name="reference" class="hz-input" maxlength="60" placeholder="BL-2026-001"></label>
  <label class="hz-label">Fournisseur / remarque<input name="note" class="hz-input" maxlength="100" placeholder="Nom du fournisseur..."></label>
  <div class="hz-span"><button class="pill" type="submit">Valider le mouvement</button><p class="hz-help">La sortie est bloquée en cas de stock insuffisant. Chaque mouvement alimente l’historique et la comptabilité de gestion illustrée.</p></div>
  </form></div>
  <div class="panel"><div class="hz-kpis"><div><div class="hz-muted">Articles suivis</div><div class="hz-value" id="hz-count-stock">—</div></div><div><div class="hz-muted">Valeur stock</div><div class="hz-value" id="hz-value-stock">—</div></div><div><div class="hz-muted">Sous seuil</div><div class="hz-value" id="hz-low-count">—</div></div></div><div class="hz-separator"></div><div class="hz-note">Les sorties de produits composés sont déclenchées par leurs recettes lors d’un encaissement POS. Les entrées peuvent ajuster le coût moyen pondéré.</div><div class="section"><h2>Derniers mouvements</h2></div><div id="hz-latest-moves"></div></div></div>
 <div class="section"><h2>Historique des mouvements</h2><span>Identifiants et horodatages</span></div><div class="panel hz-scroller" id="hz-moves-list"></div>
</section>
<section class="view" id="inventory">
 <div class="topline"><div><h2>Inventaire automatique</h2><p>Instantanés du stock théorique selon la période choisie par le propriétaire.</p></div><span class="tag">Programmation démo</span></div>
 <div class="hz-note"><strong>Inventaire théorique automatique ≠ comptage physique.</strong> Le logiciel calcule ses quantités d’après les ventes et mouvements. Pour détecter les quantités réelles, il faut compter les produits ou utiliser un matériel adapté. Sur ce site statique, la période est vérifiée à l’ouverture et quand la page reste ouverte, pas sur un serveur 24 h/24.</div>
 <div class="grid2" style="margin-top:18px"><div class="panel"><h3 class="hz-inline-title">Période décidée par le propriétaire</h3><form id="hz-period-form" class="hz-formgrid two">
  <label class="hz-label">Fréquence<select name="mode" id="hz-period-mode" class="hz-select"><option value="daily">Tous les jours</option><option value="weekly">Toutes les semaines</option><option value="monthly">Tous les mois</option><option value="custom">Personnalisée (N jours)</option></select></label>
  <label class="hz-label">N jours (mode personnalisé)<input type="number" name="every" min="1" max="365" step="1" id="hz-period-every" class="hz-input" value="7"></label>
  <label class="hz-label">Heure de contrôle (locale)<input name="time" type="time" class="hz-input" value="03:00"></label>
  <div class="hz-actions"><button class="pill" type="submit">Sauvegarder la fréquence</button></div>
 </form><div class="hz-separator"></div><div class="hz-muted">Dernier calcul</div><strong id="hz-last-inv">—</strong><div class="hz-muted" style="margin-top:10px">Prochain contrôle théorique</div><strong class="hz-warning" id="hz-next-inv">—</strong><div style="margin-top:16px"><button class="hz-btn positive" onclick="HZ.snapshot()">Générer un inventaire maintenant</button></div></div>
 <div class="panel"><h3 class="hz-inline-title">Comptage physique & écarts</h3><p class="hz-muted">Saisissez les quantités réellement constatées, puis validez les écarts. Toute correction sera enregistrée avec son mouvement et son écriture de gestion.</p><form id="hz-count-form"><div id="hz-count-lines" class="hz-scroller"></div><div style="margin-top:15px"><button type="submit" class="pill">Valider les écarts constatés</button></div></form></div></div>
 <div class="section"><h2>Inventaires enregistrés</h2><button class="ghost" onclick="HZ.csv('inventory')">Export CSV ↓</button></div><div class="panel hz-scroller" id="hz-inventory-history"></div>
</section>
<section class="view" id="accounting">
 <div class="topline"><div><h2>Comptabilité de gestion automatique</h2><p>Journal alimenté par les ventes POS, les achats et les variations de stocks.</p></div><button class="ghost" onclick="HZ.csv('accounting')">Exporter le journal CSV ↓</button></div>
 <div class="hz-note"><strong>Démo de pré-comptabilité, pas une déclaration officielle.</strong> Les écritures sont générées à partir des opérations de démonstration ; TVA, plan comptable marocain, justificatifs, clôtures, rapprochement bancaire et validation fiscale devront être configurés et vérifiés avec un expert-comptable avant usage réel.</div>
 <div class="grid4" style="margin-top:17px"><div class="panel metric"><div class="label">Ventes démo</div><div class="val" id="hz-acc-sales">—</div></div><div class="panel metric"><div class="label">Coût matière vendu</div><div class="val" id="hz-acc-cogs">—</div></div><div class="panel metric"><div class="label">Dépenses enregistrées</div><div class="val" id="hz-acc-expenses">—</div></div><div class="panel metric"><div class="label">Résultat estimatif</div><div class="val" id="hz-acc-profit">—</div></div></div>
 <div class="grid2" style="margin-top:18px"><div class="panel"><h3 class="hz-inline-title">Ajouter une dépense</h3><form id="hz-expense-form" class="hz-formgrid two">
  <label class="hz-label">Libellé / pièce<input name="label" class="hz-input" maxlength="100" placeholder="Ex : Électricité octobre" required></label>
  <label class="hz-label">Montant DH<input name="amount" type="number" min=".01" step=".01" class="hz-input" required></label>
  <label class="hz-label">Catégorie<select name="category" class="hz-select"><option>Énergie</option><option>Loyer</option><option>Transport</option><option>Personnel (simulation)</option><option>Autres charges</option></select></label>
  <label class="hz-label">Mode de règlement<select name="method" class="hz-select"><option>Espèces</option><option>À payer</option></select></label>
  <div class="hz-span"><button type="submit" class="pill">Enregistrer la dépense</button></div>
 </form><div class="hz-separator"></div><p class="hz-muted">Chaque opération crée une paire débit/crédit équilibrée. Le résultat reste une <strong>estimation de gestion</strong> (ni résultat fiscal ni bénéfice certifié).</p></div>
 <div class="panel"><h3 class="hz-inline-title">Contrôle des écritures</h3><div class="hz-kpis"><div><div class="hz-muted">Écritures</div><div class="hz-value" id="hz-journal-count">—</div></div><div><div class="hz-muted">Total débit</div><div class="hz-value" id="hz-journal-debit">—</div></div><div><div class="hz-muted">Écart débit/crédit</div><div class="hz-value" id="hz-journal-balance">—</div></div></div><div class="hz-separator"></div><h3 class="hz-inline-title">Exemple de chaîne automatique</h3><div class="hz-mini-flow"><div class="minirow">🧾 Vente POS <strong>→ Caisse / Ventes</strong></div><div class="minirow">📦 Ingrédients consommés <strong>→ Coût / Stock</strong></div><div class="minirow">🚚 Achat article <strong>→ Stock / Fournisseurs</strong></div><div class="minirow">🧮 Écart d'inventaire <strong>→ Ajustement</strong></div></div></div></div>
 <div class="section"><h2>Journal des opérations</h2><span>Démo · comptes simplifiés</span></div><div class="panel hz-scroller" id="hz-journal-list"></div>
</section>`;
$('reports').insertAdjacentHTML('afterend',views);
const sidebar=document.querySelector('.side');
const reportBtn=sidebar.querySelector('[data-go="reports"]');
reportBtn.insertAdjacentHTML('beforebegin',[
 '<button class="nav hz-sideitem" data-go="catalog"><span class="ico">▦</span> Produits & articles</button>',
 '<button class="nav hz-sideitem" data-go="movements"><span class="ico">⇄</span> Entrées / sorties</button>',
 '<button class="nav hz-sideitem" data-go="inventory"><span class="ico">▧</span> Inventaire automatique</button>',
 '<button class="nav hz-sideitem" data-go="accounting"><span class="ico">∑</span> Comptabilité automatique</button>'
].join(''));
sidebar.querySelectorAll('.hz-sideitem').forEach(x=>x.addEventListener('click',()=>go(x.dataset.go)));
// Add a small introduction to the stock screen with links, instead of a separate disconnected catalogue.
$('stock').querySelector('.topline').insertAdjacentHTML('afterend',`<div class="hz-actions" style="margin:0 0 15px"><button class="hz-btn" onclick="go('catalog')">Catalogue articles & produits →</button><button class="hz-btn" onclick="go('movements')">Entrées / sorties →</button><button class="hz-btn" onclick="go('inventory')">Inventaires →</button><button class="hz-btn" onclick="HZ.csv('stock')">Exporter le stock CSV ↓</button></div><div class="hz-kpis" style="margin:0 0 16px"><div class="hz-card"><div class="hz-muted">Valeur théorique</div><div id="hz-stock-overview" class="hz-value">—</div></div><div class="hz-card"><div class="hz-muted">Articles stockés</div><div id="hz-stock-items" class="hz-value">—</div></div><div class="hz-card"><div class="hz-muted">Alertes de seuil</div><div id="hz-stock-alerts" class="hz-value">—</div></div></div>`);
$('stock').querySelector('.stocktable thead').innerHTML='<tr><th>Article / référence</th><th>Type</th><th>Quantité</th><th>Seuil</th><th>Coût moy.</th><th>Valorisation</th><th>État</th></tr>';
$('stock').querySelector('.topline p').textContent='Suivi permanent de chaque article : mouvements, recettes, coûts moyens et alertes.';
$('stock').querySelector('.topline button').textContent='+ Simuler réception des articles en alerte';
$('reports').querySelector('.topline p').textContent='Les chiffres du tableau de bord découlent de vos opérations de démonstration.';
$('reports').querySelector('#report-sales')?.parentElement.querySelector('.label')?.replaceChildren(document.createTextNode('Ventes cumulées simulées'));
$('pos').querySelector('.topline p').textContent='Encaisser un produit, consommer ses ingrédients et générer les écritures comptables.';
$('pos').querySelector('div[style*="justify-content:space-between;align-items:end"] span')?.replaceChildren(document.createTextNode('Montant simulé (TVA non configurée)'));
document.querySelector('.hero p').textContent='Caisse POS, produits et articles, entrées-sorties, inventaire périodique configurable, pré-comptabilité et tableaux de bord réunis.';
document.querySelector('.alert').innerHTML='<strong>MODE DÉMONSTRATION.</strong> Les données et écritures sont fictives, enregistrées dans votre navigateur, sans connexion à un logiciel de caisse ou à un service comptable réel. L’inventaire automatique est théorique et vérifié uniquement quand ce site est ouvert. L’agent IA n’est pas connecté.';
sidebar.querySelector('.sidefoot').insertAdjacentHTML('beforeend','<p style="margin-top:12px"><button class="hz-btn danger" onclick="HZ.reset()">↺ Remettre la démo à zéro</button></p>');

function reloadProducts(){products.splice(0,products.length,...ops.items.filter(sellable).map(i=>({...i,id:i.sku})));}
function getSale(id){return item(String(id));}
function cartDemand(){return need(state.cart);}
function refreshTotals(){state.sales=turnover();state.orders=ops.sales.length;state.history=ops.sales.slice(0,5).map(s=>({name:s.id,amount:s.amount,date:s.date}));}
function formCatalogOptions(){const opts=stockList().filter(i=>i.active!==false).map(i=>`<option value="${esc(i.sku)}">${esc(i.name)} · ${esc(i.sku)} (${esc(i.unit)})</option>`).join('');const select=$('hz-move-sku'),prev=select.value;select.innerHTML=opts;if(prev&&item(prev)&&item(prev).active!==false)select.value=prev;}
let currentRecipe=[];let editingSku=null;
function renderRecipe(){const opts=stockList().filter(i=>i.active!==false).map(i=>`<option value="${esc(i.sku)}">${esc(i.name)} (${esc(i.unit)})</option>`).join('');
 $('hz-recipe').innerHTML=currentRecipe.length?currentRecipe.map((r,n)=>`<div class="hz-recipe-row"><select class="hz-select" data-recipe-sku="${n}">${opts}</select><input class="hz-input" type="number" min=".001" step=".001" data-recipe-qty="${n}" value="${r.qty}" aria-label="Consommation par portion"><button type="button" class="hz-btn danger" data-recipe-remove="${n}" aria-label="Supprimer cet ingrédient">×</button></div>`).join(''):'<p class="hz-muted">Aucun ingrédient lié. Ajoutez-en pour activer la déduction automatique au POS.</p>';
 currentRecipe.forEach((r,n)=>{const s=document.querySelector(`[data-recipe-sku="${n}"]`);if(s&&s.querySelector(`option[value="${CSS.escape(r.sku)}"]`))s.value=r.sku;});
 $('hz-recipe').querySelectorAll('[data-recipe-sku]').forEach(x=>x.onchange=()=>{currentRecipe[Number(x.dataset.recipeSku)].sku=x.value});
 $('hz-recipe').querySelectorAll('[data-recipe-qty]').forEach(x=>x.onchange=()=>{currentRecipe[Number(x.dataset.recipeQty)].qty=Number(x.value)});
 $('hz-recipe').querySelectorAll('[data-recipe-remove]').forEach(x=>x.onclick=()=>{currentRecipe.splice(Number(x.dataset.recipeRemove),1);renderRecipe()});
}
function toggleKind(){const k=$('hz-kind').value;$('hz-recipe-wrap').style.display=k==='produit'?'block':'none';$('hz-initial-wrap').style.display=k==='article'&&!editingSku?'flex':'none';const u=$('hz-catalog-form').elements.unit;if(k==='produit')u.value='portion';}
function newForm(){editingSku=null;currentRecipe=[];$('hz-catalog-form').reset();$('hz-catalog-sku').readOnly=false;$('hz-save-item').textContent='Enregistrer la fiche';toggleKind();renderRecipe();}
function loadItem(sku){const i=item(sku);if(!i)return;editingSku=sku;const f=$('hz-catalog-form');for(const x of ['sku','name','cat','kind','unit','cost','min','price'])if(f.elements[x])f.elements[x].value=i[x];f.elements.opening.value=0;$('hz-catalog-sku').readOnly=true;$('hz-save-item').textContent='Mettre à jour la fiche';currentRecipe=(i.recipe||[]).map(x=>({...x}));toggleKind();renderRecipe();go('catalog');window.scrollTo({top:0,behavior:'smooth'});}
function validateRecipe(recipe,kind){if(kind!=='produit')return [];
 const grouped=new Map();for(let r of recipe){const i=item(r.sku);if(!tracked(i))throw Error('Une recette doit référencer un article stocké');if(!Number.isFinite(r.qty)||r.qty<=0)throw Error('Quantité recette invalide');grouped.set(r.sku,round((grouped.get(r.sku)||0)+r.qty));}
 return [...grouped].map(([sku,qty])=>({sku,qty}));}
function saveItem(ev){ev.preventDefault();const f=ev.currentTarget,d=new FormData(f),sku=String(d.get('sku')||'').trim().toUpperCase(),name=String(d.get('name')||'').trim();
 try{
  if(!/^[A-Z0-9-]{3,24}$/.test(sku))throw Error('Référence : 3 à 24 caractères, lettres, chiffres et tirets uniquement');
  if(name.length<2||name.length>75)throw Error('Nom invalide');
  const kind=d.get('kind');const nums=['cost','price','min'].map(k=>Number(d.get(k)));
  if(nums.some(x=>!Number.isFinite(x)||x<0))throw Error('Montants et seuils doivent être positifs');
  const cat=String(d.get('cat')||'').trim();if(!cat)throw Error('Catégorie manquante');
  if(kind==='produit'&&nums[1]===0)throw Error('Veuillez indiquer un prix de vente pour le produit');
  if(editingSku&&kind!==item(sku).kind)throw Error('Changer le type d’une fiche existante n’est pas permis : archiver puis créer');
  const recipe=validateRecipe(currentRecipe,kind),opening=Number(d.get('opening')||0);
  if(!editingSku&&(!Number.isFinite(opening)||opening<0))throw Error('Quantité initiale invalide');
  const existing=item(sku);if(existing&&!editingSku)throw Error('Référence déjà utilisée');
  if(editingSku&&editingSku!==sku)throw Error('La référence ne se renomme pas');
  const old=editingSku?existing:null;
  const entry={sku,name,cat,kind,unit:kind==='produit'?'portion':String(d.get('unit')||'u'),cost:kind==='produit'?0:money(nums[0]),min:kind==='produit'?0:round(nums[2]),price:money(nums[1]),recipe,active:true};
  if(old){Object.assign(old,entry);audit('Fiche modifiée',sku)}
  else{ops.items.push({...entry,qty:kind==='article'?0:null});if(kind==='article'&&opening>0){const mv=movement(sku,opening,'INITIAL',sku,'Stock initial saisi');pair('Stock initial saisi',sku,'Stock','Capital initial',mv.cost);}audit('Création article/produit',sku)}
  store();newForm();reloadProducts();renderTabs();renderProducts();renderAll();notify('Fiche '+sku+' enregistrée.');
 }catch(e){notify('Erreur : '+e.message)}
}
function archiveItem(sku){const i=item(sku);if(!i)return;const a=i.active!==false;if(a&&tracked(i)&&i.qty>0){notify('Stock positif : faites une sortie avant l’archivage.');return;}if(!confirm((a?'Archiver':'Réactiver')+' '+i.name+' ?'))return;i.active=!a;audit(a?'Archivage':'Réactivation',sku);store();reloadProducts();renderTabs();renderProducts();renderAll();}
function catalogList(){const search=($('hz-search-catalog').value||'').toLowerCase();const rows=ops.items.filter(i=>`${i.name} ${i.sku} ${i.cat}`.toLowerCase().includes(search));
 $('hz-catalog-list').innerHTML=`<table><thead><tr><th>Référence / article</th><th>Type</th><th>Prix / stock</th><th>Actions</th></tr></thead><tbody>${rows.map(i=>`<tr><td><strong>${esc(i.name)}</strong><br><small>${esc(i.sku)} · ${esc(i.cat)}</small></td><td>${i.kind==='article'?'Article':'Produit'}</td><td>${price(i.price)}<br><span class="hz-muted">${tracked(i)?qty(i.qty)+' '+esc(i.unit):i.recipe.length+' composant(s)'}</span></td><td><button class="hz-btn" data-edit="${esc(i.sku)}">Éditer</button> <button class="hz-btn ${i.active===false?'positive':'danger'}" data-archive="${esc(i.sku)}">${i.active===false?'Réactiver':'Archiver'}</button></td></tr>`).join('')}</tbody></table>`;
 $('hz-catalog-list').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>loadItem(b.dataset.edit));
 $('hz-catalog-list').querySelectorAll('[data-archive]').forEach(b=>b.onclick=()=>archiveItem(b.dataset.archive));}
function recordManualMove(ev){ev.preventDefault();const d=safeFormData('hz-move-form'),sku=String(d.get('sku')),t=String(d.get('type')),n=Number(d.get('amount')),ref=String(d.get('reference')||'').slice(0,60)||next('DOC'),note=String(d.get('note')||'').slice(0,100),entry=['entree','retour'].includes(t);const c=String(d.get('unitCost')||'').trim();
 try{if(!Number.isFinite(n)||n<=0)throw Error('Quantité doit être supérieure à zéro');const i=item(sku);if(!tracked(i)||i.active===false)throw Error('Article indisponible');const cost=entry&&c!==''?Number(c):i.cost;if(!Number.isFinite(cost)||cost<0)throw Error('Coût invalide');
 const rec=movement(sku,entry?n:-n,t.toUpperCase(),ref,note,iso(),entry?cost:null);
 if(entry)pair('Réception / retour en stock',rec.id,'Stock','Fournisseurs',rec.cost);else pair('Consommation / perte de stock',rec.id,t==='perte'?'Perte de stock':'Consommation / charges','Stock',rec.cost);
 audit('Mouvement '+t,rec.id);store();ev.currentTarget.reset();renderAll();notify(`${entry?'Entrée':'Sortie'} enregistrée : ${i.name}, ${qty(n)} ${i.unit}`);
 }catch(e){notify('Erreur : '+e.message);}
}
function restockRealistic(){let items=issues();if(!items.length){notify('Aucun article n’est sous le seuil.');return;}for(let i of items){let n=round(Math.max(i.min*1.5-i.qty,1));const ref=next('BL');let m=movement(i.sku,n,'ENTREE',ref,'Réception fournisseur simulée',iso(),i.cost);pair('Réception fournisseur simulée',m.id,'Stock','Fournisseurs',m.cost);}audit('Réapprovisionnement démo',String(items.length)+' références');store();renderAll();notify(items.length+' références réapprovisionnées (simulation).');}
function moveTable(){ $('hz-moves-list').innerHTML=`<table><thead><tr><th>Date</th><th>Référence</th><th>Article</th><th>Type</th><th>Variation</th><th>Stock final</th><th>Justificatif</th></tr></thead><tbody>${ops.moves.slice(0,150).map(m=>`<tr><td>${esc(localDate(m.date))}</td><td>${esc(m.id)}</td><td>${esc(m.name)}</td><td>${esc(m.type)}</td><td class="${m.delta<0?'hz-warning':'hz-state-good'}">${m.delta>0?'+':''}${qty(m.delta)} ${esc(m.unit)}</td><td>${qty(m.after)}</td><td>${esc(m.reference)}<br><small>${esc(m.note)}</small></td></tr>`).join('')}</tbody></table>`;
 $('hz-latest-moves').innerHTML=ops.moves.slice(0,4).map(m=>`<div class="minirow"><div><strong>${esc(m.name)}</strong><small>${esc(m.type)} · ${esc(m.reference)}</small></div><span class="tag ${m.delta<0?'warn':''}">${m.delta>0?'+':''}${qty(m.delta)} ${esc(m.unit)}</span></div>`).join('');
 $('hz-count-stock').textContent=stockList().length;$('hz-value-stock').textContent=price(valuation());$('hz-low-count').textContent=issues().length;}
function countLines(){ $('hz-count-lines').innerHTML=`<table><thead><tr><th>Article</th><th>Théorique</th><th>Compté</th></tr></thead><tbody>${stockList().filter(i=>i.active!==false).map(i=>`<tr><td><strong>${esc(i.name)}</strong><br><small>${esc(i.sku)}</small></td><td>${qty(i.qty)} ${esc(i.unit)}</td><td><input class="hz-input" style="max-width:120px" type="number" min="0" step=".001" data-count-sku="${esc(i.sku)}" value="${i.qty}" aria-label="Comptage physique de ${esc(i.name)}"></td></tr>`).join('')}</tbody></table>`;}
function validateCount(ev){ev.preventDefault();const values=[...$('hz-count-lines').querySelectorAll('[data-count-sku]')];const changes=[];
 for(const field of values){if(field.value===''){notify('Toutes les quantités comptées sont requises');return;}const n=Number(field.value),i=item(field.dataset.countSku);if(!Number.isFinite(n)||n<0){notify('Comptage négatif ou invalide');return;}const d=round(n-i.qty);if(Math.abs(d)>.0001)changes.push({sku:i.sku,delta:d});}
 if(!changes.length){notify('Aucun écart détecté : le stock correspond au comptage.');snapshot('comptage physique sans écart');return;}
 if(!confirm(`Confirmer ${changes.length} écart(s) d’inventaire physique ? Cette action modifie le stock fictif et crée des écritures.`))return;
 try{for(const x of changes){let m=movement(x.sku,x.delta,x.delta>0?'ECART+':'ECART−','COMPTAGE','Écart de comptage physique (simulation)');if(x.delta>0)pair('Écart positif au comptage',m.id,'Stock','Écarts d’inventaire',m.cost);else pair('Écart négatif au comptage',m.id,'Écarts d’inventaire','Stock',m.cost);}audit('Comptage physique démo',String(changes.length)+' corrections');snapshot('comptage physique validé');notify(changes.length+' écart(s) comptabilisé(s).');}
 catch(e){notify('Erreur : '+e.message)}
}
function savePeriod(ev){ev.preventDefault();const d=safeFormData('hz-period-form'),mode=String(d.get('mode')),every=Number(d.get('every')),time=String(d.get('time'));
 if(!['daily','weekly','monthly','custom'].includes(mode)||!Number.isInteger(every)||every<1||every>365||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)){notify('Fréquence ou heure invalide');return;}
 ops.period={mode,every,time,anchor:iso()};ops.lastRun=iso();audit('Fréquence inventaire modifiée',`${mode}/${every}/${time}`);store();renderAll();notify('Fréquence enregistrée. Le prochain contrôle s’affiche.');}
function inventoryTable(){const p=ops.period;const f=$('hz-period-form');f.elements.mode.value=p.mode;f.elements.every.value=p.every;f.elements.time.value=p.time;
 $('hz-period-every').disabled=p.mode!=='custom';$('hz-last-inv').textContent=ops.snapshots.length?localDate(ops.snapshots[0].date):'Aucun';$('hz-next-inv').textContent=localDate(nextDate());
 $('hz-inventory-history').innerHTML=`<table><thead><tr><th>Identifiant / date</th><th>Déclenchement</th><th>Valeur théorique</th><th>Références</th><th>Alertes</th><th>Export</th></tr></thead><tbody>${ops.snapshots.slice(0,100).map(s=>`<tr><td><strong>${esc(s.id)}</strong><br><small>${esc(localDate(s.date))}</small></td><td>${esc(s.source)}</td><td>${price(s.value)}</td><td>${s.lines.length}</td><td>${s.missing}</td><td><button class="hz-btn" data-inv-export="${esc(s.id)}">CSV</button></td></tr>`).join('')}</tbody></table>`;
 $('hz-inventory-history').querySelectorAll('[data-inv-export]').forEach(b=>b.onclick=()=>downloadCsv('inventory',b.dataset.invExport));}
function ledgerTable(){const debit=money(ops.journal.reduce((s,j)=>s+j.lines.reduce((a,l)=>a+l.debit,0),0)),credit=money(ops.journal.reduce((s,j)=>s+j.lines.reduce((a,l)=>a+l.credit,0),0));
 $('hz-acc-sales').textContent=price(turnover());$('hz-acc-cogs').textContent=price(money(ops.sales.reduce((s,t)=>s+t.cost,0)));$('hz-acc-expenses').textContent=price(money(ops.expenses.reduce((s,e)=>s+e.amount,0)));$('hz-acc-profit').textContent=price(margin());
 $('hz-journal-count').textContent=ops.journal.length;$('hz-journal-debit').textContent=price(debit);$('hz-journal-balance').textContent=price(money(debit-credit));
 $('hz-journal-list').innerHTML=`<table><thead><tr><th>Pièce & date</th><th>Opération</th><th>Compte (illustratif)</th><th>Débit</th><th>Crédit</th></tr></thead><tbody>${ops.journal.slice(0,80).map(j=>j.lines.map((l,n)=>`<tr><td>${n?'':`<strong>${esc(j.id)}</strong><br><small>${esc(localDate(j.date))}</small>`}</td><td>${n?'':esc(j.description)+'<br><small>'+esc(j.ref)+'</small>'}</td><td>${esc(l.account)}</td><td>${l.debit?price(l.debit):'—'}</td><td>${l.credit?price(l.credit):'—'}</td></tr>`).join('')).join('')}</tbody></table>`;
}
function recordExpense(ev){ev.preventDefault();const d=safeFormData('hz-expense-form'),amount=Number(d.get('amount')),label=String(d.get('label')||'').trim(),category=String(d.get('category')),method=String(d.get('method'));
 if(!Number.isFinite(amount)||amount<=0||!label){notify('Dépense invalide');return;}
 const id=next('DEP');const rec={id,date:iso(),amount:money(amount),label,category,method};ops.expenses.unshift(rec);pair('Dépense : '+category,id,'Charges d’exploitation',method==='À payer'?'Fournisseurs':'Caisse',rec.amount);audit('Dépense démo',id);store();ev.currentTarget.reset();renderAll();notify('Dépense '+id+' et écriture créées.');}
function dlCsv(rows,name){const quote=x=>'"'+String(x??'').replaceAll('"','""')+'"';const csv='\ufeff'+rows.map(row=>row.map(quote).join(';')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);notify('Fichier CSV téléchargé.');}
function downloadCsv(type,selected){if(type==='stock'){dlCsv([['Référence','Article','Catégorie','Unité','Stock théorique','Seuil','Coût unitaire MAD','Valeur MAD'],...stockList().map(i=>[i.sku,i.name,i.cat,i.unit,i.qty,i.min,i.cost,money(i.qty*i.cost)])],'horenza-stock-demo.csv');}
 if(type==='movements'){dlCsv([['ID','Date','Article','SKU','Type','Delta','Avant','Après','Unité','Justificatif','Note','Valeur MAD'],...ops.moves.map(m=>[m.id,m.date,m.name,m.sku,m.type,m.delta,m.before,m.after,m.unit,m.reference,m.note,m.cost])],'horenza-mouvements-demo.csv');}
 if(type==='inventory'){const snaps=selected?ops.snapshots.filter(s=>s.id===selected):ops.snapshots;dlCsv([['Inventaire','Date','Mode','Article','SKU','Quantité théorique','Unité','Coût MAD','Valeur MAD','Alerte'],...snaps.flatMap(s=>s.lines.map(l=>[s.id,s.date,s.source,l.name,l.sku,l.quantity,l.unit,l.cost,l.value,l.below?'Sous seuil':'OK']))],'horenza-inventaires-demo.csv');}
 if(type==='accounting'){dlCsv([['Journal','Date','Référence','Libellé','Compte illustratif','Débit MAD','Crédit MAD'],...ops.journal.flatMap(j=>j.lines.map(l=>[j.id,j.date,j.ref,j.description,l.account,l.debit,l.credit]))],'horenza-journal-demo.csv');}
 if(type==='sales'){dlCsv([['Ticket','Date','Montant MAD','Coût matière MAD','Paiement'],...ops.sales.map(s=>[s.id,s.date,s.amount,s.cost,s.method])],'horenza-ventes-demo.csv');}
}

// Remplacer uniquement les fonctions de la présentation initiale ; la caisse et les modules partagent alors le même jeu de données.
low=issues;
renderTabs=function(){const cats=['Tous',...new Set(products.map(p=>p.cat))];$('category-tabs').innerHTML=cats.map(c=>`<button class="tab ${state.cat===c?'active':''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');$('category-tabs').querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{state.cat=b.dataset.cat;renderTabs();renderProducts()});};
renderProducts=function(){$('products').innerHTML=products.filter(p=>state.cat==='Tous'||p.cat===state.cat).map(p=>{const disabled=p.active===false||need({[p.sku]:1}).shortages.length>0;return `<button class="product" data-product="${esc(p.sku)}" ${disabled?'disabled style="opacity:.48"':''}><span>${esc(p.cat)}</span><b>${esc(p.name)}</b><span class="price">${price(p.price)} <small style="color:#99bbc0">${disabled?'Stock insuffisant':'+ ajouter'}</small></span></button>`}).join('');$('products').querySelectorAll('[data-product]').forEach(b=>b.onclick=()=>addProduct(b.dataset.product));};
addProduct=function(sku){const p=item(String(sku));if(!sellable(p))return;const nextCart={...state.cart,[sku]:(state.cart[sku]||0)+1};const req=need(nextCart);if(req.shortages.length){notify('Stock insuffisant : '+req.shortages[0]);return;}state.cart=nextCart;renderCart();};
adjust=function(sku,d){const nextCart={...state.cart,[sku]:Math.max(0,(state.cart[sku]||0)+d)};if(nextCart[sku]===0)delete nextCart[sku];const req=need(nextCart);if(req.shortages.length){notify('Stock insuffisant : '+req.shortages[0]);return;}state.cart=nextCart;renderCart();};
renderCart=function(){const list=Object.entries(state.cart).filter(([sku,n])=>n>0&&item(sku));$('cart-items').className=list.length?'':'ticketempty';$('cart-items').innerHTML=list.length?list.map(([sku,n])=>{let p=item(sku);return `<div class="ticketrow"><div><strong>${esc(p.name)}</strong><div class="sub">${price(p.price)} / unité</div></div><div class="qty"><button data-qty="-1" data-sku="${esc(sku)}" aria-label="Retirer un produit">−</button><b>${n}</b><button data-qty="1" data-sku="${esc(sku)}" aria-label="Ajouter un produit">+</button></div></div>`}).join(''):'Ajoutez un produit pour commencer.';$('cart-items').querySelectorAll('[data-qty]').forEach(b=>b.onclick=()=>adjust(b.dataset.sku,Number(b.dataset.qty)));$('cart-total').textContent=price(list.reduce((s,[sku,n])=>s+item(sku).price*n,0));};
checkout=function(){try{const rec=sell(state.cart);state.cart={};refreshTotals();store();renderTabs();renderProducts();renderCart();renderAll();notify(`Ticket ${rec.id} : ${price(rec.amount)} — stock et journal mis à jour. ${rec.warnings.join('; ')}`);}catch(e){notify('Encaissement refusé : '+e.message)}};
renderStock=function(){ $('stock-rows').innerHTML=stockList().map(p=>`<tr><td><strong>${esc(p.name)}</strong><br><small>${esc(p.sku)}</small></td><td>${esc(p.cat)}</td><td>${qty(p.qty)} ${esc(p.unit)}</td><td>${qty(p.min)}</td><td>${price(p.cost)}</td><td>${price(p.qty*p.cost)}</td><td><span class="tag ${p.qty<p.min?'warn':''}">${p.qty<p.min?'Sous seuil':'Disponible'}</span></td></tr>`).join('');$('hz-stock-overview').textContent=price(valuation());$('hz-stock-items').textContent=stockList().length;$('hz-stock-alerts').textContent=issues().length;};
restock=restockRealistic;
renderMetrics=function(){refreshTotals();for(const id of ['kpi-sales','report-sales'])$(id).textContent=price(state.sales);for(const id of ['kpi-orders','report-orders'])$(id).textContent=state.orders;$('kpi-tables').textContent=state.tables.size+' / 12';for(const id of ['kpi-low','report-low'])$(id).textContent=issues().length;$('report-avg').textContent=price(state.orders?state.sales/state.orders:0);$('activity').innerHTML=ops.sales.slice(0,4).map(s=>`<div class="minirow"><div><strong>${esc(s.id)}</strong><small>${price(s.amount)} · ${esc(localDate(s.date))}</small></div><span class="tag">Démo</span></div>`).join('')||'<p class="sub">Aucune vente fictive.</p>';};
renderCharts=function(){const vals=Array.from({length:7},(_,i)=>{const date=new Date();date.setDate(date.getDate()-(6-i));return {date,amt:ops.sales.filter(s=>today(s.date)===today(date)).reduce((v,s)=>v+s.amount,0)}});const max=Math.max(1,...vals.map(x=>x.amt))*1.2;$('chart').innerHTML=vals.map(x=>`<div class="bar" data-day="${x.date.toLocaleDateString('fr-FR',{weekday:'short'})}" title="${price(x.amt)}" style="--h:${Math.max(5,x.amt/max*100)}%"></div>`).join('');const counts=new Map();for(const sale of ops.sales)for(const l of sale.lines)counts.set(l.sku,(counts.get(l.sku)||0)+l.quantity);$('bestsellers').innerHTML=[...counts].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([sku,n],idx)=>`<div class="minirow"><div><strong>${idx+1}. ${esc(item(sku)?.name||sku)}</strong><small>${qty(n)} unité(s) vendue(s) en démo</small></div><div style="color:var(--gold)">${price(item(sku)?.price||0)}</div></div>`).join('')||'Aucune vente';};
renderAll=function(){renderStock();renderMetrics();renderTables();renderCharts();catalogList();formCatalogOptions();moveTable();inventoryTable();ledgerTable();countLines();};
askAI=function(n){const a=[['Résumé de performance',`Cette simulation totalise ${price(turnover())} de ventes sur ${ops.sales.length} tickets, une valeur de stock de ${price(valuation())} et un résultat de gestion estimatif de ${price(margin())}. Les montants sont fictifs.`],['Alertes et réapprovisionnement',`${issues().length} article(s) sous le seuil : ${issues().map(i=>i.name).join(', ')||'aucun'}. Les alertes se calculent sur les stocks théoriques mis à jour par vos opérations fictives.`],['Améliorer les ventes',`Sur ${ops.sales.length} tickets démo, votre panier moyen est ${price(ops.sales.length?turnover()/ops.sales.length:0)}. Suivez également le coût matière des recettes et comparez les périodes pour tester vos offres.`],['Opérations à surveiller',`Vérifiez les ${issues().length} seuil(s) dépassé(s), les mouvements sans justificatif, le prochain inventaire théorique (${localDate(nextDate())}), et rapprochez les écritures avec les pièces. Cette réponse est une règle de démonstration, sans agent IA connecté.`]];$('ai-title').textContent=a[n]?.[0]||a[0][0];$('ai-answer').textContent=a[n]?.[1]||a[0][1];};
window.exportCsv=function(){downloadCsv('stock')};

$('hz-kind').onchange=toggleKind;$('hz-add-recipe').onclick=()=>{let a=stockList().find(i=>i.active!==false);if(!a){notify('Créez un article stocké avant une recette.');return;}currentRecipe.push({sku:a.sku,qty:1});renderRecipe()};
$('hz-catalog-form').addEventListener('submit',saveItem);$('hz-cancel-item').onclick=newForm;$('hz-search-catalog').oninput=catalogList;
$('hz-move-form').addEventListener('submit',recordManualMove);$('hz-period-form').addEventListener('submit',savePeriod);$('hz-period-mode').onchange=()=>$('hz-period-every').disabled=$('hz-period-mode').value!=='custom';
$('hz-count-form').addEventListener('submit',validateCount);$('hz-expense-form').addEventListener('submit',recordExpense);
window.HZ={reset:resetDemo,csv:downloadCsv,snapshot:()=>snapshot('manuel')};
refreshTotals();reloadProducts();newForm();renderTabs();renderProducts();renderCart();renderAll();checkAuto();
// Une démo statique ne peut calculer qu'au chargement ou tant qu'elle reste ouverte.
setInterval(()=>checkAuto(),60000);
if(location.hash&&document.querySelector('.view'+location.hash)){go(location.hash.slice(1));}
})();