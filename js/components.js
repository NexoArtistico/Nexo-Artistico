(function () {
  "use strict";

  /* ---------- CSV endpoints (same source as estilo comic) ---------- */
  var BASE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSv19AZ9XOhQxN7-Cyrn_m_6f5dVNnGHT4SGpL5ajb_iI9MW1HDbSwhEeJ9shXvnambJpPeQXT3qoz/pub?single=true&output=csv&gid=";
  var URLS = {
    config: BASE + "0",
    obras: BASE + "1890725432",
    proyectos: BASE + "1986139415",
    libros: BASE + "417600961",
    recursos: BASE + "967089863",
    videos: BASE + "1670672524",
    pinterest: BASE + "466486359",
    playlists: BASE + "1612784649",
    playlistVideos: BASE + "757598810",
    sobre: BASE + "238541182",
    testimonios: BASE + "1975837966",
    equipo: BASE + "1365536327"
  };

  /* ---------- generic helpers ---------- */
  function esc(v) {
    return (v === undefined || v === null ? "" : String(v))
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function isTrue(v) { return (v || "").toString().trim().toUpperCase() === "TRUE"; }
  function sortByOrden(arr) {
    return arr.slice().sort(function (a, b) {
      var ao = parseFloat(a.orden), bo = parseFloat(b.orden);
      ao = isNaN(ao) ? 999999 : ao; bo = isNaN(bo) ? 999999 : bo;
      return ao - bo;
    });
  }
  function parseCSV(text) {
    var rows = [], row = [], field = "", inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; } }
        else { field += c; }
      } else {
        if (c === '"') { inQuotes = true; }
        else if (c === ',') { row.push(field); field = ""; }
        else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
        else if (c === '\r') { /* skip */ }
        else { field += c; }
      }
    }
    if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
    return rows;
  }
  function csvToObjects(text) {
    var rows = parseCSV(text).filter(function (r) { return r.length > 1 || (r.length === 1 && r[0] !== ""); });
    if (!rows.length) return [];
    var headers = rows[0].map(function (h) { return (h || "").trim(); });
    return rows.slice(1).map(function (r) {
      var obj = {};
      headers.forEach(function (h, idx) { obj[h] = (r[idx] !== undefined ? r[idx].trim() : ""); });
      return obj;
    });
  }
  function fetchCSV(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    }).then(csvToObjects);
  }
  /* loadCSV: renders instantly from localStorage cache (if any) while the
     fresh copy loads in the background, then re-renders when it arrives.
     Keeps the page feeling instant on repeat visits without ever showing
     stale data forever. */
  function loadCSV(url, onData) {
    var cacheKey = "nexo-csv::" + url;
    var hadCache = false;
    try {
      var cached = localStorage.getItem(cacheKey);
      if (cached) { hadCache = true; onData(csvToObjects(cached)); }
    } catch (e) {}
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    }).then(function (text) {
      var rows = csvToObjects(text);
      try { localStorage.setItem(cacheKey, text); } catch (e) {}
      onData(rows);
      return rows;
    }).catch(function (err) {
      if (hadCache) { console.log("[nexo-modern] refresh failed, keeping cached data", url, err); return null; }
      throw err;
    });
  }
  function getYouTubeId(url) {
    if (!url) return null;
    var m = url.match(/(?:v=|\/embed\/|\.be\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }
  function setHTML(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; }
  function qa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

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
  function applyConfig(rows) {
    var cfg = {};
    rows.forEach(function (r) { if (r.clave) cfg[r.clave.trim()] = r.valor; });

    if (cfg.nombre_sitio) {
      document.title = cfg.nombre_sitio + " — Donde el Arte nos Conecta";
      var bn = document.getElementById("m-brand-name"); if (bn) bn.textContent = cfg.nombre_sitio;
      var fn = document.getElementById("m-foot-name"); if (fn) fn.textContent = cfg.nombre_sitio;
    }
    if (cfg.descripcion) {
      var hd = document.getElementById("m-hero-desc"); if (hd) hd.textContent = cfg.descripcion;
    }
    if (cfg.portada) {
      var hc = document.getElementById("m-hero-cover");
      if (hc) { hc.style.backgroundImage = "url('" + cfg.portada + "')"; hc.classList.add("has-image"); }
    }
    if (cfg.whatsapp) {
      var w1 = document.getElementById("m-btn-whatsapp"); if (w1) w1.href = cfg.whatsapp;
    }
    if (cfg.miembros_activos) setHTML("m-stat-miembros", esc(cfg.miembros_activos) + "+");
    if (cfg.recursos_compartidos) setHTML("m-stat-recursos", esc(cfg.recursos_compartidos) + "+");
    if (cfg.proyectos_realizados) setHTML("m-stat-proyectos", esc(cfg.proyectos_realizados) + "+");

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

    if (cfg.logo) {
      qa("#m-logo-1, #m-logo-2").forEach(function (img) { img.src = cfg.logo; });
      var favicon = document.querySelector('link[rel="icon"]'); if (favicon) favicon.href = cfg.logo;
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
        (p.enlace ? '<a href="' + esc(p.enlace) + '" target="_blank" rel="noopener noreferrer" class="inline-block mt-5 text-sm font-semibold text-primary hover:text-secondary">Ver resultado</a>' : '') +
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
     Equivalente en Comic: mismo bloque LIB_* dentro de <script id="comic-src">
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
     Equivalente en Comic: renderVideos() dentro de <script id="comic-src">. */
  var PLAY_ICON = '<svg width="40" height="40" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" style="fill:var(--theme-bg,#04140f);fill-opacity:0.7"/><path d="M10 8l6 4-6 4V8z" style="fill:var(--theme-primary,#00DF81)"/></svg>';
  function videoCardHtml(v) {
    var yid = getYouTubeId(v.youtube_url);
    var thumb = yid ? "https://i.ytimg.com/vi/" + yid + "/hqdefault.jpg" : "";
    return (
      '<button class="video-card card-hover group text-left border border-border2 rounded-xl overflow-hidden bg-surface" data-url="' + esc(v.youtube_url) + '">' +
        '<div class="m-video-thumb">' +
          (thumb ? '<img src="' + thumb + '" alt="" class="group-hover:scale-105 transition-transform duration-500" loading="lazy" crossorigin="anonymous" />' : '') +
          '<span class="absolute inset-0 flex items-center justify-center bg-background/30">' + PLAY_ICON + '</span>' +
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
     (misma página). Equivalente en Comic: renderPlaylists() dentro de <script id="comic-src">. */
  function renderPlaylists(playlists, videos) {
    var items = sortByOrden(playlists.filter(function (r) { return isTrue(r.visible) && r.titulo; }));
    if (!items.length) { setHTML("m-playlists-grid", '<div class="m-empty">Sin playlists disponibles.</div>'); return; }
    var html = items.map(function (pl, idx) {
      var vids = sortByOrden(videos.filter(function (v) { return isTrue(v.visible) && v.playlist_id === pl.id; }));
      var vidsHTML = vids.map(function (v) {
        return '<button type="button" data-url="' + esc(v.youtube_url) + '"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 7l9 5-9 5V7z"/></svg>' + esc(v.titulo) + '</button>';
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
  var imageModal, imageModalImg, imageModalCaption, imageModalPrev, imageModalNext, videoModal, videoFrame;
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

  /* [SYNC-FUNCIONALIDAD: TODOS LOS ESTILOS] ============================================
     Video modal: reproduce un video de YouTube dentro de la página (sin salir a YouTube),
     en un panel FLOTANTE y NO bloqueante — el usuario puede seguir navegando, arrastrar el
     panel a cualquier posición, redimensionarlo (mantiene 16:9) y anclarlo a una esquina.
     Compartido por Clásico y Neon (este #modern-root). Equivalente en Comic: buscar
     "openVideoModal" / "video-float" dentro del documento embebido en <script id="comic-src">.
     Si cambias el parámetro de embed, el autoplay, el arrastre, el anclaje o cómo se cierra
     el panel, replica el cambio también allá para que todos los estilos se comporten igual.
     ==================================================================================== */
  var videoDockBtn, videoFloatBar, videoLockBtn;
  var VIDEO_DOCKS = ["br", "bl", "tl", "tr"];
  var videoDockIdx = 0;
  var videoDragState = null;
  var videoLocked = false;

  function setVideoDock(dock) {
    if (videoLocked) return;
    videoDockIdx = VIDEO_DOCKS.indexOf(dock);
    if (videoDockIdx < 0) videoDockIdx = 0;
    videoModal.style.left = videoModal.style.top = videoModal.style.right = videoModal.style.bottom = "";
    videoModal.dataset.dock = dock;
    var m = "20px";
    if (dock === "br") { videoModal.style.right = m; videoModal.style.bottom = m; }
    if (dock === "bl") { videoModal.style.left = m; videoModal.style.bottom = m; }
    if (dock === "tl") { videoModal.style.left = m; videoModal.style.top = m; }
    if (dock === "tr") { videoModal.style.right = m; videoModal.style.top = m; }
  }
  function cycleVideoDock() {
    if (videoLocked) return;
    setVideoDock(VIDEO_DOCKS[(videoDockIdx + 1) % VIDEO_DOCKS.length]);
  }
  /* [SYNC-FUNCIONALIDAD: TODOS LOS ESTILOS] Bloqueo del panel flotante: mientras está
     bloqueado no se puede arrastrar, redimensionar ni cambiar de anclaje — solo cerrar o
     desbloquear. Equivalente en Comic: toggleVideoLock() dentro de <script id="comic-src">. */
  function updateLockIcon() {
    if (!videoLockBtn) return;
    videoLockBtn.innerHTML = videoLocked
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.3-2.3"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  }
  function toggleVideoLock() {
    videoLocked = !videoLocked;
    videoModal.classList.toggle("locked", videoLocked);
    videoLockBtn.classList.toggle("active", videoLocked);
    videoLockBtn.setAttribute("aria-pressed", videoLocked ? "true" : "false");
    videoLockBtn.title = videoLocked ? "Desbloquear panel" : "Bloquear panel (evita mover/redimensionar)";
    updateLockIcon();
  }
  function startVideoDrag(e) {
    if (videoLocked) return;
    if (e.target.closest(".video-float-btn")) return;
    var point = e.touches ? e.touches[0] : e;
    var rect = videoModal.getBoundingClientRect();
    videoDragState = { startX: point.clientX, startY: point.clientY, startLeft: rect.left, startTop: rect.top };
    videoModal.style.right = videoModal.style.bottom = "";
    videoModal.style.left = rect.left + "px";
    videoModal.style.top = rect.top + "px";
    videoModal.classList.add("dragging");
    document.addEventListener("mousemove", onVideoDrag);
    document.addEventListener("touchmove", onVideoDrag, { passive: false });
    document.addEventListener("mouseup", endVideoDrag);
    document.addEventListener("touchend", endVideoDrag);
  }
  function onVideoDrag(e) {
    if (!videoDragState) return;
    if (e.cancelable) e.preventDefault();
    var point = e.touches ? e.touches[0] : e;
    var dx = point.clientX - videoDragState.startX, dy = point.clientY - videoDragState.startY;
    var maxLeft = window.innerWidth - videoModal.offsetWidth - 8;
    var maxTop = window.innerHeight - videoModal.offsetHeight - 8;
    var newLeft = Math.min(Math.max(8, videoDragState.startLeft + dx), Math.max(8, maxLeft));
    var newTop = Math.min(Math.max(8, videoDragState.startTop + dy), Math.max(8, maxTop));
    videoModal.style.left = newLeft + "px";
    videoModal.style.top = newTop + "px";
  }
  function endVideoDrag() {
    videoDragState = null;
    videoModal.classList.remove("dragging");
    document.removeEventListener("mousemove", onVideoDrag);
    document.removeEventListener("touchmove", onVideoDrag);
    document.removeEventListener("mouseup", endVideoDrag);
    document.removeEventListener("touchend", endVideoDrag);
  }
  /* [SYNC-FUNCIONALIDAD: TODOS LOS ESTILOS] Si el panel quedó posicionado con left/top fijos
     (arrastrado) y luego cambia el tamaño de la ventana (p. ej. al rotar el teléfono), lo
     reubicamos dentro de los límites visibles para que no quede "perdido" fuera de pantalla.
     Equivalente en Comic: dentro de <script id="comic-src">. */
  function clampVideoModalToViewport() {
    if (!videoModal || !videoModal.classList.contains("open")) return;
    fitVideoPanel();
    if (!videoModal.style.left && !videoModal.style.top) return;
    var maxLeft = Math.max(8, window.innerWidth - videoModal.offsetWidth - 8);
    var maxTop = Math.max(8, window.innerHeight - videoModal.offsetHeight - 8);
    if (videoModal.style.left) {
      var left = Math.min(Math.max(8, parseFloat(videoModal.style.left)), maxLeft);
      videoModal.style.left = left + "px";
    }
    if (videoModal.style.top) {
      var top = Math.min(Math.max(8, parseFloat(videoModal.style.top)), maxTop);
      videoModal.style.top = top + "px";
    }
  }
  /* [SYNC-FUNCIONALIDAD: TODOS LOS ESTILOS] Ancho/alto del panel fijados por JS, sin
     depender solo de flex/aspect-ratio en CSS (algunos navegadores móviles calculan mal
     el alto de contenedores flex y dejan una franja vacía debajo del video). Se recalcula
     al abrir un video, al redimensionar la ventana y al terminar de arrastrar el panel.
     Equivalente en Comic: fitVideoPanel() dentro de <script id="comic-src">. */
  function fitVideoPanel() {
    if (!videoModal) return;
    var bar = document.getElementById("video-float-bar");
    var barH = bar ? bar.offsetHeight : 0;
    var w = videoModal.clientWidth || videoModal.offsetWidth;
    if (!w) return;
    var vidH = Math.round(w * 9 / 16);
    videoModal.style.height = (barH + vidH) + "px";
  }
  function openVideo(url) {
    var id = getYouTubeId(url);
    if (!id) return;
    videoFrame.src = "https://www.youtube.com/embed/" + id + "?autoplay=1&rel=0";
    videoModal.classList.add("open");
    if (!videoModal.dataset.dock) setVideoDock("br");
    fitVideoPanel();
    setTimeout(fitVideoPanel, 60);
  }
  function closeVideoModal() { videoModal.classList.remove("open"); videoFrame.src = ""; }

  function bindLightboxes() {
    qa("[data-obra-idx]").forEach(function (el) {
      if (el.dataset.bound) return;
      el.dataset.bound = "1";
      el.addEventListener("click", function () { openImageModal(parseInt(el.dataset.obraIdx, 10)); });
    });
  }
  function bindVideoTriggers() {
    qa(".video-card, .m-playlist-videos button").forEach(function (el) {
      if (el.dataset.bound) return;
      el.dataset.bound = "1";
      el.addEventListener("click", function () { openVideo(el.dataset.url); });
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
     initBackToTop() dentro de <script id="comic-src">. */
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

  /* ---------- style switcher (Neon / Comic / Clásico) ---------- */
  var comicFrame = document.getElementById("comic-frame");
  var modernRoot = document.getElementById("modern-root");
  var comicLoaded = false;

  function activateComicFrame() {
    if (comicLoaded) return;
    comicLoaded = true;
    var b64 = document.getElementById("comic-src").textContent;
    var binary = atob(b64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    var html = new TextDecoder("utf-8").decode(bytes);
    comicFrame.srcdoc = html;
  }

  var retroFrame = document.getElementById("retro-frame");
  var retroLoaded = false;

  function activateRetroFrame() {
    if (retroLoaded) return;
    retroLoaded = true;
    var b64r = document.getElementById("retro-src").textContent;
    var binaryR = atob(b64r);
    var bytesR = new Uint8Array(binaryR.length);
    for (var j = 0; j < binaryR.length; j++) bytesR[j] = binaryR.charCodeAt(j);
    var htmlR = new TextDecoder("utf-8").decode(bytesR);
    retroFrame.srcdoc = htmlR;
  }

  /* [ARQUITECTURA] Estado con dos ejes independientes — ver comentario junto a
     "SWITCHER: ESTILO + COLOREADO" en el <style>. STYLE_STATE.colorway se conserva aunque
     el usuario esté viendo Comic, para que al volver a Moderno reaparezca el mismo
     coloreado (Clásico/Neon) que tenía elegido, en vez de resetear siempre a Clásico. */
  var STYLE_STATE = { style: "moderno", colorway: "clasico" };

  function applyColorwayClass() {
    /* Esta función SOLO pinta el coloreado del estilo Moderno (Clásico/Rojo/Océano).
       Nunca debe tocar "retro": Retro es un documento HTML completo aparte (vive en su
       propio <iframe id="retro-frame">, ver retro-src más abajo) y no debe heredar ni la clase
       "clasico" ni ninguna regla pensada para el coloreado de Moderno. */
    document.body.classList.remove("neon", "clasico", "clasico-rojo", "clasico-oceano", "clasico-bosque", "clasico-dorado", "clasico-rosa");
    document.body.classList.add(STYLE_STATE.colorway);
    /* Las paletas nuevas conservan las reglas estructurales de Clásico. */
    if (STYLE_STATE.colorway === "clasico-rojo" || STYLE_STATE.colorway === "clasico-oceano" || STYLE_STATE.colorway === "clasico-bosque" || STYLE_STATE.colorway === "clasico-dorado" || STYLE_STATE.colorway === "clasico-rosa") {
      document.body.classList.add("clasico");
    }
  }

  function setStyle(style) {
    STYLE_STATE.style = style;
    qa("[data-style]", document.getElementById("style-group")).forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-style") === style);
    });
    if (style === "comic") {
      activateComicFrame();
      comicFrame.style.display = "block";
      retroFrame.style.display = "none";
      modernRoot.classList.add("hidden-mode");
      document.body.classList.remove("retro-active");
      document.body.classList.add("comic-active");
    } else if (style === "retro") {
      /* Retro es un documento HTML completo aparte (igual que Comic): vive en su
         propio <iframe id="retro-frame">, con su propio DOM/CSS/JS, sin heredar ni
         compartir clases de coloreado de Moderno (neon/clasico/clasico-rojo/
         clasico-oceano). Así, cambios futuros en el CSS/JS de Clásico no le afectan,
         igual que ya pasa con Comic. "retro-active" (distinta de la vieja clase
         "retro" que pintaba #modern-root) solo sirve para restylear el switcher de
         la página raíz (ver "SWITCHER: ESTILO + COLOREADO" en el <style>) — el look
         de Retro en sí vive entero dentro del iframe. */
      activateRetroFrame();
      comicFrame.style.display = "none";
      retroFrame.style.display = "block";
      modernRoot.classList.add("hidden-mode");
      document.body.classList.remove("comic-active", "neon", "clasico", "clasico-rojo", "clasico-oceano", "clasico-bosque", "clasico-dorado", "clasico-rosa", "retro");
      document.body.classList.add("retro-active");
    } else {
      comicFrame.style.display = "none";
      retroFrame.style.display = "none";
      modernRoot.classList.remove("hidden-mode");
      document.body.classList.remove("comic-active", "retro-active", "retro");
      applyColorwayClass();
    }
  }

  function setColorway(colorway) {
    STYLE_STATE.colorway = colorway;
    qa("[data-colorway]", document.getElementById("colorway-group")).forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-colorway") === colorway);
    });
    /* El coloreado solo se aplica visualmente si el estilo activo es Moderno; si el
       usuario lo cambia estando en Comic o en Retro, queda guardado y se aplica
       al volver a Moderno, sin tocar el body mientras tanto. */
    if (STYLE_STATE.style !== "comic" && STYLE_STATE.style !== "retro") {
      applyColorwayClass();
    }
  }

  function initSwitcher() {
    qa("[data-style]", document.getElementById("style-group")).forEach(function (btn) {
      btn.addEventListener("click", function () { setStyle(btn.getAttribute("data-style")); });
    });
    qa("[data-colorway]", document.getElementById("colorway-group")).forEach(function (btn) {
      btn.addEventListener("click", function () { setColorway(btn.getAttribute("data-colorway")); });
    });
  }

  /* ---------- boot ---------- */
  initStaticInteractions();
  initSwitcher();
  setStyle("moderno");
  setColorway("clasico");

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

})();
