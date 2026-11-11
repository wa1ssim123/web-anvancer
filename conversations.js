import {requireRole} from '/mihna-global.js';
import {hub} from '/hn-api.js';
const auth=await requireRole(['admin','candidate','recruiter'],false);
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let applications=[],chosen=new URLSearchParams(location.search).get('id')||'',busy=false;
function setError(s){$('conversationError').textContent=s||'';}
function renderList(){
$('conversationList').innerHTML=applications.map(a=>'<button class="hub-case '+(a.id===chosen?'active':'')+'" type="button" data-id="'+esc(a.id)+'"><span>'+esc(a.status)+'</span><strong>'+esc(a.jobTitle)+'</strong><span>'+esc(a.profile?.firstName||'')+' '+esc(a.profile?.lastName||'')+'</span></button>').join('')||'<div class="hub-detail hub-muted">Aucune conversation disponible.</div>';
$('conversationList').querySelectorAll('[data-id]').forEach(x=>x.onclick=async()=>{chosen=x.dataset.id;renderList();await refresh();});
}
async function refresh(){
if(!chosen||busy||document.hidden)return;
const app=applications.find(x=>x.id===chosen);if(!app)return;
$('conversationTitle').textContent=app.jobTitle||'Conversation';
$('conversationForm').hidden=false;
try{
 const result=await hub('/api/applications/'+encodeURIComponent(chosen)+'/messages');
 const target=$('conversationMessages'),stick=target.scrollHeight-target.scrollTop-target.clientHeight<65;
 target.replaceChildren();
 for(const m of result.items||[]){
  const bubble=document.createElement('div');bubble.className='hub-msg'+(m.sender_wix_id===auth.member?.id?' mine':'');
  const caption=document.createElement('small');caption.textContent=(m.sender_role==='admin'?'HORENOVA':m.sender_role==='recruiter'?'Recruteur':'Candidat')+' · '+new Date(m.created_at).toLocaleString('fr-MA');
  const message=document.createElement('div');message.textContent=m.body;
  bubble.append(caption,message);target.append(bubble);
 }
 if(stick)target.scrollTop=target.scrollHeight;setError('');
}catch(e){setError(e.message);}
}
$('conversationForm').onsubmit=async event=>{
 event.preventDefault();
 if(!chosen||busy)return;
 const input=$('conversationText'),body=input.value.trim();
 if(!body)return;
 busy=true;const btn=$('conversationForm').querySelector('button');btn.disabled=true;
 try{await hub('/api/applications/'+encodeURIComponent(chosen)+'/messages',{method:'POST',body:{body}});input.value='';}
 catch(e){setError(e.message);}
 finally{busy=false;btn.disabled=false;await refresh();}
};
if(!auth){setError('Veuillez vous connecter pour participer à une conversation.');}
else{try{applications=(await hub('/api/applications')).items||[];if(chosen&&!applications.some(x=>x.id===chosen))chosen='';if(!chosen&&applications.length)chosen=applications[0].id;renderList();if(chosen)await refresh();}catch(e){setError(e.message);}}
setInterval(()=>{if(auth&&chosen)refresh().catch(()=>{});},7000);