const CACHE = 'aarms-cubot-v1';
// Paths relativos para que funcione en subdirectorios (GitHub Pages)
const FILES = ['./', './index.html', './js/app.js',
               './icon-192.png', './icon-512.png', './icon-maskable-512.png',
               './logo_transparent.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES).catch(()=>{})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Solo cachear GET del mismo origen
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).catch(() =>
        // fallback: si fetch falla y no está en cache, regresa index (para rutas SPA)
        caches.match('./index.html')
      )
    )
  );
});
