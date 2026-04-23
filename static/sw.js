const CACHE_NAME = 'ctml-v6';

const IMAGE_RE = /\.(png|jpe?g|gif|svg|webp|woff2?|ttf)$/i;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isAsset = IMAGE_RE.test(url.pathname) || url.pathname.includes('/icons/');

  if (isAsset) {
    // Stale-while-revalidate for static assets
    event.respondWith(
      caches.match(event.request).then(cached => {
        const networkFetch = fetch(event.request).then(resp => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return resp;
        }).catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // Network-first for HTML/JS/CSS/JSON
  event.respondWith(
    fetch(event.request).then(resp => {
      if (resp.ok) {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
      }
      return resp;
    }).catch(() => caches.match(event.request))
  );
});
