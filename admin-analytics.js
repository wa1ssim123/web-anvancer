import {hub} from '/hn-api.js';

/* HORENOVA — private analytics view. Mounted only after verified admin gate.
   Never fetches raw member profiles: the API returns aggregated counts only. */
const WORDS={
 fr:{eyebrow:'HORENOVA · STATISTIQUES PRIVÉES',title:'Audience & inscriptions.',desc:'Les comptes déjà inscrits sont inclus. Les deux compteurs de visites sont séparés car ils ne couvrent pas forcément les mêmes domaines.',reload:'Actualiser ↻',updated:'Dernière vérification',groups:'Comptes inscrits · depuis le début',candidates:'Candidats',recruiters:'Recruteurs',registered:'Total candidats + recruteurs',visitors:'Audience historique Wix',wixVisitors:'Visiteurs uniques',wixSessions:'Visites / sessions',wixSpan:'Période Wix',newVisits:'Suivi HORENOVA · depuis activation',newBrowsers:'Navigateurs uniques estimés',newSessions:'Sessions enregistrées',today:'Sessions aujourd’hui',week:'Sessions sur 7 jours',history:'Évolution des visites',wixTab:'Historique Wix',liveTab:'Suivi HORENOVA',visits:'sessions',empty:'Pas encore de visites enregistrées dans ce compteur.',info:'Attention : les visiteurs uniques représentent des navigateurs estimés, pas des personnes identifiées. Les sessions Wix historiques ne sont pas additionnées au nouveau compteur. Le suivi récent ne contient ni IP, ni nom, ni adresse e-mail.',error:'Statistiques momentanément indisponibles. Seuls les administrateurs peuvent ouvrir ces données.',start:'Début du suivi : à la publication du nouveau compteur',noBaseline:'Historique Wix non importé',loading:'Lecture sécurisée des statistiques…'},
 en:{eyebrow:'HORENOVA · PRIVATE ANALYTICS',title:'Audience & signups.',desc:'Existing registrations are included. The two visitor sources are shown separately because they may not cover the same domains.',reload:'Refresh ↻',updated:'Last checked',groups:'Registrations · all time',candidates:'Candidates',recruiters:'Recruiters',registered:'Candidate + recruiter total',visitors:'Historic Wix audience',wixVisitors:'Unique visitors',wixSessions:'Visits / sessions',wixSpan:'Wix period',newVisits:'HORENOVA tracking · since activation',newBrowsers:'Estimated unique browsers',newSessions:'Recorded sessions',today:'Sessions today',week:'Sessions in 7 days',history:'Visits over time',wixTab:'Wix history',liveTab:'HORENOVA tracking',visits:'sessions',empty:'No visits recorded in this counter yet.',info:'Note: unique visitors are estimated browsers, not verified people. Historic Wix sessions are not added to the new counter. The new tracking does not retain IP addresses, names, or emails.',error:'Statistics are temporarily unavailable. Only administrators can access this data.',start:'Tracking starts when the new counter is published',noBaseline:'No imported Wix history',loading:'Loading secure statistics…'},
 ar:{eyebrow:'هورينوفا · إحصائيات خاصة',title:'الزوار والتسجيلات.',desc:'تشمل الأرقام المسجلين سابقاً. يظهر مصدرا الزيارات بشكل منفصل لأنهما قد لا يغطيان المواقع نفسها.',reload:'تحديث ↻',updated:'آخر تحقق',groups:'الحسابات المسجلة · منذ البداية',candidates:'المرشحون',recruiters:'أصحاب العمل',registered:'مجموع المرشحين وأصحاب العمل',visitors:'سجل زوار Wix',wixVisitors:'زوار فريدون',wixSessions:'زيارات / جلسات',wixSpan:'فترة Wix',newVisits:'متابعة هورينوفا · منذ التفعيل',newBrowsers:'متصفحات فريدة تقديرية',newSessions:'جلسات مسجلة',today:'جلسات اليوم',week:'جلسات خلال 7 أيام',history:'تطور الزيارات',wixTab:'سجل Wix',liveTab:'متابعة هورينوفا',visits:'جلسة',empty:'لا توجد زيارات مسجلة في هذا العداد بعد.',info:'تنبيه: الزوار الفريدون هم تقدير لعدد المتصفحات، وليسوا أشخاصاً تم التحقق من هويتهم. لا نجمع أرقام Wix مع العداد الجديد. ولا نحفظ عناوين IP أو الأسماء أو البريد الإلكتروني في المتابعة الجديدة.',error:'الإحصائيات غير متاحة مؤقتاً. الوصول مخصص للمسؤولين فقط.',start:'يبدأ العدّاد عند نشر التحديث الجديد',noBaseline:'لا يوجد سجل Wix مستورد',loading:'جارٍ تحميل الإحصائيات الآمنة…'}
};
const one=(root,id)=>root.querySelector('#'+id);
const dateOnly=x=>String(x||'').slice(0,10);
const formatDate=(v,language)=>{const s=dateOnly(v);if(!/^\d{4}-\d\d-\d\d$/.test(s))return '—';return new Intl.DateTimeFormat(language==='ar'?'ar-MA':language==='en'?'en-GB':'fr-MA',{day:'numeric',month:'short',year:'numeric'}).format(new Date(s+'T12:00:00Z'))};
const formatNumber=(n,language)=>new Intl.NumberFormat(language==='ar'?'ar-MA':language==='en'?'en-GB':'fr-MA').format(Number(n||0));

