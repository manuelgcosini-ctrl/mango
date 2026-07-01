const LS_API_URL = 'mango_api_url';
const LS_QUEUE = 'mango_cola_pendiente';
const LS_CACHE_MOV = 'mango_cache_movimientos';
const LS_CACHE_CAT = 'mango_cache_categorias';
const LS_CACHE_PATRIMONIO = 'mango_cache_patrimonio';

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

let estado = {
  tipo: 'Gasto',
  fechaOffset: 0,
  moneda: 'AUD',
  medio: 'Banco',
  monedaDestino: 'EUR',
  medioDestino: 'Banco',
  categoria: null,
  subcategoria: null
};

function apiUrl() {
  return localStorage.getItem(LS_API_URL) || '';
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

function fmt(n, moneda) {
  const num = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
  return moneda ? `${num} ${moneda}` : num;
}

// ---------- Calculadora inline (solo aritmética: + - * / ( ) . y espacios) ----------
function evaluarExpresion(str) {
  if (!str) return null;
  const limpio = str.trim();
  if (!/^[0-9+\-*/.() ]+$/.test(limpio)) return null;
  if (!/[+\-*/]/.test(limpio.slice(1))) return null; // sin operador, no hay nada que calcular
  try {
    const resultado = Function('"use strict"; return (' + limpio + ')')();
    return (typeof resultado === 'number' && isFinite(resultado)) ? resultado : null;
  } catch (err) {
    return null;
  }
}

function montoNumerico(inputEl) {
  const raw = inputEl.value.trim();
  const calc = evaluarExpresion(raw);
  return calc !== null ? calc : parseFloat(raw);
}

document.getElementById('monto').addEventListener('input', (e) => {
  const calc = evaluarExpresion(e.target.value);
  document.getElementById('calcHint').textContent = calc !== null ? `= ${fmt(calc)}` : '';
  actualizarTasaHint();
});
document.getElementById('montoRecibido').addEventListener('input', actualizarTasaHint);

function actualizarTasaHint() {
  const hint = document.getElementById('tasaHint');
  if (estado.tipo !== 'Transferencia') { hint.textContent = ''; return; }
  const monto = montoNumerico(document.getElementById('monto'));
  const recibido = montoNumerico(document.getElementById('montoRecibido'));
  if (monto > 0 && recibido > 0) {
    hint.textContent = `1 ${estado.moneda} = ${(recibido / monto).toFixed(4)} ${estado.monedaDestino}`;
  } else {
    hint.textContent = '';
  }
}

// ---------- Config ----------
document.getElementById('configBtn').addEventListener('click', () => {
  document.getElementById('apiUrlInput').value = apiUrl();
  document.getElementById('configOverlay').classList.add('active');
});

document.getElementById('cerrarConfigBtn').addEventListener('click', () => {
  document.getElementById('configOverlay').classList.remove('active');
});

document.getElementById('guardarConfigBtn').addEventListener('click', () => {
  const url = document.getElementById('apiUrlInput').value.trim();
  localStorage.setItem(LS_API_URL, url);
  document.getElementById('configOverlay').classList.remove('active');
  toast('Configuración guardada');
  init();
});

// ---------- Tabs ----------
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('view-' + btn.dataset.view).classList.add('active');
    if (btn.dataset.view === 'movimientos') renderMovimientos();
    if (btn.dataset.view === 'activos') renderActivos();
  });
});

