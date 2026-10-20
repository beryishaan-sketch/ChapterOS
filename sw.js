/* DEAD STOP offline cache. Network first for the page so a new daily number can arrive, cache if the phone is offline. */
const CACHE = 'deadstop-v1';
const ASSETS = [
  './deadstop.html',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './og.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())
  );
});

function isGameFile(url) {
  return /\/deadstop\.html$|\/manifest\.webmanifest$|\/sw\.js$|\/og\.png$|\/icons\/icon-/.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !isGameFile(url)) return;
  const html = req.mode === 'navigate' || url.pathname.endsWith('deadstop.html');
  if (html) {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put('./deadstop.html', copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./deadstop.html', { ignoreSearch: true }))
    );
    return;
  }
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
      return res;
    }))
  );
});
