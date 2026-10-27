/* =====================================================================
   LUNIX · La estrella Xandro (el centro del universo)
   Archivo: estrella.js
   La estrella central es la estrella de Xandro: cuerpo facetado de
   arcoíris, ojos grandes y sonrisa. Nunca se queda quieta. Se activa con
   el atributo "estrella-viva" en <a-entity id="sol">.

   Depende de: dibujos.js (dibujarCara, dibujarMatcap, dibujarChispa)

   Animaciones que tiene:
     1) Siempre te mira: gira hacia ti, con vaivén y cabeceo.
     2) Cara viva: parpadea, mira a los lados y cambia de expresión sola
        (feliz, sorpresa, pensando, guiño).
     3) Flota, se balancea y late como un corazón.
     4) Corona de arcoíris con rayos que giran y destellos en cruz.
     5) Las 5 puntas titilan una tras otra, como una ola de brillo.
     6) Arcos de purpurina de arcoíris que saltan de punta a punta.
     7) Polvo de estrellas de colores que sale y se aleja girando.
     8) Cada 11-19 s: PIRUETA MÁGICA. Se asombra, da un giro completo
        con salto, lanza una onda expansiva y confeti de arcoíris.
     9) La luz sobre los planetas parpadea y sube en cada pirueta.

   Para ajustar: busca la sección "AJUSTES" más abajo.
   ===================================================================== */

