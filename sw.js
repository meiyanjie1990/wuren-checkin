// Always try network first, cache only for offline
const CACHE = 'wuren-v5';

self.addEventListener('install', e => { self.skipWaiting(); });

self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const clone = r.clone(); caches.open(CACHE).then(c => c.put(e.request, clone)); }
      return r;
    }).catch(() => caches.match(e.request))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
  );
});
