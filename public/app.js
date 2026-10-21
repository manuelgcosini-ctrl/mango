const VERSION = 'v17';   // tiene que coincidir con CACHE_NAME en sw.js
const LS_API_URL = 'mango_api_url';
const LS_TOKEN = 'mango_token';
const LS_QUEUE = 'mango_cola_pendiente';        // operaciones que todavía no llegaron a la planilla
const LS_CACHE_RECIENTES = 'mango_cache_recientes';
const LS_CACHE_MIGRADOS = 'mango_cache_migrados'; // historial migrado: casi nunca cambia, se trae una sola vez
const LS_CACHE_CAT = 'mango_cache_categorias';
const LS_CACHE_CONFIG = 'mango_cache_config';
const LS_HIST_VER = 'mango_historial_version';   // versión del historial que tenemos bajada (ver Code.gs)

const TIMEOUT_MS = 20000;
const TIMEOUT_LARGO = 60000;     // para bajar tandas del historial, que tardan más
// El arranque lee la planilla entera si el backend es viejo, y Apps Script con
// 3000 filas desde el otro lado del mundo puede pasarse de 20 segundos. Es una
// sola llamada por apertura: mejor esperar que fallar.
const TIMEOUT_ARRANQUE = 45000;
const PAGINA_HISTORIAL = 600;    // filas por tanda al bajar el historial
const PAGINA_RECIENTES = 400;    // filas que se miran desde el final para encontrar lo reciente
const PAGINA = 120;              // filas que se muestran de una en Movimientos antes de "Mostrar más"

const MEDIOS_POR_MONEDA = {
  AUD: [{ v: 'Banco', ico: '🏦' }, { v: 'Efectivo', ico: '💵' }],
  EUR: [{ v: 'Banco', ico: '🏦' }, { v: 'Efectivo', ico: '💵' }],
  ARS: [{ v: 'Mercado Pago', ico: '📲' }, { v: 'Efectivo', ico: '💵' }],
  USD: [{ v: 'Billetera', ico: '👛' }, { v: 'Efectivo', ico: '💵' }]
};

const SUB_SUGERIDA = {
  'Comida': 'Restaurante',
  'Transporte': 'Taxi/App',
  'Compras': 'Ropa/Zapatos',
  'Salud y bienestar': 'Bienestar',
  'Servicios': 'Teléfono/Internet/eSIM',
  'Finanzas': 'Préstamos'
};

// Taxonomía por defecto: se usa como fallback offline, la fuente real vive en la pestaña Categorias de la Sheet.
const CATEGORIAS_DEFAULT = [
  { tipo: 'Gasto', categoria: 'Comida', categoriaIcono: '🍔', subcategoria: 'Mercado', subcategoriaIcono: '🛒' },
  { tipo: 'Gasto', categoria: 'Comida', categoriaIcono: '🍔', subcategoria: 'Restaurante', subcategoriaIcono: '🍽️' },
  { tipo: 'Gasto', categoria: 'Comida', categoriaIcono: '🍔', subcategoria: 'Delivery', subcategoriaIcono: '🛵' },
  { tipo: 'Gasto', categoria: 'Transporte', categoriaIcono: '🚌', subcategoria: 'Público', subcategoriaIcono: '🚌' },
  { tipo: 'Gasto', categoria: 'Transporte', categoriaIcono: '🚌', subcategoria: 'Taxi/App', subcategoriaIcono: '🚕' },
  { tipo: 'Gasto', categoria: 'Transporte', categoriaIcono: '🚌', subcategoria: 'Vuelos', subcategoriaIcono: '✈️' },
  { tipo: 'Gasto', categoria: 'Transporte', categoriaIcono: '🚌', subcategoria: 'Combustible/Mecánico', subcategoriaIcono: '⛽' },
  { tipo: 'Gasto', categoria: 'Alojamiento', categoriaIcono: '🏠', subcategoria: 'Alquiler', subcategoriaIcono: '🏠' },
  { tipo: 'Gasto', categoria: 'Alojamiento', categoriaIcono: '🏠', subcategoria: 'Airbnb/Hotel', subcategoriaIcono: '🏨' },
  { tipo: 'Gasto', categoria: 'Compras', categoriaIcono: '🛍️', subcategoria: 'Ropa/Zapatos', subcategoriaIcono: '👕' },
  { tipo: 'Gasto', categoria: 'Compras', categoriaIcono: '🛍️', subcategoria: 'Varios', subcategoriaIcono: '🛍️' },
  { tipo: 'Gasto', categoria: 'Salud y bienestar', categoriaIcono: '💊', subcategoria: 'Médico/Farmacia', subcategoriaIcono: '💊' },
  { tipo: 'Gasto', categoria: 'Salud y bienestar', categoriaIcono: '💊', subcategoria: 'Bienestar', subcategoriaIcono: '🧘' },
  { tipo: 'Gasto', categoria: 'Ocio', categoriaIcono: '🎉', subcategoria: '', subcategoriaIcono: '' },
  { tipo: 'Gasto', categoria: 'Servicios', categoriaIcono: '🧾', subcategoria: 'Suscripciones', subcategoriaIcono: '💳' },
  { tipo: 'Gasto', categoria: 'Servicios', categoriaIcono: '🧾', subcategoria: 'Teléfono/Internet/eSIM', subcategoriaIcono: '📶' },
  { tipo: 'Gasto', categoria: 'Servicios', categoriaIcono: '🧾', subcategoria: 'Otro', subcategoriaIcono: '🗂️' },
  { tipo: 'Gasto', categoria: 'Regalos', categoriaIcono: '🎁', subcategoria: '', subcategoriaIcono: '' },
  { tipo: 'Gasto', categoria: 'Finanzas', categoriaIcono: '💰', subcategoria: 'Comisiones', subcategoriaIcono: '🏦' },
  { tipo: 'Gasto', categoria: 'Finanzas', categoriaIcono: '💰', subcategoria: 'Préstamos', subcategoriaIcono: '🤝' },
  { tipo: 'Gasto', categoria: 'Finanzas', categoriaIcono: '💰', subcategoria: 'Cambio de moneda', subcategoriaIcono: '💱' },
  { tipo: 'Gasto', categoria: 'Finanzas', categoriaIcono: '💰', subcategoria: 'Trámites', subcategoriaIcono: '📝' },
  { tipo: 'Gasto', categoria: 'Inversiones', categoriaIcono: '📈', subcategoria: 'ETF', subcategoriaIcono: '🧺' },
  { tipo: 'Gasto', categoria: 'Inversiones', categoriaIcono: '📈', subcategoria: 'Cripto', subcategoriaIcono: '🪙' },
  { tipo: 'Gasto', categoria: 'Inversiones', categoriaIcono: '📈', subcategoria: 'Acciones', subcategoriaIcono: '📊' },
  { tipo: 'Gasto', categoria: 'Otros', categoriaIcono: '📦', subcategoria: '', subcategoriaIcono: '' },
  { tipo: 'Ingreso', categoria: 'Sueldo', categoriaIcono: '💼', subcategoria: '', subcategoriaIcono: '' },
  { tipo: 'Ingreso', categoria: 'Intereses', categoriaIcono: '📈', subcategoria: '', subcategoriaIcono: '' },
  { tipo: 'Ingreso', categoria: 'Regalo recibido', categoriaIcono: '🎁', subcategoria: '', subcategoriaIcono: '' },
  { tipo: 'Ingreso', categoria: 'Otro ingreso', categoriaIcono: '➕', subcategoria: '', subcategoriaIcono: '' }
];

let categorias = [];
let movimientos = [];
let migradosMem = null;      // historial migrado ya parseado (evita releer los 800 KB del localStorage)
let patrimonio = 0;
let config = {};
let editandoId = null;
let ligando = null;          // { grupo, base } cuando se está ligando otro cargo a un gasto
let categoriaOriginal = '';      // categoría del movimiento al abrir la edición
let montoOriginalEdicion = null; // monto que tenía el movimiento al abrir la edición
let ultimoGuardado = null;   // último gasto guardado, para ofrecer "ligar otro cargo"
let movSucio = true;         // la lista de Movimientos necesita re-render
let limiteRender = PAGINA;
let mesResumen = null;       // YYYY-MM que muestra Resumen
let ajusteCuenta = null;     // cuenta que se está ajustando en Resumen
let gruposAbiertos = new Set();
let ultimaSync = 0;          // cuándo se refrescó contra la planilla por última vez
let ultimaConfirmacion = 0;  // cuándo la planilla confirmó por última vez una operación de la cola
let sincronizando = false;
let errorSync = '';          // último error que devolvió la planilla al subir la cola
let campoMonto = null;       // último campo de monto enfocado (para los botones + − × ÷)
let forzarHistorial = false; // pedido explícito de volver a bajar todo el historial
let ultimoError = '';
const borradosEnEspera = new Map(); // id -> { mov, timer }: borrados con el "Deshacer" a la vista        // para el diagnóstico de ⚙️: qué fue lo último que falló
const indiceBusqueda = new Map(); // id -> texto normalizado, para no re-normalizar 2800 filas por tecla

let estado = {
  tipo: 'Gasto',
  moneda: 'AUD',
  medio: 'Banco',
  monedaDestino: 'EUR',
  medioDestino: 'Banco',
  categoria: null,
  subcategoria: null
};

const SALTO = String.fromCharCode(10);
const $ = (id) => document.getElementById(id);

// Sin esto, una excepción al pintar la lista deja la pantalla vacía y no avisa nada:
// la app parece "no cargar los movimientos" cuando en realidad se rompió al dibujarlos.
function anotarError(origen, e) {
  let msg = (e && (e.message || e.reason?.message || e.reason)) || e || 'error sin detalle';
  // el mensaje del navegador no dice nada; lo traducimos a la causa que casi siempre es
  if (String(msg).includes('Failed to fetch') || String(msg).includes('NetworkError')) {
    msg = 'no pude ni empezar la llamada (revisá que el Apps Script esté publicado para "Cualquier usuario")';
  }
  ultimoError = `${new Date().toLocaleTimeString('es-AR')} ${origen}: ${String(msg).slice(0, 160)}`;
  try { $('toast').textContent = 'Algo se rompió: ' + String(msg).slice(0, 80); $('toast').classList.add('show'); } catch (err) { /* ni el toast anda */ }
}
window.addEventListener('error', (e) => anotarError('js', e.error || e));
window.addEventListener('unhandledrejection', (e) => anotarError('promesa', e));

function apiUrl() { return localStorage.getItem(LS_API_URL) || ''; }
function token() { return localStorage.getItem(LS_TOKEN) || ''; }

function nuevoId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}

// para innerHTML: notas y nombres de categoría vienen de la planilla, no se confía en ellos
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// campos que viven solo en el celu y no van ni a la planilla ni al cache
const sinInternos = (k, v) => (k === 'pendiente' || (typeof k === 'string' && k.startsWith('_'))) ? undefined : v;

function guardarLS(clave, valor) {
  try {
    localStorage.setItem(clave, valor);
  } catch (err) {
    throw new Error('el celu no tiene espacio para guardar (localStorage lleno)');
  }
}

function vibrar(patron) {
  try { if (navigator.vibrate) navigator.vibrate(patron); } catch (err) { /* sin soporte */ }
}

function toast(msg, ms = 2500) {
  const el = $('toast');
  if (el._accion) {
    // hay un toast con "Deshacer" abierto: no lo pisamos, este va después
    clearTimeout(el._cola);
    el._cola = setTimeout(() => toast(msg, ms), Math.max(0, el._accionHasta - Date.now()) + 50);
    return;
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), ms);
}

function fmt(n, moneda) {
  const limpio = Number(n);
  const num = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(isFinite(limpio) ? limpio : 0);
  return moneda ? `${num} ${moneda}` : num;
}

// para las tarjetas del mes: el total de un mes no necesita centavos y asi entra
function fmtStat(n) {
  const v = Number(n) || 0;
  // un millón de pesos no entra en una tarjeta de 100 px: "1,2 M" se lee mejor que cortado
  if (Math.abs(v) >= 1e6) return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(v / 1e6) + ' M';
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(v);
}

function fmtCorto(n) {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 10000) return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(v);
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(v);
}

// Fecha local en YYYY-MM-DD. OJO: toISOString() convierte a UTC y corre la fecha
// según el huso horario del usuario. No usar toISOString para esto.
function fechaLocalStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// marca de tiempo local con el mismo formato que escribe la planilla (solo para ordenar dentro de un día)
function tsLocal() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${fechaLocalStr(d)}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function soloFecha(f) { return (f || '').toString().slice(0, 10); }
function mesDe(f) { return soloFecha(f).slice(0, 7); }
function fechaValida(f) { return /^\d{4}-\d{2}-\d{2}$/.test(f || ''); }

function nombreMes(ym) {
  const [y, m] = (ym || '').split('-').map(Number);
  const nombres = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  if (!nombres[m - 1] || !y) return ym || 'sin fecha';
  return `${nombres[m - 1]} ${y}`;
}

// "9 abr 2025": corta pero con año, que en una deuda de hace un año importa
function fechaCorta(iso) {
  if (!fechaValida(iso)) return iso || '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d)
    .toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
    .replace(/\./g, '');
}

function diasDelMes(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

// "Hoy", "Ayer" o "lun 15 sep": leer una lista por día es más natural que por fecha ISO
function etiquetaDia(iso) {
  const hoy = fechaLocalStr(new Date());
  if (iso === hoy) return 'Hoy';
  const d = new Date();
  d.setDate(d.getDate() - 1);
  if (iso === fechaLocalStr(d)) return 'Ayer';
  if (!fechaValida(iso)) return iso || 'sin fecha';
  const [y, m, dd] = iso.split('-').map(Number);
  return new Date(y, m - 1, dd)
    .toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/\./g, '');
}

