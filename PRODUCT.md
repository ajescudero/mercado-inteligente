# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product Purpose

MercadoInteligente permite buscar productos de supermercados de Mendoza, revisar precios y presentaciones por sucursal, armar una lista con cantidades y comparar esa misma canasta. También permite contrastar una compra con referencias mensuales de Cuyo. La interfaz debe conservar exactamente la información y los flujos reales existentes.

## Operating Context

Aplicación existente en Next.js y React, con catálogo SEPA local y consulta separada de Átomo online. Funciona en navegador de escritorio y celular. El rediseño Figma, las mejoras de búsqueda y referencias y P01 conviven en la misma aplicación. La distribución para revisión excluye datos locales y material privado; no representa otro producto. No hay despliegue público de producción.

La búsqueda y los filtros se conservan en la URL. La lista se guarda en el almacenamiento local del navegador con la clave `shopping-cart`. No requiere login ni cuenta. El tema usa `mercado-theme`; cuando no puede persistirse, sigue funcionando en la sesión.

## Capabilities and Constraints

- Diccionario revisado en `lib/search-vocabulary.ts`: molida/picada (Mendoza/Buenos Aires), morrón/pimiento y yogur/yogurt; mantiene la regla de limpiador/desodorante de pisos. La búsqueda conserva calificadores y no altera la identidad usada en la comparación. Para carne, la consulta existente a Átomo usa molida sin añadir solicitudes ni modificar su adaptador.
- Búsqueda por nombre, con reglas existentes de normalización y categoría, agrupación de ofertas, orden, paginación y filtros de tipo, categoría, supermercado, departamento, sucursal y precio por envase.
- Los filtros SEPA se aplican antes de paginar. Las categorías son reglas locales, no una clasificación oficial de la fuente.
- Cada oferta conserva presentación, precio, origen, fecha y ubicación disponible. No se presenta una publicación SEPA como verificación de precios en tiempo real.
- Átomo online se identifica como tienda online con envío o retiro. Una sucursal física en el directorio sin precios incorporados se informa como pendiente de integración, no como falta de stock.
- La lista conserva cantidades y elección de oferta. Los productos SEPA se vuelven a consultar al hidratar o abrir la lista; los productos online conservan su precio consultado y enlace, sin prometer actualización al abrirla.
- La comparación SEPA usa identidad de producto y cantidades. Los códigos internos se limitan al comercio y bandera de origen. Una alternativa de una sola sucursal exige cobertura de toda la canasta.
- Los artículos online se conservan al aplicar una comparación; cuentan en el total de la lista y quedan fuera de los subtotales SEPA. P01 incorpora estimaciones manuales de traslado por sucursal utilizada y envío online, con un máximo de una, dos o tres visitas. El subtotal de productos y esos gastos se muestran por separado. No calcula rutas ni verifica costos logísticos reales.
- Referencias ofrece un listado de productos y presentaciones SEPA de Mendoza, con promedio simple por producto entre sucursales, rango, fecha y cantidad de observaciones. La conexión de esta consulta es de sólo lectura. El promedio conserva código, descripción y presentación; no representa una encuesta regional ni comercios independientes.
- En una pestaña separada, Referencias conserva 14 productos del IPC INDEC de Cuyo, período octubre de 2026, con fuente y fecha visibles. Convierte unidades compatibles y calcula diferencias de importe y porcentaje. Son promedios regionales mensuales, no ofertas actuales ni promedios exclusivos de Mendoza.
- Los datos de referencias se actualizan manualmente; la interfaz avisa cuando el período tiene más de dos meses.
- La ausencia de foto se muestra explícitamente. No reemplazar un producto por la foto de otro ni sustituir información real por contenido del kit visual.
- No hay flujos implementados de checkout, pago, seguimiento de pedido, promociones del kit ni autenticación. No añadirlos por aparecer en la referencia.

## Brand Commitments

Conservar el nombre MercadoInteligente y la información de la aplicación. La redacción actual usa español rioplatense con voseo. No se ha definido una nueva promesa ni personalidad de marca.

La referencia visual elegida es Grocery App (Community), de Omar Yassir: https://www.figma.com/community/file/1117545712205927220. Se mantienen el concepto visual y la familia tipográfica elegidos, adaptados a las pantallas existentes. La atribución CC BY 4.0 permanece visible. Esta licencia de diseño no concede permiso sobre fotos y marcas de comercios.

## Evidence on Hand

- `app/page.tsx` y `components/Layout/`: inicio, búsqueda, navegación y filtros reales.
- `components/Product/`: productos, ofertas, sucursales, fotos y sus fallos.
- `components/Cart/`, `lib/cart-context.tsx`, `lib/cart-products.ts` y `lib/cart-optimization.ts` y `lib/net-savings.ts`: lista persistente, cantidades y comparación.
- `app/referencias/`, `components/References/`, `lib/market-references.ts` y `docs/market-references.md`: tabla, cálculo y procedencia de referencias.
- `public/fonts/OFL-DM-Sans.txt`, `public/design/grocery/`, `docs/design/asset-sources.json` y `THIRD_PARTY_NOTICES.md`: fuentes tipográficas y procedencia de assets.
- `tests/` y `package.json`: comprobaciones existentes. El resultado de una ejecución concreta debe acompañarse de su fecha y alcance; la presencia de pruebas no demuestra por sí sola que una versión pasó.

## Product Principles

1. Comparar el mismo producto y la misma cantidad; no reemplazar equivalencia exacta por parecido de nombre.
2. Mantener visible qué representa cada precio, de dónde viene y a qué momento o lugar corresponde.
3. Conservar la lista del usuario y permitir revisar ofertas antes de aplicar cambios de combinación.
4. Reutilizar la evidencia real y explicar ausencias; no inventar productos, ahorro, stock, reseñas ni ofertas.

## Accessibility & Inclusion

El pedido exige revisión en celular y escritorio, uso de teclado, foco y estados vacíos, de carga y error. La implementación tiene nombres accesibles, enlaces de salto, mensajes de estado, diálogos nativos, foco visible y opción de movimiento reducido. Esto describe mecanismos del código y no constituye una certificación de accesibilidad.
