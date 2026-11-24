/* Shared HORENOVA social branding: applies original WhatsApp and Telegram logos
 * to pages and async UI. Does not modify labels, links or account state.
 */
(function(){
 if(document.querySelector('script[data-hn-official-social-logos]'))return;
 const script=document.createElement('script');
 script.src='/social-brand-icons.js?v=20261123-logo1';
 script.defer=true;script.dataset.hnOfficialSocialLogos='true';
 document.head.append(script);
})();

/* HORENOVA: Disable old offline service workers that showed a false full-page outage.
 * Keep browser cache, signed-in accounts and Wix member tokens untouched.
 */
(function () {
  if (!('serviceWorker' in navigator)) return;
  async function removeBrokenOfflineWorker() {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations
        .filter(reg => {
          try { return new URL(reg.scope).origin === location.origin; }
          catch { return false; }
        })
        .map(reg => reg.unregister()));
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter(key => key.startsWith('horenova-')).map(key => caches.delete(key)));
      }
    } catch (error) {
      console.warn('HORENOVA: impossible de nettoyer le cache hors ligne pour le moment.', error);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeBrokenOfflineWorker, {once:true});
  } else {
    void removeBrokenOfflineWorker();
  }
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type !== 'HORENOVA_OFFLINE_CACHE_REMOVED') return;
    // Do not force a reload while the user is filling a form.
    console.info('HORENOVA: ancien cache hors ligne supprimé.');
  });
})();

/* HORENOVA · Support FAB v3 + safe release checks.
 * One trigger replaces the intrusive two-pill launcher.
 * A user's draft is never reloaded automatically.
 */
(function(){
  'use strict';
  const BUILD='2026.11.24.candidate-board-r4';
  const ACK_KEY='hn-release-ack-v2';
  function acknowledged(version){
    try{if(new URL(location.href).searchParams.get('hn_version')===version)return true;}catch{}
    try{return localStorage.getItem(ACK_KEY)===version;}catch{return false;}
  }
  function acknowledge(version){try{localStorage.setItem(ACK_KEY,version);}catch{}}
  function needsUpdate(version){return typeof version==='string'&&version!==BUILD&&!acknowledged(version);}
  let pendingVersion=null;
  const CHECK_EVERY_MS=90000;
  const SUPPORT_CSS='/support.css?v=spv7-20261120';
  const tr={
    fr:{button:'Assistance',heading:'Besoin d’aide ?',description:'Notre équipe HORENOVA vous accompagne.',chat:'Écrire au support',chatDetail:'Conversation privée',phone:'Appeler HORENOVA',phoneDetail:'06 48 37 70 09',update:'Nouvelle version HORENOVA disponible.',draft:'Enregistrez vos modifications avant de mettre à jour.',reload:'Mettre à jour'},
    en:{button:'Support',heading:'Need help?',description:'HORENOVA is here to assist you.',chat:'Chat with support',chatDetail:'Private conversation',phone:'Call HORENOVA',phoneDetail:'06 48 37 70 09',update:'A newer HORENOVA version is available.',draft:'Save your current changes before refreshing.',reload:'Update'},
    ar:{button:'المساعدة',heading:'هل تحتاج إلى مساعدة؟',description:'فريق هورينوفا هنا لمساعدتك.',chat:'محادثة الدعم',chatDetail:'محادثة خاصة',phone:'اتصل بهورينوفا',phoneDetail:'06 48 37 70 09',update:'يتوفر إصدار جديد من هورينوفا.',draft:'احفظ تعديلاتك قبل التحديث.',reload:'تحديث'}
  };
  let lang='fr';try{lang=localStorage.getItem('mihna-lang')||document.documentElement.lang||'fr';}catch{}
  const words=tr[lang]||tr.fr;
  let checking=false,launcher=null,updateBanner=null;
  const svg=(name)=>{
    const paths={
      chat:'<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8A8.5 8.5 0 0 1 12.5 20a8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 4 11.5a8.5 8.5 0 0 1 8.5-8.5 8.5 8.5 0 0 1 8.5 8.5Z"/><path d="M8.5 11.5h.01M12.5 11.5h.01M16.5 11.5h.01"/>',
      phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.7 19.7 0 0 1 3.1 5.2 2 2 0 0 1 5.1 3h3a2 2 0 0 1 2 1.7c.12.95.35 1.89.68 2.78a2 2 0 0 1-.45 2.1L9 10.9a16 16 0 0 0 4.1 4.1l1.33-1.33a2 2 0 0 1 2.1-.45c.89.33 1.83.56 2.78.68A2 2 0 0 1 22 16.9Z"/>',
      close:'<path d="M18 6 6 18M6 6l12 12"/>',
      arrow:'<path d="M7 17 17 7M8 7h9v9"/>'
    };
    return '<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths[name]+'</svg>';
  };
  function ensureCSS(){
    if(document.querySelector('link[data-horenova-support-css]'))return;
    const css=document.createElement('link');
    css.rel='stylesheet';css.href=SUPPORT_CSS;
    css.dataset.horenovaSupportCss='true';document.head.append(css);
  }
  function makeAction(kind,href,title,detail){
    const link=document.createElement('a');
    link.className='hs-fab-action hs-fab-'+kind;link.href=href;
    const ic=document.createElement('span');ic.className='hs-fab-action-icon';ic.innerHTML=svg(kind);
    const copy=document.createElement('span');copy.className='hs-fab-action-copy';
    const strong=document.createElement('strong');strong.textContent=title;
    const small=document.createElement('small');small.textContent=detail;
    copy.append(strong,small);link.append(ic,copy);
    if(kind==='chat'){const arrow=document.createElement('span');arrow.className='hs-fab-arrow';arrow.innerHTML=svg('arrow');link.append(arrow);}
    return link;
  }
  function placeLauncher(){
    if(!launcher||document.hidden)return;
    const dock=document.querySelector('.hn12-dock');
    const activeDock=dock&&getComputedStyle(dock).display!=='none';
    const top=activeDock?dock.getBoundingClientRect().top:innerHeight;
    const navHeight=activeDock?Math.max(0,innerHeight-top):0;
    const bottom=Math.max(20,Math.min(innerHeight-78,Math.ceil(navHeight+14)));
    launcher.style.setProperty('--hs-fab-bottom',bottom+'px');
  }
  function addLauncher(){
    if(location.pathname==='/support.html'||document.querySelector('.hs-launcher'))return;
    ensureCSS();
    const root=document.createElement('div');
    root.className='hs-launcher hs-fab-v3';
    root.setAttribute('aria-label','HORENOVA · '+words.button);
    // Direct to the private support page, no popover or intermediate screen.
    const link=document.createElement('a');
    link.className='hs-fab-trigger hs-fab-direct';
    link.href='/support.html';
    link.setAttribute('aria-label',words.chat);
    const mark=document.createElement('span');mark.className='hs-fab-icon';mark.innerHTML=svg('chat');
    const caption=document.createElement('span');caption.className='hs-fab-caption';caption.textContent=words.button;
    link.append(mark,caption);
    root.append(link);document.body.append(root);
    launcher=root;placeLauncher();
    window.addEventListener('resize',placeLauncher,{passive:true});
    window.addEventListener('orientationchange',placeLauncher,{passive:true});
    document.addEventListener('hn-dock-updated',placeLauncher);
    if('ResizeObserver' in window){
      const dock=document.querySelector('.hn12-dock');
      if(dock)new ResizeObserver(placeLauncher).observe(dock);
    }
    // Dock contents can arrive after the user session is resolved.
    requestAnimationFrame(placeLauncher);
  }
  function showUpdate(version){
    pendingVersion=version;
    if(updateBanner)return;
    ensureCSS();
    const box=document.createElement('aside');box.className='hs-update-banner';
    box.setAttribute('role','status');
    const content=document.createElement('div');
    const title=document.createElement('strong');title.textContent=words.update;
    const text=document.createElement('span');text.textContent=words.draft;
    content.append(title,document.createElement('br'),text);
    const button=document.createElement('button');button.type='button';
    button.textContent=words.reload;
    button.addEventListener('click',()=>{
      const url=new URL(location.href);
      if(!pendingVersion)return;
      acknowledge(pendingVersion);
      url.searchParams.set('hn_version',pendingVersion);
      button.disabled=true;
      updateBanner?.remove();updateBanner=null;
      location.replace(url.href);
    });
    box.append(content,button);document.body.append(box);updateBanner=box;
  }
  async function check(){
    if(checking||document.hidden||!navigator.onLine)return;
    checking=true;
    try{
      const response=await fetch('/version.json?check='+Date.now(),{cache:'no-store',credentials:'same-origin'});
      if(!response.ok)return;
      const manifest=await response.json();
      if(manifest&&needsUpdate(manifest.version))showUpdate(manifest.version);
      else if(updateBanner){updateBanner.remove();updateBanner=null;pendingVersion=null;}
    }catch{}finally{checking=false;}
  }
  function start(){
    addLauncher();void check();
    setInterval(()=>{void check();},CHECK_EVERY_MS);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){placeLauncher();void check();}});
    window.addEventListener('online',()=>{void check();});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();

