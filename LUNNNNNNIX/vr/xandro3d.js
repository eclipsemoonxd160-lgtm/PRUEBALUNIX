/* =====================================================================
   xandro3d.js
   Xandro como personaje 3D animado (estrella arcoíris con capa, libro y pluma).
   - Cara dibujada en vivo: parpadea, mira a los lados y cambia de expresión.
   - Mueve la boca con el volumen real de la voz.
   - Brazos, piernas, capa y chispas de la pluma siempre en movimiento.
   Depende de: dibujos.js (texturas) y de LUNIX / nivelVoz() de script.js
   ===================================================================== */

(function () {
  const THREE = AFRAME.THREE;

  /* ---------- Helpers para crear texturas y materiales ---------- */

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

  const MATCAP = texturaDe(256, 256, function (g) { dibujarMatcap(g, 256); });

  // Material con sombreado "de caricatura" que no depende de las luces de la escena
  function mat(color, extra) {
    return new THREE.MeshMatcapMaterial(Object.assign({ matcap: MATCAP, color: color }, extra || {}));
  }

  function malla(geo, material, x, y, z) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }

  /* ---------- Cuerpo: estrella con colores arcoíris ---------- */

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

  /* ---------- Piezas ---------- */

  const BLANCO = "#ffffff", DORADO = "#ffc94a", AZUL_OSC = "#241a63";

  function crearBrazo(color, largo) {
    const pivote = new THREE.Group();
    const brazo = malla(new THREE.CapsuleGeometry(0.04, largo, 6, 12), mat(color), 0, -largo / 2 - 0.02, 0);
    pivote.add(brazo);

    const mano = new THREE.Group();
    mano.position.set(0, -largo - 0.06, 0.01);
    mano.add(malla(new THREE.SphereGeometry(0.065, 16, 12), mat(BLANCO)));
    mano.add(malla(new THREE.SphereGeometry(0.032, 12, 10), mat(BLANCO), 0.05, 0.035, 0.03));
    pivote.add(mano);
    return { pivote: pivote, largo: largo + 0.06 };
  }

  function crearPierna(color) {
    const pivote = new THREE.Group();
    pivote.add(malla(new THREE.CapsuleGeometry(0.045, 0.14, 6, 12), mat(color), 0, -0.11, 0));

    const zapato = new THREE.Group();
    zapato.position.set(0, -0.25, 0.03);
    const suela = malla(new THREE.SphereGeometry(1, 16, 12), mat(BLANCO), 0, -0.025, 0.02);
    suela.scale.set(0.075, 0.035, 0.12);
    const empeine = malla(new THREE.SphereGeometry(1, 16, 12), mat(AZUL_OSC), 0, 0.012, 0);
    empeine.scale.set(0.066, 0.052, 0.1);
    const aro = malla(new THREE.TorusGeometry(0.048, 0.01, 8, 18), mat(DORADO), 0, 0.045, -0.012);
    aro.rotation.x = Math.PI / 2;
    const cordon = malla(new THREE.SphereGeometry(0.014, 8, 8), mat(DORADO), 0, 0.05, 0.05);
    zapato.add(suela, empeine, aro, cordon);
    pivote.add(zapato);
    return pivote;
  }

  function crearLibro() {
    const g = new THREE.Group();
    g.add(malla(new THREE.BoxGeometry(0.24, 0.31, 0.05), mat(AZUL_OSC)));
    g.add(malla(new THREE.BoxGeometry(0.236, 0.318, 0.036), mat("#f3ead2"), 0.008, 0.004, 0));
    const portada = new THREE.Mesh(
      new THREE.PlaneGeometry(0.22, 0.29),
      new THREE.MeshBasicMaterial({
        map: texturaDe(256, 340, function (c) { dibujarLibro(c, 256, 340); }),
        toneMapped: false
      })
    );
    portada.position.z = 0.027;
    g.add(portada);
    return g;
  }

  function crearPluma() {
    const g = new THREE.Group();
    g.add(malla(new THREE.CylinderGeometry(0.02, 0.02, 0.26, 16), mat("#1d1a5c"), 0, 0.01, 0));
    g.add(malla(new THREE.CylinderGeometry(0.0225, 0.0225, 0.025, 16), mat(DORADO), 0, 0.105, 0));
    g.add(malla(new THREE.SphereGeometry(0.022, 12, 10), mat(DORADO), 0, -0.12, 0));
    g.add(malla(new THREE.ConeGeometry(0.02, 0.07, 16), mat(DORADO), 0, 0.175, 0));

    // espiral dorada alrededor de la pluma
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const a = i * 0.45;
      pts.push(new THREE.Vector3(Math.cos(a) * (0.04 + i * 0.0007), -0.06 + i * 0.0065, Math.sin(a) * (0.04 + i * 0.0007)));
    }
    const espiral = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, 0.004, 6),
      new THREE.MeshBasicMaterial({ color: 0xffd25a })
    );
    g.add(espiral);
    return { grupo: g, espiral: espiral };
  }

  /* ---------- Expresiones ---------- */

  const BASE = {
    abL: 1, abR: 1, mx: 0, my: 0, sonr: 0.65, boca: 0, ancho: 1,
    cejaL: 0, cejaR: 0, feliz: 0, rub: 0.5
  };
  const EXPRESIONES = {
    reposo: {},
    feliz: { sonr: 1, boca: 0.45, ancho: 1.05, cejaL: 0.4, cejaR: 0.4, feliz: 1, rub: 1 },
    sorpresa: { abL: 1.18, abR: 1.18, sonr: 0.05, boca: 0.85, ancho: 0.55, cejaL: 1, cejaR: 1, rub: 0.4 },
    pensando: { abL: 0.9, abR: 0.9, sonr: -0.15, ancho: 0.55, cejaL: -0.15, cejaR: 0.9, mx: -0.7, my: -0.75, rub: 0.3 },
    guino: { abR: 0, sonr: 1, boca: 0.2, cejaL: 0.2, cejaR: -0.2, rub: 1 },
    hablando: { sonr: 0.55, ancho: 1, rub: 0.6 }
  };
  const CLAVES = Object.keys(BASE);

  function aleatorio(a, b) { return a + Math.random() * (b - a); }

  /* ---------- Componente ---------- */

  AFRAME.registerComponent("avatar-xandro", {
    init: function () {
      const G = new THREE.Group();
      G.scale.setScalar(0.8);
      this.G = G;

      // aura detrás
      const halo = texturaDe(128, 128, function (g) { dibujarHalo(g, 128, "179,136,255"); });
      this.aura = new THREE.Sprite(new THREE.SpriteMaterial({
        map: halo, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.35
      }));
      this.aura.scale.set(1.9, 1.9, 1);
      this.aura.position.z = -0.2;
      G.add(this.aura);

      // capa (se ondula en cada cuadro)
      this.NX = 14;
      this.NY = 12;
      this.capa = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1, this.NX, this.NY),
        mat("#ffffff", {
          map: texturaDe(256, 256, function (c) { dibujarCapa(c, 256, 256); }),
          side: THREE.DoubleSide
        })
      );
      G.add(this.capa);

      // cuerpo de estrella
      this.estrella = new THREE.Mesh(geometriaEstrella(0.42, 0.19, 0.1), mat("#ffffff", { vertexColors: true }));
      G.add(this.estrella);

      // cara dibujada en un canvas que se actualiza en vivo
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
      G.add(cara);

      // cuello de la capa y broche
      const cuello = malla(new THREE.TorusGeometry(0.21, 0.032, 10, 28, Math.PI), mat("#5b2fb0"), 0, -0.02, 0.078);
      cuello.rotation.z = Math.PI;
      G.add(cuello);
      const broche = malla(new THREE.SphereGeometry(1, 16, 12), mat(DORADO), 0, -0.215, 0.1);
      broche.scale.set(0.045, 0.045, 0.02);
      G.add(broche);

      // brazos (izquierdo con el libro, derecho con la pluma)
      this.brazoIzq = crearBrazo("#ff3d2e", 0.22);
      this.brazoIzq.pivote.position.set(-0.2, -0.1, 0.06);
      G.add(this.brazoIzq.pivote);
      this.brazoDer = crearBrazo("#35c14a", 0.22);
      this.brazoDer.pivote.position.set(0.2, -0.1, 0.06);
      G.add(this.brazoDer.pivote);

      this.libro = crearLibro();
      G.add(this.libro);

      const pl = crearPluma();
      this.pluma = pl.grupo;
      this.pluma.scale.setScalar(1.35);
      this.espiral = pl.espiral;
      G.add(this.pluma);

      // chispas alrededor de la punta de la pluma
      const texChispa = texturaDe(64, 64, function (g) { dibujarChispa(g, 64); });
      this.chispas = [];
      for (let i = 0; i < 6; i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({
          map: texChispa, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
        }));
        this.pluma.add(s);
        this.chispas.push({ s: s, fase: i * 1.1 });
      }

      // piernas
      this.piernaIzq = crearPierna("#e53935");
      this.piernaIzq.position.set(-0.2, -0.34, 0.0);
      G.add(this.piernaIzq);
      this.piernaDer = crearPierna("#1ec8a5");
      this.piernaDer.position.set(0.2, -0.34, 0.0);
      G.add(this.piernaDer);

      this.el.setObject3D("xandro", G);

      // ----- estado de la animación -----
      this.cur = Object.assign({}, BASE);
      this.mira = { x: 0, y: 0 };
      this.proxMirada = 1500;
      this.proxParpadeo = 2500;
      this.finParpadeo = 0;
      this.proxIdle = 6000;
      this.saludoHasta = 0;
      this.ultimoDibujo = 0;
      this.fase = 0;
      this.vel = 0;
      this.ultimaPos = new THREE.Vector3();
      this.primera = true;
      this.hablandoAntes = false;
    },

    tick: function (t, dt) {
      const s = dt / 1000;
      const ahora = performance.now();
      const hablando = LUNIX.hablando;
      const nivel = hablando ? nivelVoz() : 0;

      /* --- 1) cuánto se está moviendo (para caminar / aletear la capa) --- */
      const padre = this.el.parentEl.object3D.position;
      if (this.primera) { this.ultimaPos.copy(padre); this.primera = false; }
      const d = padre.distanceTo(this.ultimaPos);
      this.ultimaPos.copy(padre);
      const v = s > 0 ? d / s : 0;
      this.vel += (Math.min(v, 6) - this.vel) * (1 - Math.exp(-dt / 200));
      const mov = Math.min(1, this.vel / 1.5);
      this.fase += s * (3 + mov * 9);

      /* --- 2) qué expresión toca --- */
      let tipo = "reposo";
      if (hablando) tipo = "hablando";
      else if (LUNIX.emocion && ahora < LUNIX.emocion.hasta) tipo = LUNIX.emocion.tipo;
      else if (LUNIX.pensando) tipo = "pensando";

      // gestos espontáneos para que nunca se quede quieto
      if (tipo === "reposo" && t > this.proxIdle) {
        const opciones = ["guino", "feliz", "sorpresa", "saludo", "saludo"];
        const eleccion = opciones[Math.floor(Math.random() * opciones.length)];
        if (eleccion === "saludo") {
          this.saludoHasta = t + 1900;
          LUNIX.emocionar("feliz", 1900);
        } else {
          LUNIX.emocionar(eleccion, 1300);
        }
        this.proxIdle = t + aleatorio(6000, 12000);
      }
      if (this.hablandoAntes && !hablando) this.proxIdle = Math.max(this.proxIdle, t + 3000);
      this.hablandoAntes = hablando;

      /* --- 3) objetivo de cada parte de la cara --- */
      const meta = Object.assign({}, BASE, EXPRESIONES[tipo] || {});

      // mirada: saltitos pequeños hacia los lados
      if (t > this.proxMirada) {
        const amp = tipo === "hablando" ? 0.2 : 0.45;
        this.mira.x = aleatorio(-amp, amp);
        this.mira.y = aleatorio(-amp * 0.7, amp * 0.7);
        this.proxMirada = t + aleatorio(1200, 3200);
      }
      if (tipo === "reposo" || tipo === "hablando" || tipo === "feliz") {
        meta.mx = this.mira.x;
        meta.my = this.mira.y;
      }

      // al hablar, la boca sigue el volumen de la voz
      if (tipo === "hablando") {
        const ritmo = nivel > 0.02
          ? nivel
          : 0.25 + Math.abs(Math.sin(t / 95)) * 0.45 + Math.abs(Math.sin(t / 43)) * 0.15;
        meta.boca = Math.min(1, 0.06 + ritmo * 0.95);
        meta.cejaL = meta.cejaR = 0.1 + ritmo * 0.5;
      }

      // suavizar para que los cambios no sean bruscos
      const k = 1 - Math.exp(-s * 14);
      for (let i = 0; i < CLAVES.length; i++) {
        const c = CLAVES[i];
        this.cur[c] += (meta[c] - this.cur[c]) * k;
      }

      /* --- 4) dibujar la cara (unas 30 veces por segundo) --- */
      if (t - this.ultimoDibujo > 33) {
        this.ultimoDibujo = t;
        if (t > this.proxParpadeo) {
          this.finParpadeo = t + 140;
          this.proxParpadeo = t + aleatorio(2200, 5200);
        }
        const parpadeo = t < this.finParpadeo ? 0.05 : 1;
        const p = Object.assign({}, this.cur);
        p.abL = this.cur.abL * parpadeo;
        p.abR = this.cur.abR * parpadeo;
        dibujarCara(this.g2d, p);
        this.texCara.needsUpdate = true;
      }

      /* --- 5) movimiento del cuerpo --- */
      const G = this.G;
      const habla = hablando ? 1 : 0;
      G.position.y = Math.sin(t / 650) * 0.03;
      G.rotation.z = Math.sin(t / 1300) * 0.04 + this.cur.mx * -0.04;
      G.rotation.y = this.cur.mx * 0.12;
      G.rotation.x = this.cur.my * 0.06 + habla * Math.sin(t / 150) * (0.02 + nivel * 0.05);
      this.estrella.scale.setScalar(1 + Math.sin(t / 900) * 0.012 + habla * nivel * 0.04);

      // aura
      this.aura.material.opacity = hablando ? 0.45 + nivel * 0.4 : 0.3 + Math.sin(t / 900) * 0.05;
      const tamAura = 1.9 + habla * nivel * 0.4;
      this.aura.scale.set(tamAura, tamAura, 1);

      // piernas: se balancean siempre, más fuerte cuando se mueve
      const amp = 0.14 + mov * 0.55;
      this.piernaIzq.rotation.x = Math.sin(this.fase) * amp;
      this.piernaDer.rotation.x = -Math.sin(this.fase) * amp;

      // brazos
      const gesto = habla ? Math.sin(t / 170) * (0.12 + nivel * 0.2) : 0;
      const saludo = t < this.saludoHasta ? Math.sin(t / 85) * 0.38 : 0;
      this.brazoIzq.pivote.rotation.set(-0.35, 0, -1.4 + Math.sin(t / 800) * 0.06 + gesto * 0.4);
      this.brazoDer.pivote.rotation.set(-0.25, 0, 2.3 + Math.sin(t / 700) * 0.08 + gesto + saludo);

      // libro y pluma siguen a sus manos
      this.ponerEnMano(this.brazoIzq, this.libro, 0.07, 0.1, 0.02);
      this.libro.rotation.set(0.05, 0.35 + Math.sin(t / 1100) * 0.06, 0.06);
      this.ponerEnMano(this.brazoDer, this.pluma, 0, 0.03, 0.02);
      this.pluma.rotation.set(0, 0, -0.28 + gesto * 0.8 + saludo * 0.6);
      this.espiral.rotation.y = t / 500;

      // chispas girando alrededor de la punta
      for (let i = 0; i < this.chispas.length; i++) {
        const c = this.chispas[i];
        const a = t / 420 + c.fase;
        c.s.position.set(Math.cos(a) * 0.1, 0.2 + Math.sin(a * 1.3) * 0.07, Math.sin(a) * 0.06);
        const tam = 0.035 + (Math.sin(t / 150 + c.fase * 3) * 0.5 + 0.5) * 0.06;
        c.s.scale.set(tam, tam, 1);
      }

      this.ondularCapa(t, mov, habla);
    },

    // coloca un objeto en la mano de un brazo, sin heredar su rotación
    ponerEnMano: function (brazo, objeto, dx, dy, dz) {
      const r = brazo.pivote.rotation;
      const L = brazo.largo + 0.01;
      const dirX = Math.sin(r.z);
      const dirY = -Math.cos(r.z) * Math.cos(r.x);
      const dirZ = -Math.cos(r.z) * Math.sin(r.x);
      objeto.position.set(
        brazo.pivote.position.x + L * dirX + dx,
        brazo.pivote.position.y + L * dirY + dy,
        brazo.pivote.position.z + L * dirZ + dz
      );
    },

    // la capa ondea más fuerte cuando Xandro se mueve o habla
    ondularCapa: function (t, mov, habla) {
      const geo = this.capa.geometry;
      const pos = geo.attributes.position;
      const NX = this.NX, NY = this.NY;
      const fuerza = 1 + mov * 1.8 + habla * 0.5;
      for (let iy = 0; iy <= NY; iy++) {
        for (let ix = 0; ix <= NX; ix++) {
          const u = ix / NX, vv = iy / NY;
          const ancho = 0.5 + 0.55 * vv;
          const x = (u - 0.5) * ancho;
          // borde de abajo curvo: las puntas suben y el centro cuelga más
          const y = 0.1 - vv * 0.56 - 0.07 * vv * (1 - Math.pow(2 * u - 1, 2)) + 0.05 * vv * Math.pow(2 * u - 1, 2);
          // pliegues fijos + ondas que se mueven
          const z = -0.07 - vv * 0.1 - Math.sin(u * Math.PI) * 0.04 * vv +
            Math.sin(u * 11) * 0.022 * vv +
            Math.sin(t / 330 + vv * 4 + u * 2.5) * 0.035 * vv * fuerza;
          pos.setXYZ(iy * (NX + 1) + ix, x, y, z);
        }
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    }
  });
})();