export function mountAdminAnalytics(root,request=hub){
 if(!root||root.querySelector('#hnAdminAnalytics'))return;
 const section=document.createElement('section');
 section.className='hn-audience';
 section.id='hnAdminAnalytics';
 section.innerHTML=`<div class="hn-audience-head"><div><span id="haEyebrow"></span><h2 id="haTitle"></h2><p id="haDesc"></p></div><div class="hn-audience-actions"><button type="button" id="haReload"></button><small id="haUpdated"></small></div></div>
 <div class="hn-audience-group"><h3 id="haGroups"></h3><div class="hn-audience-grid three">
 <article class="hn-audience-kpi"><span id="haLCandidates"></span><strong id="haCandidates">—</strong></article>
 <article class="hn-audience-kpi"><span id="haLRecruiters"></span><strong id="haRecruiters">—</strong></article>
 <article class="hn-audience-kpi"><span id="haLRegistered"></span><strong id="haRegistered">—</strong></article>
 </div></div>
 <div class="hn-audience-group"><h3 id="haVisitors"></h3><div class="hn-audience-grid two">
 <article class="hn-audience-kpi"><span id="haLWixVisitors"></span><strong id="haWixVisitors">—</strong></article>
 <article class="hn-audience-kpi"><span id="haLWixSessions"></span><strong id="haWixSessions">—</strong></article>
 </div><p class="hn-audience-period" id="haWixSpan"></p></div>
 <div class="hn-audience-group"><h3 id="haNewVisits"></h3><div class="hn-audience-grid four">
 <article class="hn-audience-kpi"><span id="haLNewBrowsers"></span><strong id="haNewBrowsers">—</strong></article>
 <article class="hn-audience-kpi"><span id="haLNewSessions"></span><strong id="haNewSessions">—</strong></article>
 <article class="hn-audience-kpi"><span id="haLToday"></span><strong id="haToday">—</strong></article>
 <article class="hn-audience-kpi"><span id="haLWeek"></span><strong id="haWeek">—</strong></article>
 </div><p class="hn-audience-period" id="haStart"></p></div>
 <div class="hn-audience-group"><div class="hn-audience-graph-head"><h3 id="haHistory"></h3><div class="hn-audience-tabs"><button type="button" id="haWixTab" aria-pressed="true"></button><button type="button" id="haLiveTab" aria-pressed="false"></button></div></div><div class="hn-audience-chart" role="img" id="haChart" aria-label="Graphique de fréquentation"></div></div>
 <p class="hn-audience-info" id="haInfo"></p><p id="haError" role="status" class="hn-audience-error" hidden></p>`;
 root.prepend(section);
 let state=null,mode='wix',loading=false;
 const lang=()=>['fr','en','ar'].includes(document.documentElement.lang)?document.documentElement.lang:'fr';
 const say=(id,value)=>{const element=one(section,id);if(element)element.textContent=String(value)};
 const showGraph=()=>{
  const l=lang(),t=WORDS[l],zone=one(section,'haChart'),data=mode==='wix'?state?.wixHistory?.daily:state?.firstParty?.daily;
  one(section,'haWixTab').setAttribute('aria-pressed',String(mode==='wix'));
  one(section,'haLiveTab').setAttribute('aria-pressed',String(mode==='live'));
  zone.replaceChildren();
  if(!data?.length){zone.textContent=t.empty;zone.classList.add('is-empty');return}
  zone.classList.remove('is-empty');
  const max=Math.max(1,...data.map(x=>Number(x.sessions||0)));
  const graph=data.slice(-15);
  for(const item of graph){
   const day=document.createElement('div');day.className='hn-audience-day';
   const count=document.createElement('strong');count.textContent=formatNumber(item.sessions,l);count.title=String(item.sessions)+' '+t.visits;
   const column=document.createElement('div');column.className='hn-audience-column';
   column.style.height=Math.max(2,Math.round(Number(item.sessions||0)/max*120))+'px';
   column.title=formatDate(item.date,l)+' · '+String(item.sessions)+' '+t.visits;
   const label=document.createElement('small');label.textContent=dateOnly(item.date).slice(5);
   day.append(count,column,label);zone.append(day);
  }
 };
 const render=()=>{
  const l=lang(),t=WORDS[l];
  for(const [id,key] of Object.entries({haEyebrow:'eyebrow',haTitle:'title',haDesc:'desc',haReload:'reload',haGroups:'groups',haLCandidates:'candidates',haLRecruiters:'recruiters',haLRegistered:'registered',haVisitors:'visitors',haLWixVisitors:'wixVisitors',haLWixSessions:'wixSessions',haNewVisits:'newVisits',haLNewBrowsers:'newBrowsers',haLNewSessions:'newSessions',haLToday:'today',haLWeek:'week',haHistory:'history',haWixTab:'wixTab',haLiveTab:'liveTab',haInfo:'info'}))say(id,t[key]);
  if(state){
   say('haCandidates',formatNumber(state.registrations?.candidates,l));
   say('haRecruiters',formatNumber(state.registrations?.recruiters,l));
   say('haRegistered',formatNumber(state.registrations?.total,l));
   say('haWixVisitors',state.wixHistory?formatNumber(state.wixHistory.uniqueVisitors,l):'—');
   say('haWixSessions',state.wixHistory?formatNumber(state.wixHistory.sessions,l):'—');
   say('haWixSpan',state.wixHistory?t.wixSpan+' : '+formatDate(state.wixHistory.from,l)+' — '+formatDate(state.wixHistory.through,l):t.noBaseline);
   say('haNewBrowsers',formatNumber(state.firstParty?.uniqueBrowsers,l));
   say('haNewSessions',formatNumber(state.firstParty?.sessions,l));
   say('haToday',formatNumber(state.firstParty?.todaySessions,l));
   say('haWeek',formatNumber(state.firstParty?.last7Days,l));
   say('haStart',state.firstParty?.firstRecorded?t.start+' · '+formatDate(state.firstParty.firstRecorded,l):t.start);
   say('haUpdated',t.updated+' : '+new Intl.DateTimeFormat(l==='ar'?'ar-MA':l==='en'?'en-GB':'fr-MA',{hour:'2-digit',minute:'2-digit'}).format(new Date()));
  }else say('haUpdated',t.loading);
  showGraph();
 };
 const refresh=async()=>{
  if(loading)return;loading=true;
  const btn=one(section,'haReload'),error=one(section,'haError');
  btn.disabled=true;error.hidden=true;
  try{state=await request('/api/analytics/admin');render();}
  catch(e){error.textContent=WORDS[lang()].error;error.hidden=false;console.warn('HORENOVA analytics unavailable',e?.message||'unknown');}
  finally{loading=false;btn.disabled=false;}
 };
 one(section,'haReload').addEventListener('click',()=>void refresh());
 for(const [id,which] of [['haWixTab','wix'],['haLiveTab','live']])
  one(section,id).addEventListener('click',()=>{mode=which;showGraph()});
 const observer=new MutationObserver(()=>render());
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang','dir']});
 render();
 void refresh();
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh()});
}
