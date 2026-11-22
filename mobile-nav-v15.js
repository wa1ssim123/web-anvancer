/* Single, accessible mobile menu controller. */
(() => {
  const panel = document.getElementById('mobileMenu');
  const menu = document.getElementById('menuBtn');
  if (!panel || !menu) return;

  // Add Horenova Tech to the site-wide desktop and mobile navigation.
  // Idempotent: pages already linking to Tech are left unchanged.
  const nav = document.querySelector('.hn12-nav');
  const lang = document.documentElement.lang.slice(0,2);
  const label = lang === 'ar' ? 'التكنولوجيا' : 'Tech';
  if (nav && !nav.querySelector('a[href="/tech.html"]')) {
    const techLink = document.createElement('a');
    techLink.href = '/tech.html';
    techLink.textContent = label;
    if (location.pathname === '/tech.html') techLink.classList.add('active');
    nav.insertBefore(techLink, nav.querySelector('a[href="/explore.html"]'));
  }
  if (!panel.querySelector('a[href="/tech.html"]')) {
    const techMobile = document.createElement('a');
    techMobile.href = '/tech.html';
    techMobile.append(document.createTextNode(label + ' '));
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    techMobile.append(arrow);
    panel.insertBefore(techMobile, panel.querySelector('a[href="/explore.html"]'));
  }

  // Expose the public HORENOVA news and WhatsApp Channel in the mobile app.
  if (!panel.querySelector('a[href="/communaute.html"]')) {
    const community = document.createElement('a');
    community.href = '/communaute.html';
    const communityLabel=document.createTextNode('');
    community.append(communityLabel);
    const setCommunityLanguage=()=>{
      const current=document.documentElement.lang.slice(0,2);
      communityLabel.nodeValue=current==='ar'?'قناة واتساب وأخبار هورينوفا ':current==='en'?'News & WhatsApp Channel ':'Actualités & Canal WhatsApp ';
    };
    setCommunityLanguage();
    const communityObserver=new MutationObserver(setCommunityLanguage);
    communityObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    community.append(arrow);
    panel.insertBefore(community, panel.querySelector('a[href="/account.html"]') || null);
  }

  menu.dataset.bound = 'mobile-v15';
  menu.setAttribute('aria-controls', 'mobileMenu');
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Ouvrir le menu');
  panel.setAttribute('aria-label', 'Navigation mobile');
  panel.hidden = true;
  panel.classList.remove('open', 'hn15-open');

  function openMenu() {
    panel.hidden = false;
    panel.classList.add('open', 'hn15-open');
    document.body.classList.add('hn15-menu-open');
    menu.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-label', 'Fermer le menu');
    menu.textContent = '×';
  }
  function closeMenu() {
    panel.classList.remove('open', 'hn15-open');
    panel.hidden = true;
    document.body.classList.remove('hn15-menu-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Ouvrir le menu');
    menu.textContent = '☰';
  }
  menu.addEventListener('click', event => {
    event.preventDefault();
    if (panel.classList.contains('hn15-open')) closeMenu();
    else openMenu();
  });
  panel.addEventListener('click', event => { if (event.target.closest('a[href]')) closeMenu(); }); // event delegation also covers role-specific links added after login
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && panel.classList.contains('hn15-open')) {
      closeMenu();
      menu.focus();
    }
  });
  document.addEventListener('click', event => {
    if (panel.classList.contains('hn15-open') && !panel.contains(event.target) && !menu.contains(event.target)) closeMenu();
  });
  window.addEventListener('pagehide', closeMenu);
})();
