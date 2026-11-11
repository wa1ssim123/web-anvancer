/* HORENOVA 3-route cinematic entry. No navigation or other content is shown over the video. */
(() => {
  const intro=document.getElementById('hn-fullscreen-entry');
  if(!intro)return;
  const button=intro.querySelector('.hn-entry__button');
  const video=intro.querySelector('.hn-entry__video');
  let finished=false;
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finish=()=>{
    if(finished)return;
    finished=true;
    intro.remove();
    document.documentElement.classList.remove('hn-entry-active');
    document.querySelectorAll('body [data-hn-entry-paused="true"]').forEach(el=>{
      el.removeAttribute('data-hn-entry-paused');
      if(!document.hidden && !reducedMotion)el.play().catch(()=>{});
    });
    window.scrollTo(0,0);
  };
  const init=()=>{
    window.scrollTo(0,0);
    document.querySelectorAll('body video').forEach(el=>{
      if(el===video)return;
      if(!el.paused)el.setAttribute('data-hn-entry-paused','true');
      el.pause();
    });
    // Use native 4K portrait on phones, cinematic 4K landscape on larger screens.
    if(video.dataset.mobileSrc && video.dataset.desktopSrc){
      const media=window.matchMedia('(max-width: 700px)').matches ? video.dataset.mobileSrc : video.dataset.desktopSrc;
      if(video.getAttribute('src')!==media){video.src=media;video.load();}
    }
    video.muted=true;
    video.defaultMuted=true;
    video.playsInline=true;
    if(reducedMotion){video.pause();return;}
    const p=video.play();
    if(p&&typeof p.catch==='function')p.catch(()=>{});
  };
  button.addEventListener('click',()=>{
    if(finished||intro.classList.contains('hn-entry--exit'))return;
    button.disabled=true;
    video.pause();
    intro.classList.add('hn-entry--exit');
    const delay=reducedMotion?260:980;
    window.setTimeout(finish,delay);
  },{once:true});
  intro.addEventListener('transitionend',e=>{
    if(e.target===intro && (e.propertyName==='clip-path'||e.propertyName==='opacity') && intro.classList.contains('hn-entry--exit'))finish();
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