function fechaLarga(iso) {
  if (!fechaValida(iso)) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function sumarMeses(ym, delta) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function sinAcentos(s) {
  return (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function esMigrado(m) { return !!(m && m.id && String(m.id).startsWith('mig-')); }

// Lo que hay que saber para entender por qué la app no muestra lo que tendría que mostrar,
// en una pantalla que se puede fotografiar y mandar. Sin esto hay que adivinar.
// Un fetch bloqueado por CORS y uno sin internet son indistinguibles desde JavaScript:
// los dos tiran "Failed to fetch". Pero se pueden separar probando primero algo del
// propio dominio: si eso anda y la planilla no, el problema es de la planilla, no de la
// señal. Eso es exactamente lo que no podiamos distinguir a ojo.
async function probarConexion() {
  const caja = $('diagBox');
  const decir = (t) => { if (caja) caja.textContent = t; };
  if (!apiUrl()) { decir('No hay ninguna dirección guardada todavía.'); return; }

  decir('Probando…');
  let hayInternet = false;
  try {
    const r = await fetch('icon.svg?probar=' + Date.now(), { cache: 'no-store' });
    hayInternet = r.ok;
  } catch (err) { hayInternet = false; }

  if (!hayInternet) {
    decir('Sin internet.' + SALTO + SALTO + 'No llego ni a mi propio servidor, así que no es tu planilla: es la conexión del celu.');
    return;
  }

  try {
    const data = await apiGet({ action: 'movimientos', desde: 0, limite: 1 }, 25000);
    const total = (data && data.total !== undefined) ? data.total
                : (Array.isArray(data) ? data.length : '?');
    decir('Todo bien.' + SALTO + SALTO + 'Tu planilla contestó y dice que tiene ' + total + ' movimientos.'
        + SALTO + 'Si aun así no ves nada, cerrá y abrí la app.');
  } catch (err) {
    if (err instanceof ApiError) {
      decir('Tu planilla contestó, pero con un error:' + SALTO + SALTO + err.message
          + SALTO + SALTO + 'Suele ser la clave: si en Config pusiste un token, tiene que estar igual acá arriba.');
    } else if (esTimeout(err)) {
      decir('Internet anda, pero tu planilla tardó más de 25 segundos en contestar.'
          + SALTO + SALTO + 'Probá otra vez con mejor señal.');
    } else {
      // Hasta acá solo sabemos que el fetch normal falló, y eso tapa dos cosas muy
      // distintas. Con mode:'no-cors' el navegador hace igual el viaje pero no deja
      // leer la respuesta: si ese viaje SÍ llega, el servidor está vivo y contestando,
      // y lo que falla es el permiso de lectura entre dominios. Si ni eso llega, el
      // pedido no sale del celu (red, DNS, VPN, algo que bloquea a Google).
      let llegaElViaje = false;
      try {
        await fetch(apiUrl() + '?action=config&probar=' + Date.now(), { mode: 'no-cors', cache: 'no-store' });
        llegaElViaje = true;
      } catch (e2) { llegaElViaje = false; }

      if (llegaElViaje) {
        decir('Tu planilla contesta, pero el navegador no me deja leer la respuesta.' + SALTO + SALTO
            + 'El servidor está vivo: el pedido llega y vuelve. Lo que falta es el permiso'
            + ' entre dominios (CORS).' + SALTO + SALTO
            + 'Sacale una foto a esto y mandámelo: es un caso distinto al del permiso'
            + ' de Apps Script, y se arregla de otra manera.');
      } else {
        decir('El pedido a tu planilla no sale del celu.' + SALTO + SALTO
            + 'Mi servidor contesta, así que internet hay. Pero a script.google.com no llega'
            + ' nada.' + SALTO + SALTO
            + 'Suele ser la red donde estás (wifi con filtro o portal), una VPN, o un'
            + ' bloqueador. Probá con los datos del celu en vez del wifi.');
      }
    }
  }
}

function renderDiagnostico() {
  const caja = $('diagBox');
  if (!caja) return;
  const cuenta = (k) => { try { const v = localStorage.getItem(k); return v === null ? 'sin cache' : JSON.parse(v).length; } catch (err) { return 'cache roto'; } };
  const url = apiUrl();
  const recientesMem = movimientos.filter(m => !esMigrado(m)).length;
  const maxFecha = movimientos.reduce((a, m) => (soloFecha(m.fecha) > a ? soloFecha(m.fecha) : a), '');
  caja.textContent = [
    `version      ${VERSION}`,
    `en memoria   ${movimientos.length}  (historial ${movimientos.length - recientesMem} / recientes ${recientesMem})`,
    `cache        recientes ${cuenta(LS_CACHE_RECIENTES)} / historial ${cuenta(LS_CACHE_MIGRADOS)}`,
    `mas reciente ${maxFecha || 'ninguno'}`,
    `sin subir    ${leerCola().length}`,
    `ultima sync  ${ultimaSync ? new Date(ultimaSync).toLocaleTimeString('es-AR') : 'nunca'}`,
    `direccion    ${url ? url.replace(/\/s\/[^/]+\//, '/s/…/') : 'SIN CONFIGURAR'}`,
    `ultimo error ${ultimoError || 'ninguno'}`
  ].join(SALTO);
}

function claveGrupo(m) { return m.grupo || m.id; }

// ---------- Qué es gasto de verdad y qué no ----------
// Cambiar AUD a euros no es gastar: la plata sigue siendo tuya. Comprar un ETF
// tampoco. Prestarle a alguien tampoco, si vuelve. Los tres salían contados como
// gasto del mes y lo inflaban; ahora tienen su propia línea en el Resumen.
const RE_CAMBIO = /cambio de moneda|aud to eur|eur to aud|\d+\s*eur(os)?\b|\beuros\b/i;
const RE_PRESTAMO = /^\s*pr[eé]stamo\b|^\s*presto\b|\bdeuda\b|le prest[eé]/i;

// Plata que pasa a efectivo en una moneda que Mango no sigue (rupias en Bali, pesos,
// baht, dongs…) se gasta allá: cuenta como gasto del mes. Antes contaba o no según cómo
// estuviera escrita la nota. Pasar de AUD a EUR o USD entre tus cuentas sigue sin serlo.
const RE_A_MONEDA_PROPIA = /\beur\b|\d\s*eur\b|euros?\b|aud to eur|eur to aud|\busd\b|d[oó]lar/i;
const RE_A_EFECTIVO_AFUERA = /\b(?:idr|rupias?|ars|pesos?|vnd|dongs?|baht|thb|kip|soles|yen(?:es)?|filipinos?|php|bolivianos?)\b|\d\s*(?:idr|ars|vnd|thb)\b|retiro|extracci[oó]n|cajero|\batm\b|divisas/i;

function claseMovimiento(m) {
  if (m.tipo === 'Ingreso') return 'ingreso';
  if (m.tipo === 'Transferencia') return 'interno';
  if (m.categoria === 'Inversiones') return 'inversion';
  const texto = `${m.subcategoria || ''} ${m.nota || ''}`;
  if (m.categoria === 'Finanzas') {
    if (RE_A_MONEDA_PROPIA.test(m.nota || '')) return 'cambio';
    if (RE_A_EFECTIVO_AFUERA.test(m.nota || '')) return 'consumo';
    if (RE_CAMBIO.test(texto)) return 'cambio';
  }
  if (m.subcategoria === 'Préstamos' || RE_PRESTAMO.test(texto)) return 'prestamo';
  return 'consumo';
}
const esConsumo = (m) => claseMovimiento(m) === 'consumo';
function esPrestamo(m) { return claseMovimiento(m) === 'prestamo'; }

// "Préstamo Andrea" -> "Andrea". Si no hay nombre, queda la nota entera.
function personaDe(m) {
  const n = String(m.nota || '').trim();
  // ojo: la preposición tiene que ir separada por espacios, si no "Préstamo Andrea"
  // pierde la A inicial del nombre y queda "ndrea"
  const sinPrefijo = n.replace(/^\s*(?:pr[eé]stamo|presto|deuda|le prest[eé])\s*:?(?:\s+(?:a|de|para))?\s+/i, '')
    .split(' · ')[0].trim(); // lo que va después de " · " es la nota, no el nombre
  return sinPrefijo || n || 'Sin nombre';
}
function iniciales(nombre) {
  const p = String(nombre).trim().split(/\s+/).filter(Boolean);
  return ((p[0] || '?')[0] + (p[1] ? p[1][0] : '')).toUpperCase();
}
// los préstamos saldados se marcan en Config, así no hace falta tocar la planilla
// las notas que arma notaFinal: "Préstamo X" o "Préstamo X · algo"
const RE_NOTA_PRESTAMO = /^\s*(?:pr[eé]stamo|presto|le prest[eé])\b/i;
const claveDevuelto = (id) => `devuelto_${id}`;
const estaDevuelto = (m) => !!config[claveDevuelto(m.id)];

// ---------- Red ----------
// La planilla respondió, pero con un error (token mal, acción desconocida…). No es cuestión de señal.
class ApiError extends Error {}
function esErrorDeRed(err) { return !(err instanceof ApiError); }
function esTimeout(err) { return err && err.name === 'AbortError'; }

async function apiGet(params, timeoutMs = TIMEOUT_MS) {
  const q = new URLSearchParams(params);
  if (token()) q.set('token', token());
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(apiUrl() + '?' + q.toString(), { signal: ctrl.signal });
    const data = await res.json();
    if (data && data.error) throw new ApiError(data.error);
    return data;
  } finally {
    clearTimeout(t);
  }
}

async function apiPost(body) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(apiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(token() ? { ...body, token: token() } : body, sinInternos),
      signal: ctrl.signal
    });
    const data = await res.json();
    if (data && data.error) throw new ApiError(data.error);
    return data;
  } finally {
    clearTimeout(t);
  }
}

// ---------- Números: acepta coma decimal y calculadora inline ----------
// "12,50" -> 12.5 ; "1.500" -> 1500 ; "1.500,25" -> 1500.25 ; "1,234.56" -> 1234.56 ; "45+12,50" -> 57.5
// Cada número de la expresión se normaliza por separado. El decimal es el separador que
// aparece ÚLTIMO ("1.234,56" es formato argentino, "1,234.56" es el del banco australiano).
function normalizarToken(t) {
  if (/[.,]$/.test(t)) return t;  // "0,5." queda inválido en vez de leerse como 5
  const uc = t.lastIndexOf(',');
  const up = t.lastIndexOf('.');
  if (uc !== -1 && up !== -1) return uc > up ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  // un solo separador con exactamente tres cifras detrás es de miles ("1.500", "1,000"
  // como escribe el banco australiano), salvo que adelante haya un 0 ("0.125")
  const miles = /^[1-9]\d{0,2}([.,]\d{3})+$/;
  if (uc !== -1) return (t.split(',').length > 2 || miles.test(t)) ? t.replace(/,/g, '') : t.replace(',', '.');
  if (up !== -1) return miles.test(t) ? t.replace(/\./g, '') : t;
  return t;
}

function normalizarNumero(str) {
  const s = (str || '').toString().replace(/\s+/g, ''); // "1 000" = mil
  if (!s) return '';
  return s.replace(/[0-9.,]+/g, normalizarToken);
}

function tieneOperador(limpio) { return /[+\-*/]/.test(limpio.slice(1)); }

function evaluarExpresion(str) {
  const limpio = normalizarNumero(str);
  if (!limpio) return null;
  if (!/^[0-9+\-*/.()]+$/.test(limpio)) return null;
  if (!tieneOperador(limpio)) return null; // sin operador, no hay nada que calcular
  try {
    const resultado = Function('"use strict"; return (' + limpio + ')')();
    return (typeof resultado === 'number' && isFinite(resultado)) ? Math.round(resultado * 100) / 100 : null;
  } catch (err) {
    return null;
  }
}

// Estricto a propósito: antes "1.500+" se guardaba como 1,5 y "5/0" como 5 sin avisar.
// Si no se puede interpretar entero, devuelve NaN y el guardado se rechaza.
function montoNumerico(inputEl) {
  const limpio = normalizarNumero(inputEl.value);
  if (!limpio) return NaN;
  if (!/^[0-9+\-*/.()]+$/.test(limpio)) return NaN;
  if (tieneOperador(limpio)) {
    const calc = evaluarExpresion(inputEl.value);
    return calc === null ? NaN : calc;
  }
  const n = Number(limpio);
  return isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

// muestra cómo se interpretó lo tecleado cuando no es obvio (operadores, miles, coma y punto juntos)
function actualizarCalcHint() {
  const raw = $('monto').value;
  const hint = $('calcHint');
  const ambiguo = /[+\-*/]/.test(raw.slice(1)) || /[.,]\d{3}(\D|$)/.test(raw) || (raw.includes(',') && raw.includes('.')) || /\s/.test(raw.trim());
  if (!raw.trim() || !ambiguo) { hint.textContent = ''; hint.classList.remove('error'); return; }
  const n = montoNumerico($('monto'));
  hint.textContent = isFinite(n) ? `= ${fmt(n)}` : 'No entiendo ese monto';
  hint.classList.toggle('error', !isFinite(n));
}

function ajustarFuenteMonto() {
  const n = $('monto').value.length;
  $('monto').classList.toggle('largo', n > 8 && n <= 11);
  $('monto').classList.toggle('muy-largo', n > 11);
}
$('monto').addEventListener('input', () => { actualizarCalcHint(); actualizarTasaHint(); ajustarFuenteMonto(); });
$('montoRecibido').addEventListener('input', actualizarTasaHint);

['monto', 'montoRecibido'].forEach(id => {
  $(id).addEventListener('focus', () => { campoMonto = $(id); });
});

// Enter (o la tecla "Listo" del teclado del celu) guarda
['monto', 'montoRecibido', 'nota', 'persona'].forEach(id => {
  $(id).addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (id === 'monto') {
      // el teclado dice "Siguiente": lleva al campo que sigue o cierra el teclado para elegir
      if (estado.tipo === 'Transferencia') { $('montoRecibido').focus(); return; }
      if (!$('bloqueDetalle').classList.contains('oculto')) { $('nota').focus(); return; }
      $(id).blur();
      return;
    }
    $('guardarBtn').click();
  });
});

// insertan el operador donde está el cursor, sin perder el foco ni el teclado numérico
$('opsMonto').addEventListener('pointerdown', (e) => e.preventDefault());
$('opsMonto').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const enTransferencia = estado.tipo === 'Transferencia';
  const input = (campoMonto && (campoMonto.id !== 'montoRecibido' || enTransferencia)) ? campoMonto : $('monto');
  const ini = input.selectionStart ?? input.value.length;
  const fin = input.selectionEnd ?? input.value.length;

  if (btn.dataset.op === 'borrar') {
    const desde = (ini === fin) ? Math.max(0, ini - 1) : ini;
    input.value = input.value.slice(0, desde) + input.value.slice(fin);
    input.setSelectionRange(desde, desde);
  } else {
    input.value = input.value.slice(0, ini) + btn.dataset.op + input.value.slice(fin);
    input.setSelectionRange(ini + 1, ini + 1);
  }
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus();
});

function actualizarTasaHint() {
  const hint = $('tasaHint');
  if (estado.tipo !== 'Transferencia') { hint.textContent = ''; return; }
  const monto = montoNumerico($('monto'));
  const recibido = montoNumerico($('montoRecibido'));
  hint.textContent = (monto > 0 && recibido > 0)
    ? `1 ${estado.moneda} = ${(recibido / monto).toFixed(4)} ${estado.monedaDestino}`
    : '';
}

// ---------- Config ----------
$('configBtn').addEventListener('click', () => {
  $('apiUrlInput').value = apiUrl();
  $('tokenInput').value = token();
  renderDiagnostico();
  $('configOverlay').classList.add('active');
});
$('probarBtn').addEventListener('click', probarConexion);
$('cerrarConfigBtn').addEventListener('click', () => $('configOverlay').classList.remove('active'));
$('guardarConfigBtn').addEventListener('click', () => {
  const urlNueva = $('apiUrlInput').value.trim();
  if (urlNueva !== apiUrl() && leerCola().length) {
    toast(`Ojo: hay ${leerCola().length} operaciones sin subir; van a ir a la planilla nueva`, 5000);
  }
  localStorage.setItem(LS_API_URL, urlNueva);
  localStorage.setItem(LS_TOKEN, $('tokenInput').value.trim());
  $('configOverlay').classList.remove('active');
  errorSync = '';
  toast('Configuración guardada');
  init();
});
// Pide bajar todo de nuevo SIN borrar antes: si la bajada falla por señal, el
// celu se queda con lo que ya tenía. Borrar primero y bajar después deja al
// usuario sin datos y sin forma de recuperarlos hasta que vuelva la conexión.
$('limpiarCacheBtn').addEventListener('click', () => {
  forzarHistorial = true;
  $('configOverlay').classList.remove('active');
  toast('Bajando todo de nuevo…');
  cargarTodo();
});
$('refrescarBtn').addEventListener('click', async () => {
  $('refrescarBtn').classList.add('girando');
  await cargarTodo();
  await sincronizarCola();
  $('refrescarBtn').classList.remove('girando');
  toast('Actualizado');
});
$('syncPill').addEventListener('click', () => {
  if (errorSync) toast(`La planilla respondió: ${errorSync}`, 5000);
  sincronizarCola();
});

// ---------- Tabs ----------
function mostrarVista(nombre) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.view === nombre));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + nombre));
  document.body.classList.toggle('vista-cargar', nombre === 'cargar');
  if (nombre === 'movimientos') renderMovimientos();
  if (nombre === 'activos') renderActivos();
  if (nombre === 'prestado') renderPrestado();
}
document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => mostrarVista(btn.dataset.view)));
function vistaActiva() { return document.querySelector('.view.active').id.replace('view-', ''); }

// ---------- Tipo ----------
function aplicarTipo(tipo) {
  // cambiar de tipo cambia las categorías posibles: lo elegido antes ya no aplica
  if (tipo !== estado.tipo) olvidarCategoria();
  estado.tipo = tipo;
  document.querySelectorAll('.tipo-btn').forEach(b => b.classList.toggle('active', b.dataset.tipo === tipo));
  $('bloqueTransferencia').classList.toggle('oculto', tipo !== 'Transferencia');
  renderCategoria();
  renderUltimos(); // el botón de ligar solo tiene sentido cargando un gasto
}

// al elegir Finanzas > Préstamos aparece "¿a quién?", para no depender de cómo
// venga escrita la nota cuando después haya que listarlo en Prestado
function actualizarBloquePrestamo() {
  const es = estado.tipo === 'Gasto' && estado.subcategoria === 'Préstamos';
  $('bloquePrestamo').classList.toggle('oculto', !es);
  // en un préstamo las notas sugeridas sobran (están los chips de personas) y así entra en pantalla
  $('bloqueDetalle').classList.toggle('modo-prestamo', es);
  if (es) renderPersonasSugeridas();
}

function renderPersonasSugeridas() {
  const vistas = new Map();
  for (const m of movimientos) {
    if (!esPrestamo(m) || m.tipo !== 'Gasto' || !RE_NOTA_PRESTAMO.test(String(m.nota || ''))) continue;
    const p = personaDe(m);
    const k = sinAcentos(p);
    if (k && !vistas.has(k)) vistas.set(k, p);
  }
  const lista = [...vistas.values()].slice(0, 8);
  $('personaChips').innerHTML = lista.map(p =>
    `<button type="button" class="chip" data-persona="${esc(p)}">${esc(p)}</button>`).join('');
  $('personasSugeridas').innerHTML = lista.map(p => `<option value="${esc(p)}">`).join('');
}

$('personaChips').addEventListener('click', (e) => {
  const b = e.target.closest('.chip');
  if (!b) return;
  $('persona').value = b.dataset.persona;
  document.querySelectorAll('#personaChips .chip').forEach(x => x.classList.toggle('active', x === b));
});

$('tipoToggle').addEventListener('click', (e) => {
  const btn = e.target.closest('.tipo-btn');
  if (!btn) return;
  aplicarTipo(btn.dataset.tipo);
  if (btn.dataset.tipo !== 'Gasto') cancelarLigar();
  renderCategoriaChips();
  actualizarTasaHint();
});

// ---------- Fecha ----------
// La fecha elegida se escribe al lado de los chips: si la app quedó abierta desde
// ayer y "Hoy" envejeció, se ve enseguida.
function actualizarContexto() {
  $('fecha').max = fechaLocalStr(new Date()); // sin fechas futuras por error
  const v = $('fecha').value;
  $('fechaHint').textContent = fechaValida(v)
    ? (() => { const [y, m, d] = v.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, ''); })()
    : 'Elegí la fecha 📅';
}
const actualizarFechaHint = actualizarContexto;

// Marca el chip que corresponde a una fecha: si la que eligieron en el calendario
// es hoy, ayer o anteayer, se prende ese chip; si no, el 📅.
function marcarChipFecha(v) {
  let dias = null;
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (fechaLocalStr(d) === v) { dias = i; break; }
  }
  document.querySelectorAll('#fechaChips .chip').forEach(c => c.classList.toggle('active',
    dias === null ? c.id === 'chipOtraFecha' : c.dataset.dias === String(dias)));
}

function fijarFechaRelativa(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  $('fecha').value = fechaLocalStr(d);
  marcarChipFecha($('fecha').value);
  actualizarFechaHint();
}

