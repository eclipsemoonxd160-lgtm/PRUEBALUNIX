/* =====================================================================
   LUNIX · Realidad Virtual
   Archivo: script.js
   Secciones:
     1) Configuración (aquí cambias textos, planetas y el webhook)
     2) Utilidades para dibujar textos en 3D
     3) Componentes de A-Frame (movimiento, órbitas, Xandro...)
     4) Voz de Xandro y chat con n8n
     5) Construcción de la escena
     6) Interfaz 2D (botones, chat, micrófono)
   ===================================================================== */

const THREE = AFRAME.THREE;
const $ = (s) => document.querySelector(s);

/* ---------------------------------------------------------------------
   1) CONFIGURACIÓN
   --------------------------------------------------------------------- */

// Webhook del chat de Xandro en n8n (workflow "con voz")
const WEBHOOK_URL =
  "https://tomas78.app.n8n.cloud/webhook/b95277fb-9225-4baf-b1f1-4cbd3292dfd7/chat";

// Si es true, al entrar Xandro se presenta hablando (gasta un mensaje del agente)
const SALUDO_AUTOMATICO = true;

// Posición inicial del visitante y centro del sistema
const INICIO_CAMARA = new THREE.Vector3(0, 1.6, 14);
const CENTRO = new THREE.Vector3(0, 2.5, 0);

// Los 5 planetas. Puedes editar textos, colores y velocidades.
// "url": si pones una página (por ejemplo "mecanica.html") aparece el botón "Abrir página".
const PLANETAS = [
  {
    nombre: "Mecánica", color: "#ff7043", radio: 4.4, tam: 0.55, vel: 9, inclinacion: 6, inicio: 20,
    texto: "Aquí aprenderás cómo están hechos los autos: el motor, los frenos, la suspensión y muchas piezas más.",
    url: ""
  },
  {
    nombre: "Arte", color: "#ab47bc", radio: 6.2, tam: 0.6, vel: 7, inclinacion: -5, inicio: 110,
    texto: "Un planeta para descubrir estilos, artistas y formas de expresar ideas con colores, líneas y formas.",
    url: ""
  },
  {
    nombre: "Realeza", color: "#5c6bc0", radio: 8.0, tam: 0.8, vel: 5.5, inclinacion: 9, inicio: 200, anillo: true,
    texto: "Historias de reyes, reinas y castillos: cómo vivían y cómo gobernaron los grandes reinos.",
    url: ""
  },
  {
    nombre: "Vida marina", color: "#26c6da", radio: 9.8, tam: 0.7, vel: 4.5, inclinacion: -8, inicio: 290,
    texto: "Explora el océano: peces, corales, ballenas y todos los seres que viven bajo el agua.",
    url: ""
  },
  {
    nombre: "Cosmetología", color: "#f06292", radio: 11.6, tam: 0.6, vel: 3.5, inclinacion: 4, inicio: 60,
    texto: "Conoce el cuidado de la piel, el cabello y la belleza, y la ciencia que hay detrás.",
    url: ""
  }
];

// Estado global compartido
const LUNIX = {
  hablando: false,   // true mientras Xandro habla (mueve su boca)
  pausa: false,      // true detiene las órbitas (cuando hay un panel abierto)
  vozActiva: true,   // botón 🔊 / 🔇
  pensando: false,   // true mientras Xandro espera la respuesta del agente
  emocion: null      // { tipo, hasta } expresión temporal de Xandro
};

// Hace que Xandro ponga una expresión por unos milisegundos.
// Tipos: "feliz", "sorpresa", "pensando", "guino"
LUNIX.emocionar = function (tipo, ms) {
  LUNIX.emocion = { tipo: tipo, hasta: performance.now() + ms };
};

const FUENTE = 'system-ui, "Segoe UI", Roboto, Arial, sans-serif';
const PX = 600; // píxeles por metro en las texturas de texto

/* ---------------------------------------------------------------------
   2) UTILIDADES PARA DIBUJAR TEXTO EN 3D
   Se dibuja en un canvas 2D y se usa como textura de un plano. Así los
   acentos, la ñ y los emojis siempre se ven bien.
   --------------------------------------------------------------------- */

function rectRedondeado(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Parte un texto en líneas que caben en "anchoMax" píxeles
function envolverTexto(ctx, texto, anchoMax) {
  const lineas = [];
  texto.split("\n").forEach(function (parrafo) {
    let actual = "";
    parrafo.split(/\s+/).forEach(function (palabra) {
      const prueba = actual ? actual + " " + palabra : palabra;
      if (ctx.measureText(prueba).width > anchoMax && actual) {
        lineas.push(actual);
        actual = palabra;
      } else {
        actual = prueba;
      }
    });
    lineas.push(actual);
  });
  return lineas;
}

// Crea un plano 3D (ancho x alto en metros) cuyo contenido se dibuja en un canvas
function crearPlano(ancho, alto) {
  const el = document.createElement("a-entity");
  const canvas = document.createElement("canvas");
  const mat = new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), mat);

  const plano = { el: el, canvas: canvas, ctx: canvas.getContext("2d"), mat: mat, mesh: mesh };

  // Cambia el tamaño (en metros) del plano y de su canvas
  plano.tamano = function (w, h) {
    plano.ancho = w;
    plano.alto = h;
    canvas.width = Math.max(2, Math.round(w * PX));
    canvas.height = Math.max(2, Math.round(h * PX));
    mesh.geometry.dispose();
    mesh.geometry = new THREE.PlaneGeometry(w, h);
  };

  // Sube el dibujo del canvas a la textura (llamar después de dibujar)
  plano.refrescar = function () {
    if (mat.map) mat.map.dispose();
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    mat.map = tex;
    mat.needsUpdate = true;
  };

  // Lo agrega a la escena dentro de "padre"
  plano.montar = function (padre) {
    padre.appendChild(el);
    el.setObject3D("mesh", mesh);
  };

  plano.tamano(ancho, alto);
  return plano;
}

