const CACHE_NAME = 'mango-shell-v14';
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

// Cada archivo se guarda por su cuenta. Antes esto era un addAll(), que es todo o nada:
// con señal mala bastaba que fallara UNO para cancelar la instalación entera, y entonces
// la versión nueva no se activaba nunca y la vieja seguía sirviendo el código de siempre.
// Desde Bali eso dejaba la app congelada en una versión de días atrás.
async function guardarShell(cache) {
  await Promise.all(SHELL_FILES.map(async (f) => {
    try {
      const r = await fetch(f, { cache: 'no-cache' });
      if (r.ok) await cache.put(f, r);
    } catch (err) { /* este archivo queda para la próxima; el resto se instala igual */ }
  }));
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(guardarShell));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Estrategia: la app se sirve al instante desde caché (abre rápido aunque la señal sea mala)
// y en paralelo se baja la versión nueva. Si algo del shell cambió, se bajan TODOS los archivos
// juntos (para no quedar con un index.html nuevo y un app.js viejo) y recién después se avisa
// a la página, que se actualiza sola si no estás en medio de cargar algo.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // no cachear llamadas al Apps Script
  if (event.request.method !== 'GET') return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    let cached = await cache.match(event.request);
    // ojo: solo la raíz cae de nuevo en index.html. Si no, pedir cualquier página que no
    // esté en caché (por ejemplo una de recuperación) devolvía la app y no esa página.
    const esRaiz = event.request.mode === 'navigate' && url.pathname.replace(/index\.html$/, '').endsWith('/');
    if (!cached && esRaiz) cached = await cache.match('./index.html');

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
        await guardarShell(cache);
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
