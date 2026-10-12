/* =====================================================================================
   js/theme.js — CAMBIO DE ESTILO Y COLOREADO.
   - ESTILO  = qué hoja de themes/*.css está cargada (moderno / comic / retro). El HTML y el
               JS son los mismos; solo cambia el CSS.
   - COLOREADO = clase(s) en <body> dentro del estilo activo (solo variables de color).
   Para agregar un estilo o un coloreado, basta con darlo de alta en THEMES y crear su CSS.
   La elección se recuerda en localStorage (nexo-theme y nexo-colorway-<estilo>).
   ===================================================================================== */
"use strict";

var THEME_KEY = "nexo-theme";
var THEMES = {
  moderno: {
    css: "themes/moderno.css",
    bodyClasses: [],
    defaultColorway: "clasico",
    colorways: [
      { id: "clasico", label: "Clásico violeta" },
      { id: "clasico-rojo", label: "Clásico rojo sofisticado" },
      { id: "clasico-oceano", label: "Clásico azul océano" },
      { id: "clasico-bosque", label: "Clásico verde bosque" },
      { id: "clasico-dorado", label: "Clásico dorado" },
      { id: "clasico-rosa", label: "Clásico rosa magenta" },
      { id: "neon", label: "Color neon" }
    ],
    /* Las paletas nuevas conservan las reglas estructurales de "clasico". */
    colorwayClasses: function (id) { return (id === "clasico" || id === "neon") ? [id] : [id, "clasico"]; }
  },
  comic: {
    css: "themes/comic.css",
    bodyClasses: ["comic"],
    defaultColorway: "rojo",
    colorways: [
      { id: "rojo", label: "Rojo" }, { id: "azul", label: "Azul" }, { id: "verde", label: "Verde" },
      { id: "morado", label: "Morado" }, { id: "naranja", label: "Naranja" }, { id: "mostaza", label: "Mostaza" }
    ],
    colorwayClasses: function (id) { return id === "rojo" ? [] : ["comic-" + id]; }
  },
  retro: {
    css: "themes/retro.css",
    bodyClasses: ["bg-background", "retro"],
    defaultColorway: "vaporwave",
    colorways: [
      { id: "vaporwave", label: "Vaporwave" }, { id: "terminal", label: "Terminal" },
      { id: "synthwave", label: "Synthwave" }, { id: "arcade", label: "Arcade" },
      { id: "ambar", label: "Ámbar CRT" }, { id: "purpura", label: "Púrpura" }
    ],
    colorwayClasses: function (id) { return id === "vaporwave" ? [] : ["retro-" + id]; }
  }
};
var THEME_STATE = { theme: "moderno", colorway: null };

function themeStore(key, value) {
  try { if (value === undefined) return localStorage.getItem(key); localStorage.setItem(key, value); } catch (e) {}
  return null;
}

/* Todas las clases que este módulo puede poner en <body> (para limpiarlas al cambiar). */
function themeManagedClasses() {
  var all = [];
  Object.keys(THEMES).forEach(function (name) {
    var t = THEMES[name];
    all = all.concat(t.bodyClasses);
    t.colorways.forEach(function (c) { all = all.concat(t.colorwayClasses(c.id)); });
  });
  return all;
}

function loadThemeCss(href, done) {
  var current = document.getElementById("theme-css");
  if (current && current.getAttribute("href") === href) { done(); return; }
  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  var finished = false;
  function finish() {
    if (finished) return; finished = true;
    if (current && current.parentNode) current.parentNode.removeChild(current);
    link.id = "theme-css";
    done();
  }
  link.onload = finish;
  link.onerror = finish;
  setTimeout(finish, 2500);
  document.head.appendChild(link);
}

function applyColorway(id) {
  var t = THEMES[THEME_STATE.theme];
  if (!t.colorways.some(function (c) { return c.id === id; })) id = t.defaultColorway;
  var cls = document.body.classList;
  t.colorways.forEach(function (c) { t.colorwayClasses(c.id).forEach(function (k) { cls.remove(k); }); });
  t.colorwayClasses(id).forEach(function (k) { cls.add(k); });
  THEME_STATE.colorway = id;
  qa("[data-colorway]", document.getElementById("colorway-group")).forEach(function (btn) {
    btn.classList.toggle("active", btn.getAttribute("data-colorway") === id);
  });
  themeStore("nexo-colorway-" + THEME_STATE.theme, id);
}

function renderColorwayPicker(t) {
  var group = document.getElementById("colorway-group");
  if (!group) return;
  group.innerHTML = t.colorways.map(function (c) {
    return '<button type="button" data-colorway="' + c.id + '" aria-label="' + c.label + '" title="' + c.label + '"></button>';
  }).join("");
  qa("[data-colorway]", group).forEach(function (btn) {
    btn.addEventListener("click", function () { applyColorway(btn.getAttribute("data-colorway")); });
  });
}

function setTheme(name) {
  if (!THEMES[name]) name = "moderno";
  var t = THEMES[name];
  THEME_STATE.theme = name;
  themeStore(THEME_KEY, name);
  qa("[data-style]", document.getElementById("style-group")).forEach(function (btn) {
    btn.classList.toggle("active", btn.getAttribute("data-style") === name);
  });
  loadThemeCss(t.css, function () {
    var cls = document.body.classList;
    themeManagedClasses().forEach(function (k) { cls.remove(k); });
    t.bodyClasses.forEach(function (k) { cls.add(k); });
    document.documentElement.setAttribute("data-theme", name);
    renderColorwayPicker(t);
    applyColorway(themeStore("nexo-colorway-" + name) || t.defaultColorway);
  });
}

function initTheme() {
  qa("[data-style]", document.getElementById("style-group")).forEach(function (btn) {
    btn.addEventListener("click", function () { setTheme(btn.getAttribute("data-style")); });
  });
  setTheme(themeStore(THEME_KEY) || "moderno");
}
