import {requireRole} from '/mihna-global.js';
import {hub} from '/hn-api.js';
const $=id=>document.getElementById(id);
const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);return el;};
const tr={
 en:{tabMessages:'My messages',tabMatching:'Search & Matching',myDiscussions:'MY INBOX',myThreads:'Conversations',threadSearch:'Search conversations…',loading:'Loading…',privateInbox:'Messages can be viewed only by authorized participants.',supervised:'SUPERVISED CONVERSATION',chooseConversation:'Choose a conversation',chooseHint:'Select a case to see the messages.',welcome:'HORENOVA messages will appear here.',writeMessage:'Your message',compose:'Write a private message…',send:'Send',confidentialNote:'HORENOVA supervises these conversations. Never share passwords or banking information.',adminOnly:'HORENOVA ADMIN · PRIVATE ACCESS',matchingTitle:'Find the right match.',matchingDesc:'Search applicants and employer requests, send private messages and connect the three parties after approval.',verified:'Verified access',candidates:'Candidates',employers:'Employers',search:'Name, business or keyword',searchPlaceholder:'Name, business…',job:'Occupation',jobPlaceholder:'Waiter, barista, chef…',city:'City',cityPlaceholder:'Casablanca, Marrakech…',status:'Status',allStatuses:'All',inReview:'Under review',preselected:'Shortlisted',introduced:'Introduced',approved:'Approved',pending:'Pending',declined:'Declined',filter:'Search',directory:'PRIVATE DIRECTORY',resultCandidates:'Applications',resultRecruiters:'Employer requests',supervisedMatch:'SUPERVISED MATCHING',createRoom:'Create a three-person chat',selectBoth:'Choose a candidate and an approved employer request.',candidate:'CANDIDATE',employer:'EMPLOYER',notSelected:'Not selected',alwaysPresent:'Present in every introduction',openGroup:'Create private group chat',consentNote:'The request must be approved and the candidate must consent. An introduction cannot be reassigned silently.',footer:'Respect, privacy and professional connections.',private:'Private',trio:'Group of 3',noMessages:'No messages yet. Write the first message.',noThreads:'No conversations yet. Messages from HORENOVA will appear here.',noResults:'No matching results.',choose:'Select',privateMessage:'Private message',selected:'Selected',candidateMissing:'Select a candidate.',recruiterMissing:'Select an employer.',noConsent:'Candidate consent required.',notApproved:'Employer request must be approved.',alreadyAssigned:'Already introduced: open the existing conversation.',roleMismatch:'The occupations do not match.',ready:'Ready for introduction. Review participants and consent.',confirm:'Create the private group chat for {candidate}, {recruiter} and HORENOVA?',created:'The three-person private chat is created.',directReady:'Private conversation opened. You can write the first message.',login:'Sign in',roomMatch:'THREE-PARTY INTRODUCTION',roomDirect:'PRIVATE HORENOVA CONVERSATION',candidateRole:'Candidate',recruiterRole:'Employer',adminRole:'HORENOVA',consented:'Consent given',notConsented:'No consent',allRoles:'Candidate, employer and HORENOVA',twoRoles:'HORENOVA and member',space:'My account',support:'Support',eyebrow:'HORENOVA / PROFESSIONAL CONNECTIONS',hero:'The right connections. Real conversations.',intro:'Secure recruitment conversations supervised by HORENOVA.'},
 ar:{tabMessages:'رسائلي',tabMatching:'البحث والمطابقة',myDiscussions:'محادثاتي',myThreads:'المحادثات',threadSearch:'البحث عن محادثة…',loading:'جارٍ التحميل…',privateInbox:'المشاركون المصرّح لهم فقط يمكنهم رؤية الرسائل.',supervised:'محادثة بإشراف هورينوفا',chooseConversation:'اختر محادثة',chooseHint:'اختر ملفًا لعرض الرسائل.',welcome:'رسائل هورينوفا ستظهر هنا.',writeMessage:'رسالتك',compose:'اكتب رسالة خاصة…',send:'إرسال',confidentialNote:'المحادثات تحت إشراف هورينوفا. لا تشارك كلمة السر أو معلومات البنك.',adminOnly:'إدارة هورينوفا · وصول خاص',matchingTitle:'اعثر على المطابقة المناسبة.',matchingDesc:'ابحث في ملفات المرشحين وطلبات المشغّلين، وأرسل رسائل خاصة أو أنشئ مجموعة ثلاثية بعد الموافقة.',verified:'وصول موثوق',candidates:'المرشحون',employers:'المشغّلون',search:'الاسم أو المؤسسة',searchPlaceholder:'الاسم أو المؤسسة…',job:'المهنة',jobPlaceholder:'نادل، باريستا، طاهٍ…',city:'المدينة',cityPlaceholder:'الدار البيضاء، مراكش…',status:'الحالة',allStatuses:'الكل',inReview:'قيد الدراسة',preselected:'اختيار أولي',introduced:'تم الربط',approved:'مقبولة',pending:'قيد المراجعة',declined:'مرفوضة',filter:'بحث',directory:'الدليل الخاص',resultCandidates:'الترشيحات',resultRecruiters:'طلبات التوظيف',supervisedMatch:'مطابقة بإشراف الإدارة',createRoom:'إنشاء محادثة ثلاثية',selectBoth:'اختر مرشحًا وطلب توظيف معتمدًا.',candidate:'المرشح',employer:'المشغّل',notSelected:'لم يتم الاختيار',alwaysPresent:'حاضرة في كل ربط',openGroup:'إنشاء المحادثة الخاصة',consentNote:'يجب اعتماد الطلب وموافقة المرشح. لا يمكن إعادة توجيه المحادثة دون موافقة.',footer:'الاحترام والخصوصية والتواصل المهني.',private:'خاص',trio:'ثلاثي',noMessages:'لا توجد رسائل بعد. يمكنك بدء المحادثة.',noThreads:'لا توجد محادثات. ستظهر رسائل هورينوفا هنا.',noResults:'لا توجد نتائج.',choose:'اختيار',privateMessage:'رسالة خاصة',selected:'تم الاختيار',candidateMissing:'اختر مرشحًا.',recruiterMissing:'اختر مشغّلًا.',noConsent:'موافقة المرشح مطلوبة.',notApproved:'يجب اعتماد طلب المشغّل.',alreadyAssigned:'تم الربط سابقًا. افتح المحادثة الموجودة.',roleMismatch:'المهنتان مختلفتان.',ready:'يمكن إنشاء المحادثة بعد التحقق من الموافقة.',confirm:'إنشاء مجموعة خاصة مع {candidate} و{recruiter} وهورينوفا؟',created:'تم إنشاء المحادثة الخاصة الثلاثية.',directReady:'تم فتح المحادثة الخاصة. يمكنك إرسال أول رسالة.',login:'تسجيل الدخول',roomMatch:'محادثة ربط ثلاثية',roomDirect:'محادثة خاصة مع هورينوفا',candidateRole:'مرشح',recruiterRole:'مشغّل',adminRole:'هورينوفا',consented:'موافق',notConsented:'بدون موافقة',allRoles:'مرشح ومشغّل وهورينوفا',twoRoles:'هورينوفا والعضو',space:'حسابي',support:'الدعم',eyebrow:'هورينوفا / التواصل المهني',hero:'تواصل مهني مناسب. محادثات حقيقية.',intro:'مراسلة مهنية خاصة بإشراف هورينوفا.'}
};
const statusLabels={EN_ETUDE:['En étude','Under review','قيد الدراسة'],PRESELECTION:['Présélection','Shortlisted','اختيار أولي'],MISE_EN_RELATION:['Mise en relation','Introduced','تم الربط'],VALIDEE:['Validée','Approved','مقبول'],A_EXAMINER:['À examiner','Pending','قيد المراجعة'],REFUSEE:['Refusée','Declined','مرفوض']};
let lang='fr';try{const l=localStorage.getItem('mihna-lang');if(['fr','en','ar'].includes(l))lang=l}catch{}
const t=(key,fr)=>tr[lang]?.[key]||fr||key;
const stat=x=>statusLabels[x]?.[['fr','en','ar'].indexOf(lang)]||x||'';
const time=value=>{const d=new Date(value);return Number.isNaN(d.getTime())?'':d.toLocaleString(lang==='ar'?'ar-MA':'fr-MA',{dateStyle:'short',timeStyle:'short'})};
let auth=null,threads=[],chosen=null,displayMode='messages',kind='candidate',results=[],candidate=null,recruiter=null,busy=false,fetching=false,searchRequest=0,lastMessages='';
const initialId=new URLSearchParams(location.search).get('id');
function banner(message='',error=false){const b=$('conversationError');b.hidden=!message;b.textContent=message;b.classList.toggle('is-error',error);b.classList.toggle('is-success',!!message&&!error);}
function loc(){document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';document.querySelectorAll('[data-t]').forEach(el=>{const fr=el.dataset.original||el.textContent;el.dataset.original=fr;el.textContent=t(el.dataset.t,fr)});document.querySelectorAll('[data-t-placeholder]').forEach(el=>{const fr=el.dataset.originalPlaceholder||el.placeholder;el.dataset.originalPlaceholder=fr;el.placeholder=t(el.dataset.tPlaceholder,fr)});renderThreads();if(chosen)head(chosen);renderResults();renderSelections();}
function isMatch(a,b){
 const n=x=>String(x||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().split(/[,;/|]+/).map(s=>s.trim()).filter(Boolean);
 return n(a).some(r=>n(b).includes(r));
}
function renderThreads(){
 const list=$('conversationList');list.replaceChildren();
 const q=$('hcThreadSearch').value.trim().toLowerCase(),found=threads.filter(x=>[x.title,x.subtitle,x.messagePreview].join(' ').toLowerCase().includes(q));
 if(!found.length){list.append(node('p','hc-empty',t(threads.length?'noResults':'noThreads','Aucune conversation pour le moment.')));return}
 for(const item of found){
  const on=chosen?.id===item.id&&chosen?.kind===item.kind;
  const btn=node('button','hc-thread'+(on?' active':''));btn.type='button';btn.dataset.id=item.id;btn.setAttribute('aria-pressed',String(on));
  const a=node('span','hc-thread-avatar'+(item.kind==='match'?' match':''),item.kind==='match'?'✦':'H');
  const label=node('span','hc-thread-content');
  label.append(node('strong','hc-thread-title',item.kind==='match'?item.title:(auth?.role==='admin'?item.title:'HORENOVA')));
  label.append(node('span','hc-thread-sub',item.subtitle||''));
  label.append(node('span','hc-thread-preview',item.messagePreview||t(item.kind==='match'?'allRoles':'twoRoles','Conversation privée')));
  btn.append(a,label,node('span','hc-thread-type'+(item.kind==='match'?' match':''),t(item.kind==='match'?'trio':'private',item.kind==='match'?'À trois':'Privé')));
  btn.addEventListener('click',()=>void selectThread(item));list.append(btn);
 }
 $('hcThreadCount').textContent=String(threads.length);$('hcThreadCount').hidden=!threads.length;
}
function head(item){
 $('hcRoomAvatar').textContent=item.kind==='match'?'✦':'H';
 $('hcRoomKicker').textContent=t(item.kind==='match'?'roomMatch':'roomDirect',item.kind==='match'?'DISCUSSION À TROIS':'ÉCHANGE PRIVÉ');
 $('conversationTitle').textContent=item.kind==='match'?item.title:(auth?.role==='admin'?item.title:'HORENOVA');
 $('hcParticipants').textContent=item.kind==='match'?[item.candidateName,item.businessName,'HORENOVA'].filter(Boolean).join(' · '):auth?.role==='admin'?'HORENOVA · '+item.title:t('twoRoles','HORENOVA + membre');
 $('conversationForm').hidden=false;$('hcRoomStatus').hidden=false;$('hcRoomStatus').textContent=t(item.kind==='match'?'allRoles':'private',item.kind==='match'?'Candidat · Recruteur · HORENOVA':'Privé');
}
async function messages(force=false){
 if(!chosen||fetching||document.hidden)return;
 const selected=chosen;fetching=true;
 try{
  const data=await hub('/api/chat/'+selected.kind+'/'+encodeURIComponent(selected.id)+'/messages');
  if(chosen?.id!==selected.id||chosen?.kind!==selected.kind)return;
  const items=data.items||[],sig=items.length+':'+(items.at(-1)?.id||'')+':'+lang;
  if(sig===lastMessages&&!force)return;lastMessages=sig;
  const root=$('conversationMessages'),bottom=root.scrollHeight-root.scrollTop-root.clientHeight<90;
  root.replaceChildren();
  if(!items.length)root.append(node('p','hc-chat-blank',t('noMessages','Vous pouvez écrire le premier message.')));
  for(const m of items){
   const mine=m.senderWixId===auth.member?.id;
   const name=t(m.senderRole==='admin'?'adminRole':m.senderRole==='recruiter'?'recruiterRole':'candidateRole',m.senderRole==='admin'?'HORENOVA':m.senderRole==='recruiter'?'Recruteur':'Candidat');
   const bubble=node('article','hc-bubble'+(mine?' mine':'')+(m.senderRole==='admin'?' admin':''));
   bubble.append(node('small','',name+' · '+time(m.createdAt)),node('div','',m.body));root.append(bubble);
  }
  if(force||bottom)root.scrollTop=root.scrollHeight;
 }catch(e){banner(e.message,true)}finally{fetching=false}
}
async function selectThread(item){
 chosen=item;head(item);renderThreads();lastMessages='';
 const url=new URL(location.href);url.searchParams.set('id',item.id);history.replaceState(null,'',url.pathname+url.search);
 await messages(true);
}
async function loadThreads(selectId=''){
 if(!auth)return;
 const data=await hub('/api/chat/threads');threads=data.items||[];
 const next=threads.find(x=>x.id===selectId)||threads.find(x=>x.id===chosen?.id&&x.kind===chosen?.kind)||threads.find(x=>x.id===initialId)||threads[0]||null;
 const changed=next?.id!==chosen?.id||next?.kind!==chosen?.kind;chosen=next;
 renderThreads();
 if(next){head(next);if(changed){lastMessages='';await messages(true)}}
 else{$('conversationForm').hidden=true;$('hcRoomStatus').hidden=true;$('conversationTitle').textContent=t('chooseConversation','Choisir une conversation');$('conversationMessages').replaceChildren(node('p','hc-empty',t('welcome','Vos messages apparaîtront ici.')))}
}
async function send(e){
 e.preventDefault();if(busy||!chosen)return;
 const body=$('conversationText').value.trim();if(!body)return;
 busy=true;$('hcSend').disabled=true;
 try{
  await hub('/api/chat/'+chosen.kind+'/'+encodeURIComponent(chosen.id)+'/messages',{method:'POST',body:{body}});
  $('conversationText').value='';lastMessages='';await messages(true);await loadThreads(chosen.id);banner('');
 }catch(e){banner(e.message,true)}finally{busy=false;$('hcSend').disabled=false}
}
function mode(which){
 if(which==='matching'&&auth?.role!=='admin')which='messages';displayMode=which;
 $('hcMessagesView').hidden=which!=='messages';$('hcMatchingView').hidden=which!=='matching';
 document.querySelectorAll('[data-mode]').forEach(b=>{const on=b.dataset.mode===which;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
 if(which==='matching'&&!results.length)void search();
}
async function search(){
 if(auth?.role!=='admin')return;
 const id=++searchRequest;
 const params=new URLSearchParams({kind,query:$('hcSearchQuery').value.trim(),role:$('hcSearchRole').value.trim(),city:$('hcSearchCity').value.trim(),status:$('hcSearchStatus').value});
 $('hcDirectoryResults').replaceChildren(node('p','hc-empty',t('loading','Chargement…')));
 try{const r=await hub('/api/admin/match-directory?'+params);if(id!==searchRequest)return;results=r.items||[];renderResults()}
 catch(e){if(id!==searchRequest)return;results=[];renderResults();banner(e.message,true)}
}
function renderResults(){
 if(auth?.role!=='admin')return;
 $('hcResultTitle').textContent=t(kind==='candidate'?'resultCandidates':'resultRecruiters',kind==='candidate'?'Candidatures':'Demandes recruteurs');
 $('hcResultCount').textContent=String(results.length);
 const root=$('hcDirectoryResults');root.replaceChildren();
 if(!results.length){root.append(node('p','hc-empty',t('noResults','Aucun résultat.')));return}
 for(const item of results){
  const selected=(kind==='candidate'?candidate:recruiter)?.id===item.id;
  const row=node('article','hc-result'+(selected?' selected':'')),detail=node('div','hc-result-details');
  detail.append(node('strong','',item.name||'—'));
  detail.append(node('small','',[item.jobRole||item.jobTitle,item.city,kind==='candidate'?t(item.consentToIntro?'consented':'notConsented',item.consentToIntro?'Consentement':'Non consenti'):null].filter(Boolean).join(' · ')));
  detail.append(node('span','hc-status',stat(item.status)));
  const buttons=node('div','hc-result-actions'),select=node('button','',t(selected?'selected':'choose',selected?'Sélectionné':'Choisir')),direct=node('button','',t('privateMessage','Message privé'));
  select.type='button';direct.type='button';
  select.addEventListener('click',()=>{if(kind==='candidate')candidate=item;else recruiter=item;renderResults();renderSelections()});
  direct.addEventListener('click',()=>void openDirect(kind,item,direct));
  buttons.append(select,direct);row.append(detail,buttons);root.append(row);
 }
}
function checkMatch(){
 if(!candidate)return t('candidateMissing','Sélectionnez un candidat.');
 if(!recruiter)return t('recruiterMissing','Sélectionnez un recruteur.');
 if(!candidate.consentToIntro)return t('noConsent','Consentement obligatoire.');
 if(recruiter.status!=='VALIDEE')return t('notApproved','Demande non validée.');
 if(candidate.assigned)return t('alreadyAssigned','Candidature déjà affectée.');
 if(candidate.jobRole&&recruiter.jobRole&&!isMatch(candidate.jobRole,recruiter.jobRole))return t('roleMismatch','Métiers incompatibles.');
 return '';
}
function renderSelections(){
 if(auth?.role!=='admin')return;
 $('hcSelectedCandidate').textContent=candidate?.name||t('notSelected','Non sélectionné');
 $('hcSelectedRecruiter').textContent=recruiter?.name||t('notSelected','Non sélectionné');
 $('hcCandidateMeta').textContent=candidate?[candidate.jobRole,candidate.city,stat(candidate.status)].filter(Boolean).join(' · '):'';
 $('hcRecruiterMeta').textContent=recruiter?[recruiter.jobRole,recruiter.city,stat(recruiter.status)].filter(Boolean).join(' · '):'';
 $('hcRemoveCandidate').hidden=!candidate;$('hcRemoveRecruiter').hidden=!recruiter;
 const reason=checkMatch();$('hcMatchValidation').textContent=reason||(candidate&&recruiter?t('ready','Prêt pour mise en relation.'):'');
 $('hcStartMatch').disabled=!!reason||busy;
}
async function openDirect(selectedKind,item,button){
 if(busy||auth?.role!=='admin')return;
 busy=true;button.disabled=true;
 try{
  const r=await hub('/api/chat/direct-threads',{method:'POST',body:{kind:selectedKind,sourceId:item.id}});
  await loadThreads(r.id);mode('messages');
  const thread=threads.find(x=>x.kind==='direct'&&x.id===r.id);if(thread)await selectThread(thread);
  banner(t('directReady','Conversation privée ouverte.'));$('conversationText').focus();
 }catch(e){banner(e.message,true)}finally{busy=false;button.disabled=false;renderSelections()}
}
async function startMatch(){
 if(busy||auth?.role!=='admin')return;
 const reason=checkMatch();if(reason){banner(reason,true);return}
 const c=candidate,r=recruiter;
 const confirmation=t('confirm','Créer le chat privé à trois entre {candidate}, {recruiter} et HORENOVA ?').replace('{candidate}',c.name).replace('{recruiter}',r.name);
 if(!window.confirm(confirmation))return;
 busy=true;$('hcStartMatch').disabled=true;
 try{
  await hub('/api/applications/'+encodeURIComponent(c.id)+'/assign',{method:'PATCH',body:{requestId:r.id}});
  c.assigned=true;await loadThreads(c.id);mode('messages');
  const thread=threads.find(x=>x.kind==='match'&&x.id===c.id);if(thread)await selectThread(thread);
  banner(t('created','Discussion à trois créée.'));$('conversationText').focus();
 }catch(e){banner(e.message,true)}finally{busy=false;renderSelections()}
}
$('conversationForm').addEventListener('submit',send);
$('hcRefresh').addEventListener('click',()=>void loadThreads().catch(e=>banner(e.message,true)));
$('hcThreadSearch').addEventListener('input',renderThreads);
$('hcSearchForm').addEventListener('submit',e=>{e.preventDefault();void search()});
document.querySelectorAll('[data-kind]').forEach(b=>b.addEventListener('click',()=>{
 kind=b.dataset.kind;$('hcSearchStatus').value='';document.querySelectorAll('[data-kind]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});void search();
}));
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>mode(b.dataset.mode)));
$('hcRemoveCandidate').addEventListener('click',()=>{candidate=null;renderSelections();renderResults()});
$('hcRemoveRecruiter').addEventListener('click',()=>{recruiter=null;renderSelections();renderResults()});
$('hcStartMatch').addEventListener('click',()=>void startMatch());
document.addEventListener('change',e=>{if(e.target.matches?.('[data-hn-language]')&&['fr','en','ar'].includes(e.target.value)){lang=e.target.value;setTimeout(loc,0);lastMessages='';void messages(true)}});
window.addEventListener('pageshow',()=>{try{const v=localStorage.getItem('mihna-lang');if(['fr','en','ar'].includes(v)&&v!==lang){lang=v;loc();void messages(true)}}catch{}});
loc();
try{
 auth=await requireRole(['admin','candidate','recruiter'],false);
 if(!auth){
  banner(t('login','Connexion nécessaire'),true);$('hcModes').hidden=true;
  const link=node('a','hc-send',t('login','Se connecter'));link.href='/enter.html?mode=signin&returnTo=%2Fconversations.html';$('conversationMessages').replaceChildren(link);
 }else{
  $('hcTabMatching').hidden=auth.role!=='admin';await loadThreads();
  if(auth.role==='admin'&&new URLSearchParams(location.search).get('mode')==='matching')mode('matching');
  setInterval(()=>{if(document.hidden||displayMode!=='messages'||busy)return;void messages().then(()=>loadThreads()).catch(()=>{})},9000);
 }
}catch(e){banner(e.message||'Erreur de connexion',true)}
