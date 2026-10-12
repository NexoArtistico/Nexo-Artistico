/* =====================================================================================
   js/video-player.js — REPRODUCTOR FLOTANTE (una sola vez para todos los estilos): abrir un
   video, anclarlo en una esquina, arrastrarlo, bloquearlo y ajustarlo al viewport.
   ===================================================================================== */
"use strict";

var videoModal, videoFrame;

/* [SYNC-FUNCIONALIDAD: TODOS LOS ESTILOS] ============================================
   Video modal: reproduce un video de YouTube dentro de la página (sin salir a YouTube),
   en un panel FLOTANTE y NO bloqueante — el usuario puede seguir navegando, arrastrar el
   panel a cualquier posición, redimensionarlo (mantiene 16:9) y anclarlo a una esquina.
   Compartido por Clásico y Neon (este esqueleto, #app). Equivalente en Comic: buscar
   "openVideoModal" / "video-float" dentro del documento embebido en comic.html.
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
   desbloquear. Equivalente en Comic: toggleVideoLock() dentro de comic.html. */
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
   Equivalente en Comic: dentro de comic.html. */
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
   Equivalente en Comic: fitVideoPanel() dentro de comic.html. */
function fitVideoPanel() {
  if (!videoModal) return;
  var bar = document.getElementById("video-float-bar");
  var barH = bar ? bar.offsetHeight : 0;
  var w = videoModal.clientWidth || videoModal.offsetWidth;
  if (!w) return;
  /* [SYNC-FUNCIONALIDAD: TODOS LOS ESTILOS] Modo vertical (TikTok, 9:16): el alto sale del ancho,
     pero se limita al alto visible de la pantalla; si no cabe, se reduce también el ancho para
     conservar la proporción. Equivalente en Comic: fitVideoPanel() dentro de comic.html. */
  if (videoModal.classList.contains("is-vertical")) {
    videoModal.style.width = "";
    videoModal.style.minWidth = "0px";
    var wv = videoModal.clientWidth || videoModal.offsetWidth;
    if (!wv) return;
    var availH = Math.max(240, window.innerHeight - 24 - barH);
    var vh = Math.round(wv * 16 / 9);
    if (vh > availH) { vh = availH; wv = Math.round(vh * 9 / 16); videoModal.style.width = wv + "px"; }
    videoModal.style.height = (barH + vh) + "px";
    return;
  }
  videoModal.style.minWidth = "";
  var vidH = Math.round(w * 9 / 16);
  videoModal.style.height = (barH + vidH) + "px";
}
function openVideo(url) {
  var pv = parseVideoUrl(url);
  var src = videoEmbedSrc(pv);
  if (!src) {
    /* Sin ID incrustable (p. ej. enlace corto de TikTok): se abre el enlace original. */
    if (url && /^https?:\/\//i.test(url)) window.open(url, "_blank", "noopener");
    return;
  }
  videoModal.classList.toggle("is-vertical", !!pv.vertical);
  videoModal.style.width = "";
  videoModal.style.height = "";
  var openBtn = document.getElementById("video-open-btn");
  if (openBtn) {
    var lbl = "Abrir en " + (pv.provider === "tiktok" ? "TikTok" : "YouTube");
    openBtn.href = pv.url; openBtn.title = lbl; openBtn.setAttribute("aria-label", lbl);
  }
  var ttl = videoModal.querySelector(".video-float-title");
  if (ttl) ttl.textContent = pv.provider === "tiktok" ? "TikTok" : "Reproduciendo";
  videoFrame.src = src;
  videoModal.classList.add("open");
  if (!videoModal.dataset.dock) setVideoDock("br");
  fitVideoPanel();
  setTimeout(fitVideoPanel, 60);
}
function closeVideoModal() { videoModal.classList.remove("open"); videoFrame.src = ""; }

function bindVideoTriggers() {
  qa(".video-card, .m-playlist-videos button").forEach(function (el) {
    if (el.dataset.bound) return;
    el.dataset.bound = "1";
    el.addEventListener("click", function () { openVideo(el.dataset.url); });
  });
}
