# Mango

PWA personal para anotar gastos, ingresos y transferencias en AUD, EUR, ARS y USD, con Google Sheets como base de datos.

## 1. Crear la Google Sheet

1. Andá a Google Sheets y creá una planilla nueva. Llamala, por ejemplo, "Mango DB".
2. Creá tres pestañas con estos nombres exactos: **Movimientos**, **Categorias** y **Config**.

3. En **Movimientos**, poné estos encabezados en la fila 1 (columnas A a M):

   ```
   id | fecha | tipo | monto | moneda | medioPago | categoria | subcategoria | nota | monedaDestino | medioPagoDestino | montoRecibido | timestamp
   ```

4. En **Categorias**, poné estos encabezados en la fila 1:

   ```
   tipo | categoria | categoriaIcono | subcategoria | subcategoriaIcono
   ```

   Y cargá esta taxonomía (una fila por subcategoría; las categorías sin subcategorías van con esas dos columnas vacías):

   | tipo | categoria | categoriaIcono | subcategoria | subcategoriaIcono |
   |---|---|---|---|---|
   | Gasto | Comida | 🍔 | Mercado | 🛒 |
   | Gasto | Comida | 🍔 | Restaurante | 🍽️ |
   | Gasto | Comida | 🍔 | Delivery | 🛵 |
   | Gasto | Transporte | 🚌 | Público | 🚌 |
   | Gasto | Transporte | 🚌 | Taxi/App | 🚕 |
   | Gasto | Transporte | 🚌 | Vuelos | ✈️ |
   | Gasto | Transporte | 🚌 | Combustible/Mecánico | ⛽ |
   | Gasto | Alojamiento | 🏠 | Alquiler | 🏠 |
   | Gasto | Alojamiento | 🏠 | Airbnb/Hotel | 🏨 |
   | Gasto | Compras | 🛍️ | Ropa/Zapatos | 👕 |
   | Gasto | Compras | 🛍️ | Varios | 🛍️ |
   | Gasto | Salud y bienestar | 💊 | Médico/Farmacia | 💊 |
   | Gasto | Salud y bienestar | 💊 | Bienestar | 🧘 |
   | Gasto | Ocio | 🎉 | | |
   | Gasto | Servicios | 🧾 | Suscripciones | 💳 |
   | Gasto | Servicios | 🧾 | Teléfono/Internet/eSIM | 📶 |
   | Gasto | Servicios | 🧾 | Otro | 🗂️ |
   | Gasto | Regalos | 🎁 | | |
   | Gasto | Finanzas | 💰 | Comisiones | 🏦 |
   | Gasto | Finanzas | 💰 | Préstamos | 🤝 |
   | Gasto | Finanzas | 💰 | Cambio de moneda | 💱 |
   | Gasto | Finanzas | 💰 | Trámites | 📝 |
   | Gasto | Inversiones | 📈 | ETF | 🧺 |
   | Gasto | Inversiones | 📈 | Cripto | 🪙 |
   | Gasto | Inversiones | 📈 | Acciones | 📊 |
   | Gasto | Otros | 📦 | | |
   | Ingreso | Sueldo | 💼 | | |
   | Ingreso | Intereses | 📈 | | |
   | Ingreso | Regalo recibido | 🎁 | | |
   | Ingreso | Otro ingreso | ➕ | | |

   Notas sobre esta versión de la taxonomía: Ropa y Zapatos quedaron fusionados en una subcategoría (Varios sigue siendo el cajón de sastre para Temu/Amazon/compras online sueltas). "Suscripciones" pasó a ser Servicios, con Teléfono/Internet/eSIM como subcategoría propia (el eSIM de viaje se anota ahí) y "Otro" para trámites/gestiones puntuales (ej. police check). Trámites (Finanzas) ahora incluye visas. Transporte>Combustible/Mecánico también cubre gastos de taller/mecánico. Viajes se eliminó como categoría: Storage y actividades de viaje van a Ocio u Otros según el caso. Inversiones se independizó de Finanzas como categoría propia, con ETF/Cripto/Acciones como subcategorías.

   Para agregar, sacar o cambiar el ícono de una categoría, editás esta pestaña directamente, no hace falta tocar código.