// Texto suelto flotando (sin fondo)
function crearEtiqueta(texto, ancho, alto, color) {
  const p = crearPlano(ancho, alto);
  const ctx = p.ctx;
  let tam = Math.round(p.canvas.height * 0.72);
  ctx.font = "700 " + tam + "px " + FUENTE;
  while (ctx.measureText(texto).width > p.canvas.width - 12 && tam > 10) {
    tam -= 2;
    ctx.font = "700 " + tam + "px " + FUENTE;
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,.85)";
  ctx.shadowBlur = 14;
  ctx.fillStyle = color;
  ctx.fillText(texto, p.canvas.width / 2, p.canvas.height / 2 + 2);
  p.refrescar();
  return p;
}

// Botón 3D clicable (con el mouse, el dedo o el láser de los controles VR)
function crearBoton(padre, texto, x, y, ancho, alto, acento, alClic) {
  const b = crearPlano(ancho, alto);
  b.el.classList.add("clickable");
  b.el.setAttribute("position", x + " " + y + " 0.02");

  function dibujar(hover) {
    const ctx = b.ctx, w = b.canvas.width, h = b.canvas.height;
    ctx.clearRect(0, 0, w, h);
    rectRedondeado(ctx, 4, 4, w - 8, h - 8, h * 0.3);
    ctx.fillStyle = hover ? acento : "rgba(14,18,44,0.95)";
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = acento;
    ctx.stroke();

    let tam = Math.round(h * 0.4);
    ctx.font = "600 " + tam + "px " + FUENTE;
    while (ctx.measureText(texto).width > w - 28 && tam > 12) {
      tam -= 2;
      ctx.font = "600 " + tam + "px " + FUENTE;
    }
    ctx.fillStyle = hover ? "#000" : "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texto, w / 2, h / 2 + 2);
    b.refrescar();
  }

  dibujar(false);
  b.el.addEventListener("mouseenter", function () { dibujar(true); });
  b.el.addEventListener("mouseleave", function () { dibujar(false); });
  b.el.addEventListener("click", function () { alClic(); });
  b.montar(padre);
  return b;
}

function normalizarAngulo(a) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

/* ---------------------------------------------------------------------
   3) COMPONENTES DE A-FRAME
   --------------------------------------------------------------------- */

const V1 = new THREE.Vector3();

// Estrellas del fondo (siguen al visitante para que nunca se alcancen)
AFRAME.registerComponent("campo-estelar", {
  init: function () {
    const n = 2600;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const z = Math.random() * 2 - 1;
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - z * z);
      const dist = 70 + Math.random() * 60;
      pos[i * 3] = r * Math.cos(a) * dist;
      pos[i * 3 + 1] = z * dist;
      pos[i * 3 + 2] = r * Math.sin(a) * dist;
      c.setHSL(0.55 + Math.random() * 0.15, 0.4, 0.75 + Math.random() * 0.25);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.9, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false
    });
    const puntos = new THREE.Points(geo, mat);
    puntos.frustumCulled = false;
    this.el.setObject3D("puntos", puntos);
  },
  tick: function (t, dt) {
    const cam = this.el.sceneEl.camera;
    if (cam) cam.getWorldPosition(this.el.object3D.position);
    this.el.object3D.rotation.y += dt * 0.000005;
  }
});

// Gira alrededor del centro (órbita). Se detiene si LUNIX.pausa es true
AFRAME.registerComponent("orbita", {
  schema: { velocidad: { default: 5 }, inicio: { default: 0 } },
  init: function () {
    this.el.object3D.rotation.y = THREE.MathUtils.degToRad(this.data.inicio);
  },
  tick: function (t, dt) {
    if (LUNIX.pausa) return;
    this.el.object3D.rotation.y += THREE.MathUtils.degToRad(this.data.velocidad) * dt / 1000;
  }
});

// Gira sobre su propio eje
AFRAME.registerComponent("girar", {
  schema: { velocidad: { default: 12 } },
  tick: function (t, dt) {
    this.el.object3D.rotation.y += THREE.MathUtils.degToRad(this.data.velocidad) * dt / 1000;
  }
});

// Mira siempre hacia el visitante (usa la cámara real, también en VR)
AFRAME.registerComponent("mirar-camara", {
  tick: function () {
    const cam = this.el.sceneEl.camera;
    if (!cam) return;
    cam.getWorldPosition(V1);
    this.el.object3D.lookAt(V1);
  }
});

// Textura procedural para los planetas (bandas y manchas de colores)
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function texturaPlaneta(base, semilla) {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 256;
  const g = c.getContext("2d");
  const rnd = mulberry32(semilla);
  g.fillStyle = base;
  g.fillRect(0, 0, 512, 256);
  for (let y = 0; y < 256;) {
    const h = 6 + rnd() * 26;
    g.fillStyle = rnd() > 0.5
      ? "rgba(255,255,255," + (0.04 + rnd() * 0.14) + ")"
      : "rgba(0,0,0," + (0.05 + rnd() * 0.18) + ")";
    g.fillRect(0, y, 512, h);
    y += h;
  }
  for (let i = 0; i < 90; i++) {
    g.fillStyle = rnd() > 0.5 ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.09)";
    g.beginPath();
    g.ellipse(rnd() * 512, rnd() * 256, 6 + rnd() * 26, 3 + rnd() * 12, 0, 0, Math.PI * 2);
    g.fill();
  }
  return c;
}

