/* HORENOVA 2026-11-12: Emergency retirement of the unreliable offline fallback.
 * Do not cache or intercept any navigation, authenticated endpoint, or file.
 * A failed network request must not masquerade as the whole site being offline.
 */
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('horenova-')).map(key => caches.delete(key)));
    await self.clients.claim();
    await self.registration.unregister();
    const clients = await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for (const client of clients) {
      client.postMessage({type:'HORENOVA_OFFLINE_CACHE_REMOVED'});
    }
  })());
});
// Intentionally no fetch listener. Browser handles all network requests directly.
