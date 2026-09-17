const VERSION = 'v13';   // tiene que coincidir con CACHE_NAME en sw.js
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
let ultimoError = '';        // para el diagnóstico de ⚙️: qué fue lo último que falló
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
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(Number(n) || 0);
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

function claseMovimiento(m) {
  if (m.tipo === 'Ingreso') return 'ingreso';
  if (m.tipo === 'Transferencia') return 'interno';
  if (m.categoria === 'Inversiones') return 'inversion';
  const texto = `${m.subcategoria || ''} ${m.nota || ''}`;
  if (m.categoria === 'Finanzas' && RE_CAMBIO.test(texto)) return 'cambio';
  if (m.subcategoria === 'Préstamos' || RE_PRESTAMO.test(texto)) return 'prestamo';
  return 'consumo';
}
const esConsumo = (m) => claseMovimiento(m) === 'consumo';
function esPrestamo(m) { return claseMovimiento(m) === 'prestamo'; }

// "Préstamo Ajeng" -> "Ajeng". Si no hay nombre, queda la nota entera.
function personaDe(m) {
  const n = String(m.nota || '').trim();
  // ojo: la preposición tiene que ir separada por espacios, si no "Préstamo Ajeng"
  // pierde la A inicial del nombre y queda "jeng"
  const sinPrefijo = n.replace(/^\s*(?:pr[eé]stamo|presto|deuda|le prest[eé])(?:\s+(?:a|de|para))?\s+/i, '').trim();
  return sinPrefijo || n || 'Sin nombre';
}
function iniciales(nombre) {
  const p = String(nombre).trim().split(/\s+/).filter(Boolean);
  return ((p[0] || '?')[0] + (p[1] ? p[1][0] : '')).toUpperCase();
}
// los préstamos saldados se marcan en Config, así no hace falta tocar la planilla
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
  const uc = t.lastIndexOf(',');
  const up = t.lastIndexOf('.');
  if (uc !== -1 && up !== -1) return uc > up ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  if (uc !== -1) return t.split(',').length > 2 ? t.replace(/,/g, '') : t.replace(',', '.');
  if (up !== -1) return /^\d{1,3}(\.\d{3})+$/.test(t) ? t.replace(/\./g, '') : t; // "1.500" = mil quinientos
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

$('monto').addEventListener('input', () => { actualizarCalcHint(); actualizarTasaHint(); });
$('montoRecibido').addEventListener('input', actualizarTasaHint);

['monto', 'montoRecibido'].forEach(id => {
  $(id).addEventListener('focus', () => { campoMonto = $(id); });
});

// Enter (o la tecla "Listo" del teclado del celu) guarda
['monto', 'montoRecibido', 'nota'].forEach(id => {
  $(id).addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); $('guardarBtn').click(); }
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
  estado.tipo = tipo;
  document.querySelectorAll('.tipo-btn').forEach(b => b.classList.toggle('active', b.dataset.tipo === tipo));
  $('bloqueTransferencia').classList.toggle('oculto', tipo !== 'Transferencia');
  $('bloqueCategoria').classList.toggle('oculto', tipo === 'Transferencia');
  $('labelCuenta').textContent = tipo === 'Transferencia' ? 'Cuenta de origen' : 'Cuenta';
  actualizarBloquePrestamo();
}

// al elegir Finanzas > Préstamos aparece "¿a quién?", para no depender de cómo
// venga escrita la nota cuando después haya que listarlo en Prestado
function actualizarBloquePrestamo() {
  const es = estado.tipo === 'Gasto' && estado.subcategoria === 'Préstamos';
  $('bloquePrestamo').classList.toggle('oculto', !es);
  if (es) renderPersonasSugeridas();
}

