/**
 * Backend de Mango: expone la Google Sheet como una mini API.
 *
 * GET  ?action=bootstrap               -> { categorias, config, recientes, total } en una sola llamada
 * GET  ?action=movimientos             -> lista todos los movimientos
 * GET  ?action=movimientos&recientes=1 -> solo los que no son del historial migrado (id sin prefijo "mig-")
 * GET  ?action=movimientos&desde=N&limite=M -> { filas, total, desde } para bajar el historial por tandas
 * GET  ?action=categorias / ?action=config
 * POST { id?, fecha, tipo, monto, moneda, medioPago, categoria, subcategoria, nota,
 *        monedaDestino, medioPagoDestino, montoRecibido, grupo? } -> agrega. Si el id ya existe
 *        no toca nada y responde { duplicado: true } (reintentar un guardado es inofensivo).
 * POST { action: 'editar', id, ...campos }
 * POST { action: 'borrar', id }
 * POST { action: 'config', clave, valor }   -> escribe cualquier clave de Config
 * POST { action: 'patrimonio', valor }      -> alias viejo de config patrimonioInvertido
 *
 * Seguridad opcional: si en Config existe la clave "token", toda llamada tiene que
 * traer el mismo valor (?token=... en GET, "token" en el body en POST).
 *
 * Config "historialVersion": la escribe el backend solo cuando se edita o borra una fila
 * del historial importado (id "mig-"). Los otros dispositivos la comparan con la suya y,
 * si cambió, vuelven a bajar el historial.
 */

var COLS = 14; // id, fecha, tipo, monto, moneda, medioPago, categoria, subcategoria, nota, monedaDestino, medioPagoDestino, montoRecibido, timestamp, grupo
var ACCIONES_POST = ['borrar', 'editar', 'config', 'patrimonio'];

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tz = ss.getSpreadsheetTimeZone();
  var cfg = readConfig(ss.getSheetByName('Config'), tz);
  if (!autorizado(cfg, e.parameter.token)) return jsonResponse({ error: 'no autorizado' });

  var action = e.parameter.action || 'movimientos';
  var movSheet = ss.getSheetByName('Movimientos');

  if (action === 'bootstrap') {
    var rec = leerRecientes(movSheet, tz);
    return jsonResponse({
      categorias: readSheet(ss.getSheetByName('Categorias'), tz),
      config: cfg,
      recientes: rec.filas,
      total: rec.total
    });
  }
  if (action === 'categorias') return jsonResponse(readSheet(ss.getSheetByName('Categorias'), tz));
  if (action === 'config') return jsonResponse(cfg);

  // tanda del historial: lee solo ese rango de filas, no la hoja entera
  if (action === 'movimientos' && e.parameter.desde !== undefined) {
    return jsonResponse(leerPagina(movSheet, tz,
      Number(e.parameter.desde) || 0, Number(e.parameter.limite) || 600));
  }

  var movimientos = readSheet(movSheet, tz);
  if (e.parameter.recientes) movimientos = soloRecientes(movimientos);
  return jsonResponse(movimientos);
}

function doPost(e) {
  // Un solo POST a la vez. Sin esto, un borrado corre las filas mientras otra
  // edición está escribiendo por número de fila y termina pisando otro movimiento.
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return manejarPost(e);
  } finally {
    lock.releaseLock();
  }
}

function manejarPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ error: 'body inválido' });
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tz = ss.getSpreadsheetTimeZone();
  var cfgSheet = ss.getSheetByName('Config');
  var cfg = readConfig(cfgSheet, tz);
  if (!autorizado(cfg, body.token)) return jsonResponse({ error: 'no autorizado' });

  // una acción desconocida antes caía en "alta" y, con un id existente, blanqueaba la fila
  if (body.action && ACCIONES_POST.indexOf(body.action) === -1) {
    return jsonResponse({ error: 'acción desconocida: ' + body.action });
  }

  var movSheet = ss.getSheetByName('Movimientos');

  if (body.action === 'borrar') {
    if (!body.id) return jsonResponse({ error: 'falta id' });
    var fila = filaPorId(movSheet, body.id);
    if (fila) movSheet.deleteRow(fila);
    return jsonResponse({ ok: true, encontrado: !!fila, historialVersion: marcarHistorial(cfgSheet, body.id, !!fila) });
  }

  if (body.action === 'editar') {
    if (!body.id) return jsonResponse({ error: 'falta id' });
    if (!filaValida(body)) return jsonResponse({ error: 'movimiento incompleto (falta fecha o monto)' });
    var filaEd = filaPorId(movSheet, body.id);
    if (filaEd) escribirFila(movSheet, filaEd, body);
    return jsonResponse({ ok: true, encontrado: !!filaEd, historialVersion: marcarHistorial(cfgSheet, body.id, !!filaEd) });
  }

  if (body.action === 'config') {
    if (!body.clave) return jsonResponse({ error: 'falta clave' });
    escribirConfig(cfgSheet, body.clave, body.valor);
    return jsonResponse({ ok: true });
  }

  if (body.action === 'patrimonio') {
    escribirConfig(cfgSheet, 'patrimonioInvertido', body.valor);
    return jsonResponse({ ok: true });
  }

  // alta
  if (!filaValida(body)) return jsonResponse({ error: 'movimiento incompleto (falta fecha o monto)' });
  var id = body.id || Utilities.getUuid();
  if (body.id && filaPorId(movSheet, body.id)) {
    // Ya estaba: es el reintento de un guardado cuya respuesta se perdió en el camino.
    // No se pisa nada, así una edición hecha entre medio desde otro dispositivo sobrevive.
    return jsonResponse({ ok: true, id: id, duplicado: true });
  }
  movSheet.appendRow([id].concat(filaDesdeBody(body)).concat([new Date(), body.grupo || '']));
  movSheet.getRange(movSheet.getLastRow(), 2).setNumberFormat('@'); // fecha como texto plano, ver mapearFilas
  return jsonResponse({ ok: true, id: id });
}

