/* =====================================================================================
   js/components.js — COMPONENTES: render de cada sección (obras, proyectos, libros, recursos,
   videos, pinterest, playlists, sobre, testimonios, equipo), config, lightbox de imágenes,
   acordeones, volver-arriba y las interacciones estáticas (menú, tabs, reveal).
   El HTML que generan es el MISMO para todos los estilos; cada tema lo viste con su CSS.
   ===================================================================================== */
"use strict";

var ICONS = {
  instagram: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/></svg>',
  youtube: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10.5 9.5l4.5 2.5-4.5 2.5v-5z" fill="currentColor" stroke="none"/></svg>',
  tiktok: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 3c.4 2.3 2 4 4.5 4.2v3c-1.7 0-3.2-.5-4.5-1.4v6.4c0 3.2-2.6 5.8-5.8 5.8S4.9 18.4 4.9 15.2 7.5 9.4 10.7 9.4c.4 0 .8 0 1.1.1v3.1c-.3-.1-.7-.2-1.1-.2-1.5 0-2.7 1.2-2.7 2.7s1.2 2.7 2.7 2.7 2.8-1.1 2.8-2.7V3h3z"/></svg>',
  whatsapp: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18.2a8.1 8.1 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-1.4-.7-2.3-1.2-3.2-2.7-.2-.4.2-.4.5-1.3.1-.2 0-.4-.1-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.1s.9 2.5 1.1 2.7c1.4 1.9 2.9 2.9 4.9 3.6.7.2 1.3.2 1.8.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.4-.3z"/></svg>'
};
function socialLink(key, url, cls) {
  if (!url) return "";
  return '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(key) + '" class="' + cls + '">' + ICONS[key] + '</a>';
}

/* ---------- config ---------- */
/* Guarda el valor original (el que trae index.html) de cada elemento la primera vez y lo restaura
   cuando la clave queda vacía; así la vista previa del admin refleja también los borrados. */
