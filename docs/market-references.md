# Precios de referencia

Ruta `/referencias`, accesible desde la navegación del catálogo. Propósito: comparar el importe de una compra con una referencia minorista regional normalizada por cantidad. No determina automáticamente que un comercio sea caro ni calcula precios sugeridos de reventa.

## Datos incorporados

14 artículos del **cuadro 19, columna Cuyo, página 12** del IPC INDEC de octubre de 2026, publicado el 12 de noviembre de 2026. Fuente:
https://www.indec.gob.ar/uploads/informesdeprensa/ipc_11_269335F5BA6B.pdf#page=12

La columna fue contrastada visualmente con el PDF. No se usaron las columnas GBA, Pampeana, Noreste, Noroeste ni Patagonia. Cuyo es una referencia regional, no un promedio exclusivo de Mendoza. Las presentaciones se conservan: fideos 500 g, aceite 1,5 litros, detergente 750 cc, jabón 125 g, huevos por docena. `lib/market-references.ts` contiene la fuente, fecha, productos y conversiones.

La fórmula es `precio de referencia × cantidad de compra normalizada / cantidad publicada normalizada`. La diferencia porcentual utiliza ese importe equivalente como denominador. Sólo se permiten conversiones dentro de la misma dimensión: kg/g, litros/ml y docenas/unidades. No se infiere calidad, marca, merma ni margen comercial.

## Actualización

Esta versión no descarga datos automáticamente. Al pasar 62 días desde el cierre del período aparece un aviso de referencia histórica. Consultar nuevas publicaciones desde https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31.

Para incorporar otro período: descargar el informe enlazado oficialmente, verificar su fecha y la columna Cuyo con el PDF renderizado, actualizar datos y metadatos juntos en `market-references.ts`, revisar todas las menciones de fecha en `MarketReferences.tsx`, ejecutar `npm run test:all`, ESLint y `npm run build`, y contrastar al menos una fila por rubro con la fuente. No sustituir valores faltantes por otra región ni por valores estimados. No presentar el período del relevamiento como fecha de consulta.

## Fuentes enlazadas, sin importación

- Agricultura de Mendoza: precios al consumidor final de frutas, hortalizas y huevos. La búsqueda identificó publicaciones hasta 29/09/2026, pero la apertura directa devolvió 403; no se confirma que sea la última publicación disponible. No se importaron importes.
- IPCVA: informe de octubre de 2026 para AMBA, Rosario y Córdoba. No es un relevamiento de Mendoza y permanece separado de la tabla.
- Andina Oeste: proveedor mayorista de Mendoza. El sitio muestra bultos, cajas y bolsas; se enlaza con su carácter mayorista, sin transformar sus precios en sugerencias minoristas.

## Límites y pruebas

Pruebas unitarias en `tests/market-references.test.ts`: conversión de 500 g de carne, 500 ml de aceite y media docena de huevos; rechazo de unidades incompatibles, cero, valores no finitos y entradas mal formadas; lectura de decimales argentinos; fecha de referencia histórica. Se verificaron además filtros, ausencia de coincidencias, navegación y cálculo en escritorio y móvil.

La consulta y calculadora se ejecutan localmente; no envían el importe que ingresa la persona a las fuentes externas. Los enlaces externos sólo se abren cuando la persona los elige. No se modifican la base SEPA ni las integraciones de supermercados.

## Ampliación solicitada el 22/11/2026

La vista inicial ahora es Mendoza · Supermercados. `reference-catalog-server.ts` abre el snapshot existente con SQLite readonly, consulta sólo su fecha de actualización y agrupa por código, descripción y presentación. Calcula AVG/MIN/MAX después de conservar una observación por sucursal. No mezcla envases, códigos internos, distintos nombres ni fechas. Se descartan importes menores de 100 y presentaciones no convertibles (por ejemplo multipacks ambiguos). No se modifica el snapshot ni se incorpora otra fuente.

`reference-catalog.ts` contiene reglas conservadoras por rubro, no precios inventados. Hay 7.527 filas en el snapshot de 22/11/2026: 604 Carnicería, 827 Verdulería y 6.096 Despensa. Son productos/presentaciones del catálogo, no esa cantidad de cortes o especies diferentes. Los códigos distintos pueden tener nombres iguales. Se muestran 24 por página, con buscador y filtros.

La calculadora usa la presentación publicada de cada fila. El promedio es simple entre sucursales disponibles para ese producto; no es una media ponderada de ventas ni un índice oficial de Mendoza/Cuyo. No representa comercios independientes ni incluye Átomo online. Un único precio se rotula Precio; el rango aparece cuando varía entre sucursales.

Los 14 valores oficiales siguen intactos en Cuyo · INDEC. Se volvió a consultar el cuadro 19 del informe oficial: la tabla regional está limitada a esos 14 artículos; la tabla más extensa siguiente corresponde a GBA. No se trasladaron valores de GBA a Cuyo. La descarga del relevamiento provincial de Agricultura volvió a responder 403, por lo que no se importaron importes no verificables.
