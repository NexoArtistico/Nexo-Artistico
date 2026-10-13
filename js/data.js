/* =====================================================================================
   js/data.js — DATOS: URLs de los CSV (Google Sheets), parseCSV/loadCSV y helpers sin DOM
   propio de ningún estilo (esc, qa, setHTML, parseVideoUrl...). Se carga PRIMERO.
   Scripts clásicos sin bundler: las funciones son globales y se comparten entre archivos.
   Orden en index.html: data → components → library → video-player → theme → main.
   ===================================================================================== */
"use strict";

/* ---------- Fuentes de datos ----------
   Modo Supabase (por defecto cuando js/supabase-config.js tiene url + anonKey): cada clave de URLS es el
   nombre de la tabla. Modo respaldo (config vacía): se leen los CSV publicados de Google Sheets.
   loadCSV(clave, callback) conserva EXACTAMENTE la misma firma y entrega objetos con las mismas claves
   de texto que producía el CSV ("TRUE"/"FALSE", "autor(es)", "nueva_pestaña", "Fecha_final"), por lo que
   components.js, library.js y main.js no necesitan cambios. */
var BASE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSv19AZ9XOhQxN7-Cyrn_m_6f5dVNnGHT4SGpL5ajb_iI9MW1HDbSwhEeJ9shXvnambJpPeQXT3qoz/pub?single=true&output=csv&gid=";
var CSV_FALLBACK = {
  configuracion: BASE + "0", obras: BASE + "1890725432", proyectos: BASE + "1986139415",
  libros: BASE + "417600961", recursos: BASE + "967089863", videos: BASE + "1670672524",
  pines: BASE + "466486359", playlists: BASE + "1612784649", playlist_videos: BASE + "757598810",
  sobre: BASE + "238541182", testimonios: BASE + "1975837966", equipo: BASE + "1365536327"
};
var SB_CFG = window.NEXO_SUPABASE || {};
var SB_READY = !!(SB_CFG.url && SB_CFG.anonKey && window.supabase);
var SB = SB_READY ? window.supabase.createClient(SB_CFG.url, SB_CFG.anonKey) : null;
var URLS = {
  config: "configuracion", obras: "obras", proyectos: "proyectos", libros: "libros", recursos: "recursos",
  videos: "videos", pinterest: "pines", playlists: "playlists", playlistVideos: "playlist_videos",
  sobre: "sobre", testimonios: "testimonios", equipo: "equipo"
};
/* columna Postgres -> encabezado que esperan los renders (solo donde difieren) */
var LEGACY_KEYS = { libros: { autores: "autor(es)", nueva_pestana: "nueva_pestaña" }, proyectos: { fecha_final: "Fecha_final" } };
function legacyRow(table, row) {
  var map = LEGACY_KEYS[table] || {}, out = {};
  Object.keys(row).forEach(function (k) {
    if (k === "created_at") return;
    var v = row[k];
    out[map[k] || k] = v === null || v === undefined ? "" : (typeof v === "boolean" ? (v ? "TRUE" : "FALSE") : String(v));
  });
  return out;
}

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
function loadCSV(key, onData) {
  var useSB = SB_READY;
  var cacheKey = (useSB ? "nexo-sb::" : "nexo-csv::") + key;
  var hadCache = false;
  try {
    var cached = localStorage.getItem(cacheKey);
    if (cached) { hadCache = true; onData(useSB ? JSON.parse(cached) : csvToObjects(cached)); }
  } catch (e) {}
  var request;
  if (useSB) {
    var qb = SB.from(key).select("*");
    if (key !== "configuracion") qb = qb.order("orden", { ascending: true, nullsFirst: false }).order("id", { ascending: true });
    request = qb.then(function (res) {
      if (res.error) throw res.error;
      var rows = (res.data || []).map(function (r) { return legacyRow(key, r); });
      try { localStorage.setItem(cacheKey, JSON.stringify(rows)); } catch (e) {}
      return rows;
    });
  } else {
    request = fetch(CSV_FALLBACK[key] || key).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    }).then(function (text) {
      try { localStorage.setItem(cacheKey, text); } catch (e) {}
      return csvToObjects(text);
    });
  }
  return request.then(function (rows) { onData(rows); return rows; }).catch(function (err) {
    if (hadCache) { console.log("[nexo] refresh failed, keeping cached data", key, err); return null; }
    throw err;
  });
}
function getYouTubeId(url) {
  if (!url) return null;
  var m = url.match(/(?:v=|\/embed\/|\.be\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
/* [SYNC-FUNCIONALIDAD: TODOS LOS ESTILOS] El reproductor flotante acepta YouTube y TikTok (video o
   publicación de fotos). Se detecta el proveedor por la URL, así que en el CSV se sigue usando la
   misma columna (youtube_url; también se lee tiktok_url) y en Proyectos la columna "enlace".
   TikTok se revisa ANTES que YouTube porque su URL /embed/<id> confundiría a getYouTubeId().
   Los enlaces cortos de TikTok (vm.tiktok.com/..., tiktok.com/t/...) no traen el ID y no se pueden
   resolver desde el navegador: se abren en pestaña nueva. Usa el enlace completo
   (tiktok.com/@usuario/video/<id> o /photo/<id>) para verlos dentro de la página.
   Equivalente en Comic: parseVideoUrl() dentro de comic.html. */
function parseVideoUrl(url) {
  if (!url) return null;
  url = String(url).trim();
  if (/tiktok\.com/i.test(url)) {
    var t = url.match(/tiktok\.com\/(?:@[^\/?#]+\/(?:video|photo)|embed(?:\/v2)?|player\/v1|v)\/(\d{6,25})/i);
    return { provider: "tiktok", id: t ? t[1] : null, vertical: true, url: url };
  }
  var yid = getYouTubeId(url);
  if (yid) return { provider: "youtube", id: yid, vertical: false, url: url };
  return null;
}
function videoEmbedSrc(pv) {
  if (!pv || !pv.id) return "";
  if (pv.provider === "tiktok") return "https://www.tiktok.com/player/v1/" + pv.id + "?autoplay=1&rel=0&description=0&music_info=0&timestamp=0";
  return "https://www.youtube.com/embed/" + pv.id + "?autoplay=1&rel=0";
}
function isEmbeddableVideo(url) { var pv = parseVideoUrl(url); return !!(pv && pv.id); }
function videoUrlOf(v) { return (v && (v.youtube_url || v.tiktok_url)) || ""; }
function setHTML(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; }
function qa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
