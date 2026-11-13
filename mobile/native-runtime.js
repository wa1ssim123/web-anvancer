import './native-ui.css';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

if (Capacitor.isNativePlatform()) {
  const pages = [
    ['Emplois', '/jobs.html'],
    ['Shifts', '/shifts.html'],
    ['Academy', '/academy.html'],
    ['Shop', '/shop.html'],
    ['Tourisme', '/explore.html'],
    ['Mon compte', '/account.html']
  ];
  const el = document.createElement('aside');
  el.id = 'hn-native-controls';
  el.innerHTML = '<button id="hn-native-launcher" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Raccourcis HORENOVA">✦</button>'
    + '<div id="hn-native-panel" hidden role="dialog" aria-label="Navigation rapide">'
    + '<strong>HORENOVA <span>MOBILE</span></strong>'
    + '<div id="hn-native-grid"></div>'
    + '<button type="button" id="hn-native-share">Partager HORENOVA ↗</button>'
    + '<button type="button" id="hn-native-dismiss">Fermer</button>'
    + '</div>'
    + '<div id="hn-native-offline" role="status" hidden>Connexion indisponible · certaines données nécessitent Internet</div>';
  document.body.appendChild(el);
  const launcher = el.querySelector('#hn-native-launcher');
  const panel = el.querySelector('#hn-native-panel');
  const grid = el.querySelector('#hn-native-grid');
  grid.replaceChildren(...pages.map(([name, path]) => {
    const a = document.createElement('a');
    a.href = path;
    a.textContent = name;
    return a;
  }));

  const haptic = () => Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  const toggle = (open) => {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    if (open) el.querySelector('#hn-native-dismiss').focus();
    else launcher.focus();
  };
  launcher.addEventListener('click', () => { void haptic(); toggle(panel.hidden); });
  el.querySelector('#hn-native-dismiss').addEventListener('click', () => toggle(false));
  el.querySelector('#hn-native-share').addEventListener('click', async () => {
    void haptic();
    try {
      await Share.share({
        title: 'HORENOVA',
        text: 'L’univers des métiers de l’hospitalité et du tourisme au Maroc.',
        url: 'https://horenova.com' + location.pathname
      });
    } catch (err) {
      if (!String(err).toLowerCase().includes('cancel')) console.warn('Partage indisponible', err);
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) toggle(false);
  });
  document.addEventListener('click', event => {
    if (!panel.hidden && !el.contains(event.target)) toggle(false);
  });
  document.querySelectorAll('a[href]').forEach(a => {
    if (a.closest('#hn-native-controls')) return;
    a.addEventListener('click', () => { void haptic(); }, { passive: true });
  });
  try {
    void StatusBar.setStyle({ style: Style.Light });
    if (Capacitor.getPlatform() === 'android') void StatusBar.setBackgroundColor({ color: '#090a0e' });
  } catch {}

  const offline = el.querySelector('#hn-native-offline');
  const updateStatus = status => {
    offline.hidden = Boolean(status.connected);
  };
  void Network.getStatus().then(updateStatus).catch(() => {});
  void Network.addListener('networkStatusChange', updateStatus);
  void App.addListener('appUrlOpen', ({ url }) => {
    try {
      const target = new URL(url);
      if (!['horenova.com', 'www.horenova.com'].includes(target.hostname) || target.protocol !== 'https:') return;
      location.assign(target.pathname + target.search + target.hash);
    } catch {}
  });
}