(function () {
  const THREE = AFRAME.THREE;

  /* ---------------------------- AJUSTES ---------------------------- */
  const AJUSTES = {
    erupcionCadaMin: 11000,   // ms mínimos entre piruetas mágicas
    erupcionCadaMax: 19000,   // ms máximos
    arcos: 5,                 // arcos de purpurina a la vez (máx.)
    particulasPorArco: 30,
    viento: 120,              // polvo de estrellas
    confeti: 90,              // partículas de cada pirueta
    tamanoCorona: 11,         // tamaño (m) del resplandor alrededor
    giroTiempo: 1700          // ms que dura el giro de la pirueta
  };

  /* ---------------- Ruido 3D (simplex) para la corona ---------------- */
  const GLSL_RUIDO = `
    vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
    vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
    vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v){
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
    vec3 hsv2rgb(vec3 c){
      vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }
  `;

  /* ---------------- Corona: resplandor de arcoíris, rayos, destellos y onda ---------------- */
  const VS_CORONA = `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const FS_CORONA = GLSL_RUIDO + `
    uniform float uT;
    uniform float uBrillo;
    uniform float uPulso;
    uniform float uOnda;
    uniform float uR0;
    varying vec2 vUv;

    void main(){
      vec2 q = vUv * 2.0 - 1.0;
      float d = length(q);
      if (d > 1.0) discard;
      float a = atan(q.y, q.x) + uT * 0.02;
      float r0 = uR0;
      float x = max(d - r0, 0.0) / (1.0 - r0);

      // Resplandor suave
      float halo = exp(-x * 5.0) * 0.40 + exp(-x * 16.0) * 0.30;

      // Rayos: ruido a lo largo del ángulo (sin costura)
      float n1 = snoise(vec3(cos(a) * 1.2, sin(a) * 1.2, uT * 0.25));
      float n2 = snoise(vec3(cos(a) * 3.0, sin(a) * 3.0, -uT * 0.40 + 7.0));
      float n3 = snoise(vec3(cos(a) * 7.0, sin(a) * 7.0, uT * 0.70 + 3.0));
      float rayos = (0.5 + 0.5 * n1) * 0.5 + (0.5 + 0.5 * n2) * 0.32 + (0.5 + 0.5 * n3) * 0.18;
      rayos = pow(rayos, 2.0);
      float alcance = exp(-x * 2.2) * smoothstep(1.0, 0.3, x);
      float ray = rayos * alcance * 0.85;

      // Destellos en cruz que titilan y giran despacio
      float ca = cos(uT * 0.04); float sa = sin(uT * 0.04);
      vec2 qr = vec2(ca * q.x - sa * q.y, sa * q.x + ca * q.y);
      float tw = 0.6 + 0.4 * sin(uT * 1.7);
      float cruz = (exp(-abs(qr.x) * 38.0) + exp(-abs(qr.y) * 38.0)) * exp(-d * 3.0) * 0.45 * tw;

      float k = halo + ray + cruz;
      k *= (0.85 + 0.30 * uPulso + uBrillo);

      // Color: los rayos recorren todo el arcoíris y giran
      float hue = fract(a / 6.2831853 + uT * 0.04);
      vec3 arco = hsv2rgb(vec3(hue, 0.65, 1.0));
      vec3 col = mix(arco, vec3(1.0, 0.92, 0.65), exp(-x * 4.0) * 0.8);
      col = mix(col, vec3(1.0), clamp(cruz * 1.5, 0.0, 1.0));

      // Onda expansiva de la pirueta
      if (uOnda >= 0.0) {
        float p = uOnda;
        float rr = mix(r0 * 1.05, 0.96, 1.0 - pow(1.0 - p, 2.0));
        rr *= 1.0 + 0.08 * snoise(vec3(cos(a) * 2.0, sin(a) * 2.0, p * 3.0));
        float w = mix(0.02, 0.05, p);
        float aro = exp(-pow((d - rr) / w, 2.0)) * pow(1.0 - p, 1.5);
        k += aro * 0.9;
        col = mix(col, mix(arco, vec3(1.0), 0.5), clamp(aro, 0.0, 1.0));
      }

      k *= 1.0 - smoothstep(0.7, 1.0, d);
      gl_FragColor = vec4(col, clamp(k, 0.0, 1.0));
    }
  `;

  /* ---------------- Partículas de colores ---------------- */
  const VS_PART = `
    attribute float aAlfa;
    attribute float aTam;
    attribute float aTono;
    uniform float uPx;
    varying float vA;
    varying float vTono;
    void main(){
      vA = aAlfa;
      vTono = aTono;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aTam * uPx / max(0.5, -mv.z);
      gl_Position = projectionMatrix * mv;
    }
  `;

  const FS_PART = `
    varying float vA;
    varying float vTono;
    vec3 hsv2rgb(vec3 c){
      vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }
    void main(){
      vec2 c = gl_PointCoord - 0.5;
      float d = length(c) * 2.0;
      if (d > 1.0) discard;
      float a = pow(1.0 - d, 2.0) * vA;
      vec3 col = hsv2rgb(vec3(fract(vTono), 0.6, 1.0));
      col = mix(col, vec3(1.0), (1.0 - d) * 0.55);
      gl_FragColor = vec4(col, a);
    }
  `;

  /* ---------------- Cuerpo: la estrella arcoíris de Xandro ---------------- */
  const RAMPA = [
    [90, "#a259ff"], [162, "#ff5fb0"], [234, "#ff3b2a"],
    [270, "#ffc21a"], [306, "#2fcf4a"], [378, "#2f86ff"], [450, "#a259ff"]
  ].map(function (k) { return [k[0], new THREE.Color(k[1])]; });

  function colorEnAngulo(ang, salida) {
    for (let i = 0; i < RAMPA.length - 1; i++) {
      const a0 = RAMPA[i][0], a1 = RAMPA[i + 1][0];
      if (ang >= a0 && ang <= a1) {
        let t = (ang - a0) / (a1 - a0);
        t = t * t * (3 - 2 * t);
        salida.copy(RAMPA[i][1]).lerp(RAMPA[i + 1][1], t);
        return;
      }
    }
    salida.copy(RAMPA[0][1]);
  }

  function geometriaEstrella(R, r, profundidad) {
    const forma = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const ang = Math.PI / 2 + i * Math.PI / 5;
      const rad = i % 2 === 0 ? R : r;
      const x = Math.cos(ang) * rad, y = Math.sin(ang) * rad;
      if (i === 0) forma.moveTo(x, y); else forma.lineTo(x, y);
    }
    forma.closePath();

    const geo = new THREE.ExtrudeGeometry(forma, {
      depth: profundidad, bevelEnabled: true,
      bevelThickness: 0.045, bevelSize: 0.035, bevelSegments: 6, curveSegments: 4
    });
    geo.translate(0, 0, -profundidad / 2);

    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      let ang = Math.atan2(pos.getY(i), pos.getX(i)) * 180 / Math.PI;
      if (ang < 90) ang += 360;
      colorEnAngulo(ang, c);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return geo;
  }

  function texturaDe(ancho, alto, dibujar) {
    const c = document.createElement("canvas");
    c.width = ancho;
    c.height = alto;
    dibujar(c.getContext("2d"));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  /* ---------------- Expresiones de la cara (las mismas de Xandro) ---------------- */
  const BASE = {
    abL: 1, abR: 1, mx: 0, my: 0, sonr: 0.65, boca: 0, ancho: 1,
    cejaL: 0, cejaR: 0, feliz: 0, rub: 0.5
  };
  const EXPRESIONES = {
    reposo: {},
    feliz: { sonr: 1, boca: 0.45, ancho: 1.05, cejaL: 0.4, cejaR: 0.4, feliz: 1, rub: 1 },
    sorpresa: { abL: 1.18, abR: 1.18, sonr: 0.05, boca: 0.85, ancho: 0.55, cejaL: 1, cejaR: 1, rub: 0.4 },
    pensando: { abL: 0.9, abR: 0.9, sonr: -0.15, ancho: 0.55, cejaL: -0.15, cejaR: 0.9, mx: -0.7, my: -0.75, rub: 0.3 },
    guino: { abR: 0, sonr: 1, boca: 0.2, cejaL: 0.2, cejaR: -0.2, rub: 1 }
  };
  const CLAVES = Object.keys(BASE);
  const GESTOS = ["feliz", "guino", "sorpresa", "pensando", "feliz", "guino"];

  /* ---------------- Utilidades ---------------- */
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function unitRand(out) {
    const z = Math.random() * 2 - 1;
    const an = Math.random() * Math.PI * 2;
    const r = Math.sqrt(1 - z * z);
    return out.set(r * Math.cos(an), z, r * Math.sin(an));
  }

  function suavizarAngulo(actual, meta, k) {
    let d = (meta - actual) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return actual + d * k;
  }

  const V = new THREE.Vector3();
  const VA = new THREE.Vector3();
  const VB = new THREE.Vector3();
  const VO = new THREE.Vector3();
  const VN = new THREE.Vector3();
  const VS = new THREE.Vector3();

  /* ---------------- Componente ---------------- */
  AFRAME.registerComponent("estrella-viva", {
    schema: { radio: { default: 1.9 } },

    init: function () {
      const R = this.data.radio;
      this.R = R;
      const ESC = R / 0.42;      // el cuerpo de Xandro mide 0.42; aquí lo agrandamos
      this.listo = false;
      this.tEvento = 0;
      this.tOnda = -1e9;
      this.tGiro = -1e9;
      this.proximoEvento = rnd(5000, 8000);   // la primera pirueta llega pronto

      const grupo = new THREE.Group();
      this.grupo = grupo;

      /* --- cuerpo + cara --- */
      this.cuerpo = new THREE.Group();
      this.cuerpo.rotation.order = "YXZ";
      this.cuerpo.scale.setScalar(ESC);
      grupo.add(this.cuerpo);

      const matcap = texturaDe(256, 256, function (g) { dibujarMatcap(g, 256); });
      this.matCuerpo = new THREE.MeshMatcapMaterial({ matcap: matcap, vertexColors: true, color: 0xffffff });
      const estrella = new THREE.Mesh(geometriaEstrella(0.42, 0.19, 0.1), this.matCuerpo);
      estrella.frustumCulled = false;
      this.cuerpo.add(estrella);

      this.lienzo = document.createElement("canvas");
      this.lienzo.width = 512;
      this.lienzo.height = 384;
      this.g2d = this.lienzo.getContext("2d");
      this.texCara = new THREE.CanvasTexture(this.lienzo);
      this.texCara.colorSpace = THREE.SRGBColorSpace;
      this.texCara.anisotropy = 4;
      const cara = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, 0.375),
        new THREE.MeshBasicMaterial({
          map: this.texCara, transparent: true, toneMapped: false, depthWrite: false,
          polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
        })
      );
      cara.position.z = 0.1;
      cara.frustumCulled = false;
      this.cuerpo.add(cara);

      /* --- brillos en las 5 puntas --- */
      const texChispa = texturaDe(64, 64, function (g) { dibujarChispa(g, 64); });
      this.puntas = [];
      for (let i = 0; i < 5; i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({
          map: texChispa, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
        }));
        const a = Math.PI / 2 + i * 2 * Math.PI / 5;
        s.position.set(Math.cos(a) * 0.43, Math.sin(a) * 0.43, 0.08);
        this.cuerpo.add(s);
        this.puntas.push(s);
      }

      /* --- corona (plano que siempre mira al visitante) --- */
      const TAM = AJUSTES.tamanoCorona;
      this.matCorona = new THREE.ShaderMaterial({
        uniforms: {
          uT: { value: 0 }, uBrillo: { value: 0 }, uPulso: { value: 0 },
          uOnda: { value: -1 }, uR0: { value: 0.2 }
        },
        vertexShader: VS_CORONA,
        fragmentShader: FS_CORONA,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      this.corona = new THREE.Mesh(new THREE.PlaneGeometry(TAM, TAM), this.matCorona);
      this.corona.frustumCulled = false;
      this.corona.renderOrder = 1;
      grupo.add(this.corona);

      /* --- partículas: arcos de purpurina, polvo de estrellas y confeti --- */
      const NA = AJUSTES.arcos, PA = AJUSTES.particulasPorArco;
      const NV = AJUSTES.viento, NB = AJUSTES.confeti;
      const total = NA * PA + NV + NB;
      this.NA = NA; this.PA = PA; this.NV = NV; this.NB = NB;
      this.iViento = NA * PA;
      this.iEyec = NA * PA + NV;

      this.P = new Float32Array(total * 3);
      this.A = new Float32Array(total);
      this.S = new Float32Array(total);
      this.T = new Float32Array(total);
      this.sem = new Float32Array(total);
      for (let i = 0; i < total; i++) this.sem[i] = Math.random();

      const geo = new THREE.BufferGeometry();
      this.atP = new THREE.BufferAttribute(this.P, 3).setUsage(THREE.DynamicDrawUsage);
      this.atA = new THREE.BufferAttribute(this.A, 1).setUsage(THREE.DynamicDrawUsage);
      this.atS = new THREE.BufferAttribute(this.S, 1).setUsage(THREE.DynamicDrawUsage);
      this.atT = new THREE.BufferAttribute(this.T, 1).setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute("position", this.atP);
      geo.setAttribute("aAlfa", this.atA);
      geo.setAttribute("aTam", this.atS);
      geo.setAttribute("aTono", this.atT);

      this.matPart = new THREE.ShaderMaterial({
        uniforms: { uPx: { value: 450 } },
        vertexShader: VS_PART,
        fragmentShader: FS_PART,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const puntos = new THREE.Points(geo, this.matPart);
      puntos.frustumCulled = false;
      puntos.renderOrder = 2;
      grupo.add(puntos);

      this.arcos = [];
      for (let i = 0; i < NA; i++) {
        this.arcos.push({
          viva: false, espera: rnd(0, 2500) + i * 600, t0: 0, dur: 1,
          punta: 0, H: 0, off: i * PA
        });
      }
      this.viento = [];
      for (let i = 0; i < NV; i++) {
        this.viento.push({ nac: 0, vida: rnd(2500, 5500), vel: rnd(0.35, 0.9), ang: 0, z: 0 });
      }
      this.eyec = [];
      for (let i = 0; i < NB; i++) {
        this.eyec.push({ nac: 1e12, vida: 2000, vel: 2, dir: new THREE.Vector3() });
      }

      /* --- estado de la cara --- */
      this.cur = Object.assign({}, BASE);
      this.mira = { x: 0, y: 0 };
      this.proxMirada = 1500;
      this.proxParpadeo = 2500;
      this.finParpadeo = 0;
      this.proxGesto = 3000;
      this.gesto = null;
      this.gestoHasta = 0;
      this.ultimoDibujo = 0;
      this.yaw = 0;
      this.primeraVez = true;

      this.el.setObject3D("estrella", grupo);
      this.luz = this.el.querySelector("[light]");
    },

    remove: function () {
      this.el.removeObject3D("estrella");
    },

    // Posición de la punta i de la estrella, girada como el cuerpo
    punta: function (i, out) {
      const a = Math.PI / 2 + i * 2 * Math.PI / 5;
      out.set(Math.cos(a) * this.R, Math.sin(a) * this.R, 0).applyEuler(this.cuerpo.rotation);
      out.y += this.cuerpo.position.y;
      return out;
    },

    // Un arco de purpurina que salta de una punta a la siguiente
    nuevoArco: function (f, now, grande) {
      f.punta = Math.floor(Math.random() * 5);
      f.H = (grande ? rnd(0.9, 1.4) : rnd(0.35, 0.8)) * this.R;
      f.dur = grande ? rnd(5000, 7000) : rnd(3200, 6000);
      f.t0 = now;
      f.viva = true;
    },

    // Confeti de arcoíris que sale disparado en todas direcciones
    lanzarConfeti: function (now) {
      for (let i = 0; i < this.NB; i++) {
        const e = this.eyec[i];
        unitRand(e.dir);
        e.vel = rnd(1.5, 3.5);
        e.nac = now + rnd(250, 700);   // sale a la mitad del giro
        e.vida = rnd(1800, 3200);
      }
    },

    // Pirueta mágica: sorpresa + giro con salto + onda + arco grande + confeti
    disparar: function (now) {
      this.tEvento = now + 450;
      this.tOnda = now + 450;
      this.tGiro = now;
      this.gesto = "sorpresa";
      this.gestoHasta = now + 700;
      this.proxGesto = now + 2600;
      let f = null;
      for (let i = 0; i < this.arcos.length; i++) { if (!this.arcos[i].viva) { f = this.arcos[i]; break; } }
      if (!f) f = this.arcos[0];
      this.nuevoArco(f, now + 450, true);
      f.t0 = now + 450;
      this.lanzarConfeti(now);
    },

    ocultar: function (i) { this.A[i] = 0; this.S[i] = 0; },

    tick: function (t, dt) {
      if (!this.grupo) return;
      const now = t;
      const seg = t / 1000;
      const s = Math.min(dt, 100) / 1000;
      const R = this.R;
      const P = this.P, A = this.A, S = this.S, T = this.T, sem = this.sem;

      if (!this.listo) {
        this.viento.forEach(function (w) { w.nac = now - rnd(0, w.vida); w.ang = rnd(0, 6.283); w.z = rnd(-0.35, 0.35); });
        this.listo = true;
      }

      /* ---- Pirueta mágica y latido ---- */
      if (now >= this.proximoEvento) {
        this.disparar(now);
        this.proximoEvento = now + rnd(AJUSTES.erupcionCadaMin, AJUSTES.erupcionCadaMax);
      }
      const surge = (this.tEvento && now > this.tEvento) ? Math.exp(-(now - this.tEvento) / 1100) : 0;
      const pulso = 0.5 + 0.5 * Math.sin(seg * 1.3);
      const latido = Math.pow(Math.max(0, Math.sin(seg * 0.9)), 14);

      const pg = (now - this.tGiro) / AJUSTES.giroTiempo;
      let giro = 0, salto = 0, pop = 0;
      if (pg >= 0 && pg < 1) {
        const e = pg < 0.5 ? 4 * pg * pg * pg : 1 - Math.pow(-2 * pg + 2, 3) / 2;
        giro = e * Math.PI * 2;
        salto = Math.sin(Math.PI * pg) * 0.55;
        pop = Math.sin(Math.PI * pg) * 0.12;
      }

      this.grupo.scale.setScalar(
        1 + 0.018 * Math.sin(seg * 1.7) + 0.010 * Math.sin(seg * 4.1) + 0.035 * latido + 0.05 * surge + pop
      );

      /* ---- Siempre te mira, con vaivén ---- */
      const cam = this.el.sceneEl.camera;
      let pitch = 0;
      if (cam) {
        this.el.object3D.getWorldPosition(VS);
        cam.getWorldPosition(V);
        const dx = V.x - VS.x, dy = V.y - VS.y, dz = V.z - VS.z;
        const meta = Math.atan2(dx, dz);
        if (this.primeraVez) { this.yaw = meta; this.primeraVez = false; }
        this.yaw = suavizarAngulo(this.yaw, meta, 1 - Math.exp(-s / 0.6));
        const horiz = Math.sqrt(dx * dx + dz * dz) || 1;
        pitch = Math.max(-0.3, Math.min(0.3, -Math.atan2(dy, horiz) * 0.6));
        this.corona.lookAt(V);
      }
      const cu = this.cuerpo;
      cu.rotation.set(
        pitch + Math.sin(seg * 0.9) * 0.05 + this.cur.my * 0.05,
        this.yaw + Math.sin(seg * 0.7) * 0.18 + this.cur.mx * 0.1 + giro,
        Math.sin(seg * 1.1) * 0.07 + Math.sin(seg * 2.6) * 0.02
      );
      cu.position.y = Math.sin(seg * 1.5) * 0.14 + salto;
      this.matCuerpo.color.setScalar(1 + 0.35 * surge + 0.08 * latido);

      /* ---- Cara: gestos, mirada, parpadeo ---- */
      if (!this.gesto && now > this.proxGesto) {
        this.gesto = GESTOS[Math.floor(Math.random() * GESTOS.length)];
        this.gestoHasta = now + rnd(1100, 1800);
        this.proxGesto = this.gestoHasta + rnd(1500, 4500);
      }
      if (this.gesto && now > this.gestoHasta) this.gesto = null;
      // después de la pirueta se pone feliz
      let tipo = this.gesto || "reposo";
      if (now > this.tGiro + AJUSTES.giroTiempo * 0.6 && now < this.tGiro + AJUSTES.giroTiempo + 1800) tipo = "feliz";

      const meta = Object.assign({}, BASE, EXPRESIONES[tipo] || {});
      if (now > this.proxMirada) {
        this.mira.x = rnd(-0.45, 0.45);
        this.mira.y = rnd(-0.3, 0.3);
        this.proxMirada = now + rnd(1200, 3200);
      }
      if (tipo === "reposo" || tipo === "feliz") { meta.mx = this.mira.x; meta.my = this.mira.y; }

      const k = 1 - Math.exp(-s * 14);
      for (let i = 0; i < CLAVES.length; i++) {
        const c = CLAVES[i];
        this.cur[c] += (meta[c] - this.cur[c]) * k;
      }

      if (now - this.ultimoDibujo > 33) {
        this.ultimoDibujo = now;
        if (now > this.proxParpadeo) {
          this.finParpadeo = now + 140;
          this.proxParpadeo = now + rnd(2200, 5200);
        }
        const parpadeo = now < this.finParpadeo ? 0.05 : 1;
        const p = Object.assign({}, this.cur);
        p.abL = this.cur.abL * parpadeo;
        p.abR = this.cur.abR * parpadeo;
        dibujarCara(this.g2d, p);
        this.texCara.needsUpdate = true;
      }

      /* ---- Brillo que recorre las 5 puntas ---- */
      for (let i = 0; i < 5; i++) {
        const ola = Math.pow(Math.max(0, Math.sin(seg * 3 - i * 1.2566)), 3);
        const tam = 0.08 + ola * 0.2 + surge * 0.12;
        this.puntas[i].scale.set(tam, tam, 1);
        this.puntas[i].material.opacity = 0.35 + ola * 0.65;
      }

      /* ---- Uniforms de la corona ---- */
      const uc = this.matCorona.uniforms;
      uc.uT.value = seg;
      uc.uPulso.value = pulso + latido;
      uc.uBrillo.value = 0.9 * surge + 0.25 * latido;
      const pOnda = (now - this.tOnda) / 3200;
      uc.uOnda.value = (pOnda >= 0 && pOnda < 1) ? pOnda : -1;

      // tamaño de las partículas según la resolución
      const rend = this.el.sceneEl.renderer;
      if (rend) {
        const h = rend.xr && rend.xr.isPresenting ? 1700 : (rend.domElement.height || 900);
        this.matPart.uniforms.uPx.value = h * 0.5;
      }

      // la luz que alumbra a los planetas respira con la estrella
      if (this.luz) {
        const L = this.luz.getObject3D("light");
        if (L) {
          L.intensity = 2.2 * (1 + 0.05 * Math.sin(seg * 7.3) + 0.04 * Math.sin(seg * 11.1) +
                               0.5 * surge + 0.15 * latido);
        }
      }

      /* ---- Arcos de purpurina de arcoíris entre puntas ---- */
      const PA = this.PA;
      VN.set(0, 0, 1).applyEuler(cu.rotation);   // hacia donde mira la estrella
      for (let n = 0; n < this.arcos.length; n++) {
        const f = this.arcos[n];
        if (!f.viva && now >= f.espera) this.nuevoArco(f, now, false);

        let kk = f.viva ? (now - f.t0) / f.dur : 2;
        if (f.viva && kk >= 1) {
          f.viva = false;
          f.espera = now + rnd(600, 3500);
          kk = 2;
        }
        if (!f.viva || kk < 0) {
          for (let j = 0; j < PA; j++) this.ocultar(f.off + j);
          continue;
        }

        this.punta(f.punta, VA);
        this.punta((f.punta + 1) % 5, VB);
        VO.copy(VA).add(VB).normalize();

        let env;
        if (kk < 0.3) { const x = kk / 0.3; env = 1 - (1 - x) * (1 - x); }
        else if (kk < 0.65) env = 1;
        else { const x = (kk - 0.65) / 0.35; env = 1 - x * x; }

        for (let j = 0; j < PA; j++) {
          const idx = f.off + j;
          const sm = sem[idx];
          const u = (j / PA + now * 0.00015) % 1;
          const arco = Math.sin(Math.PI * u);
          const h = f.H * env * Math.pow(arco, 0.9);
          const jit = 0.04 * R;

          P[idx * 3]     = VA.x + (VB.x - VA.x) * u + VO.x * h + VN.x * h * 0.5 + Math.sin(now * 0.003 + sm * 50) * jit;
          P[idx * 3 + 1] = VA.y + (VB.y - VA.y) * u + VO.y * h + VN.y * h * 0.5 + Math.sin(now * 0.0035 + sm * 70) * jit;
          P[idx * 3 + 2] = VA.z + (VB.z - VA.z) * u + VO.z * h + VN.z * h * 0.5 + Math.sin(now * 0.0027 + sm * 90) * jit;

          A[idx] = Math.pow(arco, 0.6) * env * (0.55 + 0.45 * Math.sin(now * 0.01 + sm * 40)) * 0.9;
          S[idx] = (0.2 + 0.18 * arco) * (0.6 + 0.4 * env);
          T[idx] = u + now * 0.0001;          // el arco recorre todos los colores
        }
      }

      /* ---- Polvo de estrellas de colores ---- */
      for (let i = 0; i < this.NV; i++) {
        const idx = this.iViento + i;
        const w = this.viento[i];
        let age = (now - w.nac) / w.vida;
        if (age >= 1) {
          w.ang = rnd(0, 6.2832);
          w.z = rnd(-0.35, 0.35);
          w.nac = now;
          w.vida = rnd(2500, 5500);
          w.vel = rnd(0.35, 0.9);
          age = 0;
        }
        const dist = R * 0.85 + w.vel * age * w.vida / 1000;
        const an = w.ang + age * 0.5;          // gira mientras se aleja
        V.set(Math.cos(an) * dist, Math.sin(an) * dist, w.z * dist).applyEuler(cu.rotation);
        P[idx * 3] = V.x;
        P[idx * 3 + 1] = V.y + cu.position.y;
        P[idx * 3 + 2] = V.z;
        A[idx] = Math.min(1, age * 6) * (1 - age) * 0.8;
        S[idx] = 0.11 + 0.1 * (1 - age);
        T[idx] = sem[idx] + age * 0.3;
      }

      /* ---- Confeti de la pirueta ---- */
      for (let i = 0; i < this.NB; i++) {
        const idx = this.iEyec + i;
        const e = this.eyec[i];
        const age = (now - e.nac) / e.vida;
        if (age < 0 || age >= 1) { this.ocultar(idx); continue; }
        const seg2 = age * e.vida / 1000;
        const dist = R * 0.8 + e.vel * (1 - Math.exp(-seg2 * 1.2)) / 1.2;
        P[idx * 3]     = e.dir.x * dist;
        P[idx * 3 + 1] = e.dir.y * dist + cu.position.y;
        P[idx * 3 + 2] = e.dir.z * dist;
        A[idx] = Math.min(1, age * 8) * Math.pow(1 - age, 1.3) * 0.95;
        S[idx] = 0.18 + 0.25 * age;
        T[idx] = sem[idx] + age * 0.6;
      }

      this.atP.needsUpdate = true;
      this.atA.needsUpdate = true;
      this.atS.needsUpdate = true;
      this.atT.needsUpdate = true;
    }
  });
})();
