(function showroom(){
'use strict';
const root=document.getElementById('hx-showroom');if(!root)return;
const products=[
{id:'chef-jacket',cat:'CHEF',name:'Veste chef exécutif',kind:'chef',colors:[['Blanc','#efeee6'],['Noir','#1c2022'],['Gris','#788083']],sizes:['XS','S','M','L','XL','XXL'],desc:'Veste croisée de cuisine, manches longues'},
{id:'barista-apron',cat:'BARISTA',name:'Tablier barista signature',kind:'apron',colors:[['Espresso','#4b3d31'],['Noir','#292726'],['Olive','#667054']],sizes:['TU'],desc:'Tablier à bavette, poches et bretelles'},
{id:'service-shirt',cat:'SERVICE',name:'Chemise de serveur',kind:'shirt',colors:[['Blanc','#f5f2e9'],['Noir','#25292b'],['Marine','#243952']],sizes:['XS','S','M','L','XL'],desc:'Chemise habillée à col structuré'},
{id:'service-vest',cat:'SERVICE',name:'Gilet de maître d’hôtel',kind:'vest',colors:[['Noir','#232627'],['Anthracite','#5a5d61'],['Marine','#223952']],sizes:['XS','S','M','L','XL'],desc:'Gilet de salle, boutons métalliques'},
{id:'reception-blazer',cat:'ACCUEIL',name:'Blazer réception premium',kind:'blazer',colors:[['Noir','#202226'],['Marine','#2e3754'],['Sable','#a18d70']],sizes:['XS','S','M','L','XL'],desc:'Veste formelle pour réception et hôtellerie'},
{id:'housekeeping-tunic',cat:'ÉTAGE',name:'Tunique housekeeping',kind:'tunic',colors:[['Gris','#7f888b'],['Bleu','#3e7181'],['Noir','#303438']],sizes:['XS','S','M','L','XL'],desc:'Tunique de service et d’étage'},
{id:'hotel-polo',cat:'ACCUEIL',name:'Polo hospitality',kind:'polo',colors:[['Ivoire','#eae8db'],['Noir','#23272a'],['Vert','#3b543f']],sizes:['XS','S','M','L','XL','XXL'],desc:'Polo professionnel avec col contrasté'}
];
const cartKey='horenova-uniform-quote-v1';
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let selected=0,ci=0,si=null,face='front',qty=1,opened=false,cartOpen=false;
let cart=[];
try{const v=JSON.parse(localStorage.getItem(cartKey)||'[]');if(Array.isArray(v))cart=v.filter(x=>products.some(p=>p.id===x.id)&&Number.isInteger(x.qty)&&x.qty>0).slice(0,60)}catch(e){}
function productById(id){return products.find(p=>p.id===id)}
function save(){try{localStorage.setItem(cartKey,JSON.stringify(cart))}catch(e){}updateCount()}
function updateCount(){root.querySelectorAll('[data-hx-count]').forEach(n=>n.textContent=cart.reduce((a,x)=>a+x.qty,0))}
function shape(p,back){
const kind=p.kind;
const isApron=kind==='apron',isVest=kind==='vest';
const base=isApron?'M103 78L164 78Q178 96 183 119L193 309Q133 329 77 309L87 120Q89 92 103 78Z':isVest?'M105 71L115 79 136 112 160 79 167 71 196 114 186 311 85 311 75 114Z':'M103 70L113 85 159 85 169 70 199 96 241 176 211 198 187 173 201 310 68 310 81 173 54 198 25 176 69 96Z';
let detail='';
if(isApron){
detail=back?'<path d="M84 146L185 146M94 247L180 247" fill="none" stroke="#fff" stroke-opacity=".27" stroke-width="5"/>':'<path d="M110 80V44Q135 19 157 44V80" fill="none" stroke="#a78356" stroke-width="12"/><path d="M107 176H174V223H107Z" fill="#000" fill-opacity=".13" stroke="#fff" stroke-opacity=".25" stroke-width="2"/><path d="M80 120L46 178M190 120L225 178" stroke="#b99766" stroke-width="8"/>';
}else if(kind==='chef'){
detail=back?'<path d="M107 91Q136 107 167 91M91 180L177 180" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="3"/>':'<path d="M113 87L130 144 125 306M162 87L141 144 145 306" fill="none" stroke="#2a2c2b" stroke-opacity=".65" stroke-width="3"/>'+[135,169,204,239].map(y=>'<circle cx="115" cy="'+y+'" r="4" fill="#292b2b"/><circle cx="162" cy="'+(y-3)+'" r="4" fill="#292b2b"/>').join('');
}else if(isVest||kind==='blazer'){
detail=back?'<path d="M108 90Q134 108 164 90" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="3"/>':'<path d="M105 78L136 143 163 78" fill="none" stroke="#ccc4ac" stroke-width="9"/><path d="M136 143V305" fill="none" stroke="#15191b" stroke-width="3"/>'+[184,227,270].map(y=>'<circle cx="137" cy="'+y+'" r="3" fill="#d1b178"/>').join('');
}else{
detail=back?'<path d="M100 94Q136 111 168 94" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3"/>':'<path d="M104 81L136 117 166 81M136 117V186" stroke="#fff" stroke-opacity=".45" fill="none" stroke-width="4"/>'+(kind==='shirt'?'<circle cx="136" cy="195" r="3" fill="#ddd8c8"/><circle cx="136" cy="233" r="3" fill="#ddd8c8"/>':'');
if(kind==='tunic'&&!back)detail+='<path d="M78 212H107V251H78M164 212H193V251H164" fill="none" stroke="#fff" stroke-opacity=".32" stroke-width="3"/>';
}
return {base,detail};
}
function svg(p,color=0,back=false){
 const c=p.colors[color]?.[1]||p.colors[0][1],k=p.id+(back?'-back':'-front');
 const {base,detail}=shape(p,back);
 return `<svg class="hx-garment-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 360" role="img" aria-label="${safe(p.name)} : ${back?'dos':'avant'}"><defs><linearGradient id="hx-l-${k}" x1="0" y1="0" x2="1" y2=".12"><stop stop-color="#000" stop-opacity=".22"/><stop offset=".3" stop-color="#fff" stop-opacity=".18"/><stop offset=".52" stop-color="${c}"/><stop offset="1" stop-color="#000" stop-opacity=".29"/></linearGradient><filter id="hx-s-${k}" x="-25%" y="-25%" width="150%" height="160%"><feDropShadow dx="1" dy="8" stdDeviation="8" flood-opacity=".22"/></filter><pattern id="hx-p-${k}" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M1 0L0 1M5 4L4 5" stroke="#fff" stroke-width=".6" stroke-opacity=".15"/></pattern></defs><path d="M135 21Q123 4 143 5Q153 7 148 18L135 31" stroke="#8a705a" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M135 30L80 62Q72 68 82 69H189Q202 66 188 60Z" stroke="#876b54" stroke-width="5" fill="none"/><path d="${base}" fill="${c}" stroke="#222" stroke-opacity=".45" stroke-width="2" filter="url(#hx-s-${k})"/><path d="${base}" fill="url(#hx-l-${k})" opacity=".75"/><path d="${base}" fill="url(#hx-p-${k})" opacity=".45"/><path d="M94 110Q104 172 93 290M176 110Q162 174 183 288" fill="none" stroke="#fff" stroke-opacity=".15" stroke-width="4"/>${detail}<path d="M73 302Q136 315 197 302" fill="none" stroke="#fff" stroke-opacity=".24" stroke-width="2"/>${back?'':`<text x="169" y="${p.kind==='apron'?145:150}" fill="#c2b36c" font-family="Arial,sans-serif" font-size="16" font-weight="900">H</text>`}</svg>`;
}
const gallery=products.map((p,i)=>`<button type="button" class="hx-hanger" data-hx-product="${p.id}" style="--hx-n:${i};--hx-r:${i%2?'-2deg':'2deg'}" aria-label="Découvrir ${safe(p.name)}"><span class="hx-hang-visual">${svg(p)}</span><span class="hx-hang-name">${safe(p.name)}</span></button>`).join('');
root.innerHTML=`<div class="hx-show-head"><small>HORENOVA / HOSPITALITY SHOWROOM</small><h2>Le vestiaire des métiers.</h2><p>Tenues de chef, serveur, barista et réception. Explorez les détails, l'avant, le dos et les coloris.</p></div><div class="hx-stage"><div class="hx-light"></div><div class="hx-rail"></div><div class="hx-hangers">${gallery}</div></div><div class="hx-bar"><span>CHEF · BARISTA · SERVICE · ACCUEIL · ÉTAGE</span><button type="button" class="hx-open-cart" data-hx-cart>MA SÉLECTION <b data-hx-count>0</b> ↗</button></div><div class="hx-ticker"><div>HORENOVA ESSENTIALS ✦ CHEF WEAR ✦ BARISTA WEAR ✦ SERVICE UNIFORMS ✦ HOSPITALITY EDITION ✦ HORENOVA ESSENTIALS ✦</div></div><p class="hx-disclosure">Propositions de collection, représentations vectorielles originales. Photos fournisseurs, coloris, stocks et prix à confirmer avant commercialisation.</p><div class="hx-modal" id="hx-modal" hidden><div class="hx-scrim" data-hx-close></div><section id="hx-dialog" class="hx-dialog" role="dialog" aria-modal="true" aria-label="Détails de la tenue" tabindex="-1"></section></div>`;
function modal(){root.querySelector('#hx-modal').hidden=false;document.body.classList.add('hx-modal-open');opened=true;root.querySelector('#hx-dialog').focus();}
function close(){root.querySelector('#hx-modal').hidden=true;document.body.classList.remove('hx-modal-open');opened=false;root.querySelector('[data-hx-product]')?.focus();}
function showProduct(p){selected=products.indexOf(p);ci=0;si=null;qty=1;face='front';cartOpen=false;modal();renderProduct()}
function renderProduct(){
 const p=products[selected],d=root.querySelector('#hx-dialog');if(!p)return;
 d.innerHTML=`<button type="button" class="hx-x" data-hx-close aria-label="Fermer">×</button><div class="hx-view"><small>${safe(p.cat)} / HORENOVA STUDIO</small><div class="hx-big-garment">${svg(p,ci,face==='back')}</div><div class="hx-side"><button type="button" data-hx-side="front" aria-pressed="${face==='front'}">AVANT</button><button type="button" data-hx-side="back" aria-pressed="${face==='back'}">DOS</button></div><small>Prévisualisation illustrée · coupe et détails indicatifs</small></div><div class="hx-options"><small>HOSPITALITY / UNIFORMS</small><h2>${safe(p.name)}</h2><p>${safe(p.desc)}</p><div class="hx-alert">Disponibilité et prix à confirmer auprès du fournisseur.</div><div class="hx-heading">COLORIS <small>${safe(p.colors[ci][0])}</small></div><div class="hx-colors">${p.colors.map(([name,hex],i)=>`<button type="button" data-hx-color="${i}" aria-label="${safe(name)}" aria-pressed="${ci===i}" style="--hx-c:${hex}"></button>`).join('')}</div><div class="hx-heading">TAILLE <small>${si===null?'Choisir':safe(p.sizes[si])}</small></div><div class="hx-sizes">${p.sizes.map((sz,i)=>`<button type="button" data-hx-size="${i}" aria-pressed="${si===i}">${safe(sz)}</button>`).join('')}</div><div class="hx-heading">QUANTITÉ</div><div class="hx-qty"><button type="button" data-hx-qty="-1">−</button><span>${qty}</span><button type="button" data-hx-qty="1">+</button></div><button type="button" class="hx-cta" data-hx-add ${si===null?'disabled':''}>AJOUTER À MA SÉLECTION ↗</button><button type="button" class="hx-outline" data-hx-cart>VOIR MA SÉLECTION · <span data-hx-count>0</span></button><p class="hx-small">Aucune commande ni aucun paiement ne sont validés avant confirmation des références, tarifs et disponibilités.</p></div>`;updateCount();
}
function showCart(){
 cartOpen=true;modal();const d=root.querySelector('#hx-dialog');
 d.innerHTML=`<button type="button" class="hx-x" data-hx-close aria-label="Fermer">×</button><div class="hx-cart-panel"><small>HORENOVA / ÉQUIPEMENTS PROFESSIONNELS</small><h2>Votre sélection.</h2><p>Préparez votre demande de disponibilité et de tarif. Aucun paiement n'est demandé.</p><div class="hx-cart-lines">${cart.length?cart.map((v,i)=>{const p=productById(v.id);return `<div class="hx-cart-line"><div class="hx-thumb">${svg(p,Math.max(0,p.colors.findIndex(c=>c[0]===v.color)))}</div><div><strong>${safe(p.name)}</strong><small>${safe(v.color)} / ${safe(v.size)} / × ${v.qty}</small></div><button type="button" data-hx-remove="${i}" aria-label="Retirer">×</button></div>`}).join(''):'<p>Aucun uniforme sélectionné.</p>'}</div><div class="hx-warning">Prix et stocks non renseignés : ceci est un bon de demande, pas une commande passée.</div><div class="hx-actions"><button type="button" class="hx-outline" data-hx-continue>RETOUR AU VESTIAIRE</button><button type="button" class="hx-cta" data-hx-export ${cart.length?'':'disabled'}>TÉLÉCHARGER MA DEMANDE ↓</button></div></div>`;d.focus();
}
function exportCart(){if(!cart.length)return;const lines=['HORENOVA — BON DE DEMANDE','Document de préparation, non contractuel','Date : '+new Date().toLocaleDateString('fr-FR'),''];for(const v of cart){const p=productById(v.id);lines.push(`${p.name} | ${v.color} | ${v.size} | quantité ${v.qty}`)}lines.push('','Prix, stocks et livraison à confirmer. Aucune commande transmise.');const u=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download='horenova-uniformes-demande.txt';a.click();setTimeout(()=>URL.revokeObjectURL(u),4000)}
root.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b){if(e.target.closest('[data-hx-close]'))close();return}
 if(b.hasAttribute('data-hx-close'))return close();
 if(b.dataset.hxProduct)return showProduct(productById(b.dataset.hxProduct));
 if(b.hasAttribute('data-hx-cart'))return showCart();
 if(b.dataset.hxSide){face=b.dataset.hxSide;return renderProduct()}
 if(b.dataset.hxColor!==undefined){ci=Number(b.dataset.hxColor);return renderProduct()}
 if(b.dataset.hxSize!==undefined){si=Number(b.dataset.hxSize);return renderProduct()}
 if(b.dataset.hxQty){qty=Math.min(99,Math.max(1,qty+Number(b.dataset.hxQty)));return renderProduct()}
 if(b.hasAttribute('data-hx-add')){const p=products[selected];if(si===null)return;const size=p.sizes[si],color=p.colors[ci][0];const prev=cart.find(x=>x.id===p.id&&x.size===size&&x.color===color);if(prev)prev.qty=Math.min(99,prev.qty+qty);else cart.push({id:p.id,size,color,qty});save();return showCart()}
 if(b.dataset.hxRemove!==undefined){cart.splice(Number(b.dataset.hxRemove),1);save();return showCart()}
 if(b.hasAttribute('data-hx-continue'))return close();
 if(b.hasAttribute('data-hx-export'))return exportCart();
});
document.addEventListener('keydown',e=>{if(!opened)return;if(e.key==='Escape'){e.preventDefault();close()}if(e.key==='Tab'){const n=[...root.querySelectorAll('#hx-dialog button:not([disabled])')];if(!n.length)return;const idx=n.indexOf(document.activeElement);if(e.shiftKey&&(idx===0||idx<0)){e.preventDefault();n[n.length-1].focus()}else if(!e.shiftKey&&idx===n.length-1){e.preventDefault();n[0].focus()}}});
updateCount();window.HORENOVA_SHOWROOM={products:products.map(x=>({id:x.id,name:x.name})),getSelection:()=>cart.map(x=>({...x}))};
})();