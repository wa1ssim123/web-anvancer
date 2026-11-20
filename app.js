// Live HORENOVA data is loaded from the Wix CMS; no sample applications or ratings are displayed.
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state=(()=>{try{const value=JSON.parse(localStorage.getItem('mihna-v3-temp')||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch{return {}}})();
state.intent=state.intent||'job'; state.role=state.role||'Barista'; state.city=state.city||'Casablanca'; state.saved=Array.isArray(state.saved)?state.saved:[]; state.trip=Array.isArray(state.trip)?state.trip:[]; state.customJobs=Array.isArray(state.customJobs)?state.customJobs:[];
const persist=()=>{try{localStorage.setItem('mihna-v3-temp',JSON.stringify(state))}catch{/* Allow session use when storage is restricted. */}};
const jobs=()=>[...(window.HORENOVA_LIVE_JOBS||[])];
function formatJobStartDate(value){
  const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(!match)return String(value||'');
  const date=new Date(Number(match[1]),Number(match[2])-1,Number(match[3]),12);
  if(Number.isNaN(date.getTime()))return String(value||'');
  let lang='fr';try{lang=localStorage.getItem('mihna-lang')||'fr'}catch{}
  return new Intl.DateTimeFormat(lang==='ar'?'ar-MA':lang==='en'?'en-GB':'fr-MA',{day:'numeric',month:'long',year:'numeric'}).format(date);
}
const publicJobLink=id=>new URL('/job.html?id='+encodeURIComponent(id),location.origin).href;
async function sharePublicJob(job,mode,button){
  const link=publicJobLink(job.id);
  const message=job.title+' · '+job.city+' — HORENOVA\n'+link;
  if(mode==='whatsapp'){
    const target='https://wa.me/?text='+encodeURIComponent(message);
    const popup=window.open(target,'_blank','noopener,noreferrer');
    if(!popup)location.assign(target);
    return;
  }
  if(mode==='native' && typeof navigator.share==='function'){
    try{await navigator.share({title:'Offre HORENOVA · '+job.title,text:job.title+' · '+job.city,url:link});return;}
    catch(error){if(error?.name==='AbortError')return;}
  }
  try{
    if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(link);
    else{
      const input=document.createElement('textarea');
      input.value=link;input.style.position='fixed';input.style.opacity='0';
      document.body.append(input);input.select();
      const success=document.execCommand('copy');input.remove();
      if(!success)throw Error('Copie indisponible');
    }
    const previous=button.textContent;button.textContent='✓ Lien copié';
    setTimeout(()=>{if(button.isConnected)button.textContent=previous;},2400);
  }catch{window.prompt('Copiez ce lien pour partager l’annonce :',link);}
}
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-share-job]');
  if(!button)return;
  event.preventDefault();
  const id=decodeURIComponent(button.dataset.shareJob||'');
  const job=jobs().find(item=>item.id===id);
  if(!job)return;
  void sharePublicJob(job,button.dataset.shareMode||'native',button);
});

