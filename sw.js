// Offline cache for the app shell. Bump VERSION when shipping changes.
const VERSION = 'antariksha-v5';
const SHELL = [
  './', 'index.html', 'css/app.css', 'manifest.webmanifest',
  'js/vendor/astronomy.browser.min.js', 'js/data/stars.js', 'js/data/constellations.js', 'js/data/art.js',
  'js/vedic.js', 'js/i18n.js', 'js/names.js', 'js/sky.js', 'js/jyotish.js', 'js/render.js', 'js/chart.js', 'js/magnetic.js', 'js/sensors.js', 'js/app.js',
  'img/milkyway.png', 'img/icon.svg', 'img/icon-192.png', 'img/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Network first, so updates show up immediately; the cache is only the offline fallback.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(VERSION).then(async (cache) => {
    try {
      const res = await fetch(e.request, { cache: 'no-cache' });
      if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) cache.put(e.request, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(e.request, { ignoreSearch: true });
      if (hit) return hit;
      throw err;
    }
  }));
});
