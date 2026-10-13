/* =====================================================================================
   js/preview.js — Modo "vista previa" para el panel admin. Solo se activa con ?preview=1
   (index.html dentro del iframe de admin.html). Recibe por postMessage las filas de UNA tabla
   (con el borrador del formulario) y las pinta con los mismos renders de la página real.
   ===================================================================================== */
"use strict";
(function () {
  if (!/[?&]preview=1/.test(location.search)) return;
  var orig = loadCSV, PV = {}, CB = {}, scrolled = false;
  loadCSV = function (key, cb) {
    CB[key] = cb;
    return orig(key, function (rows) { cb(PV[key] || rows); });   /* los datos que lleguen después no pisan el borrador */
  };
  var st = document.createElement("style");
  st.textContent = ".nx-hl{outline:2px solid #8b6cff;outline-offset:5px;border-radius:14px}html.nx-preview header.fixed{position:absolute!important}";
  document.head.appendChild(st); document.documentElement.classList.add("nx-preview");
  window.addEventListener("message", function (e) {
    var d = e.data;
    if (e.origin !== location.origin || !d || d.type !== "nexo-preview" || !CB[d.table]) return;
    PV[d.table] = d.rows; CB[d.table](d.rows);
    setTimeout(function () { focusItem(d); }, 80);
  });
  function focusItem(d) {
    var s = document.getElementById(d.section); if (!s) return;
    Array.prototype.forEach.call(document.querySelectorAll(".nx-hl"), function (x) { x.classList.remove("nx-hl"); });
    var el = null;
    if (d.focus) {
      var w = document.createTreeWalker(s, NodeFilter.SHOW_TEXT), n;
      while ((n = w.nextNode())) { if (n.nodeValue.indexOf(d.focus) > -1) { el = n.parentElement; break; } }
    }
    if (el) {
      var c = el;
      for (var i = 0; i < 5 && c.parentElement && c.parentElement !== s && c.offsetHeight < 90; i++) c = c.parentElement;
      c.classList.add("nx-hl");
      if (!scrolled) c.scrollIntoView({ block: "center" });
    } else if (!scrolled) { s.scrollIntoView(); }
    scrolled = true;
  }
})();
