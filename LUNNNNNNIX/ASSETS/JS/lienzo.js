/* LUNIX · Lienzo libre (Arte)
   Tres capas: fondo (papel), pintura (lo que dibujas) y trazo (el pincel en curso). */
(function () {
  'use strict';
  var W = 1100, H = 700;
  var fondo = document.getElementById('fondo'), pintura = document.getElementById('pintura'), trazo = document.getElementById('trazo');
  [fondo, pintura, trazo].forEach(function (c) { c.width = W; c.height = H; });
  var fx = fondo.getContext('2d'), px = pintura.getContext('2d', { willReadFrequently: true }), tx = trazo.getContext('2d');

  var herramienta = 'pincel', color = '#1f5bff', tam = 18, opa = 100, simetria = 'off', papelActual = 'blanco';
  var COLORES = ['#000000', '#4a4a4a', '#9e9e9e', '#ffffff', '#7b3f00', '#c68642', '#f5cba7', '#ff1f2d',
                 '#ff6a13', '#ffa424', '#ffe600', '#b9f609', '#27d63c', '#0b8f4d', '#35b8ff', '#1f5bff',
                 '#1a237e', '#8450ff', '#bb3aff', '#f238ff', '#f40898', '#ff8fa3', '#00c9a7', '#ffd9b3'];
  var recientes = [];

  /* ---------- Papeles ---------- */
  function ruido() {
    var t = document.createElement('canvas'); t.width = t.height = 200;
    var c = t.getContext('2d');
    for (var i = 0; i < 5000; i++) {
      c.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.07)';
      c.fillRect(Math.random() * 200, Math.random() * 200, 1.4, 1.4);
    }
    return fx.createPattern(t, 'repeat');
  }
  function degradado(stops) {
    return function () {
      var g = fx.createLinearGradient(0, 0, 0, H);
      stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
      fx.fillStyle = g; fx.fillRect(0, 0, W, H);
    };
  }
  var PAPELES = [
    { id: 'blanco', n: 'Blanco', css: '#fffdf8', f: function () { fx.fillStyle = '#fffdf8'; fx.fillRect(0, 0, W, H); } },
    { id: 'crema', n: 'Crema', css: '#f3e6c8', f: function () { fx.fillStyle = '#f3e6c8'; fx.fillRect(0, 0, W, H); } },
    { id: 'cielo', n: 'Cielo', css: 'linear-gradient(#6ec6ff,#e8f6ff)', f: degradado([[0, '#6ec6ff'], [1, '#e8f6ff']]) },
    { id: 'atardecer', n: 'Atardecer', css: 'linear-gradient(#2b1055,#d53369,#ffb347)', dark: true, f: degradado([[0, '#2b1055'], [0.55, '#d53369'], [1, '#ffb347']]) },
    { id: 'noche', n: 'Noche', css: 'linear-gradient(#05051a,#1b1f5e)', dark: true, f: function () {
        degradado([[0, '#05051a'], [1, '#1b1f5e']])();
        for (var i = 0; i < 130; i++) { fx.fillStyle = 'rgba(255,255,255,' + (0.3 + Math.random() * 0.7) + ')'; fx.beginPath(); fx.arc(Math.random() * W, Math.random() * H * 0.8, Math.random() * 1.7 + 0.3, 0, 7); fx.fill(); }
      } },
    { id: 'pizarra', n: 'Pizarra', css: '#2f3b34', dark: true, f: function () { fx.fillStyle = '#2f3b34'; fx.fillRect(0, 0, W, H); } }
  ];
  var patronRuido = null;
  function pintarPapel(id) {
    papelActual = id;
    var p = PAPELES.filter(function (q) { return q.id === id; })[0];
    p.f();
    patronRuido = patronRuido || ruido();
    fx.fillStyle = patronRuido; fx.fillRect(0, 0, W, H);
    document.querySelectorAll('.papel').forEach(function (b) { b.classList.toggle('activa', b.dataset.papel === id); });
  }

  /* ---------- Historial (deshacer / rehacer) ---------- */
  var pila = [], rehacerPila = [];
  var btnDes = document.getElementById('deshacer'), btnReh = document.getElementById('rehacer');
  function botones() { btnDes.disabled = !pila.length; btnReh.disabled = !rehacerPila.length; }
  function guardarEstado() {
    pila.push(px.getImageData(0, 0, W, H)); if (pila.length > 12) pila.shift();
    rehacerPila.length = 0; botones();
  }
  function deshacer() {
    if (!pila.length) return;
    rehacerPila.push(px.getImageData(0, 0, W, H)); px.putImageData(pila.pop(), 0, 0); botones();
  }
  function rehacer() {
    if (!rehacerPila.length) return;
    pila.push(px.getImageData(0, 0, W, H)); px.putImageData(rehacerPila.pop(), 0, 0); botones();
  }

  /* ---------- Simetría ---------- */
  var CX = W / 2, CY = H / 2;
  function rot(a) { return function (c) { c.translate(CX, CY); c.rotate(a); c.translate(-CX, -CY); }; }
  function espejoX(c) { c.translate(CX, 0); c.scale(-1, 1); c.translate(-CX, 0); }
  function espejoY(c) { c.translate(0, CY); c.scale(1, -1); c.translate(0, -CY); }
  function rotMirror(a) { return function (c) { rot(a)(c); espejoX(c); }; }
  function id() {}
  var TRANSF = {
    off: [id],
    espejo: [id, espejoX],
    x4: [id, espejoX, espejoY, rot(Math.PI)],
    rad6: [0, 1, 2, 3, 4, 5].map(function (i) { return rot(i * Math.PI / 3); }),
    mandala: [0, 1, 2, 3, 4, 5, 6, 7].reduce(function (l, i) { l.push(rot(i * Math.PI / 4), rotMirror(i * Math.PI / 4)); return l; }, [])
  };
  function conSimetria(ctx, fn) {
    TRANSF[simetria].forEach(function (t) { ctx.save(); t(ctx); fn(); ctx.restore(); });
  }

  /* ---------- Pinceles ---------- */
  var BUFER = { pincel: 1, marcador: 1 };   // se pintan en la capa "trazo" y se unen al soltar (intensidad pareja)
  var ESPACIO = { pincel: 0.1, marcador: 0.12, acuarela: 0.12, crayon: 0.18, spray: 0.25, borrador: 0.1 };

  function estampa(ctx, x, y, w) {
    var a = opa / 100;
    switch (herramienta) {
      case 'pincel':
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, w / 2, 0, 7); ctx.fill(); break;
      case 'marcador':
        ctx.fillStyle = color; ctx.translate(x, y); ctx.rotate(-Math.PI / 4);
        ctx.fillRect(-w * 0.62, -w * 0.16, w * 1.24, w * 0.32); break;
      case 'acuarela':
        var g = ctx.createRadialGradient(x, y, 0, x, y, w * 0.95);
        g.addColorStop(0, hexA(color, 0.10 * a)); g.addColorStop(0.7, hexA(color, 0.06 * a)); g.addColorStop(1, hexA(color, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, w * 0.95, 0, 7); ctx.fill(); break;
      case 'crayon':
        ctx.fillStyle = color; ctx.globalAlpha = 0.6 * a;
        for (var i = 0; i < w * 1.3; i++) {
          var an = Math.random() * 6.283, r = Math.sqrt(Math.random()) * w / 2;
          ctx.fillRect(x + Math.cos(an) * r, y + Math.sin(an) * r, 1.8, 1.8);
        }
        ctx.globalAlpha = 1; break;
      case 'spray':
        ctx.fillStyle = color; ctx.globalAlpha = 0.85 * a;
        for (var j = 0; j < w * 0.9; j++) {
          var an2 = Math.random() * 6.283, r2 = Math.sqrt(Math.random()) * w * 0.85;
          ctx.beginPath(); ctx.arc(x + Math.cos(an2) * r2, y + Math.sin(an2) * r2, Math.random() * 1.1 + 0.5, 0, 7); ctx.fill();
        }
        ctx.globalAlpha = 1; break;
      case 'borrador':
        ctx.globalCompositeOperation = 'destination-out'; ctx.globalAlpha = a;
        ctx.beginPath(); ctx.arc(x, y, w * 0.65, 0, 7); ctx.fill(); break;
    }
  }
  function hexRgb(h) { var n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function hexA(h, a) { var c = hexRgb(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  function segmento(ctx, a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    var paso = Math.max(1, Math.min(a.w, b.w) * (ESPACIO[herramienta] || 0.12));
    var n = Math.max(1, Math.ceil(d / paso));
    for (var i = 1; i <= n; i++) {
      var t = i / n, xx = a.x + dx * t, yy = a.y + dy * t, ww = a.w + (b.w - a.w) * t;
      conSimetria(ctx, function () { estampa(ctx, xx, yy, ww); });
    }
  }

  /* ---------- Relleno ---------- */
  function rellenar(x0, y0) {
    x0 = Math.max(0, Math.min(W - 1, x0 | 0)); y0 = Math.max(0, Math.min(H - 1, y0 | 0));
    var img = px.getImageData(0, 0, W, H), d = img.data, i0 = (y0 * W + x0) * 4;
    var tr = d[i0], tg = d[i0 + 1], tb = d[i0 + 2], ta = d[i0 + 3], c = hexRgb(color), al = Math.round(255 * opa / 100);
    function igual(i) { return Math.abs(d[i] - tr) + Math.abs(d[i + 1] - tg) + Math.abs(d[i + 2] - tb) + Math.abs(d[i + 3] - ta) <= 110; }
    if (ta === al && tr === c[0] && tg === c[1] && tb === c[2]) return false;
    var visto = new Uint8Array(W * H), pila2 = [[x0, y0]];
    while (pila2.length) {
      var p = pila2.pop(), x = p[0], y = p[1];
      while (x >= 0 && !visto[y * W + x] && igual((y * W + x) * 4)) x--;
      x++;
      var arriba = false, abajo = false;
      while (x < W && !visto[y * W + x] && igual((y * W + x) * 4)) {
        var k = y * W + x; visto[k] = 1;
        d[k * 4] = c[0]; d[k * 4 + 1] = c[1]; d[k * 4 + 2] = c[2]; d[k * 4 + 3] = al;
        if (y > 0) { var u = igual(((y - 1) * W + x) * 4) && !visto[(y - 1) * W + x]; if (u && !arriba) { pila2.push([x, y - 1]); arriba = true; } else if (!u) arriba = false; }
        if (y < H - 1) { var v = igual(((y + 1) * W + x) * 4) && !visto[(y + 1) * W + x]; if (v && !abajo) { pila2.push([x, y + 1]); abajo = true; } else if (!v) abajo = false; }
        x++;
      }
    }
    px.putImageData(img, 0, 0);
    return true;
  }

  /* ---------- Gotero ---------- */
  function copiarColor(x, y) {
    x = Math.max(0, Math.min(W - 1, x | 0)); y = Math.max(0, Math.min(H - 1, y | 0));
    var a = px.getImageData(x, y, 1, 1).data, b = fx.getImageData(x, y, 1, 1).data, al = a[3] / 255;
    var r = Math.round(a[0] * al + b[0] * (1 - al)), g = Math.round(a[1] * al + b[1] * (1 - al)), bl = Math.round(a[2] * al + b[2] * (1 - al));
    ponerColor('#' + [r, g, bl].map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join(''));
  }

  /* ---------- Puntero ---------- */
  var dibujando = false, ultimo = null, ultimoT = 0, anillo = document.getElementById('anillo');
  function pos(e) {
    var r = trazo.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height,
             pen: e.pointerType === 'pen' ? (e.pressure || 0.5) : 0, t: e.timeStamp };
  }
  function anchoDe(p, prev) {
    var objetivo;
    if (p.pen) objetivo = tam * (0.35 + p.pen * 1.0);
    else {
      var v = prev ? Math.hypot(p.x - prev.x, p.y - prev.y) / Math.max(1, p.t - prev.t) : 0;   // px por ms
      objetivo = tam * Math.max(0.6, Math.min(1.15, 1.2 - v * 0.3));
      if (herramienta === 'borrador' || herramienta === 'marcador' || herramienta === 'spray') objetivo = tam;
    }
    return prev ? prev.w + (objetivo - prev.w) * 0.3 : objetivo;
  }
  function recordarColor() {
    if (herramienta === 'borrador') return;
    recientes = [color].concat(recientes.filter(function (c) { return c !== color; })).slice(0, 8);
    pintarRecientes();
  }

  trazo.addEventListener('pointerdown', function (e) {
    if (e.button && e.button !== 0) return;
    e.preventDefault();
    var p = pos(e);
    if (herramienta === 'gotero') { copiarColor(p.x, p.y); return; }
    if (herramienta === 'cubeta') { guardarEstado(); if (!rellenar(p.x, p.y)) { pila.pop(); botones(); } else recordarColor(); return; }
    try { trazo.setPointerCapture(e.pointerId); } catch (er) {}
    guardarEstado(); recordarColor();
    dibujando = true;
    p.w = anchoDe(p, null); ultimo = p;
    trazo.style.opacity = BUFER[herramienta] ? opa / 100 : 1;
    var ctx = BUFER[herramienta] ? tx : px;
    segmento(ctx, { x: p.x, y: p.y, w: p.w }, p);
  });
  trazo.addEventListener('pointermove', function (e) {
    moverAnillo(e);
    if (!dibujando) return;
    var lista = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    if (!lista.length) lista = [e];
    var ctx = BUFER[herramienta] ? tx : px;
    lista.forEach(function (ev) {
      var p = pos(ev);
      // suavizado: el punto sigue al dedo con un poco de retraso para que la línea sea más limpia
      var s = herramienta === 'spray' || herramienta === 'crayon' ? 1 : 0.55;
      p.x = ultimo.x + (p.x - ultimo.x) * s; p.y = ultimo.y + (p.y - ultimo.y) * s;
      p.w = anchoDe(p, ultimo);
      segmento(ctx, ultimo, p);
      ultimo = p;
    });
  });
  function terminar() {
    if (!dibujando) return;
    dibujando = false;
    if (BUFER[herramienta]) {
      px.globalAlpha = opa / 100; px.drawImage(trazo, 0, 0); px.globalAlpha = 1;
      tx.clearRect(0, 0, W, H); trazo.style.opacity = 1;
    }
    px.globalCompositeOperation = 'source-over'; px.globalAlpha = 1;
  }
  trazo.addEventListener('pointerup', terminar);
  trazo.addEventListener('pointercancel', terminar);
  trazo.addEventListener('pointerleave', function () { anillo.hidden = true; });
  trazo.addEventListener('pointerenter', function (e) { moverAnillo(e); });

  function moverAnillo(e) {
    if (e.pointerType === 'touch') { anillo.hidden = true; return; }
    var r = trazo.getBoundingClientRect(), esc = r.width / W;
    var d = Math.max(6, (herramienta === 'gotero' || herramienta === 'cubeta' ? 10 : tam) * esc);
    anillo.hidden = false;
    anillo.style.width = anillo.style.height = d + 'px';
    anillo.style.left = e.clientX + 'px'; anillo.style.top = e.clientY + 'px';
  }

  /* ---------- Interfaz ---------- */
  var paletaEl = document.getElementById('paleta'), recEl = document.getElementById('recientes');
  var inputColor = document.getElementById('colorLibre');
  function botonColor(c) {
    var b = document.createElement('button'); b.className = 'col'; b.style.background = c; b.dataset.c = c; b.setAttribute('aria-label', 'Color ' + c);
    b.onclick = function () { ponerColor(c); };
    return b;
  }
  COLORES.forEach(function (c) { paletaEl.appendChild(botonColor(c)); });
  function pintarRecientes() { recEl.innerHTML = ''; recientes.forEach(function (c) { recEl.appendChild(botonColor(c)); }); marcarColor(); }
  function marcarColor() { document.querySelectorAll('.col').forEach(function (b) { b.classList.toggle('activa', b.dataset.c === color); }); }
  function ponerColor(c) {
    color = c; inputColor.value = c; marcarColor(); vistaPincel();
    if (herramienta === 'borrador' || herramienta === 'gotero') seleccionar('pincel');
  }
  inputColor.addEventListener('input', function () { color = inputColor.value; marcarColor(); vistaPincel(); if (herramienta === 'borrador' || herramienta === 'gotero') seleccionar('pincel'); });

  function seleccionar(h) {
    herramienta = h;
    document.querySelectorAll('.herr').forEach(function (b) { b.classList.toggle('activa', b.dataset.herr === h); });
  }
  document.querySelectorAll('.herr').forEach(function (b) { b.onclick = function () { seleccionar(b.dataset.herr); }; });

  var tamEl = document.getElementById('tam'), opaEl = document.getElementById('opa'), vTam = document.getElementById('vTam'), vOpa = document.getElementById('vOpa'), vista = document.getElementById('vistaPincel');
  function vistaPincel() {
    vTam.textContent = tam; vOpa.textContent = opa + '%';
    var d = Math.min(60, tam); vista.style.width = vista.style.height = d + 'px';
    vista.style.background = color; vista.style.opacity = opa / 100;
  }
  tamEl.oninput = function () { tam = +tamEl.value; vistaPincel(); };
  opaEl.oninput = function () { opa = +opaEl.value; vistaPincel(); };

  document.querySelectorAll('#simetria .chip').forEach(function (b) {
    b.onclick = function () {
      simetria = b.dataset.sim;
      document.querySelectorAll('#simetria .chip').forEach(function (c) { c.classList.toggle('activa', c === b); });
    };
  });

  var papelesEl = document.getElementById('papeles');
  PAPELES.forEach(function (p) {
    var b = document.createElement('button'); b.className = 'papel' + (p.dark ? ' dark' : ''); b.dataset.papel = p.id;
    b.style.background = p.css; b.textContent = p.n; b.onclick = function () { pintarPapel(p.id); };
    papelesEl.appendChild(b);
  });

  btnDes.onclick = deshacer; btnReh.onclick = rehacer;
  document.getElementById('limpiar').onclick = function () { guardarEstado(); px.clearRect(0, 0, W, H); };
  document.getElementById('guardar').onclick = function () {
    var out = document.createElement('canvas'); out.width = W; out.height = H;
    var o = out.getContext('2d'); o.drawImage(fondo, 0, 0); o.drawImage(pintura, 0, 0);
    var a = document.createElement('a'); a.download = 'mi-obra-lunix.png'; a.href = out.toDataURL('image/png');
    document.body.appendChild(a); a.click(); a.remove();
  };

  document.addEventListener('keydown', function (e) {
    if (e.target && e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
    var k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? rehacer() : deshacer(); }
    else if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); rehacer(); }
    else if (k === 'b') seleccionar('pincel');
    else if (k === 'e') seleccionar('borrador');
    else if (k === '[') { tam = Math.max(2, tam - 4); tamEl.value = tam; vistaPincel(); }
    else if (k === ']') { tam = Math.min(90, tam + 4); tamEl.value = tam; vistaPincel(); }
  });

  pintarPapel('blanco'); marcarColor(); vistaPincel(); botones();
})();