function toast(t){const e=$('#toast');if(!e)return;e.textContent=t;e.classList.add('show');clearTimeout(window._tt);window._tt=setTimeout(()=>e.classList.remove('show'),1800)}
function setupMenu(){if(document.querySelector('script[src*="mobile-nav-v15.js"]'))return;const b=$('#menuBtn'),m=$('#mobileMenu');if(b&&m)b.onclick=()=>{m.hidden=!m.hidden;b.textContent=m.hidden?'☰':'×'}}
function setupHeroVideo(){const p=$('#playHero'),w=$('.hero-photo-wrap'),v=$('#heroVideo');if(p&&w&&v)p.onclick=()=>{w.classList.toggle('playing');w.classList.contains('playing')?v.play():v.pause()};const f=$('#filmBtn'),ev=$('#exploreVideo');if(f&&ev)f.onclick=()=>{ev.style.display='block';ev.play()}}
function setupQuiz(){const i=$('#intentSelect'),r=$('#roleSelect'),c=$('#citySelect'),b=$('#matchBtn');if(!i||!r||!c)return;i.value=state.intent;r.value=state.role;c.value=state.city;[i,r,c].forEach(x=>x.onchange=()=>{state.intent=i.value;state.role=r.value;state.city=c.value;persist()});if(b)b.onclick=()=>{state.intent=i.value;state.role=r.value;state.city=c.value;persist();if(location.pathname.endsWith('/matches.html')){renderMatch();toast('Vos matchs sont actualisés')}else location.href='/matches.html'}}
let current=0,kind='all';
function filteredMatches(){let list=jobs().filter(j=>kind==='all'||j.kind===kind);const exact=list.filter(j=>j.role===state.role||j.city===state.city);return exact.length?exact:list}
function renderMatch(){const deck=$('#matchDeck');if(!deck)return;const list=filteredMatches();if(current>=list.length)current=0;const j=list[current];const mi=$('#matchIndex'),mt=$('#matchTotal');if(mi)mi.textContent=list.length?String(current+1).padStart(2,'0'):'00';if(mt)mt.textContent=String(list.length).padStart(2,'0');if(!j){deck.innerHTML='<div class="empty-state"><h2>Aucun match pour le moment.</h2></div>';return}const saved=state.saved.includes(j.id);deck.innerHTML=`<article class="match-card"><a class="match-image" href="/job.html?id=${encodeURIComponent(j.id)}"><img src="${j.img}" alt="${j.title}"><span class="label">${j.kind==='shift'?'◷ Shift':'▣ Une nouvelle place'}</span><div class="card-copy"><small>${j.role.toUpperCase()}</small><h3>${j.title} &nbsp;↗</h3><p>⌖&nbsp; ${j.city}</p></div></a><div class="match-body"><div class="match-row"><div><small style="color:#999589">L’ÉTABLISSEMENT</small><h4>${j.business}</h4></div><div class="match-pay">${j.pay} <small><br>${j.period}</small></div></div><div class="chips"><span class="chip">✓ Même métier</span><span class="chip">✓ Dans votre ville</span><span class="chip">✓ Format recherché</span></div><div class="match-actions"><button id="prevBtn">‹&nbsp; Précédente</button><button class="save" id="saveBtn">♡&nbsp; ${saved?'Enregistré':'Enregistrer'}</button><button id="nextBtn">Suivante&nbsp; →</button></div><a class="detail-link" href="/job.html?id=${encodeURIComponent(j.id)}">Voir tous les détails de l’offre →</a></div></article>`;$('#prevBtn').onclick=()=>{current=(current-1+list.length)%list.length;renderMatch()};$('#nextBtn').onclick=()=>{current=(current+1)%list.length;renderMatch()};$('#saveBtn').onclick=()=>{state.saved=saved?state.saved.filter(x=>x!==j.id):[...state.saved,j.id];persist();renderMatch();toast(saved?'Retiré des favoris':'Ajouté aux favoris')}}
function setupMatches(){if(!$('#matchDeck'))return;$$('[data-kind]').forEach(b=>b.onclick=()=>{kind=b.dataset.kind;current=0;$$('[data-kind]').forEach(x=>x.classList.toggle('active',x===b));renderMatch()});const sh=$('#shuffleBtn');if(sh)sh.onclick=()=>{const l=filteredMatches();current=l.length?Math.floor(Math.random()*l.length):0;renderMatch()};renderMatch()}
function cardJob(j){return `<article class="job-card-page"><a class="job-card-photo" href="/job.html?id=${encodeURIComponent(j.id)}"><img src="${j.img}" alt="${j.title}">${j.sponsored?'<span class="sponsored">SPONSORISÉ</span>':''}</a><div class="job-card-content"><small>${j.kind==='shift'?'SHIFT':'EMPLOI'} · ${j.role}</small><h3>${j.title}</h3><p>${j.business}<br>⌖ ${j.city}${j.time?'<br>◷ '+j.time:''}</p><div class="job-card-bottom"><strong>${j.pay}</strong><a href="/job.html?id=${encodeURIComponent(j.id)}">Voir l’offre ↗</a><button type="button" class="soft-btn" data-share-job="${encodeURIComponent(j.id)}" data-share-mode="native" aria-label="Partager cette offre" style="padding:8px 12px;font-size:12px">↗ Partager</button></div></div></article>`}
function renderJobsPage(){const g=$('#jobsGrid');if(!g)return;const list=jobs().filter(j=>j.kind==='job');g.innerHTML=list.length?list.map(cardJob).join(''):'<div class="empty-state"><h2>Aucune offre vérifiée publiée pour le moment.</h2><p>Les employeurs pourront bientôt publier leurs offres sur HORENOVA.</p></div>'}
let selectedDay=-1; // Show every upcoming shift until a particular date is chosen.
function shiftDate(o){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+o);return d}
function renderCalendar(){const box=$('#calendarStrip');if(!box)return;const _lng=localStorage.getItem('mihna-lang')||'fr';const f=new Intl.DateTimeFormat(_lng==='ar'?'ar-MA':_lng==='en'?'en-GB':'fr-MA',{weekday:'short'});box.innerHTML='<button class="day '+(selectedDay===-1?'active':'')+'" data-day="-1"><span>Tous</span><b>↗</b></button>'+[0,1,2,3,4,5,6].map(i=>`<button class="day ${i===selectedDay?'active':''}" data-day="${i}"><span>${f.format(shiftDate(i))}</span><b>${shiftDate(i).getDate()}</b></button>`).join('');$$('[data-day]').forEach(b=>b.onclick=()=>{selectedDay=+b.dataset.day;renderCalendar();renderShifts()})}
function renderShifts(){const g=$('#shiftGrid');if(!g)return;const list=jobs().filter(j=>j.kind==='shift'&&(selectedDay===-1 || (j.dateOffset??0)===selectedDay));g.innerHTML=list.length?list.map(j=>`<article class="shift-card"><div class="shift-card-visual"><img src="${j.img||'https://headless-tfcfvgrbhgw-xwassim04-1409.wix-site-host.com/assets/restaurant.jpg'}" alt="${j.title}"><span>${j.role.toUpperCase()} · ${j.city.toUpperCase()}</span></div><div class="shift-card-body"><span class="small-title">MISSION PONCTUELLE</span><h3>${j.title}</h3><div class="shift-meta">${j.business}<br>⌖ ${j.city}<br>◷ ${j.time||'Horaire à confirmer'}</div><strong>${j.pay}</strong><a class="cta-main button-link full-btn" href="/job.html?id=${encodeURIComponent(j.id)}">Voir le shift ↗</a><button type="button" class="soft-btn" data-share-job="${encodeURIComponent(j.id)}" data-share-mode="native" aria-label="Partager ce shift" style="margin-top:9px;width:100%;padding:11px">↗ Partager le shift</button></div></article>`).join(''):'<article class="shift-card"><div class="shift-card-body"><h3>Pas de shift ce jour.</h3><div class="shift-meta">Essayez une autre date.</div></div></article>'}
function renderTalents(){const g=$('#talentGrid');if(!g)return;const r=$('#talentRoleFilter')?.value||'all',c=$('#talentCityFilter')?.value||'all';const _tal=[...(window.HORENOVA_LIVE_TALENTS||[])];const list=_tal.filter(t=>(r==='all'||t.role===r)&&(c==='all'||t.city===c)).sort((a,b)=>b.rating-a.rating||b.reviews-a.reviews);g.innerHTML=list.length?list.map(t=>{const img=t.photo||(t.role==='Barista'?'https://headless-tfcfvgrbhgw-xwassim04-1409.wix-site-host.com/assets/barista.jpg':t.role?.includes('Chef')?'https://headless-tfcfvgrbhgw-xwassim04-1409.wix-site-host.com/assets/chef-action.jpg':'https://headless-tfcfvgrbhgw-xwassim04-1409.wix-site-host.com/assets/restaurant.jpg');const rating=Number(t.rating||0),reviews=Number(t.reviews||0);return `<article class="talent-card">${t.sponsored?'<span class="sponsored">SPONSORISÉ</span>':''}<div class="talent-portrait"><img src="${img}" alt="${t.name}"><div class="avatar">${t.name.split(' ').map(x=>x[0]).join('')}</div></div><div class="talent-card-body"><span class="small-title">${(t.role||'HOSPITALITÉ').toUpperCase()} · ${(t.city||'MAROC').toUpperCase()}</span><h3>${t.name}</h3><div class="stars">${reviews>0?`★★★★★ &nbsp; ${rating.toFixed(1)} <small style="color:#8a8c83">(${reviews} avis)</small>`:"Pas encore d’avis vérifiés"}</div><p>${t.bio||'Profil Horenova'}</p><a class="detail-link" href="/talent.html?id=${t.id}">Voir le profil →</a></div></article>`}).join(''):'<div class="empty-state"><h2>Aucun profil public disponible.</h2><p>Les profils publiés par de vrais candidats apparaîtront ici.</p></div>'}
const _horenovaRenderTalentsCore=renderTalents;
renderTalents=function(){
  _horenovaRenderTalentsCore();
  const grid=$('#talentGrid');
  if(!grid)return;
  if(window.HORENOVA_TALENTS_LOADING){
    const indicator=document.createElement('p');
    indicator.textContent='Chargement des talents du Maroc…';
    indicator.style.cssText='grid-column:1/-1;padding:15px;text-align:center';
    grid.appendChild(indicator);
    return;
  }
  if(window.HORENOVA_TALENTS_ERROR){
    const status=document.createElement('p');
    status.setAttribute('role','alert');
    status.textContent='Recherche momentanément indisponible. Réessayez.';
    grid.appendChild(status);
  }
  if(window.HORENOVA_TALENTS_HAS_NEXT){
    const button=document.createElement('button');
    button.type='button';
    button.className='soft-btn';
    button.style.cssText='grid-column:1/-1;justify-self:center;margin:24px auto;min-height:48px;padding:13px 24px';
    button.textContent='Voir plus de talents au Maroc ↗';
    button.onclick=()=>window.HORENOVA_LOAD_MORE_TALENTS?.();
    grid.appendChild(button);
  }
};
function setupTalents(){
  const role=$('#talentRoleFilter'),city=$('#talentCityFilter'),button=$('#talentSearchBtn');
  const search=()=>{
    if(typeof window.HORENOVA_SEARCH_TALENTS==='function')
      window.HORENOVA_SEARCH_TALENTS();
    else renderTalents();
  };
  if(role)role.onchange=search;
  if(city)city.onchange=search;
  if(button)button.onclick=search;
  renderTalents();
}
function renderProfile(){const d=$('#profileData');if(!d)return;d.innerHTML=`<div><small>JE RECHERCHE</small><b>${state.intent==='shift'?'Des shifts':state.intent==='hire'?'Des talents':'Un emploi'}</b></div><div><small>MÉTIER</small><b>${state.role}</b></div><div><small>VILLE</small><b>${state.city}</b></div><div><small>FAVORIS</small><b>${state.saved.length}</b></div>`}
function renderFavorites(){const g=$('#favoritesGrid'),e=$('#favoritesEmpty');if(!g)return;const list=jobs().filter(j=>state.saved.includes(j.id));g.innerHTML=list.map(cardJob).join('');if(e)e.hidden=list.length>0}
function setupRecruit(){const f=$('#recruitForm');if(!f)return;f.onsubmit=e=>{e.preventDefault();const id='u'+Date.now();const item={id,kind:$('#rKind').value,title:$('#rTitle').value.trim(),business:$('#rBusiness').value.trim(),role:$('#rRole').value,city:$('#rCity').value,pay:$('#rPay').value.trim()||'À convenir',period:$('#rKind').value==='shift'?'/ shift':'/ mois',time:$('#rTime').value.trim(),dateOffset:0,img:$('#rRole').value==='Barista'?'https://headless-tfcfvgrbhgw-xwassim04-1409.wix-site-host.com/assets/barista.jpg':'https://headless-tfcfvgrbhgw-xwassim04-1409.wix-site-host.com/assets/restaurant.jpg',details:'Offre créée localement depuis l’espace recruteur.'};state.customJobs=[item,...state.customJobs];persist();f.reset();renderRecruitList();toast('Brouillon enregistré')};renderRecruitList()}
function renderRecruitList(){const g=$('#myRecruitJobs');if(!g)return;g.innerHTML=state.customJobs.length?state.customJobs.map(cardJob).join(''):'<div class="empty-state"><h2>Aucun brouillon.</h2><p>Votre première offre apparaîtra ici après enregistrement.</p></div>'}
function setupBoost(){const s=$('#boostSummary');$$('.boost-plan').forEach(b=>b.onclick=()=>{$$('.boost-plan').forEach(x=>x.classList.toggle('active',x===b));if(s)s.textContent=`${b.dataset.plan} heures · ${b.dataset.price} DH`});const pay=$('#boostPayBtn');if(pay)pay.onclick=()=>toast('Paiement pas encore activé')}
function setupTrip(){const btn=$('#saveTripPage');if(!btn)return;state.trip.forEach(v=>{const x=$(`.trip-destinations input[value="${v}"]`);if(x)x.checked=true});const show=()=>{const d=$('#tripSaved');if(d)d.textContent=state.trip.length?'Votre carnet : '+state.trip.join(' · '):'Aucune destination enregistrée.'};show();btn.onclick=()=>{state.trip=$$('.trip-destinations input:checked').map(i=>i.value);persist();show();toast('Carnet enregistré')}}
function renderJobDetail(){const box=$('#jobDetail');if(!box)return;const id=new URLSearchParams(location.search).get('id'),j=jobs().find(x=>x.id===id);if(!j){box.innerHTML='<div class="empty-state"><h2>Offre introuvable ou retirée.</h2><p>Consultez les offres disponibles.</p><a href="/jobs.html">Retour aux offres</a></div>';return}const saved=state.saved.includes(j.id);box.innerHTML=`<a class="back-link" href="${j.kind==='shift'?'/shifts.html':'/jobs.html'}">← Retour</a><div class="detail-grid"><div class="detail-photo"><img src="${j.img}" alt="${j.title}"></div><div class="detail-copy"><span class="small-title">${j.kind==='shift'?'SHIFT':'EMPLOI'} · ${j.role}</span><h1>${j.title}</h1><p class="detail-business">${j.business} · ${j.city}</p>${j.businessType?`<p class="hn-workplace-kind">🏢 ${j.businessType}</p>`:""}<div class="detail-pay">${j.pay} <small>${j.period}</small></div>${j.time?`<p>◷ ${j.time}</p>`:''}<p>${j.details||j.desc||''}</p><div class="hn-workplace-facts">
${j.workplaceAddress?'<div><small>LIEU DE TRAVAIL</small><strong>⌖ '+j.workplaceAddress+'</strong></div>':''}
${j.contractType?'<div><small>CONTRAT</small><strong>'+j.contractType+'</strong></div>':''}
${j.openings?'<div><small>POSTES À POURVOIR</small><strong>'+j.openings+'</strong></div>':''}
${j.startDate?'<div><small>DÉBUT</small><strong>'+formatJobStartDate(j.startDate)+'</strong></div>':''}
${j.requirements?'<div class="wide"><small>COMPÉTENCES & EXIGENCES</small><p>'+j.requirements+'</p></div>':''}
</div>${j.hasWorkplacePhoto?'<p class="hn-workplace-authentic">✓ Photo communiquée par l’établissement et publiée après validation HORENOVA</p>':''}<div class="detail-actions"><a class="cta-main button-link" href="/apply.html?id=${encodeURIComponent(j.id)}&role=${encodeURIComponent(j.role)}&title=${encodeURIComponent(j.title)}&business=${encodeURIComponent(j.business)}&recruiter=${encodeURIComponent(j._owner||'')}">Postuler maintenant ↗</a><button type="button" class="soft-btn" data-share-job="${encodeURIComponent(j.id)}" data-share-mode="native">↗ Partager l’annonce</button><button type="button" class="soft-btn" data-share-job="${encodeURIComponent(j.id)}" data-share-mode="whatsapp">WhatsApp</button><button type="button" class="soft-btn" data-share-job="${encodeURIComponent(j.id)}" data-share-mode="copy">Copier le lien</button><button class="soft-btn" id="detailSave">${saved?'Retirer des favoris':'♡ Enregistrer'}</button><a class="soft-btn" href="/matches.html">Autres matchs</a></div></div></div>`;const _ds=$('#detailSave');if(_ds)_ds.onclick=()=>{state.saved=saved?state.saved.filter(x=>x!==j.id):[...state.saved,j.id];persist();renderJobDetail();toast(saved?'Retiré des favoris':'Ajouté aux favoris')}}
function renderTalentDetail(){const box=$('#talentDetail');if(!box)return;const id=new URLSearchParams(location.search).get('id'),_tal=[...(window.HORENOVA_LIVE_TALENTS||[])],t=_tal.find(x=>x.id===id);if(!t){box.innerHTML='<div class="empty-state"><h2>Profil indisponible.</h2><p>Aucun profil vérifié ne correspond à cette demande.</p><a href="/talents.html">Retour aux talents</a></div>';return}box.innerHTML=`<a class="back-link" href="/talents.html">← Retour aux talents</a><div class="talent-detail-card">${t.sponsored?'<span class="sponsored">SPONSORISÉ</span>':''}<div class="profile-avatar">${t.name.split(' ').map(x=>x[0]).join('')}</div><span class="small-title">${t.role.toUpperCase()} · ${t.city.toUpperCase()}</span><h1>${t.name}</h1><div class="stars big">${t.reviews>0?`★★★★★ &nbsp; ${t.rating.toFixed(1)} <small>(${t.reviews} avis)</small>`:"Pas encore d’avis vérifiés"}</div><p>${t.bio}</p><div class="talent-facts"><div><small>NOTE</small><b>${t.reviews>0?t.rating.toFixed(1)+"/5":"Non noté"}</b></div><div><small>AVIS</small><b>${t.reviews}</b></div><div><small>VILLE</small><b>${t.city}</b></div></div><a class="cta-main button-link" href="/recruit.html">Créer une offre pour ce profil ↗</a></div>`}
function init(){setupMenu();setupHeroVideo();setupQuiz();setupMatches();renderJobsPage();renderCalendar();renderShifts();setupTalents();renderProfile();renderFavorites();setupRecruit();setupBoost();setupTrip();renderJobDetail();renderTalentDetail()}
document.addEventListener('DOMContentLoaded',init);


