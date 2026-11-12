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

 // Safari's automatic text sizing or "Request Desktop Website" can leave the
 // intro wordmark wider than the visible viewport. Fit the actual glyph bounds.
 const introHeading=intro.querySelector('.hn-intro-inner h1');
 function fitIntroHeading(){
  if(!introHeading)return;
  const visualWidth=window.visualViewport?.width||window.innerWidth;
  const available=Math.max(180,Math.min(visualWidth,intro.clientWidth||visualWidth)-32);
  let size=Math.min(76,Math.max(30,available*.152));
  const range=document.createRange();
  range.selectNodeContents(introHeading);
  for(let i=0;i<25;i++){
   introHeading.style.setProperty('font-size',size+'px','important');
   if(range.getBoundingClientRect().width <= available)break;
   size-=2;
   if(size<=26)break;
  }
 }
 fitIntroHeading();
 window.addEventListener('resize',fitIntroHeading,{passive:true});
 window.visualViewport?.addEventListener('resize',fitIntroHeading,{passive:true});

 // iOS Low Power Mode can draw an unavoidable native play triangle over an
 // unplayed video, even with controls=false. On iPhone/iPad use the genuine
 // moving-frame WebP (from both source videos) instead of video DOM elements.
 const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||
   (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 if(ios){
  // iOS Low Power Mode can reject autoplay. Never expose its native play icon:
  // keep the high-quality opaque 24fps WebP visible until a silent MP4 is
  // actually playing, then atomically promote the H.264 hardware-decoded movie.
  clips.forEach(video=>{video.pause();video.remove();});
  film.classList.add('hn-ios-loop-active');
  const native=document.createElement('video');
  native.className='hn-ios-native-hq';
  native.muted=true;native.defaultMuted=true;native.autoplay=true;
  native.loop=true;native.playsInline=true;native.controls=false;
  native.disablePictureInPicture=true;native.disableRemotePlayback=true;
  native.preload='metadata';
  native.setAttribute('muted','');
  native.setAttribute('playsinline','');
  native.setAttribute('webkit-playsinline','');
  native.setAttribute('aria-hidden','true');
  native.removeAttribute('controls');
  native.src='/assets/horenova-cinema-mobile-hq.mp4';
  let removed=false;
  const hideNative=()=>{
   native.classList.remove('is-playing-hq');
   film.classList.remove('hn-ios-native-playing');
  };
  const removeNative=()=>{
   if(removed)return;
   removed=true;hideNative();
   native.pause();native.removeAttribute('src');native.remove();
  };
  const revealNative=()=>{
   if(removed||native.paused||native.readyState<2)return;
   native.classList.add('is-playing-hq');
   film.classList.add('hn-ios-native-playing');
  };
  native.addEventListener('playing',revealNative);
  native.addEventListener('canplay',revealNative);
  native.addEventListener('pause',hideNative);
  native.addEventListener('error',removeNative);
  film.appendChild(native);
  try{
   const result=native.play();
   Promise.resolve(result).then(revealNative).catch(removeNative);
  }catch(e){removeNative();}
  intro.querySelector('button')?.addEventListener('click',()=>{
   setTimeout(removeNative,800);
  },{once:true});
  document.addEventListener('visibilitychange',()=>{
   if(document.hidden)hideNative();
   else if(!removed){
    Promise.resolve(native.play()).then(revealNative).catch(removeNative);
   }
  });
  return;
 }

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