// "Hoy" se recalcula al volver a la app: una PWA puede quedar abierta desde ayer
// y si no, el chip dice Hoy pero la fecha guardada es la de ayer.
function refrescarFechaChip() {
  const activo = document.querySelector('#fechaChips .chip.active');
  if (activo && activo.dataset.dias !== undefined) {
    const d = new Date();
    d.setDate(d.getDate() - Number(activo.dataset.dias));
    $('fecha').value = fechaLocalStr(d);
  }
  actualizarFechaHint();
}

$('fechaChips').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip[data-dias]');
  if (!chip) return; // el 📅 lo maneja su propio input
  fijarFechaRelativa(Number(chip.dataset.dias));
});

// Antes el chip "Otra" mostraba un campo oculto y en el mismo instante le pedía al
// navegador que abriera el calendario. Si el celu no lo abría (pasa cuando el campo
// recién aparece), quedaba solo enfocado y había que tocar dos veces. Ahora el input
// está encima del chip, transparente: el toque cae en el control nativo y Android abre
// el calendario solo. En la compu, donde un clic en el campo no lo abre, se pide a mano.
let ultimoPuntero = 'mouse';
document.addEventListener('pointerdown', (e) => { ultimoPuntero = e.pointerType || 'mouse'; }, true);
$('fecha').addEventListener('click', () => {
  if (ultimoPuntero === 'touch') return;
  try { if (typeof $('fecha').showPicker === 'function') $('fecha').showPicker(); } catch (err) { /* ya abierto o no soportado */ }
});
function fechaElegida() {
  const v = $('fecha').value;
  if (fechaValida(v)) marcarChipFecha(v);
  // "Borrar" en el selector de Android la deja vacía: que ningún chip diga Ayer
  else document.querySelectorAll('#fechaChips .chip').forEach(c => c.classList.toggle('active', c.id === 'chipOtraFecha'));
  actualizarFechaHint();
}
$('fecha').addEventListener('change', fechaElegida);
$('fecha').addEventListener('input', fechaElegida);

// ---------- Cuenta (moneda + medio) ----------
// El medio (Banco / Efectivo…) es un botón al lado de la moneda que alterna con cada
// toque. Antes vivía en una línea plegable aparte que ocupaba lugar y casi no se usaba.
function opcionesMedio(moneda, actual) {
  const opciones = [...(MEDIOS_POR_MONEDA[moneda] || [])];
  // un medio que ya no está en la lista (fila vieja) se muestra igual, para no reasignarlo sin querer
  if (actual && !opciones.some(o => o.v === actual)) opciones.push({ v: actual, ico: '🏷️' });
  return opciones;
}

function pintarMedio(btn, opcion) {
  btn.textContent = `${opcion.ico} ${opcion.v}`;
  btn.dataset.medio = opcion.v;
}

function renderMedio(btnId, moneda, medioActivo, onSelect) {
  const btn = $(btnId);
  const opciones = opcionesMedio(moneda, medioActivo);
  const activo = opciones.find(o => o.v === medioActivo) || opciones[0];
  btn.dataset.moneda = moneda;
  pintarMedio(btn, activo);
  onSelect(activo.v);
}

function ciclarMedio(btnId, onSelect) {
  const btn = $(btnId);
  const opciones = opcionesMedio(btn.dataset.moneda, btn.dataset.medio);
  const i = opciones.findIndex(o => o.v === btn.dataset.medio);
  const sig = opciones[(i + 1) % opciones.length];
  pintarMedio(btn, sig);
  onSelect(sig.v);
}

const LS_CUENTA = 'mango_ultima_cuenta';
const fijarMedio = (m) => {
  estado.medio = m;
  if (editandoId) return; // editar un movimiento viejo no cambia la cuenta de todos los días
  try { localStorage.setItem(LS_CUENTA, JSON.stringify({ moneda: estado.moneda, medio: m })); } catch (err) { /* no importa */ }
};
const fijarMedioDestino = (m) => { estado.medioDestino = m; };
$('medioBtn').addEventListener('click', () => ciclarMedio('medioBtn', fijarMedio));
$('medioDestinoBtn').addEventListener('click', () => ciclarMedio('medioDestinoBtn', fijarMedioDestino));

$('moneda').addEventListener('change', (e) => {
  estado.moneda = e.target.value;
  // "Banco" no existe en USD ni en ARS: antes quedaba "🏷️ Banco" y nacía una cuenta "USD Banco"
  const valido = (MEDIOS_POR_MONEDA[estado.moneda] || []).some(o => o.v === estado.medio);
  renderMedio('medioBtn', estado.moneda, valido ? estado.medio : null, fijarMedio);
  actualizarTasaHint();
});
$('monedaDestino').addEventListener('change', (e) => {
  estado.monedaDestino = e.target.value;
  const valido = (MEDIOS_POR_MONEDA[estado.monedaDestino] || []).some(o => o.v === estado.medioDestino);
  renderMedio('medioDestinoBtn', estado.monedaDestino, valido ? estado.medioDestino : null, fijarMedioDestino);
  actualizarTasaHint();
});

// ---------- Categorías / subcategorías ----------
function fuenteCategorias() { return categorias.length ? categorias : CATEGORIAS_DEFAULT; }

function subcategoriaSugerida(cat) {
  const usado = movimientos.find(m => m.categoria === cat && m.subcategoria); // movimientos viene ordenado por fecha desc
  if (usado) return usado.subcategoria;
  return SUB_SUGERIDA[cat] || null;
}

// Elegís una categoría y la grilla se comprime en un chip; tocás el chip y se vuelve a
// abrir. Lo mismo con la subcategoría. Así Cargar entra entero en una pantalla y cada
// cosa aparece recién cuando hace falta.
let grillaAbierta = true;   // grilla de categorías desplegada
let subsAbiertas = false;  // subcategorías desplegadas aunque ya haya una elegida

function olvidarCategoria() {
  estado.categoria = null;
  estado.subcategoria = null;
  grillaAbierta = true;
  subsAbiertas = false;
}

// Las categorías se ordenan por lo que más usaste en los últimos tres meses.
function ordenarPorUso(unicas) {
  const desde = sumarMeses(fechaLocalStr(new Date()).slice(0, 7), -3);
  const uso = {};
  for (const m of movimientos) {
    if (m.tipo !== estado.tipo || mesDe(m.fecha) < desde) continue;
    uso[m.categoria] = (uso[m.categoria] || 0) + 1;
  }
  return unicas.slice().sort((a, b) => (uso[b.categoria] || 0) - (uso[a.categoria] || 0));
}

// El orden se calcula una vez por apertura y por tipo, cuando ya están los datos. Si se
// recalcula en cada pintada, guardar dos gastos en "Otros" la subía de puesto y corría las
// demás: el dedo iba a donde estaba Compras y tocaba otra cosa.
const ordenCongelado = {};
function catsDelTipo() {
  const unicas = [];
  const vistas = new Set();
  fuenteCategorias().filter(c => c.tipo === estado.tipo).forEach(c => {
    if (!vistas.has(c.categoria)) { vistas.add(c.categoria); unicas.push(c); }
  });
  const dia = fechaLocalStr(new Date());
  let orden = ordenCongelado[estado.tipo];
  if (!orden || orden.dia !== dia || (!orden.conDatos && movimientos.length > 500)) {
    orden = ordenCongelado[estado.tipo] = { dia, conDatos: movimientos.length > 500, nombres: ordenarPorUso(unicas).map(c => c.categoria) };
  }
  const pos = (c) => { const i = orden.nombres.indexOf(c.categoria); return i === -1 ? 999 : i; };
  return unicas.sort((a, b) => pos(a) - pos(b));
}

function subsDe(cat) {
  return fuenteCategorias().filter(c => c.tipo === estado.tipo && c.categoria === cat && c.subcategoria);
}

function iconoCategoria(cat) {
  const c = fuenteCategorias().find(x => x.tipo === estado.tipo && x.categoria === cat);
  return (c && c.categoriaIcono) || '🏷️';
}

function renderCategoria() {
  if (estado.tipo === 'Transferencia') {
    $('bloqueCategoria').classList.add('oculto');
    mostrarDetalle(true);
    return;
  }
  $('bloqueCategoria').classList.remove('oculto');

  const cats = catsDelTipo();
  // al editar, una categoría que ya no existe en la taxonomía se muestra igual
  if (estado.categoria && !cats.some(c => c.categoria === estado.categoria)) {
    cats.push({ categoria: estado.categoria, categoriaIcono: '🏷️' });
  }

  const grilla = !estado.categoria || grillaAbierta;
  $('categoriaChips').classList.toggle('oculto', !grilla);
  $('catElegida').classList.toggle('oculto', grilla);
  if (grilla) {
    $('categoriaChips').innerHTML = cats.map(c =>
      `<button type="button" class="cat-tile${c.categoria === estado.categoria ? ' active' : ''}" data-cat="${esc(c.categoria)}">` +
      `<span class="ico">${c.categoriaIcono || '🏷️'}</span><span class="nom">${esc(c.categoria)}</span></button>`).join('');
    $('subcategoriaChips').classList.add('oculto');
    mostrarDetalle(false);
    return;
  }

  const subs = subsDe(estado.categoria).map(c => ({ sub: c.subcategoria, ico: c.subcategoriaIcono }));
  if (estado.subcategoria && !subs.some(x => x.sub === estado.subcategoria)) subs.push({ sub: estado.subcategoria, ico: '🏷️' });
  const elegida = subs.find(x => x.sub === estado.subcategoria);
  const verSubs = subs.length > 0 && (!elegida || subsAbiertas);

  $('catElegida').innerHTML =
    `<button type="button" class="chip active chip-elegida" data-reabrir="cat" aria-label="Cambiar categoría">${iconoCategoria(estado.categoria)} ${esc(estado.categoria)} <span class="flecha">▾</span></button>` +
    (elegida && !verSubs ? `<button type="button" class="chip active chip-elegida" data-reabrir="sub" aria-label="Cambiar subcategoría">${elegida.ico || ''} ${esc(elegida.sub)} <span class="flecha">▾</span></button>` : '');

  $('subcategoriaChips').classList.toggle('oculto', !verSubs);
  if (verSubs) {
    $('subcategoriaChips').innerHTML = subs.map(x =>
      `<button type="button" class="chip${x.sub === estado.subcategoria ? ' marcada' : ''}" data-sub="${esc(x.sub)}">${x.ico || ''} ${esc(x.sub)}</button>`).join('');
  }
  // al editar una fila vieja sin subcategoría, la nota se sigue viendo mientras elegís
  mostrarDetalle(!verSubs || !!editandoId);
}
const renderCategoriaChips = renderCategoria;

function mostrarDetalle(si) {
  $('bloqueDetalle').classList.toggle('oculto', !si);
  actualizarBloquePrestamo();
  if (si) renderNotasSugeridas();
}

function elegirCategoria(cat) {
  if (cat !== estado.categoria) {
    estado.categoria = cat;
    estado.subcategoria = subsDe(cat).length ? null : '';
    document.querySelectorAll('#notasChips .chip').forEach(c => c.classList.remove('active'));
  }
  grillaAbierta = false;
  subsAbiertas = false;
  renderCategoria();
}

// un solo listener por grupo (delegación), así los chips que se repintan siguen respondiendo
$('categoriaChips').addEventListener('click', (e) => {
  const btn = e.target.closest('.cat-tile');
  if (btn) elegirCategoria(btn.dataset.cat);
});
$('catElegida').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-reabrir]');
  if (!btn) return;
  if (btn.dataset.reabrir === 'cat') grillaAbierta = true; else subsAbiertas = true;
  renderCategoria();
});
$('subcategoriaChips').addEventListener('click', (e) => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  estado.subcategoria = btn.dataset.sub;
  subsAbiertas = false;
  renderCategoria();
});

// Al editar: deja el movimiento exactamente como estaba. Si su categoría o subcategoría
// ya no existen en la taxonomía se muestran igual, y si no tenía subcategoría no se le
// inventa una.
function seleccionarCategoria(cat, sub) {
  estado.categoria = cat || null;
  estado.subcategoria = sub || '';
  grillaAbierta = !cat;
  subsAbiertas = false;
  renderCategoria();
}

// Las notas que más repetís en esta categoría, como chips de un toque: escribir
// "Coles" por centésima vez en el teclado del celu es lo más caro de cargar un gasto.
function renderNotasSugeridas() {
  if (!estado.categoria) {
    $('notasSugeridas').innerHTML = '';
    $('notasChips').innerHTML = '';
    return;
  }
  const frec = new Map();   // clave sin acentos -> { texto, veces, ultima }
  // con subcategoría elegida, las notas de esa subcategoría (las de Taxi/App no sirven
  // en Vuelos); si todavía no hay ninguna repetida ahí, las de toda la categoría
  const sub = estado.subcategoria;
  const repetidasEnSub = sub && movimientos.filter(m => m.categoria === estado.categoria && m.subcategoria === sub && m.nota).length > 2;
  for (const m of movimientos) {
    if (m.categoria !== estado.categoria || !m.nota) continue;
    if (repetidasEnSub && m.subcategoria !== sub) continue;
    const n = String(m.nota).trim();
    const k = sinAcentos(n);
    if (!k) continue;
    const e = frec.get(k);
    if (e) { e.veces++; if (m.fecha > e.ultima) e.ultima = m.fecha; }
    else frec.set(k, { texto: n, veces: 1, ultima: m.fecha });
  }
  const todas = [...frec.values()];
  // en el desplegable las más recientes; en los chips las más repetidas
  const recientes = todas.slice().sort((a, b) => (a.ultima < b.ultima ? 1 : -1)).slice(0, 12);
  $('notasSugeridas').innerHTML = recientes.map(e => `<option value="${esc(e.texto)}">`).join('');
  const top = todas.filter(e => e.veces > 1)
    .sort((a, b) => b.veces - a.veces || (a.ultima < b.ultima ? 1 : -1))
    .slice(0, 6);
  $('notasChips').innerHTML = top.map(e =>
    `<button type="button" class="chip" data-nota="${esc(e.texto)}">${esc(e.texto)}</button>`).join('');
}

$('notasChips').addEventListener('click', (e) => {
  const b = e.target.closest('.chip');
  if (!b) return;
  const input = $('nota');
  const yaEstaba = input.value.trim() === b.dataset.nota;
  input.value = yaEstaba ? '' : b.dataset.nota;
  document.querySelectorAll('#notasChips .chip').forEach(x =>
    x.classList.toggle('active', !yaEstaba && x === b));
});

// ---------- Guardar movimiento ----------
// En un préstamo la nota queda siempre como "Préstamo <persona>", así la pestaña
// Prestado puede listarlo sin depender de cómo se haya escrito ese día.
function notaFinal() {
  const nota = $('nota').value.trim();
  if (estado.tipo === 'Gasto' && estado.subcategoria === 'Préstamos') {
    const persona = $('persona').value.trim();
    if (persona) return `Préstamo ${persona}${nota ? ' · ' + nota : ''}`;
  }
  return nota;
}

function leerFormulario() {
  return {
    fecha: fechaValida($('fecha').value) ? $('fecha').value : '',
    tipo: estado.tipo,
    monto: montoNumerico($('monto')),
    moneda: estado.moneda,
    medioPago: estado.medio,
    categoria: estado.tipo === 'Transferencia' ? '' : (estado.categoria || ''),
    subcategoria: estado.tipo === 'Transferencia' ? '' : (estado.subcategoria || ''),
    nota: notaFinal(),
    monedaDestino: estado.tipo === 'Transferencia' ? estado.monedaDestino : '',
    medioPagoDestino: estado.tipo === 'Transferencia' ? estado.medioDestino : '',
    montoRecibido: estado.tipo === 'Transferencia' ? montoNumerico($('montoRecibido')) : '',
    grupo: ''
  };
}

