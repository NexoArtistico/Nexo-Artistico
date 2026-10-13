/* =====================================================================================
   js/library.js — BIBLIOTECA: paginación por filas, búsqueda y filtro por categoría de las
   secciones pinterest / videos / libros / recursos / software.
   ===================================================================================== */
"use strict";

/* ================== [SYNC-FUNCIONALIDAD: TODOS LOS ESTILOS] ==================
   PAGINACION POR FILAS + BUSQUEDA (Biblioteca): en vez de listar todos los
   tableros/videos/libros/recursos/software de una sola vez (lista casi
   interminable con cientos de items), cada seccion pagina por FILAS: se
   mide cuantas columnas tiene el grid en el ancho de pantalla actual (los
   mismos breakpoints que ya usa el CSS) y se multiplica por
   LIB_ROWS_PER_PAGE[seccion] para saber cuantos items entran por pagina.
   Asi la cantidad de "renglones" visibles es siempre la misma sin importar
   el dispositivo (celular, tablet, escritorio). Cada seccion recuerda su
   propia pagina y su propio texto de busqueda mientras se navega entre
   pestañas de la Biblioteca (no se resetea al cambiar de pestaña).
   Equivalente en Comic: mismo bloque LIB_* dentro de comic.html
   (unica diferencia intencional: LIB_ROWS_PER_PAGE.videos vale 3 en Comic
   en vez de 2, y libColumns() usa los breakpoints en px propios de Comic
   en vez de los breakpoints sm/lg/xl de Tailwind). Cualquier cambio de
   COMPORTAMIENTO (no de estilo visual) debe replicarse en ambos lugares. */
var LIB_ROWS_PER_PAGE = { pinterest: 2, videos: 2, libros: 2, recursos: 2, software: 2 };
var LIB_CONTAINER = { pinterest: "m-pinterest-grid", videos: "m-videos-grid", libros: "m-libros-list", recursos: "m-recursos-grid", software: "m-software-grid" };
var LIB_EMPTY = { pinterest: "Sin tableros disponibles.", videos: "Sin videos disponibles.", libros: "Sin libros disponibles.", recursos: "Sin recursos disponibles.", software: "Sin software disponible." };
var LIB_EMPTY_SEARCH = { pinterest: "No hay tableros que coincidan con tu b\u00fasqueda.", videos: "No hay videos que coincidan con tu b\u00fasqueda.", libros: "No hay libros que coincidan con tu b\u00fasqueda.", recursos: "No hay recursos que coincidan con tu b\u00fasqueda.", software: "No hay software que coincida con tu b\u00fasqueda." };
var LIB_STATE = {
  pinterest: { all: [], page: 1, q: "" },
  videos: { all: [], page: 1, q: "", cat: "" },
  libros: { all: [], page: 1, q: "" },
  recursos: { all: [], page: 1, q: "" },
  software: { all: [], page: 1, q: "", cat: "" }
};
var LIB_POST = {};

/* Mismas anchuras de quiebre que las reglas sm:/lg:/xl: de Tailwind ya usadas
   por #m-pinterest-grid, #m-videos-grid, #m-libros-list, #m-recursos-grid y
   #m-software-grid (ver <style> arriba). */
/* [FIX MÓVIL: CLÁSICO/NEON] Estos números tenían que ser un espejo exacto de las columnas
   reales que fija el CSS (#m-pinterest-grid/#m-videos-grid/#m-libros-list/#m-software-grid,
   más arriba, y las clases sm:/lg: de Tailwind para #m-recursos-grid) — pero estaban
   desincronizados: por ejemplo en "videos" el CSS ya muestra 2 columnas en celular
   (grid-template-columns:repeat(2,1fr) en la base, antes de min-width:640px), mientras esta
   función asumía 1 columna. Eso hac��a que perPage (columnas × LIB_ROWS_PER_PAGE) se calculara
   mal y las páginas no llenaran realmente 2 filas en celular. Ahora coincide exactamente con
   el CSS real de cada sección. */
