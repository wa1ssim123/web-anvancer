const STORE='horenova-v14';
function toast(msg){
  let t=document.getElementById('v14Toast');
  if(!t){t=document.createElement('div');t.id='v14Toast';t.className='v14-toast';document.body.append(t)}
  t.textContent=msg;t.classList.add('show');clearTimeout(window.__v14toast);window.__v14toast=setTimeout(()=>t.classList.remove('show'),2200);
}
document.addEventListener('click',e=>{
  const i=e.target.closest('[data-interest]');
  if(i){e.preventDefault();const key=i.dataset.interest||'interest';const a=JSON.parse(localStorage.getItem(STORE+'-interests')||'[]');if(!a.includes(key))a.push(key);localStorage.setItem(STORE+'-interests',JSON.stringify(a));toast('Intérêt enregistré ✓');}
  const save=e.target.closest('[data-product-name]');
  if(save){const name=save.dataset.productName;const a=JSON.parse(localStorage.getItem(STORE+'-shop')||'[]');if(!a.includes(name))a.push(name);localStorage.setItem(STORE+'-shop',JSON.stringify(a));save.textContent='Ajouté ✓';toast('Produit ajouté à votre liste');}
  const f=e.target.closest('[data-shop-filter]');
  if(f){document.querySelectorAll('[data-shop-filter]').forEach(x=>x.classList.toggle('active',x===f));const cat=f.dataset.shopFilter;document.querySelectorAll('[data-product-cat]').forEach(p=>p.hidden=cat!=='all'&&p.dataset.productCat!==cat&&p.dataset.productCat!=='Tous');document.getElementById('catalogue')?.scrollIntoView({behavior:'smooth'});}
});