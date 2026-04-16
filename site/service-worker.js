const CACHE_NAME = 'maxchinese-v3';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/data.js',
  './js/progress.js',
  './js/views/today.js',
  './js/views/history.js',
  './js/views/techniques.js',
  './js/components/language-toggle.js',
  './manifest.json',
  './data/content.json',
  './data/techniques.json',
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', event => {
  // Only handle same-origin requests — don't interfere with GitHub API etc.
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Network-first for everything, fall back to cache for offline
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
