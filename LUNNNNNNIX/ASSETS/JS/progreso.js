/* LUNIX · Progreso compartido (racha diaria, XP y lecciones)
   - Usa la fecha LOCAL (antes usaba UTC y en Colombia la racha se reiniciaba por las noches).
   - Guarda en localStorage y deja una copia en una cookie por si el navegador borra el almacenamiento.
   - Permite copiar un "código de progreso" para pasarlo a otro dispositivo o navegador. */
(function () {
  'use strict';
  var K = 'LU_APRENDER_V1';
  var NUEVO = function () { return { xp: 0, vidas: 5, racha: 0, last: null, done: {}, daily: 0 }; };

  function hoy() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function dias(a, b) {
    var p = function (x) { var q = x.split('-'); return Date.UTC(+q[0], +q[1] - 1, +q[2]); };
    return Math.round((p(b) - p(a)) / 86400000);
  }
  function leerLS() { try { return JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) { return null; } }
  function cookieGet() {
    var m = document.cookie.match(/(?:^|; )LU_BK=([^;]*)/);
    if (!m) return null;
    try { return JSON.parse(decodeURIComponent(m[1])); } catch (e) { return null; }
  }
  function cookieSet(s) {
    try {
      var v = encodeURIComponent(JSON.stringify({ xp: s.xp, racha: s.racha, last: s.last, done: s.done }));
      document.cookie = 'LU_BK=' + v + '; max-age=' + (60 * 60 * 24 * 400) + '; path=/; SameSite=Lax';
    } catch (e) {}
  }

  function leer() {
    var s = leerLS();
    var c = cookieGet();
    if (!s && c) { s = NUEVO(); s.xp = c.xp || 0; s.racha = c.racha || 0; s.last = c.last || null; s.done = c.done || {}; }
    s = s || NUEVO();
    // si el almacenamiento principal quedó atrás de la copia, nos quedamos con lo más avanzado
    if (c && c.last && (!s.last || dias(s.last, c.last) > 0)) { s.racha = c.racha; s.last = c.last; s.xp = Math.max(s.xp, c.xp || 0); s.done = Object.assign({}, c.done || {}, s.done); }
    return s;
  }
  function guardar(s) {
    try { localStorage.setItem(K, JSON.stringify(s)); } catch (e) {}
    cookieSet(s);
  }

  /* Marca el día de hoy como activo y actualiza la racha. Devuelve true si cambió. */
  function tocarRacha(s) {
    var h = hoy();
    if (s.last === h) return false;
    if (s.last) {
      var n = dias(s.last, h);
      if (n === 1) s.racha = (s.racha || 0) + 1;
      else if (n > 1) s.racha = 1;          // se saltó al menos un día completo
      else return false;                      // reloj atrasado: no tocar
    } else s.racha = 1;
    s.last = h;
    s.daily = 0;                              // la misión del día vuelve a empezar
    return true;
  }
  /* Racha que se muestra sin modificar nada (si ya pasó más de un día, se ve en 0) */
  function rachaActual() {
    var s = leer();
    if (!s.last) return 0;
    var n = dias(s.last, hoy());
    return n <= 1 ? (s.racha || 0) : 0;
  }
  /* Registrar actividad (por ejemplo al terminar un juego) */
  function registrarActividad() {
    var s = leer();
    if (tocarRacha(s)) guardar(s);
    return s.racha;
  }

  function exportar() {
    var s = leer();
    return btoa(unescape(encodeURIComponent(JSON.stringify(s))));
  }
  function importar(codigo) {
    try {
      var s = JSON.parse(decodeURIComponent(escape(atob(String(codigo).trim()))));
      if (typeof s !== 'object' || s === null || typeof s.xp !== 'number') return false;
      guardar(Object.assign(NUEVO(), s));
      return true;
    } catch (e) { return false; }
  }

  window.LUPROGRESO = { leer: leer, guardar: guardar, tocarRacha: tocarRacha, rachaActual: rachaActual,
                        registrarActividad: registrarActividad, exportar: exportar, importar: importar, hoy: hoy };
})();