function renderPersonasSugeridas() {
  const vistas = new Map();
  for (const m of movimientos) {
    if (!esPrestamo(m) || m.tipo !== 'Gasto') continue;
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
// La fecha elegida se escribe completa debajo de los chips: si la app quedó
// abierta desde ayer y "Hoy" envejeció, se ve enseguida.
function actualizarContexto() {
  const v = $('fecha').value;
  $('fechaHint').textContent = fechaValida(v) ? fechaLarga(v) : 'Elegí una fecha con "Otra 📅"';
  $('contextoTexto').textContent = `${estado.moneda} ${estado.medio}`;
}
const actualizarFechaHint = actualizarContexto;

$('contextoBtn').addEventListener('click', () => {
  const abierto = $('contextoPanel').classList.toggle('oculto');
  $('contextoBtn').setAttribute('aria-expanded', String(!abierto));
});

// "Hoy" se recalcula al volver a la app: una PWA puede quedar abierta desde ayer
// y si no, el chip dice Hoy pero la fecha de abajo es la de ayer.
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
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#fechaChips .chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  const fechaInput = $('fecha');
  if (chip.id === 'chipOtraFecha') {
    fechaInput.classList.remove('oculto');
    try {
      if (typeof fechaInput.showPicker === 'function') fechaInput.showPicker();
      else fechaInput.focus();
    } catch (err) {
      fechaInput.focus();
    }
  } else {
    fechaInput.classList.add('oculto');
    refrescarFechaChip();
  }
});
$('fecha').addEventListener('change', actualizarFechaHint);
$('fecha').addEventListener('input', actualizarFechaHint);

// ---------- Cuenta (moneda + medio) ----------
function renderMedioChips(contId, moneda, medioActivo, onSelect) {
  const cont = $(contId);
  const opciones = [...(MEDIOS_POR_MONEDA[moneda] || [])];
  // un medio que ya no está en la lista (fila vieja) se muestra igual, para no reasignarlo sin querer
  if (medioActivo && !opciones.some(o => o.v === medioActivo)) opciones.push({ v: medioActivo, ico: '🏷️' });
  const activo = opciones.some(o => o.v === medioActivo) ? medioActivo : opciones[0].v;
  cont.innerHTML = opciones.map(o =>
    `<button type="button" class="chip${o.v === activo ? ' active' : ''}" data-medio="${esc(o.v)}">${o.ico} ${esc(o.v)}</button>`
  ).join('');
  onSelect(activo);
  cont.querySelectorAll('.chip').forEach(c => {
    c.addEventListener('click', () => {
      cont.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      onSelect(c.dataset.medio);
    });
  });
}

const fijarMedio = (m) => { estado.medio = m; actualizarContexto(); };

$('moneda').addEventListener('change', (e) => {
  estado.moneda = e.target.value;
  renderMedioChips('medioChips', estado.moneda, estado.medio, fijarMedio);
  actualizarTasaHint();
  actualizarContexto();
});
$('monedaDestino').addEventListener('change', (e) => {
  estado.monedaDestino = e.target.value;
  renderMedioChips('medioChipsDestino', estado.monedaDestino, estado.medioDestino, (m) => { estado.medioDestino = m; });
  actualizarTasaHint();
});

// ---------- Categorías / subcategorías ----------
function fuenteCategorias() { return categorias.length ? categorias : CATEGORIAS_DEFAULT; }

function subcategoriaSugerida(cat) {
  const usado = movimientos.find(m => m.categoria === cat && m.subcategoria); // movimientos viene ordenado por fecha desc
  if (usado) return usado.subcategoria;
  return SUB_SUGERIDA[cat] || null;
}

function htmlCatChip(cat, ico) {
  return `<button type="button" class="cat-chip" data-cat="${esc(cat)}"><span class="ico">${ico || '🏷️'}</span>${esc(cat)}</button>`;
}

const CATS_VISIBLES = 6;
let catsExpandidas = false;

// Once categorias a dos por fila son seis filas, y empujan la subcategoria y la
// nota fuera de pantalla. Se muestran las que mas usas y el resto queda detras
// de un "+ mas": casi siempre la que buscas ya esta en las primeras.
function ordenarPorUso(unicas) {
  const desde = sumarMeses(fechaLocalStr(new Date()).slice(0, 7), -3);
  const uso = {};
  for (const m of movimientos) {
    if (m.tipo !== estado.tipo || mesDe(m.fecha) < desde) continue;
    uso[m.categoria] = (uso[m.categoria] || 0) + 1;
  }
  return unicas.slice().sort((a, b) => (uso[b.categoria] || 0) - (uso[a.categoria] || 0));
}