// ---------- Tipo ----------
document.getElementById('tipoToggle').addEventListener('click', (e) => {
  const btn = e.target.closest('.tipo-btn');
  if (!btn) return;
  document.querySelectorAll('.tipo-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  estado.tipo = btn.dataset.tipo;
  document.getElementById('bloqueTransferencia').classList.toggle('oculto', estado.tipo !== 'Transferencia');
  document.getElementById('bloqueCategoria').classList.toggle('oculto', estado.tipo === 'Transferencia');
  document.getElementById('labelCuenta').textContent = estado.tipo === 'Transferencia' ? 'Cuenta de origen' : 'Cuenta';
  renderCategoriaChips();
  actualizarTasaHint();
});

// ---------- Fecha ----------
document.getElementById('fechaChips').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#fechaChips .chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  if (chip.id === 'chipOtraFecha') {
    const fechaInput = document.getElementById('fecha');
    fechaInput.classList.remove('oculto');
    try {
      if (typeof fechaInput.showPicker === 'function') fechaInput.showPicker();
      else fechaInput.focus();
    } catch (err) {
      fechaInput.focus();
    }
  } else {
    document.getElementById('fecha').classList.add('oculto');
    const d = new Date();
    d.setDate(d.getDate() - Number(chip.dataset.dias));
    document.getElementById('fecha').value = d.toISOString().slice(0, 10);
  }
});

// ---------- Cuenta (moneda + medio) ----------
function renderMedioChips(contId, moneda, medioActivo, onSelect) {
  const cont = document.getElementById(contId);
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

document.getElementById('moneda').addEventListener('change', (e) => {
  estado.moneda = e.target.value;
  renderMedioChips('medioChips', estado.moneda, estado.medio, (m) => { estado.medio = m; });
  actualizarTasaHint();
});

document.getElementById('monedaDestino').addEventListener('change', (e) => {
  estado.monedaDestino = e.target.value;
  renderMedioChips('medioChipsDestino', estado.monedaDestino, estado.medioDestino, (m) => { estado.medioDestino = m; });
  actualizarTasaHint();
});

// ---------- Categorías / subcategorías ----------
function subcategoriaSugerida(cat) {
  const usados = movimientos.filter(m => m.categoria === cat && m.subcategoria);
  if (usados.length) return usados[0].subcategoria; // movimientos viene ordenado por fecha desc
  return SUB_SUGERIDA[cat] || null;
}

function renderCategoriaChips() {
  const cont = document.getElementById('categoriaChips');
  const fuente = categorias.length ? categorias : CATEGORIAS_DEFAULT;
  const delTipo = fuente.filter(c => c.tipo === estado.tipo);
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
    });
  });

  if (unicas.length) {
    cont.querySelector('.cat-chip').classList.add('active');
    estado.categoria = unicas[0].categoria;
  } else {
    estado.categoria = null;
  }
  renderSubcategoriaChips();
}

function renderSubcategoriaChips() {
  const cont = document.getElementById('subcategoriaChips');
  const fuente = categorias.length ? categorias : CATEGORIAS_DEFAULT;
  const subs = fuente.filter(c => c.tipo === estado.tipo && c.categoria === estado.categoria && c.subcategoria);

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

  cont.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      cont.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      estado.subcategoria = btn.dataset.sub;
    });
  });
}

// ---------- Categorías desde el backend ----------
async function cargarCategorias() {
  try {
    const res = await fetch(apiUrl() + '?action=categorias');
    const data = await res.json();
    categorias = data.length ? data : CATEGORIAS_DEFAULT;
    localStorage.setItem(LS_CACHE_CAT, JSON.stringify(categorias));
  } catch (err) {
    const cached = localStorage.getItem(LS_CACHE_CAT);
    categorias = cached ? JSON.parse(cached) : CATEGORIAS_DEFAULT;
  }
  renderCategoriaChips();
}