let guardadoRecien = 0;
$('guardarBtn').addEventListener('click', () => {
  // el segundo toque de un doble toque llegaba con el formulario ya vacío y decía
  // "Poné un monto válido", que parece que falló
  if (Date.now() - guardadoRecien < 800 && !$('monto').value.trim()) return;
  const mov = leerFormulario();
  if (!isFinite(mov.monto) || mov.monto <= 0) { toast('Poné un monto válido'); return; }
  if (!mov.fecha) { toast('Falta la fecha: elegila con 📅'); return; }
  if (!apiUrl()) { toast('Primero configurá la conexión con tu planilla (⚙️)'); return; }
  // Antes la app preseleccionaba sola una categoría y una subcategoría, así que nunca
  // quedaban vacías. Ahora se eligen a mano: si falta alguna, se abre para elegirla.
  if (mov.tipo !== 'Transferencia') {
    // al editar, una fila vieja sin subcategoría se puede guardar tal cual; pero si le
    // cambiaste la categoría (o el tipo), hay que completarla como una nueva
    const exigir = !editandoId || mov.categoria !== categoriaOriginal;
    if (!mov.categoria) { toast('Elegí una categoría'); grillaAbierta = true; renderCategoria(); return; }
    if (exigir && subsDe(mov.categoria).length && !mov.subcategoria) { toast('Elegí una subcategoría'); subsAbiertas = true; renderCategoria(); return; }
    if (!editandoId && mov.tipo === 'Gasto' && mov.subcategoria === 'Préstamos' && !$('persona').value.trim()) {
      toast('¿A quién le prestás?'); $('persona').focus(); return;
    }
  }
  if (mov.tipo === 'Transferencia') {
    if (mov.moneda === mov.monedaDestino && mov.medioPago === mov.medioPagoDestino) { toast('La cuenta de origen y destino no pueden ser la misma'); return; }
    // misma moneda: si el recibido está vacío o es el que venía de antes de editar el
    // monto, sigue al monto. Antes, editar un pase de 100 a 150 dejaba el recibido en 100
    // y desaparecían 50 entre una cuenta y la otra.
    if (mov.moneda === mov.monedaDestino &&
        (!isFinite(mov.montoRecibido) || mov.montoRecibido <= 0 || (editandoId && mov.montoRecibido === montoOriginalEdicion))) {
      mov.montoRecibido = mov.monto;
    }
    if (!isFinite(mov.montoRecibido) || mov.montoRecibido <= 0) { toast('Poné el monto recibido en la cuenta destino'); return; }
  }

  try {
    if (editandoId) {
      guardarEdicion(editandoId, mov);
      return;
    }
    if (ligando && mov.tipo === 'Gasto') {
      // el grupo se muestra como un solo total: si un cargo va en otra moneda, la suma miente
      if (mov.moneda !== ligando.base.moneda) { toast(`Los cargos ligados van en ${ligando.base.moneda}, como el gasto base`); return; }
      mov.grupo = ligando.grupo;
      mov.fecha = ligando.base.fecha; // el grupo es un solo gasto: un solo día
    }
    const guardado = enviarMovimiento({ ...mov, id: nuevoId() });
    guardadoRecien = Date.now();
    $('monto').value = '';
    $('montoRecibido').value = '';
    $('nota').value = '';
    $('persona').value = '';
    $('calcHint').textContent = '';
    $('tasaHint').textContent = '';
    // la fecha y la cuenta quedan como estaban: cargar varios gastos del mismo día
    // atrasado no obliga a elegir "Ayer" cada vez. La categoría vuelve a abrirse,
    // salvo que estés ligando cargos, que comparten la del gasto base.
    // Ligar es de a un cargo: después de guardarlo se corta solo (antes quedaba prendido y
    // cualquier gasto de otro día terminaba pegado al grupo). Para sumar otro, "Otro más".
    if (ligando) { ligando = null; $('bannerLigar').classList.add('oculto'); }
    olvidarCategoria();
    renderCategoria();
    ultimoGuardado = guardado;
    renderUltimos();
    $('monto').focus();
  } catch (err) {
    vibrar([40, 60, 40]);
    toast(`No pude guardar: ${err.message}`, 6000);
  }
});

// ---------- Ligar cargos (un gasto que sale como varios cargos en la tarjeta) ----------
// El botón vive en la línea de "Último" que está arriba de Guardar.
function mostrarLigarRow() { renderUltimos(); }
function ocultarLigarRow() { renderUltimos(); }
function nombreMov(m) { return `${m.categoria || m.tipo}${m.subcategoria ? ' · ' + m.subcategoria : ''}`; }

function iniciarLigar() {
  if (!ultimoGuardado) return;
  if (editandoId) cancelarEdicion(); // si no, el "Guardar cambios" pisaba el movimiento editado
  ligando = { grupo: claveGrupo(ultimoGuardado), base: ultimoGuardado };
  estado.moneda = ultimoGuardado.moneda;
  $('moneda').value = ultimoGuardado.moneda;
  renderMedio('medioBtn', estado.moneda, ultimoGuardado.medioPago, fijarMedio);
  // tipo, fecha, cuenta y categoría son los del gasto base: se pide solo el monto
  aplicarTipo('Gasto');
  seleccionarCategoria(ultimoGuardado.categoria, ultimoGuardado.subcategoria);
  $('bannerLigar').classList.remove('oculto');
  $('bannerLigarTexto').textContent = `🔗 Ligando a: ${nombreMov(ultimoGuardado)} · ${cuandoFue(ultimoGuardado.fecha)} (${fmt(ultimoGuardado.monto, ultimoGuardado.moneda)})`;
  $('nota').value = '';
  renderUltimos();
  $('monto').focus();
}
$('cancelarLigarBtn').addEventListener('click', cancelarLigar);

function cancelarLigar() {
  ligando = null;
  $('bannerLigar').classList.add('oculto');
  renderUltimos();
}

// ---------- Edición ----------
$('cancelarEdicionBtn').addEventListener('click', cancelarEdicion);
$('duplicarBtn').addEventListener('click', () => {
  const original = movimientos.find(m => m.id === editandoId);
  if (!original) return;
  const copia = { ...original, id: nuevoId(), fecha: fechaLocalStr(new Date()), grupo: '' };
  delete copia.pendiente;
  delete copia.timestamp;
  cancelarEdicion();
  try {
    enviarMovimiento(copia);
  } catch (err) {
    toast(`No pude duplicar: ${err.message}`, 6000);
  }
});
$('borrarEdicionBtn').addEventListener('click', () => {
  const id = editandoId;
  if (!id) return;
  if (borrarMovimiento(id)) cancelarEdicion();
});

function resetFormularioCargar() {
  $('monto').value = '';
  $('montoRecibido').value = '';
  $('nota').value = '';
  $('persona').value = '';
  document.querySelectorAll('#notasChips .chip, #personaChips .chip').forEach(c => c.classList.remove('active'));
  $('calcHint').textContent = '';
  $('tasaHint').textContent = '';
  // si se venía de una edición, la fecha vuelve a la que tenías (cargando gastos de ayer,
  // revisar el último y cancelar no te pasa el siguiente a hoy)
  const previa = fechaAntesDeEditar;
  fechaAntesDeEditar = null;
  if (previa && previa.dias !== null) fijarFechaRelativa(previa.dias);
  else if (previa && fechaValida(previa.valor)) { $('fecha').value = previa.valor; marcarChipFecha(previa.valor); actualizarFechaHint(); }
  else fijarFechaRelativa(0);
  olvidarCategoria();
  aplicarTipo('Gasto');
  renderCategoria();
  $('bannerEdicion').classList.add('oculto');
  $('guardarBtn').textContent = 'Guardar';
}

function cancelarEdicion() {
  editandoId = null;
  volverACuentaHabitual();
  resetFormularioCargar();
}

// al salir de editar un movimiento en otra moneda, el formulario vuelve a la cuenta de siempre
function volverACuentaHabitual() {
  try {
    const c = JSON.parse(localStorage.getItem(LS_CUENTA) || 'null');
    if (!c || !MEDIOS_POR_MONEDA[c.moneda]) return;
    estado.moneda = c.moneda;
    $('moneda').value = c.moneda;
    renderMedio('medioBtn', c.moneda, c.medio, fijarMedio);
  } catch (err) { /* sin cuenta recordada */ }
}

let fechaAntesDeEditar = null; // { valor, dias } para volver a dejarla como estaba

