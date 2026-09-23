/**
 * Modo escuro em todas as páginas: o botão (imagem do toggle) alterna o tema
 * e a escolha fica salva no navegador (vale para o site inteiro).
 * As cores ficam em dark.css / dark-pages.css; aqui só trocamos o atributo
 * data-theme e as imagens que têm versão escura em img-dark/.
 */
(function () {
  var KEY = "lightlab-theme";
  var html = document.documentElement;
  var TOGGLE_IMG = "plano-de-neg-cios--4--1.png";
  var DARK_FILES = [
    "mrgj3czu54NvAd__illustration-1.png",
    "mrgj3czu54NvAd__illustration.png",
    "mrgj3czu54NvAd__plano-de-neg-cios--3--1.png",
    "mrgj3czu54NvAd__plano-de-neg-cios--3--2-1.png",
    "mrgj3czu54NvAd__plano-de-neg-cios--3--2-2.png",
    "mrgj3czu54NvAd__plano-de-neg-cios--3--2-3.png",
    "mrgj3czu54NvAd__plano-de-neg-cios--3--2-4.png",
    "mrgj3czu54NvAd__plano-de-neg-cios--3--2-5.png",
    "mrgj3czu54NvAd__plano-de-neg-cios--3--2.png",
    "mrgj3czu54NvAd__plano-de-neg-cios--8--1.png",
    "mrgj3czu54NvAd__plano-de-neg-cios--8--2.png",
    "mrgj3czu54NvAd__plano-de-neg-cios-2.png",
    "mrgj3czu54NvAd__vector.svg",
    "mrgqcvt387LVJy__line-3.svg",
    "mrgqcvt387LVJy__plano-de-neg-cios--8--2.png",
    "mrgqcvt387LVJy__plano-de-neg-cios-2.png",
    "mrgqcvt387LVJy__star-2.svg",
    "mrktvmqrQkyNOj__line-3.svg",
    "mrktvmqrQkyNOj__plano-de-neg-cios--3--2-1.png",
    "mrktvmqrQkyNOj__plano-de-neg-cios--3--2-2.png",
    "mrktvmqrQkyNOj__plano-de-neg-cios--3--2-3.png",
    "mrktvmqrQkyNOj__plano-de-neg-cios--3--2-4.png",
    "mrktvmqrQkyNOj__plano-de-neg-cios--3--2-5.png",
    "mrktvmqrQkyNOj__plano-de-neg-cios--3--2.png",
    "mrktvmqrQkyNOj__plano-de-neg-cios--8--1.png",
    "mrktvmqrQkyNOj__plano-de-neg-cios-2.png",
    "mrm98bh2vekyJY__design-sem-nome--10--1.png",
    "mrm98bh2vekyJY__design-sem-nome--3--1.png",
    "mrm98bh2vekyJY__plano-de-neg-cios--3--2-1.png",
    "mrm98bh2vekyJY__plano-de-neg-cios--3--2.png",
    "mrm98bh2vekyJY__plano-de-neg-cios--8--1.png",
    "mrm98bh2vekyJY__plano-de-neg-cios-2.png",
    "mrmd7l3ygAyqPM__group-39.png",
    "mrmd7l3ygAyqPM__illustration.png",
    "mrmd7l3ygAyqPM__plano-de-neg-cios--24--1.png",
    "mrmd7l3ygAyqPM__plano-de-neg-cios--26--1.png",
    "mrmd7l3ygAyqPM__plano-de-neg-cios--3--2-1.png",
    "mrmd7l3ygAyqPM__plano-de-neg-cios--3--2-2.png",
    "mrmd7l3ygAyqPM__plano-de-neg-cios--3--2-3.png",
    "mrmd7l3ygAyqPM__plano-de-neg-cios--3--2.png",
    "mrmd7l3ygAyqPM__plano-de-neg-cios--8--1.png",
    "mrmd7l3ygAyqPM__plano-de-neg-cios-2.png",
    "mrmf894c6D0QtZ__plano-de-neg-cios--3--2-1.png",
    "mrmf894c6D0QtZ__plano-de-neg-cios--3--2.png",
    "mrmf894c6D0QtZ__plano-de-neg-cios--8--1.png",
    "mrmf894c6D0QtZ__plano-de-neg-cios-2.png",
    "mrmf894c6D0QtZ__star-2.svg",
    "mrp1212w8ZbBMm__plano-de-neg-cios-2.png",
    "mrp1212w8ZbBMm__plano-de-neg-cios-4.png"
  ];

  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function save(theme) {
    try { localStorage.setItem(KEY, theme); } catch (e) {}
  }

  // Ex.: https://c.animaapp.com/<id>/img/<nome> -> "<id>__<nome>"
  function keyOf(src) {
    var m = /animaapp\.com\/([^/]+)\/img\/([^/?#]+)/.exec(src || "");
    return m ? m[1] + "__" + m[2] : null;
  }

  function swapImages(dark) {
    var imgs = document.querySelectorAll("img");
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      if (!img.dataset.lightSrc) {
        var src = img.getAttribute("src") || "";
        var key = keyOf(src);
        if (!key) continue;
        if (src.split("/").pop() === TOGGLE_IMG) img.dataset.darkSrc = "img-dark/toggle.svg";
        else if (DARK_FILES.indexOf(key) !== -1) img.dataset.darkSrc = "img-dark/" + key;
        else continue;
        img.dataset.lightSrc = src;
      }
      img.setAttribute("src", dark ? img.dataset.darkSrc : img.dataset.lightSrc);
    }
  }

  function toggleEl() {
    return document.getElementById("theme-toggle") ||
      document.querySelector('img[src$="' + TOGGLE_IMG + '"], img[data-light-src$="' + TOGGLE_IMG + '"]');
  }

  function apply(theme) {
    var dark = theme === "dark";
    html.setAttribute("data-theme", dark ? "dark" : "light");
    if (!document.body) return;
    swapImages(dark);
    var t = toggleEl();
    if (t) t.setAttribute("aria-pressed", dark ? "true" : "false");
  }

  // Aplica cedo (sem "piscar" de tema claro) e de novo quando o DOM existir.
  apply(saved() === "dark" ? "dark" : "light");

  document.addEventListener("DOMContentLoaded", function () {
    apply(html.getAttribute("data-theme"));

    var toggle = toggleEl();
    if (!toggle) return;
    toggle.id = "theme-toggle";
    toggle.setAttribute("role", "button");
    toggle.setAttribute("tabindex", "0");
    toggle.setAttribute("aria-label", "Alternar modo escuro");
    toggle.style.cursor = "pointer";

    function flip() {
      var next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
      save(next);
      apply(next);
    }

    toggle.addEventListener("click", flip);
    toggle.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        flip();
      }
    });
  });

  // Mantém várias abas/páginas abertas em sincronia.
  window.addEventListener("storage", function (e) {
    if (e.key === KEY) apply(e.newValue === "dark" ? "dark" : "light");
  });
})();
