# Mango

PWA personal para anotar gastos, ingresos y transferencias en AUD, EUR, ARS y USD, con Google Sheets como base de datos.

## 1. Crear la Google Sheet

1. Andá a Google Sheets y creá una planilla nueva. Llamala, por ejemplo, "Mango DB".
2. Creá tres pestañas con estos nombres exactos: **Movimientos**, **Categorias** y **Config**.

3. En **Movimientos**, poné estos encabezados en la fila 1 (columnas A a N):

   ```
   id | fecha | tipo | monto | moneda | medioPago | categoria | subcategoria | nota | monedaDestino | medioPagoDestino | montoRecibido | timestamp | grupo
   ```

   `grupo` (columna N) es la que liga varios cargos de un mismo gasto (ej. envío + propina de un delivery). Si tu planilla es de antes de septiembre 2026, agregá solo el encabezado `grupo` en la celda N1; las filas viejas quedan vacías ahí y no pasa nada.

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
   | token | (opcional, ver abajo) |

   `patrimonioInvertido` lo vas actualizando desde la pestaña Resumen de la app. Los `saldoInicial_MONEDA_MEDIO` son el punto de partida de cada cuenta: Mango suma a ese número solo los movimientos que cargaste vos (el histórico migrado no cuenta para el saldo, ya está incluido ahí). No hace falta editarlos a mano: en Resumen tocás la cuenta, escribís el saldo real que ves en el banco y la app recalcula el punto de partida sola. Si aparece una cuenta nueva (ARS, USD) arranca en 0 hasta que la ajustes.

   `token` es opcional. Si lo ponés (cualquier texto, ej. una frase larga), toda llamada a la API tiene que traer ese mismo valor, así la URL sola ya no alcanza para leer o escribir tu planilla. Después lo cargás una vez en ⚙️ de la app. Si dejás la fila vacía o no la creás, no hay chequeo.

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

- **Cargar**: tipo (Gasto/Ingreso/Transferencia), fecha con chips rápidos (Hoy/Ayer/Antes de ayer o calendario), cuenta como moneda + medio de pago, monto (acepta coma o punto decimal y cuentitas tipo `45+12,50`), categoría/subcategoría con íconos, nota con sugerencias de lo que ya usaste en esa categoría. Debajo del botón Guardar está el mini-listado de últimos movimientos; tocás uno y se abre para editar (con Duplicar hoy y Borrar).
- **Ligar cargos**: cuando un gasto sale como varios cargos en la tarjeta (envío + propina, dos pagos), después de guardar el primero tocás "Ligar otro cargo": queda todo precargado y solo escribís el monto. En las listas aparecen como una sola entrada con el total y un desplegable con las partes.
- **Movimientos**: búsqueda por nota/categoría, filtros por tipo/moneda/mes (arranca en el mes actual), totales por moneda. El historial largo se muestra de a tandas con "Mostrar más".
- **Resumen**: saldo por cuenta (tocás una para ajustarla al saldo real del banco), resumen del mes con navegación entre meses (gastado, ingresado, balance y gasto por categoría con barras), gasto mensual de los últimos 6 meses por moneda, y el campo manual de patrimonio invertido.
- **Offline**: si no hay señal al guardar, el movimiento queda encolado en el celu y se sincroniza solo cuando vuelve la conexión. Cada movimiento nace con un id generado en el celu, así que reintentar un guardado nunca duplica.
- **Velocidad**: la app abre desde caché al instante y baja la versión nueva en segundo plano (avisa con un cartel cuando hay una). Al abrir hace una sola llamada al backend (`bootstrap`) que trae categorías, config y los movimientos recientes. El histórico migrado se baja una sola vez y queda guardado en el celu; "Volver a bajar todo el historial" en ⚙️ lo fuerza si hiciera falta.
- Las categorías y sus íconos se leen de la pestaña **Categorias**: para agregar/sacar/cambiar una, editás la planilla directamente.

## Próximos pasos posibles (no incluidos en esta versión)

- Pestañas abajo y botón Guardar fijo (al alcance del pulgar).
- Presupuestos por categoría con alertas.
- Conversión a una sola moneda para un total de patrimonio (cotizaciones manuales en Config).
