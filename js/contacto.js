/* =========================================================================
   SOMA · contacto.js
   Solo se carga en contacto.html
   1. Prellenado desde la URL (?asunto=compra&cantidad=2 viene de producto.html)
   2. Mostrar/ocultar el campo "cantidad" según el asunto
   3. Validación accesible en el cliente
   4. Estado de "mensaje enviado" + respaldo por correo (mailto)

   NOTA PARA PRODUCCIÓN: este formulario no tiene servidor. Para recibir los
   mensajes, conecta el atributo action del <form> a un servicio (Formspree,
   Netlify Forms, un endpoint propio, etc.) y reemplaza la función
   enviarFormulario() por un fetch() a ese servicio.
   ========================================================================= */
(function () {
  'use strict';

  var CORREO_SOMA = 'SOMAanahuac@gmail.com';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* Mensajes de error en lenguaje claro */
  var MENSAJES = {
    nombre:   'Escribe tu nombre para saber cómo llamarte.',
    correo:   'Revisa tu correo: debe verse como nombre@ejemplo.com.',
    asunto:   'Elige un motivo para dirigir tu mensaje.',
    cantidad: 'Indica cuántos mangos quieres (de 1 a 10).',
    mensaje:  'Cuéntanos un poco más (mínimo 10 caracteres).',
    acepto:   'Necesitamos tu autorización para responderte.'
  };

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('contact-form');
    if (!form) return;

    var success   = document.getElementById('form-success');
    var asunto    = form.elements.asunto;
    var qtyField  = document.getElementById('field-cantidad');
    var mailtoBtn = document.getElementById('mailto-fallback');
    var resetBtn  = document.getElementById('form-reset');

    /* ---------------------------------------------------------------------
       1. PRELLENADO DESDE LA URL
       --------------------------------------------------------------------- */
    var params = new URLSearchParams(window.location.search);
    if (params.get('asunto')) {
      var opt = asunto.querySelector('option[value="' + params.get('asunto') + '"]');
      if (opt) asunto.value = opt.value;
    }
    var cantParam = parseInt(params.get('cantidad'), 10);
    if (cantParam >= 1 && cantParam <= 10) form.elements.cantidad.value = cantParam;

    // Si viene de "Solicitar mi pedido", dejar el mensaje redactado con el color elegido
    var COLORES = ['Nogal', 'Olivo', 'Carbón'];
    var colorParam = COLORES.indexOf(params.get('color')) > -1 ? params.get('color') : '';
    if (asunto.value === 'compra' && !form.elements.mensaje.value) {
      var n = parseInt(form.elements.cantidad.value, 10) || 1;
      form.elements.mensaje.value = 'Hola, quiero ' + n + (n === 1 ? ' mango' : ' mangos') + ' SOMA' +
        (colorParam ? ' en color ' + colorParam.toLowerCase() : '') + '. ';
    }

    /* ---------------------------------------------------------------------
       2. CAMPO CANTIDAD SOLO PARA COMPRAS
       --------------------------------------------------------------------- */
    function syncQtyField() {
      var esCompra = asunto.value === 'compra';
      qtyField.hidden = !esCompra;
      form.elements.cantidad.required = esCompra;
      if (esCompra && !form.elements.mensaje.value) {
        form.elements.mensaje.placeholder = 'Ej. Quiero mi mango SOMA, vivo en Mérida y me interesa usarlo con cuchillo y pelador.';
      }
    }
    asunto.addEventListener('change', syncQtyField);
    syncQtyField();

    /* ---------------------------------------------------------------------
       3. VALIDACIÓN
       --------------------------------------------------------------------- */
    function validarCampo(campo) {
      var nombre = campo.name;
      var valor = campo.type === 'checkbox' ? campo.checked : campo.value.trim();
      var valido = true;

      switch (nombre) {
        case 'nombre':   valido = valor.length >= 2; break;
        case 'correo':   valido = EMAIL_RE.test(valor); break;
        case 'asunto':   valido = valor !== ''; break;
        case 'cantidad':
          if (qtyField.hidden) return true;
          var n = parseInt(valor, 10);
          valido = n >= 1 && n <= 10; break;
        case 'mensaje':  valido = valor.length >= 10; break;
        case 'acepto':   valido = valor === true; break;
        default: return true;
      }

      var error = document.getElementById('error-' + nombre);
      campo.setAttribute('aria-invalid', String(!valido));
      if (error) {
        error.textContent = valido ? '' : MENSAJES[nombre];
        error.classList.toggle('is-visible', !valido);
      }
      return valido;
    }

    // Validar al salir del campo y corregir en vivo si ya tenía error
    Array.prototype.forEach.call(form.elements, function (campo) {
      if (!campo.name) return;
      campo.addEventListener('blur', function () {
        if (campo.value || campo.type === 'checkbox') validarCampo(campo);
      });
      campo.addEventListener('input', function () {
        if (campo.getAttribute('aria-invalid') === 'true') validarCampo(campo);
      });
      campo.addEventListener('change', function () {
        if (campo.getAttribute('aria-invalid') === 'true') validarCampo(campo);
      });
    });

    /* ---------------------------------------------------------------------
       4. ENVÍO
       --------------------------------------------------------------------- */
    function construirMailto() {
      var f = form.elements;
      var asuntoTxt = f.asunto.options[f.asunto.selectedIndex].text;
      var cuerpo = 'Nombre: ' + f.nombre.value.trim() +
                   '\nCorreo: ' + f.correo.value.trim() +
                   (f.telefono.value.trim() ? '\nTeléfono: ' + f.telefono.value.trim() : '') +
                   (!qtyField.hidden ? '\nCantidad de mangos: ' + f.cantidad.value : '') +
                   '\n\n' + f.mensaje.value.trim();
      return 'mailto:' + CORREO_SOMA +
             '?subject=' + encodeURIComponent('SOMA · ' + asuntoTxt) +
             '&body=' + encodeURIComponent(cuerpo);
    }

    function enviarFormulario() {
      // Aquí iría el fetch() a tu servicio de formularios.
      // Por ahora simulamos el envío con una pequeña espera.
      return new Promise(function (resolve) { setTimeout(resolve, 700); });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var campos = Array.prototype.filter.call(form.elements, function (c) { return c.name; });
      var primerError = null;
      campos.forEach(function (c) {
        if (!validarCampo(c) && !primerError) primerError = c;
      });
      if (primerError) { primerError.focus(); return; }

      var boton = form.querySelector('[type="submit"]');
      var textoOriginal = boton.innerHTML;
      boton.disabled = true;
      boton.textContent = 'Enviando…';

      enviarFormulario().then(function () {
        mailtoBtn.href = construirMailto();
        document.getElementById('success-name').textContent = form.elements.nombre.value.trim().split(' ')[0];
        form.hidden = true;
        success.hidden = false;
        success.focus();
        boton.disabled = false;
        boton.innerHTML = textoOriginal;
      });
    });

    // Enviar otro mensaje
    resetBtn.addEventListener('click', function () {
      form.reset();
      Array.prototype.forEach.call(form.elements, function (c) { c.removeAttribute('aria-invalid'); });
      form.querySelectorAll('.field-error').forEach(function (el) { el.classList.remove('is-visible'); el.textContent = ''; });
      syncQtyField();
      success.hidden = true;
      form.hidden = false;
      form.elements.nombre.focus();
    });
  });
})();
