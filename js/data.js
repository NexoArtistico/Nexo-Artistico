/* =====================================================================================
   js/data.js — DATOS: URLs de los CSV (Google Sheets), parseCSV/loadCSV y helpers sin DOM
   propio de ningún estilo (esc, qa, setHTML, parseVideoUrl...). Se carga PRIMERO.
   Scripts clásicos sin bundler: las funciones son globales y se comparten entre archivos.
   Orden en index.html: data → components → library → video-player → theme → main.
   ===================================================================================== */
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
