const CACHE_NAME = 'mango-shell-v9';
const SHELL_FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon.svg'
];
// si cambia alguno de estos, se avisa "hay una versión nueva"
const AVISAR = ['index.html', 'style.css', 'app.js'];

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
// y en paralelo se baja la versión nueva. Si algo del shell cambió, se bajan TODOS los archivos
// juntos (para no quedar con un index.html nuevo y un app.js viejo) y recién después se avisa
// a la página para que muestre "hay una versión nueva".
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // no cachear llamadas al Apps Script
  if (event.request.method !== 'GET') return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    let cached = await cache.match(event.request);
    if (!cached && event.request.mode === 'navigate') cached = await cache.match('./index.html');

    const actualizar = fetch(event.request, { cache: 'no-cache' }).then(async (fresh) => {
      if (!fresh || !fresh.ok) return fresh;
      const nombre = url.pathname.split('/').pop() || 'index.html';
      let cambio = false;
      if (cached && AVISAR.includes(nombre)) {
        const [viejo, nuevo] = await Promise.all([cached.clone().text(), fresh.clone().text()]);
        cambio = viejo !== nuevo;
      }
      await cache.put(event.request, fresh.clone());
      if (cambio) {
        await Promise.all(SHELL_FILES.map(async (f) => {
          try {
            const r = await fetch(f, { cache: 'no-cache' });
            if (r.ok) await cache.put(f, r);
          } catch (err) { /* sin señal a mitad de camino: la próxima apertura lo completa */ }
        }));
        const clientes = await self.clients.matchAll({ type: 'window' });
        clientes.forEach((c) => c.postMessage({ tipo: 'nueva-version' }));
      }
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