window.renderJobsPage=renderJobsPage;window.renderShifts=renderShifts;window.renderMatch=renderMatch;window.renderTalents=renderTalents;window.renderTalentDetail=renderTalentDetail;window.renderJobDetail=renderJobDetail;window.renderFavorites=renderFavorites;
// Premium interactions — visual only, no paid/production features are implied.
function setupPremiumMotion(){
  const els=$$('[data-reveal]');
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}}),{threshold:.12});
    els.forEach(e=>io.observe(e));
  }else els.forEach(e=>e.classList.add('is-visible'));
  $$('[data-tilt]').forEach(card=>{
    card.addEventListener('pointermove',e=>{
      if(matchMedia('(max-width:900px)').matches)return;
      const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      card.style.transform=`translateY(-8px) rotateX(${(-y*3).toFixed(2)}deg) rotateY(${(x*4).toFixed(2)}deg)`;
    });
    card.addEventListener('pointerleave',()=>card.style.transform='');
  });
  $$('[data-interest]').forEach(el=>el.addEventListener('click',e=>{
    e.preventDefault();
    const key=el.dataset.interest||'mihna';
    const interests=JSON.parse(localStorage.getItem('mihna-interests')||'[]');
    if(!interests.includes(key)) interests.push(key);
    localStorage.setItem('mihna-interests',JSON.stringify(interests));
    toast(key==='academy'?'Intérêt enregistré pour Horenova Academy':key==='shop'?'Intérêt enregistré pour Horenova Shop':key==='business'?'Intérêt enregistré pour Horenova Business':'Intérêt enregistré');
  }));
}
document.addEventListener('DOMContentLoaded',setupPremiumMotion);