function abrirEdicion(mov) {
  cancelarLigar();
  if (!editandoId) {
    const activo = document.querySelector('#fechaChips .chip.active');
    fechaAntesDeEditar = { valor: $('fecha').value, dias: activo && activo.dataset.dias !== undefined ? Number(activo.dataset.dias) : null };
  }
  categoriaOriginal = mov.categoria || '';
  editandoId = mov.id;
  mostrarVista('cargar');

  aplicarTipo(mov.tipo);

  const f = soloFecha(mov.fecha);
  $('fecha').value = fechaValida(f) ? f : ''; // una fecha rota en la planilla no se reemplaza por "hoy" en silencio
  if (fechaValida(f)) marcarChipFecha(f);
  else document.querySelectorAll('#fechaChips .chip').forEach(c => c.classList.toggle('active', c.id === 'chipOtraFecha'));
  actualizarFechaHint();

  estado.moneda = mov.moneda;
  $('moneda').value = mov.moneda;
  estado.medio = mov.medioPago;
  renderMedio('medioBtn', estado.moneda, estado.medio, fijarMedio);

  if (estado.tipo === 'Transferencia') {
    estado.monedaDestino = mov.monedaDestino;
    $('monedaDestino').value = mov.monedaDestino;
    estado.medioDestino = mov.medioPagoDestino;
    renderMedio('medioDestinoBtn', estado.monedaDestino, estado.medioDestino, fijarMedioDestino);
    $('montoRecibido').value = mov.montoRecibido || '';
  } else {
    seleccionarCategoria(mov.categoria, mov.subcategoria || '');
  }

  $('monto').value = mov.monto;
  montoOriginalEdicion = Number(mov.monto);
  // La persona se separa de la nota solo cuando la nota la escribió la propia app
  // ("Préstamo X · algo") y el bloque de persona está a la vista. Antes se hacía con
  // cualquier préstamo detectado: en uno de categoría Otros la nota se
  // vaciaba, el bloque de persona quedaba oculto y al guardar sin tocar nada la nota
  // llegaba vacía a la planilla y el préstamo desaparecía de Prestado.
  const notaMov = String(mov.nota || '');
  if (mov.tipo === 'Gasto' && mov.subcategoria === 'Préstamos' && RE_NOTA_PRESTAMO.test(notaMov)) {
    const resto = notaMov.split(' · ');
    $('persona').value = personaDe(mov);
    $('nota').value = resto.slice(1).join(' · ');
  } else {
    $('persona').value = '';
    $('nota').value = notaMov;
  }
  actualizarBloquePrestamo();
  $('calcHint').textContent = '';
  actualizarTasaHint();

  $('bannerEdicion').classList.remove('oculto');
  $('guardarBtn').textContent = 'Guardar cambios';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function guardarEdicion(id, mov) {
  const idx = movimientos.findIndex(m => m.id === id);
  if (idx === -1) { toast('No encuentro ese movimiento'); editandoId = null; resetFormularioCargar(); return; }
  const actual = movimientos[idx];
  const editado = { ...actual, ...mov, grupo: actual.grupo || '', pendiente: true };

  // si el alta de este movimiento todavía no salió del celu, se corrige ahí mismo;
  // si ya se intentó mandar (puede estar en la planilla), va como edición aparte
  const cola = leerCola();
  const alta = cola.find(o => o.op === 'alta' && o.id === id && !o.intentos);
  if (alta) {
    alta.mov = { ...alta.mov, ...mov, grupo: alta.mov.grupo || '' };
    escribirCola(cola);
  } else {
    encolarOp({ op: 'editar', id, mov: editado });
  }

  movimientos[idx] = editado;
  indiceBusqueda.delete(id);
  despuesDeCambiar(esMigrado(editado));
  vibrar(15);
  toast('Cambios guardados');
  editandoId = null;
  volverACuentaHabitual();
  resetFormularioCargar();
  sincronizarCola();
}

// ---------- Cola de operaciones ----------
// Todo lo que cambia datos se anota ACÁ primero y recién después se manda a la planilla.
// Si se corta la señal o se cierra la app a mitad de camino, la operación sigue en el celu
// y se reintenta sola. Entrada: { uid, op: 'alta'|'editar'|'borrar'|'config', id?, mov?, clave?, valor?, intentos }
function leerCola() {
  let cola;
  try { cola = JSON.parse(localStorage.getItem(LS_QUEUE) || '[]'); }
  catch (err) {
    // una cola ilegible no se pisa con la próxima escritura: se aparta para poder rescatarla
    try { localStorage.setItem('mango_cola_rota_' + Date.now(), localStorage.getItem(LS_QUEUE) || ''); } catch (e) { /* sin lugar */ }
    cola = [];
  }
  // formato viejo: el movimiento suelto era un alta
  return cola.map(e => e.op ? e : { uid: 'legacy-' + e.id, op: 'alta', id: e.id, mov: e, intentos: 0 });
}

function escribirCola(cola) {
  guardarLS(LS_QUEUE, JSON.stringify(cola, sinInternos));
  actualizarPill();
}

function encolarOp(op) {
  const cola = leerCola();
  cola.push({ uid: nuevoId(), intentos: 0, ...op });
  escribirCola(cola);
}

// la lista local = lo que dice la planilla + lo que todavía no le llegó
function aplicarCola(lista) {
  const cola = leerCola();
  // Por id siempre, haya cola o no: si la planilla tiene dos filas con el mismo id (un alta
  // que se mandó dos veces) se muestra una sola. Y lo que está borrado esperando el
  // "Deshacer" no vuelve a aparecer cuando llega una foto vieja de la planilla.
  const porId = new Map(lista.filter(m => !borradosEnEspera.has(m.id)).map(m => [m.id, m]));
  cola.forEach(op => {
    if (op.op === 'alta') {
      porId.set(op.id, { ...(porId.get(op.id) || {}), ...op.mov, pendiente: true });
    } else if (op.op === 'editar') {
      const base = porId.get(op.id);
      if (base) porId.set(op.id, { ...base, ...op.mov, pendiente: true });
    } else if (op.op === 'borrar') {
      porId.delete(op.id);
    }
  });
  borradosEnEspera.forEach((_, id) => porId.delete(id));
  return [...porId.values()];
}

function ejecutarOp(op) {
  if (op.op === 'alta') return apiPost(op.mov);
  if (op.op === 'editar') return apiPost({ action: 'editar', ...op.mov, id: op.id });
  if (op.op === 'borrar') return apiPost({ action: 'borrar', id: op.id });
  if (op.op === 'config') return apiPost({ action: 'config', clave: op.clave, valor: op.valor });
  return Promise.reject(new ApiError('operación desconocida: ' + op.op));
}

function confirmarOp(op, resp) {
  ultimaConfirmacion = Date.now();
  if (resp && resp.historialVersion) localStorage.setItem(LS_HIST_VER, String(resp.historialVersion));
  if (op.op === 'alta' || op.op === 'editar') {
    const quedanDelId = leerCola().some(o => o.id === op.id);
    if (!quedanDelId) {
      const m = movimientos.find(x => x.id === op.id);
      if (m) delete m.pendiente;
      document.querySelectorAll(`.gasto-item[data-id="${CSS.escape(op.id)}"] .badge-pendiente`).forEach(b => b.remove());
    }
    guardarCacheMovimientos(String(op.id).startsWith('mig-'));
  }
}

// Sube la cola de a una operación, en orden. Un solo sincronizador a la vez, y la cola
// se relee en cada paso: lo que se encole mientras tanto no se pierde.
async function sincronizarCola() {
  if (sincronizando || !apiUrl()) return;
  // con la app abierta en dos lados (la PWA y una pestaña), cada una subía la misma cola
  if (navigator.locks && !sincronizarCola._conCandado) {
    return navigator.locks.request('mango-cola', { ifAvailable: true }, async (candado) => {
      if (!candado) return; // otra pestaña está subiendo
      sincronizarCola._conCandado = true;
      try { await sincronizarCola(); } finally { sincronizarCola._conCandado = false; }
    });
  }
  sincronizando = true;
  actualizarPill();
  try {
    for (let paso = 0; paso < 500; paso++) {
      const cola = leerCola();
      const op = cola.find(o => !o.bloqueada);
      if (!op) break;
      // Un alta que ya salió y no contestó puede seguir corriendo en Apps Script. Si se
      // reenvía enseguida, el backend publicado (sin lock) la agrega dos veces. Se espera
      // un minuto y medio desde el último intento antes de volver a mandarla.
      if (op.op === 'alta' && op.intentos && op.ultimoIntento && Date.now() - op.ultimoIntento < 90000) {
        setTimeout(sincronizarCola, 90000 - (Date.now() - op.ultimoIntento) + 500);
        break;
      }

      // se anota el intento ANTES de mandar: si la respuesta se pierde, sabemos que pudo haber llegado
      op.intentos = (op.intentos || 0) + 1;
      op.ultimoIntento = Date.now();
      escribirCola(cola);

      let resp;
      try {
        resp = await ejecutarOp(op);
      } catch (err) {
        if (esErrorDeRed(err)) break; // sin señal: queda para la próxima
        errorSync = err.message;
        const actual = leerCola();
        const o = actual.find(x => x.uid === op.uid);
        if (o) {
          o.error = err.message;
          // una operación que la planilla rechaza tres veces se aparta para no trabar el resto
          if (err.message !== 'no autorizado' && o.intentos >= 3) o.bloqueada = true;
          escribirCola(actual);
        }
        if (err.message === 'no autorizado' || !o || !o.bloqueada) break;
        continue;
      }
      errorSync = '';
      escribirCola(leerCola().filter(o => o.uid !== op.uid));
      confirmarOp(op, resp);
      if (op.op === 'editar' && resp && resp.encontrado === false) {
        toast('Ojo: ese movimiento ya no estaba en la planilla, así que la corrección no se guardó. Cargalo de nuevo.', 8000);
      }
    }
  } finally {
    sincronizando = false;
    actualizarPill();
  }
}

function actualizarPill() {
  const pill = $('syncPill');
  const cola = leerCola();
  if (sincronizando && cola.length) {
    pill.textContent = `⏫ Subiendo ${cola.length}…`;
    pill.className = 'sync-pill subiendo';
    pill.hidden = false;
    return;
  }
  if (!cola.length) { pill.hidden = true; return; }
  const bloqueadas = cola.filter(o => o.bloqueada).length;
  pill.textContent = errorSync ? `⚠️ ${cola.length} sin subir` : `${cola.length} sin subir`;
  pill.title = errorSync ? `La planilla respondió: ${errorSync}` : 'Tocá para reintentar';
  pill.className = 'sync-pill' + (errorSync || bloqueadas ? ' error' : '');
  pill.hidden = false;
}

// ---------- Alta ----------
function ordenar() {
  movimientos.sort((a, b) => {
    const fa = soloFecha(a.fecha);
    const fb = soloFecha(b.fecha);
    if (fa !== fb) return fa < fb ? 1 : -1;
    const ta = a.timestamp || '';
    const tb = b.timestamp || '';
    return ta < tb ? 1 : (ta > tb ? -1 : 0);
  });
}

function despuesDeCambiar(incluirMigrados = false) {
  ordenar();
  guardarCacheMovimientos(incluirMigrados);
  movSucio = true;
  poblarFiltroMeses();
  renderUltimos();
  if (vistaActiva() === 'movimientos') renderMovimientos();
  if (vistaActiva() === 'activos') renderActivos();
  if (vistaActiva() === 'prestado') renderPrestado();
}

function agregarLocal(mov) {
  movimientos.unshift(mov);
  despuesDeCambiar();
}

// Primero en el celu, después en la planilla. El botón vuelve a estar libre al instante.
function enviarMovimiento(mov) {
  const completo = { ...mov, timestamp: tsLocal() };
  encolarOp({ op: 'alta', id: completo.id, mov: completo });
  // Desde acá el movimiento ya está a salvo en la cola. Si después falla el cache por
  // falta de lugar, antes decía "No pude guardar" y al reintentar quedaba duplicado.
  try { agregarLocal({ ...completo, pendiente: true }); }
  catch (err) {
    if (!movimientos.some(m => m.id === completo.id)) movimientos.unshift({ ...completo, pendiente: true });
    toast('Guardado, pero el celu se quedó sin lugar para la copia local. Probá "Volver a bajar todo el historial" en ⚙️', 7000);
    sincronizarCola();
    return completo;
  }
  vibrar(15);
  const dia = cuandoFue(completo.fecha);
  toast(navigator.onLine === false ? `Guardado (${dia}) en el celu; se sube cuando haya señal` : `Guardado · ${dia} 🥭`, 2000);
  sincronizarCola();
  return completo;
}

// ---------- Carga inicial ----------
// El historial migrado (miles de filas) casi no cambia, así que se trae una única vez y se cachea.
// En cada apertura solo se pide lo "reciente" (lo que vos vas cargando) junto con
// categorías y config, todo en UNA llamada (bootstrap).
function migradosLocales() {
  if (migradosMem) return migradosMem;
  const s = localStorage.getItem(LS_CACHE_MIGRADOS);
  try { migradosMem = s ? JSON.parse(s) : []; } catch (err) { migradosMem = []; }
  return migradosMem;
}

// La planilla puede devolver el monto como número o como texto, y el texto puede traer
// coma decimal ("4,21") si la hoja lo guardó como texto en vez de número. Number("4,21")
// da NaN, que después cae en 0: el movimiento aparece en la lista pero vale cero, y se
// lleva puesto los totales del mes, los saldos por cuenta y lo prestado. Se normaliza
// una sola vez al entrar, en vez de parchear cada cuenta que lo usa.
function numeroPlanilla(v) {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  if (v === null || v === undefined) return 0;
  const limpio = String(v).replace(/\s/g, '').replace(/[^\d,.-]/g, '');
  if (!limpio) return 0;
  // misma regla que lo que se tipea (normalizarToken): antes eran dos reglas distintas
  // y "1.500" valía 1500 al cargarlo y 1,5 al volver de la planilla
  const n = Number(normalizarToken(limpio));
  return isFinite(n) ? n : 0;
}

function normalizarMovimiento(m) {
  m.monto = numeroPlanilla(m.monto);
  if (m.montoRecibido !== '' && m.montoRecibido !== null && m.montoRecibido !== undefined) {
    m.montoRecibido = numeroPlanilla(m.montoRecibido);
  }
  return m;
}

function combinar(recientes, migrados) {
  movimientos = aplicarCola([...recientes, ...migrados].map(normalizarMovimiento));
  indiceBusqueda.clear();
  ordenar();
  movSucio = true;
  poblarFiltroMeses();
  renderUltimos();
  renderNotasSugeridas();
  if (vistaActiva() === 'movimientos') renderMovimientos();
  if (vistaActiva() === 'activos') renderActivos();
  if (vistaActiva() === 'prestado') renderPrestado();
}

function aplicarCategorias(data) {
  const fresca = JSON.stringify(data && data.length ? data : CATEGORIAS_DEFAULT);
  if (fresca !== JSON.stringify(categorias)) {
    categorias = JSON.parse(fresca);
    localStorage.setItem(LS_CACHE_CAT, fresca);
    if (!editandoId) renderCategoriaChips();
  }
}

function aplicarConfig(data) {
  config = data || {};
  // una clave que todavía no subió manda sobre lo que dice la planilla
  leerCola().filter(o => o.op === 'config').forEach(o => { config[o.clave] = o.valor; });
  localStorage.setItem(LS_CACHE_CONFIG, JSON.stringify(config));
  patrimonio = Number(config.patrimonioInvertido) || 0;
  if (vistaActiva() === 'activos') renderActivos();
  if (vistaActiva() === 'prestado') renderPrestado();
}

// escritura de Config (ancla de saldo, patrimonio) con la misma cola que los movimientos
function guardarConfig(clave, valor) {
  config[clave] = valor;
  localStorage.setItem(LS_CACHE_CONFIG, JSON.stringify(config));
  escribirCola(leerCola().filter(o => !(o.op === 'config' && o.clave === clave))); // la última escritura de la clave gana
  encolarOp({ op: 'config', clave, valor });
  sincronizarCola();
}

// Baja el historial completo por tandas. De una sola vez, 2800 filas por Apps Script
// se pasaban del timeout y quedaba silenciosamente sin historial. Cada tanda lee solo su rango.
async function descargarHistorial(totalEsperado) {
  const inicioBajada = Date.now();
  const migrados = [];
  const sueltos = [];   // lo que no es del historial: antes se descartaba y se confiaba
                        // en que "recientes" lo trajera igual; si no coincidían, se perdía
  let desde = 0;
  let total = totalEsperado || 0;
  let completo = false;

  for (let vuelta = 0; vuelta < 60; vuelta++) {
    const pag = await apiGet({ action: 'movimientos', desde, limite: PAGINA_HISTORIAL }, TIMEOUT_LARGO);

    if (Array.isArray(pag)) { // backend viejo: ignora "desde" y manda todo junto
      pag.forEach(m => (esMigrado(m) ? migrados : sueltos).push(m));
      total = pag.length;
      completo = true;
      break;
    }

    const filas = pag.filas || [];
    total = Number(pag.total) || total;
    filas.forEach(m => (esMigrado(m) ? migrados : sueltos).push(m));
    desde += filas.length;
    if (!filas.length || desde >= total) { completo = desde >= total; break; }
    toast(`Bajando tu historial… ${desde} de ${total}`, 60000);
  }

  // Un historial a medias NO pisa al que ya está guardado. Antes cualquier respuesta
  // corta (o vacía) se escribía igual y se llevaba puesto el historial entero, y en la
  // apertura siguiente las cuentas no cerraban y volvía a intentarlo, otra vez a medias.
  if (!completo || (total > 0 && migrados.length + sueltos.length < total)) {
    throw new Error('la bajada quedó incompleta');
  }

  guardarLS(LS_CACHE_MIGRADOS, JSON.stringify(migrados, sinInternos));
  migradosMem = migrados;
  if (ultimaConfirmacion > inicioBajada) {
    // mientras bajaba, la planilla confirmó algo que esta foto no tiene: los recientes
    // se quedan como están en memoria y la próxima sincronización trae la foto nueva
    combinar(movimientos.filter(m => !esMigrado(m)), migrados);
    return migrados.length;
  }
  // la bajada completa es la foto buena de las dos partes, no solo del historial
  guardarLS(LS_CACHE_RECIENTES, JSON.stringify(sueltos, sinInternos));
  combinar(sueltos, migrados);
  return migrados.length;
}

// Trae solo el bloque reciente leyendo la hoja de atrás para adelante. Pedir "todos los
// movimientos" (o "recientes") obliga al backend a leer y reformatear las miles de fechas
// del historial en CADA apertura: con la planilla grande y el celu lejos eso se pasaba del
// límite de espera, y la app se quedaba sin nada que mostrar.
async function bajarRecientes(total) {
  const recientes = [];
  let fin = total;
  for (let vuelta = 0; vuelta < 20 && fin > 0; vuelta++) {
    const desde = Math.max(0, fin - PAGINA_RECIENTES);
    const pag = await apiGet({ action: 'movimientos', desde, limite: fin - desde }, TIMEOUT_ARRANQUE);
    const filas = (pag && pag.filas) || [];
    if (!filas.length) break;
    // Se lleva TODO lo que no sea historial de esta tanda. Antes cortaba en el último
    // "mig-" contado desde abajo, así que una sola fila del historial traspapelada entre
    // lo reciente (por ejemplo una renumerada a mano) dejaba afuera todo lo que estaba
    // encima y la app arrancaba casi vacía, sin decir nada.
    recientes.push(...filas.filter(m => !esMigrado(m)));
    // si la tanda ya empieza dentro del historial, el bloque reciente quedó cubierto
    if (esMigrado(filas[0])) break;
    fin = desde;
  }
  return recientes;
}

async function cargarTodo() {
  const cachedRecientes = localStorage.getItem(LS_CACHE_RECIENTES);
  // si no hay nada que mostrar, la espera se ve; avisamos en vez de dejar la pantalla muda
  const avisoLento = (!cachedRecientes && localStorage.getItem(LS_CACHE_MIGRADOS) === null)
    ? setTimeout(() => toast('Bajando tus movimientos… puede tardar', 40000), 2500)
    : null;
  try { return await cargarTodoInterno(cachedRecientes); }
  finally { if (avisoLento) clearTimeout(avisoLento); }
}

async function cargarTodoInterno(cachedRecientes) {
  const hayMigradosCacheados = localStorage.getItem(LS_CACHE_MIGRADOS) !== null;
  ultimaSync = Date.now();
  const inicio = Date.now();
  let totalServidor = 0;
  let recientesServidor = null;

  try {
    // Sonda de UNA fila: dice cuántas filas tiene la planilla y si el backend sabe leer
    // por rango, sin obligarlo a tocar el historial. Es la llamada más barata que hay.
    //
    // Va SOLA. Antes iba en un Promise.all junto con categorías y config, y eso tenía dos
    // problemas: Apps Script atiende de a una por usuario, así que en paralelo no llegan
    // antes; y sobre todo, si fallaba cualquiera de las tres no se cargaba NADA, ni los
    // movimientos. Bastaba un tropiezo en la hoja Categorias para dejar la app vacía, con
    // un "Failed to fetch" que parecía un problema de conexión y no lo era.
    const sonda = await apiGet({ action: 'movimientos', desde: 0, limite: 1 }, TIMEOUT_ARRANQUE);

    if (sonda && !Array.isArray(sonda) && 'total' in sonda) {
      totalServidor = Number(sonda.total) || 0;
      recientesServidor = await bajarRecientes(totalServidor);
      // Si la hoja no tiene lo reciente al final (alguien la ordenó por fecha o metió una
      // fila a mano), la lectura desde abajo vuelve vacía. Eso no es "no hay recientes":
      // se baja la hoja entera, que separa bien las dos partes, en vez de pintar cero.
      let previos = 0;
      try { previos = JSON.parse(cachedRecientes || '[]').length; } catch (err) { /* cache roto */ }
      if (!recientesServidor.length && (previos > 0 || totalServidor > migradosLocales().length)) {
        await descargarHistorial(totalServidor);
        recientesServidor = movimientos.filter(m => !esMigrado(m) && !m.pendiente);
        localStorage.setItem(LS_HIST_VER, String(config.historialVersion || ''));
      }
    } else if (Array.isArray(sonda)) {
      // backend antiguo: ignora el rango y devuelve la hoja entera. Ya la tenemos acá,
      // así que no hace falta pedirla otra vez.
      recientesServidor = sonda.filter(m => !esMigrado(m));
      totalServidor = sonda.length;
      migradosMem = sonda.filter(esMigrado);
      guardarLS(LS_CACHE_MIGRADOS, JSON.stringify(migradosMem, sinInternos));
    } else {
      throw new Error('la planilla respondió algo que no entiendo');
    }

    // Categorías y config son accesorias: si alguna falla, quedan las que ya teníamos y
    // los movimientos se muestran igual. Nunca más pueden dejar la app en blanco.
    try { aplicarCategorias(await apiGet({ action: 'categorias' }, TIMEOUT_ARRANQUE)); }
    catch (err) { ultimoError = `categorias: ${String(err && err.message || err).slice(0, 80)}`; }
    try { aplicarConfig(await apiGet({ action: 'config' }, TIMEOUT_ARRANQUE)); }
    catch (err) { ultimoError = `config: ${String(err && err.message || err).slice(0, 80)}`; }

    if (ultimaConfirmacion > inicio) {
      // mientras esperábamos, la planilla confirmó algo de la cola: esta foto ya es vieja y
      // pisaría lo recién confirmado. La próxima sincronización la trae bien.
    } else {
      const str = JSON.stringify(recientesServidor);
      if (str !== cachedRecientes) { // si no cambió nada, no se vuelve a ordenar ni a pintar
        // Primero pintar, después guardar. Al revés, si el celu se queda sin
        // espacio para el cache la excepción se lleva puesto el render y los
        // movimientos nuevos no aparecen nunca, sin que nada lo diga.
        combinar(recientesServidor, migradosLocales());
        try {
          guardarLS(LS_CACHE_RECIENTES, str);
        } catch (err) {
          toast('Los datos están al día, pero no entran en la memoria del celu. '
              + 'Probá "Volver a bajar todo el historial" en ⚙️', 8000);
        }
      }
    }
  } catch (err) {
    anotarError('carga', err);
    // ojo con el orden: esErrorDeRed() da true para todo lo que no sea ApiError, así que
    // si se pregunta antes que por el timeout se come el caso y no se avisa nada.
    if (err instanceof ApiError) toast(`La planilla respondió: ${err.message}. Revisá la URL y la clave en ⚙️`, 6000);
    else if (esTimeout(err)) toast('Tu planilla tardó demasiado en responder. Probá otra vez; si sigue pasando, hay que actualizar el Apps Script.', 8000);
    // "Failed to fetch" a los pocos segundos no es falta de señal: es que el navegador no
    // pudo ni empezar la llamada. La causa habitual es que el Apps Script está publicado
    // con acceso restringido, y entonces Google redirige al login y el navegador lo corta.
    // Desde el navegador del celu la URL funciona igual (ahí hay sesión), así que sin este
    // mensaje uno jura que la planilla anda bien y busca el problema donde no está.
    else if (!cachedRecientes && !hayMigradosCacheados) {
      toast('No pude conectar con tu planilla. Si la dirección es correcta, en Apps Script '
          + 'poné Implementar → Administrar implementaciones → Quién tiene acceso: '
          + 'Cualquier usuario.', 11000);
    }
    return; // sin red no tiene sentido seguir; queda lo cacheado
  }

  // el historial se vuelve a bajar si falta, si las cuentas no cierran contra la planilla
  // (algo se agregó o borró desde otro dispositivo) o si se editó una fila vieja en otro lado
  const localTotal = recientesServidor.length + migradosLocales().length;
  const verServidor = String(config.historialVersion || '');
  const verLocal = localStorage.getItem(LS_HIST_VER) || '';
  const desincronizado = (totalServidor > 0 && localTotal !== totalServidor) || verServidor !== verLocal;
  if (!hayMigradosCacheados || desincronizado || forzarHistorial) {
    try {
      const n = await descargarHistorial(totalServidor);
      localStorage.setItem(LS_HIST_VER, verServidor);
      forzarHistorial = false;
      toast(hayMigradosCacheados ? 'Datos sincronizados' : `Historial listo: ${n} movimientos`);
    } catch (err) {
      toast('No pude bajar todo el historial. Probá de nuevo con mejor señal.');
    }
  }

  sincronizarCola();
}

// Al volver a la app (cambiar de pestaña, desbloquear el celu) se refresca sola,
// así lo que cargaste en el otro dispositivo aparece sin tener que tocar nada.
// La fecha elegida queda entre guardado y guardado, para cargar varios gastos del mismo
// día atrasado. Pero si salís de la app y volvés más de media hora después, ya es otra
// sesión de carga: vuelve a Hoy, así no se te va un gasto de hoy con la fecha de antes.
let ocultoDesde = 0;
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') ocultoDesde = Date.now();
});

function refrescarSiHaceFalta() {
  if (document.visibilityState !== 'visible') return;
  if (ocultoDesde && Date.now() - ocultoDesde > 30 * 60 * 1000 && !editandoId) {
    if (ligando) cancelarLigar();
    // si quedó algo a medio cargar (fuiste a la app del banco a mirar el monto), no se toca
    const aMedias = $('monto').value.trim() || $('nota').value.trim() || estado.categoria;
    if (!aMedias) fijarFechaRelativa(0);
  }
  ocultoDesde = 0;
  if (!apiUrl()) return;
  refrescarFechaChip();
  sincronizarCola();
  if (Date.now() - ultimaSync < 45000) return;
  cargarTodo();
}
document.addEventListener('visibilitychange', refrescarSiHaceFalta);
window.addEventListener('focus', refrescarSiHaceFalta);

// el historial migrado solo se reescribe cuando se tocó una de sus filas (casi nunca)
function guardarCacheMovimientos(incluirMigrados = false) {
  const recientes = movimientos.filter(m => !esMigrado(m));
  guardarLS(LS_CACHE_RECIENTES, JSON.stringify(recientes, sinInternos));
  if (incluirMigrados) {
    migradosMem = movimientos.filter(esMigrado);
    guardarLS(LS_CACHE_MIGRADOS, JSON.stringify(migradosMem, sinInternos));
  }
}

// ---------- Render de listas ----------
function iconoDe(mov) {
  if (mov.tipo === 'Transferencia') return '🔁';
  const match = fuenteCategorias().find(c => c.categoria === mov.categoria);
  return match ? match.categoriaIcono : '💸';
}

