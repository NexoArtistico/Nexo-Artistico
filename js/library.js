(function(){
  "use strict";
  var wrap = document.getElementById("gm-details");
  if (!wrap || wrap.dataset.gmBound) return;
  wrap.dataset.gmBound = "1";

  var fileInput = document.getElementById("gm-file");
  var drop = document.getElementById("gm-drop");
  var dropText = document.getElementById("gm-drop-text");
  var rowsInput = document.getElementById("gm-rows");
  var colsInput = document.getElementById("gm-cols");
  var colorInput = document.getElementById("gm-color");
  var thicknessInput = document.getElementById("gm-thickness");
  var thicknessVal = document.getElementById("gm-thickness-val");
  var opacityInput = document.getElementById("gm-opacity");
  var opacityVal = document.getElementById("gm-opacity-val");
  var aspectSelect = document.getElementById("gm-aspect");
  var fitSelect = document.getElementById("gm-fit");
  var canvas = document.getElementById("gm-canvas");
  var emptyNote = document.getElementById("gm-empty-note");
  var downloadBtn = document.getElementById("gm-download");
  var resetBtn = document.getElementById("gm-reset");
  var ctx = canvas.getContext("2d");

  var currentImg = null;
  var currentFileName = "cuadricula";

  function parseAspect(val, naturalW, naturalH){
    if (val === "original") return naturalW / naturalH;
    var parts = val.split("/");
    return parseFloat(parts[0]) / parseFloat(parts[1]);
  }

  function draw(){
    if (!currentImg) return;
    var naturalW = currentImg.naturalWidth || currentImg.width;
    var naturalH = currentImg.naturalHeight || currentImg.height;
    var aspect = parseAspect(aspectSelect.value, naturalW, naturalH);

    var targetW, targetH;
    var maxDim = Math.max(naturalW, naturalH, 1600);
    if (aspect >= 1) { targetW = maxDim; targetH = Math.round(maxDim / aspect); }
    else { targetH = maxDim; targetW = Math.round(maxDim * aspect); }

    canvas.width = targetW;
    canvas.height = targetH;
    canvas.style.display = "block";
    emptyNote.style.display = "none";

    ctx.clearRect(0, 0, targetW, targetH);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, targetW, targetH);

    var fit = fitSelect.value;
    if (fit === "stretch") {
      ctx.drawImage(currentImg, 0, 0, targetW, targetH);
    } else {
      var srcRatio = naturalW / naturalH;
      var dstRatio = targetW / targetH;
      var sx = 0, sy = 0, sw = naturalW, sh = naturalH;
      if (fit === "cover") {
        if (srcRatio > dstRatio) { sw = naturalH * dstRatio; sx = (naturalW - sw) / 2; }
        else { sh = naturalW / dstRatio; sy = (naturalH - sh) / 2; }
        ctx.drawImage(currentImg, sx, sy, sw, sh, 0, 0, targetW, targetH);
      } else {
        var dw, dh, dx, dy;
        if (srcRatio > dstRatio) { dw = targetW; dh = targetW / srcRatio; }
        else { dh = targetH; dw = targetH * srcRatio; }
        dx = (targetW - dw) / 2; dy = (targetH - dh) / 2;
        ctx.drawImage(currentImg, 0, 0, naturalW, naturalH, dx, dy, dw, dh);
      }
    }

    var rows = Math.max(1, parseInt(rowsInput.value, 10) || 1);
    var cols = Math.max(1, parseInt(colsInput.value, 10) || 1);
    var thickness = Math.max(1, parseFloat(thicknessInput.value) || 1);
    var opacity = Math.max(0.05, (parseFloat(opacityInput.value) || 80) / 100);
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = colorInput.value;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    for (var c = 1; c < cols; c++) {
      var x = Math.round((targetW / cols) * c) + (thickness % 2 ? 0.5 : 0);
      ctx.moveTo(x, 0); ctx.lineTo(x, targetH);
    }
    for (var r = 1; r < rows; r++) {
      var y = Math.round((targetH / rows) * r) + (thickness % 2 ? 0.5 : 0);
      ctx.moveTo(0, y); ctx.lineTo(targetW, y);
    }
    ctx.stroke();
    ctx.strokeRect(thickness/2, thickness/2, targetW - thickness, targetH - thickness);
    ctx.restore();

    downloadBtn.disabled = false;
    resetBtn.disabled = false;
  }

  function loadFile(file){
    if (!file || file.type.indexOf("image/") !== 0) return;
    currentFileName = (file.name || "cuadricula").replace(/\.[^.]+$/, "");
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function(){
      currentImg = img;
      dropText.textContent = "Imagen cargada: " + file.name + " — haz clic para cambiarla";
      draw();
      URL.revokeObjectURL(url);
    };
    img.onerror = function(){
      dropText.textContent = "No se pudo cargar esa imagen. Prueba con otro archivo.";
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  fileInput.addEventListener("change", function(){
    if (fileInput.files && fileInput.files[0]) loadFile(fileInput.files[0]);
  });
  ["dragover","dragenter"].forEach(function(evt){
    drop.addEventListener(evt, function(e){ e.preventDefault(); drop.classList.add("gm-drag"); });
  });
  ["dragleave","drop"].forEach(function(evt){
    drop.addEventListener(evt, function(e){ e.preventDefault(); drop.classList.remove("gm-drag"); });
  });
  drop.addEventListener("drop", function(e){
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
  });

  [rowsInput, colsInput, colorInput, thicknessInput, opacityInput, aspectSelect, fitSelect].forEach(function(el){
    el.addEventListener("input", function(){
      thicknessVal.textContent = thicknessInput.value;
      opacityVal.textContent = opacityInput.value + "%";
      draw();
    });
  });

  downloadBtn.addEventListener("click", function(){
    if (!currentImg) return;
    var link = document.createElement("a");
    link.download = currentFileName + "-cuadricula.png";
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
  });

  resetBtn.addEventListener("click", function(){
    currentImg = null;
    fileInput.value = "";
    canvas.style.display = "none";
    emptyNote.style.display = "block";
    dropText.textContent = "Haz clic aquí o arrastra una imagen (JPG, PNG, WEBP, GIF, SVG, BMP...)";
    downloadBtn.disabled = true;
    resetBtn.disabled = true;
  });
})();
