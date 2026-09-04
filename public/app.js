const LS_API_URL = 'mango_api_url';
const LS_TOKEN = 'mango_token';
const LS_QUEUE = 'mango_cola_pendiente';
const LS_CACHE_RECIENTES = 'mango_cache_recientes';
const LS_CACHE_MIGRADOS = 'mango_cache_migrados'; // historial migrado: no cambia, se trae una sola vez
const LS_CACHE_CAT = 'mango_cache_categorias';
const LS_CACHE_CONFIG = 'mango_cache_config';

const TIMEOUT_MS = 20000;
const PAGINA = 120; // filas que se muestran de una en Movimientos antes de "Mostrar más"

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

let estado = {
  tipo: 'Gasto',
  moneda: 'AUD',
  medio: 'Banco',
  monedaDestino: 'EUR',
  medioDestino: 'Banco',
  categoria: null,
  subcategoria: null
};

const $ = (id) => document.getElementById(id);

function apiUrl() { return localStorage.getItem(LS_API_URL) || ''; }
function token() { return localStorage.getItem(LS_TOKEN) || ''; }

function nuevoId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}

function toast(msg, ms = 2500) {
  const el = $('toast');
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

function soloFecha(f) { return (f || '').toString().slice(0, 10); }
function mesDe(f) { return soloFecha(f).slice(0, 7); }

function nombreMes(ym) {
  const [y, m] = ym.split('-').map(Number);
  const nombres = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${nombres[m - 1]} ${y}`;
}

function sumarMeses(ym, delta) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function sinAcentos(s) {
  return (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function esMigrado(m) { return !!(m.id && String(m.id).startsWith('mig-')); }
function claveGrupo(m) { return m.grupo || m.id; }

// ---------- Red ----------
async function apiGet(params) {
  const q = new URLSearchParams(params);
  if (token()) q.set('token', token());
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(apiUrl() + '?' + q.toString(), { signal: ctrl.signal });
    const data = await res.json();
    if (data && data.error) throw new Error(data.error);
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
      body: JSON.stringify(token() ? { ...body, token: token() } : body),
      signal: ctrl.signal
    });
    const data = await res.json();
    if (data && data.error) throw new Error(data.error);
    return data;
  } finally {
    clearTimeout(t);
  }
}

// ---------- Números: acepta coma decimal y calculadora inline ----------
// "12,50" -> 12.5 ; "1.500" -> 1500 ; "1.500,25" -> 1500.25 ; "45+12,50" -> 57.5
function normalizarNumero(str) {
  let s = (str || '').toString().trim();
  if (!s) return '';
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(/,/g, '.');
  } else if (s.includes(',')) {
    s = s.replace(/,/g, '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, ''); // "1.500" o "12.345.678" = separador de miles
  }
  return s;
}

function evaluarExpresion(str) {
  const limpio = normalizarNumero(str);
  if (!limpio) return null;
  if (!/^[0-9+\-*/.() ]+$/.test(limpio)) return null;
  if (!/[+\-*/]/.test(limpio.slice(1))) return null; // sin operador, no hay nada que calcular
  try {
    const resultado = Function('"use strict"; return (' + limpio + ')')();
    return (typeof resultado === 'number' && isFinite(resultado)) ? Math.round(resultado * 100) / 100 : null;
  } catch (err) {
    return null;
  }
}

function montoNumerico(inputEl) {
  const raw = inputEl.value;
  const calc = evaluarExpresion(raw);
  if (calc !== null) return calc;
  const n = parseFloat(normalizarNumero(raw));
  return isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

$('monto').addEventListener('input', (e) => {
  const calc = evaluarExpresion(e.target.value);
  $('calcHint').textContent = calc !== null ? `= ${fmt(calc)}` : '';
  actualizarTasaHint();
});
$('montoRecibido').addEventListener('input', actualizarTasaHint);

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
  $('configOverlay').classList.add('active');
});
$('cerrarConfigBtn').addEventListener('click', () => $('configOverlay').classList.remove('active'));
$('guardarConfigBtn').addEventListener('click', () => {
  localStorage.setItem(LS_API_URL, $('apiUrlInput').value.trim());
  localStorage.setItem(LS_TOKEN, $('tokenInput').value.trim());
  $('configOverlay').classList.remove('active');
  toast('Configuración guardada');
  init();
});
$('limpiarCacheBtn').addEventListener('click', () => {
  localStorage.removeItem(LS_CACHE_MIGRADOS);
  localStorage.removeItem(LS_CACHE_RECIENTES);
  $('configOverlay').classList.remove('active');
  toast('Bajando todo de nuevo…');
  cargarTodo();
});
$('refrescarBtn').addEventListener('click', async () => {
  $('refrescarBtn').classList.add('girando');
  await cargarTodo();
  $('refrescarBtn').classList.remove('girando');
  toast('Actualizado');
});

// ---------- Tabs ----------
function mostrarVista(nombre) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.view === nombre));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + nombre));
  if (nombre === 'movimientos') renderMovimientos();
  if (nombre === 'activos') renderActivos();
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
}

$('tipoToggle').addEventListener('click', (e) => {
  const btn = e.target.closest('.tipo-btn');
  if (!btn) return;
  aplicarTipo(btn.dataset.tipo);
  if (btn.dataset.tipo !== 'Gasto') cancelarLigar();
  renderCategoriaChips();
  actualizarTasaHint();
});

// ---------- Fecha ----------
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
    const d = new Date();
    d.setDate(d.getDate() - Number(chip.dataset.dias));
    fechaInput.value = fechaLocalStr(d);
  }
});

// ---------- Cuenta (moneda + medio) ----------
function renderMedioChips(contId, moneda, medioActivo, onSelect) {
  const cont = $(contId);
  const opciones = MEDIOS_POR_MONEDA[moneda] || [];
  const activo = opciones.some(o => o.v === medioActivo) ? medioActivo : opciones[0].v;
  cont.innerHTML = opciones.map(o =>
    `<button type="button" class="chip${o.v === activo ? ' active' : ''}" data-medio="${o.v}">${o.ico} ${o.v}</button>`
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

$('moneda').addEventListener('change', (e) => {
  estado.moneda = e.target.value;
  renderMedioChips('medioChips', estado.moneda, estado.medio, (m) => { estado.medio = m; });
  actualizarTasaHint();
});
$('monedaDestino').addEventListener('change', (e) => {
  estado.monedaDestino = e.target.value;
  renderMedioChips('medioChipsDestino', estado.monedaDestino, estado.medioDestino, (m) => { estado.medioDestino = m; });
  actualizarTasaHint();
});

// ---------- Categorías / subcategorías ----------
function fuenteCategorias() { return categorias.length ? categorias : CATEGORIAS_DEFAULT; }

function subcategoriaSugerida(cat) {
  const usados = movimientos.filter(m => m.categoria === cat && m.subcategoria);
  if (usados.length) return usados[0].subcategoria; // movimientos viene ordenado por fecha desc
  return SUB_SUGERIDA[cat] || null;
}

function renderCategoriaChips() {
  const cont = $('categoriaChips');
  const delTipo = fuenteCategorias().filter(c => c.tipo === estado.tipo);
  const unicas = [];
  const vistas = new Set();
  delTipo.forEach(c => { if (!vistas.has(c.categoria)) { vistas.add(c.categoria); unicas.push(c); } });

  cont.innerHTML = unicas.map(c =>
    `<button type="button" class="cat-chip" data-cat="${c.categoria}"><span class="ico">${c.categoriaIcono || ''}</span>${c.categoria}</button>`
  ).join('');

  cont.querySelectorAll('.cat-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      cont.querySelectorAll('.cat-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      estado.categoria = btn.dataset.cat;
      renderSubcategoriaChips();
      renderNotasSugeridas();
    });
  });

  if (unicas.length) {
    cont.querySelector('.cat-chip').classList.add('active');
    estado.categoria = unicas[0].categoria;
  } else {
    estado.categoria = null;
  }
  renderSubcategoriaChips();
  renderNotasSugeridas();
}

function seleccionarCategoria(cat, sub) {
  const catBtn = [...document.querySelectorAll('.cat-chip')].find(b => b.dataset.cat === cat);
  if (!catBtn) return;
  document.querySelectorAll('.cat-chip').forEach(b => b.classList.remove('active'));
  catBtn.classList.add('active');
  estado.categoria = cat;
  renderSubcategoriaChips();
  renderNotasSugeridas();
  if (sub) {
    const subBtn = [...document.querySelectorAll('#subcategoriaChips .chip')].find(b => b.dataset.sub === sub);
    if (subBtn) {
      document.querySelectorAll('#subcategoriaChips .chip').forEach(b => b.classList.remove('active'));
      subBtn.classList.add('active');
      estado.subcategoria = sub;
    }
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
  cont.innerHTML = subs.map(s =>
    `<button type="button" class="chip${s.subcategoria === sugerida ? ' active' : ''}" data-sub="${s.subcategoria}">${s.subcategoriaIcono || ''} ${s.subcategoria}</button>`
  ).join('');
  estado.subcategoria = subs.some(s => s.subcategoria === sugerida) ? sugerida : subs[0].subcategoria;
  if (!subs.some(s => s.subcategoria === sugerida)) cont.querySelector('.chip').classList.add('active');

  cont.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      cont.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      estado.subcategoria = btn.dataset.sub;
    });
  });
}

// notas usadas antes en esta categoría, para no tipear "Coles" por centésima vez
function renderNotasSugeridas() {
  const vistas = new Set();
  const notas = [];
  for (const m of movimientos) {
    if (m.categoria !== estado.categoria || !m.nota) continue;
    const n = m.nota.trim();
    const k = sinAcentos(n);
    if (!k || vistas.has(k)) continue;
    vistas.add(k);
    notas.push(n);
    if (notas.length >= 12) break;
  }
  $('notasSugeridas').innerHTML = notas.map(n => `<option value="${n.replace(/"/g, '&quot;')}">`).join('');
}

