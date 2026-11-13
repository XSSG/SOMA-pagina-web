/* =========================================================================
   SOMA · producto.js
   Solo se carga en producto.html
   1. Galería: miniaturas que cambian la imagen principal
   2. Selector de color sincronizado con la galería
   3. Selector de cantidad + total + enlace de pedido
   4. Color preseleccionado desde la URL (?color=)
   5. Anatomía interactiva · 6. Lupa
   ========================================================================= */
(function () {
  'use strict';

  /* Precio unitario oficial (Documento de Proyecto, sección "Punto de equilibrio") */
  var PRECIO_UNITARIO = 350;
  var CANTIDAD_MIN = 1;
  var CANTIDAD_MAX = 10;

  var currency = new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', maximumFractionDigits: 0
  });

  /* Estado compartido del pedido */
  var pedido = { cantidad: CANTIDAD_MIN, color: 'Nogal' };
  var renderPedido = function () {};   // se define en initQuantity()

  var main, mainImg, thumbs;

  /* -----------------------------------------------------------------------
     1. GALERÍA
     Cada miniatura es un <button data-src="ruta.webp" data-alt="texto">.
     Opcionales: data-color (enlaza con el selector de color),
                 data-fit="cover" (fotografía a sangre en vez de render).
     ----------------------------------------------------------------------- */
  function mostrar(thumb) {
    thumbs.forEach(function (t) { t.setAttribute('aria-pressed', String(t === thumb)); });

    var src = thumb.getAttribute('data-src');
    if (!src) return;

    // Transición suave al cambiar de imagen
    mainImg.classList.add('is-changing');
    var siguiente = new Image();
    siguiente.onload = function () {
      mainImg.src = src;
      mainImg.alt = thumb.getAttribute('data-alt') || '';
      mainImg.classList.remove('is-changing');
    };
    siguiente.src = src;

    main.classList.toggle('is-photo', thumb.getAttribute('data-fit') === 'cover');
    main.setAttribute('data-label', thumb.getAttribute('data-color') || thumb.getAttribute('data-label') || '');
  }

  function initGallery() {
    main = document.querySelector('[data-gallery-main]');
    thumbs = Array.prototype.slice.call(document.querySelectorAll('[data-gallery-thumb]'));
    if (!main || !thumbs.length) return;
    mainImg = main.querySelector('img');

    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        mostrar(thumb);
        // Si la miniatura es de un color, marcar también ese color
        var color = thumb.getAttribute('data-color');
        if (color) seleccionarColor(color, false);
      });
    });
  }

  /* -----------------------------------------------------------------------
     2. COLOR
     ----------------------------------------------------------------------- */
  function seleccionarColor(color, actualizarGaleria) {
    pedido.color = color;

    var radio = document.querySelector('input[name="color"][value="' + color + '"]');
    if (radio) radio.checked = true;

    var nombre = document.querySelector('[data-color-name]');
    if (nombre) nombre.textContent = color;

    if (actualizarGaleria && thumbs) {
      var thumb = thumbs.filter(function (t) { return t.getAttribute('data-color') === color; })[0];
      if (thumb) mostrar(thumb);
    }
    renderPedido();
  }

  function initColor() {
    document.querySelectorAll('input[name="color"]').forEach(function (radio) {
      radio.addEventListener('change', function () { seleccionarColor(radio.value, true); });
    });
  }

  /* -----------------------------------------------------------------------
     3. CANTIDAD Y TOTAL
     ----------------------------------------------------------------------- */
  function initQuantity() {
    var output = document.querySelector('[data-qty-output]');
    var minus  = document.querySelector('[data-qty="minus"]');
    var plus   = document.querySelector('[data-qty="plus"]');
    var total  = document.querySelector('[data-total]');
    var order  = document.querySelector('[data-order-link]');
    if (!output || !minus || !plus) return;

    renderPedido = function () {
      var qty = pedido.cantidad;
      output.value = qty;
      output.textContent = qty;
      minus.disabled = qty <= CANTIDAD_MIN;
      plus.disabled  = qty >= CANTIDAD_MAX;
      if (total) total.textContent = currency.format(qty * PRECIO_UNITARIO) + ' MXN';
      // El botón de pedido lleva cantidad y color al formulario de contacto
      if (order) {
        order.href = 'contacto.html?asunto=compra&cantidad=' + qty +
                     '&color=' + encodeURIComponent(pedido.color) + '#formulario';
      }
    };

    minus.addEventListener('click', function () {
      if (pedido.cantidad > CANTIDAD_MIN) { pedido.cantidad--; renderPedido(); }
    });
    plus.addEventListener('click', function () {
      if (pedido.cantidad < CANTIDAD_MAX) { pedido.cantidad++; renderPedido(); }
    });

    renderPedido();
  }

  /* -----------------------------------------------------------------------
     4. COLOR DESDE LA URL (viene del selector del hero: ?color=Olivo)
     ----------------------------------------------------------------------- */
  function initColorFromURL() {
    var color = new URLSearchParams(window.location.search).get('color');
    if (['Nogal', 'Olivo', 'Carbón'].indexOf(color) > -1) seleccionarColor(color, true);
  }

  /* -----------------------------------------------------------------------
     5. ANATOMÍA INTERACTIVA: marcador del render ↔ explicación de la lista
     ----------------------------------------------------------------------- */
  function initAnatomy() {
    var spots = document.querySelectorAll('.hotspot[data-part]');
    var items = document.querySelectorAll('.anatomy__list li[data-part]');
    if (!spots.length) return;

    function activar(part) {
      spots.forEach(function (s) { s.classList.toggle('is-active', s.getAttribute('data-part') === part); });
      items.forEach(function (li) { li.classList.toggle('is-active', li.getAttribute('data-part') === part); });
    }
    function limpiar() { activar(null); }

    spots.forEach(function (s) {
      var part = s.getAttribute('data-part');
      s.addEventListener('mouseenter', function () { activar(part); });
      s.addEventListener('focus', function () { activar(part); });
      s.addEventListener('click', function () { activar(part); });
      s.addEventListener('mouseleave', limpiar);
      s.addEventListener('blur', limpiar);
    });
    items.forEach(function (li) {
      var part = li.getAttribute('data-part');
      li.addEventListener('mouseenter', function () { activar(part); });
      li.addEventListener('mouseleave', limpiar);
    });
  }

  /* -----------------------------------------------------------------------
     6. LUPA: acerca el render donde está el cursor (solo con mouse)
     ----------------------------------------------------------------------- */
  function initZoom() {
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!main || !fine || reduce) return;

    main.classList.add('can-zoom');
    main.addEventListener('pointerenter', function () { main.classList.add('is-zoomed'); });
    main.addEventListener('pointerleave', function () {
      main.classList.remove('is-zoomed');
      mainImg.style.transformOrigin = '';
    });
    main.addEventListener('pointermove', function (e) {
      var r = main.getBoundingClientRect();
      mainImg.style.transformOrigin = ((e.clientX - r.left) / r.width * 100).toFixed(1) + '% ' +
                                      ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initGallery();
    initColor();
    initQuantity();
    initColorFromURL();
    initAnatomy();
    initZoom();
  });
})();
