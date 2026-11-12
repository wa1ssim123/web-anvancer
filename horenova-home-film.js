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
  // Keep the original desktop cinematic code below untouched. Safari can
  // prohibit muted autoplay (notably in Low Power Mode), so never run the
  // costly full-frame animated WebP fallback on mobile devices.
  clips.forEach(video=>{video.pause();video.remove();});
  film.classList.add('hn-ios-loop-active');
  const cover=film.querySelector('.hn-ios-motion');
  if(cover){
   cover.src='/assets/horenova-mobile-tourism-poster.jpg';
   cover.removeAttribute('srcset');
   cover.hidden=false;
  }
  const movie=document.createElement('video');
  movie.className='hn-ios-native-hq hn-ios-native-premium';
  movie.setAttribute('muted','');
  movie.setAttribute('playsinline','');
  movie.setAttribute('webkit-playsinline','');
  movie.setAttribute('aria-hidden','true');
  movie.setAttribute('disableremoteplayback','');
  movie.muted=true;
  movie.defaultMuted=true;
  movie.autoplay=true;
  movie.loop=true;
  movie.playsInline=true;
  movie.controls=false;
  movie.disablePictureInPicture=true;
  movie.disableRemotePlayback=true;
  movie.preload='auto';
  movie.poster='/assets/horenova-mobile-tourism-poster.jpg';
  movie.src='/assets/horenova-mobile-cinema-1080p30.mp4';
  movie.removeAttribute('controls');
  film.append(movie);
  let closed=false,requesting=false,started=false,gate=null;
  const ensureGate=()=>{
   if(closed||started||gate)return;
   gate=document.createElement('button');
   gate.type='button';
   gate.className='hn-ios-enable-hd';
   gate.textContent='Activer la vidéo HD';
   gate.setAttribute('aria-label','Activer la vidéo HD à vitesse normale');
   gate.addEventListener('click',event=>{
    event.stopPropagation();
    // Direct user gesture is essential for Safari's media permission.
    requestPlay();
   });
   intro.querySelector('.hn-intro-inner')?.append(gate);
  };
  const hideGate=()=>{gate?.remove();gate=null;};
  const reveal=()=>{
   if(closed||movie.paused||movie.readyState<2)return;
   started=true;
   film.classList.add('hn-ios-native-playing');
   movie.classList.add('is-playing-hq');
   hideGate();
  };
  const requestPlay=()=>{
   if(closed)return;
   // Do not await fetch, load or any timer before invoking play().
   try{
    const promise=movie.play();
    requesting=true;
    Promise.resolve(promise).then(()=>{
     requesting=false;
     if(movie.paused){ensureGate();return;}
     reveal();
    }).catch(()=>{
     requesting=false;
     film.classList.remove('hn-ios-native-playing');
     movie.classList.remove('is-playing-hq');
     ensureGate();
    });
   }catch(error){requesting=false;ensureGate();}
  };
  movie.addEventListener('playing',reveal);
  movie.addEventListener('canplay',()=>{if(!movie.paused)reveal();});
  movie.addEventListener('pause',()=>{
   if(closed)return;
   started=false;
   film.classList.remove('hn-ios-native-playing');
   movie.classList.remove('is-playing-hq');
  });
  movie.addEventListener('error',()=>{
   if(closed)return;
   film.classList.remove('hn-ios-native-playing');
   movie.classList.remove('is-playing-hq');
   ensureGate();
  });
  // A tap anywhere on the cinematic screen may also unlock playback.
  intro.addEventListener('touchend',event=>{
   if(!started&&!closed&&!event.target.closest('button'))requestPlay();
  },{passive:true});
  intro.addEventListener('pointerdown',event=>{
   if(!started&&!closed&&!event.target.closest('button'))requestPlay();
  },{passive:true});
  // One automatic attempt; if blocked, show an explicit user-gesture control.
  requestPlay();
  intro.querySelector('.hn-intro-inner>button')?.addEventListener('click',()=>{
   closed=true;
   hideGate();
   setTimeout(()=>{
    movie.pause();
    movie.removeAttribute('src');
    movie.remove();
   },1000);
  },{once:true});
  document.addEventListener('visibilitychange',()=>{
   if(closed)return;
   if(document.hidden){
    movie.pause();
   }else if(!requesting){
    requestPlay();
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