function renderCategoriaChips() {
  const cont = $('categoriaChips');
  const delTipo = fuenteCategorias().filter(c => c.tipo === estado.tipo);
  const unicas = [];
  const vistas = new Set();
  delTipo.forEach(c => { if (!vistas.has(c.categoria)) { vistas.add(c.categoria); unicas.push(c); } });

  const orden = ordenarPorUso(unicas);
  const hayDeMas = orden.length > CATS_VISIBLES + 1;
  const mostradas = (catsExpandidas || !hayDeMas) ? orden : orden.slice(0, CATS_VISIBLES);

  cont.innerHTML = mostradas.map(c => htmlCatChip(c.categoria, c.categoriaIcono)).join('')
    + (hayDeMas ? `<button type="button" class="cat-chip mas-cats" id="masCats">${catsExpandidas ? '− menos' : `+ ${orden.length - CATS_VISIBLES} más`}</button>` : '');

  if (orden.length) {
    const activa = mostradas.find(c => c.categoria === estado.categoria) || orden[0];
    cont.querySelectorAll('.cat-chip').forEach(b => b.classList.toggle('active', b.dataset.cat === activa.categoria));
    estado.categoria = activa.categoria;
  } else {
    estado.categoria = null;
  }
  renderSubcategoriaChips();
  renderNotasSugeridas();
}

function activarCategoria(cat) {
  document.querySelectorAll('.cat-chip').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
  estado.categoria = cat;
  renderSubcategoriaChips();
  renderNotasSugeridas();
}

// un solo listener por grupo de chips (delegación), así los chips agregados al editar también responden
$('categoriaChips').addEventListener('click', (e) => {
  const btn = e.target.closest('.cat-chip');
  if (!btn) return;
  if (btn.id === 'masCats') { catsExpandidas = !catsExpandidas; renderCategoriaChips(); return; }
  activarCategoria(btn.dataset.cat);
});
$('subcategoriaChips').addEventListener('click', (e) => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  document.querySelectorAll('#subcategoriaChips .chip').forEach(b => b.classList.toggle('active', b === btn));
  estado.subcategoria = btn.dataset.sub;
  actualizarBloquePrestamo();
});

// Al editar: deja el movimiento exactamente como estaba. Si su categoría, subcategoría o
// medio ya no existen en la taxonomía, se muestran como chip extra; y si no tenía
// subcategoría, no se le inventa una.
function seleccionarCategoria(cat, sub) {
  const cont = $('categoriaChips');
  if (![...cont.querySelectorAll('.cat-chip')].some(b => b.dataset.cat === cat)) {
    catsExpandidas = true;
    renderCategoriaChips();
  }
  if (![...cont.querySelectorAll('.cat-chip')].some(b => b.dataset.cat === cat)) {
    cont.insertAdjacentHTML('beforeend', htmlCatChip(cat, '🏷️'));
  }
  activarCategoria(cat);

  const subCont = $('subcategoriaChips');
  if (sub) {
    if (![...subCont.querySelectorAll('.chip')].some(b => b.dataset.sub === sub)) {
      subCont.insertAdjacentHTML('beforeend', `<button type="button" class="chip" data-sub="${esc(sub)}">🏷️ ${esc(sub)}</button>`);
    }
    subCont.querySelectorAll('.chip').forEach(b => b.classList.toggle('active', b.dataset.sub === sub));
    estado.subcategoria = sub;
  } else {
    subCont.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
    estado.subcategoria = '';
  }
}

