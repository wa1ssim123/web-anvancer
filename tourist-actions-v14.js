/* PREFILL CITY */
const __city=new URLSearchParams(location.search).get('city');if(__city){document.querySelectorAll('input[name=city]').forEach(i=>{if(!i.value)i.value=__city});}
import { insertItem } from "/js/wix/items.js";
import { getMemberState } from "/js/wix/member-store.js";
function status(form,msg,ok=false){const el=form.querySelector('[data-tourist-status]');if(el){el.textContent=msg;el.classList.toggle('ok',ok)}}
document.querySelectorAll('.tourist-request-form').forEach(form=>{
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(!form.reportValidity())return;
    if(!getMemberState().loggedIn){
      status(form,'Connectez-vous à HORENOVA pour enregistrer cette demande.');
      const target=form.querySelector('[data-tourist-status]');
      if(target){const link=document.createElement('a');link.href='/enter.html?mode=signin&returnTo='+encodeURIComponent(location.pathname+location.search);link.textContent=' Se connecter ↗';link.style.marginLeft='8px';target.append(link);}
      return;
    }
    const btn=form.querySelector('button[type=submit]');btn.disabled=true;status(form,'Envoi en cours…');
    try{
      const fd=new FormData(form);const data=Object.fromEntries(fd.entries());
      data.requestType=form.dataset.requestType||'tourist';data.travelers=Number(data.travelers||0);data.status='Nouvelle';
      await insertItem('TouristRequests',data);
      status(form,'Demande enregistrée dans Horenova ✓',true);btn.textContent='Envoyé ✓';
    }catch(err){status(form,'Impossible d’enregistrer la demande. Réessayez depuis votre compte.');btn.disabled=false}
  })
});