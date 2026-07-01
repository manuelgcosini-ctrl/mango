/**
 * Backend de Mango: expone la Google Sheet como una mini API.
 * GET  ?action=movimientos -> lista todos los movimientos
 * GET  ?action=categorias  -> lista tipo/categoria/subcategoria + iconos
 * GET  ?action=config      -> devuelve la config (ej. patrimonioInvertido)
 * POST { fecha, tipo, monto, moneda, medioPago, categoria, subcategoria, nota,
 *        monedaDestino, medioPagoDestino, montoRecibido } -> agrega un movimiento
 * POST { action: 'borrar', id } -> borra un movimiento por id
 * POST { action: 'patrimonio', valor } -> actualiza el patrimonio invertido manual
 */

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

  if (body.action === 'patrimonio') {
    escribirConfig(sheet.getSheetByName('Config'), 'patrimonioInvertido', body.valor);
    return jsonResponse({ ok: true });
  }

  var movSheet = sheet.getSheetByName('Movimientos');
  var id = Utilities.getUuid();
  movSheet.appendRow([
    id,
    body.fecha,
    body.tipo,
    Number(body.monto),
    body.moneda,
    body.medioPago || '',
    body.categoria || '',
    body.subcategoria || '',
    body.nota || '',
    body.monedaDestino || '',
    body.medioPagoDestino || '',
    body.montoRecibido !== '' && body.montoRecibido != null ? Number(body.montoRecibido) : '',
    new Date()
  ]);
  return jsonResponse({ ok: true, id: id });
}

function borrarMovimiento(sheet, id) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
}

function readSheet(sheet) {
  var data = sheet.getDataRange().getValues();
  var headers = data.shift();
  return data.map(function (row) {
    var obj = {};
    headers.forEach(function (h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function readConfig(sheet) {
  var data = sheet.getDataRange().getValues();
  var out = {};
  for (var i = 1; i < data.length; i++) {
    out[data[i][0]] = data[i][1];
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
