/* Continuous decorative video playback when visible.
 * Mobile Safari can refuse autoplay in Low Power Mode. In that case
 * animated CSS background stays visible, without displaying player controls.
 */
(()=>{
 'use strict';
 const videos=[...document.querySelectorAll('.hn-cinema-strip video, .hn-academy-film video')];
 if(!videos.length)return;
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const states=new WeakMap();
 function attempt(video){
  const state=states.get(video);
  if(!state||state.pending||!state.visible||document.hidden||reduce)return;
  state.pending=true;
  try{
   const request=video.play();
   Promise.resolve(request).then(()=>{
    video.classList.add('hn-background-playing');
    state.pending=false;state.failures=0;
   }).catch(()=>{
    video.classList.remove('hn-background-playing');
    state.pending=false;state.failures++;
   });
  }catch{
   video.classList.remove('hn-background-playing');
   state.pending=false;state.failures++;
  }
 }
 for(const video of videos){
  video.muted=true;video.defaultMuted=true;video.loop=true;video.autoplay=true;
  video.playsInline=true;video.controls=false;video.disablePictureInPicture=true;
  video.disableRemotePlayback=true;
  video.setAttribute('muted','');video.setAttribute('playsinline','');
  video.setAttribute('webkit-playsinline','');video.removeAttribute('controls');
  video.setAttribute('disableremoteplayback','');
  video.preload='metadata';
  const state={visible:false,pending:false,failures:0,retry:null};
  states.set(video,state);
  video.addEventListener('playing',()=>video.classList.add('hn-background-playing'));
  video.addEventListener('pause',()=>{
   video.classList.remove('hn-background-playing');
   if(!state.visible||document.hidden||reduce)return;
   clearTimeout(state.retry);
   state.retry=setTimeout(()=>attempt(video),1800);
  });
  video.addEventListener('error',()=>video.classList.remove('hn-background-playing'));
 }
 if('IntersectionObserver'in window){
  const observer=new IntersectionObserver(entries=>{
   for(const e of entries){
    const v=e.target,s=states.get(v);
    s.visible=e.isIntersecting;
    if(s.visible)attempt(v);
    else{clearTimeout(s.retry);v.pause();v.classList.remove('hn-background-playing');}
   }
  },{rootMargin:'150px 0px',threshold:0.05});
  videos.forEach(v=>observer.observe(v));
 }else{
  videos.forEach(v=>{states.get(v).visible=true;attempt(v)});
 }
 document.addEventListener('visibilitychange',()=>{
  for(const video of videos){
   const s=states.get(video);
   if(document.hidden){clearTimeout(s.retry);video.pause();}
   else if(s.visible)attempt(video);
  }
 });
 window.addEventListener('pageshow',()=>videos.forEach(v=>attempt(v)));
 // Autoplay restrictions may be lifted by the first deliberate user gesture.
 const retry=()=>videos.forEach(v=>{if(states.get(v).visible)attempt(v)});
 document.addEventListener('pointerdown',retry,{passive:true});
 document.addEventListener('keydown',retry);
})();