AFRAME.registerComponent("planeta-procedural", {
  schema: { color: { default: "#ffffff" }, semilla: { default: 1 } },
  init: function () {
    const el = this.el;
    const aplicar = () => {
      const mesh = el.getObject3D("mesh");
      if (!mesh || !mesh.material) return;
      const tex = new THREE.CanvasTexture(texturaPlaneta(this.data.color, this.data.semilla));
      tex.colorSpace = THREE.SRGBColorSpace;
      mesh.material.map = tex;
      mesh.material.emissive = new THREE.Color(0xffffff);
      mesh.material.emissiveMap = tex;
      mesh.material.emissiveIntensity = 0.3; // así nunca se ve negro
      mesh.material.needsUpdate = true;
    };
    if (el.hasLoaded) aplicar();
    else el.addEventListener("loaded", aplicar);
  }
});

// Xandro te acompaña: flota delante de ti, un poco a la derecha, siguiéndote con suavidad
AFRAME.registerComponent("companero", {
  schema: {
    adelante: { default: 1.7 },
    derecha: { default: 0.75 },
    abajo: { default: 0.12 }
  },
  init: function () {
    this.primera = true;
    this.pos = new THREE.Vector3();
    this.q = new THREE.Quaternion();
    this.fwd = new THREE.Vector3();
    this.fwdH = new THREE.Vector3(0, 0, -1);
    this.der = new THREE.Vector3();
    this.dest = new THREE.Vector3();
  },
  tick: function (t, dt) {
    const cam = this.el.sceneEl.camera;
    if (!cam) return;
    cam.getWorldPosition(this.pos);
    cam.getWorldQuaternion(this.q);

    // dirección hacia donde mira el visitante, sin inclinación vertical
    this.fwd.set(0, 0, -1).applyQuaternion(this.q);
    this.fwd.y = 0;
    if (this.fwd.lengthSq() > 0.01) this.fwdH.copy(this.fwd).normalize();
    this.der.set(-this.fwdH.z, 0, this.fwdH.x);

    this.dest.copy(this.pos)
      .addScaledVector(this.fwdH, this.data.adelante)
      .addScaledVector(this.der, this.data.derecha);
    this.dest.y -= this.data.abajo;

    if (this.primera) {
      this.el.object3D.position.copy(this.dest);
      this.primera = false;
    } else {
      this.el.object3D.position.lerp(this.dest, 1 - Math.exp(-3 * dt / 1000));
    }
  }
});

// El visitante vuela suavemente hacia un planeta (o hacia un punto fijo)
AFRAME.registerComponent("navegante", {
  init: function () {
    this.vuelo = null;
    this.camEl = document.querySelector("#camara");
    this.A = new THREE.Vector3();
    this.B = new THREE.Vector3();
    this.D = new THREE.Vector3();
    // si el usuario se mueve con el teclado, se cancela el vuelo automático
    window.addEventListener("keydown", (e) => {
      const t = document.activeElement && document.activeElement.tagName;
      if (t === "INPUT" || t === "TEXTAREA") return;
      if ("wasdWASD".indexOf(e.key) >= 0 || e.key.indexOf("Arrow") === 0) this.cancelar();
    });
  },

  // opciones: { objeto, dist, fijo, mirarA, alLlegar }
  volar: function (op) {
    const enVR = this.el.sceneEl.is("vr-mode");
    if (!enVR) {
      // pasa el desplazamiento horizontal de la cámara (por WASD) al "rig"
      const cam = this.camEl.object3D, rig = this.el.object3D;
      this.A.copy(cam.position);
      this.A.y = 0;
      this.A.applyQuaternion(rig.quaternion);
      rig.position.add(this.A);
      cam.position.x = 0;
      cam.position.z = 0;
      const lc = this.camEl.components["look-controls"];
      if (lc) lc.yawObject.rotation.y = normalizarAngulo(lc.yawObject.rotation.y);
    }
    this.vuelo = Object.assign({ t: 0 }, op);
  },

  cancelar: function () {
    if (!this.vuelo) return;
    this.vuelo = null;
    this.el.sceneEl.emit("vuelo-cancelado");
  },

  tick: function (t, dt) {
    const v = this.vuelo;
    if (!v) return;
    v.t += dt;

    const enVR = this.el.sceneEl.is("vr-mode");
    const rig = this.el.object3D;
    const f = 1 - Math.exp(-2.4 * dt / 1000);

    const C = this.A;  // posición real de la cámara
    this.el.sceneEl.camera.getWorldPosition(C);

    const P = this.B;  // punto que se quiere mirar
    if (v.objeto) v.objeto.getWorldPosition(P);
    else P.copy(v.mirarA);

    const D = this.D;  // dónde debe quedar la cámara
    if (v.fijo) {
      D.copy(v.fijo);
    } else {
      D.copy(C).sub(P);
      D.y *= 0.3;
      if (D.lengthSq() < 0.0001) D.set(0, 0, 1);
      D.normalize().multiplyScalar(v.dist).add(P);
    }

    // mover
    rig.position.x += (D.x - C.x) * f;
    rig.position.y += (D.y - C.y) * f;
    rig.position.z += (D.z - C.z) * f;

    // girar hacia el punto a mirar
    const yawObjetivo = Math.atan2(-(P.x - C.x), -(P.z - C.z));
    const dy = normalizarAngulo(yawObjetivo - rig.rotation.y);
    rig.rotation.y += dy * f;

    const lc = this.camEl.components["look-controls"];
    if (lc && !enVR) {
      lc.yawObject.rotation.y *= (1 - f);
      lc.pitchObject.rotation.x *= (1 - f);
    }

    const falta = Math.hypot(D.x - C.x, D.y - C.y, D.z - C.z);
    if ((falta < 0.1 && Math.abs(dy) < 0.04) || v.t > 7000) {
      this.vuelo = null;
      if (v.alLlegar) v.alLlegar();
    }
  }
});

