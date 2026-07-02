/**
 * Backend de Mango: expone la Google Sheet como una mini API.
 * GET  ?action=movimientos -> lista todos los movimientos
 * GET  ?action=categorias  -> lista tipo/categoria/subcategoria + iconos
 * GET  ?action=config      -> devuelve la config (ej. patrimonioInvertido)
 * POST { fecha, tipo, monto, moneda, medioPago, categoria, subcategoria, nota,
 *        monedaDestino, medioPagoDestino, montoRecibido } -> agrega un movimiento
 * POST { action: 'editar', id, ...campos } -> edita un movimiento existente
 * POST { action: 'borrar', id } -> borra un movimiento por id
 * POST { action: 'patrimonio', valor } -> actualiza el patrimonio invertido manual
 */

var CAMPOS_MOVIMIENTO = ['fecha', 'tipo', 'monto', 'moneda', 'medioPago', 'categoria',
  'subcategoria', 'nota', 'monedaDestino', 'medioPagoDestino', 'montoRecibido'];

function doGet(e) {
  var action = e.parameter.action || 'movimientos';
  var sheet = SpreadsheetApp.getActiveSpreadsheet();

  if (action === 'categorias') {
    return jsonResponse(readSheet(sheet.getSheetByName('Categorias')));
  }
  if (action === 'config') {
    return jsonResponse(readConfig(sheet.getSheetByName('Config')));
  }
  return jsonResponse(readSheet(sheet.getSheetByName('Movimientos')));
}

function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet();

  if (body.action === 'borrar') {
    borrarMovimiento(sheet.getSheetByName('Movimientos'), body.id);
    return jsonResponse({ ok: true });
  }

  if (body.action === 'editar') {
    editarMovimiento(sheet.getSheetByName('Movimientos'), body);
    return jsonResponse({ ok: true });
  }

  if (body.action === 'patrimonio') {
    escribirConfig(sheet.getSheetByName('Config'), 'patrimonioInvertido', body.valor);
    return jsonResponse({ ok: true });
  }

  var movSheet = sheet.getSheetByName('Movimientos');
  var id = Utilities.getUuid();
  movSheet.appendRow([id].concat(filaDesdeBody(body)).concat([new Date()]));
  // fuerza texto plano en la columna fecha: si no, Sheets la autoconvierte a
  // un valor de fecha real y al leerla vuelve como objeto Date (ver readSheet)
  var fila = movSheet.getLastRow();
  movSheet.getRange(fila, 2).setNumberFormat('@');
  return jsonResponse({ ok: true, id: id });
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

function editarMovimiento(sheet, body) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(body.id)) {
      var fila = i + 1;
      sheet.getRange(fila, 2, 1, 11).setValues([filaDesdeBody(body)]);
      sheet.getRange(fila, 2).setNumberFormat('@');
      return;
    }
  }
}

function borrarMovimiento(sheet, id) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
}

function readSheet(sheet) {
  var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  var data = sheet.getDataRange().getValues();
  var headers = data.shift();
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