// ---------- Guardar movimiento ----------
document.getElementById('guardarBtn').addEventListener('click', async () => {
  const monto = montoNumerico(document.getElementById('monto'));
  if (!monto || monto <= 0) { toast('Poné un monto válido'); return; }
  if (!apiUrl()) { toast('Primero configurá la URL del Apps Script (⚙️)'); return; }
  if (estado.tipo === 'Transferencia' && estado.moneda === estado.monedaDestino && estado.medio === estado.medioDestino) {
    toast('La cuenta de origen y destino no pueden ser la misma'); return;
  }

  const movimiento = {
    fecha: document.getElementById('fecha').value || new Date().toISOString().slice(0, 10),
    tipo: estado.tipo,
    monto,
    moneda: estado.moneda,
    medioPago: estado.medio,
    categoria: estado.tipo === 'Transferencia' ? '' : (estado.categoria || ''),
    subcategoria: estado.tipo === 'Transferencia' ? '' : (estado.subcategoria || ''),
    nota: document.getElementById('nota').value,
    monedaDestino: estado.tipo === 'Transferencia' ? estado.monedaDestino : '',
    medioPagoDestino: estado.tipo === 'Transferencia' ? estado.medioDestino : '',
    montoRecibido: estado.tipo === 'Transferencia' ? montoNumerico(document.getElementById('montoRecibido')) : ''
  };

  await enviarMovimiento(movimiento);

  document.getElementById('monto').value = '';
  document.getElementById('montoRecibido').value = '';
  document.getElementById('nota').value = '';
  document.getElementById('calcHint').textContent = '';
  document.getElementById('tasaHint').textContent = '';
  toast('¡Listo! Movimiento guardado 🥭');
});

async function enviarMovimiento(mov) {
  try {
    await fetch(apiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(mov)
    });
    await cargarMovimientos();
  } catch (err) {
    encolar(mov);
    toast('Sin conexión: se guardó localmente y se sincroniza después');
  }
}

function encolar(mov) {
  const cola = JSON.parse(localStorage.getItem(LS_QUEUE) || '[]');
  cola.push(mov);
  localStorage.setItem(LS_QUEUE, JSON.stringify(cola));
  movimientos.unshift({ ...mov, id: 'pendiente-' + Date.now(), pendiente: true });
  localStorage.setItem(LS_CACHE_MOV, JSON.stringify(movimientos));
  renderUltimos();
}

async function sincronizarCola() {
  const cola = JSON.parse(localStorage.getItem(LS_QUEUE) || '[]');
  if (!cola.length || !apiUrl()) return;
  const restante = [];
  for (const mov of cola) {
    try {
      await fetch(apiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(mov)
      });
    } catch (err) {
      restante.push(mov);
    }
  }
  localStorage.setItem(LS_QUEUE, JSON.stringify(restante));
  if (restante.length < cola.length) await cargarMovimientos();
}

// ---------- Listado / totales ----------
async function cargarMovimientos() {
  try {
    const res = await fetch(apiUrl() + '?action=movimientos');
    movimientos = await res.json();
    movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    localStorage.setItem(LS_CACHE_MOV, JSON.stringify(movimientos));
  } catch (err) {
    const cached = localStorage.getItem(LS_CACHE_MOV);
    movimientos = cached ? JSON.parse(cached) : [];
  }
  poblarFiltroMeses();
  renderUltimos();
  renderMovimientos();
}

function iconoDe(mov) {
  if (mov.tipo === 'Transferencia') return '🔁';
  const fuente = categorias.length ? categorias : CATEGORIAS_DEFAULT;
  const match = fuente.find(c => c.categoria === mov.categoria);
  return match ? match.categoriaIcono : '💸';
}

function renderUltimos() {
  const cont = document.getElementById('ultimosMovimientos');
  const ultimos = movimientos.slice(0, 5);
  if (!ultimos.length) {
    cont.innerHTML = '<div class="vacio">Todavía no cargaste nada. Ni un mango 🥭</div>';
    return;
  }
  cont.innerHTML = ultimos.map(m => `
    <div class="mov-mini">
      <div class="gasto-info">
        <div class="gasto-ico">${iconoDe(m)}</div>
        <div class="gasto-texto">
          <div class="cat">${m.categoria || m.tipo}${m.subcategoria ? ' · ' + m.subcategoria : ''}</div>
          <div class="meta">${m.fecha}${m.nota ? ' · ' + m.nota : ''}</div>
        </div>
      </div>
      <div class="gasto-monto ${(m.tipo || 'Gasto').toLowerCase()}">${fmt(m.monto, m.moneda)}</div>
    </div>`).join('');
}

function poblarFiltroMeses() {
  const select = document.getElementById('filtroMes');
  const actual = select.value;
  const meses = [...new Set(movimientos.map(m => (m.fecha || '').slice(0, 7)))].filter(Boolean).sort().reverse();
  select.innerHTML = '<option value="">Todos los meses</option>' +
    meses.map(m => `<option value="${m}">${m}</option>`).join('');
  select.value = actual;
}