// Movimiento con los controles de las gafas VR:
// palanca izquierda = moverse (vuela hacia donde miras), palanca derecha = girar
AFRAME.registerComponent("vr-locomocion", {
  schema: { velocidad: { default: 4 }, giro: { default: 80 } },
  init: function () {
    this.mover = { x: 0, y: 0 };
    this.girar = 0;
    this.camEl = document.querySelector("#camara");
    this.q = new THREE.Quaternion();
    this.dir = new THREE.Vector3();
    this.der = new THREE.Vector3();

    this.el.addEventListener("thumbstickmoved", (e) => {
      const x = Math.abs(e.detail.x) > 0.15 ? e.detail.x : 0;
      const y = Math.abs(e.detail.y) > 0.15 ? e.detail.y : 0;
      if (e.target.id === "manoIzq") this.mover = { x: x, y: y };
      else if (e.target.id === "manoDer") this.girar = x;
    });
  },
  tick: function (t, dt) {
    if (!this.el.sceneEl.is("vr-mode")) return;
    const s = dt / 1000;
    const rig = this.el.object3D;

    if (this.mover.x || this.mover.y) {
      this.el.components.navegante.cancelar();
      this.el.sceneEl.camera.getWorldQuaternion(this.q);
      this.dir.set(0, 0, -1).applyQuaternion(this.q);
      this.der.set(1, 0, 0).applyQuaternion(this.q);
      rig.position.addScaledVector(this.dir, -this.mover.y * this.data.velocidad * s);
      rig.position.addScaledVector(this.der, this.mover.x * this.data.velocidad * s);
    }
    if (this.girar) {
      rig.rotation.y -= THREE.MathUtils.degToRad(this.girar * this.data.giro * s);
    }
  }
});

/* ---------------------------------------------------------------------
   4) VOZ DE XANDRO Y CHAT CON N8N
   --------------------------------------------------------------------- */

const sessionId = "vr-" + Math.random().toString(36).slice(2) + Date.now();
let audioActual = null;
let vozNavegador = null;

// FUENTE_DE_VOZ: "colombiana" = voz del navegador en español de Colombia
//                 "elevenlabs" = el audio que manda n8n (voz Thorthugo u otra)
const FUENTE_DE_VOZ = "colombiana";

// Busca la voz más colombiana del dispositivo (hombre primero)
function cargarVozNavegador() {
  if (!("speechSynthesis" in window)) return;
  const es = speechSynthesis.getVoices().filter((v) => /^es/i.test(v.lang.replace("_", "-")));
  const hombre = /gonzalo|carlos|jorge|diego|raul|raúl|pablo|alvaro|álvaro|andres|andrés|juan|male|hombre/i;
  const natural = /natural|neural|online/i;
  const co = es.filter((v) => /^es[-_]CO/i.test(v.lang) || /colombia/i.test(v.name));
  const latam = es.filter((v) => /^es[-_](MX|US|419|AR|CL|PE|VE)/i.test(v.lang));
  vozNavegador =
    co.find((v) => hombre.test(v.name) && natural.test(v.name)) ||
    co.find((v) => hombre.test(v.name)) ||
    co.find((v) => natural.test(v.name)) ||
    co[0] ||
    latam.find((v) => hombre.test(v.name) && natural.test(v.name)) ||
    latam.find((v) => hombre.test(v.name)) ||
    latam[0] ||
    es.find((v) => hombre.test(v.name)) ||
    es[0] || null;
}
if ("speechSynthesis" in window) {
  cargarVozNavegador();
  speechSynthesis.onvoiceschanged = cargarVozNavegador;
}

function detenerVoz() {
  if (audioActual) { audioActual.pause(); audioActual = null; }
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  LUNIX.hablando = false;
}

// Analizador de volumen: permite que la boca de Xandro siga la voz real
let ctxAudio = null, analizador = null, datosAnalisis = null;

function conectarAnalizador(audio) {
  try {
    if (!ctxAudio) ctxAudio = new (window.AudioContext || window.webkitAudioContext)();
    const fuente = ctxAudio.createMediaElementSource(audio);
    analizador = ctxAudio.createAnalyser();
    analizador.fftSize = 512;
    datosAnalisis = new Uint8Array(analizador.fftSize);
    fuente.connect(analizador);
    analizador.connect(ctxAudio.destination);
    if (ctxAudio.state === "suspended") ctxAudio.resume();
  } catch (e) {
    analizador = null; // sin analizador, la boca usa un movimiento de respaldo
  }
}

// Volumen actual de la voz (0 a 1)
function nivelVoz() {
  if (!analizador || !audioActual) return 0;
  analizador.getByteTimeDomainData(datosAnalisis);
  let suma = 0;
  for (let i = 0; i < datosAnalisis.length; i++) {
    const v = (datosAnalisis[i] - 128) / 128;
    suma += v * v;
  }
  return Math.min(1, Math.sqrt(suma / datosAnalisis.length) * 4);
}

