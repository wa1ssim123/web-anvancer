(function(){
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const film = document.getElementById('heroFilm');
  const play = document.getElementById('heroPlay');
  const close = document.getElementById('heroFilmClose');
  if(play && film){
    play.addEventListener('click',()=>{ film.hidden=false; document.body.classList.add('art-film-open'); const v=film.querySelector('video'); if(v) v.play().catch(()=>{}); });
  }
  if(close && film){
    close.addEventListener('click',()=>{ const v=film.querySelector('video'); if(v) v.pause(); film.hidden=true; document.body.classList.remove('art-film-open'); });
  }
  if(film){ film.addEventListener('click',e=>{ if(e.target===film && close) close.click(); }); }

  const reveal=[...document.querySelectorAll('[data-art-reveal]')];
  if(reduce){ reveal.forEach(x=>x.classList.add('art-visible')); }
  else if('IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{ if(e.isIntersecting){e.target.classList.add('art-visible'); io.unobserve(e.target);} }),{threshold:.12,rootMargin:'0px 0px -40px'});
    reveal.forEach(x=>io.observe(x));
  } else reveal.forEach(x=>x.classList.add('art-visible'));

  const stage=document.querySelector('.art-hero-stage');
  const layers=[...document.querySelectorAll('[data-depth]')];
  if(stage && !reduce){
    stage.addEventListener('pointermove',e=>{
      const r=stage.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      layers.forEach(el=>{ const d=Number(el.dataset.depth||10); el.style.setProperty('--px',`${x*d}px`); el.style.setProperty('--py',`${y*d}px`); });
      document.body.style.setProperty('--cursor-x',`${e.clientX}px`);
      document.body.style.setProperty('--cursor-y',`${e.clientY}px`);
    });
    stage.addEventListener('pointerleave',()=>layers.forEach(el=>{el.style.setProperty('--px','0px');el.style.setProperty('--py','0px');}));
  }
})();
