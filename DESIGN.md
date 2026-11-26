---
name: MercadoInteligente
description: Sistema visual de la aplicación de comparación de precios y lista de compra.
colors:
  "background": "#fff"
  "foreground": "#06161c"
  "surface": "#fff"
  "soft": "#f3f5f7"
  "muted": "#626b70"
  "border": "#e2e7eb"
  "primary": "#23aa49"
  "primary-strong": "#17813a"
  "primary-soft": "#e9f7ed"
  "price": "#d92540"
  "ring": "#17813a"
  "on-primary": "#fff"
  "dark-background": "#0d1f29"
  "dark-foreground": "#fff"
  "dark-surface": "#0d1f29"
  "dark-soft": "#1a3848"
  "dark-muted": "#a6bac6"
  "dark-border": "#35505e"
  "dark-primary-strong": "#67d48a"
  "dark-primary-soft": "#143e30"
  "dark-price": "#ff8294"
  "dark-ring": "#67d48a"
  "action-primary": "#17813a"
  "action-primary-hover": "#126c30"
typography:
  display:
    fontFamily: "\"DM Sans\", Arial, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-.04em"
  headline:
    fontFamily: "\"DM Sans\", Arial, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-.025em"
  title:
    fontFamily: "\"DM Sans\", Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    letterSpacing: "-.025em"
  body:
    fontFamily: "\"DM Sans\", Arial, sans-serif"
    fontWeight: 400
  label-strong:
    fontFamily: "\"DM Sans\", Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 700
  label:
    fontFamily: "\"DM Sans\", Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 500
  product-title:
    fontFamily: "\"DM Sans\", Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-.025em"
  product-price:
    fontFamily: "\"DM Sans\", Arial, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-.035em"
rounded:
  "sm": "8px"
  "field": "12px"
  "card": "16px"
  "banner-mobile": "20px"
  "dialog": "24px"
  "pill": "99px"
  "full": "3.40282e+38px"
  "circle": "50%"
spacing:
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "7": "28px"
  "8": "32px"
  "12": "48px"
components:
  button-primary:
    backgroundColor: "{colors.action-primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    padding: "12px 20px"
    typography: "{typography.label-strong}"
  button-primary-hover:
    backgroundColor: "{colors.action-primary-hover}"
  button-primary-disabled:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.muted}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
    typography: "{typography.label}"
  button-secondary-hover:
    backgroundColor: "{colors.soft}"
  button-add:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.circle}"
    width: "44px"
    height: "44px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.field}"
    padding: "8px 12px"
  filter-chip:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-strong}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    typography: "{typography.label}"
  product-card:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.card}"
    padding: "16px"
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.dialog}"
  navigation:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
---

# Design System: MercadoInteligente

## Overview

**Creative North Star: "Grocery App (Community), Omar Yassir"**

Sistema visual adaptado de Grocery App (Community), de Omar Yassir, elegido como referencia para MercadoInteligente. Conserva DM Sans, superficies claras y oscuras, verde de acción, precios coral, tarjetas suaves, controles circulares y navegación inferior en celular. La referencia es la autoridad visual; no se establece una nueva metáfora ni un lenguaje de marca adicional.

La densidad responde al catálogo existente: nombres, presentaciones, fechas, procedencia y sucursales siguen siendo legibles junto al precio. El escritorio amplía el patrón móvil con filtros laterales y rejillas de resultados; las pantallas sin frame reutilizan los mismos componentes.

**Key Characteristics:**

- DM Sans local para toda la interfaz.
- Verde para acciones y selección; coral para importes.
- Superficies tonales, tarjetas redondeadas y controles con área táctil de al menos 44 px en los componentes principales.
- Temas claro y oscuro coherentes con las variantes de Figma.
- Información de procedencia y presentación visible junto a los precios.

Fuente de implementación: `app/globals.css` y los componentes de `components/`. Este documento describe la copia local de revisión. El registro de decisiones de esta superficie vive en `.impeccable/surfaces/catalog.md`; la verdad del producto, en `PRODUCT.md`.

## Colors

La paleta combina neutros fríos, verde de acción y coral de precio. Los valores normativos están en el frontmatter; los nombres siguen los tokens de la aplicación.

### Primary

- **Verde de identidad** (`primary`): banner de inicio, círculos de agregar, cesta y marca de selección. Es común a ambos temas.
- **Verde de lectura** (`primary-strong`, `dark-primary-strong`): enlaces, estados seleccionados y texto de acción sobre superficies neutras.
- **Verde suave** (`primary-soft`, `dark-primary-soft`): selección y fondos de apoyo.
- **Acción principal** (`action-primary`, `action-primary-hover`): fondo del botón principal con texto blanco en ambos temas. Su fondo es deliberadamente independiente del texto semántico verde del tema oscuro.
- **Foco** (`ring`, `dark-ring`): contorno visible de teclado.

