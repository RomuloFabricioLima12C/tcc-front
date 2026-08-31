/**
 * Faz a página (projetada para 1440px) caber em telas menores,
 * escalando o layout inteiro proporcionalmente — sem alterar
 * posições, tamanhos ou proporções relativas de nada.
 */
(function () {
  var BASE_WIDTH = 1440;
  var root = document.body.firstElementChild;
  if (!root) return;

  function applyScale() {
    var vw = window.innerWidth;

    if (vw < BASE_WIDTH) {
      var scale = vw / BASE_WIDTH;

      root.style.transformOrigin = "top left";
      root.style.transform = "scale(" + scale + ")";
      root.style.position = "absolute";
      root.style.top = "0";
      root.style.left = "0";

      document.body.style.position = "relative";
      document.body.style.overflow = "hidden";
      document.body.style.width = "100%";
      document.body.style.height = root.scrollHeight * scale + "px";
    } else {
      root.style.transform = "";
      root.style.position = "";
      root.style.top = "";
      root.style.left = "";

      document.body.style.position = "";
      document.body.style.overflow = "";
      document.body.style.width = "";
      document.body.style.height = "";
    }
  }

  window.addEventListener("resize", applyScale);
  window.addEventListener("orientationchange", applyScale);
  window.addEventListener("load", applyScale);
  applyScale();
})();