// Voz de ElevenLabs: llega como mp3 en base64 dentro de la respuesta del chat
function reproducirBase64(b64) {
  detenerVoz();
  const a = new Audio("data:audio/mpeg;base64," + b64);
  audioActual = a;
  conectarAnalizador(a);
  a.onplay = function () { LUNIX.hablando = true; };
  a.onended = a.onpause = a.onerror = function () {
    if (audioActual === a) LUNIX.hablando = false;
  };
  a.play().catch(function (err) { console.warn("No se pudo reproducir el audio:", err); });
}

// Quita emojis, enlaces y signos para que la voz no los lea
function limpiarParaVoz(texto) {
  return texto
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\p{Extended_Pictographic}/gu, " ")
    .replace(/[\u200d\ufe0f]/g, "")
    .replace(/[^\p{L}\p{N}\s.,;:¿?¡!]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Respaldo: voz del navegador (grave, de hombre)
function hablarNavegador(texto) {
  if (!("speechSynthesis" in window)) return;
  const limpio = limpiarParaVoz(texto);
  if (!limpio) return;
  detenerVoz();
  const frases = (limpio.match(/[^.!?¿¡]+[.!?]*/g) || [limpio]).filter((s) => s.trim());
  let pendientes = frases.length;
  frases.forEach(function (frase) {
    const u = new SpeechSynthesisUtterance(frase.trim());
    u.lang = vozNavegador ? vozNavegador.lang : "es-CO";
    if (vozNavegador) u.voice = vozNavegador;
    u.rate = 1.03;
    u.pitch = 0.92;
    u.onstart = function () { LUNIX.hablando = true; };
    u.onend = u.onerror = function () {
      pendientes--;
      if (pendientes <= 0) LUNIX.hablando = false;
    };
    speechSynthesis.speak(u);
  });
}

/* ----- Burbuja de texto 3D de Xandro ----- */

const ANCHO_BURBUJA = 1.5;        // metros
const LINEAS_POR_PAGINA = 6;
const medidor = document.createElement("canvas").getContext("2d");
const burbuja = { plano: null, botones: null, paginas: [], pagina: 0 };

function mostrarEnBurbuja(texto) {
  if (!burbuja.plano) return;
  medidor.font = "500 34px " + FUENTE;
  const lineas = envolverTexto(medidor, texto, ANCHO_BURBUJA * PX - 72);
  burbuja.paginas = [];
  for (let i = 0; i < lineas.length; i += LINEAS_POR_PAGINA) {
    burbuja.paginas.push(lineas.slice(i, i + LINEAS_POR_PAGINA));
  }
  if (!burbuja.paginas.length) burbuja.paginas.push([""]);
  burbuja.pagina = 0;
  dibujarBurbuja();
}

function dibujarBurbuja() {
  const p = burbuja.plano;
  const lineas = burbuja.paginas[burbuja.pagina];
  const hayMas = burbuja.paginas.length > 1;
  const LH = 44, PAD = 36, PIE = hayMas ? 40 : 0;
  const altoPx = PAD * 2 + lineas.length * LH + PIE;
  const alto = altoPx / PX;

  p.tamano(ANCHO_BURBUJA, alto);
  const ctx = p.ctx, w = p.canvas.width, h = p.canvas.height;
  ctx.clearRect(0, 0, w, h);
  rectRedondeado(ctx, 4, 4, w - 8, h - 8, 34);
  ctx.fillStyle = "rgba(10,12,28,0.92)";
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#ffd54a";
  ctx.stroke();

  ctx.font = "500 34px " + FUENTE;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  lineas.forEach(function (l, i) {
    ctx.fillText(l, PAD, PAD + LH / 2 + i * LH);
  });
  if (hayMas) {
    ctx.font = "500 26px " + FUENTE;
    ctx.fillStyle = "#ffd54a";
    ctx.textAlign = "center";
    ctx.fillText("toca para seguir  ·  " + (burbuja.pagina + 1) + "/" + burbuja.paginas.length, w / 2, h - 30);
  }
  p.refrescar();

  // la burbuja cuelga debajo de Xandro y los botones debajo de la burbuja
  p.el.setAttribute("position", "0 " + (-0.55 - alto / 2) + " 0.02");
  if (burbuja.botones) burbuja.botones.setAttribute("position", "0 " + (-0.55 - alto - 0.2) + " 0.02");
}

/* ----- Conversación ----- */

const mensajes = $("#mensajes");

function agregarMensaje(texto, tipo) {
  const d = document.createElement("div");
  d.className = "msg " + tipo;
  d.textContent = texto;
  mensajes.appendChild(d);
  mensajes.scrollTop = mensajes.scrollHeight;
}

// Le pregunta algo a Xandro (n8n) y muestra / dice la respuesta
async function preguntarXandro(texto, opciones) {
  const op = Object.assign({ mostrarPregunta: true, propagarError: false }, opciones || {});
  if (op.mostrarPregunta) agregarMensaje(texto, "user");
  detenerVoz();
  mostrarEnBurbuja("Xandro está pensando…");
  LUNIX.pensando = true;

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sendMessage", sessionId: sessionId, chatInput: texto })
    });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    LUNIX.pensando = false;
    const respuesta = data.output || data.text || "Xandro no devolvió respuesta.";
    agregarMensaje(respuesta, "bot");
    mostrarEnBurbuja(respuesta);

    if (LUNIX.vozActiva) {
      if (data.audio && FUENTE_DE_VOZ === "elevenlabs") reproducirBase64(data.audio);   // voz de ElevenLabs
      else hablarNavegador(respuesta);                // respaldo
    }
    return respuesta;
  } catch (err) {
    LUNIX.pensando = false;
    if (op.propagarError) throw err;
    const aviso = "No pude conectar con Xandro (" + err.message + "). Revisa que el workflow esté activo en n8n.";
    agregarMensaje(aviso, "error");
    mostrarEnBurbuja(aviso);
  }
}

