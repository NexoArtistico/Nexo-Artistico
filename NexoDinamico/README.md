# Nexo Artístico — estructura

```
nexo/
├─ index.html          ← un solo HTML (esqueleto de secciones)
├─ js/
│  ├─ data.js          ← URLs de los CSV, parseCSV/loadCSV, helpers (esc, qa, parseVideoUrl…)
│  ├─ components.js    ← config + renderObras, renderProyectos, renderLibros, renderVideos…,
│  │                     lightbox de imágenes, acordeones, volver-arriba, menú y tabs
│  ├─ library.js       ← paginación + búsqueda + filtro por categoría de la biblioteca
│  ├─ video-player.js  ← reproductor flotante (una sola vez para todos los estilos)
│  ├─ theme.js         ← cambio de estilo y coloreado (tabla THEMES)
│  └─ main.js          ← arranque: pide cada CSV y lo pinta
└─ themes/
   ├─ base.css         ← layout común (utilidades, grids, modales, paginación, responsive)
   ├─ moderno.css      ← Clásico / Rojo / Océano / Bosque / Dorado / Rosa / Neón
   ├─ comic.css        ← Comic (+ coloreados azul, verde, morado, naranja, mostaza)
   └─ retro.css        ← Retro (+ paletas terminal, synthwave, arcade, ámbar, púrpura)
```

## Dónde se edita cada cosa

| Quiero… | Edito |
|---|---|
| Cambiar una sección o agregar una (HTML) | `index.html` |
| Agregar/cambiar un CSV o su lectura | `js/data.js` |
| Cambiar cómo se pinta una tarjeta o sección | `js/components.js` |
| Cambiar paginación o búsqueda | `js/library.js` |
| Cambiar el reproductor flotante | `js/video-player.js` |
| Cambiar colores/aspecto de un estilo | `themes/<estilo>.css` |
| Agregar un coloreado | bloque `body.<nombre>{--theme-*:…}` en el CSS del estilo + una línea en `THEMES` (`js/theme.js`) |
| Agregar un estilo nuevo | `themes/<nombre>.css` + una entrada en `THEMES` + un botón `data-style` en `index.html` |

Una edición en `index.html` o `js/` se refleja en los tres estilos a la vez: el HTML y el JS son los mismos y cada tema solo cambia el CSS.

## Orden de carga (scripts clásicos, sin bundler)

`data → components → library → video-player → theme → main`. Las funciones son globales, así que un archivo nuevo debe ir **antes** de `main.js`.

## Cómo abrirlo

Funciona abriendo `index.html` directamente, pero lo ideal es servir la carpeta (por ejemplo `python3 -m http.server` dentro de `nexo/`) para evitar restricciones del navegador con `file://`.