function autorizado(cfg, token) {
  if (!cfg.token) return true;
  return String(token || '') === String(cfg.token);
}

function filaValida(body) {
  return !!body.fecha && isFinite(Number(body.monto));
}

// si se tocó una fila del historial importado, los otros dispositivos tienen que volver a bajarlo
function marcarHistorial(cfgSheet, id, huboCambio) {
  if (!huboCambio || String(id).indexOf('mig-') !== 0) return null;
  var v = String(Date.now());
  escribirConfig(cfgSheet, 'historialVersion', v);
  return v;
}

function esMigrado(id) {
  return String(id).indexOf('mig-') === 0;
}

function soloRecientes(movimientos) {
  return movimientos.filter(function (m) { return !esMigrado(m.id); });
}

function filaPorId(sheet, id) {
  if (!id) return null;
  var celda = sheet.getRange(1, 1, sheet.getLastRow(), 1)
    .createTextFinder(String(id)).matchEntireCell(true).findNext();
  return celda ? celda.getRow() : null;
}

function filaDesdeBody(body) {
  return [
    body.fecha,
    body.tipo,
    Number(body.monto) || 0,
    body.moneda,
    body.medioPago || '',
    body.categoria || '',
    body.subcategoria || '',
    body.nota || '',
    body.monedaDestino || '',
    body.medioPagoDestino || '',
    body.montoRecibido !== '' && body.montoRecibido != null ? Number(body.montoRecibido) : ''
  ];
}

function escribirFila(sheet, fila, body) {
  sheet.getRange(fila, 2, 1, 11).setValues([filaDesdeBody(body)]);
  sheet.getRange(fila, 2).setNumberFormat('@');
  sheet.getRange(fila, COLS).setValue(body.grupo || '');
}

function mapearFilas(headers, data, tz) {
  return data.map(function (row) {
    var obj = {};
    headers.forEach(function (h, i) {
      var val = row[i];
      if (Object.prototype.toString.call(val) === '[object Date]') {
        // Sheets a veces autoconvierte texto tipo fecha a un valor Date real;
        // sin esto, JSON.stringify lo pasa a ISO/UTC y la fecha se corre de dia.
        val = (h === 'fecha')
          ? Utilities.formatDate(val, tz, 'yyyy-MM-dd')
          : Utilities.formatDate(val, tz, "yyyy-MM-dd'T'HH:mm:ss");
      }
      obj[h] = val;
    });
    return obj;
  });
}

function readSheet(sheet, tz) {
  var data = sheet.getDataRange().getValues();
  var headers = data.shift();
  return mapearFilas(headers, data, tz);
}

// Lo reciente (lo que se carga desde la app) vive al final de la hoja, después del bloque
// del historial importado. Se lee solo la columna de ids (barato) para ubicar dónde empieza
// y se trae únicamente ese bloque, en vez de las 2800 filas con sus fechas formateadas una por una.
function leerRecientes(sheet, tz) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var total = Math.max(0, lastRow - 1);
  if (!total) return { filas: [], total: 0 };

  var ids = sheet.getRange(2, 1, total, 1).getValues();
  var primero = -1;
  var contiguo = true;
  for (var i = 0; i < ids.length; i++) {
    var mig = esMigrado(ids[i][0]);
    if (!mig && primero === -1) primero = i;
    if (mig && primero !== -1) { contiguo = false; break; }
  }
  if (primero === -1) return { filas: [], total: total };
  if (!contiguo) return { filas: soloRecientes(readSheet(sheet, tz)), total: total }; // hay filas mezcladas: camino lento pero correcto

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var data = sheet.getRange(2 + primero, 1, total - primero, lastCol).getValues();
  return { filas: mapearFilas(headers, data, tz), total: total };
}

function leerPagina(sheet, tz, desde, limite) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var total = Math.max(0, lastRow - 1);
  var cant = Math.min(limite, total - desde);
  if (cant <= 0) return { filas: [], total: total, desde: desde };
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var data = sheet.getRange(2 + desde, 1, cant, lastCol).getValues();
  return { filas: mapearFilas(headers, data, tz), total: total, desde: desde };
}

function readConfig(sheet, tz) {
  var data = sheet.getDataRange().getValues();
  var out = {};
  for (var i = 1; i < data.length; i++) {
    var val = data[i][1];
    if (Object.prototype.toString.call(val) === '[object Date]') {
      val = Utilities.formatDate(val, tz, 'yyyy-MM-dd');
    }
    out[data[i][0]] = val;
  }
  return out;
}

function claveNormalizada(k) {
  return String(k || '').replace(/\s+/g, '').toLowerCase();
}

function escribirConfig(sheet, clave, valor) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    // "saldoInicial_ARS_Mercado Pago" y "saldoInicial_ARS_MercadoPago" son la misma clave
    if (claveNormalizada(data[i][0]) === claveNormalizada(clave)) {
      sheet.getRange(i + 1, 2).setValue(valor);
      return;
    }
  }
  sheet.appendRow([clave, valor]);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
