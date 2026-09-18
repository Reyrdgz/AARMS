// AARMS Service Worker — offline-first (app local / PWA)
// AARMS nobranding:
// AARMS ghpages:
const CACHE = 'aarms-offline-v66-ghpages';

function offlineHtml(){
  return `<!DOCTYPE html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AARMS</title></head><body style="font-family:system-ui,sans-serif;background:#07080f;color:#f0f8ff;padding:24px;text-align:center"><h1>AARMS</h1><p>Sin conexión. Abre la app desde el icono instalado o vuelve a cargar cuando tengas red una vez para actualizar el caché.</p></body></html>`;
}

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      await cache.addAll([
        './',
        './index.html',
        './js/app.js',
        './js/documents-suite.js',
        './manifest.json'
      ]);
    } catch(_){}
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;

  const isNav = req.mode === 'navigate';
  const isAppAsset = /\.(js|html|json|png|webp|ico)$/i.test(url.pathname) || url.pathname.endsWith('/');

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);

    // Sin red: solo caché local (nunca página de error del navegador con URL externa)
    if(!navigator.onLine){
      const cached = await cache.match(req);
      if(cached) return cached;
      if(isNav){
        const idx = await cache.match('./index.html') || await cache.match('./');
        if(idx) return idx;
        return new Response(offlineHtml(), { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
      return new Response('', { status: 503, statusText: 'Offline' });
    }

    // Con red: HTML/JS actualizados; imágenes cache-first
    if(isAppAsset && !/\.(png|jpg|jpeg|webp|ico)$/i.test(url.pathname)){
      try {
        const fresh = await fetch(req);
        if(fresh && fresh.ok){
          cache.put(req, fresh.clone());
          return fresh;
        }
      } catch(_){}
      const cached = await cache.match(req);
      if(cached) return cached;
      if(isNav){
        const idx = await cache.match('./index.html');
        if(idx) return idx;
      }
      return new Response('Sin conexión', { status: 503 });
    }

    const cached = await cache.match(req);
    if(cached){
      fetch(req).then(r => { if(r && r.ok) cache.put(req, r.clone()); }).catch(() => {});
      return cached;
    }
    try {
      const fresh = await fetch(req);
      if(fresh && fresh.ok) cache.put(req, fresh.clone());
      return fresh;
    } catch(err){
      if(isNav){
        const idx = await cache.match('./index.html');
        if(idx) return idx;
        return new Response(offlineHtml(), { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
      return new Response('', { status: 503, statusText: 'Offline' });
    }
  })());
});