// agrupa los movimientos que comparten "grupo" (cargos ligados) en una sola entrada visual
function agruparMovimientos(lista) {
  const porClave = new Map();
  lista.forEach(m => {
    const k = claveGrupo(m);
    if (!porClave.has(k)) porClave.set(k, []);
    porClave.get(k).push(m);
  });
  const salida = [];
  const vistos = new Set();
  lista.forEach(m => {
    const k = claveGrupo(m);
    if (vistos.has(k)) return;
    vistos.add(k);
    const miembros = porClave.get(k);
    salida.push(miembros.length > 1 ? { grupo: k, miembros } : { mov: m });
  });
  return salida;
}

// El signo va explícito además del color: con sol fuerte el color solo no alcanza.
function signoDe(m) { return m.tipo === 'Ingreso' ? '+' : (m.tipo === 'Gasto' ? '−' : ''); }
function cuentaDe(m) {
  if (m.tipo !== 'Transferencia') return m.medioPago || m.moneda;
  const llego = m.monedaDestino && m.monedaDestino !== m.moneda && Number(m.montoRecibido) > 0
    ? ` (llegaron ${fmt(m.montoRecibido, m.monedaDestino)})` : '';
  return `${m.moneda} ${m.medioPago} → ${m.monedaDestino} ${m.medioPagoDestino}${llego}`;
}

// La nota es lo que identifica el gasto ("Coles", "Santarasa"), así que va de
// primera; la categoría pasa a la segunda línea. Si no hay nota, manda la categoría.
function htmlFila(m, extra = '') {
  const nota = String(m.nota || '').trim();
  const titulo = nota || nombreMov(m);
  const meta = nota ? `${nombreMov(m)} · ${cuentaDe(m)}` : cuentaDe(m);
  return `
    <div class="gasto-item ${extra}" data-id="${esc(m.id)}">
      <div class="gasto-ico">${iconoDe(m)}</div>
      <div class="gasto-texto">
        <div class="titulo">${esc(titulo)}${m.pendiente ? '<span class="badge-pendiente" title="Todavía no llegó a la planilla">pendiente</span>' : ''}</div>
        <div class="meta">${esc(meta)}</div>
      </div>
      <div class="gasto-monto ${(m.tipo || 'Gasto').toLowerCase()}">${signoDe(m)}${fmt(m.monto, m.moneda)}</div>
    </div>`;
}

function htmlGrupo(g) {
  const base = g.miembros[0];
  const total = g.miembros.reduce((s, m) => s + (Number(m.monto) || 0), 0);
  const abierto = gruposAbiertos.has(g.grupo);
  const notas = [...new Set(g.miembros.map(m => String(m.nota || '').trim()).filter(Boolean))].join(' + ');
  return `
    <div class="gasto-item grupo-item${abierto ? ' abierto' : ''}" data-grupo="${esc(g.grupo)}">
      <div class="gasto-ico">${iconoDe(base)}</div>
      <div class="gasto-texto">
        <div class="titulo">${esc(notas || nombreMov(base))}<span class="badge-grupo">${g.miembros.length} cargos</span></div>
        <div class="meta">${esc(nombreMov(base))} · ${esc(cuentaDe(base))}</div>
      </div>
      <div class="gasto-monto ${(base.tipo || 'Gasto').toLowerCase()}">${signoDe(base)}${fmt(total, base.moneda)}</div>
      <span class="grupo-flecha">${abierto ? '▾' : '▸'}</span>
    </div>
    <div class="grupo-miembros${abierto ? '' : ' oculto'}" data-grupo-de="${esc(g.grupo)}">
      ${g.miembros.map(m => htmlFila(m, 'miembro')).join('')}
    </div>`;
}

// Una sola línea con lo último que cargaste, para chequear si ya lo anotaste sin que
// ocupe media pantalla. Tocarla abre ese movimiento para corregirlo; la lista completa
// está en Movimientos.
function cuandoFue(f) {
  const v = soloFecha(f);
  const hoy = new Date();
  const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
  if (v === fechaLocalStr(hoy)) return 'hoy';
  if (v === fechaLocalStr(ayer)) return 'ayer';
  if (!fechaValida(v)) return v;
  const [y, m, d] = v.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }).replace(/\./g, '');
}

function renderUltimos() {
  const cont = $('ultimoLinea');
  if (!cont) return;
  // lo último que guardaste en esta sesión, aunque tenga fecha vieja; si no, lo más nuevo
  const m = (ultimoGuardado && movimientos.find(x => x.id === ultimoGuardado.id)) || movimientos[0];
  if (!m) {
    cont.innerHTML = '<span class="ultimo-vacio">Todavía no cargaste nada. Ni un mango 🥭</span>';
    return;
  }
  const titulo = String(m.nota || '').trim() || nombreMov(m);
  const ligable = !!ultimoGuardado && m.id === ultimoGuardado.id && m.tipo === 'Gasto' && !editandoId && estado.tipo === 'Gasto';
  cont.innerHTML =
    `<button type="button" class="ultimo-btn" data-id="${esc(m.id)}" aria-label="Corregir el último movimiento">` +
      `<span class="ultimo-txt">${m.pendiente ? '⏳ ' : ''}Último, ${esc(cuandoFue(m.fecha))}: ${esc(titulo)}</span>` +
      `<b class="${(m.tipo || 'Gasto').toLowerCase()}">${signoDe(m)}${fmt(m.monto, m.moneda)}</b>` +
    `</button>` +
    (ligable ? `<button type="button" class="ligar-mini" id="ligarBtn" title="Cuando un gasto sale como varios cargos: envío, propina, dos pagos">🔗 ${m.grupo ? 'Otro más' : 'Ligar'}</button>` : '');
}

$('ultimoLinea').addEventListener('click', (e) => {
  if (e.target.closest('#ligarBtn')) { iniciarLigar(); return; }
  const b = e.target.closest('.ultimo-btn');
  if (!b) return;
  const mov = movimientos.find(m => m.id === b.dataset.id);
  if (mov) abrirEdicion(mov);
});

// un solo listener por lista (delegación): no importa cuántas filas haya
function delegarLista(cont) {
  cont.addEventListener('click', (e) => {
    if (e.target.id === 'verTodoBtn') {
      ['filtroTipo', 'filtroMoneda', 'filtroMes'].forEach(id => { $(id).value = ''; });
      $('filtroMes').dataset.tocado = '1';
      $('buscar').value = '';
      limiteRender = PAGINA;
      movSucio = true;
      renderMovimientos();
      return;
    }
    const grupo = e.target.closest('.grupo-item');
    if (grupo) {
      const k = grupo.dataset.grupo;
      if (gruposAbiertos.has(k)) gruposAbiertos.delete(k); else gruposAbiertos.add(k);
      grupo.classList.toggle('abierto');
      grupo.querySelector('.grupo-flecha').textContent = gruposAbiertos.has(k) ? '▾' : '▸';
      const miembros = cont.querySelector(`.grupo-miembros[data-grupo-de="${CSS.escape(k)}"]`);
      if (miembros) miembros.classList.toggle('oculto');
      return;
    }
    const fila = e.target.closest('.gasto-item');
    if (fila && fila.dataset.id) {
      const mov = movimientos.find(m => m.id === fila.dataset.id);
      if (mov) abrirEdicion(mov);
    }
  });
}
delegarLista($('listaMovimientos'));

function poblarFiltroMeses() {
  const select = $('filtroMes');
  const actual = select.value;
  const mesHoy = fechaLocalStr(new Date()).slice(0, 7);
  const conDatos = new Set(movimientos.map(m => mesDe(m.fecha)).filter(Boolean));
  const meses = [...conDatos].sort().reverse();
  if (!meses.includes(mesHoy)) meses.unshift(mesHoy);
  select.innerHTML = '<option value="">Todos los meses</option>' +
    meses.map(m => `<option value="${m}">${nombreMes(m)}</option>`).join('');
  if (select.dataset.tocado) { select.value = actual; return; }
  // por defecto el mes actual, pero si todavía no cargaste nada este mes mostramos
  // el último mes con movimientos en vez de una lista vacía
  select.value = conDatos.has(mesHoy) ? mesHoy : (meses.find(m => conDatos.has(m)) || '');
}

['filtroTipo', 'filtroMoneda'].forEach(id => $(id).addEventListener('change', () => { limiteRender = PAGINA; movSucio = true; renderMovimientos(); }));
$('filtroMes').addEventListener('change', () => { $('filtroMes').dataset.tocado = '1'; limiteRender = PAGINA; movSucio = true; renderMovimientos(); });
let tBuscar = null;
$('buscar').addEventListener('input', () => {
  clearTimeout(tBuscar);
  tBuscar = setTimeout(() => { limiteRender = PAGINA; movSucio = true; renderMovimientos(); }, 150);
});
$('mostrarMasBtn').addEventListener('click', () => { limiteRender += 200; renderMovimientos(true); });

function textoBusqueda(m) {
  let t = indiceBusqueda.get(m.id);
  if (t === undefined) {
    t = sinAcentos(`${m.nota} ${m.categoria} ${m.subcategoria}`);
    indiceBusqueda.set(m.id, t);
  }
  return t;
}

function filtrarMovimientos() {
  const filtroTipo = $('filtroTipo').value;
  const filtroMoneda = $('filtroMoneda').value;
  const filtroMes = $('filtroMes').value;
  const q = sinAcentos($('buscar').value.trim());
  // si buscás, la búsqueda recorre todos los meses: el selector de mes se apaga para que
  // no parezca que el total es del mes elegido
  $('filtroMes').disabled = !!q;
  $('filtroMes').title = q ? 'Buscando en todos los meses' : '';
  return movimientos.filter(m =>
    (!filtroTipo || m.tipo === filtroTipo) &&
    (!filtroMoneda || m.moneda === filtroMoneda) &&
    (q || !filtroMes || mesDe(m.fecha) === filtroMes) && // si buscás, la búsqueda manda sobre el mes
    (!q || textoBusqueda(m).includes(q))
  );
}

// "Mostrar más" agrega solo las filas nuevas al final, sin reconstruir la lista entera
let entradasRender = [];
let yaRenderizadas = 0;
let ultimoMesRender = null;

function renderMovimientos(soloAgregar = false) {
  if (!soloAgregar && !movSucio) return;
  const cont = $('listaMovimientos');

  if (!soloAgregar) {
    movSucio = false;
    const filtrados = filtrarMovimientos();
    renderTotales(filtrados);
    entradasRender = agruparMovimientos(filtrados);
    yaRenderizadas = 0;
    ultimoMesRender = null;
    cont.innerHTML = '';

    if (!entradasRender.length) {
      const hayOtros = movimientos.length > 0;
      cont.innerHTML = hayOtros
        ? `<div class="vacio">No hay movimientos con estos filtros<br><button type="button" class="link-btn" id="verTodoBtn">Ver todos</button></div>`
        : '<div class="vacio">Todavía no hay movimientos acá</div>';
      $('mostrarMasBtn').classList.add('oculto');
      return;
    }
  }

  // Agrupadas por día con el total del día al costado. Sin contenedor por día:
  // "Mostrar más" corta en cualquier lado y un div abierto a mitad de tanda no
  // se puede continuar después (el parser lo cierra solo).
  const nuevas = entradasRender.slice(yaRenderizadas, limiteRender);
  let html = '';
  nuevas.forEach(e => {
    const base = e.mov || e.miembros[0];
    const dia = soloFecha(base.fecha);
    if (dia !== ultimoMesRender) {
      html += `<div class="dia-header">
          <div class="dia-nombre">${esc(etiquetaDia(dia))}<span class="dia-fecha">${esc(dia)}</span></div>
          <div class="dia-total">${totalDelDia(dia)}</div>
        </div>`;
      ultimoMesRender = dia;
    }
    html += e.mov ? htmlFila(e.mov) : htmlGrupo(e);
  });
  cont.insertAdjacentHTML('beforeend', html);
  yaRenderizadas = Math.min(limiteRender, entradasRender.length);
  $('mostrarMasBtn').classList.toggle('oculto', entradasRender.length <= yaRenderizadas);
  $('mostrarMasBtn').textContent = `Mostrar más (${entradasRender.length - yaRenderizadas} restantes)`;
}

// total gastado ese día, en las monedas que haya, respetando el filtro activo
function totalDelDia(dia) {
  const porMoneda = {};
  entradasRender.forEach(e => {
    (e.mov ? [e.mov] : e.miembros).forEach(m => {
      if (soloFecha(m.fecha) !== dia || m.tipo !== 'Gasto' || !esConsumo(m)) return;
      porMoneda[m.moneda] = (porMoneda[m.moneda] || 0) + (Number(m.monto) || 0);
    });
  });
  return Object.entries(porMoneda).map(([mon, v]) => `−${fmt(v, mon)}`).join(' · ');
}

// Los totales dicen lo mismo que el Resumen: el gasto es consumo. Préstamos, inversiones
// y cambios de moneda van en un chip aparte; antes se sumaban al gasto y el mismo mes
// daba miles acá y unos cientos en Resumen.
function renderTotales(lista) {
  const porMoneda = {};
  lista.forEach(m => {
    if (m.tipo === 'Transferencia') return;
    const t = porMoneda[m.moneda] = porMoneda[m.moneda] || { gasto: 0, ingreso: 0, otro: 0 };
    const monto = Number(m.monto) || 0;
    if (m.tipo === 'Ingreso') t.ingreso += monto;
    else if (esConsumo(m)) t.gasto += monto;
    else t.otro += monto;
  });
  $('totales').innerHTML = Object.entries(porMoneda).map(([moneda, t]) =>
    `<div class="total-chip">💸 <b class="gasto">${fmt(t.gasto, moneda)}</b></div>
     <div class="total-chip">💰 <b class="ingreso">${fmt(t.ingreso, moneda)}</b></div>` +
    (t.otro ? `<div class="total-chip" title="Préstamos, inversiones y cambios de moneda: salieron, pero no son gasto">↪ <b>${fmt(t.otro, moneda)}</b> no es gasto</div>` : '')
  ).join('') || '';
}

// toast con un botón de acción (ej. "Deshacer"); devuelve una función para cerrarlo
function toastAccion(msg, etiqueta, accion, ms) {
  const el = $('toast');
  el.innerHTML = '';
  el.append(msg);
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = etiqueta;
  b.addEventListener('click', () => { cerrar(); accion(); });
  el.appendChild(b);
  el.classList.add('show');
  clearTimeout(el._t);
  el._accion = true;
  el._accionHasta = Date.now() + ms;
  const cerrar = () => { el.classList.remove('show'); el.innerHTML = ''; el._accion = false; };
  el._t = setTimeout(cerrar, ms);
  return cerrar;
}

// Borrar sin cartel de confirmación: se saca al instante, con 5 segundos para deshacer.
// Recién después se anota en la cola. Si la app se va a segundo plano antes, se anota ya
// (si no, el timer nunca corre y el movimiento vuelve a aparecer en el próximo refresco).

function confirmarBorrado(id) {
  const b = borradosEnEspera.get(id);
  if (!b) return;
  clearTimeout(b.timer);
  borradosEnEspera.delete(id);
  // si el alta nunca salió del celu, alcanza con descartarla; si pudo haber llegado, se pide borrar
  const cola = leerCola();
  const altaSinMandar = cola.some(o => o.op === 'alta' && o.id === id && !o.intentos);
  escribirCola(cola.filter(o => !((o.op === 'alta' || o.op === 'editar') && o.id === id)));
  if (!altaSinMandar) encolarOp({ op: 'borrar', id });
  sincronizarCola();
}

function borrarMovimiento(id) {
  const idx = movimientos.findIndex(m => m.id === id);
  if (idx === -1) return false;
  const mov = movimientos[idx];
  movimientos.splice(idx, 1);
  indiceBusqueda.delete(id);
  despuesDeCambiar(esMigrado(mov));

  const timer = setTimeout(() => confirmarBorrado(id), 5200);
  borradosEnEspera.set(id, { mov, timer });

  toastAccion(`Borrado: ${nombreMov(mov)} ${fmt(mov.monto, mov.moneda)}`, 'Deshacer', () => {
    const b = borradosEnEspera.get(id);
    if (!b) return;
    clearTimeout(b.timer);
    borradosEnEspera.delete(id);
    if (!movimientos.some(m => m.id === id)) movimientos.push(mov);
    despuesDeCambiar(esMigrado(mov));
  }, 5000);
  return true;
}

