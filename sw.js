/* Rack — offline cache.
   Bump CACHE when you push a new index.html, otherwise phones
   keep serving the old one. */
const CACHE = 'rack-v2';
const FILES = [
  './',
  './gym-tracker.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES).catch(() => {}))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Network first, fall back to cache. That way a fresh push is picked
   up as soon as there's signal, but the gym basement still works. */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy).catch(() => {}));
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./gym-tracker.html')))
  );
});