async function saludar() {
  try {
    await preguntarXandro(
      "Hola Xandro, preséntate en una o dos frases cortas y dime cómo puedo explorar LUNIX.",
      { mostrarPregunta: false, propagarError: true }
    );
  } catch (e) {
    mostrarEnBurbuja("Hola, soy Xandro, el asistente de LUNIX. Toca un planeta para explorarlo o pregúntame lo que quieras.");
  }
}

/* ---------------------------------------------------------------------
   5) CONSTRUCCIÓN DE LA ESCENA
   --------------------------------------------------------------------- */

const escena = $("#escena");
const astros = [];          // { p, astro }
const panel = { el: null, plano: null, botones: null, actual: null };
let tourId = 0;

function nav() { return $("#rig").components.navegante; }

function construirSol() {
  const sol = $("#sol");
  const titulo = crearEtiqueta("LUNIX", 2.6, 0.7, "#ffd54a");
  titulo.montar(sol);
  titulo.el.setAttribute("position", "0 3.4 0");
  titulo.el.setAttribute("mirar-camara", "");
  titulo.mesh.renderOrder = 10; // el título se dibuja por encima del resplandor de la estrella
}

function construirPlanetas() {
  const sistema = $("#sistema");

  PLANETAS.forEach(function (p, i) {
    // 1) inclinación del plano de la órbita
    const inclinada = document.createElement("a-entity");
    inclinada.setAttribute("rotation", p.inclinacion + " 0 " + (-p.inclinacion * 0.6));

    // 2) línea de la órbita
    const anilloOrbita = document.createElement("a-ring");
    anilloOrbita.setAttribute("radius-inner", p.radio - 0.012);
    anilloOrbita.setAttribute("radius-outer", p.radio + 0.012);
    anilloOrbita.setAttribute("segments-theta", 96);
    anilloOrbita.setAttribute("rotation", "-90 0 0");
    anilloOrbita.setAttribute("material", "shader: flat; color: " + p.color + "; opacity: 0.35; transparent: true; side: double");
    inclinada.appendChild(anilloOrbita);

    // 3) el que gira alrededor del centro
    const orb = document.createElement("a-entity");
    orb.setAttribute("orbita", "velocidad: " + p.vel + "; inicio: " + p.inicio);
    inclinada.appendChild(orb);

    // 4) el planeta en sí
    const astro = document.createElement("a-entity");
    astro.setAttribute("position", p.radio + " 0 0");
    orb.appendChild(astro);

    const cuerpo = document.createElement("a-entity");
    cuerpo.classList.add("clickable");
    cuerpo.setAttribute("geometry", "primitive: sphere; radius: " + p.tam + "; segmentsWidth: 48; segmentsHeight: 32");
    cuerpo.setAttribute("material", "shader: standard; color: #ffffff; roughness: 0.85; metalness: 0");
    cuerpo.setAttribute("planeta-procedural", "color: " + p.color + "; semilla: " + (i * 977 + 13));
    cuerpo.setAttribute("girar", "velocidad: 14");
    astro.appendChild(cuerpo);

    // anillo decorativo (solo Realeza)
    if (p.anillo) {
      const aro = document.createElement("a-ring");
      aro.setAttribute("radius-inner", p.tam * 1.35);
      aro.setAttribute("radius-outer", p.tam * 1.95);
      aro.setAttribute("rotation", "-72 0 15");
      aro.setAttribute("material", "shader: flat; color: #ffd54a; opacity: 0.65; transparent: true; side: double");
      astro.appendChild(aro);
    }

    // nombre flotando encima
    const etiqueta = crearEtiqueta(p.nombre, 1.0, 0.24, "#ffffff");
    etiqueta.montar(astro);
    etiqueta.el.setAttribute("position", "0 " + (p.tam + 0.42) + " 0");
    etiqueta.el.setAttribute("mirar-camara", "");

    // interacción
    cuerpo.addEventListener("mouseenter", function () { cuerpo.object3D.scale.setScalar(1.12); document.body.style.cursor = "pointer"; });
    cuerpo.addEventListener("mouseleave", function () { cuerpo.object3D.scale.setScalar(1); document.body.style.cursor = ""; });
    cuerpo.addEventListener("click", function () { seleccionarPlaneta(p, astro); });

    sistema.appendChild(inclinada);
    astros.push({ p: p, astro: astro });
  });
}

