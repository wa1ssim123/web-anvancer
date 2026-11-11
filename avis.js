import {hub} from '/hn-api.js';
const $=id=>document.getElementById(id);
const API='https://horenova-hub-api.onrender.com';
const form=$('reviewForm'),note=$('reviewFormMessage');
function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;}
function setError(id,error){const node=$(id);node.textContent=error||'';node.hidden=!error;}
function paintStars(){
  const rating=Number(form.querySelector('input[name="rating"]:checked')?.value||0);
  form.querySelectorAll('#reviewStars label').forEach(label=>{label.classList.toggle('is-selected',Number(label.querySelector('input')?.value)<=rating&&rating>0);});
  $('reviewStarLabel').textContent=rating?rating+' / 5 — '+(['','Très décevant','Décevant','Correct','Très bien','Excellent'][rating]):'Sélectionnez une note de 1 à 5.';
}
form.querySelectorAll('input[name="rating"]').forEach(input=>input.addEventListener('change',paintStars));
function renderReviews(data){
 const box=$('reviewsList');box.replaceChildren();
 const count=Number(data.count||0),avg=Number(data.average||0);
 const stat=$('reviewSummary');stat.replaceChildren(el('span','rv-stat-label','Avis publiés'),el('strong','',count?avg.toFixed(1)+' / 5':'0 avis publié'),el('span','',count?count+' avis approuvé'+(count>1?'s':''):'Les premiers avis authentiques apparaîtront ici.'));
 if(!data.items?.length){box.appendChild(el('div','rv-empty','Aucun avis publié pour le moment. Soyez parmi les premiers à partager votre expérience HORENOVA.'));return;}
 for(const a of data.items){
   const card=el('article','rv-card');
   card.append(el('div','rv-card-stars','★'.repeat(a.rating)+'☆'.repeat(5-a.rating)),el('h3','',a.title),el('p','',a.comment));
   const foot=el('div','rv-card-foot');foot.append(el('strong','',a.public_name),el('span','',a.experience+' · '+new Date(a.created_at).toLocaleDateString('fr-MA')));
   card.append(foot);box.append(card);
 }
}
async function publicReviews(){
 try{
  const response=await fetch(API+'/api/reviews/public',{cache:'no-store'});
  if(!response.ok)throw Error('La liste des avis est temporairement indisponible.');
  renderReviews(await response.json());setError('reviewsError','');
 }catch(e){setError('reviewsError',e.message);$('reviewsList').replaceChildren(el('div','rv-empty','Les avis ne peuvent pas être chargés actuellement.'));}
}
function message(text,ok=false){note.textContent=text;note.className='rv-message '+(ok?'ok':'error');}
form.addEventListener('submit',async e=>{
 e.preventDefault();message('');
 const data=new FormData(form);const d=Object.fromEntries(data.entries());
 if(!d.rating||d.title?.trim().length<5||d.comment?.trim().length<30||d.publicName?.trim().length<2){message('Complétez votre nom public, une note, un titre et un commentaire de 30 caractères minimum.');return;}
 const btn=$('reviewSubmit');btn.disabled=true;
 try{
   const r=await hub('/api/reviews',{method:'POST',body:d});
   message(r.message||'Avis reçu : il sera visible après modération.',true);
   form.reset();paintStars();
   await publicReviews();
 }catch(err){
   if(/connexion|session|auth|401|403/i.test(err.message)){message('Connectez-vous avec un compte HORENOVA avant d’envoyer votre avis.');}
   else message(err.message||'Impossible d’envoyer votre avis pour le moment.');
 }finally{btn.disabled=false;}
});
async function moderation(){
 try{
  const me=await hub('/api/me');
  if(me.role!=='admin')return;
  const section=$('moderation');section.hidden=false;
  const result=await hub('/api/reviews/moderation');
  const list=$('reviewModerationList');list.replaceChildren();
  if(!result.items?.length){list.append(el('p','rv-empty','Aucun avis à modérer actuellement.'));return;}
  for(const item of result.items){
    const card=el('article','rv-moderation-row'),main=el('div');
    main.append(el('strong','',item.public_name+' · '+item.rating+'/5 · '+item.status),el('p','',item.title),el('p','',item.comment));
    card.append(main);const actions=el('div','rv-moderation-actions');
    for(const [status,title] of [['APPROVED','Publier'],['REJECTED','Refuser']]){
      const button=el('button',status==='APPROVED'?'approve':'',title);button.type='button';
      button.disabled=item.status===status;
      button.onclick=async()=>{button.disabled=true;try{await hub('/api/reviews/'+encodeURIComponent(item.id)+'/moderate',{method:'PATCH',body:{status}});await moderation();await publicReviews();}catch(e){setError('reviewModerationError',e.message);button.disabled=false;}};
      actions.append(button);
    }
    card.append(actions);list.append(card);
  }
  setError('reviewModerationError','');
 }catch{ /* anonymous visitors do not see the moderation area */ }
}
publicReviews();
moderation();
