/* HORENOVA Wardrobe / interactive hospitality showroom
   Original studio concept visuals; no claim of physical inventory or 3D mesh. */
(function(){
'use strict';
const root=document.getElementById('hx-showroom');if(!root)return;
const products=[
{id:'service-apron',cat:'SERVICE WEAR',name:'Signature Service Apron',short:'Tablier de service',image:'https://static.wixstatic.com/media/d0158d_989ee5fbb26b4ed88cfa64763e83c9ea~mv2.png',desc:'Tablier noir de service, chemise blanche et poches utilitaires. Concept de collection HORENOVA.',sizes:['S','M','L','XL'],colors:[['Noir','linear-gradient(#191b20,#191b20)','none'],['Anthracite','#44484c','grayscale(.85) brightness(1.25)'],['Espresso','#604436','sepia(.5) saturate(.75)']]},
{id:'barista-apron',cat:'BARISTA WEAR',name:'Signature Barista Apron',short:'Tablier barista',image:'https://static.wixstatic.com/media/d0158d_8bd1ef59696d4632b9c1b810c597dcc6~mv2.png',desc:'Tablier de barista foncé, brides effet cuir et serviette de service. Concept de collection HORENOVA.',sizes:['TU'],colors:[['Espresso','#312b28','none'],['Noir','#151718','grayscale(1) brightness(.73)'],['Olive','#51523b','sepia(.3) hue-rotate(36deg) saturate(.77)']]},
{id:'chef-jacket',cat:'CHEF WEAR',name:'Executive Chef Jacket',short:'Veste de chef',image:'https://static.wixstatic.com/media/d0158d_f01b51d813944373809b700c26427118~mv2.png',desc:'Veste de chef croisée, boutons contrastés et col officier. Concept visuel HORENOVA.',sizes:['XS','S','M','L','XL','XXL'],colors:[['Blanc','#f8f5ef','none'],['Noir','#151618','grayscale(1) brightness(.36) contrast(1.2)'],['Charbon','#54565a','grayscale(1) brightness(.66)'],['Sable','#b1a18b','sepia(.46) saturate(.7) brightness(.90)'],['Olive','#8b8a65','sepia(.55) hue-rotate(21deg) saturate(.75)']]},
{id:'service-vest',cat:'SERVICE WEAR',name:'Service Vest',short:'Gilet de service',image:'https://static.wixstatic.com/media/d0158d_8b6c73c5c548462bad174caf20e6d5bd~mv2.png',desc:'Gilet formel avec chemise blanche et cravate noire, inspiré du service hôtelier. Concept HORENOVA.',sizes:['XS','S','M','L','XL'],colors:[['Noir','#1c1d22','none'],['Anthracite','#46484a','grayscale(.9) brightness(1.26)'],['Marine','#252b42','hue-rotate(14deg) saturate(.9)']]},
{id:'housekeeping-tunic',cat:'HOUSEKEEPING',name:'Housekeeping Tunic',short:'Tunique housekeeping',image:'https://static.wixstatic.com/media/d0158d_bfe457cad3a04f5caad1aec51227f6c0~mv2.png',desc:'Tunique professionnelle grise et poches contrastées pour les métiers de l’étage. Concept HORENOVA.',sizes:['XS','S','M','L','XL'],colors:[['Gris','#777f82','none'],['Sable','#b6a58d','sepia(.65) saturate(.72)'],['Bleu','#536574','hue-rotate(28deg) saturate(.8)']]},
{id:'reception-blazer',cat:'RECEPTION',name:'Reception Blazer',short:'Blazer de réception',image:'https://static.wixstatic.com/media/d0158d_72b9e0fe88cc4fdca0cf3b49aeafad7d~mv2.png',desc:'Blazer noir avec finitions contrastées, pour les métiers de l’accueil. Concept HORENOVA.',sizes:['XS','S','M','L','XL'],colors:[['Noir','#17191a','none'],['Marine','#30374c','hue-rotate(30deg) saturate(.8)'],['Charbon','#545356','grayscale(1) brightness(1.26)']]},
{id:'hotel-polo',cat:'HOSPITALITY',name:'Hospitality Polo',short:'Polo hospitality',image:'https://static.wixstatic.com/media/d0158d_6ac6241766f34e4ea95554e99692f88e~mv2.png',desc:'Polo de service ivoire avec col et revers contrastés. Concept HORENOVA.',sizes:['XS','S','M','L','XL','XXL'],colors:[['Ivoire','#efeee8','none'],['Noir','#222324','grayscale(1) brightness(.4)'],['Sable','#b4a28a','sepia(.55) saturate(.65) brightness(.9)']]}
];
const KEY='horenova-wardrobe-2026-cart';
const state={index:2,color:0,face:'front',size:null,qty:1,step:0,modal:false};
let cart=[];
try{const old=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(old)){cart=old.filter(i=>products.some(p=>p.id===i.id)&&Number.isInteger(i.qty)&&i.qty>0).slice(0,70)}}catch{}
const $=s=>root.querySelector(s);
const els=s=>Array.from(root.querySelectorAll(s));
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const item=()=>products[state.index];
const color=()=>item().colors[state.color];
const qtyTotal=()=>cart.reduce((n,c)=>n+c.qty,0);
const arrow='<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 12h16m-7-7 7 7-7 7"/></svg>';
const icons={
eye:'<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
rotate:'<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M21 11a9 9 0 0 0-15-6L3 8m0-5v5h5M3 13a9 9 0 0 0 15 6l3-3m0 5v-5h-5"/></svg>',
zoom:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>'
};
function persist(){try{localStorage.setItem(KEY,JSON.stringify(cart))}catch{}}
function swatches(action){return item().colors.map((c,i)=>'<button type="button" '+action+'="'+i+'" aria-label="'+safe(c[0])+'" aria-pressed="'+(state.color===i)+'" class="hx26-swatch'+(state.color===i?' active':'')+'" style="--sw:'+c[1]+'"><span></span></button>').join('')}
function stage(){
return '<section class="hx26-hero" aria-label="Showroom de mode professionnelle HORENOVA">'
+'<div class="hx26-halo"></div>'
+'<header class="hx26-header"><nav class="hx26-menu"><a href="#hx-showroom" aria-current="page">SHOP</a><a href="#products">COLLECTIONS</a><a href="/academy.html">ABOUT</a></nav><div class="hx26-brand" aria-label="HORENOVA SHOP"><strong>HORENOVA</strong><span>SHOP</span></div><nav class="hx26-menu-right"><a href="#products" aria-label="Chercher des articles">⌕ <span>SEARCH</span></a><a href="/account.html">♙ <span>ACCOUNT</span></a><button type="button" data-hx26="cart">♧ <span>CART (<b data-hx26-count>0</b>)</span></button></nav></header>'
+'<div class="hx26-layout"><div class="hx26-showcase"><div class="hx26-rack" tabindex="0" aria-label="Penderie interactive : flèches gauche et droite pour choisir un vêtement"><div class="hx26-rail"></div><div class="hx26-items">'
+products.map((p,i)=>'<button type="button" data-hx26-item="'+i+'" class="hx26-slot'+(i===state.index?' is-selected':'')+'" style="--idx:'+i+'" aria-label="'+safe(p.short)+'"><span class="hx26-sway"><img loading="eager" decoding="async" src="'+p.image+'" alt="'+safe(p.short)+'" draggable="false"></span><span class="hx26-item-label">'+safe(p.short)+'</span></button>').join('')
+'</div><div class="hx26-actions"><button type="button" data-hx26="view" aria-label="Voir le vêtement">'+icons.eye+'</button><button type="button" data-hx26="rotate" aria-label="Tourner le vêtement">'+icons.rotate+'</button><button type="button" data-hx26="zoom" aria-label="Agrandir le vêtement">'+icons.zoom+'</button></div></div>'
+'<div class="hx26-floor"><button type="button" data-hx26="prev" aria-label="Article précédent">‹</button><div class="hx26-pagination"><span data-hx26-position>03 / 07</span><div class="hx26-dots">'+products.map((p,i)=>'<button type="button" data-hx26-dot="'+i+'" aria-label="Afficher '+safe(p.short)+'" class="'+(i===state.index?'is-current':'')+'"></button>').join('')+'</div></div><button type="button" data-hx26="next" aria-label="Article suivant">›</button></div>'
+'<button type="button" class="hx26-collection" data-hx26="collection">SEE COLLECTION '+arrow+'</button></div>'
+'<aside class="hx26-card"><div class="hx26-card-top"><span data-hx26-cat></span><button type="button" data-hx26="save" aria-label="Ajouter à ma sélection">♡</button></div><h1 data-hx26-name></h1><p class="hx26-price">PRIX SUR DEMANDE</p><p class="hx26-desc" data-hx26-desc></p><div class="hx26-line"></div><div class="hx26-option-heading">COLORIS <span data-hx26-color-name></span></div><div class="hx26-swatches" data-hx26-swatches></div><div class="hx26-line"></div><div class="hx26-option-heading">VIEW <small>Aperçu conceptuel</small></div><div class="hx26-side"><button type="button" data-hx26-face="front">◫ Front</button><button type="button" data-hx26-face="back">◫ Back</button></div><button type="button" class="hx26-view-btn" data-hx26="view">VIEW PRODUCT '+arrow+'</button><div class="hx26-benefits"><span>✧<small>HOSPITALITY<br>WEAR</small></span><span>◇<small>STUDIO<br>PREVIEW</small></span><span>⌑<small>SIZE<br>SELECTION</small></span></div></aside></div>'
+'<div class="hx26-bottom-note">COLLECTION CONCEPT · LES COULEURS ET LE DOS SONT DES SIMULATIONS · PRIX ET STOCKS À CONFIRMER</div>'
+'<div class="hx26-ticker"><div>NEW ARRIVALS&nbsp; ✦ &nbsp; HOSPITALITY ESSENTIALS&nbsp; ✦ &nbsp; CHEF WEAR&nbsp; ✦ &nbsp; BARISTA WEAR&nbsp; ✦ &nbsp; SERVICE UNIFORMS&nbsp; ✦ &nbsp; LIMITED RELEASES&nbsp; ✦ &nbsp;</div></div></section>';
}
root.innerHTML=stage();
const overlay=document.createElement('div');overlay.className='hx26-overlay';overlay.id='hx26-overlay';overlay.hidden=true;document.body.appendChild(overlay);
function render(){
 const p=item();
 els('.hx26-slot').forEach((el,i)=>{
   el.classList.toggle('is-selected',i===state.index);
   el.setAttribute('aria-pressed',String(i===state.index));
   el.querySelector('img').style.filter=(i===state.index?color()[2]:'none');
   el.classList.toggle('is-back',i===state.index&&state.face==='back');
 });
 els('[data-hx26-dot]').forEach((el,i)=>el.classList.toggle('is-current',i===state.index));
 const tools=$('.hx26-actions');if(tools)tools.style.left=((state.index+.78)/7*96+3).toFixed(2)+'%';
 const pos=$('[data-hx26-position]');
 if(pos)pos.textContent=String(state.index+1).padStart(2,'0')+' / 07';
 $('[data-hx26-cat]').textContent=p.cat+'  /  HORENOVA EDITION';
 $('[data-hx26-name]').textContent=p.name;
 $('[data-hx26-desc]').textContent=p.desc;
 $('[data-hx26-color-name]').textContent=color()[0];
 $('[data-hx26-swatches]').innerHTML=swatches('data-hx26-color');
 els('[data-hx26-face]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.hx26Face===state.face)));
 els('[data-hx26-count]').forEach(e=>e.textContent=String(qtyTotal()));
 const favorite=$('[data-hx26="save"]');if(favorite)favorite.textContent=cart.some(v=>v.id===p.id)?'♥':'♡';
}
function select(i){state.index=(i+products.length)%products.length;state.color=0;state.face='front';state.size=null;state.qty=1;render();if(innerWidth<=900){const rack=$('.hx26-rack'),button=els('.hx26-slot')[state.index];if(rack&&button)rack.scrollTo({left:Math.max(0,button.offsetLeft-rack.clientWidth/2+button.clientWidth/2),behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});}}
function flip(){state.face=state.face==='front'?'back':'front';render();}
function open(step=0){state.step=step;state.modal=true;overlay.hidden=false;document.body.classList.add('hx26-dialog-open');drawDialog();overlay.querySelector('button[data-hx26-close]')?.focus();}
function close(){state.modal=false;overlay.hidden=true;document.body.classList.remove('hx26-dialog-open');const b=$('.hx26-slot.is-selected');if(b)b.focus();}
function picture(){const p=item(),filter=color()[2];return '<div class="hx26-dialog-photo'+(state.face==='back'?' is-back':'')+'" style="pointer-events:none!important"><div class="hx26-dialog-orbit"></div><img src="'+p.image+'" alt="'+safe(p.name)+'" style="filter:'+safe(filter)+';pointer-events:none!important" draggable="false"></div>';}
function drawDialog(){
 const p=item();let content='';
 if(state.step===2){
   content='<small>HORENOVA / MA SÉLECTION</small><h2>Votre sélection.</h2><p>Préparation d’une demande de devis. Aucune commande n’est envoyée et aucun paiement n’est demandé.</p><div class="hx26-cart-lines">'
   +(cart.length?cart.map((v,i)=>{const x=products.find(p=>p.id===v.id);return '<div class="hx26-cart-item"><img src="'+x.image+'" alt=""><div><strong>'+safe(x.name)+'</strong><small>'+safe(v.color)+' · '+safe(v.size)+' · ×'+v.qty+'</small></div><button type="button" data-hx26-remove="'+i+'" aria-label="Retirer">×</button></div>'}).join(''):'<p>Aucun article sélectionné.</p>')+'</div>'
   +'<button type="button" class="hx26-dialog-cta" data-hx26-step="export" '+(!cart.length?'disabled':'')+'>TÉLÉCHARGER MA DEMANDE '+arrow+'</button>'
   +'<button type="button" class="hx26-dialog-secondary" data-hx26-step="0">CONTINUER LE SHOPPING</button>';
 }else{
  content='<small>'+safe(p.cat)+' / HORENOVA STUDIO</small><h2>'+safe(p.name)+'</h2><p>'+safe(p.desc)+'</p>'
  +'<div class="hx26-progress"><span class="'+(state.step===0?'on':'')+'">01 · COLORIS</span><span class="'+(state.step===1?'on':'')+'">02 · TAILLE</span><span>03 · DEMANDE</span></div>'
  +(state.step===0?'<label class="hx26-dialog-label">COLORIS · <strong>'+safe(color()[0])+'</strong></label><div class="hx26-dialog-swatches">'+swatches('data-hx26-color')+'</div><p class="hx26-disclaimer">Teintes de prévisualisation simulées, non garanties en fabrication.</p><button type="button" class="hx26-dialog-cta" data-hx26-step="1">CHOISIR LA TAILLE '+arrow+'</button>':
  '<label class="hx26-dialog-label">TAILLE SOUHAITÉE</label><div class="hx26-dialog-sizes">'+p.sizes.map(s=>'<button type="button" data-hx26-size="'+safe(s)+'" aria-pressed="'+(state.size===s)+'">'+safe(s)+'</button>').join('')+'</div><label class="hx26-dialog-label">QUANTITÉ</label><div class="hx26-quantity"><button type="button" data-hx26-qty="-1" aria-label="Diminuer">−</button><span>'+state.qty+'</span><button type="button" data-hx26-qty="1" aria-label="Augmenter">+</button></div><button type="button" class="hx26-dialog-cta" data-hx26-step="add" '+(!state.size?'disabled':'')+'>AJOUTER À MA SÉLECTION '+arrow+'</button><button type="button" class="hx26-dialog-secondary" data-hx26-step="0">← RETOUR AUX COLORIS</button>');
 }
 overlay.innerHTML='<div class="hx26-overlay-bg" data-hx26-close></div><section class="hx26-dialog" role="dialog" aria-modal="true" aria-label="HORENOVA produit" tabindex="-1"><button type="button" data-hx26-close class="hx26-x" aria-label="Fermer">×</button>'
 +(state.step===2?'': '<div class="hx26-dialog-left"><small>HORENOVA / 3D-LIKE STUDIO</small>'+picture()+'<div class="hx26-dialog-faces"><button type="button" data-hx26-face="front" aria-pressed="'+(state.face==='front')+'">FRONT</button><button type="button" data-hx26-face="back" aria-pressed="'+(state.face==='back')+'">BACK · SIMULÉ</button></div></div>')
 +'<div class="hx26-dialog-right'+(state.step===2?' hx26-dialog-cart':'')+'">'+content+'</div></section>';
}
function add(){
 if(!state.size)return;
 const p=item(),name=color()[0];
 const line=cart.find(v=>v.id===p.id&&v.color===name&&v.size===state.size);
 if(line)line.qty=Math.min(99,line.qty+state.qty);
 else cart.push({id:p.id,size:state.size,color:name,qty:state.qty});
 persist();render();state.step=2;drawDialog();
}
function exportCart(){
 if(!cart.length)return;
 const lines=['HORENOVA — DEMANDE DE DEVIS','Date : '+new Date().toLocaleDateString('fr-MA'),'Sélection sans prix ni stock confirmés.',''];
 cart.forEach(v=>{const p=products.find(x=>x.id===v.id);lines.push(p.name+' | '+v.color+' | '+v.size+' | Quantité : '+v.qty);});
 lines.push('','Collection conceptuelle : aucune commande ou transaction confirmée.');
 const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download='horenova-demande-uniformes.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
}
root.addEventListener('click',event=>{
 const c=event.target.closest('button');if(!c)return;
 if(c.hasAttribute('data-hx26-item')){const i=Number(c.dataset.hx26Item);if(state.index!==i)select(i);open(0);return;}
 if(c.hasAttribute('data-hx26-dot')){select(Number(c.dataset.hx26Dot));return;}
 if(c.hasAttribute('data-hx26-color')){state.color=Number(c.dataset.hx26Color);render();return;}
 if(c.hasAttribute('data-hx26-face')){state.face=c.dataset.hx26Face;render();return;}
 const op=c.dataset.hx26;
 if(op==='prev'||op==='next'){select(state.index+(op==='next'?1:-1));return;}
 if(op==='rotate'){flip();return;}
 if(op==='view'||op==='zoom'){open(0);return;}
 if(op==='cart'){open(2);return;}
 if(op==='collection'){document.getElementById('products')?.scrollIntoView({behavior:'smooth',block:'start'});return;}
 if(op==='save'){open(1);return;}
});
root.addEventListener('pointerover',e=>{
 if(!matchMedia('(hover:hover)').matches)return;
 const b=e.target.closest('[data-hx26-item]');
 if(b&&state.index!==Number(b.dataset.hx26Item))select(Number(b.dataset.hx26Item));
});
overlay.addEventListener('click',event=>{
 const b=event.target.closest('button');if(event.target.hasAttribute('data-hx26-close')||b?.hasAttribute('data-hx26-close')){close();return;}
 if(!b)return;
 if(b.hasAttribute('data-hx26-face')){state.face=b.dataset.hx26Face;drawDialog();return;}
 if(b.hasAttribute('data-hx26-color')){state.color=Number(b.dataset.hx26Color);render();drawDialog();return;}
 if(b.hasAttribute('data-hx26-size')){state.size=b.dataset.hx26Size;drawDialog();return;}
 if(b.hasAttribute('data-hx26-qty')){state.qty=Math.max(1,Math.min(99,state.qty+Number(b.dataset.hx26Qty)));drawDialog();return;}
 if(b.hasAttribute('data-hx26-remove')){cart.splice(Number(b.dataset.hx26Remove),1);persist();render();drawDialog();return;}
 if(b.hasAttribute('data-hx26-step')){
   const action=b.dataset.hx26Step;
   if(action==='add'){add();return;}
   if(action==='export'){exportCart();return;}
   state.step=Number(action);drawDialog();return;
 }
});
let touchStart=0;
$('.hx26-rack')?.addEventListener('touchstart',e=>{touchStart=e.changedTouches[0]?.clientX||0;},{passive:true});
$('.hx26-rack')?.addEventListener('touchend',e=>{const dx=(e.changedTouches[0]?.clientX||0)-touchStart;if(Math.abs(dx)>42)select(state.index+(dx<0?1:-1));},{passive:true});
document.addEventListener('keydown',e=>{
 if(state.modal){if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const cs=Array.from(overlay.querySelectorAll('button:not([disabled]),a[href]')).filter(c=>c.getClientRects().length);if(!cs.length)return;const n=cs.indexOf(document.activeElement);if(e.shiftKey&&(n<=0)){e.preventDefault();cs[cs.length-1].focus();}else if(!e.shiftKey&&n===cs.length-1){e.preventDefault();cs[0].focus();}}return;}
 if(document.activeElement?.closest('#hx-showroom')&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();select(state.index+(e.key==='ArrowRight'?1:-1));}
});
function openById(id){const i=products.findIndex(p=>p.id===id);if(i>=0){select(i);open(0)}}
window.HORENOVA_SHOWROOM={open:openById,getSelection:()=>cart.map(x=>({...x})),products:products.map(p=>({id:p.id,name:p.name}))};
render();
})();