function construirXandro() {
  const xandro = $("#xandro");

  // nombre sobre su cabeza
  const nombre = crearEtiqueta("XANDRO", 0.9, 0.2, "#ffd54a");
  nombre.montar(xandro);
  nombre.el.setAttribute("position", "0 0.62 0");

  // burbuja de texto
  burbuja.plano = crearPlano(ANCHO_BURBUJA, 0.5);
  burbuja.plano.el.classList.add("clickable");
  burbuja.plano.montar(xandro);
  burbuja.plano.el.addEventListener("click", function () {
    if (burbuja.paginas.length > 1) {
      burbuja.pagina = (burbuja.pagina + 1) % burbuja.paginas.length;
      dibujarBurbuja();
    }
  });

  // botones rápidos debajo de la burbuja
  burbuja.botones = document.createElement("a-entity");
  xandro.appendChild(burbuja.botones);
  crearBoton(burbuja.botones, "¿Qué es LUNIX?", -0.67, 0, 0.64, 0.2, "#ffd54a", function () {
    cancelarRecorrido();
    preguntarXandro("¿Qué es LUNIX?");
  });
  crearBoton(burbuja.botones, "Planetas", 0, 0, 0.64, 0.2, "#4dd0e1", function () {
    cancelarRecorrido();
    preguntarXandro("¿Qué planetas hay en LUNIX y de qué trata cada uno?");
  });
  crearBoton(burbuja.botones, "▶ Recorrido", 0.67, 0, 0.64, 0.2, "#f06292", function () {
    recorrido();
  });

  mostrarEnBurbuja("Hola, soy Xandro, el asistente de LUNIX. Toca un planeta o pídeme un recorrido.");
}

function construirPanel() {
  panel.el = $("#panelInfo");
  panel.plano = crearPlano(1.7, 0.9);
  panel.plano.montar(panel.el);
  panel.botones = document.createElement("a-entity");
  panel.el.appendChild(panel.botones);
}

/* ----- Panel de información de un planeta ----- */

function mostrarPanel(p) {
  panel.actual = p;
  LUNIX.emocionar("sorpresa", 1100);

  // dibujar la tarjeta
  const pl = panel.plano, ctx = pl.ctx, w = pl.canvas.width, h = pl.canvas.height;
  ctx.clearRect(0, 0, w, h);
  rectRedondeado(ctx, 4, 4, w - 8, h - 8, 40);
  ctx.fillStyle = "rgba(10,12,28,0.93)";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = p.color;
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = "600 26px " + FUENTE;
  ctx.fillStyle = "#9aa0c8";
  ctx.fillText("PLANETA", 48, 58);
  ctx.font = "800 64px " + FUENTE;
  ctx.fillStyle = p.color;
  ctx.fillText(p.nombre, 48, 120);

  ctx.font = "500 36px " + FUENTE;
  ctx.fillStyle = "#ffffff";
  envolverTexto(ctx, p.texto, w - 96).slice(0, 6).forEach(function (l, i) {
    ctx.fillText(l, 48, 200 + i * 48);
  });
  pl.refrescar();

  // botones debajo de la tarjeta
  while (panel.botones.firstChild) panel.botones.removeChild(panel.botones.firstChild);
  const lista = [
    { t: "Que Xandro me cuente más", w: 0.98, acento: "#ffd54a", fn: function () { preguntarXandro("Cuéntame más sobre el planeta " + p.nombre + " de LUNIX."); } }
  ];
  if (p.url) lista.push({ t: "Abrir página", w: 0.5, acento: "#4dd0e1", fn: function () { window.location.href = p.url; } });
  lista.push({ t: "Cerrar", w: 0.4, acento: "#f06292", fn: function () { cancelarRecorrido(); cerrarPanel(); } });

  const hueco = 0.08;
  const total = lista.reduce(function (s, b) { return s + b.w; }, 0) + hueco * (lista.length - 1);
  let x = -total / 2;
  lista.forEach(function (b) {
    crearBoton(panel.botones, b.t, x + b.w / 2, -0.6, b.w, 0.2, b.acento, b.fn);
    x += b.w + hueco;
  });

  // colocarlo delante del visitante, un poco a la izquierda del planeta
  const cam = escena.camera;
  const C = new THREE.Vector3(), q = new THREE.Quaternion();
  cam.getWorldPosition(C);
  cam.getWorldQuaternion(q);
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
  fwd.y = 0;
  if (fwd.lengthSq() < 0.01) fwd.set(0, 0, -1);
  fwd.normalize();
  const der = new THREE.Vector3(-fwd.z, 0, fwd.x);
  const pos = C.clone().addScaledVector(fwd, 2.3).addScaledVector(der, -1.25);
  pos.y = C.y + 0.05;
  panel.el.object3D.position.copy(pos);
  panel.el.object3D.visible = true;
  panel.el.setAttribute("visible", true);

  mostrarEnBurbuja("Este es el planeta " + p.nombre + ". Si quieres saber más, pídeme que te cuente.");
}

function cerrarPanel() {
  panel.el.setAttribute("visible", false);
  panel.actual = null;
  LUNIX.pausa = false; // las órbitas siguen
}

/* ----- Volar a un planeta y recorrido guiado ----- */

function seleccionarPlaneta(p, astro) {
  cancelarRecorrido();
  cerrarPanel();
  LUNIX.emocionar("feliz", 1800);
  LUNIX.pausa = true; // el planeta se detiene mientras lo visitas
  nav().volar({
    objeto: astro.object3D,
    dist: p.tam * 2.4 + 1.8,
    alLlegar: function () { mostrarPanel(p); }
  });
}

function cancelarRecorrido() { tourId++; }

function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

async function recorrido() {
  const id = ++tourId;
  cerrarPanel();
  LUNIX.emocionar("feliz", 1600);
  mostrarEnBurbuja("¡Vamos! Te llevo a conocer cada planeta.");

  for (let i = 0; i < astros.length; i++) {
    if (id !== tourId) return;
    const item = astros[i];
    LUNIX.pausa = true;
    await new Promise(function (resolver) {
      nav().volar({ objeto: item.astro.object3D, dist: item.p.tam * 2.4 + 1.8, alLlegar: resolver });
    });
    if (id !== tourId) return;
    mostrarPanel(item.p);
    await esperar(7000);
    if (id !== tourId) return;
    cerrarPanel();
  }

  if (id !== tourId) return;
  volverAlInicio();
  mostrarEnBurbuja("Eso fue todo el recorrido. Pregúntame lo que quieras sobre LUNIX.");
}

