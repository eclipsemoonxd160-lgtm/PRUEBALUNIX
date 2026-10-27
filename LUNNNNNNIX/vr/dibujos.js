/* =====================================================================
   dibujos.js
   Dibujos 2D (canvas) que se usan como texturas del Xandro 3D:
   la cara con sus expresiones, la portada del libro, la capa y los brillos.
   ===================================================================== */

var TINTA = "#2b1245";

/* ---------- CARA ----------
   p = { abL, abR   -> apertura de cada ojo (0 cerrado, 1 normal, 1.2 muy abierto)
         mx, my     -> hacia dónde mira (-1 a 1)
         sonr       -> sonrisa (-0.3 triste ... 1 sonrisa grande)
         boca       -> apertura de la boca (0 cerrada ... 1 muy abierta)
         ancho      -> ancho de la boca
         cejaL, cejaR -> altura de cada ceja (-1 baja ... 1 alta)
         feliz      -> 1 = ojos felices en forma de arco
         rub        -> intensidad del rubor (0 a 1) }
*/
function dibujarCara(g, p) {
  g.clearRect(0, 0, 512, 384);

  // rubor
  g.fillStyle = "rgba(255,105,140," + (0.3 + 0.4 * p.rub) + ")";
  [[96, 270], [416, 270]].forEach(function (c) {
    g.beginPath();
    g.ellipse(c[0], c[1], 36, 21, 0, 0, Math.PI * 2);
    g.fill();
  });

  _ojo(g, 160, 172, p.abL, p, 1);
  _ojo(g, 352, 172, p.abR, p, -1);
  _ceja(g, 160, 172, p.cejaL);
  _ceja(g, 352, 172, p.cejaR);
  _boca(g, p);
}

function _chispa(g, x, y, r) {
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.moveTo(x, y - r);
  g.quadraticCurveTo(x, y, x + r, y);
  g.quadraticCurveTo(x, y, x, y + r);
  g.quadraticCurveTo(x, y, x - r, y);
  g.quadraticCurveTo(x, y, x, y - r);
  g.fill();
}

function _pestanas(g, cx, cy, lado) {
  const ox = -lado; // hacia afuera de la cara
  g.strokeStyle = TINTA;
  g.lineWidth = 9;
  g.beginPath();
  g.moveTo(cx + ox * 58, cy - 8);
  g.lineTo(cx + ox * 84, cy - 30);
  g.moveTo(cx + ox * 63, cy + 8);
  g.lineTo(cx + ox * 90, cy - 4);
  g.stroke();
}