function libColumns(section) {
  var w = window.innerWidth;
  if (section === "pinterest") { return w < 1024 ? 2 : 3; }
  if (section === "libros") { return w < 640 ? 2 : w < 1024 ? 3 : 5; }
  if (section === "videos") { return w < 640 ? 2 : w < 1024 ? 3 : 4; }
  if (section === "software") { return w < 640 ? 2 : w < 1024 ? 3 : 5; }
  return w < 640 ? 1 : w < 1024 ? 2 : 3; /* recursos (usa sm:grid-cols-2 lg:grid-cols-3 sin !important) */
}
function libMatches(section, item, q) {
  if (!q) return true;
  q = q.toLowerCase();
  var fields;
  if (section === "pinterest") fields = [item.titulo, item.descripcion];
  else if (section === "videos") fields = [item.titulo, item.autor, item.categoria];
  else if (section === "libros") fields = [item.titulo, item["autor(es)"], item.idioma];
  else fields = [item.titulo, item.tipo, item.descripcion];
  return fields.some(function (f) { return (f || "").toLowerCase().indexOf(q) !== -1; });
}
var LIB_CAT_FIELD = { videos: "categoria", software: "etiqueta" };
function libMatchesCategory(section, item, cat) {
  var field = LIB_CAT_FIELD[section];
  if (!field || !cat) return true;
  return (item[field] || "").trim() === cat;
}
function libPopulateCategoryFilter(section) {
  var field = LIB_CAT_FIELD[section];
  if (!field) return;
  var select = document.getElementById("lib-cat-" + section);
  if (!select) return;
  var values = [];
  LIB_STATE[section].all.forEach(function (it) {
    var v = (it[field] || "").trim();
    if (v && values.indexOf(v) === -1) values.push(v);
  });
  values.sort(function (a, b) { return a.localeCompare(b, "es"); });
  var current = select.value;
  select.innerHTML = '<option value="">' + (section === "software" ? "Todas las etiquetas" : "Todas las categor\u00edas") + '</option>' +
    values.map(function (v) { return '<option value="' + esc(v) + '">' + esc(v) + '</option>'; }).join("");
  if (values.indexOf(current) !== -1) select.value = current;
}

function libCard(section, item) {
  if (section === "pinterest") return pinCardHtml(item);
  if (section === "videos") return videoCardHtml(item);
  if (section === "libros") return libroCardHtml(item, LIB_LIBRO_ICON);
  return resourceCardModern(item);
}
function libRenderSection(section) {
  var state = LIB_STATE[section];
  var containerId = LIB_CONTAINER[section];
  var filtered = state.all.filter(function (it) { return libMatches(section, it, state.q) && libMatchesCategory(section, it, state.cat); });
  var perPage = Math.max(1, libColumns(section) * LIB_ROWS_PER_PAGE[section]);
  var totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  if (state.page > totalPages) state.page = totalPages;
  if (state.page < 1) state.page = 1;
  var start = (state.page - 1) * perPage;
  var pageItems = filtered.slice(start, start + perPage);

  if (!state.all.length) {
    setHTML(containerId, '<div class="m-empty">' + LIB_EMPTY[section] + '</div>');
  } else if (!filtered.length) {
    setHTML(containerId, '<div class="m-empty">' + LIB_EMPTY_SEARCH[section] + '</div>');
  } else {
    setHTML(containerId, pageItems.map(function (it) { return libCard(section, it); }).join(""));
  }
  if (LIB_POST[section]) LIB_POST[section]();
  libUpdatePagerUI(section, totalPages);
}
function libUpdatePagerUI(section, totalPages) {
  var state = LIB_STATE[section];
  var bar = document.getElementById("lib-pager-" + section);
  if (!bar) return;
  bar.style.display = (state.all.length && totalPages > 1) ? "" : "none";
  var info = bar.querySelector(".lib-page-info");
  if (info) info.textContent = "P\u00e1gina " + state.page + " de " + totalPages;
  var prev = bar.querySelector("[data-lib-prev]");
  var next = bar.querySelector("[data-lib-next]");
  if (prev) prev.disabled = state.page <= 1;
  if (next) next.disabled = state.page >= totalPages;
}
function libScrollToTop(section) {
  var el = document.getElementById(LIB_CONTAINER[section]);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function libBindControls(section) {
  var search = document.getElementById("lib-search-" + section);
  if (search && !search.dataset.bound) {
    search.dataset.bound = "1";
    search.addEventListener("input", function () {
      LIB_STATE[section].q = search.value;
      LIB_STATE[section].page = 1;
      libRenderSection(section);
    });
  }
  var catSelect = document.getElementById("lib-cat-" + section);
  if (catSelect && !catSelect.dataset.bound) {
    catSelect.dataset.bound = "1";
    catSelect.addEventListener("change", function () {
      LIB_STATE[section].cat = catSelect.value;
      LIB_STATE[section].page = 1;
      libRenderSection(section);
    });
  }
  var bar = document.getElementById("lib-pager-" + section);
  if (bar && !bar.dataset.bound) {
    bar.dataset.bound = "1";
    var prev = bar.querySelector("[data-lib-prev]");
    var next = bar.querySelector("[data-lib-next]");
    if (prev) prev.addEventListener("click", function () { LIB_STATE[section].page -= 1; libRenderSection(section); libScrollToTop(section); });
    if (next) next.addEventListener("click", function () { LIB_STATE[section].page += 1; libRenderSection(section); libScrollToTop(section); });
  }
}
function initLibPagination() {
  Object.keys(LIB_STATE).forEach(libBindControls);
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { Object.keys(LIB_STATE).forEach(libRenderSection); }, 200);
  });
}
var LIB_LIBRO_ICON = "";
LIB_POST.videos = function () { bindVideoTriggers(); };
