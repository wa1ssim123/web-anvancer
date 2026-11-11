/* Single, accessible mobile menu controller. */
(() => {
  const panel = document.getElementById('mobileMenu');
  const menu = document.getElementById('menuBtn');
  if (!panel || !menu) return;

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
  panel.querySelectorAll('a[href]').forEach(anchor => anchor.addEventListener('click', closeMenu));
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
