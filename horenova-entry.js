/* HORENOVA cinematic entrances: silent looping film with animated poster fallback.
 * No autoplay HTML attribute: iOS Low Power Mode otherwise paints native PLAY UI.
 */
(()=>{
 'use strict';
 const intro=document.getElementById('hn-fullscreen-entry');
 if(!intro)return;
 const button=intro.querySelector('.hn-entry__button');
 const video=intro.querySelector('.hn-entry__video');
 if(!button||!video)return;
 let finished=false, retry=null,playing=false;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const poster=video.getAttribute('poster');
 if(poster)intro.style.setProperty('--hn-entry-fallback', 'url('+JSON.stringify(poster)+')');

 function showPlaying(value){
  playing=value;
  video.classList.toggle('is-playing',value);
  intro.classList.toggle('hn-entry--playing',value);
 }
 function start(){
  if(finished||document.hidden||reduced||playing)return;
  video.muted=true;video.defaultMuted=true;video.loop=true;
  video.autoplay=false;video.controls=false;video.playsInline=true;
  video.disablePictureInPicture=true;
  video.setAttribute('muted','');
  video.setAttribute('playsinline','');
  video.setAttribute('webkit-playsinline','');
  video.removeAttribute('autoplay');
  video.removeAttribute('controls');
  try{
   const p=video.play();
   Promise.resolve(p).then(()=>{if(!finished&&!video.paused)showPlaying(true)}).catch(()=>{showPlaying(false)});
  }catch{showPlaying(false)}
 }
 function finish(){
  if(finished)return;
  finished=true;clearTimeout(retry);
  intro.remove();
  document.documentElement.classList.remove('hn-entry-active');
  document.dispatchEvent(new Event('hn-entry-finished'));
  document.querySelectorAll('body [data-hn-entry-paused="true"]').forEach(el=>{
   el.removeAttribute('data-hn-entry-paused');
   if(!document.hidden && !reduced){const p=el.play();if(p?.catch)p.catch(()=>{})}
  });
  window.scrollTo(0,0);
 }
 function init(){
  window.scrollTo(0,0);
  document.querySelectorAll('body video').forEach(el=>{
   if(el===video)return;
   if(!el.paused)el.setAttribute('data-hn-entry-paused','true');
   el.pause();
  });
  if(video.dataset.mobileSrc&&video.dataset.desktopSrc){
   const src=window.matchMedia('(max-width: 700px)').matches?video.dataset.mobileSrc:video.dataset.desktopSrc;
   if(video.getAttribute('src')!==src){video.src=src;video.load()}
  }
  if(!reduced)start();
 }
 button.addEventListener('click',()=>{
  if(finished||intro.classList.contains('hn-entry--exit'))return;
  button.disabled=true;video.pause();
  intro.classList.add('hn-entry--exit');
  setTimeout(finish,reduced?260:980);
 },{once:true});
 intro.addEventListener('transitionend',e=>{
  if(e.target===intro&&(e.propertyName==='clip-path'||e.propertyName==='opacity')&&intro.classList.contains('hn-entry--exit'))finish();
 });
 video.addEventListener('playing',()=>showPlaying(true));
 video.addEventListener('pause',()=>{
  if(finished||intro.classList.contains('hn-entry--exit'))return;
  showPlaying(false);
  if(!document.hidden&&!reduced){clearTimeout(retry);retry=setTimeout(start,2400)}
 });
 document.addEventListener('visibilitychange',()=>{
  if(finished)return;
  if(document.hidden){video.pause();showPlaying(false)}
  else if(!reduced)start();
 });
 window.addEventListener('pageshow',()=>{if(!reduced)start()});
 intro.addEventListener('pointerdown',()=>{if(!reduced)start()},{passive:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