function renderSubcategoriaChips() {
  const cont = $('subcategoriaChips');
  const subs = fuenteCategorias().filter(c => c.tipo === estado.tipo && c.categoria === estado.categoria && c.subcategoria);

  if (!subs.length) {
    cont.innerHTML = '';
    estado.subcategoria = null;
    return;
  }

  const sugerida = subcategoriaSugerida(estado.categoria);
  const activa = subs.some(s => s.subcategoria === sugerida) ? sugerida : subs[0].subcategoria;
  cont.innerHTML = subs.map(s =>
    `<button type="button" class="chip${s.subcategoria === activa ? ' active' : ''}" data-sub="${esc(s.subcategoria)}">${s.subcategoriaIcono || ''} ${esc(s.subcategoria)}</button>`
  ).join('');
  estado.subcategoria = activa;
  actualizarBloquePrestamo();
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
  for (const m of movimientos) {
    if (m.categoria !== estado.categoria || !m.nota) continue;
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

$('guardarBtn').addEventListener('click', () => {
  const mov = leerFormulario();
  if (!isFinite(mov.monto) || mov.monto <= 0) { toast('Poné un monto válido'); return; }
  if (!mov.fecha) { toast('La fecha no es válida: elegila con "Otra 📅"'); return; }
  if (!apiUrl()) { toast('Primero configurá la conexión con tu planilla (⚙️)'); return; }
  if (mov.tipo === 'Transferencia') {
    if (mov.moneda === mov.monedaDestino && mov.medioPago === mov.medioPagoDestino) { toast('La cuenta de origen y destino no pueden ser la misma'); return; }
    if (!isFinite(mov.montoRecibido) || mov.montoRecibido <= 0) mov.montoRecibido = mov.moneda === mov.monedaDestino ? mov.monto : mov.montoRecibido;
    if (!isFinite(mov.montoRecibido) || mov.montoRecibido <= 0) { toast('Poné el monto recibido en la cuenta destino'); return; }
  }

  try {
    if (editandoId) {
      guardarEdicion(editandoId, mov);
      return;
    }
    if (ligando && mov.tipo === 'Gasto') mov.grupo = ligando.grupo;
    const guardado = enviarMovimiento({ ...mov, id: nuevoId() });
    $('monto').value = '';
    $('montoRecibido').value = '';
    $('nota').value = '';
    $('calcHint').textContent = '';
    $('tasaHint').textContent = '';
    if (guardado.tipo === 'Gasto') {
      ultimoGuardado = guardado;
      mostrarLigarRow(guardado);
    } else {
      ocultarLigarRow();
    }
    $('monto').focus();
  } catch (err) {
    vibrar([40, 60, 40]);
    toast(`No pude guardar: ${err.message}`, 6000);
  }
});

// ---------- Ligar cargos (un gasto que sale como varios cargos en la tarjeta) ----------
function mostrarLigarRow(mov) {
  const row = $('ligarRow');
  row.classList.remove('oculto');
  $('ligarBtn').textContent = ligando
    ? `🔗 Ligar un cargo más (${nombreMov(mov)}, ${fmt(mov.monto, mov.moneda)})`
    : `🔗 Ligar otro cargo a este gasto (${nombreMov(mov)}, ${fmt(mov.monto, mov.moneda)})`;
}
function ocultarLigarRow() { $('ligarRow').classList.add('oculto'); }
function nombreMov(m) { return `${m.categoria || m.tipo}${m.subcategoria ? ' · ' + m.subcategoria : ''}`; }

$('ligarBtn').addEventListener('click', () => {
  if (!ultimoGuardado) return;
  ligando = { grupo: claveGrupo(ultimoGuardado), base: ultimoGuardado };
  // dejamos tipo/fecha/cuenta/categoría como estaban (son los del gasto base) y pedimos solo el monto
  aplicarTipo('Gasto');
  $('bannerLigar').classList.remove('oculto');
  $('bannerLigarTexto').textContent = `🔗 Ligando a: ${nombreMov(ultimoGuardado)} (${fmt(ultimoGuardado.monto, ultimoGuardado.moneda)})`;
  $('nota').value = '';
  $('monto').focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
$('cancelarLigarBtn').addEventListener('click', cancelarLigar);

function cancelarLigar() {
  ligando = null;
  $('bannerLigar').classList.add('oculto');
  ocultarLigarRow();
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
  document.querySelectorAll('#fechaChips .chip').forEach(c => c.classList.remove('active'));
  $('fecha').classList.add('oculto');
  document.querySelector('#fechaChips .chip[data-dias="0"]').classList.add('active');
  $('fecha').value = fechaLocalStr(new Date());
  $('contextoPanel').classList.add('oculto');
  $('contextoBtn').setAttribute('aria-expanded', 'false');
  actualizarContexto();
  aplicarTipo('Gasto');
  renderCategoriaChips();
  $('bannerEdicion').classList.add('oculto');
  $('guardarBtn').textContent = 'Guardar';
}

function cancelarEdicion() {
  editandoId = null;
  resetFormularioCargar();
}

function abrirEdicion(mov) {
  cancelarLigar();
  editandoId = mov.id;
  mostrarVista('cargar');

  aplicarTipo(mov.tipo);

  document.querySelectorAll('#fechaChips .chip').forEach(c => c.classList.remove('active'));
  $('chipOtraFecha').classList.add('active');
  $('fecha').classList.remove('oculto');
  const f = soloFecha(mov.fecha);
  $('fecha').value = fechaValida(f) ? f : ''; // una fecha rota en la planilla no se reemplaza por "hoy" en silencio
  actualizarFechaHint();

  estado.moneda = mov.moneda;
  $('moneda').value = mov.moneda;
  estado.medio = mov.medioPago;
  renderMedioChips('medioChips', estado.moneda, estado.medio, fijarMedio);

  if (estado.tipo === 'Transferencia') {
    estado.monedaDestino = mov.monedaDestino;
    $('monedaDestino').value = mov.monedaDestino;
    estado.medioDestino = mov.medioPagoDestino;
    renderMedioChips('medioChipsDestino', estado.monedaDestino, estado.medioDestino, (m) => { estado.medioDestino = m; });
    $('montoRecibido').value = mov.montoRecibido || '';
  } else {
    renderCategoriaChips();
    if (mov.categoria) seleccionarCategoria(mov.categoria, mov.subcategoria || '');
  }

  $('monto').value = mov.monto;
  if (esPrestamo(mov) && mov.tipo === 'Gasto') {
    $('persona').value = personaDe(mov);
    $('nota').value = '';
  } else {
    $('persona').value = '';
    $('nota').value = mov.nota || '';
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
  resetFormularioCargar();
  sincronizarCola();
}

// ---------- Cola de operaciones ----------
// Todo lo que cambia datos se anota ACÁ primero y recién después se manda a la planilla.
// Si se corta la señal o se cierra la app a mitad de camino, la operación sigue en el celu
// y se reintenta sola. Entrada: { uid, op: 'alta'|'editar'|'borrar'|'config', id?, mov?, clave?, valor?, intentos }
function leerCola() {
  let cola;
  try { cola = JSON.parse(localStorage.getItem(LS_QUEUE) || '[]'); } catch (err) { cola = []; }
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
  if (!cola.length) return lista;
  const porId = new Map(lista.map(m => [m.id, m]));
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
  sincronizando = true;
  actualizarPill();
  try {
    for (let paso = 0; paso < 500; paso++) {
      const cola = leerCola();
      const op = cola.find(o => !o.bloqueada);
      if (!op) break;

      // se anota el intento ANTES de mandar: si la respuesta se pierde, sabemos que pudo haber llegado
      op.intentos = (op.intentos || 0) + 1;
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
  agregarLocal({ ...completo, pendiente: true });
  vibrar(15);
  toast(navigator.onLine === false ? 'Guardado en el celu; se sube cuando haya señal' : 'Guardado 🥭', 1800);
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
  // si hay coma es el decimal y el punto es separador de miles; si no, manda el punto
  const n = Number(limpio.includes(',') ? limpio.replace(/\./g, '').replace(',', '.') : limpio);
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
    // Van las tres juntas porque categorías y config no dependen del total.
    const [sonda, cats, cfg] = await Promise.all([
      apiGet({ action: 'movimientos', desde: 0, limite: 1 }, TIMEOUT_ARRANQUE),
      apiGet({ action: 'categorias' }, TIMEOUT_ARRANQUE),
      apiGet({ action: 'config' }, TIMEOUT_ARRANQUE)
    ]);

    if (sonda && !Array.isArray(sonda) && 'total' in sonda) {
      totalServidor = Number(sonda.total) || 0;
      aplicarCategorias(cats);
      aplicarConfig(cfg);
      recientesServidor = await bajarRecientes(totalServidor);
    } else if (Array.isArray(sonda)) {
      // backend antiguo: ignora el rango y devuelve la hoja entera. Ya la tenemos acá,
      // así que no hace falta pedirla otra vez.
      aplicarCategorias(cats);
      aplicarConfig(cfg);
      recientesServidor = sonda.filter(m => !esMigrado(m));
      totalServidor = sonda.length;
      migradosMem = sonda.filter(esMigrado);
      guardarLS(LS_CACHE_MIGRADOS, JSON.stringify(migradosMem, sinInternos));
    } else {
      throw new Error('la planilla respondió algo que no entiendo');
    }

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
function refrescarSiHaceFalta() {
  if (document.visibilityState !== 'visible' || !apiUrl()) return;
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
  return m.tipo === 'Transferencia'
    ? `${m.moneda} ${m.medioPago} → ${m.monedaDestino} ${m.medioPagoDestino}`
    : (m.medioPago || m.moneda);
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

function renderUltimos() {
  const cont = $('ultimosMovimientos');
  const entradas = agruparMovimientos(movimientos.slice(0, 12)).slice(0, 5);
  if (!entradas.length) {
    cont.innerHTML = '<div class="vacio">Todavía no cargaste nada. Ni un mango 🥭</div>';
    return;
  }
  cont.innerHTML = entradas.map(e => e.mov ? htmlFila(e.mov, 'mini') : htmlGrupo(e)).join('');
}

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
delegarLista($('ultimosMovimientos'));
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
      if (soloFecha(m.fecha) !== dia || m.tipo !== 'Gasto') return;
      porMoneda[m.moneda] = (porMoneda[m.moneda] || 0) + (Number(m.monto) || 0);
    });
  });
  return Object.entries(porMoneda).map(([mon, v]) => `−${fmt(v, mon)}`).join(' · ');
}

function renderTotales(lista) {
  const porMoneda = {};
  lista.forEach(m => {
    if (m.tipo === 'Transferencia') return;
    porMoneda[m.moneda] = porMoneda[m.moneda] || { gasto: 0, ingreso: 0 };
    if (m.tipo === 'Ingreso') porMoneda[m.moneda].ingreso += Number(m.monto) || 0;
    else porMoneda[m.moneda].gasto += Number(m.monto) || 0;
  });
  $('totales').innerHTML = Object.entries(porMoneda).map(([moneda, t]) =>
    `<div class="total-chip">💸 <b class="gasto">${fmt(t.gasto, moneda)}</b></div>
     <div class="total-chip">💰 <b class="ingreso">${fmt(t.ingreso, moneda)}</b></div>`
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
const borradosEnEspera = new Map(); // id -> { mov, timer, confirmar }

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
    movimientos.push(mov);
    despuesDeCambiar(esMigrado(mov));
  }, 5000);
  return true;
}

function confirmarBorradosPendientes() {
  [...borradosEnEspera.keys()].forEach(confirmarBorrado);
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

// saldo = ancla manual (saldoInicial_*) + suma de los movimientos NO migrados
function calcularSaldos() {
  const saldos = {};
  const anclas = {};
  Object.keys(config).forEach(k => {
    const m = k.match(/^saldoInicial_([A-Z]{3})_(.+)$/);
    if (m) {
      const cuenta = `${m[1]} ${medioDesdeClave(m[1], m[2])}`;
      anclas[cuenta] = Number(config[k]) || 0;
      saldos[cuenta] = anclas[cuenta];
    }
  });
  movimientos.forEach(m => {
    if (esMigrado(m)) return;
    const monto = Number(m.monto) || 0;
    if (m.tipo === 'Ingreso') {
      const k = `${m.moneda} ${m.medioPago}`;
      saldos[k] = (saldos[k] || 0) + monto;
    } else if (m.tipo === 'Gasto') {
      const k = `${m.moneda} ${m.medioPago}`;
      saldos[k] = (saldos[k] || 0) - monto;
    } else if (m.tipo === 'Transferencia') {
      const kO = `${m.moneda} ${m.medioPago}`;
      const kD = `${m.monedaDestino} ${m.medioPagoDestino}`;
      saldos[kO] = (saldos[kO] || 0) - monto;
      saldos[kD] = (saldos[kD] || 0) + (Number(m.montoRecibido) || 0);
    }
  });
  return { saldos, anclas };
}

function renderActivos() {
  if (!mesResumen) mesResumen = fechaLocalStr(new Date()).slice(0, 7);

  const { saldos } = calcularSaldos();
  const entradas = Object.entries(saldos);
  $('saldosCuentas').innerHTML = entradas.length
    ? entradas.map(([cuenta, saldo]) => {
        return `<div class="saldo-row" data-cuenta="${esc(cuenta)}"><span>${esc(cuenta)}</span><b class="${saldo < 0 ? 'neg' : 'pos'}">${fmt(saldo)}</b></div>`;
      }).join('')
    : '<div class="vacio">Todavía no hay movimientos</div>';

  renderResumenMes();
  renderTendencia();
  $('patrimonioInput').value = patrimonio || '';
}

$('saldosCuentas').addEventListener('click', (e) => {
  const fila = e.target.closest('.saldo-row');
  if (!fila) return;
  abrirAjuste(fila.dataset.cuenta);
});

$('mesAnteriorBtn').addEventListener('click', () => { mesResumen = sumarMeses(mesResumen, -1); catAbierta = null; renderResumenMes(); });
$('mesSiguienteBtn').addEventListener('click', () => { mesResumen = sumarMeses(mesResumen, 1); catAbierta = null; renderResumenMes(); });

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

function htmlDelta(actual, promedio, presencias) {
  // con pocos datos el porcentaje miente: un solo regalo da +400%
  if (presencias < 3 || promedio < 1) return '';
  const pct = Math.round((actual - promedio) / promedio * 100);
  if (Math.abs(pct) < 15) return '<span class="delta igual">igual que siempre</span>';
  const clase = pct > 0 ? 'sube' : 'baja';
  return `<span class="delta ${clase}">${pct > 0 ? '+' : ''}${pct}% vs promedio</span>`;
}

function renderResumenMes() {
  const mesHoy = fechaLocalStr(new Date()).slice(0, 7);
  const esMesActual = mesResumen === mesHoy;
  const hoy = new Date();
  const diaDeHoy = esMesActual ? hoy.getDate() : diasDelMes(mesResumen);

  $('mesTitulo').textContent = nombreMes(mesResumen);
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

  const monedas = Object.keys(porMoneda).sort((a, b) => porMoneda[b].gasto - porMoneda[a].gasto);

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
                ${htmlDelta(valor, prom[cat] || 0, presencias[cat] || 0)}
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
  const promDiaHistorico = promTotal > 0 ? promTotal / 30 : porDia;
  const proyeccion = gastado + promDiaHistorico * Math.max(0, total - dia);
  const referencia = promTotal > 0 ? promTotal : proyeccion;
  const escala = Math.max(proyeccion, referencia, 1);

  $('ritmoMes').innerHTML = `
    <div class="card">
      <div class="card-title">Ritmo del mes · ${esc(moneda)}</div>
      <div class="ritmo-cifras">
        <div class="ritmo-item"><div class="r-label">Llevás</div><div class="r-valor">${fmtStat(gastado)}</div></div>
        <div class="ritmo-item"><div class="r-label">Por día</div><div class="r-valor">${fmtStat(porDia)}</div></div>
        <div class="ritmo-item"><div class="r-label">Proyección</div><div class="r-valor">${fmtStat(proyeccion)}</div></div>
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

  const monedas = Object.keys(porMoneda)
    .sort((a, b) => Object.values(porMoneda[b]).reduce((x, y) => x + y, 0)
                  - Object.values(porMoneda[a]).reduce((x, y) => x + y, 0));
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

function renderPrestado() {
  const todos = prestamosActivos();
  const activos = todos.filter(m => !estaDevuelto(m));
  const devueltos = todos.filter(estaDevuelto).slice(0, 12);

  const porMoneda = {};
  activos.forEach(m => { porMoneda[m.moneda] = (porMoneda[m.moneda] || 0) + (Number(m.monto) || 0); });
  const monedas = Object.entries(porMoneda).sort((a, b) => b[1] - a[1]);

  $('prestadoTotales').innerHTML = monedas.length
    ? monedas.map(([mon, v]) => `<div class="hero-monto">${fmt(v, mon)}</div>`).join('') +
      `<div class="hero-sub">${activos.length} préstamo${activos.length === 1 ? '' : 's'} sin volver${devueltos.length ? ` · ${devueltos.length} ya devuelto${devueltos.length === 1 ? '' : 's'}` : ''}</div>`
    : '<div class="hero-monto">Nada</div><div class="hero-sub">No le prestaste plata a nadie</div>';

  $('prestadoLista').innerHTML = activos.map(m => htmlPrestamo(m, false)).join('');
  $('prestadoDevueltos').innerHTML = devueltos.length
    ? `<div class="card-title" style="margin-top:20px">Devueltos</div>` + devueltos.map(m => htmlPrestamo(m, true)).join('')
    : '';
}

function htmlPrestamo(m, devuelto) {
  const persona = personaDe(m);
  return `
    <div class="prestamo-card${devuelto ? ' devuelto' : ''}" data-id="${esc(m.id)}">
      <div class="prestamo-top">
        <div class="avatar">${esc(iniciales(persona))}</div>
        <div class="prestamo-info">
          <div class="prestamo-nombre">${esc(persona)}</div>
          <div class="prestamo-fecha">${devuelto ? 'Devuelto' : 'Prestado'} el ${esc(fechaCorta(soloFecha(m.fecha)))} · ${esc(m.medioPago || '')}</div>
        </div>
        <div class="prestamo-monto">
          <div class="m">${fmt(m.monto)}</div>
          <div class="c">${esc(m.moneda)}</div>
        </div>
      </div>
      <button type="button" class="prestamo-saldar" data-saldar="${esc(m.id)}">
        ${devuelto ? 'Marcar como no devuelto' : 'Marcar como devuelto ✓'}
      </button>
    </div>`;
}

$('view-prestado').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-saldar]');
  if (btn) {
    const id = btn.dataset.saldar;
    const mov = movimientos.find(m => m.id === id);
    if (!mov) return;
    try {
      guardarConfig(claveDevuelto(id), estaDevuelto(mov) ? '' : fechaLocalStr(new Date()));
      vibrar(15);
      toast(estaDevuelto(mov) ? `${personaDe(mov)} te devolvió` : 'Vuelve a figurar como prestado');
      renderPrestado();
    } catch (err) {
      toast(`No pude guardar: ${err.message}`, 6000);
    }
    return;
  }
  const card = e.target.closest('.prestamo-card');
  if (card) {
    const mov = movimientos.find(m => m.id === card.dataset.id);
    if (mov) abrirEdicion(mov);
  }
});

$('prestarBtn').addEventListener('click', () => {
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
  $('ajusteEstimado').textContent = `Mango calcula ${fmt(saldos[cuenta] || 0, moneda)}.`;
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
  const { saldos, anclas } = calcularSaldos();
  const anclaActual = anclas[cuenta] || 0;
  const sumaMovs = (saldos[cuenta] || 0) - anclaActual;
  const nuevaAncla = Math.round((real - sumaMovs) * 100) / 100;

  try {
    guardarConfig(`saldoInicial_${moneda}_${medio}`, nuevaAncla);
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
  $('fecha').value = fechaLocalStr(new Date());
  actualizarFechaHint();
  $('moneda').value = estado.moneda;
  $('monedaDestino').value = estado.monedaDestino;
  renderMedioChips('medioChips', estado.moneda, estado.medio, fijarMedio);
  renderMedioChips('medioChipsDestino', estado.monedaDestino, estado.medioDestino, (m) => { estado.medioDestino = m; });

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
  cargarTodo();
  if (!editandoId) $('monto').focus();
}

window.addEventListener('online', sincronizarCola);
init();