5. En **Config**, poné estos encabezados en la fila 1:

   ```
   clave | valor
   ```

   Y estas filas:

   | clave | valor |
   |---|---|
   | patrimonioInvertido | 0 |
   | saldoInicial_AUD_Banco | (tu saldo real de banco AUD hoy) |
   | saldoInicial_AUD_Efectivo | (tu efectivo AUD hoy) |
   | saldoInicial_EUR_Banco | (tu saldo real de banco EUR hoy) |
   | saldoInicial_EUR_Efectivo | (tu efectivo EUR hoy) |
   | saldoInicialFecha | (fecha de hoy, ej. 2026-07-01) |

   `patrimonioInvertido` lo vas actualizando a mano desde la pestaña Activos de la app cuando te acuerdes. Los `saldoInicial_MONEDA_MEDIO` son necesarios porque Mango no puede reconstruir tu saldo real de antes de usar la app (el histórico migrado no trae saldo de apertura) — con esto, "Saldo estimado por cuenta" arranca de ahí y solo suma/resta movimientos con fecha posterior a `saldoInicialFecha`. Si sumás una cuenta nueva (ej. ARS o USD) más adelante, agregás su fila `saldoInicial_ARS_MercadoPago` cuando quieras; si no existe, esa cuenta arranca en 0.

## 2. Deployar el backend (Google Apps Script)

1. En la misma planilla: **Extensiones → Apps Script**.
2. Borrá el contenido default y pegá el contenido de [`apps-script/Code.gs`](apps-script/Code.gs).
3. Guardá (ícono de disquete).
4. Arriba a la derecha: **Implementar → Nueva implementación**.
5. Tipo: **Aplicación web**.
6. "Ejecutar como": **Yo (tu cuenta)**.
7. "Quién tiene acceso": **Cualquier usuario** (necesario para que la app en el celu pueda llamarla sin login).
8. Implementar → copiá la **URL de la aplicación web** que te da (termina en `/exec`). Esa es tu API.
9. Cada vez que edites `Code.gs`, tenés que hacer **Implementar → Administrar implementaciones → editar (lápiz) → Nueva versión → Implementar** para que los cambios se reflejen en esa misma URL.

## 3. La PWA ya está publicada

Repo: [github.com/manuelgcosini-ctrl/mango](https://github.com/manuelgcosini-ctrl/mango) (público, sin datos personales — el historial de gastos vive solo en tu Google Sheet).

URL en vivo: **https://manuelgcosini-ctrl.github.io/mango/**

Se actualiza sola: cada `git push` a `main` que toque algo en `public/` dispara el workflow de `.github/workflows/deploy-pages.yml` y redeploya en ~20 segundos. Para forzar un redeploy manual: `gh workflow run deploy-pages.yml` (o Actions → Deploy Mango a GitHub Pages → Run workflow).

## 4. Primer uso en el celu

1. Abrí **https://manuelgcosini-ctrl.github.io/mango/** en Chrome (Android) o Safari (iPhone).
2. Te va a pedir la **URL del Apps Script** (la del paso 2.8) — pegala en el ícono ⚙️.
3. Menú del navegador → **Agregar a pantalla de inicio**. Queda como una app más, se llama "Mango".
4. Listo: abrís, elegís Gasto/Ingreso/Transferencia, cargás, cerrás.

## Cómo funciona

- **Cargar**: elegís tipo (Gasto/Ingreso/Transferencia), fecha con chips rápidos (Hoy/Ayer/Antes de ayer), cuenta como moneda + medio de pago, monto (podés escribir una cuentita tipo `45+12.50` y la calcula sola), categoría/subcategoría con íconos, nota. Debajo del botón Guardar hay un mini-listado de los últimos movimientos para chequear si ya cargaste algo. En Transferencia, además pedís la cuenta destino y el monto recibido, y te muestra la tasa implícita.
- **Movimientos**: lista agrupada por mes, filtrable por tipo/moneda/mes, con totales de gasto e ingreso por moneda (sin conversión entre monedas).
- **Activos**: saldo estimado por cuenta (calculado solo de tus movimientos), gasto por categoría del mes, y un campo manual de "patrimonio invertido" (ETFs, cripto) que actualizás vos a mano — la app no se conecta a ninguna cotización.
- **Offline**: si no hay señal al guardar, el movimiento queda encolado en el celu y se sincroniza solo cuando vuelve la conexión.
- Las categorías y sus íconos se leen de la pestaña **Categorias**: para agregar/sacar/cambiar una, editás la planilla directamente.

## Próximos pasos posibles (no incluidos en esta versión)

- Migrar el histórico de Money Manager / Realbyte a este formato (traducir categorías viejas, excluir ajustes de apertura, separar transferencias de gastos reales).
- Presupuestos por categoría con alertas.
- Gráficos de tendencia.
- Conversión a una sola moneda para un total de patrimonio.