function cfgSet(id, val, apply, restore) {
  var el = document.getElementById(id); if (!el) return;
  if (!el.__nxDef) el.__nxDef = { t: el.innerHTML, href: el.getAttribute("href"), bg: el.style.backgroundImage, cls: el.classList.contains("has-image") };
  if (val) apply(el, val); else restore(el, el.__nxDef);
}
function applyConfig(rows) {
  var cfg = {};
  rows.forEach(function (r) { if (r.clave) cfg[r.clave.trim()] = r.valor; });
  var txt = function (el, v) { el.textContent = v; }, back = function (el, d) { el.innerHTML = d.t; };
  var stat = function (el, v) { el.innerHTML = esc(v) + "+"; };

  if (!document.__nxTitle) document.__nxTitle = document.title;
  document.title = cfg.nombre_sitio ? cfg.nombre_sitio + " — Donde el Arte nos Conecta" : document.__nxTitle;
  cfgSet("m-brand-name", cfg.nombre_sitio, txt, back);
  cfgSet("m-foot-name", cfg.nombre_sitio, txt, back);
  cfgSet("m-hero-desc", cfg.descripcion, txt, back);
  cfgSet("m-hero-cover", cfg.portada, function (el, v) { el.style.backgroundImage = "url('" + v + "')"; el.classList.add("has-image"); },
    function (el, d) { el.style.backgroundImage = d.bg; el.classList.toggle("has-image", d.cls); });
  cfgSet("m-btn-whatsapp", cfg.whatsapp, function (el, v) { el.href = v; }, function (el, d) { if (d.href == null) el.removeAttribute("href"); else el.setAttribute("href", d.href); });
  cfgSet("m-stat-miembros", cfg.miembros_activos, stat, back);
  cfgSet("m-stat-recursos", cfg.recursos_compartidos, stat, back);
  cfgSet("m-stat-proyectos", cfg.proyectos_realizados, stat, back);

  var socialDesktop = socialLink("instagram", cfg.instagram, "text-foreground/70 hover:text-primary transition-colors") +
    socialLink("youtube", cfg.youtube, "text-foreground/70 hover:text-primary transition-colors") +
    socialLink("tiktok", cfg.tiktok, "text-foreground/70 hover:text-primary transition-colors") +
    (cfg.whatsapp ? '<a href="' + esc(cfg.whatsapp) + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-primary text-background font-semibold text-sm px-4 py-2 rounded-full hover:bg-secondary transition-colors">' + ICONS.whatsapp + ' Únete</a>' : "");
  setHTML("m-social-desktop", socialDesktop);

  var socialMobile = socialLink("instagram", cfg.instagram, "text-foreground/70") +
    socialLink("youtube", cfg.youtube, "text-foreground/70") +
    socialLink("tiktok", cfg.tiktok, "text-foreground/70") +
    (cfg.whatsapp ? '<a href="' + esc(cfg.whatsapp) + '" target="_blank" rel="noopener noreferrer" class="ml-auto inline-flex items-center gap-2 bg-primary text-background font-semibold text-sm px-4 py-2 rounded-full">Únete</a>' : "");
  setHTML("m-social-mobile", socialMobile);

  var socialFooter = socialLink("instagram", cfg.instagram, "text-foreground/60 hover:text-primary transition-colors") +
    socialLink("youtube", cfg.youtube, "text-foreground/60 hover:text-primary transition-colors") +
    socialLink("tiktok", cfg.tiktok, "text-foreground/60 hover:text-primary transition-colors") +
    socialLink("whatsapp", cfg.whatsapp, "text-foreground/60 hover:text-primary transition-colors");
  setHTML("m-social-footer", socialFooter);

  qa("#m-logo-1, #m-logo-2").forEach(function (img) {
    if (!img.__nxSrc) img.__nxSrc = img.getAttribute("src");
    img.src = cfg.logo || img.__nxSrc;
  });
  if (cfg.logo) {
    var favicon = document.querySelector('link[rel="icon"]'); if (favicon) favicon.href = cfg.logo;
    window.NEXO_LOGO_URL = cfg.logo;
  }
  return cfg;
}

/* ---------- obras destacadas ---------- */
/* [ESTILO CLÁSICO ADAPTADO DE COMIC] La tarjeta incluye ahora, además del overlay original
   (usado por Neon), una ficha visible debajo de la imagen con título, autor y tags — parecida
   a las tarjetas "piece" del estilo Comic (no idéntica). Cuál de las dos se ve la decide el
   CSS según el tema activo: ver ".m-obra-overlay" / ".m-obra-cap" en el <style>. */
var M_OBRAS_STATE = [];
function renderObras(rows) {
  var items = sortByOrden(rows.filter(function (r) { return isTrue(r.visible) && r.titulo && r.imagen; }));
  M_OBRAS_STATE = items;
  if (!items.length) { setHTML("m-obras-grid", '<div class="m-empty">Aún no hay obras destacadas este mes.</div>'); return; }
  var html = items.map(function (o, i) {
    var tags = (o.etiquetas || "").split(/[\s]{2,}|,|\//).map(function (t) { return t.trim(); }).filter(Boolean);
    if (!tags.length && o.etiquetas) tags = o.etiquetas.trim().split(/\s+/);
    var tagsHTML = tags.length ? '<div class="m-obra-tags">' + tags.map(function (t) { return '<span class="m-obra-tag">' + esc(t) + '</span>'; }).join("") + '</div>' : "";
    return (
      '<button class="masonry-item block w-full group" data-obra-idx="' + i + '">' +
        '<div class="relative overflow-hidden rounded-xl border border-border2 m-obra-media">' +
          '<img src="' + esc(o.imagen) + '" alt="' + esc(o.titulo) + ', por ' + esc(o.autor) + '" class="w-full block group-hover:scale-105 transition-transform duration-500" loading="lazy" crossorigin="anonymous" />' +
          '<div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-3 text-left m-obra-overlay">' +
            '<p class="font-semibold text-sm">' + esc(o.titulo) + '</p>' +
            '<p class="text-xs text-muted">' + esc(o.autor) + (o.etiquetas ? ' · ' + esc(o.etiquetas) : '') + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="text-left m-obra-cap">' +
          '<p class="font-semibold text-sm">' + esc(o.titulo) + '</p>' +
          (o.autor ? '<p class="text-xs m-obra-autor">por ' + esc(o.autor) + '</p>' : '') +
          tagsHTML +
        '</div>' +
      '</button>'
    );
  }).join("");
  setHTML("m-obras-grid", html);
  bindLightboxes();
  setObrasView(OBRAS_VIEW_MODE);
}

/* [OBRAS] Alterna entre modo "galería" (masonry, el original) y modo "carrusel"
   (scroll horizontal con snap y flechas). Misma data (M_OBRAS_STATE) y mismas
   tarjetas — solo cambia el layout vía CSS (clase .carousel en #m-obras-grid). */
var OBRAS_VIEW_MODE = "carrusel";
function setObrasView(mode) {
  OBRAS_VIEW_MODE = mode;
  var grid = document.getElementById("m-obras-grid");
  if (grid) grid.classList.toggle("carousel", mode === "carrusel");
  qa("[data-obras-view]").forEach(function (btn) {
    btn.classList.toggle("active", btn.dataset.obrasView === mode);
  });
  var prev = document.getElementById("m-obras-prev"), next = document.getElementById("m-obras-next");
  var showArrows = mode === "carrusel" && M_OBRAS_STATE.length > 1;
  if (prev) prev.hidden = !showArrows;
  if (next) next.hidden = !showArrows;
}
function scrollObrasCarousel(dir) {
  var grid = document.getElementById("m-obras-grid");
  if (!grid) return;
  var item = grid.querySelector(".masonry-item");
  var amount = item ? item.getBoundingClientRect().width + 18 : grid.clientWidth * 0.8;
  grid.scrollBy({ left: dir * amount, behavior: "smooth" });
}
function bindObrasViewToggle() {
  qa("[data-obras-view]").forEach(function (btn) {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", function () { setObrasView(btn.dataset.obrasView); });
  });
  var prev = document.getElementById("m-obras-prev"), next = document.getElementById("m-obras-next");
  if (prev && !prev.dataset.bound) { prev.dataset.bound = "1"; prev.addEventListener("click", function () { scrollObrasCarousel(-1); }); }
  if (next && !next.dataset.bound) { next.dataset.bound = "1"; next.addEventListener("click", function () { scrollObrasCarousel(1); }); }
}

/* ---------- proyectos ---------- */
var PROYECTOS_STATE = { all: [], showFinalizados: false };
function proyectoDestacado(p) {
  var estado = (p.estado || "").toLowerCase();
  var meta = [p.categoria, p.fecha_inicio ? "Inicia " + p.fecha_inicio : ""].filter(Boolean).join(" · ");
  var stats = [];
  if (p.participantes) stats.push('<div><span class="text-primary font-semibold">' + esc(p.participantes) + '</span> <span class="text-muted">participantes</span></div>');
  if (p.obras) stats.push('<div><span class="text-primary font-semibold">' + esc(p.obras) + '</span> <span class="text-muted">obras</span></div>');
  if (p.ganadores) stats.push('<div><span class="text-primary font-semibold">' + esc(p.ganadores) + '</span> <span class="text-muted">ganadores</span></div>');
  return (
    '<div class="border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl p-6 sm:p-8">' +
      '<div class="flex flex-wrap items-center gap-3 mb-4">' +
        '<span class="text-xs font-semibold uppercase tracking-wide bg-primary text-background px-3 py-1 rounded-full">' + esc(p.estado) + '</span>' +
        (meta ? '<span class="text-xs text-muted">' + esc(meta) + '</span>' : '') +
      '</div>' +
      '<h3 class="font-display font-bold text-2xl">' + esc(p.titulo) + '</h3>' +
      (p.descripcion ? '<p class="text-foreground/70 mt-2">' + esc(p.descripcion) + '</p>' : '') +
      (stats.length ? '<div class="flex flex-wrap gap-6 mt-5 text-sm">' + stats.join("") + '</div>' : '') +
      /* [SYNC-FUNCIONALIDAD: TODOS LOS ESTILOS] Si el enlace del resultado es un video/publicación de
         YouTube o TikTok, "Ver resultado" lo abre en el reproductor flotante (misma página); el href
         queda como respaldo (clic central, Ctrl/Cmd+clic o si el video no se puede incrustar).
         Equivalente en Comic: proyectoCard() dentro de comic.html. */
      (p.enlace ? '<a href="' + esc(p.enlace) + '" target="_blank" rel="noopener noreferrer"' + (isEmbeddableVideo(p.enlace) ? ' data-video-url="' + esc(p.enlace) + '"' : '') + ' class="inline-block mt-5 text-sm font-semibold text-primary hover:text-secondary">Ver resultado</a>' : '') +
    '</div>'
  );
}
/* [SYNC-FUNCIONALIDAD: TODOS LOS ESTILOS] Igual que en Comic: los proyectos finalizados usan la
   MISMA tarjeta (proyectoDestacado) que los activos y se agregan a la MISMA grilla al hacer
   click en "ver más", en vez de mostrarse en una lista aparte con un diseño distinto. */
function renderProyectos() {
  var items = PROYECTOS_STATE.all;
  var activos = items.filter(function (p) { var e = (p.estado || "").toLowerCase(); return e === "activo" || e === "pendiente"; });
  var finalizados = items.filter(function (p) { return (p.estado || "").toLowerCase() === "finalizado"; });
  var visible = PROYECTOS_STATE.showFinalizados ? activos.concat(finalizados) : activos;

  setHTML("m-proyectos-activos", visible.length ? visible.map(proyectoDestacado).join("") : '<div class="m-empty">No hay proyectos activos por ahora. ¡Vuelve pronto!</div>');

  var hasFinalizados = finalizados.length > 0;
  var wrapTop = document.getElementById("m-proyectos-toggle-wrap-top");
  var wrapBottom = document.getElementById("m-proyectos-toggle-wrap");
  /* [PROYECTOS] La flecha de arriba solo aparece si ya se expandieron los finalizados
     (para volver a ocultarlos sin tener que bajar hasta el botón del final). */
  if (wrapTop) wrapTop.style.display = (hasFinalizados && PROYECTOS_STATE.showFinalizados) ? "" : "none";
  if (wrapBottom) wrapBottom.style.display = hasFinalizados ? "" : "none";
  if (hasFinalizados) {
    var labelText = PROYECTOS_STATE.showFinalizados ? "Ocultar proyectos finalizados" : "Ver más proyectos finalizados (" + finalizados.length + ")";
    qa(".m-toggle-projects-label").forEach(function (el) { el.textContent = labelText; });
    qa(".toggle-projects-btn .chevron").forEach(function (el) { el.style.transform = PROYECTOS_STATE.showFinalizados ? "rotate(180deg)" : "rotate(0deg)"; });
  }
}
function initProyectos(rows) {
  PROYECTOS_STATE.all = sortByOrden(rows.filter(function (r) { return isTrue(r.visible) && r.titulo; }));
  renderProyectos();
  qa(".toggle-projects-btn").forEach(function (btn) {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", function () {
      var wasShowing = PROYECTOS_STATE.showFinalizados;
      PROYECTOS_STATE.showFinalizados = !wasShowing;
      renderProyectos();
      if (wasShowing) {
        var section = document.getElementById("proyectos");
        if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
  var arrowUp = document.getElementById("m-proyectos-hide-top");
  if (arrowUp && !arrowUp.dataset.bound) {
    arrowUp.dataset.bound = "1";
    arrowUp.addEventListener("click", function () {
      PROYECTOS_STATE.showFinalizados = false;
      renderProyectos();
    });
  }
}


/* ---------- biblioteca: libros ---------- */
/* [LIBROS] Tarjetas verticales 3:4 (icono grande) en vez de la lista horizontal
   original — 3 por fila en desktop/tablet, 2 en móvil. Mismo icono genérico
   (config libro_icon) para todos, ahora mostrado grande dentro de ".m-libro-cover". */
function libroCardHtml(l, libroIcon) {
  var target = isTrue(l["nueva_pestaña"]) ? ' target="_blank" rel="noopener noreferrer"' : "";
  return (
    '<a href="' + esc(l.enlace) + '"' + target + ' class="card-hover group flex flex-col rounded-xl border border-border2 bg-surface overflow-hidden">' +
      '<div class="m-libro-cover">' +
        (libroIcon ? '<img src="' + esc(libroIcon) + '" class="m-libro-icon" alt="" loading="lazy" crossorigin="anonymous" />' : '') +
      '</div>' +
      '<div class="p-3 min-w-0">' +
        '<p class="font-medium text-sm truncate">' + esc(l.titulo) + '</p>' +
        '<p class="text-xs text-muted truncate">' + esc(l["autor(es)"]) + (l.idioma ? ' · ' + esc(l.idioma) : '') + '</p>' +
        '<span class="text-xs text-primary font-semibold mt-2 inline-block">Leer →</span>' +
      '</div>' +
    '</a>'
  );
}
function renderLibros(rows, libroIcon) {
  LIB_LIBRO_ICON = libroIcon;
  LIB_STATE.libros.all = sortByOrden(rows.filter(function (r) { return isTrue(r.visible) && r.titulo; }));
  LIB_STATE.libros.page = 1;
  libRenderSection("libros");
}

/* ---------- biblioteca: recursos / software ---------- */
function resourceCardModern(r) {
  return (
    '<a href="' + esc(r.enlace || "#") + '" target="_blank" rel="noopener noreferrer" class="m-res-card card-hover border border-border2 rounded-xl p-5 bg-surface">' +
      (r.imagen ? '<img src="' + esc(r.imagen) + '" alt="" class="w-16 h-16 rounded-lg object-contain bg-background/50 shrink-0" loading="lazy" crossorigin="anonymous" />' : '') +
      '<div class="min-w-0">' +
        (r.tipo ? '<span class="text-[10px] uppercase tracking-wide text-secondary font-semibold">' + esc(r.tipo) + '</span>' : '') +
        '<p class="font-semibold text-sm mt-1">' + esc(r.titulo) + '</p>' +
        (r.descripcion ? '<p class="text-xs text-muted mt-1">' + esc(r.descripcion) + '</p>' : '') +
      '</div>' +
    '</a>'
  );
}
function renderRecursosSoftware(rows) {
  var visibles = rows.filter(function (r) { return isTrue(r.visible) && r.titulo; });
  LIB_STATE.recursos.all = visibles.filter(function (r) { return (r.categoria || "").toLowerCase() !== "software"; });
  LIB_STATE.software.all = visibles.filter(function (r) { return (r.categoria || "").toLowerCase() === "software"; }); libPopulateCategoryFilter("software");
  LIB_STATE.recursos.page = 1;
  LIB_STATE.software.page = 1;
  libRenderSection("recursos");
  libRenderSection("software");
}

/* ---------- biblioteca: videos ---------- */
/* [SYNC-FUNCIONALIDAD: TODOS LOS ESTILOS] Se reproducen dentro del video-modal (misma página).
   Equivalente en Comic: renderVideos() dentro de comic.html. */
var PLAY_ICON = '<svg width="40" height="40" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" style="fill:var(--theme-bg,#04140f);fill-opacity:0.7"/><path d="M10 8l6 4-6 4V8z" style="fill:var(--theme-primary,#00DF81)"/></svg>';
function videoCardHtml(v) {
  var url = videoUrlOf(v);
  var pv = parseVideoUrl(url);
  var isTT = !!(pv && pv.provider === "tiktok");
  var thumb = v.miniatura || v.imagen || v.thumbnail || (pv && pv.provider === "youtube" ? "https://i.ytimg.com/vi/" + pv.id + "/hqdefault.jpg" : "");
  return (
    '<button class="video-card card-hover group text-left border border-border2 rounded-xl overflow-hidden bg-surface" data-url="' + esc(url) + '">' +
      '<div class="m-video-thumb">' +
        (thumb ? '<img src="' + esc(thumb) + '" alt="" class="group-hover:scale-105 transition-transform duration-500" loading="lazy" crossorigin="anonymous" />' : (isTT ? '<div class="m-video-ph">' + ICONS.tiktok + '</div>' : '')) +
        '<span class="absolute inset-0 flex items-center justify-center bg-background/30">' + PLAY_ICON + '</span>' +
        (isTT ? '<span class="m-video-badge">TikTok</span>' : '') +
      '</div>' +
      '<div class="p-4">' +
        (v.categoria ? '<span class="text-[10px] uppercase tracking-wide text-secondary font-semibold">' + esc(v.categoria) + '</span>' : '') +
        '<p class="font-semibold text-sm mt-1 leading-snug">' + esc(v.titulo) + '</p>' +
        '<p class="text-xs text-muted mt-1">' + esc(v.autor) + '</p>' +
      '</div>' +
    '</button>'
  );
}
function renderVideos(rows) {
  LIB_STATE.videos.all = rows.filter(function (r) { return isTrue(r.visible) && r.titulo; }); libPopulateCategoryFilter("videos");
  LIB_STATE.videos.page = 1;
  libRenderSection("videos");
}

/* ---------- biblioteca: pinterest ---------- */
function pinCardHtml(p) {
  return (
    '<div class="card-hover group border border-border2 rounded-xl overflow-hidden bg-surface">' +
      '<div class="m-pin-collage">' +
        (p.portada ? '<img class="m-pin-main" src="' + esc(p.portada) + '" alt="' + esc(p.titulo) + '" loading="lazy" referrerpolicy="no-referrer" />' : '') +
        (p.mini_1 ? '<img class="m-pin-mini m-pin-m1" src="' + esc(p.mini_1) + '" alt="" loading="lazy" referrerpolicy="no-referrer" />' : '') +
        (p.mini_2 ? '<img class="m-pin-mini m-pin-m2" src="' + esc(p.mini_2) + '" alt="" loading="lazy" referrerpolicy="no-referrer" />' : '') +
      '</div>' +
      '<div class="p-4"><p class="font-semibold text-sm">' + esc(p.titulo) + '</p>' +
      (p.descripcion ? '<p class="text-xs text-muted mt-1">' + esc(p.descripcion) + '</p>' : '') +
      '<p class="text-xs text-muted mt-1">' + esc(p.cantidad_pines) + (p.cantidad_pines ? ' pines' : '') + '</p>' +
      '<a href="' + esc(p.enlace) + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-primary hover:text-secondary">Ver Tablero →</a>' +
      '</div>' +
    '</div>'
  );
}
function renderPinterest(rows) {
  LIB_STATE.pinterest.all = sortByOrden(rows.filter(function (r) { return isTrue(r.visible) && r.titulo; }));
  LIB_STATE.pinterest.page = 1;
  libRenderSection("pinterest");
}

/* ---------- centro de mejora: playlists (grid de tarjetas, estilo Comic) ---------- */
/* [SYNC-FUNCIONALIDAD: TODOS LOS ESTILOS] Cada video de la playlist abre el video-modal
   (misma página). Equivalente en Comic: renderPlaylists() dentro de comic.html. */
function renderPlaylists(playlists, videos) {
  var items = sortByOrden(playlists.filter(function (r) { return isTrue(r.visible) && r.titulo; }));
  if (!items.length) { setHTML("m-playlists-grid", '<div class="m-empty">Sin playlists disponibles.</div>'); return; }
  var html = items.map(function (pl, idx) {
    var vids = sortByOrden(videos.filter(function (v) { return isTrue(v.visible) && v.playlist_id === pl.id; }));
    var vidsHTML = vids.map(function (v) {
      return '<button type="button" data-url="' + esc(videoUrlOf(v)) + '"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 7l9 5-9 5V7z"/></svg>' + esc(v.titulo) + '</button>';
    }).join("");
    var meta = [pl.autor, pl.nivel, vids.length + " video" + (vids.length === 1 ? "" : "s")].filter(Boolean).join(" · ");
    return (
      '<div class="m-playlist-card border border-border2 rounded-xl bg-surface p-4" data-idx="' + idx + '">' +
        '<div class="m-playlist-thumb">' + (pl.imagen ? '<img src="' + esc(pl.imagen) + '" alt="' + esc(pl.titulo) + '" loading="lazy" crossorigin="anonymous" />' : '') + '</div>' +
        '<p class="font-semibold text-sm sm:text-base mt-3">' + esc(pl.titulo) + '</p>' +
        '<p class="text-xs text-muted mt-1">' + esc(meta) + '</p>' +
        (pl.descripcion ? '<p class="text-xs text-foreground/60 mt-2 leading-relaxed">' + esc(pl.descripcion).slice(0, 140) + (pl.descripcion.length > 140 ? "…" : "") + '</p>' : '') +
        '<div class="m-playlist-videos" id="m-pv-' + idx + '">' + (vidsHTML || '<div class="m-empty" style="padding:8px 0;">Sin videos listados.</div>') + '</div>' +
      '</div>'
    );
  }).join("");
  setHTML("m-playlists-grid", html);
  qa(".m-playlist-card").forEach(function (card) {
    if (card.dataset.bound) return;
    card.dataset.bound = "1";
    card.addEventListener("click", function (e) {
      if (e.target.closest("button")) return;
      var panel = card.querySelector(".m-playlist-videos");
      if (panel) panel.classList.toggle("open");
    });
  });
  bindVideoTriggers();
}

/* ---------- sobre el nexo ---------- */
function renderSobre(rows) {
  var historia = rows.find(function (r) { return r.tipo === "Historia" && isTrue(r.visible); });
  var mision = rows.find(function (r) { return r.tipo === "Mision" && isTrue(r.visible); });
  var vision = rows.find(function (r) { return r.tipo === "Vision" && isTrue(r.visible); });
  var valores = sortByOrden(rows.filter(function (r) { return r.tipo === "Valor" && isTrue(r.visible); }));
  var unicos = sortByOrden(rows.filter(function (r) { return r.tipo === "Unico" && isTrue(r.visible); }));

  if (historia) setHTML("m-historia-text", esc(historia.descripcion));
  if (mision) setHTML("m-mision-text", esc(mision.descripcion));
  if (vision) setHTML("m-vision-text", esc(vision.descripcion));

  setHTML("m-valores-grid", valores.length ? valores.map(function (v) {
    return '<div class="border border-border2 rounded-xl p-5 bg-surface text-center"><p class="font-semibold text-sm">' + esc(v.titulo) + '</p><p class="text-xs text-muted mt-2 leading-relaxed">' + esc(v.descripcion) + '</p></div>';
  }).join("") : '<div class="m-empty">Sin valores registrados.</div>');

  setHTML("m-unico-grid", unicos.length ? unicos.map(function (u) {
    return '<div class="border border-primary/20 rounded-xl p-5 bg-gradient-to-br from-primary/5 to-transparent"><p class="font-semibold text-sm text-primary">' + esc(u.titulo) + '</p><p class="text-sm text-foreground/70 mt-2 leading-relaxed">' + esc(u.descripcion) + '</p></div>';
  }).join("") : '<div class="m-empty">Sin datos registrados.</div>');
}

function renderTestimonios(rows) {
  var items = sortByOrden(rows.filter(function (r) { return isTrue(r.visible) && r.texto; }));
  if (!items.length) { setHTML("m-testimonios-grid", '<div class="m-empty">Sin testimonios disponibles.</div>'); return; }
  setHTML("m-testimonios-grid", items.map(function (t) {
    return (
      '<div class="border border-border2 rounded-xl p-5 bg-surface">' +
        '<p class="text-sm text-foreground/75 leading-relaxed">&ldquo;' + esc(t.texto) + '&rdquo;</p>' +
        '<p class="text-sm font-semibold mt-4">' + esc(t.nombre) + '</p>' +
        '<p class="text-xs text-muted">' + esc(t.rol) + '</p>' +
      '</div>'
    );
  }).join(""));
}

function renderEquipo(rows) {
  var items = sortByOrden(rows.filter(function (r) { return isTrue(r.visible) && r.nombre; }));
  if (!items.length) { setHTML("m-equipo-grid", '<div class="m-empty">Sin miembros del equipo registrados.</div>'); return; }
  setHTML("m-equipo-grid", items.map(function (m) {
    return (
      '<div class="border border-border2 rounded-xl bg-surface card-hover m-team-card">' +
        (m.imagen ? '<img src="' + esc(m.imagen) + '" alt="' + esc(m.nombre) + '" loading="lazy" crossorigin="anonymous" />' : '') +
        '<h4>' + esc(m.nombre) + '</h4>' +
        '<div class="m-team-rol">' + esc(m.rol) + '</div>' +
        (m.descripcion ? '<div class="m-team-desc">' + esc(m.descripcion) + '</div>' : '') +
        (m.contribuciones ? '<div class="m-team-contrib">' + esc(m.contribuciones) + '</div>' : '') +
      '</div>'
    );
  }).join(""));
}


/* ---------- delegated interactions for dynamic content ---------- */
var imageModal, imageModalImg, imageModalCaption, imageModalPrev, imageModalNext;
var currentObraIndex = 0;

function obraCaption(o) {
  return o.titulo + (o.autor ? " — por " + o.autor : "") + (o.etiquetas ? " (" + o.etiquetas + ")" : "");
}
function updateImageModalNav() {
  var multi = M_OBRAS_STATE.length > 1;
  if (imageModalPrev) imageModalPrev.hidden = !multi;
  if (imageModalNext) imageModalNext.hidden = !multi;
}
function openImageModal(idx) {
  if (!M_OBRAS_STATE.length) return;
  currentObraIndex = ((idx % M_OBRAS_STATE.length) + M_OBRAS_STATE.length) % M_OBRAS_STATE.length;
  var o = M_OBRAS_STATE[currentObraIndex];
  var caption = obraCaption(o);
  imageModalImg.src = o.imagen;
  imageModalImg.alt = caption;
  imageModalCaption.textContent = caption;
  imageModal.classList.add("open");
  updateImageModalNav();
}
function stepImageModal(dir) { openImageModal(currentObraIndex + dir); }
function closeImageModal() { imageModal.classList.remove("open"); imageModalImg.src = ""; }


function bindLightboxes() {
  qa("[data-obra-idx]").forEach(function (el) {
    if (el.dataset.bound) return;
    el.dataset.bound = "1";
    el.addEventListener("click", function () { openImageModal(parseInt(el.dataset.obraIdx, 10)); });
  });
}

function bindAccordions() {
  qa(".accordion-toggle").forEach(function (btn) {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", function () { btn.closest(".accordion-item").classList.toggle("open"); });
  });
}

/* [SYNC-FUNCIONALIDAD: TODOS LOS ESTILOS] Botón "volver arriba": se muestra al bajar y,
   al hacer clic, sube suavemente hasta #inicio (la portada/hero). Equivalente en Comic:
   initBackToTop() dentro de comic.html. */
function initBackToTop() {
  var btn = document.getElementById("m-back-to-top");
  if (!btn) return;
  function onScroll() {
    btn.classList.toggle("show", window.scrollY > 400);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  btn.addEventListener("click", function () {
    var target = document.getElementById("inicio");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function initStaticInteractions() {
  initBackToTop();
  imageModal = document.getElementById("image-modal");
  imageModalImg = document.getElementById("image-modal-img");
  imageModalCaption = document.getElementById("image-modal-caption");
  imageModalPrev = document.getElementById("image-modal-prev");
  imageModalNext = document.getElementById("image-modal-next");
  videoModal = document.getElementById("video-modal");
  videoFrame = document.getElementById("video-modal-frame");
  videoFloatBar = document.getElementById("video-float-bar");
  videoDockBtn = document.getElementById("video-dock-btn");
  videoLockBtn = document.getElementById("video-lock-btn");

  bindObrasViewToggle();
  initLibPagination();
  document.getElementById("image-modal-close").addEventListener("click", closeImageModal);
  imageModal.addEventListener("click", function (e) { if (e.target === imageModal) closeImageModal(); });
  if (imageModalPrev) imageModalPrev.addEventListener("click", function (e) { e.stopPropagation(); stepImageModal(-1); });
  if (imageModalNext) imageModalNext.addEventListener("click", function (e) { e.stopPropagation(); stepImageModal(1); });
  /* [SYNC-FUNCIONALIDAD: TODOS LOS ESTILOS] El video-float ya NO se cierra al hacer clic
     fuera (no bloquea la página, no hay "fuera" que capturar): solo con el botón de
     cerrar o Escape. */
  document.getElementById("video-modal-close").addEventListener("click", closeVideoModal);
  /* [SYNC-FUNCIONALIDAD: TODOS LOS ESTILOS] Enlaces <a data-video-url> (p. ej. "Ver resultado" de
     Proyectos) abren el reproductor flotante en vez de salir de la página. */
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[data-video-url]") : null;
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    openVideo(a.getAttribute("data-video-url"));
  });
  if (videoFloatBar) {
    videoFloatBar.addEventListener("mousedown", startVideoDrag);
    videoFloatBar.addEventListener("touchstart", startVideoDrag, { passive: true });
  }
  if (videoDockBtn) videoDockBtn.addEventListener("click", cycleVideoDock);
  if (videoLockBtn) videoLockBtn.addEventListener("click", toggleVideoLock);
  window.addEventListener("resize", clampVideoModalToViewport);
  window.addEventListener("orientationchange", function () { setTimeout(clampVideoModalToViewport, 250); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeImageModal(); closeVideoModal(); }
    if (imageModal.classList.contains("open")) {
      if (e.key === "ArrowLeft") stepImageModal(-1);
      if (e.key === "ArrowRight") stepImageModal(1);
    }
  });
  /* [OBRAS] navegación táctil (swipe) entre obras destacadas dentro del lightbox */
  var m_touchStartX = null, m_touchStartY = null;
  imageModal.addEventListener("touchstart", function (e) {
    if (!e.touches || e.touches.length !== 1) return;
    m_touchStartX = e.touches[0].clientX;
    m_touchStartY = e.touches[0].clientY;
  }, { passive: true });
  imageModal.addEventListener("touchend", function (e) {
    if (m_touchStartX === null) return;
    var touch = e.changedTouches && e.changedTouches[0];
    if (!touch) { m_touchStartX = null; return; }
    var dx = touch.clientX - m_touchStartX;
    var dy = touch.clientY - m_touchStartY;
    m_touchStartX = null; m_touchStartY = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { stepImageModal(dx < 0 ? 1 : -1); }
  }, { passive: true });

  var menuToggle = document.getElementById("menu-toggle");
  var mobileMenu = document.getElementById("mobile-menu");
  menuToggle.addEventListener("click", function () {
    var isOpen = mobileMenu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
  qa("#mobile-menu a").forEach(function (a) {
    a.addEventListener("click", function () { mobileMenu.classList.remove("open"); menuToggle.setAttribute("aria-expanded", "false"); });
  });

  var sections = qa("main section[id], #sobre-el-nexo");
  var navLinks = qa(".nav-link");
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        navLinks.forEach(function (link) { link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id); });
      }
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  sections.forEach(function (s) { observer.observe(s); });

  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { entry.target.classList.add("in"); revealObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.15 });
  qa(".fade-up").forEach(function (el) { revealObserver.observe(el); });

  var tabBtns = qa(".tab-btn");
  tabBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      tabBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      qa(".tab-panel").forEach(function (p) { p.classList.remove("active"); });
      var panel = document.querySelector('.tab-panel[data-panel="' + btn.dataset.tab + '"]');
      if (panel) panel.classList.add("active");
    });
  });

  document.getElementById("foot-year") && (document.getElementById("foot-year").textContent = new Date().getFullYear());
  var fy = document.getElementById("m-foot-year"); if (fy) fy.textContent = new Date().getFullYear();
}