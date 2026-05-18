// AARMS Service Worker — offline-first
// Estrategia: precache en install; fallback a red + cache runtime; devuelve index.html en SPA nav offline
const CACHE = 'aarms-planes-v51';

// Archivos críticos. Paths relativos para que funcione en GitHub Pages (/AARMS/).
const FILES = [
  './',
  './index.html',
  './manifest.json',
  './js/app.js',
  './js/documents-suite.js',
  './js/taller-aarms.js',
  './js/jspdf.umd.min.js',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './logo.png',
  './logo_pdf.png',
];

// Descarga cada archivo INDIVIDUALMENTE. Si uno falla, los demás siguen.
// Sin esto, una sola URL rota hace addAll() abortar y el cache queda vacío.
async function precacheAll(cache){
  const results = await Promise.allSettled(
    FILES.map(async (url) => {
      const req = new Request(url, {cache:'reload'});
      const res = await fetch(req);
      if(!res.ok) throw new Error(`HTTP ${res.status} para ${url}`);
      await cache.put(req, res);
    })
  );
  const fails = results.filter(r=>r.status==='rejected');
  if(fails.length){
    console.warn('[SW] Algunos archivos no se cachearon:', fails.map(f=>f.reason?.message));
  }
}

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await precacheAll(cache);
  })());
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    // Borrar caches viejos
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // Solo GET del mismo origen
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;

  // Network-first para archivos que cambian seguido (código, HTML, manifest).
  // Cache-first para binarios grandes (imágenes, librerías).
  const networkFirst = /\.(js|html|json)$|\/$/i.test(url.pathname);

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);

    if(networkFirst){
      // NETWORK FIRST: intenta red, si falla usa cache.
      try {
        const fresh = await fetch(req);
        if(fresh && fresh.ok){
          cache.put(req, fresh.clone());
          return fresh;
        }
      } catch(_){}
      const cached = await cache.match(req);
      if(cached) return cached;
      // Fallback SPA para navegaciones offline
      if(req.mode === 'navigate'){
        const idx = await cache.match('./index.html');
        if(idx) return idx;
      }
      return new Response('Sin conexión', {status:503});
    }

    // CACHE FIRST (binarios): cache si existe, red si no.
    const cached = await cache.match(req);
    if(cached){
      // revalidar en background silenciosamente
      fetch(req).then(r => {
        if(r && r.ok) cache.put(req, r.clone());
      }).catch(()=>{});
      return cached;
    }
    try {
      const fresh = await fetch(req);
      if(fresh && fresh.ok) cache.put(req, fresh.clone());
      return fresh;
    } catch(err){
      if(req.mode === 'navigate'){
        const idx = await cache.match('./index.html');
        if(idx) return idx;
      }
      return new Response('Sin conexión — recurso no en cache.', {
        status:503, statusText:'Offline',
        headers:{'Content-Type':'text/plain; charset=utf-8'}
      });
    }
  })());
});
