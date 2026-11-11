// HORENOVA PWA: cache public static assets only, never personalized pages or account data.
const CACHE = 'horenova-public-v5-authloop';
const OFFLINE = '/offline.html';
const CORE = [OFFLINE, '/styles.css', '/horenova-v12.css', '/horenova-interior-v14.css', '/favicon.svg'];
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(CORE.map(url => cache.add(url)))
    ).then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    // HTML is always fetched fresh: no member, profile, admin, or checkout data in CacheStorage.
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
    return;
  }
  if (!/\.(?:css|js|svg|png|jpe?g|webp|ico|woff2?)(?:$)/i.test(url.pathname)) return;
  event.respondWith(
    fetch(req).then(response => {
      if (response.ok && response.type === 'basic') {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(req, copy)));
      }
      return response;
    }).catch(() => caches.match(req))
  );
});