function volverAlInicio() {
  cerrarPanel();
  nav().volar({ fijo: INICIO_CAMARA.clone(), mirarA: CENTRO.clone(), alLlegar: null });
}

// Si el usuario se mueve manualmente, el recorrido automático se detiene
escena.addEventListener("vuelo-cancelado", cancelarRecorrido);

/* ----- Arranque de la escena ----- */

function iniciarEscena() {
  construirSol();
  construirPlanetas();
  construirXandro();
  construirPanel();
}

if (escena.hasLoaded) iniciarEscena();
else escena.addEventListener("loaded", iniciarEscena);

escena.addEventListener("enter-vr", function () { document.body.classList.add("en-vr"); });
escena.addEventListener("exit-vr", function () { document.body.classList.remove("en-vr"); });

/* ---------------------------------------------------------------------
   6) INTERFAZ 2D
   --------------------------------------------------------------------- */

function entrarUniverso(modoVR) {
  $("#inicio").classList.add("oculto");
  LUNIX.emocionar("guino", 1500);
  if (SALUDO_AUTOMATICO) saludar();
  var cam = $("#camara");
  if (modoVR) {
    // Se llama de inmediato (dentro del toque) para que iPhone/Chrome permitan el sensor de movimiento
    if (window.LUNIX_activarVRBOX) window.LUNIX_activarVRBOX(true);
  } else if (cam) {
    cam.setAttribute("look-controls", "touchEnabled: true; magicWindowTracking: false; pointerLockEnabled: false");
  }
}
$("#btnEntrar360") && $("#btnEntrar360").addEventListener("click", function () { entrarUniverso(false); });
$("#btnEntrarVR") && $("#btnEntrarVR").addEventListener("click", function () { entrarUniverso(true); });
if ($("#btnEntrar")) {
  $("#btnEntrar").addEventListener("click", function () { entrarUniverso(false); });
}

$("#btnRecorrido").addEventListener("click", recorrido);
$("#btnInicio").addEventListener("click", function () { cancelarRecorrido(); volverAlInicio(); });

$("#btnVoz").addEventListener("click", function () {
  LUNIX.vozActiva = !LUNIX.vozActiva;
  this.textContent = LUNIX.vozActiva ? "🔊" : "🔇";
  this.classList.toggle("off", !LUNIX.vozActiva);
  if (!LUNIX.vozActiva) detenerVoz();
});

// Chat de texto
$("#btnChat").addEventListener("click", function () {
  $("#chat").classList.remove("oculto");
  this.classList.add("oculto");
  if (!mensajes.children.length) agregarMensaje("Hola, soy Xandro, el asistente de LUNIX. ¿En qué te puedo ayudar hoy?", "bot");
  $("#entradaChat").focus();
});
$("#cerrarChat").addEventListener("click", function () {
  $("#chat").classList.add("oculto");
  $("#btnChat").classList.remove("oculto");
});

$("#formChat").addEventListener("submit", function (e) {
  e.preventDefault();
  const entrada = $("#entradaChat");
  const texto = entrada.value.trim();
  if (!texto) return;
  entrada.value = "";
  cancelarRecorrido();
  preguntarXandro(texto);
});

// Micrófono: Xandro escucha por voz (Chrome / Edge / Android / Safari reciente)
(function () {
  const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
  const btn = $("#btnMic");
  if (!btn) return;
  if (!Reconocimiento) {
    btn.style.display = "none";
    return;
  }

  const rec = new Reconocimiento();
  rec.lang = "es-CO";
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  let escuchando = false;

  function empezarEscucha() {
    detenerVoz();
    try {
      rec.start();
      escuchando = true;
      btn.classList.add("escuchando");
      btn.title = "Escuchando… vuelve a pulsar para cancelar";
    } catch (e) {
      escuchando = false;
      btn.classList.remove("escuchando");
    }
  }

  function pararEscucha() {
    escuchando = false;
    btn.classList.remove("escuchando");
    btn.title = "Hablarle a Xandro";
    try { rec.stop(); } catch (e) {}
  }

  btn.addEventListener("click", function () {
    if (escuchando) {
      pararEscucha();
      return;
    }
    // Asegura chat visible
    var chat = $("#chat");
    var btnChat = $("#btnChat");
    if (chat && chat.classList.contains("oculto")) {
      chat.classList.remove("oculto");
      if (btnChat) btnChat.classList.add("oculto");
    }
    empezarEscucha();
  });

  rec.onresult = function (ev) {
    var texto = (ev.results[0] && ev.results[0][0] && ev.results[0][0].transcript) || "";
    texto = texto.trim();
    if (!texto) return;
    $("#entradaChat").value = texto;
    $("#formChat").requestSubmit();
  };
  rec.onend = function () {
    escuchando = false;
    btn.classList.remove("escuchando");
    btn.title = "Hablarle a Xandro";
  };
  rec.onerror = function () {
    escuchando = false;
    btn.classList.remove("escuchando");
    btn.title = "Hablarle a Xandro";
  };
})();

// Retrato de Xandro (imagen oficial) en la pantalla de inicio y en el chat
document.querySelectorAll("[data-xandro]").forEach(function (img) { img.src = XANDRO_IMG; });
