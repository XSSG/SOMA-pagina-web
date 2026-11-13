/* =========================================================================
   SOMA · interacciones.js
   Microinteracciones compartidas por todas las páginas:
   1. Barra de progreso de lectura
   2. Botón "volver arriba"
   3. Tarjetas con relieve 3D que siguen al cursor
   4. Botones de compra magnéticos
   5. Luz que sigue al cursor en secciones oscuras (+ imagotipo en movimiento)
   6. Títulos que aparecen palabra por palabra
   7. Pausa de animaciones fuera de pantalla
   Los efectos de movimiento se desactivan con prefers-reduced-motion,
   y los de cursor solo se activan con mouse (no en pantallas táctiles).
   ========================================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer  = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function (v, min, max) { return Math.max(min, Math.min(max, v)); };

  /* 1. BARRA DE PROGRESO ------------------------------------------------- */
  function initProgress() {
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    var pending = false;
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
      pending = false;
    }
    window.addEventListener('scroll', function () {
      if (!pending) { pending = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* 2. VOLVER ARRIBA ----------------------------------------------------- */
  function initBackToTop() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'to-top';
    btn.setAttribute('aria-label', 'Volver arriba');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
    document.body.appendChild(btn);

    var visible = false, pending = false;
    window.addEventListener('scroll', function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        var v = window.scrollY > 900;
        if (v !== visible) { visible = v; btn.classList.toggle('is-visible', v); }   // solo toca el DOM si cambia
        pending = false;
      });
    }, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      document.getElementById('main').focus({ preventScroll: true });
    });
  }

  /* 3. TARJETAS CON RELIEVE 3D -------------------------------------------
     Usa la propiedad 'rotate' (eje + ángulo) para no pisar 'transform',
     que ya usan las animaciones de aparición. */
  function initTilt() {
    if (reduceMotion || !finePointer) return;
    var MAX = 10; // grados

    document.querySelectorAll('.grid-3 > .card, .team-card, .mv-card, .fit-card, .value-row').forEach(function (el) {
      el.classList.add('tilt');
      if (el.parentElement) el.parentElement.style.perspective = '1100px';

      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        var ax = 0.5 - y, ay = x - 0.5;
        var ang = Math.hypot(ax, ay) * MAX * 1.4;
        el.style.rotate = ax.toFixed(3) + ' ' + ay.toFixed(3) + ' 0 ' + ang.toFixed(2) + 'deg';
        el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', function () { el.style.rotate = ''; });
    });
  }

  /* 4. BOTONES MAGNÉTICOS ------------------------------------------------ */
  function initMagnetic() {
    if (reduceMotion || !finePointer) return;
    document.querySelectorAll('.btn--cta').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = clamp((e.clientX - (r.left + r.width / 2)) * 0.2, -8, 8);
        var dy = clamp((e.clientY - (r.top + r.height / 2)) * 0.35, -6, 6);
        btn.style.translate = dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px';
      });
      btn.addEventListener('pointerleave', function () { btn.style.translate = ''; });
    });
  }

  /* 5. LUZ QUE SIGUE AL CURSOR ------------------------------------------- */
  function initSpotlight() {
    if (reduceMotion || !finePointer) return;
    document.querySelectorAll('.bg-carbon, .cta-band, .site-footer, .socials-card').forEach(function (sec) {
      sec.classList.add('spotlight');
      var logo = sec.querySelector('.cta-band__logo');
      sec.addEventListener('pointermove', function (e) {
        var r = sec.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        sec.style.setProperty('--sx', x + 'px');
        sec.style.setProperty('--sy', y + 'px');
        if (logo) {
          logo.style.translate = ((x / r.width - 0.5) * -36).toFixed(1) + 'px ' +
                                 ((y / r.height - 0.5) * -36).toFixed(1) + 'px';
        }
      });
    });
  }

  /* 6. TÍTULOS PALABRA POR PALABRA ---------------------------------------
     Envuelve cada palabra en <span class="w"> conservando etiquetas internas
     (<em>, <br>) y el texto para lectores de pantalla. */
  function splitWords(root) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var span = document.createElement('span');
            span.className = 'w';
            span.style.setProperty('--i', i++);
            span.textContent = part;
            frag.appendChild(span);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    })(root);
  }

  function initSplitHeadings() {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    var titles = document.querySelectorAll('.hero h1, .page-hero h1, .section-head h2, .cta-band h2, .buybox h1');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });

    titles.forEach(function (t) {
      splitWords(t);
      t.classList.add('split');
      io.observe(t);
    });
  }

  /* 7. PAUSAR ANIMACIONES FUERA DE PANTALLA (rendimiento) -------------- */
  function initPauseOffscreen() {
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('is-offscreen', !e.isIntersecting); });
    });
    document.querySelectorAll('.hero__visual, .about-intro__art, .anatomy__stage').forEach(function (el) { io.observe(el); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initPauseOffscreen();
    initProgress();
    initBackToTop();
    initSplitHeadings();
    initTilt();
    initMagnetic();
    initSpotlight();
  });
})();