### Secondary

- **Coral de precio** (`price`, `dark-price`): importes de productos, ofertas, total y referencias. El contador circular conserva el coral claro de fondo con texto blanco.
- El diseño fuente usa coral `#FF324B`; la implementación lo adapta para lectura sobre las superficies de cada tema. El verde con texto blanco también se oscurece en los botones principales respecto del verde de identidad. Estas son adaptaciones de contraste, no nuevos colores de marca.

### Neutral

- **Fondo y superficie** (`background`, `surface` y sus variantes oscuras): lienzo, navegación, campos y diálogos.
- **Superficie suave** (`soft`, `dark-soft`): cabecera, tarjetas, fondos de fotografía y calculadora.
- **Tinta y texto auxiliar** (`foreground`, `muted` y variantes oscuras): jerarquía de lectura.
- **Línea** (`border`, `dark-border`): separación de ofertas, navegación, campos y estructura.
- `on-primary` se mantiene blanco. Los avisos usan las utilidades ámbar y rojo existentes; en oscuro se ajustan a texto ámbar `#f4c978`, texto rojo `#ff9baa` y fondo ámbar `#3a3020`.

Los aliases de Tailwind enlazan ink→foreground, surface→surface, soft→soft, muted→muted, line→border, brand→primary, brand-ink→primary-strong, brand-soft→primary-soft y price→price. Las claves `dark-*` del documento representan las sobreescrituras de los mismos tokens bajo `:root[data-theme=dark]`, no nuevas variables CSS.

Los tokens de este documento reflejan la aplicación; no definen una escala tonal adicional.

## Typography

**Familia:** DM Sans, con Arial y sans-serif como respaldo. Los archivos locales de 400, 500, 600 y 700 viven en `public/fonts/` y se cargan con `font-display: swap`. La licencia SIL OFL 1.1 acompaña a los archivos. La referencia Figma usa principalmente 500 y 700.

La jerarquía usa pesos y tamaños de una sola familia. Los precios utilizan cifras tabulares y formato monetario argentino; no se abrevian ni sustituyen por números de demostración.

| Rol | Aplicación |
| --- | --- |
| Display | Título del bloque de inicio; baja a 30 px en celular. |
| Headline | Encabezado del catálogo; baja a 24 px en celular. |
| Title | Secciones de inicio; diálogos usan título de 20 px y detalle de producto 24 px. |
| Body | Peso 400; el contenido usa principalmente 14 y 16 px según el componente. |
| Label | Etiquetas y navegación de escritorio; navegación móvil de 10 px con área táctil amplia. |
| Product title | Nombre completo en tarjeta; 13 px en celular y altura mínima para varias líneas. |
| Product price | Precio en tarjeta; 18 px en celular y 16 px bajo 360 px. |

Metadatos de catálogo y producto usan de 10 a 13 px en escritorio; la categoría llega a 9 px en celular. Son medidas observadas, no permiso para reducir los datos principales. Los títulos generales usan espaciado ligeramente cerrado; el precio y la marca tienen sus propios ajustes. La clase heredada `font-black` de escenarios puede solicitar un peso mayor que los archivos locales disponibles; no hay un archivo 900 cargado.

## Layout

La cabecera, navegación y catálogo comparten un contenedor máximo de 1280 px y márgenes laterales de 24 px. El contenido principal usa 28 px arriba, 48 px abajo y separación de 32 px entre filtros y resultados. El lateral de filtros mide 244 px, tiene separación interior derecha de 20 px y permanece fijo dentro del flujo con `top:110px`.

| Ancho CSS | Composición implementada |
| --- | --- |
| Más de 1150 px | Filtros visibles, rejilla de 3 columnas, ubicación y texto de Mi lista visibles en cabecera. |
| 1024–1150 px | Filtros visibles y rejilla de 2 columnas; se ocultan ubicación y texto de Mi lista, conservando el botón de cesta. |
| 768–1023 px | Filtros en diálogo lateral; rejilla de 3 columnas y navegación superior. |
| 360–767 px | Rejilla de 2 columnas; cabecera en dos filas y navegación inferior de 4 destinos. |
| Hasta 359 px | Márgenes laterales de 16 px; categorías de inicio en 2 columnas, rejilla de productos con separación de 10 px y marca sin símbolo. |

La rejilla de productos tiene separación normal de 16 px. En móvil las tarjetas pasan de 16 a 12 px de relleno; bajo 360 px usan 10 px. Las categorías se agrupan en 4 columnas dentro de 560 px, con círculos de 73 px; bajo 360 px pasan a 2 columnas con separación de 16 px. El bloque verde de inicio pasa de dos columnas a una en móvil.