// ---------- Guardar movimiento ----------
function leerFormulario() {
  return {
    fecha: $('fecha').value || fechaLocalStr(new Date()),
    tipo: estado.tipo,
    monto: montoNumerico($('monto')),
    moneda: estado.moneda,
    medioPago: estado.medio,
    categoria: estado.tipo === 'Transferencia' ? '' : (estado.categoria || ''),
    subcategoria: estado.tipo === 'Transferencia' ? '' : (estado.subcategoria || ''),
    nota: $('nota').value.trim(),
    monedaDestino: estado.tipo === 'Transferencia' ? estado.monedaDestino : '',
    medioPagoDestino: estado.tipo === 'Transferencia' ? estado.medioDestino : '',
    montoRecibido: estado.tipo === 'Transferencia' ? montoNumerico($('montoRecibido')) : '',
    grupo: ''
  };
}

$('guardarBtn').addEventListener('click', async () => {
  const mov = leerFormulario();
  if (!isFinite(mov.monto) || mov.monto <= 0) { toast('Poné un monto válido'); return; }
  if (!apiUrl()) { toast('Primero configurá la URL del Apps Script (⚙️)'); return; }
  if (mov.tipo === 'Transferencia') {
    if (mov.moneda === mov.monedaDestino && mov.medioPago === mov.medioPagoDestino) { toast('La cuenta de origen y destino no pueden ser la misma'); return; }
    if (!isFinite(mov.montoRecibido) || mov.montoRecibido <= 0) mov.montoRecibido = mov.moneda === mov.monedaDestino ? mov.monto : mov.montoRecibido;
    if (!isFinite(mov.montoRecibido) || mov.montoRecibido <= 0) { toast('Poné el monto recibido en la cuenta destino'); return; }
  }

  const btn = $('guardarBtn');
  btn.disabled = true;
  btn.textContent = 'Guardando…';

  if (editandoId) {
    await guardarEdicion(editandoId, mov);
  } else {
    if (ligando && mov.tipo === 'Gasto') mov.grupo = ligando.grupo;
    const guardado = await enviarMovimiento({ ...mov, id: nuevoId() });
    $('monto').value = '';
    $('montoRecibido').value = '';
    $('nota').value = '';
    $('calcHint').textContent = '';
    $('tasaHint').textContent = '';
    if (guardado && guardado.tipo === 'Gasto') {
      ultimoGuardado = guardado;
      mostrarLigarRow(guardado);
      if (ligando) { $('monto').focus(); }
    } else {
      ocultarLigarRow();
    }
  }

  btn.disabled = false;
  btn.textContent = editandoId ? 'Guardar cambios' : 'Guardar';
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
$('duplicarBtn').addEventListener('click', async () => {
  const original = movimientos.find(m => m.id === editandoId);
  if (!original) return;
  const copia = { ...original, id: nuevoId(), fecha: fechaLocalStr(new Date()), grupo: '' };
  delete copia.pendiente;
  delete copia.timestamp;
  cancelarEdicion();
  await enviarMovimiento(copia);
});
$('borrarEdicionBtn').addEventListener('click', async () => {
  const id = editandoId;
  if (!id) return;
  const ok = await borrarMovimiento(id);
  if (ok) cancelarEdicion();
});

function resetFormularioCargar() {
  $('monto').value = '';
  $('montoRecibido').value = '';
  $('nota').value = '';
  $('calcHint').textContent = '';
  $('tasaHint').textContent = '';
  document.querySelectorAll('#fechaChips .chip').forEach(c => c.classList.remove('active'));
  $('fecha').classList.add('oculto');
  document.querySelector('#fechaChips .chip[data-dias="0"]').classList.add('active');
  $('fecha').value = fechaLocalStr(new Date());
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
  $('fecha').value = soloFecha(mov.fecha);

  estado.moneda = mov.moneda;
  $('moneda').value = mov.moneda;
  estado.medio = mov.medioPago;
  renderMedioChips('medioChips', estado.moneda, estado.medio, (m) => { estado.medio = m; });

  if (estado.tipo === 'Transferencia') {
    estado.monedaDestino = mov.monedaDestino;
    $('monedaDestino').value = mov.monedaDestino;
    estado.medioDestino = mov.medioPagoDestino;
    renderMedioChips('medioChipsDestino', estado.monedaDestino, estado.medioDestino, (m) => { estado.medioDestino = m; });
    $('montoRecibido').value = mov.montoRecibido || '';
  } else {
    renderCategoriaChips();
    if (mov.categoria) seleccionarCategoria(mov.categoria, mov.subcategoria);
  }

  $('monto').value = mov.monto;
  $('nota').value = mov.nota || '';
  $('calcHint').textContent = '';
  actualizarTasaHint();

  $('bannerEdicion').classList.remove('oculto');
  $('guardarBtn').textContent = 'Guardar cambios';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function guardarEdicion(id, mov) {
  const idx = movimientos.findIndex(m => m.id === id);
  if (idx === -1) { toast('No encuentro ese movimiento'); editandoId = null; resetFormularioCargar(); return; }
  const actual = movimientos[idx];
  const editado = { ...actual, ...mov, grupo: actual.grupo || '' };

  if (actual.pendiente) {
    // todavía no llegó al servidor: actualizamos la copia en la cola y listo
    const cola = JSON.parse(localStorage.getItem(LS_QUEUE) || '[]');
    const i = cola.findIndex(c => c.id === id);
    if (i !== -1) cola[i] = { ...cola[i], ...mov };
    localStorage.setItem(LS_QUEUE, JSON.stringify(cola));
    movimientos[idx] = editado;
    despuesDeCambiar();
    toast('Cambios guardados (se sincronizan cuando haya señal)');
    editandoId = null;
    resetFormularioCargar();
    return;
  }

  try {
    await apiPost({ action: 'editar', id, ...editado });
    movimientos[idx] = editado;
    despuesDeCambiar();
    toast('Cambios guardados 🥭');
    editandoId = null;
    resetFormularioCargar();
  } catch (err) {
    toast('No se pudo editar: revisá tu conexión y volvé a tocar "Guardar cambios"');
  }
}

// ---------- Alta / cola offline ----------
function despuesDeCambiar() {
  movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  guardarCacheMovimientos();
  movSucio = true;
  poblarFiltroMeses();
  renderUltimos();
  if (vistaActiva() === 'movimientos') renderMovimientos();
  if (vistaActiva() === 'activos') renderActivos();
}

function agregarLocal(mov) {
  movimientos.unshift(mov);
  despuesDeCambiar();
}

async function enviarMovimiento(mov) {
  try {
    await apiPost(mov);
    agregarLocal(mov);
    toast('¡Listo! Movimiento guardado 🥭');
    return mov;
  } catch (err) {
    encolar(mov);
    toast('Sin conexión: se guardó localmente y se sincroniza después');
    return mov;
  }
}

function encolar(mov) {
  const cola = JSON.parse(localStorage.getItem(LS_QUEUE) || '[]');
  cola.push(mov);
  localStorage.setItem(LS_QUEUE, JSON.stringify(cola));
  agregarLocal({ ...mov, pendiente: true });
}

async function sincronizarCola() {
  const cola = JSON.parse(localStorage.getItem(LS_QUEUE) || '[]');
  if (!cola.length || !apiUrl()) return;
  const restante = [];
  for (const mov of cola) {
    try {
      await apiPost(mov); // el id viaja con el movimiento: si ya existe, el servidor lo actualiza en vez de duplicar
      const idx = movimientos.findIndex(m => m.id === mov.id);
      if (idx !== -1) delete movimientos[idx].pendiente;
    } catch (err) {
      restante.push(mov);
    }
  }
  localStorage.setItem(LS_QUEUE, JSON.stringify(restante));
  guardarCacheMovimientos();
  if (restante.length < cola.length) { movSucio = true; renderUltimos(); if (vistaActiva() === 'movimientos') renderMovimientos(); }
}

// ---------- Carga inicial ----------
// El historial migrado (miles de filas) no cambia nunca, así que se trae una única vez y se cachea
// para siempre. En cada apertura solo se pide lo "reciente" (lo que vos vas cargando) junto con
// categorías y config, todo en UNA llamada (bootstrap).
function combinar(recientes, migrados) {
  movimientos = [...recientes, ...migrados];
  movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  movSucio = true;
  poblarFiltroMeses();
  renderUltimos();
  renderNotasSugeridas();
  if (vistaActiva() === 'movimientos') renderMovimientos();
  if (vistaActiva() === 'activos') renderActivos();
}

function aplicarCategorias(data) {
  const fresca = JSON.stringify(data && data.length ? data : CATEGORIAS_DEFAULT);
  if (fresca !== JSON.stringify(categorias)) {
    categorias = JSON.parse(fresca);
    localStorage.setItem(LS_CACHE_CAT, fresca);
    renderCategoriaChips();
  }
}

function aplicarConfig(data) {
  config = data || {};
  localStorage.setItem(LS_CACHE_CONFIG, JSON.stringify(config));
  patrimonio = Number(config.patrimonioInvertido) || 0;
}

async function cargarTodo() {
  const cachedRecientes = localStorage.getItem(LS_CACHE_RECIENTES);
  const cachedMigrados = localStorage.getItem(LS_CACHE_MIGRADOS);
  const migradosIniciales = cachedMigrados ? JSON.parse(cachedMigrados) : [];

  try {
    let data = await apiGet({ action: 'bootstrap' });
    if (!data || Array.isArray(data) || !('recientes' in data)) {
      // backend viejo (sin bootstrap): hacemos las tres llamadas de antes
      const [cats, cfg, rec] = await Promise.all([
        apiGet({ action: 'categorias' }),
        apiGet({ action: 'config' }),
        apiGet({ action: 'movimientos', recientes: 1 })
      ]);
      data = { categorias: cats, config: cfg, recientes: rec };
    }
    aplicarCategorias(data.categorias);
    aplicarConfig(data.config);
    localStorage.setItem(LS_CACHE_RECIENTES, JSON.stringify(data.recientes || []));
    combinar(data.recientes || [], migradosIniciales);
  } catch (err) {
    if (!cachedRecientes && !cachedMigrados) toast('No pude conectar con tu planilla. Revisá la URL en ⚙️');
  }

  if (!cachedMigrados) {
    try {
      const todos = await apiGet({ action: 'movimientos' });
      const migrados = todos.filter(esMigrado);
      localStorage.setItem(LS_CACHE_MIGRADOS, JSON.stringify(migrados));
      const recientesActuales = JSON.parse(localStorage.getItem(LS_CACHE_RECIENTES) || '[]');
      combinar(recientesActuales, migrados);
    } catch (err) {
      // sin historial migrado por ahora; se reintenta en la próxima apertura
    }
  }

  sincronizarCola();
}

function guardarCacheMovimientos() {
  const migrados = movimientos.filter(esMigrado);
  const recientes = movimientos.filter(m => !esMigrado(m));
  localStorage.setItem(LS_CACHE_MIGRADOS, JSON.stringify(migrados));
  localStorage.setItem(LS_CACHE_RECIENTES, JSON.stringify(recientes));
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

function htmlFila(m, extra = '') {
  const cuentaTxt = m.tipo === 'Transferencia'
    ? `${m.moneda} ${m.medioPago} → ${m.monedaDestino} ${m.medioPagoDestino}`
    : `${m.moneda} ${m.medioPago || ''}`;
  return `
    <div class="gasto-item ${extra}" data-id="${m.id}">
      <div class="gasto-info">
        <div class="gasto-ico">${iconoDe(m)}</div>
        <div class="gasto-texto">
          <div class="cat">${nombreMov(m)}${m.pendiente ? '<span class="badge-pendiente">pendiente</span>' : ''}</div>
          <div class="meta">${soloFecha(m.fecha)} · ${cuentaTxt}${m.nota ? ' · ' + m.nota : ''}</div>
        </div>
      </div>
      <div class="gasto-monto ${(m.tipo || 'Gasto').toLowerCase()}">${fmt(m.monto, m.moneda)}</div>
      <span class="grupo-flecha">›</span>
    </div>`;
}

function htmlGrupo(g) {
  const base = g.miembros[0];
  const total = g.miembros.reduce((s, m) => s + (Number(m.monto) || 0), 0);
  const abierto = gruposAbiertos.has(g.grupo);
  const notas = [...new Set(g.miembros.map(m => m.nota).filter(Boolean))].join(' + ');
  return `
    <div class="gasto-item grupo-item${abierto ? ' abierto' : ''}" data-grupo="${g.grupo}">
      <div class="gasto-info">
        <div class="gasto-ico">${iconoDe(base)}</div>
        <div class="gasto-texto">
          <div class="cat">${nombreMov(base)} <span class="badge-grupo">${g.miembros.length} cargos</span></div>
          <div class="meta">${soloFecha(base.fecha)} · ${base.moneda} ${base.medioPago || ''}${notas ? ' · ' + notas : ''}</div>
        </div>
      </div>
      <div class="gasto-monto ${(base.tipo || 'Gasto').toLowerCase()}">${fmt(total, base.moneda)}</div>
      <span class="grupo-flecha">${abierto ? '▾' : '▸'}</span>
    </div>
    <div class="grupo-miembros${abierto ? '' : ' oculto'}" data-grupo-de="${g.grupo}">
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
  const meses = [...new Set(movimientos.map(m => mesDe(m.fecha)))].filter(Boolean).sort().reverse();
  if (!meses.includes(mesHoy)) meses.unshift(mesHoy);
  select.innerHTML = '<option value="">Todos los meses</option>' +
    meses.map(m => `<option value="${m}">${nombreMes(m)}</option>`).join('');
  select.value = select.dataset.tocado ? actual : mesHoy; // por defecto, el mes actual
}

['filtroTipo', 'filtroMoneda'].forEach(id => $(id).addEventListener('change', () => { limiteRender = PAGINA; movSucio = true; renderMovimientos(); }));
$('filtroMes').addEventListener('change', () => { $('filtroMes').dataset.tocado = '1'; limiteRender = PAGINA; movSucio = true; renderMovimientos(); });
$('buscar').addEventListener('input', () => { limiteRender = PAGINA; movSucio = true; renderMovimientos(); });
$('mostrarMasBtn').addEventListener('click', () => { limiteRender += 200; movSucio = true; renderMovimientos(); });

function filtrarMovimientos() {
  const filtroTipo = $('filtroTipo').value;
  const filtroMoneda = $('filtroMoneda').value;
  const filtroMes = $('filtroMes').value;
  const q = sinAcentos($('buscar').value.trim());
  return movimientos.filter(m =>
    (!filtroTipo || m.tipo === filtroTipo) &&
    (!filtroMoneda || m.moneda === filtroMoneda) &&
    (q || !filtroMes || mesDe(m.fecha) === filtroMes) && // si buscás, la búsqueda manda sobre el mes
    (!q || sinAcentos(`${m.nota} ${m.categoria} ${m.subcategoria}`).includes(q))
  );
}

function renderMovimientos() {
  if (!movSucio) return;
  movSucio = false;

  const filtrados = filtrarMovimientos();
  renderTotales(filtrados);

  const cont = $('listaMovimientos');
  if (!filtrados.length) {
    cont.innerHTML = '<div class="vacio">No hay movimientos para este filtro</div>';
    $('mostrarMasBtn').classList.add('oculto');
    return;
  }

  const entradas = agruparMovimientos(filtrados);
  const visibles = entradas.slice(0, limiteRender);
  let html = '';
  let mesActual = null;
  visibles.forEach(e => {
    const base = e.mov || e.miembros[0];
    const mes = mesDe(base.fecha);
    if (mes !== mesActual) {
      html += `<div class="mes-header">${nombreMes(mes)}</div>`;
      mesActual = mes;
    }
    html += e.mov ? htmlFila(e.mov) : htmlGrupo(e);
  });
  cont.innerHTML = html;
  $('mostrarMasBtn').classList.toggle('oculto', entradas.length <= limiteRender);
  $('mostrarMasBtn').textContent = `Mostrar más (${entradas.length - visibles.length} restantes)`;
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
  const cerrar = () => { el.classList.remove('show'); el.innerHTML = ''; };
  el._t = setTimeout(cerrar, ms);
  return cerrar;
}

// Borrar sin cartel de confirmación: se saca al instante, con 5 segundos para deshacer.
// Recién después de esos 5 segundos se le avisa al servidor.
function borrarMovimiento(id) {
  const idx = movimientos.findIndex(m => m.id === id);
  if (idx === -1) return false;
  const mov = movimientos[idx];
  movimientos.splice(idx, 1);
  despuesDeCambiar();

  let deshecho = false;
  toastAccion(`Borrado: ${nombreMov(mov)} ${fmt(mov.monto, mov.moneda)}`, 'Deshacer', () => {
    deshecho = true;
    movimientos.push(mov);
    despuesDeCambiar();
  }, 5000);

  setTimeout(async () => {
    if (deshecho) return;
    if (mov.pendiente) {
      const cola = JSON.parse(localStorage.getItem(LS_QUEUE) || '[]').filter(c => c.id !== id);
      localStorage.setItem(LS_QUEUE, JSON.stringify(cola));
      return;
    }
    try {
      await apiPost({ action: 'borrar', id });
    } catch (err) {
      movimientos.push(mov);
      despuesDeCambiar();
      toast('No se pudo borrar en la planilla (sin señal). Lo volví a poner.');
    }
  }, 5200);
  return true;
}

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
        const moneda = cuenta.split(' ')[0];
        return `<div class="saldo-row" data-cuenta="${cuenta}"><span>${cuenta}</span><b class="${saldo < 0 ? 'neg' : 'pos'}">${fmt(saldo, moneda)}</b></div>`;
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

$('mesAnteriorBtn').addEventListener('click', () => { mesResumen = sumarMeses(mesResumen, -1); renderResumenMes(); });
$('mesSiguienteBtn').addEventListener('click', () => { mesResumen = sumarMeses(mesResumen, 1); renderResumenMes(); });

function renderResumenMes() {
  $('mesTitulo').textContent = nombreMes(mesResumen);
  const delMes = movimientos.filter(m => mesDe(m.fecha) === mesResumen && m.tipo !== 'Transferencia');
  const porMoneda = {};
  delMes.forEach(m => {
    const p = porMoneda[m.moneda] = porMoneda[m.moneda] || { gasto: 0, ingreso: 0, cats: {} };
    const monto = Number(m.monto) || 0;
    if (m.tipo === 'Ingreso') { p.ingreso += monto; return; }
    p.gasto += monto;
    p.cats[m.categoria || 'Otros'] = (p.cats[m.categoria || 'Otros'] || 0) + monto;
  });

  const monedas = Object.keys(porMoneda).sort((a, b) => porMoneda[b].gasto - porMoneda[a].gasto);
  if (!monedas.length) {
    $('resumenMes').innerHTML = '<div class="vacio">Sin movimientos este mes</div>';
    return;
  }

  $('resumenMes').innerHTML = monedas.map(moneda => {
    const p = porMoneda[moneda];
    const cats = Object.entries(p.cats).sort((a, b) => b[1] - a[1]);
    const max = cats.length ? cats[0][1] : 1;
    return `
      <div class="resumen-moneda">
        <div class="resumen-totales">
          <div class="stat"><div class="stat-label">Gastado</div><div class="stat-valor gasto">${fmt(p.gasto, moneda)}</div></div>
          <div class="stat"><div class="stat-label">Ingresado</div><div class="stat-valor ingreso">${fmt(p.ingreso, moneda)}</div></div>
          <div class="stat"><div class="stat-label">Balance</div><div class="stat-valor ${p.ingreso - p.gasto < 0 ? 'gasto' : 'ingreso'}">${fmt(p.ingreso - p.gasto, moneda)}</div></div>
        </div>
        ${cats.map(([cat, total]) => {
          const ico = (fuenteCategorias().find(c => c.categoria === cat) || {}).categoriaIcono || '💸';
          const pct = p.gasto ? Math.round(total / p.gasto * 100) : 0;
          return `
            <div class="barra-row" title="${cat}: ${fmt(total, moneda)} (${pct}%)">
              <div class="barra-label"><span class="ico">${ico}</span>${cat}</div>
              <div class="barra-pista"><div class="barra" style="width:${Math.max(2, total / max * 100)}%"></div></div>
              <div class="barra-valor">${fmtCorto(total)} <span class="barra-pct">${pct}%</span></div>
            </div>`;
        }).join('')}
      </div>`;
  }).join('');
}

// un mini gráfico de barras por moneda con el gasto total de los últimos 6 meses (small multiples: una moneda por gráfico, un solo eje)
function renderTendencia() {
  const mesHoy = fechaLocalStr(new Date()).slice(0, 7);
  const meses = [];
  for (let i = 5; i >= 0; i--) meses.push(sumarMeses(mesHoy, -i));

  const porMoneda = {};
  movimientos.forEach(m => {
    if (m.tipo !== 'Gasto') return;
    const mes = mesDe(m.fecha);
    if (!meses.includes(mes)) return;
    porMoneda[m.moneda] = porMoneda[m.moneda] || {};
    porMoneda[m.moneda][mes] = (porMoneda[m.moneda][mes] || 0) + (Number(m.monto) || 0);
  });

  const monedas = Object.keys(porMoneda);
  if (!monedas.length) { $('tendencia').innerHTML = '<div class="vacio">Sin gastos en los últimos 6 meses</div>'; return; }

  $('tendencia').innerHTML = monedas.map(moneda => {
    const valores = meses.map(mes => porMoneda[moneda][mes] || 0);
    const max = Math.max(...valores, 1);
    const W = 320, H = 120, pad = 6, base = H - 22, alto = base - pad;
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
          <title>${nombreMes(mes)}: ${fmt(v, moneda)}</title>
          <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" class="tbar${esActual ? ' actual' : ''}"></rect>
          ${v ? `<text x="${x + w / 2}" y="${Math.max(y - 4, 10)}" class="tval">${fmtCorto(v)}</text>` : ''}
          <text x="${x + w / 2}" y="${H - 6}" class="tlab">${nombreMes(mes).slice(0, 3)}</text>
        </g>`;
    }).join('');
    return `
      <div class="tendencia-moneda">
        <div class="tendencia-titulo">Gasto mensual en ${moneda}</div>
        <svg viewBox="0 0 ${W} ${H}" class="tendencia-svg" role="img" aria-label="Gasto mensual en ${moneda}, últimos 6 meses">
          <line x1="${pad}" y1="${base}" x2="${W - pad}" y2="${base}" class="teje"></line>
          ${barras}
        </svg>
      </div>`;
  }).join('');
}

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
$('guardarAjusteBtn').addEventListener('click', async () => {
  const real = montoNumerico($('ajusteInput'));
  if (!isFinite(real)) { toast('Poné el saldo real'); return; }
  const cuenta = ajusteCuenta;
  const [moneda, ...resto] = cuenta.split(' ');
  const medio = resto.join(' ');
  const { saldos, anclas } = calcularSaldos();
  const anclaActual = anclas[cuenta] || 0;
  const sumaMovs = (saldos[cuenta] || 0) - anclaActual;
  const nuevaAncla = Math.round((real - sumaMovs) * 100) / 100;
  const clave = `saldoInicial_${moneda}_${medio}`;

  config[clave] = nuevaAncla;
  localStorage.setItem(LS_CACHE_CONFIG, JSON.stringify(config));
  $('ajusteOverlay').classList.remove('active');
  renderActivos();
  try {
    await apiPost({ action: 'config', clave, valor: nuevaAncla });
    toast(`Listo: ${cuenta} ahora marca ${fmt(real, moneda)}`);
  } catch (err) {
    toast('Se ajustó en el celu, pero no llegó a la planilla. Volvé a intentar con señal.');
  }
});

