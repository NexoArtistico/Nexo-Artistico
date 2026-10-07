(function(){
  "use strict";
  // [MENÚ SECRETO] Lógica del disparador oculto en el logo (#secret-menu-trigger):
  // - Clic normal / clic corto: se comporta como el logo de siempre (navega a #inicio).
  // - Mantener presionado ~600ms, O doble clic rápido: NO navega, y en su lugar
  //   abre/cierra (toggle) el panel oculto #secret-menu-panel.
  var trigger = document.getElementById("secret-menu-trigger");
  var panel = document.getElementById("secret-menu-panel");
  if (!trigger || !panel) return;

  var pressTimer = null;
  var unlockedByHold = false;

  function toggleSecretMenu(){
    var open = panel.classList.toggle("open");
    if (open) panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  trigger.addEventListener("pointerdown", function(){
    unlockedByHold = false;
    pressTimer = setTimeout(function(){
      unlockedByHold = true;
      toggleSecretMenu();
    }, 600);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach(function(evt){
    trigger.addEventListener(evt, function(){
      if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
    });
  });
  trigger.addEventListener("dblclick", function(e){
    e.preventDefault();
    toggleSecretMenu();
  });
  trigger.addEventListener("click", function(e){
    // Si el menú secreto se acaba de desbloquear con la pulsación mantenida,
    // cancelamos la navegación normal a "#inicio" para no interrumpir al usuario.
    if (unlockedByHold) { e.preventDefault(); unlockedByHold = false; }
  });

  // [MENÚ SECRETO] Segundo disparador oculto: el atajo de teclado Ctrl + | (pipe).
  // Se detecta con e.ctrlKey combinado con e.key === "|" (la tecla "|" en sí ya suele
  // requerir Shift físicamente en el teclado, pero lo que valida el atajo es Ctrl).
  // No aparece en ningún menú de ayuda ni tooltip — es intencionalmente oculto.
  document.addEventListener("keydown", function(e){
    if (e.key === "|" && e.ctrlKey) {
      e.preventDefault();
      toggleSecretMenu();
    }
  });
})();
