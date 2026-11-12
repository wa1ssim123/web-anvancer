/* Seamless silent cinematic intro. Videos are visual backgrounds, not players.
 * Do not cut to a second source until it has actually begun playing.
 * Browsers may refuse autoplay in low power/data saver modes: animated poster fallback.
 */
(()=>{
 'use strict';
 const intro=document.querySelector('.hn-intro');
 const film=intro?.querySelector('.hn-intro-film');
 const clips=[...(film?.querySelectorAll('.hn-film-clip')||[])];
 if(!intro||!film||clips.length!==2)return;

 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
 const desktop=window.matchMedia('(min-width: 1180px)').matches;
 const quality=desktop&&!connection?.saveData&&(!connection?.effectiveType||/4g/i.test(connection.effectiveType))?'4k':'1080';
 let active=0,closed=false,switching=false,cycle=null,crossfade=null,retry=null;

 function clearTimers(){
  clearTimeout(cycle);clearTimeout(crossfade);clearTimeout(retry);
  cycle=crossfade=retry=null;
 }
 function prepare(video){
  video.muted=true;video.defaultMuted=true;
  video.autoplay=false;video.removeAttribute('autoplay');video.loop=true;video.playsInline=true;video.controls=false;
  video.disablePictureInPicture=true;video.disableRemotePlayback=true;
  video.setAttribute('muted','');video.setAttribute('playsinline','');
  video.setAttribute('webkit-playsinline','');
  video.setAttribute('disablepictureinpicture','');
  video.setAttribute('disableremoteplayback','');
  video.removeAttribute('controls');
  video.preload='auto';
  if(!video.dataset.loaded){
   video.src=video.dataset[quality]||video.dataset['1080'];
   video.dataset.loaded='yes';
   video.load();
  }
 }
 async function start(video){
  if(closed||document.hidden||reduced)return false;
  prepare(video);
  try{
   await video.play();
   if(closed || video.paused || video.readyState<2) return false;
   video.classList.add('is-playing');
   film.classList.add('is-media-playing');
   return true;
  }catch{
   video.classList.remove('is-playing');
   return false;
  }
 }
 function schedule(delay=7600){
  clearTimeout(cycle);
  if(closed||document.hidden||reduced)return;
  cycle=setTimeout(switchClip,delay);
 }
 async function ensureCurrent(){
  if(closed||document.hidden||reduced||switching)return;
  if(clips[active].paused){
   const ok=await start(clips[active]);
   if(!ok){film.classList.remove('is-media-playing');clearTimeout(retry);retry=setTimeout(ensureCurrent,3500);return;}
  }
  schedule();
 }
 async function switchClip(){
  if(closed||document.hidden||reduced||switching)return;
  switching=true;
  const old=clips[active],nextIndex=1-active,next=clips[nextIndex];
  const ok=await start(next);
  if(closed||document.hidden){switching=false;return;}
  if(!ok){
   // Preserve the running first clip, never crossfade to a paused video.
   switching=false;schedule(3400);return;
  }
  next.classList.add('is-active');
  old.classList.remove('is-active');
  active=nextIndex;
  crossfade=setTimeout(()=>{
   if(closed)return;
   old.pause();
   old.classList.remove('is-playing');
  },1540);
  switching=false;
  schedule(7600);
 }
 function stop(){
  closed=true;clearTimers();
  clips.forEach(video=>{video.pause();video.removeAttribute('src');video.load();video.classList.remove('is-playing');});
 }
 for(const video of clips){
  video.addEventListener('playing',()=>video.classList.add('is-playing'));
  video.addEventListener('pause',()=>{
   if(closed||document.hidden||video!==clips[active]||switching)return;
   video.classList.remove('is-playing');
   clearTimeout(retry);retry=setTimeout(ensureCurrent,500);
  });
  video.addEventListener('error',()=>{
   video.classList.remove('is-playing');
   if(video===clips[active])film.classList.remove('is-media-playing');
  });
 }
 if(!reduced){
  // Start just one stream; preload the second only when needed on mobile.
  void ensureCurrent();
 }
 intro.querySelector('button')?.addEventListener('click',()=>{setTimeout(stop,1100)},{once:true});
 document.addEventListener('visibilitychange',()=>{
  if(closed||reduced)return;
  if(document.hidden){
   clearTimers();
   for(const video of clips) video.pause();
  }else{
   void ensureCurrent();
  }
 });
 window.addEventListener('pageshow',()=>{if(!closed)void ensureCurrent()});
 // Autoplay may be rejected on iOS Low Power Mode. Retry only following a genuine gesture.
 const retryAfterGesture=()=>{if(!closed&&!document.hidden&&!reduced)void ensureCurrent()};
 document.addEventListener('pointerdown',retryAfterGesture,{passive:true});
 document.addEventListener('keydown',retryAfterGesture);
})();