function confirmarBorradosPendientes() {
  if (!borradosEnEspera.size) return;
  [...borradosEnEspera.keys()].forEach(confirmarBorrado);
  // el "Deshacer" ya no puede deshacer nada: que no quede un botón que no hace nada
  const t = $('toast');
  if (t._accion) { t.classList.remove('show'); t.innerHTML = ''; t._accion = false; }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') confirmarBorradosPendientes(); });
window.addEventListener('pagehide', confirmarBorradosPendientes);

// ---------- Resumen (Activos) ----------
function medioDesdeClave(moneda, medioCrudo) {
  const opciones = MEDIOS_POR_MONEDA[moneda] || [];
  const sinEsp = (s) => String(s).replace(/\s/g, '').toLowerCase();
  const match = opciones.find(o => sinEsp(o.v) === sinEsp(medioCrudo));
  return match ? match.v : medioCrudo;
}

// Dos formas de anclar una cuenta:
// - saldoAjuste_<MON>_<medio> = {"saldo", "fecha", "ts"}: el saldo real que viste en el
//   banco ese día. Se suman solo los movimientos POSTERIORES: uno con fecha anterior que
//   cargás después ya estaba reflejado en el banco, así que no mueve el saldo. (Antes
//   cargar un gasto viejo después de ajustar dejaba el saldo corrido.)
// - saldoInicial_<MON>_<medio> (formato viejo, sin fecha): + todos los no migrados.
// Una cuenta sin ninguna de las dos no tiene saldo conocido: se muestra "sin ajustar".
function leerAjuste(v) {
  try { const a = typeof v === 'string' ? JSON.parse(v) : v; return a && fechaValida(a.fecha) && isFinite(Number(a.saldo)) ? a : null; }
  catch (err) { return null; }
}

function cuentaAfecta(m, a) {
  if (soloFecha(m.fecha) > a.fecha) return true;
  if (soloFecha(m.fecha) < a.fecha) return false;
  // mismo día que el ajuste: cuenta solo lo que se cargó después de ajustar
  return !!m.pendiente || (/^\d{4}-\d{2}-\d{2}T/.test(m.timestamp || '') && m.timestamp > a.ts);
}

function calcularSaldos() {
  const saldos = {};
  const anclas = {};      // saldoInicial viejo
  const ajustes = {};     // saldoAjuste con fecha
  Object.keys(config).forEach(k => {
    let m = k.match(/^saldoAjuste_([A-Z]{3})_(.+)$/);
    if (m) {
      const a = leerAjuste(config[k]);
      if (a) ajustes[`${m[1]} ${medioDesdeClave(m[1], m[2])}`] = a;
      return;
    }
    m = k.match(/^saldoInicial_([A-Z]{3})_(.+)$/);
    if (m) anclas[`${m[1]} ${medioDesdeClave(m[1], m[2])}`] = Number(config[k]) || 0;
  });
  const conocidas = new Set([...Object.keys(anclas), ...Object.keys(ajustes)]);
  conocidas.forEach(c => { saldos[c] = ajustes[c] ? Number(ajustes[c].saldo) : anclas[c]; });

  const mover = (cuenta, delta, m) => {
    if (!conocidas.has(cuenta)) { saldos[cuenta] = null; return; } // cuenta sin ajustar: aparece, sin número
    const a = ajustes[cuenta];
    if (a ? !cuentaAfecta(m, a) : esMigrado(m)) return;
    saldos[cuenta] += delta;
  };
  movimientos.forEach(m => {
    const monto = Number(m.monto) || 0;
    if (m.tipo === 'Ingreso') mover(`${m.moneda} ${m.medioPago}`, monto, m);
    else if (m.tipo === 'Gasto') mover(`${m.moneda} ${m.medioPago}`, -monto, m);
    else if (m.tipo === 'Transferencia') {
      mover(`${m.moneda} ${m.medioPago}`, -monto, m);
      mover(`${m.monedaDestino} ${m.medioPagoDestino}`, Number(m.montoRecibido) || 0, m);
    }
  });
  // las cuentas sin ajustar que solo aparecen en el historial viejo no se listan
  Object.keys(saldos).forEach(c => {
    if (saldos[c] === null && !movimientos.some(m => !esMigrado(m) && (`${m.moneda} ${m.medioPago}` === c || `${m.monedaDestino} ${m.medioPagoDestino}` === c))) delete saldos[c];
  });
  return { saldos, anclas, ajustes };
}

const ORDEN_MONEDAS = ['AUD', 'EUR', 'ARS', 'USD'];
function ordenCuentas(a, b) {
  const [ma, ...ra] = a.split(' '); const [mb, ...rb] = b.split(' ');
  const d = (ORDEN_MONEDAS.indexOf(ma) + 99) % 99 - (ORDEN_MONEDAS.indexOf(mb) + 99) % 99;
  return d || ra.join(' ').localeCompare(rb.join(' '));
}

function renderActivos() {
  if (!mesResumen) mesResumen = fechaLocalStr(new Date()).slice(0, 7);

  const { saldos } = calcularSaldos();
  const entradas = Object.entries(saldos).sort((a, b) => ordenCuentas(a[0], b[0]));
  $('saldosCuentas').innerHTML = entradas.length
    ? entradas.map(([cuenta, saldo]) => saldo === null
        ? `<div class="saldo-row" data-cuenta="${esc(cuenta)}"><span>${esc(cuenta)}</span><b class="sin-ajustar">poné el saldo real ›</b></div>`
        : `<div class="saldo-row" data-cuenta="${esc(cuenta)}"><span>${esc(cuenta)}</span><b class="${saldo < 0 ? 'neg' : 'pos'}">${fmt(saldo)}</b></div>`
      ).join('')
    : '<div class="vacio">Todavía no hay movimientos</div>';

  renderResumenMes();
  renderTendencia();
  if (document.activeElement !== $('patrimonioInput')) $('patrimonioInput').value = patrimonio || '';
}

$('saldosCuentas').addEventListener('click', (e) => {
  const fila = e.target.closest('.saldo-row');
  if (!fila) return;
  abrirAjuste(fila.dataset.cuenta);
});

$('mesAnteriorBtn').addEventListener('click', () => { mesResumen = sumarMeses(mesResumen, -1); catAbierta = null; renderResumenMes(); });
$('mesSiguienteBtn').addEventListener('click', () => {
  if (mesResumen >= fechaLocalStr(new Date()).slice(0, 7)) return;
  mesResumen = sumarMeses(mesResumen, 1); catAbierta = null; renderResumenMes();
});

let catAbierta = null;        // categoría desplegada en el resumen
let monedaTendencia = null;   // moneda elegida en el gráfico de 6 meses

// Gasto por categoría de un mes, contando solo consumo real.
function gastoPorCategoria(ym, moneda) {
  const cats = {};
  let total = 0;
  movimientos.forEach(m => {
    if (mesDe(m.fecha) !== ym || m.moneda !== moneda || m.tipo !== 'Gasto') return;
    if (!esConsumo(m)) return;
    const monto = Number(m.monto) || 0;
    const cat = m.categoria || 'Otros';
    cats[cat] = (cats[cat] || 0) + monto;
    total += monto;
  });
  return { cats, total };
}

// Promedio de los meses COMPLETOS anteriores. El mes en curso nunca entra al
// promedio: si no, se compara medio mes contra meses enteros y todo parece bajar.
function promedioCategorias(ym, moneda, cantidad = 6) {
  const suma = {};
  const presencias = {};
  let totalSuma = 0;
  for (let i = 1; i <= cantidad; i++) {
    const mes = sumarMeses(ym, -i);
    const { cats, total } = gastoPorCategoria(mes, moneda);
    totalSuma += total;
    Object.entries(cats).forEach(([c, v]) => {
      suma[c] = (suma[c] || 0) + v;
      presencias[c] = (presencias[c] || 0) + 1;
    });
  }
  const prom = {};
  Object.keys(suma).forEach(c => { prom[c] = suma[c] / cantidad; });
  return { prom, presencias, promTotal: totalSuma / cantidad };
}

function htmlDelta(actual, promedio, presencias, aEstaAltura = false) {
  // con pocos datos el porcentaje miente: un solo regalo da +400%
  if (presencias < 3 || promedio < 1) return '';
  const pct = Math.round((actual - promedio) / promedio * 100);
  if (Math.abs(pct) < 15) return `<span class="delta igual">${aEstaAltura ? 'como siempre a esta altura' : 'igual que siempre'}</span>`;
  const clase = pct > 0 ? 'sube' : 'baja';
  return `<span class="delta ${clase}">${pct > 0 ? '+' : ''}${pct}% vs ${aEstaAltura ? 'otros meses a esta altura' : 'promedio'}</span>`;
}

function renderResumenMes() {
  const mesHoy = fechaLocalStr(new Date()).slice(0, 7);
  const esMesActual = mesResumen === mesHoy;
  const hoy = new Date();
  const diaDeHoy = esMesActual ? hoy.getDate() : diasDelMes(mesResumen);

  $('mesTitulo').textContent = nombreMes(mesResumen);
  $('mesSiguienteBtn').disabled = mesResumen >= mesHoy;
  $('mesSub').textContent = esMesActual
    ? `En curso · día ${diaDeHoy} de ${diasDelMes(mesResumen)}`
    : '';

  const delMes = movimientos.filter(m => mesDe(m.fecha) === mesResumen && m.tipo !== 'Transferencia');
  if (!delMes.length) {
    $('resumenMes').innerHTML = '<div class="card"><div class="vacio">Sin movimientos este mes</div></div>';
    $('ritmoMes').innerHTML = '';
    $('noComputado').innerHTML = '';
    return;
  }

  // por moneda: consumo, ingresos, y lo que no es ninguna de las dos cosas
  const porMoneda = {};
  delMes.forEach(m => {
    const p = porMoneda[m.moneda] = porMoneda[m.moneda] ||
      { gasto: 0, ingreso: 0, inversion: 0, cambio: 0, prestamo: 0 };
    const monto = Number(m.monto) || 0;
    if (m.tipo === 'Ingreso') { p.ingreso += monto; return; }
    const clase = claseMovimiento(m);
    if (clase === 'consumo') p.gasto += monto;
    else if (p[clase] !== undefined) p[clase] += monto;
  });

  // Orden por cantidad de movimientos, no por monto: un alquiler en pesos son millones y
  // le ganaba a un mes entero en AUD, y el Ritmo del mes salía en ARS.
  const cuantos = {};
  delMes.forEach(m => { cuantos[m.moneda] = (cuantos[m.moneda] || 0) + 1; });
  const monedas = Object.keys(porMoneda).sort((a, b) => cuantos[b] - cuantos[a]);

  $('resumenMes').innerHTML = monedas.map(moneda => {
    const p = porMoneda[moneda];
    const { cats, total } = gastoPorCategoria(mesResumen, moneda);
    const { prom, presencias } = promedioCategorias(mesResumen, moneda);
    const ordenadas = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    const max = ordenadas.length ? ordenadas[0][1] : 1;

    // el ahorro solo tiene sentido donde entra plata; en euros sin sueldo no dice nada
    const hayIngresos = p.ingreso > 0;
    const ahorro = p.ingreso - p.gasto;

    return `
      <div class="card">
        <div class="moneda-titulo">${esc(moneda)}</div>
        <div class="stats">
          <div class="stat"><div class="stat-label">Gastado</div>
            <div class="stat-valor gasto">${fmtStat(p.gasto)}</div></div>
          <div class="stat"><div class="stat-label">Ingresado</div>
            <div class="stat-valor ingreso">${fmtStat(p.ingreso)}</div></div>
          ${hayIngresos ? `<div class="stat"><div class="stat-label">Ahorro</div>
            <div class="stat-valor ${ahorro < 0 ? 'gasto' : 'ingreso'}">${fmtStat(ahorro)}</div></div>` : ''}
        </div>
        ${ordenadas.map(([cat, valor]) => {
          const ico = (fuenteCategorias().find(c => c.categoria === cat) || {}).categoriaIcono || '💸';
          const pct = total ? Math.round(valor / total * 100) : 0;
          const abierta = catAbierta === `${moneda}|${cat}`;
          return `
            <div class="barra-row" data-cat="${esc(cat)}" data-moneda="${esc(moneda)}">
              <div class="barra-top">
                <div class="barra-label"><span class="ico">${ico}</span>${esc(cat)}</div>
                <div class="barra-valor">${fmt(valor, moneda)}</div>
              </div>
              <div class="barra-sub">
                <span class="barra-pct">${pct}% del gasto</span>
                ${esMesActual
                  // en el mes en curso se compara contra lo esperable a esta altura, y
                  // la primera semana no se compara: un alquiler el día 1 lo distorsiona todo
                  ? (diaDeHoy >= 7 ? htmlDelta(valor, (prom[cat] || 0) * diaDeHoy / diasDelMes(mesResumen), presencias[cat] || 0, true) : '')
                  : htmlDelta(valor, prom[cat] || 0, presencias[cat] || 0)}
              </div>
              <div class="barra-pista"><div class="barra" style="width:${Math.max(2, valor / max * 100)}%"></div></div>
              ${abierta ? detalleCategoria(mesResumen, moneda, cat) : ''}
            </div>`;
        }).join('')}
      </div>`;
  }).join('');

  renderRitmo(porMoneda, monedas, esMesActual, diaDeHoy);
  renderNoComputado(porMoneda, monedas);
}

// Al tocar una categoría se abre acá mismo: primero las subcategorías, después
// los movimientos. Evita tener que ir a Movimientos y pelear con los filtros.
function detalleCategoria(ym, moneda, cat) {
  const items = movimientos.filter(m =>
    mesDe(m.fecha) === ym && m.moneda === moneda && m.tipo === 'Gasto' &&
    (m.categoria || 'Otros') === cat && esConsumo(m));
  const subs = {};
  items.forEach(m => {
    const k = m.subcategoria || 'Sin subcategoría';
    subs[k] = (subs[k] || 0) + (Number(m.monto) || 0);
  });
  const filasSub = Object.entries(subs).sort((a, b) => b[1] - a[1]);
  const top = items.slice().sort((a, b) => b.monto - a.monto).slice(0, 8);
  return `
    <div class="detalle">
      ${filasSub.length > 1 ? filasSub.map(([s, v]) =>
        `<div class="detalle-row"><span class="d-nombre">${esc(s)}</span><span class="d-monto">${fmt(v, moneda)}</span></div>`).join('') : ''}
      ${top.map(m =>
        `<div class="detalle-row"><span class="d-nombre">${esc(soloFecha(m.fecha).slice(5))} · ${esc(String(m.nota || m.subcategoria || '—').trim())}</span><span class="d-monto">${fmt(m.monto, moneda)}</span></div>`).join('')}
      ${items.length > 8 ? `<div class="detalle-row"><span class="d-nombre">y ${items.length - 8} más</span><span class="d-monto"></span></div>` : ''}
    </div>`;
}

$('resumenMes').addEventListener('click', (e) => {
  const fila = e.target.closest('.barra-row');
  if (!fila) return;
  const k = `${fila.dataset.moneda}|${fila.dataset.cat}`;
  catAbierta = catAbierta === k ? null : k;
  renderResumenMes();
});

// ¿Voy bien este mes? Ritmo diario y proyección al cierre.
function renderRitmo(porMoneda, monedas, esMesActual, dia) {
  if (!esMesActual || !monedas.length) { $('ritmoMes').innerHTML = ''; return; }
  const moneda = monedas[0];                    // la moneda donde más se gasta
  const gastado = porMoneda[moneda].gasto;
  const total = diasDelMes(mesResumen);
  const porDia = dia > 0 ? gastado / dia : 0;
  const { promTotal } = promedioCategorias(mesResumen, moneda);

  // La proyección usa el ritmo de los meses anteriores, no el de este mes:
  // si el alquiler cae el día 1, extrapolar el propio mes da un disparate.
  // Sin meses anteriores en esa moneda no hay base: extrapolar el propio mes da cualquier cosa.
  const hayHistoria = promTotal > 0;
  const proyeccion = hayHistoria ? gastado + (promTotal / 30) * Math.max(0, total - dia) : gastado;
  const referencia = promTotal > 0 ? promTotal : proyeccion;
  const escala = Math.max(proyeccion, referencia, 1);

  $('ritmoMes').innerHTML = `
    <div class="card">
      <div class="card-title">Ritmo del mes · ${esc(moneda)}</div>
      <div class="ritmo-cifras">
        <div class="ritmo-item"><div class="r-label">Llevás</div><div class="r-valor">${fmtStat(gastado)}</div></div>
        <div class="ritmo-item"><div class="r-label">Por día</div><div class="r-valor">${fmtStat(porDia)}</div></div>
        <div class="ritmo-item"><div class="r-label">Proyección</div><div class="r-valor">${hayHistoria ? fmtStat(proyeccion) : '—'}</div></div>
      </div>
      <div class="ritmo-pista">
        <div class="ritmo-barra${promTotal > 0 && proyeccion > promTotal ? ' pasado' : ''}" style="width:${Math.min(100, gastado / escala * 100)}%"></div>
        ${promTotal > 0 ? `<div class="ritmo-marca" style="left:${Math.min(99, promTotal / escala * 100)}%" title="promedio de los últimos 6 meses"></div>` : ''}
      </div>
      <div class="ritmo-pie">
        <span>día ${dia} de ${total}</span>
        ${promTotal > 0 ? `<span>promedio: ${fmtStat(promTotal)}</span>` : ''}
      </div>
    </div>`;
}

// Inversiones, cambios de moneda y préstamos: salieron de la cuenta pero no son
// consumo. Se muestran aparte para que no inflen el gasto del mes.
function renderNoComputado(porMoneda, monedas) {
  const filas = [];
  monedas.forEach(moneda => {
    const p = porMoneda[moneda];
    if (p.inversion > 0) filas.push(['📈', 'Invertido', 'ETF, cripto, acciones', p.inversion, moneda]);
    if (p.cambio > 0) filas.push(['💱', 'Cambiado de moneda', 'sigue siendo tuyo, en otro bolsillo', p.cambio, moneda]);
    if (p.prestamo > 0) filas.push(['🤝', 'Prestado', 'lo seguís en la pestaña Prestado', p.prestamo, moneda]);
  });
  if (!filas.length) { $('noComputado').innerHTML = ''; return; }
  $('noComputado').innerHTML = `
    <div class="card">
      <div class="card-title">Salió de la cuenta, pero no es gasto</div>
      ${filas.map(([ico, t, s, v, mon]) => `
        <div class="nc-row">
          <div class="gasto-ico">${ico}</div>
          <div class="nc-texto"><div class="t">${t}</div><div class="s">${s}</div></div>
          <div class="nc-monto">${fmt(v, mon)}</div>
        </div>`).join('')}
    </div>`;
}

// Gasto de consumo de los últimos 6 meses, una moneda por vez.
function renderTendencia() {
  const mesHoy = fechaLocalStr(new Date()).slice(0, 7);
  const meses = [];
  for (let i = 5; i >= 0; i--) meses.push(sumarMeses(mesHoy, -i));

  const porMoneda = {};
  movimientos.forEach(m => {
    if (m.tipo !== 'Gasto' || !esConsumo(m)) return;
    const mes = mesDe(m.fecha);
    if (!meses.includes(mes)) return;
    porMoneda[m.moneda] = porMoneda[m.moneda] || {};
    porMoneda[m.moneda][mes] = (porMoneda[m.moneda][mes] || 0) + (Number(m.monto) || 0);
  });

  const cuantos = {};
  movimientos.forEach(m => { if (m.tipo === 'Gasto' && meses.includes(mesDe(m.fecha))) cuantos[m.moneda] = (cuantos[m.moneda] || 0) + 1; });
  const monedas = Object.keys(porMoneda).sort((a, b) => (cuantos[b] || 0) - (cuantos[a] || 0));
  if (!monedas.length) {
    $('monedasTendencia').innerHTML = '';
    $('tendencia').innerHTML = '<div class="vacio">Sin gastos en los últimos 6 meses</div>';
    return;
  }
  if (!monedas.includes(monedaTendencia)) monedaTendencia = monedas[0];

  $('monedasTendencia').innerHTML = monedas.length > 1 ? monedas.map(mon =>
    `<button type="button" class="chip${mon === monedaTendencia ? ' active' : ''}" data-moneda="${esc(mon)}">${esc(mon)}</button>`).join('') : '';

  const valores = meses.map(mes => porMoneda[monedaTendencia][mes] || 0);
  const max = Math.max(...valores, 1);
  const W = 320, H = 130, pad = 6, base = H - 24, alto = base - 14;
  const ancho = (W - pad * 2) / meses.length;
  const barras = meses.map((mes, i) => {
    const v = valores[i];
    const h = Math.round(v / max * alto);
    const x = pad + i * ancho + ancho * 0.18;
    const w = ancho * 0.64;
    const y = base - h;
    const esActual = mes === mesHoy;
    return `
      <g>
        <title>${nombreMes(mes)}: ${fmt(v, monedaTendencia)}${esActual ? ' (mes en curso)' : ''}</title>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" class="tbar${esActual ? ' actual' : ''}"></rect>
        ${v ? `<text x="${x + w / 2}" y="${Math.max(y - 5, 10)}" class="tval">${fmtCorto(v)}</text>` : ''}
        <text x="${x + w / 2}" y="${H - 8}" class="tlab">${nombreMes(mes).slice(0, 3)}</text>
      </g>`;
  }).join('');

  $('tendencia').innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" class="tendencia-svg" role="img" aria-label="Gasto mensual en ${esc(monedaTendencia)}, últimos 6 meses">
      <line x1="${pad}" y1="${base}" x2="${W - pad}" y2="${base}" class="teje"></line>
      ${barras}
    </svg>
    <div class="muted-note">El último mes está en curso, así que la barra va a seguir creciendo.</div>`;
}

$('monedasTendencia').addEventListener('click', (e) => {
  const b = e.target.closest('.chip');
  if (!b) return;
  monedaTendencia = b.dataset.moneda;
  renderTendencia();
});

// ---------- Prestado ----------
// Un préstamo es un Gasto marcado como tal. Saldarlo no borra nada: escribe una
// marca en Config. La plata que vuelve se anota como Ingreso, como cualquier otra.
function prestamosActivos() {
  return movimientos
    .filter(m => m.tipo === 'Gasto' && esPrestamo(m))
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

// Modo revisión: muchos "préstamos" detectados son deudas viejas ya saldadas o pagos de
// deudas propias (la app los reconoce por la palabra "deuda"). En vez de marcarlos de a
// uno, se tocan los que todavía te deben y el resto pasa a Saldados de una sola vez.
let revisandoPrestamos = false;
let sigueDebiendo = new Set();

function fechaSaldado(m) {
  const v = String(config[claveDevuelto(m.id)] || '');
  return fechaValida(v) ? v : '';
}

function renderPrestado() {
  const todos = prestamosActivos();
  const activos = todos.filter(m => !estaDevuelto(m));
  // los saldados más recientes primero (por el día en que se saldaron)
  const saldados = todos.filter(estaDevuelto)
    .sort((a, b) => (fechaSaldado(a) < fechaSaldado(b) ? 1 : -1));
  if (!activos.length) revisandoPrestamos = false;

  const porMoneda = {};
  activos.forEach(m => { porMoneda[m.moneda] = (porMoneda[m.moneda] || 0) + (Number(m.monto) || 0); });
  const monedas = Object.entries(porMoneda).sort((a, b) => b[1] - a[1]);

  $('prestadoTotales').innerHTML = monedas.length
    ? monedas.map(([mon, v]) => `<div class="hero-monto">${fmt(v, mon)}</div>`).join('') +
      `<div class="hero-sub">${activos.length} préstamo${activos.length === 1 ? '' : 's'} sin volver${saldados.length ? ` · ${saldados.length} saldado${saldados.length === 1 ? '' : 's'}` : ''}</div>`
    : '<div class="hero-monto">Nada</div><div class="hero-sub">Nadie te debe plata</div>';

  if (revisandoPrestamos) {
    const pasan = activos.filter(m => !sigueDebiendo.has(m.id)).length;
    $('prestadoLista').innerHTML =
      `<div class="revision-ayuda">Tocá los que <b>todavía te deben</b>. El resto pasa a Saldados (se puede deshacer).</div>` +
      activos.map(m => htmlPrestamo(m, 'revision')).join('') +
      `<div class="revision-acciones">
        <button type="button" class="secondary" id="cancelarRevisionBtn">Cancelar</button>
        <button type="button" class="primary" id="confirmarRevisionBtn">${pasan ? `Listo · ${pasan} pasan a Saldados` : 'Listo · no cambia nada'}</button>
      </div>`;
    $('prestadoDevueltos').innerHTML = '';
    $('prestarBtn').classList.add('oculto');
    return;
  }
  $('prestarBtn').classList.remove('oculto');
  $('prestadoLista').innerHTML =
    (activos.length > 1 ? `<button type="button" class="link-btn" id="revisarPrestamosBtn">Revisar cuáles siguen pendientes</button>` : '') +
    activos.map(m => htmlPrestamo(m, 'activo')).join('');
  $('prestadoDevueltos').innerHTML = saldados.length
    ? `<details class="saldados"><summary class="card-title">Saldados (${saldados.length})</summary>${saldados.map(m => htmlPrestamo(m, 'saldado')).join('')}</details>`
    : '';
}

function htmlPrestamo(m, modo) {
  const persona = personaDe(m);
  const saldado = modo === 'saldado';
  const cuando = saldado
    ? (fechaSaldado(m) ? `Saldado el ${fechaCorta(fechaSaldado(m))}` : 'Saldado')
    : `Prestado el ${fechaCorta(soloFecha(m.fecha))}`;
  const accion = modo === 'revision'
    ? `<button type="button" class="prestamo-sigue${sigueDebiendo.has(m.id) ? ' on' : ''}" data-sigue="${esc(m.id)}" aria-pressed="${sigueDebiendo.has(m.id)}">${sigueDebiendo.has(m.id) ? '☑' : '☐'} Todavía me debe</button>`
    : `<button type="button" class="prestamo-saldar" data-saldar="${esc(m.id)}">${saldado ? 'Volver a pendiente' : 'Marcar como saldado ✓'}</button>`;
  return `
    <div class="prestamo-card${saldado ? ' devuelto' : ''}${modo === 'revision' && sigueDebiendo.has(m.id) ? ' sigue' : ''}" data-id="${esc(m.id)}">
      <div class="prestamo-top">
        <div class="avatar">${esc(iniciales(persona))}</div>
        <div class="prestamo-info">
          <div class="prestamo-nombre">${esc(persona)}</div>
          <div class="prestamo-fecha">${esc(cuando)} · ${esc(m.medioPago || '')}</div>
        </div>
        <div class="prestamo-monto">
          <div class="m">${fmt(m.monto)}</div>
          <div class="c">${esc(m.moneda)}</div>
        </div>
      </div>
      ${accion}
    </div>`;
}

$('view-prestado').addEventListener('click', (e) => {
  if (e.target.closest('#revisarPrestamosBtn')) {
    revisandoPrestamos = true;
    sigueDebiendo = new Set();
    renderPrestado();
    window.scrollTo({ top: 0 });
    return;
  }
  if (e.target.closest('#cancelarRevisionBtn')) { revisandoPrestamos = false; renderPrestado(); return; }
  if (e.target.closest('#confirmarRevisionBtn')) {
    const hoy = fechaLocalStr(new Date());
    const pasan = prestamosActivos().filter(m => !estaDevuelto(m) && !sigueDebiendo.has(m.id));
    revisandoPrestamos = false;
    if (!pasan.length) { toast('No cambió nada'); renderPrestado(); return; }
    // Se marcan ya en pantalla, pero se mandan a la planilla recién cuando vence el
    // "Deshacer" (o enseguida si la app pasa a segundo plano), como el borrado.
    pasan.forEach(m => { config[claveDevuelto(m.id)] = hoy; });
    renderPrestado();
    vibrar(15);
    let hecho = false;
    const confirmar = () => {
      if (hecho) return; hecho = true;
      window.removeEventListener('pagehide', confirmar);
      document.removeEventListener('visibilitychange', alOcultar);
      // los que volviste a pendiente mientras tanto no se saldan
      try { pasan.filter(m => config[claveDevuelto(m.id)] === hoy).forEach(m => guardarConfig(claveDevuelto(m.id), hoy)); }
      catch (err) { toast(`No pude guardar: ${err.message}`, 6000); }
    };
    const alOcultar = () => { if (document.visibilityState === 'hidden') confirmar(); };
    window.addEventListener('pagehide', confirmar);
    document.addEventListener('visibilitychange', alOcultar);
    const timer = setTimeout(confirmar, 6000);
    toastAccion(`${pasan.length} pasaron a Saldados`, 'Deshacer', () => {
      if (hecho) { pasan.forEach(m => guardarConfig(claveDevuelto(m.id), '')); renderPrestado(); return; }
      hecho = true; clearTimeout(timer);
      window.removeEventListener('pagehide', confirmar);
      document.removeEventListener('visibilitychange', alOcultar);
      pasan.forEach(m => { delete config[claveDevuelto(m.id)]; });
      renderPrestado();
    }, 5800);
    return;
  }
  const sigue = e.target.closest('[data-sigue]');
  if (sigue) {
    const id = sigue.dataset.sigue;
    if (sigueDebiendo.has(id)) sigueDebiendo.delete(id); else sigueDebiendo.add(id);
    renderPrestado();
    return;
  }
  const btn = e.target.closest('[data-saldar]');
  if (btn) {
    const id = btn.dataset.saldar;
    const mov = movimientos.find(m => m.id === id);
    if (!mov) return;
    try {
      const yaEstaba = estaDevuelto(mov);
      guardarConfig(claveDevuelto(id), yaEstaba ? '' : fechaLocalStr(new Date()));
      vibrar(15);
      toast(yaEstaba ? 'Vuelve a figurar como pendiente' : `${personaDe(mov)}: saldado`);
      renderPrestado();
    } catch (err) {
      toast(`No pude guardar: ${err.message}`, 6000);
    }
    return;
  }
  if (revisandoPrestamos) return; // en revisión, tocar la tarjeta no abre la edición
  const card = e.target.closest('.prestamo-card');
  if (card) {
    const mov = movimientos.find(m => m.id === card.dataset.id);
    if (mov) abrirEdicion(mov);
  }
});

$('prestarBtn').addEventListener('click', () => {
  cancelarLigar();
  cancelarEdicion();
  mostrarVista('cargar');
  aplicarTipo('Gasto');
  seleccionarCategoria('Finanzas', 'Préstamos');
  actualizarBloquePrestamo();
  $('monto').focus();
});

// ---------- Ajustar saldo ----------
function abrirAjuste(cuenta) {
  ajusteCuenta = cuenta;
  const { saldos } = calcularSaldos();
  const moneda = cuenta.split(' ')[0];
  $('ajusteTitulo').textContent = `Ajustar ${cuenta}`;
  $('ajusteEstimado').textContent = saldos[cuenta] === null || saldos[cuenta] === undefined
    ? 'Todavía no le pusiste el saldo real a esta cuenta.'
    : `Mango calcula ${fmt(saldos[cuenta], moneda)}.`;
  $('ajusteInput').value = '';
  $('ajusteOverlay').classList.add('active');
  setTimeout(() => $('ajusteInput').focus(), 50);
}
$('cerrarAjusteBtn').addEventListener('click', () => $('ajusteOverlay').classList.remove('active'));
$('guardarAjusteBtn').addEventListener('click', () => {
  const real = montoNumerico($('ajusteInput'));
  if (!isFinite(real)) { toast('Poné el saldo real'); return; }
  const cuenta = ajusteCuenta;
  const [moneda, ...resto] = cuenta.split(' ');
  const medio = resto.join(' ');
  // Se guarda el saldo real con la fecha y la hora de hoy (ver calcularSaldos).
  const ajuste = { saldo: Math.round(real * 100) / 100, fecha: fechaLocalStr(new Date()), ts: tsLocal() };

  try {
    guardarConfig(`saldoAjuste_${moneda}_${medio}`, JSON.stringify(ajuste));
  } catch (err) {
    toast(`No pude guardar: ${err.message}`, 6000);
    return;
  }
  $('ajusteOverlay').classList.remove('active');
  renderActivos();
  toast(`Listo: ${cuenta} ahora marca ${fmt(real, moneda)}`);
});

// ---------- Patrimonio ----------
$('guardarPatrimonioBtn').addEventListener('click', () => {
  const valor = montoNumerico($('patrimonioInput'));
  const v = isFinite(valor) ? valor : 0;
  patrimonio = v;
  try {
    guardarConfig('patrimonioInvertido', v);
    toast('Guardado');
  } catch (err) {
    toast(`No pude guardar: ${err.message}`, 6000);
  }
});

// ---------- Versión nueva (avisa el service worker) ----------
// Se puede recargar sola sin pisarle nada a nadie si no hay nada a medio cargar.
function seguroRecargar() {
  if (editandoId || ligando) return false;
  // una fecha, moneda o categoría ya elegidas se perderían con la recarga
  if (estado.categoria || estado.tipo !== 'Gasto') return false;
  if (!document.querySelector('#fechaChips .chip[data-dias="0"].active')) return false;
  if (document.querySelector('.overlay.active')) return false;
  if ($('monto').value.trim() || $('nota').value.trim()) return false;
  return leerCola().length === 0;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (!e.data || e.data.tipo !== 'nueva-version') return;
    // Antes esto solo mostraba un cartel. Si no lo tocabas (o no lo veías), te quedabas
    // con la versión vieja para siempre y los arreglos no llegaban nunca al celu.
    if (seguroRecargar()) { location.reload(); return; }
    $('avisoVersion').classList.remove('oculto');
  });
  $('actualizarBtn').addEventListener('click', () => location.reload());
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// ---------- Init ----------
function init() {
  document.body.classList.add('vista-cargar');
  // arranca en la última cuenta usada: en Europa EUR, en Australia y Bali AUD
  try {
    const c = JSON.parse(localStorage.getItem(LS_CUENTA) || 'null');
    if (c && MEDIOS_POR_MONEDA[c.moneda]) { estado.moneda = c.moneda; estado.medio = c.medio; }
  } catch (err) { /* sin cuenta recordada */ }
  $('fecha').value = fechaLocalStr(new Date());
  actualizarFechaHint();
  $('moneda').value = estado.moneda;
  $('monedaDestino').value = estado.monedaDestino;
  renderMedio('medioBtn', estado.moneda, estado.medio, fijarMedio);
  renderMedio('medioDestinoBtn', estado.monedaDestino, estado.medioDestino, fijarMedioDestino);

  // primero lo que ya tenemos en el celu, al instante
  const cachedCat = localStorage.getItem(LS_CACHE_CAT);
  try { categorias = cachedCat ? JSON.parse(cachedCat) : CATEGORIAS_DEFAULT; } catch (err) { categorias = CATEGORIAS_DEFAULT; }
  const cachedConfig = localStorage.getItem(LS_CACHE_CONFIG);
  try { config = cachedConfig ? JSON.parse(cachedConfig) : {}; } catch (err) { config = {}; }
  patrimonio = Number(config.patrimonioInvertido) || 0;
  let recientes = [];
  try { recientes = JSON.parse(localStorage.getItem(LS_CACHE_RECIENTES) || '[]'); } catch (err) { /* cache roto: se rehace del servidor */ }
  combinar(recientes, []);
  renderCategoriaChips();
  actualizarPill();

  // el historial (miles de filas) se parsea recién después del primer pintado, para no demorarlo
  setTimeout(() => {
    const mig = migradosLocales();
    if (mig.length) combinar(recientes, mig);
  }, 0);

  $('versionApp').textContent = `Mango ${VERSION}`;

  if (!apiUrl()) {
    $('configOverlay').classList.add('active');
    return;
  }
  sincronizarCola(); // lo pendiente sube ya, sin esperar a que termine (o falle) la carga
  cargarTodo();
  if (!editandoId) $('monto').focus();
}

window.addEventListener('online', sincronizarCola);
init();