function _ojo(g, cx, cy, ab, p, lado) {
  const rx = 66, ry = 80;
  g.lineCap = "round";
  g.lineJoin = "round";

  const feliz = p.feliz > 0.55;
  if (feliz || ab < 0.14) {
    // ojo cerrado: arco feliz ^ o línea suave
    g.strokeStyle = TINTA;
    g.lineWidth = 15;
    g.beginPath();
    if (feliz) g.arc(cx, cy + 30, 50, Math.PI * 1.1, Math.PI * 1.9);
    else { g.moveTo(cx - 54, cy + 4); g.quadraticCurveTo(cx, cy + 34, cx + 54, cy + 4); }
    g.stroke();
    _pestanas(g, cx, cy + (feliz ? -18 : 8), lado);
    return;
  }

  const h = Math.min(ab, 1.25) * ry;

  // blanco del ojo
  g.fillStyle = "#ffffff";
  g.strokeStyle = TINTA;
  g.lineWidth = 6;
  g.beginPath();
  g.ellipse(cx, cy, rx, h, 0, 0, Math.PI * 2);
  g.fill();
  g.stroke();

  // todo lo de adentro se recorta al contorno del ojo
  g.save();
  g.beginPath();
  g.ellipse(cx, cy, rx - 2, h - 2, 0, 0, Math.PI * 2);
  g.clip();

  const ix = cx + p.mx * 18;
  const iy = cy + p.my * 22;
  const irx = 48;
  const iry = Math.min(58, h - 3);

  const grad = g.createRadialGradient(ix, iy + 8, 6, ix, iy, irx + 8);
  grad.addColorStop(0, "#7b5cf0");
  grad.addColorStop(0.55, "#3a2a9a");
  grad.addColorStop(1, "#170c48");
  g.fillStyle = grad;
  g.beginPath();
  g.ellipse(ix, iy, irx, iry, 0, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = "#0a0426";
  g.beginPath();
  g.ellipse(ix, iy + 2, 22, Math.min(28, iry * 0.5), 0, 0, Math.PI * 2);
  g.fill();

  // puntitos de galaxia
  g.fillStyle = "rgba(255,255,255,0.8)";
  [[-24, 18, 2.6], [20, 26, 2], [30, -6, 2.4], [-30, -4, 1.8], [6, 34, 1.8]].forEach(function (d) {
    g.beginPath();
    g.arc(ix + d[0], iy + d[1] * (iry / 58), d[2], 0, Math.PI * 2);
    g.fill();
  });

  // brillos
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.ellipse(ix - 16, iy - iry * 0.38, 13, 15, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.arc(ix + 17, iy + iry * 0.35, 6.5, 0, Math.PI * 2);
  g.fill();
  _chispa(g, ix + 22, iy - iry * 0.2, 9);
  g.restore();

  // pestañas superiores
  g.strokeStyle = TINTA;
  g.lineWidth = 12;
  g.beginPath();
  g.ellipse(cx, cy, rx + 3, h + 3, 0, Math.PI * 1.04, Math.PI * 1.96);
  g.stroke();
  _pestanas(g, cx, cy - 6, lado);
}

function _ceja(g, cx, cy, alto) {
  const y = cy - 112 - alto * 30;
  g.strokeStyle = TINTA;
  g.lineWidth = 13;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(cx - 50, y + 8);
  g.quadraticCurveTo(cx, y - 14, cx + 50, y + 8);
  g.stroke();
}

function _boca(g, p) {
  const cx = 256, cy = 302;
  const hw = 64 * p.ancho;
  const s = p.sonr;
  const a = p.boca;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = "#6b1030";
  g.lineWidth = 9;

  if (a < 0.08) {
    // boca cerrada: sonrisa
    g.beginPath();
    g.moveTo(cx - hw, cy - s * 6);
    g.quadraticCurveTo(cx, cy + s * 38 + 4, cx + hw, cy - s * 6);
    g.stroke();
    return;
  }

  const prof = 20 + a * 92;
  g.beginPath();
  g.moveTo(cx - hw, cy - s * 6);
  g.quadraticCurveTo(cx, cy + s * 10 - 6, cx + hw, cy - s * 6);
  g.bezierCurveTo(cx + hw * 0.9, cy + prof, cx - hw * 0.9, cy + prof, cx - hw, cy - s * 6);
  g.closePath();
  g.fillStyle = "#8c1a3b";
  g.fill();
  g.stroke();

  // lengua
  g.save();
  g.clip();
  g.fillStyle = "#ff8296";
  g.beginPath();
  g.ellipse(cx, cy + prof * 0.8, hw * 0.62, prof * 0.34, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

/* ---------- LIBRO (portada) ---------- */
function dibujarLibro(g, w, h) {
  const grad = g.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#2a1f78");
  grad.addColorStop(1, "#171150");
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);

  g.strokeStyle = "#e6b94a";
  g.lineWidth = 6;
  g.strokeRect(10, 10, w - 20, h - 20);
  g.lineWidth = 2;
  g.strokeRect(20, 20, w - 40, h - 40);

  g.fillStyle = "#f2c85b";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = "700 " + Math.round(w * 0.2) + "px Georgia, 'Times New Roman', serif";
  g.fillText("LUNIX", w / 2, h * 0.34);
  g.font = "500 " + Math.round(w * 0.1) + "px Georgia, 'Times New Roman', serif";
  g.fillText("Literary", w / 2, h * 0.5);
  g.fillText("Universe", w / 2, h * 0.58);

  // órbita con estrella
  g.strokeStyle = "#f2c85b";
  g.lineWidth = 3;
  g.beginPath();
  g.ellipse(w / 2, h * 0.79, w * 0.28, h * 0.05, -0.15, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "#f2c85b";
  const x = w / 2, y = h * 0.79, r = w * 0.08;
  g.beginPath();
  g.moveTo(x, y - r);
  g.quadraticCurveTo(x, y, x + r, y);
  g.quadraticCurveTo(x, y, x, y + r);
  g.quadraticCurveTo(x, y, x - r, y);
  g.quadraticCurveTo(x, y, x, y - r);
  g.fill();
}

/* ---------- CAPA (morada con borde dorado y estrellitas) ---------- */
function dibujarCapa(g, w, h) {
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#3b1d80");
  grad.addColorStop(1, "#6d42c8");
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);

  // estrellitas doradas (posiciones fijas para que no cambien)
  g.fillStyle = "rgba(255,214,102,0.95)";
  const pts = [[0.2, 0.3], [0.7, 0.25], [0.45, 0.5], [0.85, 0.6], [0.15, 0.7], [0.6, 0.82], [0.35, 0.9], [0.9, 0.9], [0.5, 0.15]];
  pts.forEach(function (q, i) {
    const x = q[0] * w, y = q[1] * h, r = 6 + (i % 3) * 3;
    g.beginPath();
    g.moveTo(x, y - r);
    g.quadraticCurveTo(x, y, x + r, y);
    g.quadraticCurveTo(x, y, x, y + r);
    g.quadraticCurveTo(x, y, x - r, y);
    g.quadraticCurveTo(x, y, x, y - r);
    g.fill();
  });

  // borde dorado a los lados y abajo
  g.strokeStyle = "#f5c451";
  g.lineWidth = 9;
  g.lineJoin = "round";
  g.beginPath();
  g.moveTo(5, 0);
  g.lineTo(5, h - 5);
  g.lineTo(w - 5, h - 5);
  g.lineTo(w - 5, 0);
  g.stroke();
}

/* ---------- Chispa dorada de 4 puntas (para la pluma) ---------- */
function dibujarChispa(g, s) {
  const c = s / 2;
  const glow = g.createRadialGradient(c, c, 0, c, c, c);
  glow.addColorStop(0, "rgba(255,226,140,0.9)");
  glow.addColorStop(0.35, "rgba(255,200,80,0.35)");
  glow.addColorStop(1, "rgba(255,200,80,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, s, s);

  g.fillStyle = "#fff6cf";
  const R = s * 0.46, r = s * 0.07;
  g.beginPath();
  g.moveTo(c, c - R);
  g.lineTo(c + r, c - r);
  g.lineTo(c + R, c);
  g.lineTo(c + r, c + r);
  g.lineTo(c, c + R);
  g.lineTo(c - r, c + r);
  g.lineTo(c - R, c);
  g.lineTo(c - r, c - r);
  g.closePath();
  g.fill();
}

/* ---------- Halo suave (aura) ---------- */
function dibujarHalo(g, s, rgb) {
  const c = s / 2;
  const grad = g.createRadialGradient(c, c, 0, c, c, c);
  grad.addColorStop(0, "rgba(" + rgb + ",0.9)");
  grad.addColorStop(0.5, "rgba(" + rgb + ",0.28)");
  grad.addColorStop(1, "rgba(" + rgb + ",0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
}

/* ---------- Matcap: bola de sombreado para que el personaje se vea con volumen ---------- */
function dibujarMatcap(g, s) {
  const c = s / 2;
  const grad = g.createRadialGradient(s * 0.39, s * 0.34, 8, c, c, s * 0.59);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.3, "#f6f6f6");
  grad.addColorStop(0.65, "#d6d6d6");
  grad.addColorStop(0.9, "#a4a4a4");
  grad.addColorStop(1, "#808080");
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  g.fillStyle = "rgba(255,255,255,0.9)";
  g.beginPath();
  g.ellipse(s * 0.34, s * 0.27, s * 0.13, s * 0.08, -0.6, 0, Math.PI * 2);
  g.fill();
}

if (typeof module !== "undefined") {
  module.exports = { dibujarCara: dibujarCara, dibujarLibro: dibujarLibro, dibujarCapa: dibujarCapa, dibujarChispa: dibujarChispa, dibujarHalo: dibujarHalo, dibujarMatcap: dibujarMatcap };
}