document.getElementById('filtroTipo').addEventListener('change', renderMovimientos);
document.getElementById('filtroMoneda').addEventListener('change', renderMovimientos);
document.getElementById('filtroMes').addEventListener('change', renderMovimientos);

function renderMovimientos() {
  const filtroTipo = document.getElementById('filtroTipo').value;
  const filtroMoneda = document.getElementById('filtroMoneda').value;
  const filtroMes = document.getElementById('filtroMes').value;

  const filtrados = movimientos.filter(m =>
    (!filtroTipo || m.tipo === filtroTipo) &&
    (!filtroMoneda || m.moneda === filtroMoneda) &&
    (!filtroMes || (m.fecha || '').startsWith(filtroMes))
  );

  renderTotales(filtrados);

  const cont = document.getElementById('listaMovimientos');
  if (!filtrados.length) {
    cont.innerHTML = '<div class="vacio">No hay movimientos para este filtro</div>';
    return;
  }

  let html = '';
  let mesActual = null;
  filtrados.forEach(m => {
    const mes = (m.fecha || '').slice(0, 7);
    if (mes !== mesActual) {
      html += `<div class="mes-header">${mes}</div>`;
      mesActual = mes;
    }
    const cuentaTxt = m.tipo === 'Transferencia'
      ? `${m.moneda} ${m.medioPago} → ${m.monedaDestino} ${m.medioPagoDestino}`
      : `${m.moneda} ${m.medioPago || ''}`;
    html += `
      <div class="gasto-item">
        <div class="gasto-info">
          <div class="gasto-ico">${iconoDe(m)}</div>
          <div class="gasto-texto">
            <div class="cat">${m.categoria || m.tipo}${m.subcategoria ? ' · ' + m.subcategoria : ''}${m.pendiente ? '<span class="badge-pendiente">pendiente</span>' : ''}</div>
            <div class="meta">${m.fecha} · ${cuentaTxt}${m.nota ? ' · ' + m.nota : ''}</div>
          </div>
        </div>
        <div class="gasto-monto ${(m.tipo || 'Gasto').toLowerCase()}">${fmt(m.monto, m.moneda)}</div>
        <button class="gasto-del" data-id="${m.id}" title="Borrar">🗑</button>
      </div>`;
  });
  cont.innerHTML = html;

  cont.querySelectorAll('.gasto-del').forEach(btn => {
    btn.addEventListener('click', () => borrarMovimiento(btn.dataset.id));
  });
}

function renderTotales(lista) {
  const porMoneda = {};
  lista.forEach(m => {
    if (m.tipo === 'Transferencia') return;
    porMoneda[m.moneda] = porMoneda[m.moneda] || { gasto: 0, ingreso: 0 };
    if (m.tipo === 'Ingreso') porMoneda[m.moneda].ingreso += Number(m.monto);
    else porMoneda[m.moneda].gasto += Number(m.monto);
  });
  const cont = document.getElementById('totales');
  cont.innerHTML = Object.entries(porMoneda).map(([moneda, t]) =>
    `<div class="total-chip">💸 <b class="gasto">${fmt(t.gasto, moneda)}</b></div>
     <div class="total-chip">💰 <b class="ingreso">${fmt(t.ingreso, moneda)}</b></div>`
  ).join('') || '';
}

async function borrarMovimiento(id) {
  if (id.startsWith('pendiente-')) {
    movimientos = movimientos.filter(m => m.id !== id);
    renderMovimientos();
    renderUltimos();
    return;
  }
  if (!confirm('¿Borrar este movimiento?')) return;
  try {
    await fetch(apiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'borrar', id })
    });
    await cargarMovimientos();
  } catch (err) {
    toast('No se pudo borrar: sin conexión');
  }
}