En celular el contenido reserva 80 px para la navegación inferior; la barra respeta el área segura del dispositivo. Mi lista sale de la cabecera y permanece en la barra inferior. La cabecera deja de ser sticky; el catálogo usa 22 px arriba y 32 px abajo.

La página de referencias tiene máximo de 1160 px. Desde 1024 px combina tabla y calculadora de 22 rem con separación de 36 px; debajo apila ambas con separación de 28 px. La calculadora se mantiene sticky sólo en escritorio. Las utilidades `sm` (640 px), `md` (768 px) y `lg` (1024 px) también controlan detalles internos, escenarios y fuentes.

Los diálogos centrados miden como máximo 48 rem, dejan 1 rem de margen lateral y limitan su alto a `100dvh - 2rem`. En móvil dejan 8 px de margen. Los paneles laterales miden como máximo 30 rem y ocupan todo el alto; en móvil usan todo el ancho. Encabezado y pie permanecen fuera del cuerpo que desplaza.

## Elevation & Depth

La profundidad se obtiene principalmente con superficies tonales y bordes finos. El hover de tarjeta añade un contorno suave; la sombra amplia corresponde al diálogo. El fondo modal atenúa y desenfoca el contenido que queda detrás.

- **Tarjeta al pasar el puntero:** `0 0 0 1px var(--border)`.
- **Diálogo:** `0 20px 70px rgb(6 22 28 / .2)`.
- **Navegación móvil:** `0 -4px 24px rgb(6 22 28 / .04)`.
- **Categoría al pasar el puntero:** `0 0 0 3px var(--primary)`.
- **Backdrop:** `rgb(6 22 28 / .5)` y desenfoque de 3 px.

El foco visible usa contorno de 3 px y separación de 4 px. El buscador agrupa el foco con contorno de 2 px y separación de 2 px. Estos estados se describen aquí porque el frontmatter no tiene propiedades de sombra ni foco.

## Shapes

Las tarjetas usan esquinas de 16 px; campos y comparaciones internas usan 12 px; chips de filtros, 8 px. Los diálogos y bloques amplios usan 24 px, y el bloque verde usa 20 px en móvil. Los botones principales y secundarios usan la silueta de `rounded-full`; el valor `full` registra su CSS compilado. El buscador usa el radio `pill`. Agregar, cesta y controles de icono son circulares.

La fotografía de detalle termina en una curva amplia: `16px 16px 50% 50%` en escritorio y `0 0 50% 50%` en móvil. Las imágenes de producto se contienen sin recortar su presentación. En claro se aplica mezcla multiply sobre el fondo suave; en oscuro se conserva la imagen sin esa mezcla.

## Components

### Buttons

El botón principal tiene mínimo de 48 px de alto, peso 700, fondo de acción principal y texto blanco. El secundario tiene mínimo de 44 px, peso 500, borde de línea y fondo de superficie. Los estados disabled conservan legibilidad y eliminan la expectativa de acción mediante cursor y color.

Agregar usa un círculo de 44 px y el signo original de Figma de 16 px. En móvil el dibujo del círculo puede medir 40 px, pero los mínimos mantienen un área de 44 px. El foco global permanece visible. El frontmatter distingue la etiqueta de peso 500 de la etiqueta fuerte de peso 700 del botón principal.

### Chips

Los filtros activos son botones removibles con fondo verde suave, texto verde de lectura y borde verde. Tienen nombre accesible «Quitar filtro…» y permiten que una etiqueta larga pase a varias líneas. Las categorías de referencias usan las variantes de botón principal y secundario con `aria-pressed`.

### Cards / Containers

La tarjeta presenta foto, categoría, nombre, contenido del envase, precio, precio por unidad cuando existe, comercio, procedencia, fecha y ubicación. El enlace de ofertas tiene mínimo de 44 px. «Desde» aparece sólo con varias ofertas. El esqueleto reutiliza la misma superficie y radio; la rejilla expone `aria-busy`.

### Inputs / Fields

Campos de superficie con borde fino, esquinas de 12 px, mínimo de 44 px y texto base de 16 px. El buscador principal es una píldora con etiqueta accesible y botón de envío. El rango inválido mantiene el valor ingresado y muestra su mensaje asociado; los formularios de referencia usan `aria-invalid` y `aria-describedby`.

### Navigation

En escritorio: Supermercados y Precios de referencia bajo la cabecera; Mi lista se abre desde la cabecera. En celular: Inicio, Buscar, Mi lista y Referencias. Buscar enfoca el campo; Mi lista abre el diálogo. Inicio y la marca reinician los filtros y la consulta del catálogo, conservando la lista persistente; desde referencias usan navegación SPA. La cesta verde sobresale de la barra inferior. La página activa usa `aria-current=page`, peso 700 y acento verde.

