const CACHE_NAME = 'mango-shell-v3';
const SHELL_FILES = [
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estrategia: la app se sirve al instante desde caché (abre rápido aunque la señal sea mala)
// y en paralelo se baja la versión nueva. Si app.js cambió, se avisa a la página para que
// muestre "hay una versión nueva" y el usuario actualice cuando quiera.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // no cachear llamadas al Apps Script
  if (event.request.method !== 'GET') return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);

    const actualizar = fetch(event.request).then(async (fresh) => {
      if (!fresh || !fresh.ok) return fresh;
      if (cached && url.pathname.endsWith('app.js')) {
        const [viejo, nuevo] = await Promise.all([cached.clone().text(), fresh.clone().text()]);
        if (viejo !== nuevo) {
          const clientes = await self.clients.matchAll({ type: 'window' });
          clientes.forEach((c) => c.postMessage({ tipo: 'nueva-version' }));
        }
      }
      await cache.put(event.request, fresh.clone());
      return fresh;
    }).catch(() => null);

    if (cached) {
      event.waitUntil(actualizar);
      return cached;
    }
    const fresh = await actualizar;
    return fresh || new Response('Sin conexión', { status: 503 });
  })());
});
