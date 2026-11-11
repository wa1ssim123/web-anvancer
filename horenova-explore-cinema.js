/* Explore/Tourisme background video: mobile-optimized, accessible, resilient. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = !!navigator.connection?.saveData;
  const mobile = window.matchMedia('(max-width: 700px)').matches;
  document.querySelectorAll('.hn-cinema').forEach(hero => {
    const video = hero.querySelector('.hn-cinema__video');
    const control = hero.querySelector('.hn-cinema__motion');
    if (!video || !control) return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    let paused = reduced || saveData;
    const setLabel = () => {
      control.textContent = paused ? '▶ LIRE' : 'Ⅱ PAUSE';
      control.setAttribute('aria-label', paused ? 'Lire la vidéo de présentation' : 'Mettre la vidéo de présentation en pause');
      control.setAttribute('aria-pressed', String(!paused));
    };
    if (!saveData) {
      const url = mobile ? video.dataset.mobileSrc : video.dataset.desktopSrc;
      if (url) video.src = url;
    }
    const play = () => {
      if (!video.src) video.src = video.dataset.mobileSrc || video.dataset.desktopSrc;
      video.play().then(() => { paused=false;setLabel(); }).catch(() => { paused=true;setLabel(); });
    };
    if (!paused) play(); else { video.pause();setLabel(); }
    control.addEventListener('click', () => {
      if (video.paused) play();
      else {video.pause();paused=true;setLabel();}
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !video.paused) {video.pause();paused=true;setLabel();}
    });
  });
})();
