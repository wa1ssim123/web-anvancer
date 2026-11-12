/* HORENOVA decorative videos, all public sections.
 * Start silent loops through JS, not HTML autoplay (Safari Low Power Mode
 * otherwise overlays an unwanted play icon). Fallback remains animated.
 * Explicit educational/candidate videos and tourist pause controls are excluded.
 */
(()=>{
 'use strict';
 const selector='video[muted][loop]:not(.hn-film-clip):not(.hn-entry__video):not(.hn-cinema__video):not(#welcomeVideo):not([controls])';
 const videos=[...document.querySelectorAll(selector)];
 if(!videos.length)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const states=new WeakMap();
 const style=document.createElement('style');
 style.id='hn-ambient-media-style';
 style.textContent=`
 .hn-ambient-shell{position:relative}
 .hn-ambient-cover{position:absolute;inset:0;z-index:0;pointer-events:none;background-size:cover;background-position:center;background-repeat:no-repeat;animation:hn-ambient-cover-pan 19s ease-in-out infinite alternate}
 .hn-ambient-managed:not(.hn-background-playing){opacity:0!important}
 .hn-ambient-managed{transition:opacity .5s ease}
 .hn-ambient-shell.hn-ambient-shows-video>.hn-ambient-cover{animation-play-state:paused}
 @keyframes hn-ambient-cover-pan{from{transform:scale(1.02) translate3d(-1%,0,0)}to{transform:scale(1.08) translate3d(1%,1%,0)}}
 @media(prefers-reduced-motion:reduce){.hn-ambient-cover{animation:none}.hn-ambient-managed{transition:none}}
 `;
 document.head.append(style);
 const introActive=()=>document.documentElement.classList.contains('hn-entry-active');
 function mark(video,on){
  video.classList.toggle('hn-background-playing',on);
  video.parentElement?.classList.toggle('hn-ambient-shows-video',on);
 }
 function attempt(video){
  const s=states.get(video);
  if(!s||s.pending||!s.visible||document.hidden||reduced||introActive())return;
  if(!video.paused){mark(video,true);return;}
  s.pending=true;
  try{
   const p=video.play();
   Promise.resolve(p).then(()=>{mark(video,!video.paused);s.pending=false}).catch(()=>{
    mark(video,false);s.pending=false;
   });
  }catch{mark(video,false);s.pending=false}
 }
 for(const video of videos){
  video.muted=true;video.defaultMuted=true;video.loop=true;
  video.autoplay=false;video.removeAttribute('autoplay');
  video.playsInline=true;video.controls=false;video.disablePictureInPicture=true;
  video.disableRemotePlayback=true;
  video.setAttribute('muted','');video.setAttribute('playsinline','');
  video.setAttribute('webkit-playsinline','');
  video.setAttribute('disablepictureinpicture','');
  video.removeAttribute('controls');
  video.classList.add('hn-ambient-managed');
  const parent=video.parentElement;
  if(parent&&!video.closest('.hn-cinema-strip,.hn-academy-film')){
   const poster=video.getAttribute('poster');
   if(poster){
    parent.classList.add('hn-ambient-shell');
    const cover=document.createElement('div');
    cover.className='hn-ambient-cover';
    cover.setAttribute('aria-hidden','true');
    cover.style.backgroundImage='url('+JSON.stringify(poster)+')';
    parent.insertBefore(cover,video);
   }
  }
  const s={visible:false,pending:false,retry:null};
  states.set(video,s);
  video.addEventListener('playing',()=>mark(video,true));
  video.addEventListener('pause',()=>{
   mark(video,false);
   if(!s.visible||document.hidden||reduced||introActive())return;
   clearTimeout(s.retry);
   s.retry=setTimeout(()=>attempt(video),2000);
  });
  video.addEventListener('error',()=>mark(video,false));
 }
 if('IntersectionObserver'in window){
  const obs=new IntersectionObserver(entries=>{
   for(const entry of entries){
    const video=entry.target,s=states.get(video);
    s.visible=entry.isIntersecting;
    if(s.visible)attempt(video);
    else{clearTimeout(s.retry);video.pause();mark(video,false)}
   }
  },{rootMargin:'150px 0px',threshold:.05});
  videos.forEach(v=>obs.observe(v));
 }else videos.forEach(v=>{states.get(v).visible=true;attempt(v)});
 document.addEventListener('hn-entry-finished',()=>videos.forEach(v=>attempt(v)));
 document.addEventListener('visibilitychange',()=>{
  for(const v of videos){
   const s=states.get(v);
   if(document.hidden){clearTimeout(s.retry);v.pause()}
   else if(s.visible)attempt(v);
  }
 });
 window.addEventListener('pageshow',()=>videos.forEach(v=>attempt(v)));
 const retry=()=>videos.forEach(v=>{if(states.get(v).visible)attempt(v)});
 document.addEventListener('pointerdown',retry,{passive:true});
 document.addEventListener('keydown',retry);
})();