// ---------- Activos ----------
function renderActivos() {
  const saldos = {};
  movimientos.forEach(m => {
    if (m.tipo === 'Ingreso') {
      const k = `${m.moneda} ${m.medioPago}`;
      saldos[k] = (saldos[k] || 0) + Number(m.monto);
    } else if (m.tipo === 'Gasto') {
      const k = `${m.moneda} ${m.medioPago}`;
      saldos[k] = (saldos[k] || 0) - Number(m.monto);
    } else if (m.tipo === 'Transferencia') {
      const kOrigen = `${m.moneda} ${m.medioPago}`;
      const kDestino = `${m.monedaDestino} ${m.medioPagoDestino}`;
      saldos[kOrigen] = (saldos[kOrigen] || 0) - Number(m.monto);
      saldos[kDestino] = (saldos[kDestino] || 0) + Number(m.montoRecibido || 0);
    }
  });

  const contSaldos = document.getElementById('saldosCuentas');
  const entradas = Object.entries(saldos);
  contSaldos.innerHTML = entradas.length
    ? entradas.map(([cuenta, saldo]) => {
        const moneda = cuenta.split(' ')[0];
        return `<div class="saldo-row"><span>${cuenta}</span><b class="${saldo < 0 ? 'neg' : 'pos'}">${fmt(saldo, moneda)}</b></div>`;
      }).join('')
    : '<div class="vacio">Todavía no hay movimientos</div>';

  const mesActual = new Date().toISOString().slice(0, 7);
  const porCategoria = {};
  movimientos
    .filter(m => m.tipo === 'Gasto' && (m.fecha || '').startsWith(mesActual))
    .forEach(m => { porCategoria[m.categoria] = (porCategoria[m.categoria] || 0) + Number(m.monto); });

  const contCat = document.getElementById('gastoPorCategoria');
  const catsOrdenadas = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);
  contCat.innerHTML = catsOrdenadas.length
    ? catsOrdenadas.map(([cat, total]) => {
        const fuente = categorias.length ? categorias : CATEGORIAS_DEFAULT;
        const ico = (fuente.find(c => c.categoria === cat) || {}).categoriaIcono || '💸';
        return `<div class="catgasto-row"><span><span class="ico">${ico}</span>${cat}</span><b>${fmt(total)}</b></div>`;
      }).join('')
    : '<div class="vacio">Sin gastos este mes todavía</div>';

  document.getElementById('patrimonioInput').value = patrimonio || '';
}

document.getElementById('guardarPatrimonioBtn').addEventListener('click', async () => {
  const valor = parseFloat(document.getElementById('patrimonioInput').value) || 0;
  patrimonio = valor;
  localStorage.setItem(LS_CACHE_PATRIMONIO, String(valor));
  try {
    await fetch(apiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'patrimonio', valor })
    });
    toast('Guardado');
  } catch (err) {
    toast('Sin conexión: se guardó localmente');
  }
});

async function cargarPatrimonio() {
  try {
    const res = await fetch(apiUrl() + '?action=config');
    const data = await res.json();
    patrimonio = Number(data.patrimonioInvertido) || 0;
    localStorage.setItem(LS_CACHE_PATRIMONIO, String(patrimonio));
  } catch (err) {
    patrimonio = Number(localStorage.getItem(LS_CACHE_PATRIMONIO)) || 0;
  }
}

// ---------- Init ----------
function init() {
  document.getElementById('fecha').value = new Date().toISOString().slice(0, 10);
  document.getElementById('moneda').value = estado.moneda;
  document.getElementById('monedaDestino').value = estado.monedaDestino;
  renderMedioChips('medioChips', estado.moneda, estado.medio, (m) => { estado.medio = m; });
  renderMedioChips('medioChipsDestino', estado.monedaDestino, estado.medioDestino, (m) => { estado.medioDestino = m; });
  if (!apiUrl()) {
    categorias = CATEGORIAS_DEFAULT;
    renderCategoriaChips();
    document.getElementById('configOverlay').classList.add('active');
    return;
  }
  cargarCategorias();
  cargarMovimientos();
  cargarPatrimonio();
  sincronizarCola();
}

window.addEventListener('online', sincronizarCola);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

init();
