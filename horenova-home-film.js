/* Video montage with native 4K tourism / cuisine sources on capable screens. */
(function(){
  const intro=document.querySelector('.hn-intro'),clips=[...document.querySelectorAll('.hn-film-clip')];
  if(!intro||clips.length!==2)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const conn=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
  const large=matchMedia('(min-width: 1180px)').matches;
  const highQuality=large&&!conn?.saveData&&(!conn?.effectiveType||/4g/i.test(conn.effectiveType));
  const sourceType=highQuality?'4k':'1080';
  let active=0,closed=false,cycle=null,delayed=null;
  function load(video){
    if(video.dataset.loaded)return;
    video.src=video.dataset[sourceType]||video.dataset['1080'];
    video.dataset.loaded='yes';
    video.muted=true;video.defaultMuted=true;video.playsInline=true;
    video.load();
  }
  function play(video){const task=video.play();if(task?.catch)task.catch(()=>{});}
  function schedule(){
    if(closed||reduced)return;
    cycle=setTimeout(()=>{
      if(closed)return;
      const next=1-active,old=clips[active],newVideo=clips[next];
      load(newVideo);
      try{newVideo.currentTime=0}catch{}
      play(newVideo);
      newVideo.classList.add('is-active');
      old.classList.remove('is-active');
      delayed=setTimeout(()=>{old.pause();},1520);
      active=next;
      schedule();
    },active===0?7900:7400);
  }
  function stop(){
    closed=true;
    clearTimeout(cycle);clearTimeout(delayed);
    clips.forEach(video=>{video.pause();video.removeAttribute('src');video.load()});
  }
  load(clips[0]);
  if(!reduced){play(clips[0]);schedule();}
  intro.querySelector('button')?.addEventListener('click',()=>{setTimeout(stop,980)},{once:true});
  document.addEventListener('visibilitychange',()=>{
    if(closed)return;
    if(document.hidden){clearTimeout(cycle);clips.forEach(c=>c.pause());}
    else if(!reduced){play(clips[active]);schedule();}
  });
})();