// ---------- Patrimonio ----------
$('guardarPatrimonioBtn').addEventListener('click', async () => {
  const valor = montoNumerico($('patrimonioInput'));
  const v = isFinite(valor) ? valor : 0;
  patrimonio = v;
  config.patrimonioInvertido = v;
  localStorage.setItem(LS_CACHE_CONFIG, JSON.stringify(config));
  try {
    await apiPost({ action: 'config', clave: 'patrimonioInvertido', valor: v });
    toast('Guardado');
  } catch (err) {
    toast('Sin conexión: se guardó localmente');
  }
});

// ---------- Versión nueva (avisa el service worker) ----------
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data && e.data.tipo === 'nueva-version') $('avisoVersion').classList.remove('oculto');
  });
  $('actualizarBtn').addEventListener('click', () => location.reload());
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// ---------- Init ----------
function init() {
  $('fecha').value = fechaLocalStr(new Date());
  $('moneda').value = estado.moneda;
  $('monedaDestino').value = estado.monedaDestino;
  renderMedioChips('medioChips', estado.moneda, estado.medio, (m) => { estado.medio = m; });
  renderMedioChips('medioChipsDestino', estado.monedaDestino, estado.medioDestino, (m) => { estado.medioDestino = m; });

  // primero lo que ya tenemos en el celu, al instante
  const cachedCat = localStorage.getItem(LS_CACHE_CAT);
  categorias = cachedCat ? JSON.parse(cachedCat) : CATEGORIAS_DEFAULT;
  const cachedConfig = localStorage.getItem(LS_CACHE_CONFIG);
  config = cachedConfig ? JSON.parse(cachedConfig) : {};
  patrimonio = Number(config.patrimonioInvertido) || 0;
  const cachedRecientes = localStorage.getItem(LS_CACHE_RECIENTES);
  const cachedMigrados = localStorage.getItem(LS_CACHE_MIGRADOS);
  combinar(cachedRecientes ? JSON.parse(cachedRecientes) : [], cachedMigrados ? JSON.parse(cachedMigrados) : []);
  renderCategoriaChips();

  if (!apiUrl()) {
    $('configOverlay').classList.add('active');
    return;
  }
  cargarTodo();
}

window.addEventListener('online', sincronizarCola);
init();
