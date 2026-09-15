/**
 * Backend de Mango: expone la Google Sheet como una mini API.
 *
 * GET  ?action=bootstrap               -> { categorias, config, recientes, total } en una sola llamada
 * GET  ?action=movimientos             -> lista todos los movimientos
 * GET  ?action=movimientos&recientes=1 -> solo los que no son del historial migrado (id sin prefijo "mig-")
 * GET  ?action=movimientos&desde=N&limite=M -> { filas, total, desde } para bajar el historial por tandas
 * GET  ?action=categorias / ?action=config
 * POST { id?, fecha, tipo, monto, moneda, medioPago, categoria, subcategoria, nota,
 *        monedaDestino, medioPagoDestino, montoRecibido, grupo? } -> agrega (o, si el id ya existe, actualiza)
 * POST { action: 'editar', id, ...campos }
 * POST { action: 'borrar', id }
 * POST { action: 'config', clave, valor }   -> escribe cualquier clave de Config
 * POST { action: 'patrimonio', valor }      -> alias viejo de config patrimonioInvertido
 *
 * Seguridad opcional: si en Config existe la clave "token", toda llamada tiene que
 * traer el mismo valor (?token=... en GET, "token" en el body en POST).
 */

var COLS = 14; // id, fecha, tipo, monto, moneda, medioPago, categoria, subcategoria, nota, monedaDestino, medioPagoDestino, montoRecibido, timestamp, grupo

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cfg = readConfig(ss.getSheetByName('Config'));
  if (!autorizado(cfg, e.parameter.token)) return jsonResponse({ error: 'no autorizado' });

  var action = e.parameter.action || 'movimientos';

  if (action === 'bootstrap') {
    var todos = readSheet(ss.getSheetByName('Movimientos'));
    return jsonResponse({
      categorias: readSheet(ss.getSheetByName('Categorias')),
      config: cfg,
      recientes: soloRecientes(todos),
      total: todos.length
    });
  }
  if (action === 'categorias') return jsonResponse(readSheet(ss.getSheetByName('Categorias')));
  if (action === 'config') return jsonResponse(cfg);

  // tanda del historial: lee solo ese rango de filas, no la hoja entera
  if (action === 'movimientos' && e.parameter.desde !== undefined) {
    return jsonResponse(leerPagina(ss.getSheetByName('Movimientos'),
      Number(e.parameter.desde) || 0, Number(e.parameter.limite) || 600));
  }

  var movimientos = readSheet(ss.getSheetByName('Movimientos'));
  if (e.parameter.recientes) movimientos = soloRecientes(movimientos);
  return jsonResponse(movimientos);
}

function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cfg = readConfig(ss.getSheetByName('Config'));
  if (!autorizado(cfg, body.token)) return jsonResponse({ error: 'no autorizado' });

  var movSheet = ss.getSheetByName('Movimientos');

  if (body.action === 'borrar') {
    var fila = filaPorId(movSheet, body.id);
    if (fila) movSheet.deleteRow(fila);
    return jsonResponse({ ok: true });
  }

  if (body.action === 'editar') {
    var filaEd = filaPorId(movSheet, body.id);
    if (filaEd) escribirFila(movSheet, filaEd, body);
    return jsonResponse({ ok: true, encontrado: !!filaEd });
  }

  if (body.action === 'config') {
    escribirConfig(ss.getSheetByName('Config'), body.clave, body.valor);
    return jsonResponse({ ok: true });
  }

  if (body.action === 'patrimonio') {
    escribirConfig(ss.getSheetByName('Config'), 'patrimonioInvertido', body.valor);
    return jsonResponse({ ok: true });
  }

  // alta. Si el cliente manda id y ya existe, se actualiza en vez de duplicar
  // (esto hace que reintentar un guardado por mala señal sea inofensivo).
  var id = body.id || Utilities.getUuid();
  var existente = body.id ? filaPorId(movSheet, body.id) : null;
  if (existente) {
    escribirFila(movSheet, existente, body);
    return jsonResponse({ ok: true, id: id, duplicado: true });
  }
  movSheet.appendRow([id].concat(filaDesdeBody(body)).concat([new Date(), body.grupo || '']));
  var ultima = movSheet.getLastRow();
  movSheet.getRange(ultima, 2).setNumberFormat('@'); // fecha como texto plano, ver readSheet
  return jsonResponse({ ok: true, id: id });
}

function autorizado(cfg, token) {
  if (!cfg.token) return true;
  return String(token || '') === String(cfg.token);
}

function soloRecientes(movimientos) {
  return movimientos.filter(function (m) { return String(m.id).indexOf('mig-') !== 0; });
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

function readSheet(sheet) {
  var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  var data = sheet.getDataRange().getValues();
  var headers = data.shift();
  return mapearFilas(headers, data, tz);
}

function leerPagina(sheet, desde, limite) {
  var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var total = Math.max(0, lastRow - 1);
  var cant = Math.min(limite, total - desde);
  if (cant <= 0) return { filas: [], total: total, desde: desde };
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var data = sheet.getRange(2 + desde, 1, cant, lastCol).getValues();
  return { filas: mapearFilas(headers, data, tz), total: total, desde: desde };
}

function readConfig(sheet) {
  var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
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

function escribirConfig(sheet, clave, valor) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === clave) {
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
