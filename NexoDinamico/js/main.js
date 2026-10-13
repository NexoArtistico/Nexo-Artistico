/* =====================================================================================
   js/main.js — ARRANQUE: inicializa interacciones y tema, y pide cada CSV para pintarlo con
   su render de components.js. Se carga ÚLTIMO.
   ===================================================================================== */
"use strict";

initStaticInteractions();
initTheme();

var LATEST_CFG = {};
var LATEST_LIBROS = null;
function tryRenderLibros() { if (LATEST_LIBROS) renderLibros(LATEST_LIBROS, LATEST_CFG.libro_icon); }

loadCSV(URLS.config, function (rows) { LATEST_CFG = applyConfig(rows); tryRenderLibros(); })
  .catch(function (err) { console.log("[nexo-modern] config error", err); });

loadCSV(URLS.libros, function (rows) { LATEST_LIBROS = rows; tryRenderLibros(); })
  .catch(function (err) {
    console.log("[nexo-modern] libros error", err);
    if (!LATEST_LIBROS) setHTML("m-libros-list", '<div class="m-empty">No se pudieron cargar los libros.</div>');
  });

loadCSV(URLS.obras, renderObras).catch(function (err) {
  console.log("[nexo-modern] obras error", err);
  setHTML("m-obras-grid", '<div class="m-empty">No se pudieron cargar las obras.</div>');
});

loadCSV(URLS.proyectos, initProyectos).catch(function (err) {
  console.log("[nexo-modern] proyectos error", err);
  setHTML("m-proyectos-activos", '<div class="m-empty">No se pudieron cargar los proyectos.</div>');
});

loadCSV(URLS.recursos, renderRecursosSoftware).catch(function (err) {
  console.log("[nexo-modern] recursos error", err);
  setHTML("m-recursos-grid", '<div class="m-empty">No se pudieron cargar los recursos.</div>');
});

loadCSV(URLS.videos, renderVideos).catch(function (err) {
  console.log("[nexo-modern] videos error", err);
  setHTML("m-videos-grid", '<div class="m-empty">No se pudieron cargar los videos.</div>');
});

loadCSV(URLS.pinterest, renderPinterest).catch(function (err) {
  console.log("[nexo-modern] pinterest error", err);
  setHTML("m-pinterest-grid", '<div class="m-empty">No se pudieron cargar los tableros.</div>');
});

var LATEST_PLAYLISTS = null, LATEST_PLAYLIST_VIDEOS = null;
function tryRenderPlaylists() { if (LATEST_PLAYLISTS && LATEST_PLAYLIST_VIDEOS) renderPlaylists(LATEST_PLAYLISTS, LATEST_PLAYLIST_VIDEOS); }
loadCSV(URLS.playlists, function (rows) { LATEST_PLAYLISTS = rows; tryRenderPlaylists(); }).catch(function (err) {
  console.log("[nexo-modern] playlists error", err);
  if (!LATEST_PLAYLISTS) setHTML("m-playlists-grid", '<div class="m-empty">No se pudieron cargar las playlists.</div>');
});
loadCSV(URLS.playlistVideos, function (rows) { LATEST_PLAYLIST_VIDEOS = rows; tryRenderPlaylists(); }).catch(function (err) {
  console.log("[nexo-modern] playlist videos error", err);
});

loadCSV(URLS.sobre, renderSobre).catch(function (err) { console.log("[nexo-modern] sobre error", err); });

loadCSV(URLS.testimonios, renderTestimonios).catch(function (err) {
  console.log("[nexo-modern] testimonios error", err);
  setHTML("m-testimonios-grid", '<div class="m-empty">No se pudieron cargar los testimonios.</div>');
});

loadCSV(URLS.equipo, renderEquipo).catch(function (err) {
  console.log("[nexo-modern] equipo error", err);
  setHTML("m-equipo-grid", '<div class="m-empty">No se pudo cargar el equipo.</div>');
});

