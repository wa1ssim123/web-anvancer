import {requireRole,currentLang} from '/mihna-global.js?v=support-no-art-v8';
import {hub} from '/hn-api.js';
const $=id=>document.getElementById(id);
const gate=$('hsAuthGate'),consoleEl=$('hsConsole'),notice=$('hsNotice');
const threadsEl=$('hsThreads'),messagesEl=$('hsMessages');
const labels={
 fr:{mine:'Mes conversations',admin:'Boîte de réception nationale',myDesc:'Vos questions et réponses HORENOVA.',adminDesc:'Demandes des candidats et recruteurs, actualisées automatiquement.',online:'Un superviseur est en ligne',offline:'Messagerie disponible 24 h/24',hintOnline:'Vous pouvez écrire dans votre conversation privée.',hintOffline:'Déposez votre demande à tout moment. L’équipe vous répondra dès qu’elle pourra la prendre en charge.',empty:'Aucune demande pour le moment.',select:'Sélectionnez une conversation.',open:'Ouverte',progress:'En traitement',resolved:'Résolue',closed:'Clôturée',you:'Vous',team:'Équipe HORENOVA',candidate:'Candidat',recruiter:'Recruteur',error:'Impossible de charger les conversations pour le moment. Réessayez ou appelez le 0648377009.',new:'Nouvelle demande',send:'Envoyer ↗'},
 en:{mine:'My conversations',admin:'National support inbox',myDesc:'Your requests and replies.',adminDesc:'Candidate and recruiter requests, updated automatically.',online:'A supervisor is online',offline:'Messaging open 24/7',hintOnline:'You can send a message in your private conversation.',hintOffline:'Send your request any time. Our team will respond as soon as it can review it.',empty:'No requests yet.',select:'Choose a conversation.',open:'Open',progress:'In progress',resolved:'Resolved',closed:'Closed',you:'You',team:'HORENOVA team',candidate:'Candidate',recruiter:'Recruiter',error:'Unable to load conversations right now. Please try again or call 0648377009.',new:'New request',send:'Send ↗'},
 ar:{mine:'محادثاتي',admin:'صندوق الدعم الوطني',myDesc:'طلباتك وردود الفريق.',adminDesc:'طلبات المرشحين والمشغّلين تتجدد تلقائياً.',online:'مشرف متصل الآن',offline:'المراسلة متاحة على مدار الساعة',hintOnline:'يمكنك إرسال رسالة في المحادثة الخاصة.',hintOffline:'يمكنك إرسال طلبك في أي وقت، وسيرد عليك فريقنا فور التمكن من معالجته.',empty:'لا توجد طلبات حالياً.',select:'اختر محادثة.',open:'مفتوحة',progress:'قيد المعالجة',resolved:'تم الحل',closed:'مغلقة',you:'أنت',team:'فريق هورينوفا',candidate:'مرشح',recruiter:'مشغّل',error:'تعذّر تحميل المحادثات الآن. حاول مرة أخرى أو اتصل على 0648377009.',new:'طلب جديد',send:'إرسال ↗'}
};
const lang=currentLang();const copy=labels[lang]||labels.fr;
let user=null,admin=false,threads=[],chosen='',lastSignature='',syncBusy=false,sendBusy=false,heartbeatLast=0;
function report(text){notice.textContent=text;notice.hidden=!text;}
function formatDate(date){try{return new Intl.DateTimeFormat(lang==='ar'?'ar-MA':lang==='en'?'en-GB':'fr-MA',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(date));}catch{return '';}}
const statusText=s=>({OPEN:copy.open,IN_PROGRESS:copy.progress,RESOLVED:copy.resolved,CLOSED:copy.closed}[s]||s);
function e(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!=null)node.textContent=String(text);return node;}
function line(thread){
 const button=e('button','hs-thread'+(thread.id===chosen?' active':''));button.type='button';button.dataset.id=thread.id;button.setAttribute('role','listitem');
 const top=e('span','hs-thread-top'),title=e('b','',thread.subject),pill=e('small','hs-pill',statusText(thread.status));pill.dataset.status=thread.status;top.append(title,pill);
 const small=e('small','',admin?([thread.memberEmail,thread.memberRole].filter(Boolean).join(' · ')):thread.category);
 const bottom=e('span','hs-thread-top'),updated=e('small','',formatDate(thread.lastMessageAt));bottom.append(updated);
 if(thread.unread){const unread=e('b','hs-unread',thread.unread);unread.setAttribute('aria-label',thread.unread+' nouveaux messages');bottom.append(unread);}
 button.append(top,small,bottom);button.addEventListener('click',()=>{void chooseThread(thread.id);});
 return button;
}
function renderThreads(){threadsEl.replaceChildren();if(!threads.length){threadsEl.append(e('p','hs-empty',copy.empty));return;}threads.forEach(t=>threadsEl.append(line(t)));}
async function updatePresence(){
 if(!user)return;
 try{
  const response=await hub('/api/support/presence');
  $('hsPresenceLabel').textContent=response.online?copy.online:copy.offline;
  $('hsPresenceHint').textContent=response.online?copy.hintOnline:copy.hintOffline;
  $('hsPresenceDot').classList.toggle('online',!!response.online);
 }catch{$('hsPresenceLabel').textContent=copy.offline;$('hsPresenceHint').textContent=copy.hintOffline;$('hsPresenceDot').classList.remove('online');}
}
async function beat(){
 if(!admin||document.hidden)return;
 if(Date.now()-heartbeatLast<20000)return;
 heartbeatLast=Date.now();
 try{await hub('/api/support/presence',{method:'POST'});}catch{heartbeatLast=0;}
}
async function refreshThreads(){
 const result=await hub('/api/support/threads');
 threads=result.items||[];
 renderThreads();
 if(chosen&&!threads.some(t=>t.id===chosen)){chosen='';lastSignature='';$('hsMessageForm').hidden=true;}
}
function showThreadHead(t){
 $('hsCurrentCategory').textContent=t.category+(admin?' · '+t.memberEmail:'');
 $('hsCurrentTitle').textContent=t.subject;
 $('hsCurrentStatus').textContent=statusText(t.status)+' · '+formatDate(t.updatedAt);
 $('hsAdminStatus').hidden=!admin;
 if(admin)$('hsAdminStatus').value=t.status;
 $('hsMessageForm').hidden=!t||(!admin&&t.status==='CLOSED');
 $('hsMessageSubmit').textContent=copy.send;
 if(!admin&&t.status==='CLOSED')report('La conversation est clôturée. Ouvrez une nouvelle demande.');
}
function drawMessages(messages){
 const signature=messages.map(m=>m.id).join('|');
 if(signature===lastSignature)return;
 const atEnd=messagesEl.scrollHeight-messagesEl.scrollTop-messagesEl.clientHeight<100;
 lastSignature=signature;
 messagesEl.replaceChildren();
 if(!messages.length)messagesEl.append(e('p','hs-empty',copy.select));
 else for(const m of messages){
  const own=m.senderRole===user.role&&(user.role!=='admin'||m.senderRole==='admin');
  const item=e('article','hs-message'+(own?' own':''));
  const sender=m.senderRole==='admin'?copy.team:m.senderRole==='recruiter'?copy.recruiter:copy.candidate;
  item.append(e('div','hs-sender',own?copy.you:sender),e('p','',m.body),e('small','',formatDate(m.createdAt)));
  messagesEl.append(item);
 }
 if(atEnd||messages.length<10)messagesEl.scrollTop=messagesEl.scrollHeight;
}
async function loadMessages(){
 if(!chosen)return;
 const current=chosen;
 const data=await hub('/api/support/threads/'+encodeURIComponent(current)+'/messages');
 if(chosen!==current)return;
 drawMessages(data.items||[]);
}
async function chooseThread(id){
 if(!threads.some(t=>t.id===id))return;
 const changed=id!==chosen;
 chosen=id;if(changed)lastSignature='';
 const item=threads.find(t=>t.id===chosen);
 showThreadHead(item);renderThreads();
 try{await loadMessages();report('');}catch(e){report(e.message||copy.error);}
}
async function tick(){
 if(!user||syncBusy||document.hidden)return;
 syncBusy=true;
 try{
  await beat();
  await Promise.all([refreshThreads(),updatePresence()]);
  if(chosen){
   const previous=chosen;
   await loadMessages();
   if(chosen===previous){const t=threads.find(x=>x.id===chosen);if(t)showThreadHead(t);}
  }
  report('');
 }catch(e){report(e.message||copy.error);}
 finally{syncBusy=false;}
}
$('hsThreads').addEventListener('keydown',event=>{if(event.key==='Escape'&&chosen){chosen='';lastSignature='';$('hsMessageForm').hidden=true;}});
$('hsMessageForm').addEventListener('submit',async event=>{
 event.preventDefault();if(sendBusy||!chosen)return;
 const textarea=$('hsMessage'),message=textarea.value.trim();
 if(!message)return;
 sendBusy=true;$('hsMessageSubmit').disabled=true;report('');
 try{
  await hub('/api/support/threads/'+encodeURIComponent(chosen)+'/messages',{method:'POST',body:{message}});
  textarea.value='';
  await refreshThreads();await loadMessages();
 }catch(e){report(e.message||copy.error);}
 finally{sendBusy=false;$('hsMessageSubmit').disabled=false;}
});
$('hsAdminStatus').addEventListener('change',async event=>{
 if(!admin||!chosen)return;
 const status=event.target.value;event.target.disabled=true;report('');
 try{await hub('/api/support/threads/'+encodeURIComponent(chosen)+'/status',{method:'PATCH',body:{status}});await refreshThreads();const item=threads.find(x=>x.id===chosen);if(item)showThreadHead(item);}
 catch(e){report(e.message||copy.error);}
 finally{event.target.disabled=false;}
});
function showDialog(show){
 $('hsNewDialog').hidden=!show;
 if(show){$('hsNewDialog').scrollIntoView({behavior:'smooth',block:'center'});$('hsCreateForm').querySelector('select').focus();}
}
$('hsQuickDemand')?.addEventListener('click',()=>{
 if(!user){gate.hidden=false;gate.scrollIntoView({block:'center',behavior:'smooth'});gate.querySelector('a')?.focus({preventScroll:true});}
 else if(admin)consoleEl.scrollIntoView({block:'start',behavior:'smooth'});
 else showDialog(true);
});
$('hsNewThread').addEventListener('click',()=>showDialog(true));
$('hsCloseDialog').addEventListener('click',()=>showDialog(false));
$('hsCancelDialog').addEventListener('click',()=>showDialog(false));
$('hsCreateForm').addEventListener('submit',async event=>{
 event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
 const button=$('hsCreateSubmit');button.disabled=true;report('');
 try{
  const fd=new FormData(form);
  const response=await hub('/api/support/threads',{method:'POST',body:{
   category:String(fd.get('category')||''),subject:String(fd.get('subject')||''),message:String(fd.get('message')||'')
  }});
  form.reset();showDialog(false);
  await refreshThreads();await chooseThread(response.id);
 }catch(e){report(e.message||copy.error);}
 finally{button.disabled=false;}
});
try{
 user=await requireRole(['admin','candidate','recruiter'],false);
 if(!user){gate.hidden=false;consoleEl.hidden=true;}
 else{
  admin=user.role==='admin';consoleEl.hidden=false;gate.hidden=true;
  $('hsSideOverline').textContent=admin?'HORENOVA · SUPERVISION': 'HORENOVA · MON COMPTE';
  $('hsSideTitle').textContent=admin?copy.admin:copy.mine;
  $('hsSideDesc').textContent=admin?copy.adminDesc:copy.myDesc;
  $('hsNewThread').hidden=admin;
  if(admin){$('hsNewDialog').hidden=true;await beat();}
  await tick();
  const requested=new URLSearchParams(location.search).get('thread');
  if(requested&&threads.some(t=>t.id===requested))await chooseThread(requested);
  else if(threads.length)await chooseThread(threads[0].id);
  setInterval(()=>{void tick();},7000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void tick();});
 }
}catch(error){consoleEl.hidden=true;gate.hidden=false;report(copy.error);console.warn('HORENOVA support session error',error?.message||'auth');}
