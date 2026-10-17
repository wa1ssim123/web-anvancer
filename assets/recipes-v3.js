/* HORENZA v3 — recettes, unités convertibles, production et contrôle matière.
   Démonstration LOCALE, sans serveur de tâches, comptabilité agréée ni détection physique.
   Aucun appel réseau, aucune donnée sensible, aucun paiement réel. */
(()=>{
'use strict';
const B=window.HZBridge3, photos=window.HZ3_PICTURES||{};
if(!B){console.error('HORENZA v3 : socle métier indisponible');return;}
const {ops,item,tracked,sellable,movement,pair,next,store,audit,notify,round,money,price,qty,esc,localDate,iso,stockList,dlCsv,go}=B;
const $=id=>document.getElementById(id);
const by=sku=>item(sku);
const kindUnit=u=>u==='kg'?'mass':u==='L'?'volume':'count';
const UNITS={mass:['g','kg'],volume:['ml','cl','L'],count:['u','pièce','boîte','sachet','carton','portion','mesure personnalisée']};
const factors={g:.001,kg:1,ml:.001,cl:.01,L:1,u:1,'pièce':1,'boîte':1,sachet:1,carton:1,portion:1};
const escAttr=esc;
const roundBase=n=>Math.round((Number(n)+Number.EPSILON)*1e6)/1e6;
const picturesBySku={
 'POS-TAJ':'tajine','POS-COS':'couscous','POS-ESP':'cafe','POS-CAP':'cafe','POS-THE':'the','POS-JUS':'orange','POS-PIZ':'pizza','POS-BUR':'burger','POS-SAN':'poulet','FAR-001':'farine','BOE-001':'viande','POU-001':'poulet','CAF-001':'cafe','GOB-001':'gobelet','BOI-001':'boite','ORA-001':'orange','THE-001':'the','ONI-001':'oignon','TOM-001':'tomate','HUI-001':'huile','OLI-001':'olives','EPI-001':'epices','AIL-001':'oignon','PER-001':'epices','RIZ-001':'riz','MOZ-001':'pizza','LAI-001':'cafe','PAI-001':'burger','MEN-001':'the','SUC-001':'farine'
};
const v3=ops.v3||(ops.v3={version:3,specs:{},batches:[],plans:[],production:[],audit:[]});
for(const k of ['specs','batches','plans','production'])if(!v3[k]||typeof v3[k]!=='object')v3[k]=['batches','plans','production'].includes(k)?[]:{};
const freshArticles=[
 ['ONI-001','Oignons','Matières premières','kg',8,80,10],
 ['TOM-001','Tomates fraîches','Matières premières','kg',6,100,12],
 ['HUI-001','Huile d’olive','Matières premières','L',50,30,5],
 ['OLI-001','Olives vertes','Matières premières','kg',18,25,3],
 ['EPI-001','Épices tajine','Épices','kg',120,4,1],
 ['AIL-001','Ail','Épices','kg',20,6,1],
 ['PER-001','Persil frais','Épices','kg',18,5,1],
 ['RIZ-001','Riz','Matières premières','kg',12,160,20],
 ['SUC-001','Sucre','Matières premières','kg',7,25,5]
];
for(const [sku,name,cat,unit,cost,amount,min] of freshArticles){
 if(!by(sku))ops.items.push({sku,name,cat,kind:'article',unit,cost,qty:amount,min,price:0,recipe:[],active:true});
}
function defaultLine(sku,amount,unit,loss=0){return {sku,amount,unit,loss,custom:1};}
const tajine=[defaultLine('POU-001',250,'g'),defaultLine('ONI-001',120,'g'),defaultLine('TOM-001',100,'g'),defaultLine('OLI-001',60,'g'),defaultLine('HUI-001',40,'ml'),defaultLine('AIL-001',10,'g'),defaultLine('EPI-001',8,'g'),defaultLine('PER-001',5,'g')];
const couscous=[defaultLine('POU-001',180,'g'),defaultLine('RIZ-001',180,'g'),defaultLine('ONI-001',90,'g'),defaultLine('TOM-001',90,'g'),defaultLine('HUI-001',20,'ml'),defaultLine('EPI-001',7,'g')];
for(const [sku,name,cat,pr,recipe] of [
 ['POS-TAJ','Tajine poulet aux olives','Cuisine',75,tajine],
 ['POS-COS','Couscous maison','Cuisine',69,couscous]]){
 if(!by(sku))ops.items.push({sku,name,cat,kind:'produit',unit:'portion',cost:0,qty:null,min:0,price:pr,recipe:[],active:true});
 if(!Array.isArray(v3.specs[sku]))v3.specs[sku]=recipe;
}
// Remettre la nomenclature théorique normalisée dans le modèle v2 (compatibilité caisse).
function factor(l,i){
 if(l.unit==='mesure personnalisée')return Number(l.custom);
 if(!UNITS[kindUnit(i.unit)].includes(l.unit))return NaN;
 return factors[l.unit];
}
function requiredBase(l){
 const i=by(l.sku), n=Number(l.amount),p=Number(l.loss||0);
 if(!tracked(i)||i.active===false||!Number.isFinite(n)||n<=0||!Number.isFinite(p)||p<0||p>=90)throw Error('Quantité ou perte invalide pour '+(i?.name||l.sku));
 const f=factor(l,i);if(!Number.isFinite(f)||f<=0)throw Error('Unité incompatible : '+l.unit+' pour '+i.name);
 const result=roundBase(n*f/(1-p/100)); if(result<=0)throw Error('Quantité trop petite pour la précision de la démo');
 return result;
}
function reconstruct(p){return (p.recipe||[]).map(r=>{
 const i=by(r.sku),u=i?.unit==='kg'?'g':i?.unit==='L'?'ml':i?.unit||'u';
 return defaultLine(r.sku,roundBase(r.qty/(factors[u]||1)),u);
 });}
function recipe(sku){
 const p=by(sku);
 if(!p||p.kind!=='produit')return [];
 const saved=v3.specs[sku];return Array.isArray(saved)?saved:reconstruct(p);
}
function sync(sku){const p=by(sku);if(!p||p.kind!=='produit')return;
 const grouped=new Map();for(const l of recipe(sku)){const val=requiredBase(l);grouped.set(l.sku,roundBase((grouped.get(l.sku)||0)+val));}
 p.recipe=[...grouped].map(([sku,qty])=>({sku,qty}));
}
for(const p of ops.items.filter(i=>i.kind==='produit')){
 try{if(!Array.isArray(v3.specs[p.sku]))v3.specs[p.sku]=reconstruct(p);sync(p.sku);}catch(e){console.warn('Recette existante non modifiée',p.sku,e.message);}
}
store();
function photoFor(i){
 if(!i)return '';
 let key=picturesBySku[i.sku];
 if(!key){let n=i.name.toLowerCase();for(const [w,p] of Object.entries({tajine:'tajine',pizza:'pizza',poulet:'poulet',couscous:'couscous',burger:'burger',café:'cafe',farine:'farine',tomate:'tomate',huile:'huile',olives:'olives',oignon:'oignon',boîte:'boite',gobelet:'gobelet',riz:'riz'}))if(n.includes(w)){key=p;break;}}
 return photos[key]||'';
}
function photoHtml(i,cls='hz3-food'){let url=photoFor(i);return url?`<img class="${cls}" src="${url}" alt="Illustration générée de ${escAttr(i.name)}" loading="lazy">`:`<div class="${cls} hz3-fallback" aria-hidden="true">✦</div>`;}
function batchAvailable(sku){return roundBase(v3.batches.filter(b=>b.sku===sku&&b.remaining>0).reduce((s,b)=>s+b.remaining,0));}
function products(){return ops.items.filter(i=>i.kind==='produit'&&i.active!==false);}
function requirement(cart){
 const demand=new Map(), shortages=[],warnings=[],allocation={};
 for(const [sku,count] of Object.entries(cart)){
  const p=by(sku);if(!p||!sellable(p)||!Number.isInteger(count)||count<0){shortages.push('Produit ou quantité invalide : '+sku);continue;}
  if(!count)continue;
  if(tracked(p)){demand.set(sku,roundBase((demand.get(sku)||0)+count));continue;}
  const fromBatch=Math.min(count,batchAvailable(sku));
  allocation[sku]={fromBatch,fromRaw:count-fromBatch};
  if(!p.recipe?.length){warnings.push(p.name+' : fiche technique vide (pas de déstockage matière)');continue;}
  for(const r of p.recipe){demand.set(r.sku,roundBase((demand.get(r.sku)||0)+r.qty*(count-fromBatch)));}
 }
 for(const [sku,n] of demand){const i=by(sku);if(!tracked(i)||i.active===false||roundBase((i.qty||0)-n)<-0.000001)shortages.push(`${i?.name||sku} : besoin ${qty(n)} ${i?.unit||''} ; disponible ${qty(i?.qty||0)}`);}
 return {demand,shortages,warnings,allocation};
}
B.setNeed(requirement);
// Vente au POS : éviter le double déstockage lorsqu'un lot de production a déjà consommé ses matières.
function sellV3(cart,date=iso(),method='Espèces'){
 const entries=Object.entries(cart).filter(([sku,n])=>n>0);
 if(!entries.length)throw Error('Panier vide');
 for(const [sku,n] of entries)if(!by(sku)||!sellable(by(sku))||!Number.isInteger(n))throw Error('Ligne panier invalide');
 const {demand,shortages,warnings}=requirement(cart);if(shortages.length)throw Error(shortages[0]);
 const lines=entries.map(([sku,n])=>({sku,quantity:n,price:by(sku).price,name:by(sku).name}));
 const amount=money(lines.reduce((s,l)=>s+l.quantity*l.price,0));
 const id=next('TCK');let directCost=0,finishedCost=0;
 for(const l of lines){const p=by(l.sku);if(tracked(p))continue;
  let toShip=Math.min(l.quantity,batchAvailable(l.sku));
  for(const b of v3.batches.filter(b=>b.sku===l.sku&&b.remaining>0).sort((a,b)=>a.date.localeCompare(b.date))){
   if(toShip<=0)break;let used=Math.min(b.remaining,toShip);b.remaining=roundBase(b.remaining-used);toShip=roundBase(toShip-used);finishedCost=money(finishedCost+used*b.costPerPortion);
  }
 }
 for(const [sku,n] of demand){if(n<=0)continue;const movementRecord=movement(sku,-n,'VENTE',id,'Sortie POS selon fiche technique',date);directCost=money(directCost+movementRecord.cost);}
 const total=money(directCost+finishedCost);
 ops.sales.unshift({id,date,amount,cost:total,lines,method});
 pair('Vente simulée HORENZA',id,method==='Carte'?'Encaissements carte':'Caisse','Ventes',amount,date);
 pair('Coût matières sorties directement',id,'Coût des ventes','Stock',directCost,date);
 pair('Coût produits préfabriqués consommés',id,'Coût des ventes','Stock produits finis',finishedCost,date);
 audit('Encaissement POS v3',id);
 return {id,amount,cost:total,warnings};
}
B.setSell(sellV3);
function needsFor(sku,n){const p=by(sku);if(!p||p.kind!=='produit'||!Number.isInteger(n)||n<=0||n>100000)throw Error('Plat ou quantité invalide');
 const list=recipe(sku).map(l=>{let i=by(l.sku),f=requiredBase(l),base=roundBase(f*n);return {...l,name:i.name,base,baseUnit:i.unit,unitCost:i.cost,totalCost:money(base*i.cost),available:i.qty,shortage:roundBase(Math.max(0,base-i.qty))};});
 const grouped=new Map();for(const r of list)grouped.set(r.sku,roundBase((grouped.get(r.sku)||0)+r.base));
 const shortages=[...grouped].map(([s,amount])=>({stock:by(s),need:amount})).filter(x=>x.stock.qty+0.000001<x.need);
 return {sku,count:n,rows:list,total:money(list.reduce((s,r)=>s+r.totalCost,0)),shortages};
}
function exportBon(sku,n){const r=needsFor(sku,n),p=by(sku);
 dlCsv([['Bon prévisionnel (démo) - aucun mouvement stock','Valeur'],['Plat',p.name],['Portions',n],['Coût estimatif MAD',r.total],['Ingrédient','Référence','Quantité théorique','Unité stock','Coût unitaire MAD','Coût total MAD','Disponible','Manquant'],...r.rows.map(x=>[x.name,x.sku,x.base,x.baseUnit,x.unitCost,x.totalCost,x.available,x.shortage])],`horenza-bon-besoins-${p.sku}-${n}.csv`);
}
function productionPlan(sku,n){const p=by(sku),r=needsFor(sku,n);if(!r.rows.length)throw Error('Aucune fiche technique renseignée');
 const record={id:next('BES'),sku,name:p.name,date:iso(),qty:n,costEstimate:r.total,rows:r.rows.map(x=>({sku:x.sku,name:x.name,base:x.base,baseUnit:x.baseUnit,totalCost:x.totalCost})),status:'prévision'};
 v3.plans.unshift(record);v3.plans=v3.plans.slice(0,250);audit('Besoins théoriques planifiés',record.id);store();renderV3();notify('Bon de besoins '+record.id+' préparé, sans déstockage.');return record;
}
function confirmProduction(sku,n){const p=by(sku),r=needsFor(sku,n);if(!r.rows.length)throw Error('La fiche technique est vide');
 if(r.shortages.length)throw Error('Stock insuffisant : '+r.shortages.map(x=>x.stock.name+' (manque '+qty(x.need-x.stock.qty)+' '+x.stock.unit+')').join(', '));
 const ref=next('PRD'),date=iso();let cost=0;
 const bySku=new Map();for(const l of r.rows)bySku.set(l.sku,roundBase((bySku.get(l.sku)||0)+l.base));
 for(const [s,q] of bySku){const mv=movement(s,-q,'PRODUCTION',ref,'Consommation selon fiche technique v3',date);cost=money(cost+mv.cost);}
 const batch={id:ref,sku,date,quantity:n,remaining:n,costPerPortion:roundBase(cost/n),cost};
 v3.batches.push(batch);
 v3.production.unshift({id:ref,sku,name:p.name,date,quantity:n,cost,status:'produit',remaining:n});
 pair('Transfert matières vers produits finis',ref,'Stock produits finis','Stock',cost,date);
 audit('Production confirmée',ref);store();B.refresh();renderV3();notify(`Production ${ref} validée : matières sorties une fois, ${n} portions en stock fini.`);
 return batch;
}
function formattedAmount(value,unit){let n=roundBase(value),s=qty(n)+' '+unit;if(unit==='g'&&n>=1000)s+=' ('+qty(roundBase(n/1000))+' kg)';if(unit==='ml'&&n>=1000)s+=' ('+qty(roundBase(n/1000))+' L)';if(unit==='cl'&&n>=100)s+=' ('+qty(roundBase(n/100))+' L)';return s;}
function formattedNeed(row){return formattedAmount(Number(row.amount)*Number($('hz3-portions').value||1)/(1-Number(row.loss||0)/100),row.unit);}
const css=`<style>
.hz3-grid{display:grid;grid-template-columns:1.08fr .92fr;gap:17px}.hz3-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.hz3-card{border:1px solid rgba(240,198,140,.2);background:#0c2630;border-radius:14px;overflow:hidden;text-align:left;color:#eef5ee;padding:0;cursor:pointer;min-width:0}.hz3-card.selected{border-color:#eac68a;box-shadow:0 0 0 1px #eac68a44}.hz3-card p{padding:9px;margin:0}.hz3-card small{display:block;color:#9bb5bb}.hz3-food{display:block;width:100%;height:125px;object-fit:cover;background:radial-gradient(circle at 40% 30%,#23515d,#0b232b);border-radius:9px}.hz3-card .hz3-food{height:124px;border-radius:14px 14px 0 0}.hz3-fallback{display:grid;place-items:center;color:var(--gold);font-size:48px}.hz3-pair{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}.hz3-hero-image{height:210px;object-fit:cover;width:100%;border-radius:13px;border:1px solid rgba(249,200,113,.3)}.hz3-big{font-size:27px;color:var(--lightgold);font-weight:750}.hz3-good{color:#88f0cd}.hz3-warn{color:#ffc090}.hz3-table{overflow:auto;max-height:470px}.hz3-table table{width:100%;border-collapse:collapse;min-width:590px}.hz3-table th,.hz3-table td{border-bottom:1px solid #ffffff17;padding:10px 9px;text-align:left;font-size:12px}.hz3-table th{color:#c0d1d2;background:#123440}.hz3-editorrow{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,.75fr) minmax(0,.83fr) 80px 75px 32px;gap:6px;align-items:end;margin:9px 0}.hz3-field label{display:block;font-size:11px;color:var(--muted);margin:0 0 5px}.hz3-field input,.hz3-field select{width:100%;min-width:0;border-radius:9px;border:1px solid #d7b37965;padding:10px 7px;color:#f7f5ee;background:#092430}.hz3-field input[type=number]{font-variant-numeric:tabular-nums}.hz3-product-pic{height:66px;object-fit:cover;width:100%;max-width:118px;border-radius:10px;display:block;margin-bottom:6px}.hz3-stock-image{height:40px;width:40px;object-fit:cover;border-radius:8px;vertical-align:middle;margin-right:9px}.hz3-mini-pos-img{height:70px;width:100%;object-fit:cover;border-radius:8px;margin-bottom:7px}.hz3-stat{padding:14px 16px;border:1px solid #e9c68533;border-radius:12px;background:linear-gradient(145deg,#0c3440,#07212a)}.hz3-stat small{display:block;color:#a6bbbd;font-size:11px}.hz3-stat b{font-size:23px;color:#edcb91}.hz3-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:13px 0}.hz3-steps{display:grid;grid-template-columns:1fr 1fr;gap:12px}.hz3-inline{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.hz3-wide{width:100%}.hz3-table .hz3-warn{font-weight:700}.hz3-info{border-left:3px solid #d6ae6b;padding:12px 15px;background:#e5bd7210;border-radius:8px;font-size:12px;color:#c0d0ce;margin:12px 0}.hz3-pic-catalog{display:inline-block;width:40px;height:40px;object-fit:cover;border-radius:9px;vertical-align:middle;margin-right:7px}.hz3-qty{max-width:160px}.hz3-card-title{display:block;font-weight:760;margin-bottom:4px}
@media(max-width:1150px){.hz3-grid{grid-template-columns:1fr}.hz3-editorrow{grid-template-columns:repeat(3,minmax(0,1fr)) 70px 60px 32px}}
@media(max-width:760px){.hz3-cards{grid-template-columns:repeat(2,minmax(0,1fr))}.hz3-steps{grid-template-columns:1fr}.hz3-editorrow{grid-template-columns:1fr 90px 90px 65px 56px 26px;gap:4px}.hz3-field input,.hz3-field select{font-size:12px;padding:10px 4px}.hz3-stats{grid-template-columns:1fr 1fr}}
@media(max-width:475px){.hz3-card .hz3-food{height:100px}.hz3-editorrow{grid-template-columns:minmax(105px,1fr) 62px 67px 46px 45px 25px;gap:3px}.hz3-field label{font-size:9px}.hz3-field input,.hz3-field select{font-size:11px;padding:7px 3px}.hz3-stat b{font-size:18px}.hz3-cards{gap:8px}.hz3-grid .panel{padding:12px}}
</style>`;
document.head.insertAdjacentHTML('beforeend',css);
const html=`
<section class="view" id="recipes">
 <div class="topline"><div><h2>Fiches techniques & recettes</h2><p>Grammage, litres, emballages, pertes, prix des ingrédients et coût par portion.</p></div><span class="tag">Calculs réels · données fictives</span></div>
 <div class="hz3-info"><strong>Contrôle des matières :</strong> une fiche technique décrit les quantités par portion. Le calcul pour 100 plats est automatique ; la sortie réelle est enregistrée uniquement quand vous confirmez une production ou une vente POS. La démo ne mesure pas les stocks physiques.</div>
 <div class="hz3-grid"><div class="panel"><div class="hz3-pair"><h3 class="hz-inline-title">Choisir un plat</h3><button class="hz-btn" id="hz3-new-product">+ Nouveau plat</button></div><div class="hz3-cards" id="hz3-recipes-list"></div><div class="hz-separator"></div>
  <label class="hz-label">Recette sélectionnée<select class="hz-select" id="hz3-selected"></select></label>
  <div class="hz3-pair" style="margin-top:14px"><h3 class="hz-inline-title">Ingrédients par portion</h3><button class="hz-btn" id="hz3-add-line">+ Ingrédient</button></div>
  <div id="hz3-editor"></div><div class="hz3-pair" style="margin-top:12px"><button class="pill" id="hz3-save">Enregistrer la fiche technique</button><small class="hz-muted">Les changements affectent les prochaines ventes.</small></div>
 </div><div class="panel"><div id="hz3-dish-banner"></div><div class="hz3-stats"><div class="hz3-stat"><small>Coût / portion</small><b id="hz3-unit-cost">—</b></div><div class="hz3-stat"><small>Prix de vente</small><b id="hz3-sale-price">—</b></div><div class="hz3-stat"><small>Marge brute illustrative</small><b id="hz3-profit">—</b></div></div>
  <div class="hz3-pair"><label class="hz-label hz3-qty">Nombre de plats à calculer<input class="hz-input" id="hz3-portions" type="number" min="1" max="100000" step="1" value="100"></label><div class="hz3-inline"><button class="hz-btn" id="hz3-portion-1">1 plat</button><button class="hz-btn" id="hz3-portion-100">100 plats</button></div></div>
  <div class="hz3-table" id="hz3-needs" style="margin-top:13px"></div><div class="hz3-pair" style="margin-top:12px"><strong>Coût total des matières : <span id="hz3-total" class="hz3-good"></span></strong><span class="hz3-warn" id="hz3-availability"></span></div><div class="hz3-inline" style="margin-top:13px"><button class="hz-btn" id="hz3-export-bon">Exporter le bon de besoins ↓</button><button class="hz-btn" id="hz3-create-bon">Planifier sans déstocker</button></div>
 </div></div>
</section>
<section class="view" id="production">
 <div class="topline"><div><h2>Production cuisine & bons de sortie</h2><p>Préparer 1, 10, 100 ou plus de plats, puis confirmer les consommations matières.</p></div><span class="tag">Traçabilité de démonstration</span></div>
 <div class="hz3-grid"><div class="panel"><h3 class="hz-inline-title">Nouvelle production</h3><div class="hz3-steps"><label class="hz-label">Plat à produire<select class="hz-select" id="hz3-batch-product"></select></label><label class="hz-label">Nombre de portions<input class="hz-input" type="number" id="hz3-batch-count" min="1" max="100000" step="1" value="10"></label></div>
 <div class="hz3-stats"><div class="hz3-stat"><small>Coût matière prévu</small><b id="hz3-batch-total">—</b></div><div class="hz3-stat"><small>Manquants</small><b id="hz3-batch-short">—</b></div><div class="hz3-stat"><small>Portions déjà produites</small><b id="hz3-batch-finished">—</b></div></div><div class="hz3-table" id="hz3-batch-requirements"></div>
 <div class="hz3-inline" style="margin-top:15px"><button class="hz-btn" id="hz3-batch-plan">Bon de besoins (sans déstockage)</button><button class="pill" id="hz3-batch-confirm">Confirmer production et sortir les matières</button></div>
 <p class="hz3-info">Une production confirmée déstocke les ingrédients <strong>une seule fois</strong> et enregistre les portions préparées. La vente POS de ces portions ne retire pas de nouveau les ingrédients ; elle transfère leur coût aux ventes.</p></div>
 <div class="panel"><h3 class="hz-inline-title">Historique et portions prêtes</h3><div id="hz3-production-history" class="hz3-table"></div><div class="hz-separator"></div><h3 class="hz-inline-title">Bons prévisionnels</h3><div id="hz3-plans" class="hz3-table"></div></div>
 </div>
</section>
<section class="view" id="controle">
 <div class="topline"><div><h2>Contrôle matière & écarts</h2><p>Ventes, consommations théoriques, production, sorties exceptionnelles et rapprochement.</p></div><span class="tag warn">Aucune preuve automatique de vol</span></div>
 <div class="hz3-info">Les écarts d'inventaire peuvent provenir d'une erreur de comptage, d'une portion différente de la recette, de la casse, des pertes, d'une saisie tardive ou d'une disparition. <strong>Seul un comptage physique</strong> permet de vérifier la différence avec le stock théorique.</div>
 <div class="hz3-stats" id="hz3-control-stats"></div><div class="panel" style="margin-top:15px"><h3 class="hz-inline-title">Réconciliation des mouvements</h3><div class="hz3-table" id="hz3-control-rows"></div></div><div class="hz3-pair" style="margin-top:13px"><button class="hz-btn" data-go="inventory" id="hz3-go-inventory">Faire un comptage physique →</button><button class="hz-btn" id="hz3-export-movements">Exporter historique CSV ↓</button></div>
</section>`;
$('ai').insertAdjacentHTML('beforebegin',html);
const sidebar=document.querySelector('.side'), anchor=sidebar.querySelector('[data-go="movements"]');
anchor.insertAdjacentHTML('beforebegin',`<button class="nav" data-go="recipes"><span class="ico">♨</span> Fiches techniques & recettes</button><button class="nav" data-go="production"><span class="ico">♧</span> Production cuisine</button><button class="nav" data-go="controle"><span class="ico">◉</span> Contrôle des écarts</button>`);
for(const nav of sidebar.querySelectorAll('[data-go="recipes"],[data-go="production"],[data-go="controle"]'))nav.addEventListener('click',()=>go(nav.dataset.go));
const oldPos=B.getRenderProducts();
B.setRenderProducts(function(){oldPos();$('products').querySelectorAll('[data-product]').forEach(btn=>{const p=by(btn.dataset.product);if(p&&!btn.querySelector('img'))btn.insertAdjacentHTML('afterbegin',photoHtml(p,'hz3-mini-pos-img'));});});
const oldAll=B.getRenderAll();
B.setRenderAll(function(){oldAll();renderV3();paintCatalog();});
let active=products().find(i=>i.sku==='POS-TAJ')?.sku||products()[0]?.sku||'',editingLines=[];
function selectRecipe(sku){if(!by(sku)||by(sku).kind!=='produit')return;active=sku;editingLines=recipe(sku).map(r=>({...r}));$('hz3-selected').value=sku;renderV3();}
function rowHtml(l,index){const i=by(l.sku),validUnit=i?kindUnit(i.unit):'count';
 return `<div class="hz3-editorrow" data-idx="${index}">
  <div class="hz3-field"><label>Matière / article</label><select data-field="sku">${stockList().filter(x=>x.active!==false).map(x=>`<option value="${esc(x.sku)}" ${x.sku===l.sku?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div>
  <div class="hz3-field"><label>Quantité</label><input data-field="amount" type="number" min="0.001" step="any" value="${Number(l.amount)}"></div>
  <div class="hz3-field"><label>Unité</label><select data-field="unit">${UNITS[validUnit].map(u=>`<option value="${esc(u)}" ${u===l.unit?'selected':''}>${esc(u)}</option>`).join('')}</select></div>
  <div class="hz3-field"><label>Perte %</label><input data-field="loss" type="number" min="0" max="89.9" step="0.1" value="${Number(l.loss||0)}"></div>
  <div class="hz3-field"><label>Facteur</label><input data-field="custom" type="number" min="0.000001" step="any" value="${Number(l.custom||1)}" title="Facteur vers l'unité du stock pour une mesure personnalisée" ${l.unit==='mesure personnalisée'?'':'disabled'}></div>
  <button type="button" class="hz-btn danger" data-remove="${index}" title="Enlever cet ingrédient">×</button>
 </div>`;
}
function renderEditor(){const e=$('hz3-editor');e.innerHTML=editingLines.length?editingLines.map(rowHtml).join(''):'<div class="hz3-info">Aucune matière ajoutée. Ajoutez un ingrédient pour calculer le coût et la consommation.</div>';
 e.querySelectorAll('.hz3-editorrow').forEach(row=>{
 const idx=Number(row.dataset.idx);
 for(const inp of row.querySelectorAll('[data-field]')){
  inp.addEventListener('change',()=>{
   let field=inp.dataset.field;
   editingLines[idx][field]=field==='sku'||field==='unit'?inp.value:Number(inp.value);
   if(field==='sku'){const i=by(inp.value);editingLines[idx].unit=i?.unit==='kg'?'g':i?.unit==='L'?'ml':'u';renderEditor();}
   else if(field==='unit')renderEditor();
   renderCalculation();
  });
 }
 row.querySelector('[data-remove]').onclick=()=>{editingLines.splice(idx,1);renderEditor();renderCalculation();};
 });
}
function previewNeeds(){const n=Number($('hz3-portions').value),p=by(active);if(!Number.isSafeInteger(n)||n<1||n>100000)throw Error('Nombre de portions : entrer un entier de 1 à 100 000');
 let rows=[],total=0;
 for(const l of editingLines){const i=by(l.sku),base=roundBase(requiredBase(l)*n),cost=money(base*i.cost);total+=cost;rows.push({...l,name:i.name,base,baseUnit:i.unit,cost,available:i.qty,shortage:roundBase(Math.max(0,base-i.qty))});}
 return {n,rows,total:money(total),p};
}
function renderCalculation(){
 let p=by(active);if(!p)return;
 $('hz3-dish-banner').innerHTML=`${photoHtml(p,'hz3-hero-image')}<h3 style="margin:10px 0 4px">${esc(p.name)}</h3><div class="hz-muted">Prix de vente ${price(p.price)} · ${qty(batchAvailable(p.sku))} portion(s) déjà préparée(s)</div>`;
 try{const r=previewNeeds(),unit=r.n?money(r.total/r.n):0,marge=p.price?Math.round((p.price-unit)/p.price*100):0;
 $('hz3-unit-cost').textContent=price(unit);$('hz3-sale-price').textContent=price(p.price);$('hz3-profit').textContent=marge+' %';$('hz3-total').textContent=price(r.total);
 $('hz3-availability').textContent=r.rows.some(x=>x.shortage>0)?'⚠ Stock théorique insuffisant':'✓ Stock théorique disponible';
 $('hz3-needs').innerHTML=`<table><thead><tr><th>Ingrédient</th><th>Besoin ${r.n} portion(s)</th><th>En stock</th><th>Coût</th></tr></thead><tbody>${r.rows.map(l=>`<tr><td>${esc(l.name)}</td><td>${esc(formattedAmount(l.amount*r.n/(1-Number(l.loss||0)/100),l.unit))}</td><td class="${l.shortage>0?'hz3-warn':'hz3-good'}">${qty(l.available)} ${esc(l.baseUnit)}</td><td>${price(l.cost)}</td></tr>`).join('')}</tbody></table>`;
 }catch(err){$('hz3-needs').innerHTML=`<div class="hz3-info hz3-warn">${esc(err.message)}</div>`;$('hz3-total').textContent='—';$('hz3-availability').textContent='Vérifiez les ingrédients';$('hz3-unit-cost').textContent='—';$('hz3-sale-price').textContent=price(p.price);$('hz3-profit').textContent='—';}
}
function batchOverview(){const sku=$('hz3-batch-product').value,n=Number($('hz3-batch-count').value);
 if(!sku||!Number.isInteger(n)||n<1||n>100000)return;
 try{const result=needsFor(sku,n);
 $('hz3-batch-total').textContent=price(result.total);$('hz3-batch-short').textContent=result.shortages.length;$('hz3-batch-finished').textContent=qty(batchAvailable(sku));
 $('hz3-batch-requirements').innerHTML=`<table><thead><tr><th>Matière</th><th>Besoin</th><th>Disponible</th><th>Écart</th></tr></thead><tbody>${result.rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${qty(r.base)} ${esc(r.baseUnit)}</td><td>${qty(r.available)} ${esc(r.baseUnit)}</td><td class="${r.shortage>0?'hz3-warn':'hz3-good'}">${r.shortage>0?'-'+qty(r.shortage):'OK'}</td></tr>`).join('')}</tbody></table>`;
 $('hz3-batch-confirm').disabled=result.shortages.length>0||!result.rows.length;
 }catch(e){$('hz3-batch-requirements').textContent=e.message;$('hz3-batch-confirm').disabled=true;}
}
function renderV3(){
 const ps=products();if(!by(active)||by(active).kind!=='produit')active=ps[0]?.sku||'';
 const old=$('hz3-batch-product').value;
 $('hz3-selected').innerHTML=ps.map(p=>`<option value="${esc(p.sku)}">${esc(p.name)}</option>`).join('');$('hz3-selected').value=active;
 $('hz3-recipes-list').innerHTML=ps.map(p=>`<button type="button" class="hz3-card ${p.sku===active?'selected':''}" data-select="${esc(p.sku)}">${photoHtml(p)}<p><span class="hz3-card-title">${esc(p.name)}</span><small>${price(p.price)} · ${recipe(p.sku).length} matière(s)</small></p></button>`).join('');
 $('hz3-recipes-list').querySelectorAll('[data-select]').forEach(btn=>btn.onclick=()=>selectRecipe(btn.dataset.select));
 $('hz3-batch-product').innerHTML=ps.map(p=>`<option value="${esc(p.sku)}">${esc(p.name)}</option>`).join('');$('hz3-batch-product').value=ps.find(p=>p.sku===old)?old:active;
 // L'édition en cours est conservée, y compris les unités et pertes non sauvegardées.
 if(!Array.isArray(editingLines)||!editingLines.length&&!$('hz3-editor').dataset.edited)editingLines=recipe(active).map(x=>({...x}));
 renderEditor();renderCalculation();batchOverview();
 $('hz3-production-history').innerHTML=`<table><thead><tr><th>Date / référence</th><th>Plat</th><th>Préparées</th><th>Encore disponibles</th><th>Coût matière</th></tr></thead><tbody>${v3.batches.slice(-40).reverse().map(b=>`<tr><td><strong>${esc(b.id)}</strong><br><small>${esc(localDate(b.date))}</small></td><td>${esc(by(b.sku)?.name||b.sku)}</td><td>${qty(b.quantity)}</td><td>${qty(b.remaining)}</td><td>${price(b.cost)}</td></tr>`).join('')||'<tr><td colspan="5">Aucune production confirmée</td></tr>'}</tbody></table>`;
 $('hz3-plans').innerHTML=`<table><thead><tr><th>Date / référence</th><th>Plat</th><th>Portions</th><th>Coût estimé</th></tr></thead><tbody>${v3.plans.slice(0,30).map(b=>`<tr><td>${esc(b.id)}<br><small>${esc(localDate(b.date))}</small></td><td>${esc(b.name)}</td><td>${qty(b.qty)}</td><td>${price(b.costEstimate)}</td></tr>`).join('')||'<tr><td colspan="4">Aucun bon</td></tr>'}</tbody></table>`;
 const movements=ops.moves,production=movements.filter(m=>m.type==='PRODUCTION'),pos=movements.filter(m=>m.type==='VENTE'),loss=movements.filter(m=>['SORTIE','PERTE','ECART−','ECART+'].includes(m.type)),diff=movements.filter(m=>m.type.startsWith('ECART'));
 $('hz3-control-stats').innerHTML=`<div class="hz3-stat"><small>Consommation production</small><b>${price(production.reduce((s,m)=>s+m.cost,0))}</b></div><div class="hz3-stat"><small>Sorties ventes POS</small><b>${price(pos.reduce((s,m)=>s+m.cost,0))}</b></div><div class="hz3-stat"><small>Écarts de comptage</small><b>${diff.length}</b></div>`;
 $('hz3-control-rows').innerHTML=`<table><thead><tr><th>Article / référence</th><th>Sorties POS</th><th>Production</th><th>Sorties & pertes</th><th>Écarts physiques</th></tr></thead><tbody>${stockList().map(i=>{
 const sum=t=>roundBase(movements.filter(m=>m.sku===i.sku&&t.includes(m.type)).reduce((s,m)=>s+Math.abs(m.delta),0));
 const d=sum(['VENTE']),p=sum(['PRODUCTION']),l=sum(['SORTIE','PERTE']),e=sum(['ECART+','ECART−']);
 return `<tr><td>${photoFor(i)?`<img src="${photoFor(i)}" class="hz3-stock-image" alt="" loading="lazy">`:''}${esc(i.name)}</td><td>${qty(d)} ${esc(i.unit)}</td><td>${qty(p)} ${esc(i.unit)}</td><td>${qty(l)} ${esc(i.unit)}</td><td class="${e>0?'hz3-warn':''}">${qty(e)} ${esc(i.unit)}</td></tr>`;}).join('')}</tbody></table>`;
}
function paintCatalog(){const c=$('hz-catalog-list');if(!c)return;
 c.querySelectorAll('[data-edit]').forEach(btn=>{const sku=btn.dataset.edit,p=by(sku),tr=btn.closest('tr'),td=tr?.querySelector('td');if(p&&td&&!td.querySelector('.hz3-pic-catalog')){const url=photoFor(p);if(url)td.insertAdjacentHTML('afterbegin',`<img src="${url}" class="hz3-pic-catalog" alt="" loading="lazy">`);}});
 const b=$('stock-rows');b?.querySelectorAll('tr').forEach(tr=>{const sku=tr.querySelector('small')?.textContent,p=by(sku),td=tr.querySelector('td');if(p&&td&&!td.querySelector('img')){const url=photoFor(p);if(url)td.insertAdjacentHTML('afterbegin',`<img src="${url}" class="hz3-stock-image" alt="" loading="lazy">`);}});
}
function saveCurrent(){try{const p=by(active);if(!p)throw Error('Aucun plat choisi');if(!editingLines.length)throw Error('Ajoutez au moins un ingrédient');
 const seen=new Set();for(const l of editingLines){if(seen.has(l.sku))throw Error('Ingrédient répété : regroupez les quantités');seen.add(l.sku);requiredBase(l);}
 v3.specs[active]=editingLines.map(l=>({...l}));sync(active);audit('Fiche technique mise à jour',active);store();B.refresh();selectRecipe(active);notify('Fiche '+p.name+' enregistrée et utilisée par les prochaines opérations.');
 }catch(e){notify('Erreur recette : '+e.message);}
}
$('hz3-selected').onchange=e=>selectRecipe(e.target.value);
$('hz3-portions').oninput=renderCalculation;
$('hz3-portion-1').onclick=()=>{$('hz3-portions').value=1;renderCalculation()};
$('hz3-portion-100').onclick=()=>{$('hz3-portions').value=100;renderCalculation()};
$('hz3-add-line').onclick=()=>{let i=stockList().find(x=>x.active!==false&&!editingLines.some(l=>l.sku===x.sku));if(!i){notify('Aucun ingrédient disponible à ajouter');return;}editingLines.push(defaultLine(i.sku,i.unit==='kg'?100:i.unit==='L'?100:1,i.unit==='kg'?'g':i.unit==='L'?'ml':'u'));renderEditor();renderCalculation();};
$('hz3-save').onclick=saveCurrent;
$('hz3-export-bon').onclick=()=>{try{exportBon(active,Number($('hz3-portions').value));notify('Bon de besoins CSV généré selon la fiche enregistrée.');}catch(e){notify(e.message)}};
$('hz3-create-bon').onclick=()=>{try{productionPlan(active,Number($('hz3-portions').value))}catch(e){notify(e.message)}};
$('hz3-batch-product').onchange=batchOverview;$('hz3-batch-count').oninput=batchOverview;
$('hz3-batch-plan').onclick=()=>{try{productionPlan($('hz3-batch-product').value,Number($('hz3-batch-count').value))}catch(e){notify(e.message)}};
$('hz3-batch-confirm').onclick=()=>{try{confirmProduction($('hz3-batch-product').value,Number($('hz3-batch-count').value))}catch(e){notify('Production refusée : '+e.message)}};
$('hz3-go-inventory').onclick=()=>go('inventory');$('hz3-export-movements').onclick=()=>window.HZ.csv('movements');
$('hz3-new-product').onclick=()=>{go('catalog');const f=$('hz-catalog-form');f.reset();f.elements.kind.value='produit';f.elements.sku.value='POS-';f.elements.cat.value='Cuisine';$('hz-kind').dispatchEvent(new Event('change'));notify('Créez votre plat dans le catalogue, puis complétez sa fiche technique ici.');};
// Une mise à jour complète des cartes POS déclenche l'ajout des images.
B.refresh();editingLines=recipe(active).map(x=>({...x}));renderV3();paintCatalog();
if(location.hash==='#recipes'||location.hash==='#production'||location.hash==='#controle')go(location.hash.slice(1));
window.HORENZA_V3_TEST={ops,v3,recipe,needsFor,requirement,sellV3,productionPlan,confirmProduction,photoFor,requiredBase,selectRecipe,saveCurrent,batchAvailable};
})();