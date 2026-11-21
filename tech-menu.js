/* Read-only public restaurant menu. Shows only products deliberately published by the venue owner. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const api='https://horenova-hub-api.onrender.com';
  const localeText={
    fr:{menuTitle:'La Carte.',loading:'Chargement du menu…',fresh:'BIENVENUE À NOTRE TABLE',browse:'DÉCOUVREZ NOTRE SÉLECTION',selection:'Notre sélection.',footer:'Un menu digital accessible en posant votre téléphone ou en scannant le QR code. Les prix et informations sont publiés par l’établissement.',more:'En savoir plus sur HORENOVA TECH',all:'Tout',empty:'Aucun article disponible dans cette catégorie.',error:'Ce menu est indisponible. Demandez le menu à votre établissement.'},
    en:{menuTitle:'The Menu.',loading:'Loading menu…',fresh:'WELCOME TO OUR TABLE',browse:'DISCOVER OUR SELECTION',selection:'Our selection.',footer:'A digital menu accessed by tapping your phone or scanning a QR code. Prices and descriptions are published by the venue.',more:'Learn more about HORENOVA TECH',all:'All',empty:'No items in this category.',error:'This menu is unavailable. Please ask the venue for their menu.'},
    ar:{menuTitle:'قائمتنا.',loading:'جارٍ تحميل القائمة…',fresh:'أهلاً بك على طاولتنا',browse:'اكتشف اختياراتنا',selection:'اختياراتنا.',footer:'قائمة رقمية تفتح بلمس الهاتف أو مسح QR. الأسعار والمعلومات يحددها المطعم.',more:'تعرف على هورينوفا تك',all:'الكل',empty:'لا توجد منتجات في هذه الفئة.',error:'القائمة غير متاحة حاليًا. يرجى طلب القائمة من المطعم.'}
  };
  const supported=['fr','en','ar'];
  let lang='fr',items=[],venue=null,category='';
  try{const s=localStorage.getItem('mihna-lang');if(supported.includes(s))lang=s;}catch{}
  const locale=$('menuLanguage');locale.value=lang;
  const params=new URLSearchParams(location.search);
  const slug=params.get('slug')||'';
  const text=(tag,cls,content)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=content;return e;};
  const fmt=centimes=>(Number(centimes)/100).toLocaleString(lang==='ar'?'ar-MA':lang==='en'?'en-US':'fr-MA',{minimumFractionDigits:2,maximumFractionDigits:2})+' DH';
  function renderStatic(){
    document.documentElement.lang=lang;
    document.documentElement.dir=lang==='ar'?'rtl':'ltr';
    for(const el of document.querySelectorAll('[data-t]'))el.textContent=localeText[lang][el.dataset.t];
    locale.value=lang;
    if(venue){
      $('venueTitle').textContent=venue.name;
      $('venueLocation').textContent=venue.city || 'HORENOVA TECH';
      document.title=venue.name+' — HORENOVA TAP MENU';
    }
  }
  function render(){
    renderStatic();
    const categories=[...new Set(items.map(i=>i.category||'Autres'))];
    if(category&& !categories.includes(category))category='';
    const nav=$('menuCategoryNav');nav.replaceChildren();
    [{key:'',name:localeText[lang].all},...categories.map(c=>({key:c,name:c}))].forEach(c=>{
      const b=text('button','',c.name);b.type='button';b.classList.toggle('active',category===c.key);
      b.setAttribute('aria-pressed',String(category===c.key));
      b.addEventListener('click',()=>{category=c.key;render();});
      nav.append(b);
    });
    const root=$('menuContent');root.className='';root.replaceChildren();
    const list=items.filter(p=>!category||p.category===category);
    if(!list.length){root.append(text('p','menu-empty',localeText[lang].empty));return;}
    for(const p of list){
      const row=text('article','menu-product');const desc=text('div');
      desc.append(text('h3','',p.name),text('span','',p.category));
      row.append(desc,text('strong','',fmt(p.priceCentimes)));root.append(row);
    }
  }
  function showError(){
    $('menuError').hidden=false;$('menuError').textContent=localeText[lang].error;
    $('menuContent').textContent='';
  }
  locale.addEventListener('change',e=>{
    if(!supported.includes(e.target.value))return;
    lang=e.target.value;
    try{localStorage.setItem('mihna-lang',lang);}catch{}
    if(venue)render();else{renderStatic();if(!$('menuError').hidden)showError();}
  });
  renderStatic();
  if(!/^[a-z0-9-]{3,70}$/.test(slug)){showError();return;}
  fetch(api+'/api/tech/menu/'+encodeURIComponent(slug),{method:'GET',mode:'cors',cache:'no-store'})
    .then(async res=>{
      if(!res.ok)throw Error('Menu unavailable');
      return res.json();
    })
    .then(data=>{
      if(!data||!data.venue||!Array.isArray(data.items))throw Error('Invalid menu');
      venue=data.venue;
      items=data.items.filter(p=>p&&typeof p.name==='string'&&Number.isInteger(p.priceCentimes)&&p.priceCentimes>=0).slice(0,500);
      render();
    })
    .catch(()=>showError());
})();