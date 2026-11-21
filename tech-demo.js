/* Isolated front-end demo. No backend, payment, printing hardware or real orders. */
(() => {
  'use strict';
  const KEY = 'hn-tech-lab-demo-v1';
  const initial = [
    {id:'cafe',name:'Espresso',category:'Café',icon:'☕',price:22,stock:25},
    {id:'cappuccino',name:'Cappuccino',category:'Café',icon:'◉',price:34,stock:18},
    {id:'latte',name:'Café latte',category:'Café',icon:'☕',price:38,stock:12},
    {id:'tea',name:'Thé à la menthe',category:'Boissons',icon:'◌',price:24,stock:30},
    {id:'juice',name:"Jus d'orange",category:'Boissons',icon:'◍',price:32,stock:4},
    {id:'water',name:'Eau minérale',category:'Boissons',icon:'◈',price:15,stock:16},
    {id:'tajine',name:'Tajine maison',category:'Cuisine',icon:'◒',price:85,stock:12},
    {id:'salad',name:'Salade du chef',category:'Cuisine',icon:'✧',price:65,stock:9},
    {id:'dessert',name:'Dessert du jour',category:'Cuisine',icon:'◕',price:45,stock:5}
  ];
  const categories=['Tout','Café','Boissons','Cuisine'];
  const $=id=>document.getElementById(id);
  const money=n=>Number(n).toLocaleString('fr-MA')+' DH';
  const store={
    get(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}},
    set(value){try{localStorage.setItem(KEY,JSON.stringify(value))}catch{}}
  };
  function startState(){return {products: initial.map(p=>({...p})),sales:[]};}
  const existing=store.get();
  let state=(existing&&Array.isArray(existing.products)&&Array.isArray(existing.sales)
    &&initial.every((p,i)=>existing.products[i]&&existing.products[i].id===p.id&&Number.isInteger(existing.products[i].stock)
      &&existing.products[i].stock>=0&&existing.products[i].stock<=100000)
    &&existing.sales.length<=250) ? existing : startState();
  let order={};
  let posCategory='Tout',menuCategory='Tout';
  let currentView='pos';
  let lastTicket=null;
  const create=(tag,cls,text)=>{
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(text!==undefined)el.textContent=text;
    return el;
  };
  function save(){store.set(state);}
  function getProduct(id){return state.products.find(x=>x.id===id);}
  function total(){return Object.entries(order).reduce((sum,[id,qty])=>{const p=getProduct(id);return sum+(p?p.price*qty:0);},0);}
  function itemCount(){return Object.values(order).reduce((a,b)=>a+b,0);}
  function renderStats(){
    $('saleCount').textContent=String(state.sales.length);
    $('revenueTotal').textContent=money(state.sales.reduce((sum,s)=>sum+s.total,0));
    $('stockAlerts').textContent=String(state.products.filter(p=>p.stock<=5).length);
  }
  function chooseCategory(id,forMenu=false){
    if(forMenu)menuCategory=id;else posCategory=id;
    renderFilters(forMenu);
    if(forMenu)renderMenu();else renderProducts();
  }
  function renderFilters(forMenu=false){
    const root=$(forMenu?'menuFilters':'posFilters');
    root.replaceChildren();
    categories.forEach(c=>{
      const b=create('button','',c);
      b.type='button';b.classList.toggle('active',c===(forMenu?menuCategory:posCategory));
      b.setAttribute('aria-pressed',String(c===(forMenu?menuCategory:posCategory)));
      b.addEventListener('click',()=>chooseCategory(c,forMenu));
      root.append(b);
    });
  }
  function renderProducts(){
    const grid=$('posProductGrid');grid.replaceChildren();
    state.products.filter(p=>posCategory==='Tout'||p.category===posCategory).forEach(p=>{
      const button=create('button','pos-product');button.type='button';button.disabled=p.stock===0;
      button.setAttribute('aria-label','Ajouter '+p.name+' au ticket');
      button.append(create('span','icon',p.icon),create('strong','',p.name));
      const info=create('small');info.append(create('span','',money(p.price)),create('b','',p.stock+' disp.'));
      button.append(info);button.addEventListener('click',()=>addProduct(p.id));grid.append(button);
    });
  }
  function addProduct(id){
    const p=getProduct(id);if(!p)return;
    const qty=order[id]||0;
    if(qty>=p.stock){status('Stock insuffisant pour '+p.name+'.',true);return;}
    order[id]=qty+1;renderOrder();status(p.name+' ajouté au ticket.');
  }
  function changeQty(id,delta){
    const p=getProduct(id);if(!p)return;
    const newQty=(order[id]||0)+delta;
    if(newQty>p.stock){status('Quantité supérieure au stock disponible.',true);return;}
    if(newQty<=0)delete order[id];else order[id]=newQty;
    renderOrder();
  }
  function renderOrder(){
    const list=$('orderItems');list.replaceChildren();
    if(!itemCount()){list.append(create('p','order-empty','Touchez un produit pour commencer la commande démo.'));}
    Object.entries(order).forEach(([id,qty])=>{
      const p=getProduct(id);if(!p)return;
      const row=create('div','order-line');
      const title=create('div','order-product');
      title.append(create('strong','',p.name),create('small','',money(p.price*qty)));
      const controls=create('div','qty');
      const minus=create('button','','−');minus.type='button';minus.setAttribute('aria-label','Retirer '+p.name);
      const plus=create('button','','+');plus.type='button';plus.setAttribute('aria-label','Ajouter '+p.name);plus.disabled=qty>=p.stock;
      minus.addEventListener('click',()=>changeQty(id,-1));plus.addEventListener('click',()=>changeQty(id,1));
      controls.append(minus,create('b','',String(qty)),plus);
      row.append(title,controls);list.append(row);
    });
    $('orderTotal').textContent=money(total());
    $('completeSale').disabled=itemCount()===0;
  }
  function status(msg,isError=false){
    const el=$('posStatus');el.textContent=msg;el.style.color=isError?'#ffb19b':'#b5dfc9';
  }
  function completeSale(){
    const entries=Object.entries(order);if(!entries.length)return;
    for(const [id,qty] of entries){
      const p=getProduct(id);
      if(!p||qty>p.stock){status('Stock insuffisant : rechargez le ticket.',true);return;}
    }
    const items=entries.map(([id,qty])=>{
      const p=getProduct(id);return {id,name:p.name,qty,price:p.price};
    });
    const amount=total();
    for(const [id,qty] of entries){getProduct(id).stock-=qty;}
    const ticket={
      id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),
      table:$('tableSelect').value,
      total:amount,
      items,
      time:new Date().toISOString()
    };
    state.sales.unshift(ticket);
    state.sales=state.sales.slice(0,250);
    lastTicket=ticket;order={};
    save();renderAll();
    status('Vente simulée validée. Stock et historique mis à jour.');
    showPrintAction();
  }
  function showPrintAction(){
    const slot=$('posStatus');
    const btn=create('button','secondary','Voir / imprimer un ticket démo');
    btn.type='button';btn.style.marginLeft='8px';btn.style.marginTop='8px';
    btn.addEventListener('click',()=>{
      if(!lastTicket)return;
      const printer=$('printTicket');printer.replaceChildren();
      printer.append(create('h2','','HORENOVA TECH / TICKET DÉMO'));
      printer.append(create('p','','AUCUN PAIEMENT RÉEL — TABLE '+lastTicket.table));
      lastTicket.items.forEach(i=>printer.append(create('p','',i.qty+' × '+i.name+' — '+money(i.price*i.qty))));
      printer.append(create('h3','','TOTAL FICTIF : '+money(lastTicket.total)));
      printer.append(create('p','','Prototype sans validité fiscale.'));
      window.print();
    });
    slot.append(btn);
  }
  function renderStock(){
    const grid=$('stockList');grid.replaceChildren();
    state.products.forEach(p=>{
      const row=create('div','stock-item');if(p.stock<=5)row.classList.add('low');
      const title=create('div');
      title.append(create('strong','',p.name),create('small','',p.category+' · stock démo'));
      const q=create('span','stock-qty',String(p.stock));
      const add=create('button','', '+5 unités');add.type='button';add.setAttribute('aria-label','Réception fictive de 5 '+p.name);
      add.addEventListener('click',()=>{p.stock+=5;save();renderAll();});
      row.append(title,q,add);grid.append(row);
    });
    const hist=$('salesLog');hist.replaceChildren();
    if(!state.sales.length){hist.append(create('p','order-empty','Aucune vente fictive. Passez une commande depuis la caisse.'));}
    state.sales.slice(0,12).forEach(s=>{
      const row=create('div','history-item');
      const date=new Date(s.time);
      const safeDate=Number.isNaN(date.getTime())?'Démo':date.toLocaleString('fr-MA');
      row.append(create('b','','Table '+s.table+' · '+money(s.total)),create('span','',s.items.map(i=>i.qty+'× '+i.name).join(' · ')),create('small','',safeDate));
      hist.append(row);
    });
  }
  function renderMenu(){
    const list=$('menuItems');list.replaceChildren();
    state.products.filter(p=>menuCategory==='Tout'||p.category===menuCategory).forEach(p=>{
      const row=create('div','menu-item');
      const title=create('div');
      title.append(create('strong','',p.name),create('small','',p.stock===0?'Indisponible (démo)':'Carte de démonstration'));
      row.append(title,create('b','',money(p.price)));list.append(row);
    });
  }
  function renderAll(){
    renderStats();renderFilters(false);renderProducts();renderOrder();renderStock();renderFilters(true);renderMenu();
  }
  function switchView(view){
    if(!['pos','stock','menu'].includes(view))view='pos';
    currentView=view;
    document.querySelectorAll('[data-view]').forEach(b=>{
      const selected=b.dataset.view===view;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));
    });
    ['Pos','Stock','Menu'].forEach(n=>{$('view'+n).hidden=n.toLowerCase()!==view;});
    history.replaceState(null,'',view==='pos'?location.pathname:location.pathname+'#'+view);
  }
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
  $('clearOrder').addEventListener('click',()=>{order={};renderOrder();status('Ticket vidé.');});
  $('completeSale').addEventListener('click',completeSale);
  $('resetDemo').addEventListener('click',()=>{
    if(!confirm('Réinitialiser toutes les données fictives de cette démonstration ?'))return;
    state=startState();order={};lastTicket=null;save();renderAll();status('Données de démonstration réinitialisées.');
  });
  window.addEventListener('hashchange',()=>switchView(location.hash.slice(1)));
  renderAll();
  switchView(location.hash.slice(1));
})();