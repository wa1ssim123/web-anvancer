import {requireRole} from '/mihna-global.js';
import {hub,hubPhoto} from '/hn-api.js';
const auth=await requireRole(['admin'],false);
const root=document.getElementById('adminGate');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(!auth){root.innerHTML='<div class="hub-error">Accès réservé à l’administration HORENOVA. <a href="/enter.html?mode=signin">Se connecter</a></div>';}
else{
root.innerHTML='<div class="hub-root"><div class="hub-head"><div><span class="hub-small">HORENOVA · CENTRE PRIVÉ</span><h2>Candidatures & recrutement</h2><p class="hub-muted">Dossiers détaillés, photos privées, contrôle des mises en relation et conversations.</p></div><a class="hub-action secondary" href="/conversations.html">Chat HORENOVA ↗</a></div><div class="hub-error" id="hubError"></div><div class="hub-head"><input id="hubSearch" class="hub-input" placeholder="Rechercher un candidat ou une offre…" aria-label="Rechercher"><button class="hub-action secondary" id="hubRefresh">Actualiser</button></div><div class="hub-layout"><section class="hub-panel"><div class="hub-panel-head"><h3 id="hubCount">Candidatures</h3><p class="hub-muted">Nouveaux dossiers transmis à HORENOVA</p></div><div id="hubCases" class="hub-stack"></div></section><section class="hub-panel" id="hubDetail"><div class="hub-detail hub-muted">Choisissez un dossier à examiner.</div></section></div><p class="hub-muted" style="margin-top:22px">Dossiers historiques : <a target="_blank" rel="noopener" href="https://manage.wix.com/dashboard/7d0d5cbc-d6b5-483c-adcf-eda65565ae2e/wix-cms">ouvrir le CMS Wix administrateur</a>.</p></div>';
const $=id=>document.getElementById(id);
const names={EN_ETUDE:'En étude',PRESELECTION:'Présélection',ENTRETIEN:'Entretien',MISE_EN_RELATION:'Mise en relation',RETENUE:'Retenue',REFUSEE:'Refusée',CLOTURE:'Clôturée'};
const statuses=['EN_ETUDE','PRESELECTION','ENTRETIEN','MISE_EN_RELATION','RETENUE','REFUSEE','CLOTURE'];
let applications=[],requests=[],selected='',objectUrl=null;
const field=(n,v,w=false)=>'<div class="hub-field '+(w?'wide':'')+'"><small>'+esc(n)+'</small><strong>'+esc(v??'Non renseigné')+'</strong></div>';
const showError=msg=>{$('hubError').textContent=msg||'';};
function list(){
const term=$('hubSearch').value.toLowerCase().trim();
const shown=applications.filter(a=>[a.jobTitle,a.candidateEmail,a.profile?.firstName,a.profile?.lastName,a.profile?.city].join(' ').toLowerCase().includes(term));
$('hubCount').textContent=applications.length+' dossier(s)';
$('hubCases').innerHTML=shown.map(a=>'<button type="button" class="hub-case '+(a.id===selected?'active':'')+'" data-id="'+esc(a.id)+'"><span>'+esc(new Date(a.createdAt).toLocaleDateString('fr-MA'))+'</span><strong>'+esc([a.profile?.firstName,a.profile?.lastName].filter(Boolean).join(' ')||a.candidateEmail)+'</strong><span>'+esc(a.jobTitle)+' · '+esc(a.profile?.city||'')+'</span><p class="hub-tag">'+esc(names[a.status]||a.status)+'</p></button>').join('')||'<div class="hub-detail hub-muted">Aucune candidature.</div>';
$('hubCases').querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>detail(b.dataset.id));
}
async function detail(id){
selected=id;list();
const a=applications.find(x=>x.id===id);if(!a)return;
const p=a.profile||{},languages=[['Arabe',p.arabic,p.arabicLevel],['Français',p.french,p.frenchLevel],['Anglais',p.english,p.englishLevel]].filter(z=>z[1]).map(z=>z[0]+' '+z[2]+'/5').join(' · ');
const select=statuses.map(s=>'<option value="'+s+'" '+(a.status===s?'selected':'')+'>'+esc(names[s])+'</option>').join('');
const reqOptions='<option value="">Sélectionner un recruteur…</option>'+requests.filter(r=>!r.job_role||r.job_role===a.jobRole).map(r=>'<option value="'+esc(r.id)+'">'+esc(r.business_name+' · '+r.job_title)+'</option>').join('');
$('hubDetail').innerHTML='<div class="hub-detail"><span class="hub-small">DOSSIER PRIVÉ · '+esc(id.slice(0,8))+'</span><div class="hub-profile"><div id="hubPortrait" class="hub-photo hub-photo-placeholder">◉</div><div><h3>'+esc(p.firstName||'')+' '+esc(p.lastName||'')+'</h3><p class="hub-muted">'+esc(a.jobTitle)+'</p><span class="hub-tag">'+esc(names[a.status]||a.status)+'</span></div></div><div class="hub-grid">'+field('E-mail',a.candidateEmail)+field('Âge',p.age)+field('Ville',p.city)+field('Métier',p.jobFamily)+field('Langues',languages,true)+field('Quiz',p.quizPassed?p.quizScore+' %':'Non validé')+field('Vidéo privée',p.videoFileId?'Enregistrée':'Absente')+field('Présentation',p.bio,true)+field('Consentement candidat',a.consentToIntro?'Oui':'Non',true)+'</div><div class="hub-controls"><label>Statut<select class="hub-select" id="hubStatus">'+select+'</select></label><button class="hub-action" type="button" id="saveStatus">Enregistrer le statut</button><label>Associer une demande d’établissement<select class="hub-select" id="recruitRequest">'+reqOptions+'</select></label><button class="hub-action secondary" type="button" id="assignRequest" '+(a.recruiterWixId?'disabled':'')+'>Autoriser la mise en relation</button><a class="hub-action secondary" href="/conversations.html?id='+encodeURIComponent(id)+'">Ouvrir la conversation à trois ↗</a><p class="hub-error" id="caseError"></p></div></div>';
$('saveStatus').onclick=async()=>{try{await hub('/api/applications/'+id+'/status',{method:'PATCH',body:{status:$('hubStatus').value}});await refresh();}catch(e){$('caseError').textContent=e.message;}};
$('assignRequest').onclick=async()=>{try{const requestId=$('recruitRequest').value;if(!requestId)throw Error('Sélectionnez une demande.');if(!a.consentToIntro)throw Error('Consentement candidat requis.');await hub('/api/applications/'+id+'/assign',{method:'PATCH',body:{requestId}});await refresh();}catch(e){$('caseError').textContent=e.message;}};
if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}
try{objectUrl=await hubPhoto('/api/applications/'+id+'/photo');if(objectUrl&&id===selected){const img=document.createElement('img');img.className='hub-photo';img.src=objectUrl;img.alt='Photo du candidat';$('hubPortrait')?.replaceWith(img);}}catch{}
}
async function refresh(){
try{showError('');const [a,r]=await Promise.all([hub('/api/applications'),hub('/api/recruiter-requests')]);applications=a.items||[];requests=r.items||[];list();if(selected&&applications.some(a=>a.id===selected))await detail(selected);}
catch(e){showError(e.message+' Les dossiers privés restent accessibles dans le CMS administrateur Wix.');$('hubCases').innerHTML='<div class="hub-detail hub-muted">Service des dossiers non disponible.</div>';}
}
$('hubSearch').oninput=list;$('hubRefresh').onclick=refresh;await refresh();
}