/* LUNIX · Animaciones de Aprender: respuesta correcta, error, vidas, XP y resultado.
   No cambia la lógica de aprender.js: solo observa lo que ya ocurre en pantalla. */
(function () {
  'use strict';
  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COLORES = ['#F238FF', '#F40898', '#FF3222', '#FFA424', '#FFE600', '#93FF24', '#3396FF', '#8450FF'];

  /* ---------- Confeti ---------- */
  function confeti(x, y, cantidad, fuerza) {
    if (reducido || !document.body.animate) return;
    cantidad = cantidad || 26; fuerza = fuerza || 1;
    for (var i = 0; i < cantidad; i++) {
      var p = document.createElement('i');
      var tam = 6 + Math.random() * 7;
      p.style.cssText = 'position:fixed;z-index:99999;pointer-events:none;left:' + x + 'px;top:' + y + 'px;width:' + tam + 'px;height:' + (tam * (Math.random() < .5 ? 1 : .45)) + 'px;border-radius:' + (Math.random() < .4 ? '50%' : '2px') + ';background:' + COLORES[i % COLORES.length];
      document.body.appendChild(p);
      var ang = Math.random() * Math.PI * 2, dist = (80 + Math.random() * 150) * fuerza;
      var dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 60 * fuerza;
      var anim = p.animate([
        { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (Math.random() * 540 - 270) + 'deg) scale(1)', opacity: 1, offset: .55 },
        { transform: 'translate(' + dx * 1.15 + 'px,' + (dy + 150) + 'px) rotate(' + (Math.random() * 720 - 360) + 'deg) scale(.6)', opacity: 0 }
      ], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.3,1)' });
      anim.onfinish = (function (el) { return function () { el.remove(); }; })(p);
    }
  }
  /* Texto flotante (“¡Correcto!”) */
  function flotante(texto, x, y, color) {
    if (!document.body.animate) return;
    var t = document.createElement('div');
    t.textContent = texto;
    t.style.cssText = 'position:fixed;z-index:99999;pointer-events:none;left:' + x + 'px;top:' + y + 'px;transform:translate(-50%,0);font:900 clamp(22px,2.4vw,34px) Montserrat,sans-serif;color:' + color + ';text-shadow:0 2px 0 #000,0 0 14px ' + color;
    document.body.appendChild(t);
    var a = t.animate([{ transform: 'translate(-50%,0) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-26px) scale(1.15)', opacity: 1, offset: .25 }, { transform: 'translate(-50%,-80px) scale(1)', opacity: 0 }], { duration: 1100, easing: 'ease-out' });
    a.onfinish = function () { t.remove(); };
  }
  function centro(el) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }

  /* ---------- Respuesta correcta / incorrecta ---------- */
  var contenido = document.getElementById('contenido');
  function revisarRespuesta() {
    var feed = document.getElementById('feed');
    if (!feed || feed.dataset.listo || !feed.textContent.trim()) return;
    feed.dataset.listo = '1';
    var acerto = feed.textContent.trim().charAt(0) === '✓';
    feed.classList.add(acerto ? 'ok' : 'mal');
    var botones = document.querySelectorAll('.answer');
    var buena = document.querySelector('.answer.correct');
    var mala = document.querySelector('.answer.wrong');
    document.querySelectorAll('.answer').forEach(function (b) { if (!b.classList.contains('correct') && !b.classList.contains('wrong')) b.classList.add('apagada'); });
    if (acerto && buena) {
      var c = centro(buena);
      confeti(c.x, c.y, 28, 1);
      flotante('¡Correcto!', c.x, c.y - 10, '#7CFF6B');
    } else if (mala) {
      var m = centro(mala);
      flotante('Casi…', m.x, m.y - 10, '#FF7A6A');
    }
  }
  if (contenido) {
    new MutationObserver(function () {
      revisarRespuesta();
      revisarResultado();
    }).observe(contenido, { childList: true, subtree: true, characterData: true });
  }

  /* ---------- Resultado final de la lección ---------- */
  function revisarResultado() {
    var r = contenido && contenido.querySelector('.result');
    if (!r || r.dataset.listo) return;
    r.dataset.listo = '1';
    var trofeo = r.querySelector('strong');
    if (trofeo && trofeo.textContent.indexOf('🏆') >= 0) {
      var c = centro(trofeo);
      confeti(c.x, c.y, 60, 1.6);
      setTimeout(function () { confeti(c.x - 60, c.y, 30, 1.1); confeti(c.x + 60, c.y, 30, 1.1); }, 350);
    }
  }

  /* ---------- Marcadores de arriba (racha, XP, vidas) ---------- */
  ['racha', 'xp', 'vidas'].forEach(function (id) {
    var el = document.getElementById(id); if (!el) return;
    var caja = el.parentElement, previo = el.textContent;
    new MutationObserver(function () {
      var ahora = el.textContent; if (ahora === previo) return;
      var subio = Number(ahora) > Number(previo);
      previo = ahora;
      caja.classList.remove('sube', 'baja'); void caja.offsetWidth;
      caja.classList.add(subio ? 'sube' : 'baja');
      if (id !== 'vidas' && subio && !reducido) { var c = centro(caja); confeti(c.x, c.y + 10, 12, .5); }
    }).observe(el, { childList: true, characterData: true, subtree: true });
  });

  /* ---------- Lección completada en el camino ---------- */
  var ruta = document.getElementById('ruta');
  if (ruta) {
    var hechas = ruta.querySelectorAll('.lesson.done').length;
    new MutationObserver(function () {
      var ahora = ruta.querySelectorAll('.lesson.done').length;
      if (ahora > hechas) {
        var nuevas = ruta.querySelectorAll('.lesson.done');
        var ultima = nuevas[nuevas.length - 1];
        if (ultima) { ultima.classList.add('recien'); }
      }
      hechas = ahora;
    }).observe(ruta, { childList: true });
  }
})();
