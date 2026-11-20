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

/* HORENOVA 2026-11-20: release freshness guard + universal customer support entry point.
 * Never erase local form data or log users out when an update is available.
 */
(function(){
  'use strict';
  const BUILD='2026.11.20.mobile-r1';
  const RECHECK_MS=90000;
  let running=false;
  function addLauncher(){
    if(document.querySelector('.hs-launcher')||location.pathname==='/support.html')return;
    const menu=document.createElement('nav');
    menu.className='hs-launcher';
    menu.setAttribute('aria-label','Assistance HORENOVA');
    const support=document.createElement('a');
    support.href='/support.html';support.textContent='✉ Assistance';support.setAttribute('aria-label','Chat avec le support HORENOVA');
    const call=document.createElement('a');
    call.href='tel:+212648377009';call.textContent='☎ Appeler';call.setAttribute('aria-label','Appeler le support au 06 48 37 70 09');
    menu.append(support,call);
    document.body.append(menu);
    if(!document.querySelector('link[data-horenova-support-css]')){
      const style=document.createElement('link');style.rel='stylesheet';
      style.href='/support.css?v=hn-support-20261120-r2';
      style.dataset.horenovaSupportCss='yes';document.head.append(style);
    }
  }
  function showUpdate(){
    if(document.querySelector('.hs-update-banner'))return;
    const box=document.createElement('aside');box.className='hs-update-banner';
    box.setAttribute('role','status');
    const content=document.createElement('div');
    const heading=document.createElement('strong');heading.textContent='Une nouvelle version HORENOVA est disponible.';
    const sub=document.createElement('span');sub.textContent='Enregistrez les formulaires ouverts avant d’actualiser.';
    content.append(heading,document.createElement('br'),sub);
    const button=document.createElement('button');button.type='button';button.textContent='Mettre à jour ↻';
    button.onclick=()=>{
      const url=new URL(location.href);url.searchParams.set('hn_version',Date.now().toString());
      location.replace(url.href);
    };
    box.append(content,button);document.body.append(box);
    if(!document.querySelector('link[data-horenova-support-css]')){
      const css=document.createElement('link');css.rel='stylesheet';css.href='/support.css?v=hn-support-20261120-r2';
      css.dataset.horenovaSupportCss='yes';document.head.append(css);
    }
  }
  async function check(){
    if(running||document.hidden||!navigator.onLine)return;
    running=true;
    try{
      const response=await fetch('/version.json?check='+Date.now(),{cache:'no-store',credentials:'same-origin'});
      if(!response.ok)return;
      const info=await response.json();
      if(info && typeof info.version==='string' && info.version!==BUILD)showUpdate();
    }catch{}finally{running=false;}
  }
  function start(){
    addLauncher();
    void check();
    setInterval(()=>{void check();},RECHECK_MS);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)void check();});
    window.addEventListener('online',()=>{void check();});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