El tema se toma de `mercado-theme` o de la preferencia del sistema; el control alterna claro/oscuro. Si el almacenamiento no está disponible, el cambio funciona durante la sesión.

### Dialogs and list

El componente `Modal` usa `dialog.showModal()`, nombre accesible, Escape, control del foco con Tab, devolución al elemento previo y bloqueo de scroll con contador para diálogos anidados. Cerrar la ficha antes de agregar permite abrir Mi lista sin superponer esa ficha. Los paneles laterales comparten encabezado, cuerpo desplazable y pie.

Mi lista usa filas con foto, presentación, comercio, importe y cantidades. Reducir a cero quita el artículo; vaciar toda la lista requiere confirmación dentro del panel. La comparación conserva sus escenarios, selección y botón de aplicar; los subtotales SEPA se distinguen del total que incluye productos online.

### Icons and assets

Los SVG de `public/design/grocery/` se exportaron sin redibujar. Sus dimensiones intrínsecas son: home 24×24, basket 20×20.0025, plus 16×16, search 14.9×14.9, back 7.33022×12.7788, apple 73×73, broccoli 35×32.5601, cheese 35.9999×23.99 y meat 35×32.8147 px. No normalizar todos a una caja cuadrada. Home, search y back se invierten en oscuro. Las funciones sin icono correspondiente usan Lucide; no se añaden funciones del kit por disponer de un icono.

Las fuentes de los assets exportados se registran en `docs/design/asset-sources.json`; la atribución y enlace CC BY 4.0 se muestran con `DesignCredit`. Las fotos y marcas comerciales existentes tienen procedencia separada.

### States and motion

Los vacíos explican la siguiente acción: iniciar una búsqueda, quitar filtros, volver a productos o consultar otras fuentes. Sucursal sin precios integrados es un estado distinto de cero resultados. Errores de catálogo y comparación ofrecen reintento; un error de Átomo no elimina los resultados SEPA. Los precios antiguos mantienen su aviso visible.

La tarjeta transiciona su sombra durante 0.15 s. La carga de tarjetas alterna opacidad durante 1.3 s con ease-in-out; la comparación usa el indicador existente. `prefers-reduced-motion: reduce` desactiva animaciones, transiciones y desplazamiento suave.

## Do's and Don'ts

### Do:

- Do conservar las familias tipográficas, los iconos exportados y la atribución de la referencia elegida.
- Do usar los tokens semánticos al extender ambos temas; distinguir el verde de identidad del verde del botón principal.
- Do preservar nombres completos, presentación, origen, fecha y sucursal con saltos de línea cuando hagan falta.
- Do mantener los diálogos nativos, sus nombres accesibles, el cierre con Escape y la devolución de foco.
- Do usar fotos verificadas del producto y el estado explícito de foto no disponible cuando no haya una imagen.

### Don't:

- Don't convertir la aplicación en una landing ni añadir login, pago, seguimiento o promociones del kit.
- Don't atribuir precios online a una sucursal física ni presentar referencias de Cuyo como ofertas actuales.
- Don't sustituir datos reales por ejemplos comerciales ni inventar descuentos, stock o ahorro.
- Don't usar la licencia del diseño como autorización para reutilizar marcas o fotos de terceros.
- Don't declarar conformidad visual o accesible completa sólo por haber extraído los tokens.

## Ampliación de referencias y origen visible · 22/11/2026

Las tarjetas de resultados muestran un logo pequeño en la esquina superior izquierda; el nombre completo, alcance online/sucursal y fecha siguen en su ubicación de lectura. La instalación local reutiliza sus assets existentes de supermercados. La distribución para revisión los excluye por sus derechos separados y muestra el nombre cuando el logo no está disponible. El fondo blanco del logo conserva su visibilidad en ambos temas.

Referencias incorpora dos selectores de origen: Mendoza · Supermercados y Cuyo · INDEC. El primero presenta filas con descripción y presentación, comercios, observaciones, fecha, promedio/rango, búsqueda por vocabulario, filtros de rubro y páginas de 24 resultados. La calculadora lateral se vuelve un bloque superior en celular sólo al seleccionar un producto. El foco se mueve a su encabezado después del render. El promedio oficial se conserva en la segunda pestaña. Se mantienen DM Sans y los tokens de la plantilla.

## Integración del 25/11/2026

P01 conserva su algoritmo y controles de gastos y máximo de visitas. El comparador usa ahora los mismos tokens `ink`, `muted`, `line`, `brand-ink`, `brand-soft` y `soft` en claro/oscuro, junto con DM Sans. La lista mantiene los controles y la gestión de foco del rediseño. La app local de referencia es 3117; ver `docs/design/integration-3117-2026-11-25.md`.
