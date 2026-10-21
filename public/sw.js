const CACHE_NAME = 'mango-shell-v18';
const SHELL_FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon.svg'
];
// si cambia alguno de estos, hay versión nueva
const AVISAR = ['index.html', 'style.css', 'app.js'];

// Baja el shell entero a memoria, con hasta tres intentos por archivo. Devuelve los pares
// [archivo, respuesta] o null si alguno no llegó.
//
// Historia: primero fue un addAll() todo o nada, y con la señal de Bali la versión nueva
// no se instalaba nunca. Después se pasó a guardar archivo por archivo, pero eso dejaba
// versiones mezcladas (un index.html nuevo con un app.js viejo) y, si faltaba app.js,
// la versión nueva se activaba igual, borraba la cache vieja y la app no abría sin señal.
// Ahora: todo o nada, pero con reintentos; si no llega completa, sigue la anterior intacta
// y se vuelve a intentar en la próxima apertura.
async function bajarShell() {
  const pares = [];
  for (const f of SHELL_FILES) {
    let r = null;
    for (let i = 0; i < 3 && !r; i++) {
      try {
        const x = await fetch(f, { cache: 'no-cache' });
        if (x.ok) r = x;
      } catch (err) { /* reintenta */ }
    }
    if (!r) return null;
    pares.push([f, r]);
  }
  return pares;
}

async function guardarTodo(cache, pares) {
  await Promise.all(pares.map(([f, r]) => cache.put(f, r)));
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const pares = await bajarShell();
    if (!pares) throw new Error('el shell no bajó completo: queda la versión anterior');
    await guardarTodo(await caches.open(CACHE_NAME), pares);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // solo se llega acá con la cache nueva completa (ver install): recién ahí se borra la vieja
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// La app se sirve al instante desde caché (abre rápido aunque la señal sea mala) y en
// paralelo se mira si hay versión nueva. Si algo del shell cambió, se baja el shell
// COMPLETO y recién entonces se reemplaza todo junto y se avisa a la página, que se
// actualiza sola si no estás en medio de cargar algo.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // no cachear llamadas al Apps Script
  if (event.request.method !== 'GET') return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    let cached = await cache.match(event.request);
    // solo la raíz cae de nuevo en index.html; otra página que no esté en caché va a la red
    const esRaiz = event.request.mode === 'navigate' && url.pathname.replace(/index\.html$/, '').endsWith('/');
    if (!cached && esRaiz) cached = await cache.match('./index.html');

    const actualizar = fetch(event.request, { cache: 'no-cache' }).then(async (fresh) => {
      if (!fresh || !fresh.ok) return fresh;
      const nombre = url.pathname.split('/').pop() || 'index.html';
      if (cached && AVISAR.includes(nombre)) {
        const [viejo, nuevo] = await Promise.all([cached.clone().text(), fresh.clone().text()]);
        if (viejo !== nuevo) {
          // cambió: nada se guarda suelto, o queda un index nuevo con un app.js viejo
          const pares = await bajarShell();
          if (pares) {
            await guardarTodo(cache, pares);
            const clientes = await self.clients.matchAll({ type: 'window' });
            clientes.forEach((c) => c.postMessage({ tipo: 'nueva-version' }));
          }
          return fresh;
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