/* HORENOVA — First-party, privacy-minimal site session counter.
 * Browser UUID and session UUID remain in first-party localStorage; the API stores
 * only SHA-256 hashes and no IP, user agent, visited URLs, account or email.
 * A visit is one 30-minute session, not one page refresh or a real-world person.
 */
(function(){
 'use strict';
 if(!['horenova.com','www.horenova.com','horenova-site-officiel.onrender.com'].includes(location.hostname.toLowerCase()))return;
 try{
  if(navigator.globalPrivacyControl===true || navigator.doNotTrack==='1' || localStorage.getItem('horenova-analytics-optout')==='1')return;
  const makeId=()=>crypto.randomUUID();
  let browserId=localStorage.getItem('horenova-analytics-browser-v1');
  if(!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(browserId||'')){browserId=makeId();localStorage.setItem('horenova-analytics-browser-v1',browserId)}
  const old=JSON.parse(localStorage.getItem('horenova-analytics-session-v1')||'null');
  const now=Date.now();
  const reusable=old&&typeof old.id==='string'&&/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(old.id)&&Number(old.lastSeen)>0&&now-Number(old.lastSeen)<30*60*1000&&now>=Number(old.lastSeen);
  const sessionId=reusable?old.id:makeId();
  localStorage.setItem('horenova-analytics-session-v1',JSON.stringify({id:sessionId,lastSeen:now}));
  fetch('https://horenova-hub-api.onrender.com/api/analytics/visit',{
   method:'POST',mode:'cors',keepalive:true,cache:'no-store',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({browserId,sessionId})
  }).catch(()=>{/* Analytics must never block navigation, sign-in or checkout. */});
 }catch{/* Storage is optional. Browsing is always possible without tracking. */}
})();
