/* =========================================================================
   SOMA · main.js
   Comportamiento compartido por todas las páginas:
   1. Menú móvil accesible
   2. Sombra del header al hacer scroll
   3. Animaciones de aparición (reveal) y barras de progreso
   4. Contadores animados de cifras
   5. Año automático en el footer
   ========================================================================= */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -----------------------------------------------------------------------
     1. MENÚ MÓVIL
     ----------------------------------------------------------------------- */
  function initMobileNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      nav.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Cerrar con Escape y devolver el foco al botón
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Cerrar al elegir un enlace
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    // Si la ventana crece a escritorio, restablecer estado
    window.matchMedia('(min-width: 901px)').addEventListener('change', function (mq) {
      if (mq.matches) setOpen(false);
    });
  }

  /* -----------------------------------------------------------------------
     2. HEADER CON SOMBRA AL HACER SCROLL
     ----------------------------------------------------------------------- */
  function initHeaderShadow() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var scrolled = null, pending = false;
    var update = function () {
      var v = window.scrollY > 8;
      if (v !== scrolled) { scrolled = v; header.classList.toggle('is-scrolled', v); }
      pending = false;
    };
    update();
    window.addEventListener('scroll', function () {
      if (!pending) { pending = true; requestAnimationFrame(update); }
    }, { passive: true });
  }

  /* -----------------------------------------------------------------------
     3. REVEAL AL HACER SCROLL (+ barras de progreso .bar)
     ----------------------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal, .bar');
    if (!items.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    // threshold 0 + margen inferior: funciona también con bloques más altos que la pantalla
    }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* -----------------------------------------------------------------------
     4. CONTADORES ANIMADOS
     Uso en HTML: <span data-count="530">530</span>
     El número final ya está escrito en el HTML (accesible sin JS).
     ----------------------------------------------------------------------- */
  function initCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length || prefersReducedMotion || !('IntersectionObserver' in window)) return;

    var format = new Intl.NumberFormat('es-MX');

    function animate(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var duration = 1600;
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);       // easeOutCubic
        el.textContent = format.format(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });

    counters.forEach(function (el) {
      el.textContent = '0';
      observer.observe(el);
    });
  }

  /* -----------------------------------------------------------------------
     5. AÑO ACTUAL EN EL FOOTER
     ----------------------------------------------------------------------- */
  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* Arranque */
  document.addEventListener('DOMContentLoaded', function () {
    initMobileNav();
    initHeaderShadow();
    initReveal();
    initCounters();
    initYear();
  });
})();
