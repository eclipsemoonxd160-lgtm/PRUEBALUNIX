/* LUNIX · Juegos de los cinco mundos
   Cada juego es una función que dibuja dentro de la ventana (modal).
   Todos usan la misma "api": vidas(), puntos(), fin(). */
(function () {
  'use strict';

  // ---------- Elementos de la ventana ----------
  var gm = document.getElementById('gm');
  var ventana = gm.querySelector('.gm-ventana');
  var tituloEl = document.getElementById('gmTitulo');
  var ayudaEl = document.getElementById('gmAyuda');
  var vidasEl = document.getElementById('gmVidas');
  var puntosEl = document.getElementById('gmPuntos');
  var escena = document.getElementById('gmEscena');
  var limpieza = null;      // función que apaga el juego actual
  var claveActual = null;

  // ---------- Ayudas generales ----------
  // "sesion" cambia cada vez que se abre, reinicia o cierra un juego.
  // esperar() es como setTimeout pero se cancela solo si el juego ya terminó o se cerró.
  // La fuente Montserrat se carga antes de dibujar texto en los canvas
  if (document.fonts && document.fonts.load) { ['900 20px Montserrat','800 20px Montserrat','700 16px Montserrat'].forEach(function (f) { document.fonts.load(f); }); }
  var sesion = 0;
  var pausado = false;      // true mientras hay pantalla de inicio, cuenta regresiva o pausa
  var estado = 'fin';       // 'intro' | 'cuenta' | 'juego' | 'pausa' | 'fin'
  var pausaEl = document.getElementById('gmPausa');
  // Puntaje para 1, 2 y 3 estrellas en cada juego
  var ESTRELLAS = {
    marina: [100, 250, 450], marina2: [100, 250, 450], cosmetologia: [150, 350, 600], cosmetologia2: [200, 320, 420],
    mecanica: [300, 480, 580], mecanica2: [200, 450, 800], arte: [250, 400, 520], arte2: [150, 300, 500],
    realeza: [150, 350, 600], realeza2: [150, 350, 600]
  };
  function esperar(fn, ms) {
    var mia = sesion;
    window.setTimeout(function () { if (mia === sesion) fn(); }, ms);
  }
  function elegir(lista) { return lista[Math.floor(Math.random() * lista.length)]; }
  function aleatorio(a, b) { return a + Math.random() * (b - a); }

  function crearCanvas() {
    var c = document.createElement('canvas');
    c.width = 800; c.height = 500; c.className = 'gm-canvas';
    escena.appendChild(c);
    return c;
  }
  // Convierte la posición del mouse/dedo a coordenadas del canvas (800x500)
  function posicion(c, e) {
    var r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * c.width / r.width, y: (e.clientY - r.top) * c.height / r.height };
  }
  // Bucle de animación: llama a fn(dt) ~60 veces por segundo. Devuelve cómo detenerlo.
  function bucle(fn) {
    var activo = true, id, ultimo = performance.now();
    function paso(t) {
      if (!activo) return;
      if (pausado) { ultimo = t; id = requestAnimationFrame(paso); return; }
      var dt = Math.min(0.05, (t - ultimo) / 1000);
      ultimo = t; fn(dt);
      id = requestAnimationFrame(paso);
    }
    id = requestAnimationFrame(paso);
    return function () { activo = false; cancelAnimationFrame(id); };
  }
  function guardarMejor(clave, pts) {
    var mejor = 0;
    try {
      mejor = Number(localStorage.getItem('lunix-mejor-' + clave)) || 0;
      if (pts > mejor) { mejor = pts; localStorage.setItem('lunix-mejor-' + clave, String(pts)); }
    } catch (e) { /* si el navegador bloquea el guardado, seguimos igual */ }
    mostrarMejores();
    return mejor;
  }
  function mostrarRacha() {
    var el = document.getElementById('rachaJuegos'); if (!el || !window.LUPROGRESO) return;
    var n = LUPROGRESO.rachaActual();
    el.textContent = n;
    var t = document.getElementById('rachaTxt'); if (t) t.textContent = n === 1 ? 'día' : 'días';
  }
  function mostrarMejores() {
    document.querySelectorAll('[data-mejor]').forEach(function (el) {
      var v = 0;
      try { v = Number(localStorage.getItem('lunix-mejor-' + el.dataset.mejor)) || 0; } catch (e) {}
      el.textContent = v ? '🏆 Mejor: ' + v : '';
    });
  }


  // ---------- Sonido (pequeños bips con WebAudio, sin archivos) ----------
  var audioCtx = null, sonidoOn = true;
  try { sonidoOn = localStorage.getItem('lunix-sonido') !== 'no'; } catch (e) {}
  function bip(tipo) {
    if (!sonidoOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var notas = { ok: [660, 880], mal: [220, 150], gana: [523, 659, 784, 1046], vida: [300, 200] }[tipo] || [440];
      notas.forEach(function (f, i) {
        var o = audioCtx.createOscillator(), g = audioCtx.createGain(), t = audioCtx.currentTime + i * 0.09;
        o.type = tipo === 'mal' || tipo === 'vida' ? 'sawtooth' : 'triangle';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t + 0.18);
      });
    } catch (e) { /* sin sonido, el juego sigue */ }
  }

  // ---------- Objetos MUY visibles ----------
  // Dibuja un emoji grande con un disco claro detrás y un resplandor de color.
  function objeto(x, emoji, px, py, tam, color) {
    x.save();
    x.shadowColor = color || '#ffffff'; x.shadowBlur = 22;
    x.fillStyle = 'rgba(255,255,255,.88)';
    x.beginPath(); x.arc(px, py, tam * 0.66, 0, 7); x.fill();
    x.shadowBlur = 0;
    x.lineWidth = 4; x.strokeStyle = color || '#ffffff';
    x.beginPath(); x.arc(px, py, tam * 0.66, 0, 7); x.stroke();
    x.font = tam + 'px serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(emoji, px, py + tam * 0.04);
    x.restore();
  }
  // Chispas al acertar o fallar
  function chispas(lista, px, py, color) {
    for (var i = 0; i < 14; i++) {
      var a = Math.random() * 6.283, v = aleatorio(80, 240);
      lista.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: aleatorio(0.4, 0.8), c: color, r: aleatorio(3, 6) });
    }
  }
  function moverChispas(lista, dt) {
    lista.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.t -= dt; });
    return lista.filter(function (p) { return p.t > 0; });
  }
  function dibujarChispas(x, lista) {
    lista.forEach(function (p) {
      x.globalAlpha = Math.min(1, p.t * 2); x.fillStyle = p.c;
      x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill();
    });
    x.globalAlpha = 1;
  }
  // Texto flotante con borde negro (se lee sobre cualquier fondo)
  function textoFlotante(x, f) {
    x.globalAlpha = Math.min(1, f.t); x.font = '900 28px Montserrat, sans-serif';
    x.lineWidth = 6; x.strokeStyle = '#000'; x.strokeText(f.txt, f.x, f.y);
    x.fillStyle = f.col; x.fillText(f.txt, f.x, f.y); x.globalAlpha = 1;
  }

  // ---------- API que reciben los juegos ----------
  var api = {
    vidas: function (n, max) {
      if (n === null) { vidasEl.textContent = ''; return; }
      vidasEl.textContent = '❤️'.repeat(Math.max(0, n)) + '🖤'.repeat(Math.max(0, max - n));
    },
    puntos: function (n, etiqueta) { puntosEl.textContent = (etiqueta || '⭐') + ' ' + n; },
    fin: function (titulo, texto, pts) {
      var antes = 0;
      try { antes = Number(localStorage.getItem('lunix-mejor-' + claveActual)) || 0; } catch (e) {}
      var mejor = guardarMejor(claveActual, pts);
      var umbral = ESTRELLAS[claveActual] || [100, 250, 450];
      var est = pts >= umbral[2] ? 3 : (pts >= umbral[1] ? 2 : (pts >= umbral[0] ? 1 : 0));
      var nuevoRecord = pts > antes && pts > 0;
      estado = 'fin'; pausado = false;
      try { window.LUPROGRESO && LUPROGRESO.registrarActividad(); } catch (e) {}
      mostrarRacha();
      bip(pts > 0 ? 'gana' : 'mal');
      var d = document.createElement('div');
      d.className = 'gm-fin';
      d.innerHTML = '<h3></h3><div class="gm-estrellas"></div><div class="gm-record"></div><div class="gm-puntos-final"></div><p></p><p class="mejor"></p>' +
        '<div><button id="gmOtra">↻ Jugar otra vez</button> <button id="gmSalir">Cerrar</button></div>';
      d.querySelector('h3').textContent = titulo;
      d.querySelector('.gm-estrellas').textContent = '★'.repeat(est) + '☆'.repeat(3 - est);
      d.querySelector('.gm-record').textContent = nuevoRecord ? '🎉 ¡Nuevo récord!' : '';
      d.querySelector('.gm-puntos-final').textContent = '⭐ ' + pts;
      d.querySelectorAll('p')[0].textContent = texto;
      d.querySelector('.mejor').textContent = '🏆 Mejor puntaje: ' + mejor;
      escena.appendChild(d);
      d.querySelector('#gmOtra').onclick = function () { iniciar(claveActual); };
      d.querySelector('#gmSalir').onclick = cerrar;
    }
  };

  /* =====================================================
     1) BIOLOGÍA MARINA · Pesca de basura (5 vidas)
     ===================================================== */
  function juegoMarina() {
    var c = crearCanvas(), x = c.getContext('2d');
    var BASURA = ['🥤', '🛍️', '🥫', '🍾', '👟', '🔋', '🧴', '📦'];
    var PECES = ['🐟', '🐠', '🐡', '🦈', '🐙', '🐢', '🦑', '🐬'];
    var vidas = 5, puntos = 0, items = [], efectos = [], lineas = [];
    var espera = 0, barcoX = 400, terminado = false, tiempo = 0;
    var burbujas = [], parts = [], racha = 0;
    for (var i = 0; i < 25; i++) burbujas.push({ x: aleatorio(0, 800), y: aleatorio(100, 500), v: aleatorio(10, 30), r: aleatorio(2, 6) });
    api.vidas(vidas, 5); api.puntos(0);
    ayudaEl.textContent = '🎣 Toca la BASURA para sacarla del mar (+10). ¡5 seguidas = bono! Si atrapas un pez pierdes una vida.';

    function nuevo() {
      var basura = Math.random() < 0.6;
      var dir = Math.random() < 0.5 ? 1 : -1;
      var rapidez = (70 + Math.random() * 80) * (1 + Math.min(puntos, 300) / 250);
      items.push({
        e: basura ? elegir(BASURA) : elegir(PECES), basura: basura,
        x: dir > 0 ? -40 : 840, y: aleatorio(150, 455), v: rapidez * dir,
        fase: Math.random() * 6, tam: aleatorio(64, 80)
      });
    }

    function pulsar(e) {
      if (terminado) return;
      var p = posicion(c, e);
      barcoX = p.x;
      // buscamos el objeto tocado (el de arriba primero)
      for (var i = items.length - 1; i >= 0; i--) {
        var it = items[i];
        if (Math.hypot(it.x - p.x, it.y - p.y) < it.tam * 0.8) {
          lineas.push({ x: it.x, y: it.y, t: 0.3 });
          items.splice(i, 1);
          if (it.basura) {
            racha++;
            var extra = racha % 5 === 0 ? 25 : 0;
            puntos += 10 + extra; api.puntos(puntos);
            efectos.push({ x: it.x, y: it.y, txt: extra ? '+35 ¡RACHA x' + racha + '!' : '+10 ♻️', col: '#93FF24', t: 1.1 });
            chispas(parts, it.x, it.y, '#93FF24'); bip('ok');
          } else {
            vidas--; api.vidas(vidas, 5); racha = 0;
            efectos.push({ x: it.x, y: it.y, txt: '-1 ❤️ ¡un pez!', col: '#FF5A4A', t: 1.3 });
            chispas(parts, it.x, it.y, '#FF3222'); bip('vida');
            if (vidas <= 0) {
              terminado = true;
              esperar(function () {
                api.fin('¡Se acabaron las vidas!', 'Recogiste ' + (puntos / 10) + ' residuos. Cada año millones de toneladas de plástico llegan al océano y ponen en riesgo a peces, tortugas y corales.', puntos);
              }, 600);
            }
          }
          return;
        }
      }
    }
    function mover(e) { barcoX = posicion(c, e).x; }
    c.addEventListener('pointerdown', pulsar);
    c.addEventListener('pointermove', mover);

    var parar = bucle(function (dt) {
      tiempo += dt;
      if (!terminado) {
        espera -= dt;
        if (espera <= 0) { nuevo(); espera = Math.max(0.35, 1.0 - puntos / 500); }
      }
      items.forEach(function (it) { it.x += it.v * dt; });
      items = items.filter(function (it) { return it.x > -80 && it.x < 880; });
      burbujas.forEach(function (b) { b.y -= b.v * dt; if (b.y < 95) { b.y = 500; b.x = aleatorio(0, 800); } });
      efectos.forEach(function (f) { f.t -= dt; f.y -= 30 * dt; });
      parts = moverChispas(parts, dt);
      efectos = efectos.filter(function (f) { return f.t > 0; });
      lineas.forEach(function (l) { l.t -= dt; });
      lineas = lineas.filter(function (l) { return l.t > 0; });

      // ---- dibujo ----
      var cielo = x.createLinearGradient(0, 0, 0, 95);
      cielo.addColorStop(0, '#3d9bff'); cielo.addColorStop(1, '#8cc9ff');
      x.fillStyle = cielo; x.fillRect(0, 0, 800, 95);
      var mar = x.createLinearGradient(0, 90, 0, 500);
      mar.addColorStop(0, '#2a95f0'); mar.addColorStop(1, '#0a3d80');
      x.fillStyle = mar; x.fillRect(0, 90, 800, 410);
      x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 3; x.beginPath();
      for (var px = 0; px <= 800; px += 10) x.lineTo(px, 92 + Math.sin(px / 30 + tiempo * 2) * 4);
      x.stroke();
      x.fillStyle = 'rgba(255,255,255,.18)';
      burbujas.forEach(function (b) { x.beginPath(); x.arc(b.x, b.y, b.r, 0, 7); x.fill(); });

      x.textAlign = 'center'; x.textBaseline = 'middle';
      items.forEach(function (it) {
        var y = it.y + Math.sin(tiempo * 3 + it.fase) * 6;
        x.save(); x.translate(it.x, y);
        if (it.v > 0) x.scale(-1, 1);   // los peces miran hacia donde nadan
        objeto(x, it.e, 0, 0, it.tam, '#ffffff');
        x.restore();
      });
      // barco y sedal
      objeto(x, '⛵', barcoX, 46, 62, '#ffffff');
      lineas.forEach(function (l) {
        x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.moveTo(barcoX, 80); x.lineTo(l.x, l.y); x.stroke();
        x.font = '26px serif'; x.fillText('🪝', l.x, l.y);
      });
      dibujarChispas(x, parts);
      efectos.forEach(function (f) { textoFlotante(x, f); });
    });
    return function () { parar(); };
  }

  /* =====================================================
     2) COSMETOLOGÍA · Limpia la cara
     ===================================================== */
  function juegoCosmetologia() {
    var c = crearCanvas(), x = c.getContext('2d');
    var CX = 400, CY = 265, RX = 165, RY = 215;
    var vidas = 5, puntos = 0, tiempo = 60, manchas = [], efectos = [], parts = [];
    var espera = 0.5, terminado = false, raton = { x: 400, y: 250, dentro: false, abajo: false }, ultimoPunto = null;
    api.vidas(vidas, 5); api.puntos(0);
    ayudaEl.textContent = '🧴 Toca los GRANOS (rojos) y PUNTOS NEGROS para quitarlos. Frota las MANCHAS de suciedad arrastrando. Si dejas una mucho tiempo se irrita, y no toques la piel sana.';

    function enCara(px, py, margen) { return Math.pow((px - CX) / (RX - margen), 2) + Math.pow((py - CY) / (RY - margen), 2) < 1; }
    function zonaLibre(px, py) {
      if (Math.hypot(px - 335, py - 215) < 50 || Math.hypot(px - 465, py - 215) < 50) return false; // ojos
      if (Math.abs(px - 400) < 65 && py > 345 && py < 405) return false;                             // boca
      return true;
    }
    function nueva() {
      for (var i = 0; i < 40; i++) {
        var px = CX + aleatorio(-RX, RX), py = CY + aleatorio(-RY, RY);
        var lejos = manchas.every(function (m) { return Math.hypot(m.x - px, m.y - py) > 75; });
        if (enCara(px, py, 35) && zonaLibre(px, py) && lejos) {
          var r = Math.random();
          var tipo = r < 0.5 ? 'grano' : (r < 0.8 ? 'punto' : 'mancha');
          manchas.push({ tipo: tipo, x: px, y: py, edad: 0, limite: tipo === 'mancha' ? 12 : 9, vida: 1,
                         r: tipo === 'grano' ? 22 : (tipo === 'punto' ? 14 : 38) });
          return;
        }
      }
    }
    function quitar(m, pts, txt) {
      manchas.splice(manchas.indexOf(m), 1);
      puntos += pts; api.puntos(puntos);
      efectos.push({ x: m.x, y: m.y, txt: txt, col: '#7CFF6B', t: 1, anillo: 0 });
      chispas(parts, m.x, m.y, '#7CFF6B'); bip('ok');
    }
    function perderVida(px, py, txt) {
      vidas--; api.vidas(vidas, 5);
      efectos.push({ x: px, y: py, txt: txt, col: '#FF5A4A', t: 1.3, anillo: 0 });
      chispas(parts, px, py, '#FF3222'); bip('vida');
      if (vidas <= 0) acabar(false);
    }
    function acabar(gano) {
      if (terminado) return; terminado = true;
      var tip = 'Tip real: no revientes los granos con las uñas (deja marcas), lava tu cara con jabón suave y usa protector solar todos los días.';
      esperar(function () {
        api.fin(gano ? '✨ ¡Piel radiante!' : '😣 Piel irritada', (gano ? 'Terminaste el tratamiento. ' : 'Se acabaron las vidas. ') + tip, puntos);
      }, 400);
    }

    c.addEventListener('pointerdown', function (e) {
      if (terminado) return;
      var p = posicion(c, e); raton.abajo = true; ultimoPunto = p; raton.x = p.x; raton.y = p.y;
      for (var i = manchas.length - 1; i >= 0; i--) {
        var m = manchas[i], hit = m.r + (m.tipo === 'mancha' ? 12 : 12);
        if (Math.hypot(m.x - p.x, m.y - p.y) < hit) {
          if (m.tipo === 'grano') quitar(m, 10, '+10 ✨');
          else if (m.tipo === 'punto') quitar(m, 5, '+5 ✨');
          return;   // si es mancha, se limpia arrastrando
        }
      }
      if (enCara(p.x, p.y, 0)) perderVida(p.x, p.y, '¡Piel sana! -1 ❤️');
    });
    c.addEventListener('pointermove', function (e) {
      var p = posicion(c, e); raton.x = p.x; raton.y = p.y; raton.dentro = true;
      if (!raton.abajo || terminado || !ultimoPunto) return;
      var d = Math.hypot(p.x - ultimoPunto.x, p.y - ultimoPunto.y);
      ultimoPunto = p;
      manchas.slice().forEach(function (m) {
        if (m.tipo === 'mancha' && Math.hypot(m.x - p.x, m.y - p.y) < m.r + 10) {
          m.vida -= d / 320;
          if (m.vida <= 0) quitar(m, 15, '+15 🧼');
        }
      });
    });
    c.addEventListener('pointerleave', function () { raton.dentro = false; raton.abajo = false; });
    window.addEventListener('pointerup', function () { raton.abajo = false; });

    var t0 = 0;
    var parar = bucle(function (dt) {
      t0 += dt;
      if (!terminado) {
        tiempo -= dt;
        if (tiempo <= 0) { tiempo = 0; acabar(true); }
        espera -= dt;
        if (espera <= 0) { nueva(); espera = Math.max(0.55, 1.2 - puntos / 400); }
        manchas.slice().forEach(function (m) {
          m.edad += dt;
          if (m.edad > m.limite) {
            manchas.splice(manchas.indexOf(m), 1);
            perderVida(m.x, m.y, '¡Se irritó! -1 ❤️');
          }
        });
      }
      efectos.forEach(function (f) { f.t -= dt; f.y -= 28 * dt; f.anillo += dt * 60; });
      parts = moverChispas(parts, dt);
      efectos = efectos.filter(function (f) { return f.t > 0; });

      // ---- dibujo ----
      var fondo = x.createLinearGradient(0, 0, 0, 500);
      fondo.addColorStop(0, '#1d5c3f'); fondo.addColorStop(1, '#0b2a1b');
      x.fillStyle = fondo; x.fillRect(0, 0, 800, 500);
      // cabello
      x.fillStyle = '#3b2314'; x.beginPath(); x.ellipse(CX, CY - 15, RX + 28, RY + 18, 0, 0, 7); x.fill();
      // cara
      var piel = x.createRadialGradient(CX - 40, CY - 60, 20, CX, CY, RY);
      piel.addColorStop(0, '#fbd9bd'); piel.addColorStop(1, '#e8b48f');
      x.fillStyle = piel; x.beginPath(); x.ellipse(CX, CY, RX, RY, 0, 0, 7); x.fill();
      // cejas, ojos, nariz, boca, mejillas
      x.strokeStyle = '#5a3a24'; x.lineWidth = 6; x.lineCap = 'round';
      x.beginPath(); x.moveTo(300, 172); x.quadraticCurveTo(335, 155, 370, 172); x.stroke();
      x.beginPath(); x.moveTo(430, 172); x.quadraticCurveTo(465, 155, 500, 172); x.stroke();
      [[335, 215], [465, 215]].forEach(function (o) {
        x.fillStyle = '#fff'; x.beginPath(); x.ellipse(o[0], o[1], 30, 17, 0, 0, 7); x.fill();
        x.fillStyle = '#4a2e1a'; x.beginPath(); x.arc(o[0], o[1], 11, 0, 7); x.fill();
        x.fillStyle = '#000'; x.beginPath(); x.arc(o[0], o[1], 5, 0, 7); x.fill();
      });
      x.strokeStyle = '#c98f6b'; x.lineWidth = 4;
      x.beginPath(); x.moveTo(400, 235); x.quadraticCurveTo(385, 290, 405, 305); x.stroke();
      x.strokeStyle = '#c0392b'; x.lineWidth = 7;
      x.beginPath(); x.moveTo(350, 370); x.quadraticCurveTo(400, 400, 450, 370); x.stroke();
      x.fillStyle = 'rgba(255,120,120,.25)';
      x.beginPath(); x.arc(290, 300, 28, 0, 7); x.fill(); x.beginPath(); x.arc(510, 300, 28, 0, 7); x.fill();

      // imperfecciones (grandes, con borde blanco y brillo para verse bien)
      manchas.forEach(function (m) {
        var urgente = m.limite - m.edad < 3 && Math.floor(t0 * 6) % 2 === 0;
        x.save();
        if (m.tipo === 'mancha') {
          var g = x.createRadialGradient(m.x, m.y, 4, m.x, m.y, m.r);
          g.addColorStop(0, 'rgba(85,45,10,' + (0.98 * m.vida) + ')'); g.addColorStop(0.8, 'rgba(105,60,20,' + (0.85 * m.vida) + ')'); g.addColorStop(1, 'rgba(105,60,20,0)');
          x.fillStyle = g; x.beginPath(); x.arc(m.x, m.y, m.r, 0, 7); x.fill();
          x.setLineDash([7, 6]); x.lineWidth = 3; x.strokeStyle = '#FFF3A0';
          x.beginPath(); x.arc(m.x, m.y, m.r + 3, 0, 7); x.stroke();
        } else if (m.tipo === 'grano') {
          x.shadowColor = '#FF1744'; x.shadowBlur = 18;
          var g2 = x.createRadialGradient(m.x - 6, m.y - 6, 2, m.x, m.y, m.r);
          g2.addColorStop(0, '#ff8a80'); g2.addColorStop(0.55, '#ff1744'); g2.addColorStop(1, '#a50e0e');
          x.fillStyle = g2; x.beginPath(); x.arc(m.x, m.y, m.r, 0, 7); x.fill();
          x.shadowBlur = 0; x.lineWidth = 4; x.strokeStyle = '#fff'; x.stroke();
          x.fillStyle = '#fff'; x.beginPath(); x.arc(m.x - 6, m.y - 6, 5, 0, 7); x.fill();
        } else {
          x.shadowColor = '#fff'; x.shadowBlur = 12;
          x.fillStyle = '#000'; x.beginPath(); x.arc(m.x, m.y, m.r, 0, 7); x.fill();
          x.shadowBlur = 0; x.lineWidth = 4; x.strokeStyle = '#fff'; x.stroke();
          x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.arc(m.x - 4, m.y - 4, 3, 0, 7); x.fill();
        }
        x.restore();
        if (urgente) { x.strokeStyle = '#FF3222'; x.lineWidth = 5; x.beginPath(); x.arc(m.x, m.y, m.r + 12, 0, 7); x.stroke(); }
      });
      // efectos
      x.textAlign = 'center'; x.textBaseline = 'middle';
      dibujarChispas(x, parts);
      efectos.forEach(function (f) {
        if (f.col === '#7CFF6B') { x.globalAlpha = Math.min(1, f.t); x.strokeStyle = f.col; x.lineWidth = 4; x.beginPath(); x.arc(f.x, f.y + 20, f.anillo, 0, 7); x.stroke(); x.globalAlpha = 1; }
        textoFlotante(x, f);
      });
      // cursor 🧽
      if (raton.dentro) { x.font = '56px serif'; x.fillText('🧽', raton.x + 14, raton.y + 14); }
      // tiempo
      x.font = '900 28px Montserrat, sans-serif'; x.textAlign = 'left'; x.lineWidth = 6; x.strokeStyle = '#000'; x.fillStyle = '#fff';
      x.strokeText('⏱ ' + Math.ceil(tiempo) + ' s', 20, 36); x.fillText('⏱ ' + Math.ceil(tiempo) + ' s', 20, 36);
    });
    return function () { parar(); };
  }

  /* =====================================================
     3) MECÁNICA · Arma el motor (memoria de piezas)
     ===================================================== */
  function juegoMecanica() {
    var PIEZAS = [
      ['🔩', 'Pistón', 'Sube y baja dentro del cilindro para comprimir la mezcla'],
      ['⚡', 'Bujía', 'Produce la chispa que enciende la mezcla'],
      ['❄️', 'Radiador', 'Enfría el motor para que no se sobrecaliente'],
      ['🔋', 'Batería', 'Da la energía para arrancar el auto'],
      ['🛑', 'Frenos', 'Reducen la velocidad y detienen el vehículo'],
      ['🛢️', 'Filtro de aceite', 'Limpia el aceite que lubrica el motor']
    ];
    var cartas = [];
    PIEZAS.forEach(function (p, i) {
      cartas.push({ par: i, tipo: 'pieza', emoji: p[0], texto: p[1] });
      cartas.push({ par: i, tipo: 'funcion', emoji: '', texto: p[2] });
    });
    cartas.sort(function () { return Math.random() - 0.5; });

    var puntos = 0, aciertos = 0, abiertas = [], bloqueado = false;
    api.vidas(null); api.puntos(0);
    ayudaEl.textContent = '⚙️ Une cada PIEZA con su FUNCIÓN. Acierto = +100, error = -10.';
    var cont = document.createElement('div'); cont.className = 'mem'; escena.appendChild(cont);

    cartas.forEach(function (d) {
      var b = document.createElement('button'); b.className = 'carta';
      b.innerHTML = '<span class="dorso">❓</span>';
      b.onclick = function () {
        if (bloqueado || b.classList.contains('abierta') || b.classList.contains('hecha')) return;
        b.classList.add('abierta');
        b.innerHTML = (d.emoji ? '<span class="emoji">' + d.emoji + '</span>' : '') + '<span></span>';
        b.lastChild.textContent = d.texto;
        abiertas.push({ b: b, d: d });
        if (abiertas.length < 2) return;
        var a = abiertas[0], z = abiertas[1];
        if (a.d.par === z.d.par && a.d.tipo !== z.d.tipo) {
          a.b.classList.add('hecha'); z.b.classList.add('hecha');
          puntos += 100; aciertos++; abiertas = []; bip('ok');
          api.puntos(puntos);
          if (aciertos === PIEZAS.length) esperar(function () {
            api.fin('🔧 ¡Motor armado!', 'Conectaste todas las piezas con su función. Conocer cada componente ayuda a hacer mantenimiento preventivo y cuidar el auto.', puntos);
          }, 500);
        } else {
          bloqueado = true; puntos = Math.max(0, puntos - 10); api.puntos(puntos); bip('mal');
          esperar(function () {
            [a, z].forEach(function (k) { k.b.classList.remove('abierta'); k.b.innerHTML = '<span class="dorso">❓</span>'; });
            abiertas = []; bloqueado = false;
          }, 900);
        }
      };
      cont.appendChild(b);
    });
    return null;
  }

  /* =====================================================
     4) ARTE · Mezclador de colores
     ===================================================== */
  function juegoArte() {
    // Mezcla tipo pintura (rojo-amarillo-azul): interpolación en el "cubo RYB"
    var ESQ = { '000': [255, 255, 255], '100': [255, 0, 0], '010': [255, 255, 0], '001': [42, 95, 153],
                '110': [255, 128, 0], '101': [128, 0, 128], '011': [0, 168, 51], '111': [51, 24, 0] };
    function mezclar(g) {   // g = { r, y, a, b } cantidad de gotas
      var tot = g.r + g.y + g.a;
      if (tot === 0) return [255, 255, 255];
      var m = Math.max(g.r, g.y, g.a), R = g.r / m, Y = g.y / m, A = g.a / m, col = [0, 0, 0];
      Object.keys(ESQ).forEach(function (k) {
        var w = (k[0] === '1' ? R : 1 - R) * (k[1] === '1' ? Y : 1 - Y) * (k[2] === '1' ? A : 1 - A);
        for (var i = 0; i < 3; i++) col[i] += ESQ[k][i] * w;
      });
      var t = g.b / (g.b + tot);   // el blanco aclara
      return col.map(function (v) { return Math.round(v + (255 - v) * t); });
    }
    var RETOS = [
      ['Naranja', { r: 1, y: 1, a: 0, b: 0 }], ['Verde', { r: 0, y: 1, a: 1, b: 0 }],
      ['Morado', { r: 1, y: 0, a: 1, b: 0 }], ['Rosa', { r: 1, y: 0, a: 0, b: 1 }],
      ['Celeste', { r: 0, y: 0, a: 1, b: 1 }], ['Café', { r: 1, y: 1, a: 1, b: 0 }]
    ];
    var ronda = 0, intentos = 0, puntos = 0, gotas, MAX = 8;
    api.vidas(null); api.puntos(0);
    ayudaEl.textContent = '🎨 Mezcla gotas de pintura hasta igualar el color objetivo. 3 intentos por color.';
    escena.innerHTML = '<div class="mezcla"><div class="caja"><h4>🎯 Objetivo: <span id="aNombre"></span></h4><div class="circulo" id="aObj"></div></div>' +
      '<div class="caja"><h4>🧪 Tu mezcla</h4><div class="circulo" id="aMez"></div></div></div>' +
      '<div class="gotas"><button data-g="r" style="background:#E4202A">🔴 Rojo</button><button data-g="y" style="background:#FFD500;color:#000">🟡 Amarillo</button>' +
      '<button data-g="a" style="background:#2A5FD9">🔵 Azul</button><button data-g="b" style="background:#fff;color:#000">⚪ Blanco</button></div>' +
      '<div class="msg-arte" id="aMsg"></div><div class="acciones"><button id="aComp">✔ Comparar</button><button id="aLimp">↺ Limpiar</button></div>';
    var objEl = escena.querySelector('#aObj'), mezEl = escena.querySelector('#aMez'), msg = escena.querySelector('#aMsg');
    function css(c) { return 'rgb(' + c.join(',') + ')'; }
    function mostrar() { mezEl.style.background = css(mezclar(gotas)); }
    function cargar() {
      gotas = { r: 0, y: 0, a: 0, b: 0 }; intentos = 0;
      escena.querySelector('#aNombre').textContent = RETOS[ronda][0] + ' (' + (ronda + 1) + '/' + RETOS.length + ')';
      objEl.style.background = css(mezclar(RETOS[ronda][1])); mostrar(); msg.textContent = '';
    }
    function siguiente() {
      ronda++;
      if (ronda >= RETOS.length) { api.fin('🎨 ¡Paleta completa!', 'Aprendiste que mezclando colores primarios se obtienen colores secundarios, y que el blanco aclara los tonos.', puntos); return; }
      cargar();
    }
    escena.querySelectorAll('[data-g]').forEach(function (b) {
      b.onclick = function () {
        var total = gotas.r + gotas.y + gotas.a + gotas.b;
        if (total >= MAX) { msg.textContent = 'Máximo ' + MAX + ' gotas. Usa Limpiar.'; return; }
        gotas[b.dataset.g]++; mostrar();
      };
    });
    escena.querySelector('#aLimp').onclick = function () { gotas = { r: 0, y: 0, a: 0, b: 0 }; mostrar(); msg.textContent = ''; };
    escena.querySelector('#aComp').onclick = function () {
      var a = mezclar(gotas), o = mezclar(RETOS[ronda][1]);
      var d = Math.sqrt(Math.pow(a[0] - o[0], 2) + Math.pow(a[1] - o[1], 2) + Math.pow(a[2] - o[2], 2));
      var pct = Math.max(0, Math.round(100 - d * 100 / 150));
      intentos++;
      if (pct >= 90) {
        puntos += pct; api.puntos(puntos); bip('ok'); msg.textContent = '✅ ¡Excelente! ' + pct + '% de parecido';
        esperar(siguiente, 1100);
      } else if (intentos >= 3) {
        var rc = RETOS[ronda][1];
        msg.textContent = '❌ Era: ' + rc.r + ' rojo, ' + rc.y + ' amarillo, ' + rc.a + ' azul, ' + rc.b + ' blanco. ¡Sigamos!';
        esperar(siguiente, 2200);
      } else {
        bip('mal'); msg.textContent = '🤔 ' + pct + '% de parecido. Te quedan ' + (3 - intentos) + ' intento(s).';
      }
    };
    cargar();
    return null;
  }

  /* =====================================================
     5) REALEZA · Tesoro real (atrapa joyas con la corona)
     ===================================================== */
  function juegoRealeza() {
    var c = crearCanvas(), x = c.getContext('2d');
    var BUENOS = [['💎', 15], ['🪙', 5], ['💍', 10], ['🏆', 20]];
    var MALOS = ['🪨', '💣', '🕷️'];
    var vidas = 5, puntos = 0, cosas = [], efectos = [], parts = [], coronaX = 400, espera = 0, terminado = false;
    var teclas = { izq: false, der: false }, t0 = 0;
    api.vidas(vidas, 5); api.puntos(0);
    ayudaEl.textContent = '👑 Mueve la corona (mouse, dedo o flechas ← →) para atrapar tesoros. ¡Esquiva rocas, bombas y arañas!';

    function nueva() {
      var malo = Math.random() < 0.3, b = elegir(BUENOS);
      cosas.push({ e: malo ? elegir(MALOS) : b[0], pts: malo ? 0 : b[1], malo: malo, x: aleatorio(40, 760), y: -30,
                   v: aleatorio(110, 180) * (1 + Math.min(puntos, 400) / 300), tam: 64 });
    }
    c.addEventListener('pointermove', function (e) { coronaX = posicion(c, e).x; });
    c.addEventListener('pointerdown', function (e) { coronaX = posicion(c, e).x; });
    function abajo(e) { if (e.key === 'ArrowLeft' || e.key === 'a') teclas.izq = true; if (e.key === 'ArrowRight' || e.key === 'd') teclas.der = true; }
    function arriba(e) { if (e.key === 'ArrowLeft' || e.key === 'a') teclas.izq = false; if (e.key === 'ArrowRight' || e.key === 'd') teclas.der = false; }
    document.addEventListener('keydown', abajo); document.addEventListener('keyup', arriba);

    var parar = bucle(function (dt) {
      t0 += dt;
      if (teclas.izq) coronaX -= 480 * dt;
      if (teclas.der) coronaX += 480 * dt;
      coronaX = Math.max(40, Math.min(760, coronaX));
      if (!terminado) {
        espera -= dt; if (espera <= 0) { nueva(); espera = Math.max(0.35, 0.9 - puntos / 700); }
        cosas.slice().forEach(function (o) {
          o.y += o.v * dt;
          if (o.y > 385 && o.y < 460 && Math.abs(o.x - coronaX) < 78) {        // atrapado
            cosas.splice(cosas.indexOf(o), 1);
            if (o.malo) {
              vidas--; api.vidas(vidas, 5);
              efectos.push({ x: o.x, y: 400, txt: '-1 ❤️', col: '#FF5A4A', t: 1.2 });
              chispas(parts, o.x, 410, '#FF3222'); bip('vida');
              if (vidas <= 0) { terminado = true; esperar(function () {
                api.fin('👑 Fin del reinado', 'Las joyas de la corona de Reino Unido se guardan en la Torre de Londres. Coronas, cetros y joyas simbolizan el poder y la historia de una dinastía.', puntos); }, 500); }
            } else {
              puntos += o.pts; api.puntos(puntos);
              efectos.push({ x: o.x, y: 400, txt: '+' + o.pts, col: '#FFD54A', t: 1.1 });
              chispas(parts, o.x, 410, '#FFD54A'); bip('ok');
            }
          } else if (o.y > 540) cosas.splice(cosas.indexOf(o), 1);
        });
      }
      efectos.forEach(function (f) { f.t -= dt; f.y -= 40 * dt; });
      parts = moverChispas(parts, dt);
      efectos = efectos.filter(function (f) { return f.t > 0; });

      var fondo = x.createLinearGradient(0, 0, 0, 500);
      fondo.addColorStop(0, '#5b24a8'); fondo.addColorStop(1, '#1d0b3d');
      x.fillStyle = fondo; x.fillRect(0, 0, 800, 500);
      // columnas del salón real
      x.fillStyle = 'rgba(255,255,255,.08)';
      [80, 280, 520, 720].forEach(function (px) { x.fillRect(px - 20, 0, 40, 500); });
      x.fillStyle = '#8a3fd6'; x.fillRect(0, 470, 800, 30);
      x.textAlign = 'center'; x.textBaseline = 'middle';
      cosas.forEach(function (o) { objeto(x, o.e, o.x, o.y, o.tam, o.malo ? '#FF3222' : '#FFD54A'); });
      x.save(); x.shadowColor = '#FFD54A'; x.shadowBlur = 26; x.font = '96px serif'; x.fillText('👑', coronaX, 430); x.restore();
      dibujarChispas(x, parts);
      efectos.forEach(function (f) { textoFlotante(x, f); });
    });
    return function () { parar(); document.removeEventListener('keydown', abajo); document.removeEventListener('keyup', arriba); };
  }

  /* =====================================================
     6) BIOLOGÍA MARINA 2 · Salva a la tortuga
     ===================================================== */
  function dibujarMedusa(x, px, py, tam, t) {
    x.save();
    x.shadowColor = '#7CFFEA'; x.shadowBlur = 22;
    x.fillStyle = 'rgba(255,255,255,.9)';
    x.beginPath(); x.arc(px, py, tam * 0.66, 0, 7); x.fill();
    x.shadowBlur = 0; x.lineWidth = 4; x.strokeStyle = '#7CFFEA'; x.stroke();
    var g = x.createLinearGradient(0, py - tam * 0.45, 0, py + tam * 0.1);
    g.addColorStop(0, '#ff7ad9'); g.addColorStop(1, '#a62dff');
    x.fillStyle = g; x.beginPath();
    x.arc(px, py - tam * 0.05, tam * 0.38, Math.PI, 0);
    x.quadraticCurveTo(px, py + tam * 0.14, px - tam * 0.38, py - tam * 0.05); x.fill();
    x.strokeStyle = '#a62dff'; x.lineWidth = 3; x.lineCap = 'round';
    for (var i = -2; i <= 2; i++) {
      x.beginPath(); x.moveTo(px + i * tam * 0.14, py + tam * 0.03);
      for (var k = 1; k <= 4; k++) x.lineTo(px + i * tam * 0.14 + Math.sin(t * 4 + k + i) * 5, py + tam * 0.03 + k * tam * 0.1);
      x.stroke();
    }
    x.restore();
  }

  function juegoTortuga() {
    var c = crearCanvas(), x = c.getContext('2d');
    var MALOS = ['🛍️', '🥤', '🧴'];
    var vidas = 3, puntos = 0, items = [], efectos = [], parts = [], burbujas = [], t0 = 0;
    var tortuga = { x: 150, y: 250 }, meta = { x: 150, y: 250 }, espera = 0.5, terminado = false;
    for (var i = 0; i < 25; i++) burbujas.push({ x: aleatorio(0, 800), y: aleatorio(0, 500), v: aleatorio(10, 30), r: aleatorio(2, 6) });
    api.vidas(vidas, 3); api.puntos(0);
    ayudaEl.textContent = '🐢 Mueve la tortuga con el mouse o el dedo. Come MEDUSAS rosadas (+10) y esquiva la BASURA: ¡las bolsas de plástico engañan a las tortugas! Tienes 3 vidas.';

    function nuevo() {
      var med = Math.random() < 0.55;
      items.push({ medusa: med, e: med ? '' : elegir(MALOS), x: 860, y: aleatorio(70, 440),
                   v: -aleatorio(120, 180) * (1 + Math.min(puntos, 400) / 300), tam: aleatorio(64, 76), fase: Math.random() * 6 });
    }
    function mover(e) { meta = posicion(c, e); }
    c.addEventListener('pointermove', mover); c.addEventListener('pointerdown', mover);

    var parar = bucle(function (dt) {
      t0 += dt;
      var k = Math.min(1, dt * 6);
      tortuga.x += (meta.x - tortuga.x) * k; tortuga.y += (meta.y - tortuga.y) * k;
      tortuga.x = Math.max(45, Math.min(755, tortuga.x)); tortuga.y = Math.max(50, Math.min(450, tortuga.y));
      if (!terminado) {
        espera -= dt; if (espera <= 0) { nuevo(); espera = Math.max(0.45, 1.1 - puntos / 600); }
        items.slice().forEach(function (o) {
          o.x += o.v * dt;
          var oy = o.y + Math.sin(t0 * 2 + o.fase) * 8;
          if (Math.hypot(o.x - tortuga.x, oy - tortuga.y) < o.tam * 0.5 + 36) {
            items.splice(items.indexOf(o), 1);
            if (o.medusa) {
              puntos += 10; api.puntos(puntos); bip('ok'); chispas(parts, o.x, oy, '#ff7ad9');
              efectos.push({ x: o.x, y: oy, txt: '+10 😋', col: '#FFB3F0', t: 1 });
            } else {
              vidas--; api.vidas(vidas, 3); bip('vida'); chispas(parts, o.x, oy, '#FF3222');
              efectos.push({ x: o.x, y: oy, txt: '-1 ❤️ ¡plástico!', col: '#FF5A4A', t: 1.3 });
              if (vidas <= 0) {
                terminado = true;
                esperar(function () { api.fin('🐢 La tortuga necesita ayuda', 'Las tortugas marinas confunden las bolsas plásticas con medusas, su alimento. Reducir el plástico y no tirarlo al mar salva vidas.', puntos); }, 600);
              }
            }
          } else if (o.x < -100) items.splice(items.indexOf(o), 1);
        });
      }
      burbujas.forEach(function (b) { b.y -= b.v * dt; if (b.y < -10) { b.y = 510; b.x = aleatorio(0, 800); } });
      efectos.forEach(function (f) { f.t -= dt; f.y -= 34 * dt; }); efectos = efectos.filter(function (f) { return f.t > 0; });
      parts = moverChispas(parts, dt);

      var mar = x.createLinearGradient(0, 0, 0, 500);
      mar.addColorStop(0, '#34b3ff'); mar.addColorStop(1, '#0a3d80');
      x.fillStyle = mar; x.fillRect(0, 0, 800, 500);
      x.fillStyle = 'rgba(255,255,255,.07)';                       // rayos de luz
      [120, 380, 640].forEach(function (rx, i) { x.beginPath(); x.moveTo(rx, 0); x.lineTo(rx + 90, 0); x.lineTo(rx + 20 + i * 15, 500); x.lineTo(rx - 90, 500); x.fill(); });
      x.fillStyle = 'rgba(255,255,255,.2)';
      burbujas.forEach(function (b) { x.beginPath(); x.arc(b.x, b.y, b.r, 0, 7); x.fill(); });
      items.forEach(function (o) {
        var oy = o.y + Math.sin(t0 * 2 + o.fase) * 8;
        if (o.medusa) dibujarMedusa(x, o.x, oy, o.tam, t0); else objeto(x, o.e, o.x, oy, o.tam, '#ffffff');
      });
      x.save(); x.translate(tortuga.x, tortuga.y + Math.sin(t0 * 5) * 3);
      if (meta.x > tortuga.x + 6) x.scale(-1, 1);
      objeto(x, '🐢', 0, 0, 92, '#9BFFB0'); x.restore();
      x.textAlign = 'center'; x.textBaseline = 'middle';
      dibujarChispas(x, parts);
      efectos.forEach(function (f) { textoFlotante(x, f); });
    });
    return function () { parar(); };
  }

  /* =====================================================
     7) COSMETOLOGÍA 2 · Rutina de cuidado (ordena los pasos)
     ===================================================== */
  function juegoRutina() {
    var RUTINAS = [
      { nombre: '☀️ Rutina de DÍA', pasos: [
        ['🧼', 'Limpiar la cara', 'Quita la grasa y la suciedad acumuladas.'],
        ['💧', 'Tónico', 'Equilibra la piel y la prepara para lo siguiente.'],
        ['✨', 'Sérum', 'Trata una necesidad concreta: manchas, brillo, hidratación.'],
        ['🧴', 'Hidratante', 'Mantiene la piel suave y protegida.'],
        ['🌞', 'Protector solar', 'Siempre al final del día: protege de los rayos UV.'] ] },
      { nombre: '🌙 Rutina de NOCHE', pasos: [
        ['💄', 'Desmaquillar', 'Retira el maquillaje y el protector solar.'],
        ['🧼', 'Limpiar la cara', 'Una segunda limpieza deja la piel realmente limpia.'],
        ['💧', 'Tónico', 'Refresca y equilibra la piel.'],
        ['✨', 'Sérum', 'Aprovecha la noche para tratar la piel.'],
        ['🌙', 'Crema de noche', 'Ayuda a la piel a regenerarse mientras duermes.'] ] },
      { nombre: '🧖 Tratamiento tipo SPA', pasos: [
        ['🧼', 'Limpieza profunda', 'Se empieza siempre con la piel limpia.'],
        ['🧂', 'Exfoliación suave', 'Retira células muertas (¡no más de 1 o 2 veces por semana!).'],
        ['♨️', 'Vapor tibio', 'Ablanda la piel y relaja.'],
        ['🥒', 'Mascarilla', 'Nutre e hidrata con calma durante unos minutos.'],
        ['🧴', 'Crema hidratante', 'Sella la hidratación al final.'] ] }
    ];
    var ronda = 0, puntos = 0, vidas = 5, errores = 0, siguiente = 0, bloqueo = false;
    api.vidas(vidas, 5); api.puntos(0);
    ayudaEl.textContent = '🧴 Toca los pasos en el ORDEN correcto de la rutina. Cada acierto +20. Un error te quita una vida.';
    escena.innerHTML = '<div class="rut"><h3 class="rut-titulo" id="rTitulo"></h3><div class="rut-paso-actual" id="rGuia"></div><div class="rut-pasos" id="rPasos"></div><p class="rut-msg" id="rMsg"></p></div>';
    var tituloR = escena.querySelector('#rTitulo'), guia = escena.querySelector('#rGuia'), cont = escena.querySelector('#rPasos'), msg = escena.querySelector('#rMsg');

    function cargar() {
      var R = RUTINAS[ronda]; siguiente = 0; errores = 0; bloqueo = false; cont.innerHTML = ''; msg.textContent = '';
      tituloR.textContent = R.nombre + '  (' + (ronda + 1) + '/' + RUTINAS.length + ')';
      guia.textContent = 'Paso 1 de 5: ¿cuál va primero?';
      var orden = R.pasos.map(function (p, i) { return { p: p, i: i }; }).sort(function () { return Math.random() - 0.5; });
      orden.forEach(function (o) {
        var b = document.createElement('button'); b.className = 'rut-carta';
        b.innerHTML = '<span class="rut-emoji">' + o.p[0] + '</span><span class="rut-nombre"></span><span class="rut-num"></span>';
        b.querySelector('.rut-nombre').textContent = o.p[1];
        b.onclick = function () {
          if (bloqueo || b.classList.contains('ok')) return;
          if (o.i === siguiente) {
            b.classList.add('ok'); b.querySelector('.rut-num').textContent = String(siguiente + 1);
            puntos += 20; api.puntos(puntos); bip('ok');
            msg.textContent = '✅ ' + o.p[1] + ': ' + o.p[2];
            siguiente++;
            guia.textContent = siguiente < 5 ? 'Paso ' + (siguiente + 1) + ' de 5: ¿cuál sigue?' : '¡Rutina completa!';
            if (siguiente === 5) {
              bloqueo = true;
              if (errores === 0) { puntos += 50; api.puntos(puntos); msg.textContent = '🌟 ¡Sin errores! +50 de bono. ' + msg.textContent; }
              esperar(function () {
                ronda++;
                if (ronda >= RUTINAS.length) { api.fin('✨ ¡Experto en cuidado de la piel!', 'Limpiar, hidratar y proteger del sol cada día es la base de una piel sana.', puntos); }
                else cargar();
              }, 1900);
            }
          } else {
            errores++; vidas--; api.vidas(vidas, 5); bip('vida');
            b.classList.add('mal'); setTimeout(function () { b.classList.remove('mal'); }, 500);
            msg.textContent = '❌ Ese no va todavía. ¡Piensa en el orden lógico!';
            if (vidas <= 0) { bloqueo = true; esperar(function () { api.fin('😣 Se acabaron las vidas', 'Repasa el orden: limpiar, tratar, hidratar y proteger. ¡Inténtalo otra vez!', puntos); }, 700); }
          }
        };
        cont.appendChild(b);
      });
    }
    cargar();
    return null;
  }

  /* =====================================================
     8) MECÁNICA 2 · Ruta del motor (carriles, combustible)
     ===================================================== */
  function juegoRuta() {
    var c = crearCanvas(), x = c.getContext('2d');
    var CARRILES = [250, 400, 550], carril = 1, autoX = 400, combustible = 100, vidas = 3, puntos = 0, dist = 0;
    var cosas = [], efectos = [], parts = [], espera = 0.6, terminado = false, t0 = 0, rayas = 0, golpe = 0;
    var BUENOS = [['⛽', 'gas'], ['🔧', 'llave']];
    var MALOS = ['🚧', '🛢️', '🪨'];
    api.vidas(vidas, 3); api.puntos(0);
    ayudaEl.textContent = '🏎️ Cambia de carril con ← → (o toca la izquierda/derecha del juego). ⛽ llena el tanque, 🔧 da puntos. ¡Esquiva conos, aceite y rocas!';

    function nueva() {
      var malo = Math.random() < 0.5, g = elegir(BUENOS);
      cosas.push({ e: malo ? elegir(MALOS) : g[0], tipo: malo ? 'malo' : g[1], carril: Math.floor(Math.random() * 3), y: -50,
                   v: (230 + Math.min(dist, 600) * 0.35) });
    }
    function cambiar(d) { carril = Math.max(0, Math.min(2, carril + d)); }
    function teclado(e) {
      if (e.key === 'ArrowLeft' || e.key === 'a') { cambiar(-1); e.preventDefault(); }
      if (e.key === 'ArrowRight' || e.key === 'd') { cambiar(1); e.preventDefault(); }
    }
    document.addEventListener('keydown', teclado);
    c.addEventListener('pointerdown', function (e) {
      var p = posicion(c, e);
      carril = p.x < 800 / 3 ? 0 : (p.x < 1600 / 3 ? 1 : 2);
    });

    var parar = bucle(function (dt) {
      t0 += dt; golpe = Math.max(0, golpe - dt);
      autoX += (CARRILES[carril] - autoX) * Math.min(1, dt * 12);
      if (!terminado) {
        dist += dt * 20; rayas += dt * (300 + Math.min(dist, 600) * 0.35);
        combustible -= dt * 5.5;
        if (combustible <= 0) {
          combustible = 0; terminado = true;
          esperar(function () { api.fin('⛽ ¡Sin combustible!', 'Revisar el combustible, el aceite y las llantas antes de salir evita quedarse varado en la carretera.', Math.round(puntos + dist)); }, 500);
        }
        espera -= dt; if (espera <= 0) { nueva(); espera = Math.max(0.45, 1.0 - dist / 900); }
        cosas.slice().forEach(function (o) {
          o.y += o.v * dt;
          if (Math.abs(o.y - 410) < 55 && o.carril === carril) {
            cosas.splice(cosas.indexOf(o), 1);
            var ox = CARRILES[o.carril];
            if (o.tipo === 'malo') {
              vidas--; api.vidas(vidas, 3); golpe = 0.4; bip('vida'); chispas(parts, ox, 410, '#FF3222');
              efectos.push({ x: ox, y: 380, txt: '-1 ❤️ ¡choque!', col: '#FF5A4A', t: 1.2 });
              if (vidas <= 0) { terminado = true; esperar(function () { api.fin('💥 ¡Choque!', 'Los conos y obstáculos en la vía exigen reflejos y velocidad moderada. ¡La seguridad vial es lo primero!', Math.round(puntos + dist)); }, 600); }
            } else if (o.tipo === 'gas') {
              combustible = Math.min(100, combustible + 30); puntos += 10; api.puntos(Math.round(puntos + dist)); bip('ok'); chispas(parts, ox, 410, '#7CFF6B');
              efectos.push({ x: ox, y: 380, txt: '+30 ⛽', col: '#7CFF6B', t: 1 });
            } else {
              puntos += 25; api.puntos(Math.round(puntos + dist)); bip('ok'); chispas(parts, ox, 410, '#FFD54A');
              efectos.push({ x: ox, y: 380, txt: '+25 🔧', col: '#FFD54A', t: 1 });
            }
          } else if (o.y > 560) cosas.splice(cosas.indexOf(o), 1);
        });
        api.puntos(Math.round(puntos + dist));
      }
      efectos.forEach(function (f) { f.t -= dt; f.y -= 40 * dt; }); efectos = efectos.filter(function (f) { return f.t > 0; });
      parts = moverChispas(parts, dt);

      // pasto + carretera
      x.fillStyle = '#1f7a3a'; x.fillRect(0, 0, 800, 500);
      x.fillStyle = '#3a3f4a'; x.fillRect(150, 0, 500, 500);
      x.fillStyle = '#fff'; x.fillRect(146, 0, 8, 500); x.fillRect(646, 0, 8, 500);
      x.fillStyle = '#FFE600';
      [325, 475].forEach(function (lx) { for (var yy = -80 + (rayas % 80); yy < 500; yy += 80) x.fillRect(lx - 4, yy, 8, 44); });
      x.textAlign = 'center'; x.textBaseline = 'middle';
      cosas.forEach(function (o) { objeto(x, o.e, CARRILES[o.carril], o.y, 66, o.tipo === 'malo' ? '#FF3222' : (o.tipo === 'gas' ? '#7CFF6B' : '#FFD54A')); });
      x.save(); x.translate(autoX, 410 + (golpe > 0 ? Math.sin(t0 * 60) * 4 : 0));
      x.shadowColor = golpe > 0 ? '#FF3222' : '#ffffff'; x.shadowBlur = 22;
      x.fillStyle = '#111'; [[-34, -42], [26, -42], [-34, 22], [26, 22]].forEach(function (w) { x.fillRect(w[0], w[1], 10, 24); });   // llantas
      x.fillStyle = golpe > 0 ? '#ff7a6a' : '#E8232F'; x.beginPath(); x.moveTo(-26, 56); x.lineTo(-30, -30); x.quadraticCurveTo(0, -66, 30, -30); x.lineTo(26, 56); x.closePath(); x.fill();
      x.shadowBlur = 0; x.lineWidth = 4; x.strokeStyle = '#fff'; x.stroke();
      x.fillStyle = '#9fe3ff'; x.fillRect(-18, -22, 36, 20);          // parabrisas
      x.fillStyle = '#7ad0f0'; x.fillRect(-16, 18, 32, 14);           // vidrio trasero
      x.fillStyle = '#FFF3A0'; x.fillRect(-24, -40, 10, 8); x.fillRect(14, -40, 10, 8);   // luces
      x.fillStyle = '#fff'; x.fillRect(-3, -60, 6, 116);              // franja
      x.restore();
      dibujarChispas(x, parts);
      efectos.forEach(function (f) { textoFlotante(x, f); });
      // medidor de combustible
      x.fillStyle = 'rgba(0,0,0,.65)'; x.fillRect(20, 20, 220, 34);
      x.fillStyle = combustible < 25 ? '#FF3222' : '#7CFF6B'; x.fillRect(24, 24, 212 * combustible / 100, 26);
      x.strokeStyle = '#fff'; x.lineWidth = 3; x.strokeRect(20, 20, 220, 34);
      x.font = '800 18px Montserrat, sans-serif'; x.fillStyle = '#fff'; x.textAlign = 'left'; x.lineWidth = 4; x.strokeStyle = '#000';
      x.strokeText('⛽ ' + Math.ceil(combustible) + '%', 30, 38); x.fillText('⛽ ' + Math.ceil(combustible) + '%', 30, 38);
    });
    return function () { parar(); document.removeEventListener('keydown', teclado); };
  }

  /* =====================================================
     9) ARTE 2 · Lluvia de colores (cálidos, fríos, primarios)
     ===================================================== */
  function juegoLluvia() {
    var COLORES = [
      ['Rojo', '#FF1F2D', ['calido', 'primario']], ['Naranja', '#FF8A00', ['calido']],
      ['Amarillo', '#FFE600', ['calido', 'primario']], ['Magenta', '#F40898', ['calido']],
      ['Azul', '#1F5BFF', ['frio', 'primario']], ['Celeste', '#35B8FF', ['frio']],
      ['Verde', '#27D63C', ['frio']], ['Violeta', '#8450FF', ['frio']]
    ];
    var REGLAS = [
      { clave: 'calido', texto: 'COLORES CÁLIDOS', pista: 'rojo, naranja, amarillo, magenta' },
      { clave: 'frio', texto: 'COLORES FRÍOS', pista: 'azul, celeste, verde, violeta' },
      { clave: 'primario', texto: 'COLORES PRIMARIOS', pista: 'rojo, amarillo y azul' }
    ];
    var c = crearCanvas(), x = c.getContext('2d');
    var vidas = 5, puntos = 0, gotas = [], efectos = [], parts = [], espera = 0.4, terminado = false;
    var tiempo = 60, regla = 0, cambio = 15, aviso = 2.2, t0 = 0, racha = 0;
    api.vidas(vidas, 5); api.puntos(0);
    ayudaEl.textContent = '🌈 Toca SOLO las gotas que cumplan la regla de arriba. La regla cambia cada 15 segundos. Si tocas una equivocada pierdes una vida.';

    function nueva() {
      var r = REGLAS[regla].clave, buenas = COLORES.filter(function (k) { return k[2].indexOf(r) >= 0; });
      var col = Math.random() < 0.55 ? elegir(buenas) : elegir(COLORES);
      gotas.push({ n: col[0], c: col[1], ok: col[2].indexOf(r) >= 0, x: aleatorio(60, 740), y: -40, v: aleatorio(90, 150) * (1 + (60 - tiempo) / 90), r: 42 });
    }
    c.addEventListener('pointerdown', function (e) {
      if (terminado) return;
      var p = posicion(c, e);
      for (var i = gotas.length - 1; i >= 0; i--) {
        var g = gotas[i];
        if (Math.hypot(g.x - p.x, g.y - p.y) < g.r + 8) {
          gotas.splice(i, 1);
          var rr = REGLAS[regla].clave, ok = COLORES.filter(function (k) { return k[0] === g.n; })[0][2].indexOf(rr) >= 0;
          if (ok) {
            racha++; var extra = racha % 5 === 0 ? 20 : 0; puntos += 10 + extra; api.puntos(puntos); bip('ok'); chispas(parts, g.x, g.y, g.c);
            efectos.push({ x: g.x, y: g.y, txt: extra ? '+30 ¡RACHA!' : '+10', col: '#fff', t: 1 });
          } else {
            racha = 0; vidas--; api.vidas(vidas, 5); bip('vida'); chispas(parts, g.x, g.y, '#FF3222');
            efectos.push({ x: g.x, y: g.y, txt: '¡Ese no es ' + REGLAS[regla].texto.toLowerCase().replace('colores ', '') + '! -1 ❤️', col: '#FF5A4A', t: 1.5 });
            if (vidas <= 0) acabar(false);
          }
          return;
        }
      }
    });
    function acabar(gano) {
      if (terminado) return; terminado = true;
      esperar(function () {
        api.fin(gano ? '🌈 ¡Artista del color!' : '🎨 Se acabaron las vidas',
          'Los colores cálidos (rojo, naranja, amarillo) transmiten energía; los fríos (azul, verde, violeta) transmiten calma. Rojo, amarillo y azul son los primarios.', puntos);
      }, 500);
    }

    var parar = bucle(function (dt) {
      t0 += dt;
      if (!terminado) {
        tiempo -= dt; if (tiempo <= 0) { tiempo = 0; acabar(true); }
        cambio -= dt; if (cambio <= 0) { cambio = 15; regla = (regla + 1) % REGLAS.length; aviso = 2.2; bip('gana'); }
        aviso -= dt;
        espera -= dt; if (espera <= 0) { nueva(); espera = Math.max(0.4, 0.85 - (60 - tiempo) / 160); }
        gotas.forEach(function (g) { g.y += g.v * dt; });
        gotas = gotas.filter(function (g) { return g.y < 560; });
      }
      efectos.forEach(function (f) { f.t -= dt; f.y -= 36 * dt; }); efectos = efectos.filter(function (f) { return f.t > 0; });
      parts = moverChispas(parts, dt);

      var fondo = x.createLinearGradient(0, 0, 0, 500);
      fondo.addColorStop(0, '#3a1d6e'); fondo.addColorStop(1, '#1a0d3a');
      x.fillStyle = fondo; x.fillRect(0, 0, 800, 500);
      x.textAlign = 'center'; x.textBaseline = 'middle';
      gotas.forEach(function (g) {
        x.save(); x.shadowColor = g.c; x.shadowBlur = 26;
        x.fillStyle = g.c; x.beginPath(); x.arc(g.x, g.y, g.r, 0, 7); x.fill();
        x.shadowBlur = 0; x.lineWidth = 5; x.strokeStyle = '#fff'; x.stroke();
        x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.ellipse(g.x - 14, g.y - 16, 10, 6, -0.6, 0, 7); x.fill();
        x.font = '900 17px Montserrat, sans-serif'; x.lineWidth = 5; x.strokeStyle = '#000'; x.fillStyle = '#fff';
        x.strokeText(g.n, g.x, g.y + 8); x.fillText(g.n, g.x, g.y + 8);
        x.restore();
      });
      dibujarChispas(x, parts);
      efectos.forEach(function (f) { textoFlotante(x, f); });
      // regla actual (siempre visible)
      x.fillStyle = 'rgba(0,0,0,.72)'; x.fillRect(0, 0, 800, 58);
      x.font = '900 26px Montserrat, sans-serif'; x.fillStyle = '#FFE600'; x.fillText('🎯 Toca: ' + REGLAS[regla].texto, 400, 22);
      x.font = '700 15px Montserrat, sans-serif'; x.fillStyle = '#fff'; x.fillText('(' + REGLAS[regla].pista + ')', 400, 46);
      x.font = '900 24px Montserrat, sans-serif'; x.textAlign = 'right'; x.fillStyle = '#fff'; x.fillText('⏱ ' + Math.ceil(tiempo) + ' s', 785, 30);
      if (aviso > 0 && !terminado) {
        x.globalAlpha = Math.min(1, aviso); x.textAlign = 'center'; x.font = '900 52px Montserrat, sans-serif';
        x.lineWidth = 8; x.strokeStyle = '#000'; x.fillStyle = '#FFE600';
        x.strokeText('¡' + REGLAS[regla].texto + '!', 400, 250); x.fillText('¡' + REGLAS[regla].texto + '!', 400, 250); x.globalAlpha = 1;
      }
    });
    return function () { parar(); };
  }

  /* =====================================================
     10) REALEZA 2 · Torneo de arco
     ===================================================== */
  function juegoArco() {
    var c = crearCanvas(), x = c.getContext('2d');
    var vidas = 3, puntos = 0, tiempo = 45, objetivos = [], flechas = [], efectos = [], parts = [], espera = 0.3;
    var combo = 0, terminado = false, t0 = 0;
    api.vidas(vidas, 3); api.puntos(0);
    ayudaEl.textContent = '🏹 Toca para disparar una flecha. Acierta las DIANAS (centro = más puntos). ¡No le dispares a las palomas de la paz! Combos seguidos multiplican tus puntos.';

    function nuevo() {
      var paloma = Math.random() < 0.25, dir = Math.random() < 0.5 ? 1 : -1;
      objetivos.push({ paloma: paloma, x: dir > 0 ? -60 : 860, y: aleatorio(110, 330), v: dir * aleatorio(90, 190) * (1 + (45 - tiempo) / 70),
                       r: paloma ? 38 : 50, fase: Math.random() * 6 });
    }
    function disparar(e) {
      if (terminado) return;
      var p = posicion(c, e); bip('ok');
      flechas.push({ x: p.x, y: p.y, t: 0.35 });
      var acierto = false;
      for (var i = objetivos.length - 1; i >= 0; i--) {
        var o = objetivos[i], oy = o.y + Math.sin(t0 * 2 + o.fase) * 14, d = Math.hypot(o.x - p.x, oy - p.y);
        if (d < o.r) {
          objetivos.splice(i, 1); acierto = true;
          if (o.paloma) {
            vidas--; combo = 0; api.vidas(vidas, 3); bip('vida'); chispas(parts, o.x, oy, '#FF3222');
            efectos.push({ x: o.x, y: oy, txt: '¡Una paloma! -1 ❤️', col: '#FF5A4A', t: 1.4 });
            if (vidas <= 0) acabar();
          } else {
            var centro = d < o.r * 0.34, base = centro ? 30 : (d < o.r * 0.68 ? 20 : 10);
            combo++; var mult = Math.min(3, 1 + Math.floor(combo / 3));
            puntos += base * mult; api.puntos(puntos); chispas(parts, o.x, oy, '#FFD54A');
            efectos.push({ x: o.x, y: oy, txt: (centro ? '¡CENTRO! +' : '+') + base * mult + (mult > 1 ? '  x' + mult : ''), col: '#FFD54A', t: 1.2 });
          }
          break;
        }
      }
      if (!acierto) { combo = 0; }
    }
    c.addEventListener('pointerdown', disparar);
    function acabar() {
      if (terminado) return; terminado = true;
      esperar(function () { api.fin('🏹 ¡Fin del torneo!', 'Los torneos y el tiro con arco fueron parte de la vida de la nobleza y las cortes reales durante siglos. ¡Puntería de rey!', puntos); }, 500);
    }

    var parar = bucle(function (dt) {
      t0 += dt;
      if (!terminado) {
        tiempo -= dt; if (tiempo <= 0) { tiempo = 0; acabar(); }
        espera -= dt; if (espera <= 0) { nuevo(); espera = Math.max(0.45, 1.0 - (45 - tiempo) / 90); }
        objetivos.forEach(function (o) { o.x += o.v * dt; });
        objetivos = objetivos.filter(function (o) { return o.x > -100 && o.x < 900; });
      }
      flechas.forEach(function (f) { f.t -= dt; }); flechas = flechas.filter(function (f) { return f.t > 0; });
      efectos.forEach(function (f) { f.t -= dt; f.y -= 34 * dt; }); efectos = efectos.filter(function (f) { return f.t > 0; });
      parts = moverChispas(parts, dt);

      var cielo = x.createLinearGradient(0, 0, 0, 500);
      cielo.addColorStop(0, '#6a3bd1'); cielo.addColorStop(0.7, '#e08bd6'); cielo.addColorStop(1, '#ffcf8a');
      x.fillStyle = cielo; x.fillRect(0, 0, 800, 500);
      x.fillStyle = '#3b2a6e';                                             // castillo al fondo
      [[40, 330, 90, 170], [160, 380, 70, 120], [620, 340, 100, 160], [730, 390, 60, 110]].forEach(function (r) { x.fillRect(r[0], r[1], r[2], r[3]); for (var k = 0; k < r[2]; k += 20) x.fillRect(r[0] + k, r[1] - 12, 12, 12); });
      x.fillStyle = '#2f7a3a'; x.fillRect(0, 460, 800, 40);
      x.textAlign = 'center'; x.textBaseline = 'middle';
      objetivos.forEach(function (o) {
        var oy = o.y + Math.sin(t0 * 2 + o.fase) * 14;
        if (o.paloma) { objeto(x, '🕊️', o.x, oy, 66, '#7CFFEA'); }
        else {
          x.save(); x.shadowColor = '#fff'; x.shadowBlur = 20;
          [['#FFFFFF', 1], ['#E8232F', 0.8], ['#FFFFFF', 0.6], ['#E8232F', 0.4], ['#FFD54A', 0.2]].forEach(function (a) {
            x.fillStyle = a[0]; x.beginPath(); x.arc(o.x, oy, o.r * a[1], 0, 7); x.fill(); x.shadowBlur = 0;
          });
          x.lineWidth = 4; x.strokeStyle = '#2a0f4d'; x.beginPath(); x.arc(o.x, oy, o.r, 0, 7); x.stroke(); x.restore();
        }
      });
      flechas.forEach(function (f) {
        x.globalAlpha = Math.min(1, f.t * 4); x.strokeStyle = '#fff'; x.lineWidth = 4;
        x.beginPath(); x.moveTo(400, 500); x.lineTo(f.x, f.y); x.stroke();
        x.font = '36px serif'; x.fillText('🏹', f.x, f.y); x.globalAlpha = 1;
      });
      x.font = '70px serif'; x.fillText('🏹', 400, 478);
      dibujarChispas(x, parts);
      efectos.forEach(function (f) { textoFlotante(x, f); });
      x.font = '900 26px Montserrat, sans-serif'; x.textAlign = 'left'; x.lineWidth = 6; x.strokeStyle = '#000'; x.fillStyle = '#fff';
      x.strokeText('⏱ ' + Math.ceil(tiempo) + ' s', 20, 36); x.fillText('⏱ ' + Math.ceil(tiempo) + ' s', 20, 36);
      if (combo >= 2) { x.textAlign = 'right'; x.fillStyle = '#FFD54A'; x.strokeText('🔥 Combo ' + combo, 780, 36); x.fillText('🔥 Combo ' + combo, 780, 36); }
    });
    return function () { parar(); };
  }

  // ---------- Lista de juegos ----------
  var JUEGOS = {
    marina:       { titulo: '🌊 Biología Marina · Pesca de basura', color: '#3786FF', crear: juegoMarina },
    cosmetologia: { titulo: '✨ Cosmetología · Limpia la cara',      color: '#32E34E', crear: juegoCosmetologia },
    mecanica:     { titulo: '⚙️ Mecánica · Arma el motor',           color: '#FF0B16', crear: juegoMecanica },
    arte:         { titulo: '🎨 Arte · Mezclador de colores',        color: '#FF6A13', crear: juegoArte },
    realeza:      { titulo: '👑 Realeza · Tesoro real',              color: '#BB3AFF', crear: juegoRealeza },
    marina2:       { titulo: '🐢 Biología Marina · Salva a la tortuga', color: '#3786FF', crear: juegoTortuga },
    cosmetologia2: { titulo: '🧴 Cosmetología · Rutina de cuidado',     color: '#32E34E', crear: juegoRutina },
    mecanica2:     { titulo: '🏎️ Mecánica · Ruta del motor',            color: '#FF0B16', crear: juegoRuta },
    arte2:         { titulo: '🌈 Arte · Lluvia de colores',             color: '#FF6A13', crear: juegoLluvia },
    realeza2:      { titulo: '🏹 Realeza · Torneo de arco',             color: '#BB3AFF', crear: juegoArco }
  };

  function superposicion(html) {
    var o = document.createElement('div');
    o.className = 'gm-inicio'; o.innerHTML = html;
    escena.appendChild(o);
    return o;
  }
  function empezar(o) {
    o.remove();
    estado = 'cuenta';
    var n = 3;
    var cu = superposicion('<div class="gm-cuenta"></div>');
    cu.classList.add('gm-transparente');
    function tic() {
      if (n > 0) { cu.firstChild.textContent = n; cu.firstChild.style.animation = 'none'; void cu.offsetWidth; cu.firstChild.style.animation = ''; bip('ok'); n--; esperar(tic, 700); }
      else { cu.firstChild.textContent = '¡YA!'; bip('gana'); esperar(function () { cu.remove(); pausado = false; estado = 'juego'; }, 450); }
    }
    tic();
  }
  function pausar(si) {
    if (estado !== 'juego' && estado !== 'pausa') return;
    var ya = estado === 'pausa';
    if (si === ya) return;
    var ov = escena.querySelector('.gm-pausa');
    if (si) {
      estado = 'pausa'; pausado = true;
      var o = superposicion('<h3>⏸ Pausa</h3><button class="gm-btn" id="gmSeguir">▶ Seguir jugando</button>');
      o.classList.add('gm-pausa');
      o.querySelector('#gmSeguir').onclick = function () { pausar(false); };
    } else {
      if (ov) ov.remove();
      estado = 'juego'; pausado = false;
    }
    if (pausaEl) pausaEl.textContent = si ? '▶' : '⏸';
  }

  function iniciar(clave) {
    sesion++;
    if (limpieza) { limpieza(); limpieza = null; }
    escena.innerHTML = '';
    claveActual = clave;
    pausado = true; estado = 'intro';
    if (pausaEl) pausaEl.textContent = '⏸';
    limpieza = JUEGOS[clave].crear();       // el juego se prepara, pero espera detrás de la pantalla de inicio
    var o = superposicion('<h3></h3><p class="gm-instr"></p><div class="gm-estrellas-guia"></div><button class="gm-btn" id="gmEmpezar">¡JUGAR! ▶</button>');
    o.querySelector('h3').textContent = JUEGOS[clave].titulo;
    o.querySelector('.gm-instr').textContent = ayudaEl.textContent;
    var u = ESTRELLAS[clave] || [100, 250, 450];
    o.querySelector('.gm-estrellas-guia').textContent = '★ ' + u[0] + ' pts   ★★ ' + u[1] + ' pts   ★★★ ' + u[2] + ' pts';
    var btn = o.querySelector('#gmEmpezar');
    btn.onclick = function () { empezar(o); };
    btn.focus();
  }
  function abrir(clave) {
    var j = JUEGOS[clave];
    tituloEl.textContent = j.titulo;
    ventana.style.setProperty('--c', j.color);
    gm.hidden = false; document.body.style.overflow = 'hidden';
    iniciar(clave);
  }
  function cerrar() {
    sesion++;
    if (limpieza) { limpieza(); limpieza = null; }
    escena.innerHTML = ''; gm.hidden = true; document.body.style.overflow = '';
    pausado = false; estado = 'fin';
  }

  document.querySelectorAll('[data-juego]').forEach(function (b) {
    b.addEventListener('click', function () { abrir(b.dataset.juego); });
  });
  if (pausaEl) pausaEl.addEventListener('click', function () { pausar(estado === 'juego'); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && estado === 'juego') pausar(true); });
  document.addEventListener('keydown', function (e) {
    if (gm.hidden) return;
    if (e.key === 'p' || e.key === 'P') pausar(estado === 'juego');
  });
  var btnSonido = document.getElementById('gmSonido');
  if (btnSonido) {
    btnSonido.textContent = sonidoOn ? '🔊' : '🔇';
    btnSonido.addEventListener('click', function () {
      sonidoOn = !sonidoOn; btnSonido.textContent = sonidoOn ? '🔊' : '🔇';
      try { localStorage.setItem('lunix-sonido', sonidoOn ? 'si' : 'no'); } catch (e) {}
    });
  }
  document.getElementById('gmCerrar').addEventListener('click', cerrar);
  gm.addEventListener('click', function (e) { if (e.target === gm) cerrar(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !gm.hidden) cerrar(); });
  mostrarMejores();
  mostrarRacha();
})();
