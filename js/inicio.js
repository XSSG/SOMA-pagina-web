/* =========================================================================
   SOMA · inicio.js
   Solo se carga en index.html
   1. Selector de color del hero (cambia el render y el enlace de compra)
   2. Profundidad: el producto y las formas se mueven con el cursor
   ========================================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer  = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* 1. COLOR DEL HERO ----------------------------------------------------- */
  function initHeroColor() {
    var img = document.querySelector('.hero__product-img');
    var swatches = document.querySelectorAll('.hero-swatch');
    // Enlaces de compra que deben llevar el color elegido a producto.html
    var buyLinks = document.querySelectorAll('a[href^="producto.html#comprar"], a[data-color-link]');
    if (!img || !swatches.length) return;

    buyLinks.forEach(function (a) { a.setAttribute('data-color-link', ''); });

    swatches.forEach(function (sw) {
      sw.addEventListener('click', function () {
        swatches.forEach(function (s) { s.setAttribute('aria-pressed', String(s === sw)); });
        var color = sw.getAttribute('data-color');

        img.classList.add('is-changing');
        var next = new Image();
        next.onload = function () {
          img.src = next.src;
          img.alt = 'Mango ergonómico SOMA en color ' + color.toLowerCase();
          img.classList.remove('is-changing');
        };
        next.src = sw.getAttribute('data-src');

        buyLinks.forEach(function (a) {
          a.href = 'producto.html?color=' + encodeURIComponent(color) + '#comprar';
        });
      });
    });
  }

  /* 2. PROFUNDIDAD CON EL CURSOR ----------------------------------------- */
  function initHeroDepth() {
    if (reduceMotion || !finePointer) return;
    var visual = document.querySelector('.hero__visual');
    if (!visual) return;
    var img = visual.querySelector('.hero__product-img');
    var pebbles = visual.querySelectorAll('.hero__pebble');

    visual.addEventListener('pointermove', function (e) {
      var r = visual.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      img.style.translate = (x * 26).toFixed(1) + 'px ' + (y * 22).toFixed(1) + 'px';
      pebbles.forEach(function (p, i) {
        var k = i === 0 ? -14 : -24;
        p.style.translate = (x * k).toFixed(1) + 'px ' + (y * k).toFixed(1) + 'px';
      });
    });
    visual.addEventListener('pointerleave', function () {
      img.style.translate = '';
      pebbles.forEach(function (p) { p.style.translate = ''; });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeroColor();
    initHeroDepth();
  });
})();
