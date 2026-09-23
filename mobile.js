/**
 * Modo mobile (telas até 900px): liga a classe "m-mode" no <html>, cria o
 * botão de menu hambúrguer e leva o botão de tema para dentro do cabeçalho.
 * Em telas maiores nada disso aparece e a página continua igual ao desktop.
 */
(function () {
  var BREAKPOINT = 900;
  var html = document.documentElement;
  var TOGGLE_SRC = "plano-de-neg-cios--4--1.png";
  var state = { header: null, toggle: null, burger: null, home: null };

  function isMobile() {
    return (html.clientWidth || window.innerWidth) <= BREAKPOINT;
  }

  function syncClass() {
    html.classList.toggle("m-mode", isMobile());
  }

  // Aplica antes da primeira pintura, para não "piscar" o layout desktop.
  syncClass();

  function findToggle() {
    var img = document.getElementById("theme-toggle") ||
      document.querySelector('img[src$="' + TOGGLE_SRC + '"], img[data-light-src$="' + TOGGLE_SRC + '"]');
    if (!img) return null;
    var btn = img.closest("button");
    return btn || img;
  }

  function closeMenu() {
    if (!state.header) return;
    state.header.classList.remove("m-open");
    if (state.burger) {
      state.burger.setAttribute("aria-expanded", "false");
      state.burger.setAttribute("aria-label", "Abrir menu");
    }
  }

  function openOrClose() {
    var open = !state.header.classList.contains("m-open");
    state.header.classList.toggle("m-open", open);
    state.burger.setAttribute("aria-expanded", open ? "true" : "false");
    state.burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  }

  function tagHeader(header, toggle) {
    var logoImg = header.querySelector('img[alt*="ogo"]');
    var logo = null;
    if (logoImg) {
      logo = logoImg.parentElement.tagName === "A" && logoImg.parentElement.parentElement === header
        ? logoImg.parentElement : logoImg;
      logo.classList.add("m-logo");
    }

    var kids = Array.prototype.slice.call(header.children);
    kids.forEach(function (el) {
      if (el.tagName === "NAV") {
        el.classList.add("m-nav");
        Array.prototype.slice.call(el.children).forEach(tagItem);
      } else {
        tagItem(el);
      }
    });

    function tagItem(el) {
      if (el === logo || el === toggle || el.contains(toggle) || el.classList.contains("m-burger")) return;
      if (logo && el.contains(logo)) return;
      el.classList.add("m-item");
      if (/login/i.test(el.textContent || "") && el.tagName !== "FORM") el.classList.add("m-login");
    }

    if (toggle) toggle.classList.add("m-toggle");
  }

  function placeToggle() {
    var toggle = state.toggle, header = state.header;
    if (!toggle || !header) return;
    var mobile = html.classList.contains("m-mode");
    if (mobile && !header.contains(toggle)) {
      state.home = { parent: toggle.parentNode, next: toggle.nextSibling };
      header.insertBefore(toggle, state.burger);
    } else if (!mobile && state.home && header.contains(toggle) && state.home.parent !== header) {
      state.home.parent.insertBefore(toggle, state.home.next);
      state.home = null;
    }
  }

  function build() {
    var header = document.querySelector("header");
    var toggle = findToggle();
    state.header = header;
    state.toggle = toggle;

    var toggleImg = toggle && (toggle.tagName === "IMG" ? toggle : toggle.querySelector("img"));
    if (toggleImg) {
      toggleImg.setAttribute("alt", "Alternar modo escuro");
      toggleImg.removeAttribute("aria-hidden");
    }

    if (toggle) toggle.classList.add("m-toggle");

    if (header) {
      var burger = document.createElement("button");
      burger.type = "button";
      burger.className = "m-burger";
      burger.setAttribute("aria-label", "Abrir menu");
      burger.setAttribute("aria-expanded", "false");
      burger.innerHTML = "<span></span><span></span><span></span>";
      burger.addEventListener("click", openOrClose);
      header.appendChild(burger);
      state.burger = burger;

      tagHeader(header, toggle);

      header.addEventListener("click", function (e) {
        var a = e.target.closest && e.target.closest("a");
        if (a && a.classList.contains("m-item")) closeMenu();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeMenu();
      });
    }

    placeToggle();
  }

  function onResize() {
    syncClass();
    if (!html.classList.contains("m-mode")) closeMenu();
    placeToggle();
  }

  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", onResize);
  document.addEventListener("DOMContentLoaded", build);
})();
