/* HORENOVA: Disable old offline service workers that showed a false full-page outage.
 * Keep browser cache, signed-in accounts and Wix member tokens untouched.
 */
(function () {
  if (!('serviceWorker' in navigator)) return;
  async function removeBrokenOfflineWorker() {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations
        .filter(reg => {
          try { return new URL(reg.scope).origin === location.origin; }
          catch { return false; }
        })
        .map(reg => reg.unregister()));
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter(key => key.startsWith('horenova-')).map(key => caches.delete(key)));
      }
    } catch (error) {
      console.warn('HORENOVA: impossible de nettoyer le cache hors ligne pour le moment.', error);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeBrokenOfflineWorker, {once:true});
  } else {
    void removeBrokenOfflineWorker();
  }
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type !== 'HORENOVA_OFFLINE_CACHE_REMOVED') return;
    // Do not force a reload while the user is filling a form.
    console.info('HORENOVA: ancien cache hors ligne supprimé.');
  });
})();
