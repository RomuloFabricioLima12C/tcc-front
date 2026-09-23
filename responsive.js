/**
 * Faz a página (projetada para 1440px) ocupar toda a largura da tela,
 * em qualquer tamanho: o layout inteiro é escalado proporcionalmente
 * (reduz em telas menores, amplia em telas maiores) — sem alterar
 * posições, tamanhos ou proporções relativas de nada.
 */
(function () {
  var BASE_WIDTH = 1440;
  // Em telas maiores que 1440px a página nunca amplia além disso (evita o
  // efeito de "zoom gigante"); um pouco menos que 1 deixa tudo levemente
  // menor mesmo em monitores largos.
  var MAX_SCALE = 0.94;
  var root = document.body.firstElementChild;
  while (root && root.tagName === "SCRIPT") root = root.nextElementSibling;
  if (!root) return;

  // Header e rodapé: em vez de ficarem presos aos 1440px do "palco" (que é
  // escalado como um todo), recebem um contra-zoom para renderizar em
  // tamanho real e esticar até a borda de verdade da tela. O CSS de cada
  // página (".PAGE-CLASS > header" etc.) cuida do layout flexível interno;
  // aqui só calculamos a posição/escala necessárias.
  var headerEl = root.querySelector(":scope > header") || root.querySelector("header");
  var footerEl = root.querySelector(":scope > footer") || root.querySelector("footer");
  // Elementos decorativos que devem ficar grudados na borda esquerda ou
  // direita de verdade da tela (não só na borda dos 1440px), mantendo a
  // posição vertical e o tamanho já definidos no CSS da página.
  var leftCornerEls = root.querySelectorAll('[data-fluid-corner="left"]');
  var rightCornerEls = root.querySelectorAll('[data-fluid-corner="right"]');

  function positionFluidBar(el, scale, leftOffset, vw) {
    if (!el) return;
    el.style.position = "absolute";
    el.style.left = (-leftOffset / scale) + "px";
    el.style.width = vw + "px";
    el.style.transformOrigin = "top left";
    el.style.transform = "scale(" + (1 / scale) + ")";
  }

  function clearFluidBar(el) {
    if (!el) return;
    el.style.position = "";
    el.style.left = "";
    el.style.width = "";
    el.style.transformOrigin = "";
    el.style.transform = "";
  }

  function positionLeftCorner(el, scale, leftOffset) {
    el.style.position = "absolute";
    el.style.left = (-leftOffset / scale) + "px";
    el.style.transformOrigin = "top left";
    el.style.transform = "scale(" + (1 / scale) + ")";
  }

  function positionRightCorner(el, scale, leftOffset) {
    el.style.position = "absolute";
    el.style.left = "auto";
    el.style.right = (-leftOffset / scale) + "px";
    el.style.transformOrigin = "top right";
    el.style.transform = "scale(" + (1 / scale) + ")";
  }

  function clearLeftCorner(el) {
    el.style.position = "";
    el.style.left = "";
    el.style.transformOrigin = "";
    el.style.transform = "";
  }

  function clearRightCorner(el) {
    el.style.position = "";
    el.style.left = "";
    el.style.right = "";
    el.style.transformOrigin = "";
    el.style.transform = "";
  }

  function clearScale() {
    root.style.width = "";
    root.style.transformOrigin = "";
    root.style.transform = "";
    root.style.position = "";
    root.style.top = "";
    root.style.left = "";
    document.body.style.position = "";
    document.body.style.overflow = "";
    document.body.style.width = "";
    document.body.style.height = "";
    clearFluidBar(headerEl);
    clearFluidBar(footerEl);
    for (var i = 0; i < leftCornerEls.length; i++) clearLeftCorner(leftCornerEls[i]);
    for (var j = 0; j < rightCornerEls.length; j++) clearRightCorner(rightCornerEls[j]);
  }

  function fit() {
    var vw = document.documentElement.clientWidth;
    var scale = Math.min(vw / BASE_WIDTH, MAX_SCALE);
    var leftOffset = Math.max((vw - BASE_WIDTH * scale) / 2, 0);

    root.style.width = BASE_WIDTH + "px";
    root.style.transformOrigin = "top left";
    root.style.transform = "scale(" + scale + ")";
    root.style.position = "absolute";
    root.style.top = "0";
    root.style.left = leftOffset + "px";

    document.body.style.position = "relative";
    document.body.style.overflow = "hidden";
    document.body.style.width = "100%";
    document.body.style.height = root.offsetHeight * scale + "px";

    positionFluidBar(headerEl, scale, leftOffset, vw);
    positionFluidBar(footerEl, scale, leftOffset, vw);
    for (var i = 0; i < leftCornerEls.length; i++) positionLeftCorner(leftCornerEls[i], scale, leftOffset);
    for (var j = 0; j < rightCornerEls.length; j++) positionRightCorner(rightCornerEls[j], scale, leftOffset);
  }

  function applyScale() {
    // Celular/tablet (html.m-mode, ver mobile.js): layout fluido, sem escala.
    if (document.documentElement.classList.contains("m-mode")) {
      clearScale();
      return;
    }
    fit();
    // A barra de rolagem pode aparecer/sumir com a nova altura e mudar a
    // largura útil; um segundo ajuste evita cortar ou sobrar borda.
    fit();
  }

  window.addEventListener("resize", applyScale);
  window.addEventListener("orientationchange", applyScale);
  window.addEventListener("load", applyScale);
  document.addEventListener("DOMContentLoaded", applyScale);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(applyScale);
  applyScale();
})();
