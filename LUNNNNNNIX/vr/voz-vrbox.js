/* =====================================================================
   LUNIX · Voz manos libres (para usar con las gafas VR BOX)
   - El micrófono queda siempre escuchando (sin tocar la pantalla).
   - Órdenes de movimiento ("llévame a Arte", "inicio", "recorrido"...)
     se ejecutan al instante.
   - Cualquier otra frase se le pregunta a Xandro (IA, n8n) y él responde
     con voz y con su burbuja de texto 3D.
   - Mientras Xandro habla, el micrófono se pausa para que no se oiga a sí mismo.
   Se carga después de script.js (usa sus funciones: seleccionarPlaneta,
   recorrido, volverAlInicio, preguntarXandro, etc.).
   ===================================================================== */
(function () {
  "use strict";

  var Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
  var btn = document.querySelector("#btnManosLibres");
  var pildora = null;          // aviso 2D (solo fuera de VR BOX)
  var hud = null;              // panel 3D pegado a la cabeza (VR BOX)
  var rec = null;
  var activo = false;          // el usuario quiere manos libres
  var enMarcha = false;        // el reconocimiento está corriendo ahora mismo
  var noAntesDe = 0;           // no reiniciar antes de este momento (ms)
  var ultimoTexto = "", ultimoTextoT = 0;
  var estado = "apagado";      // apagado | escuchando | hablando | pensando | error
  var oido = "";               // última frase entendida
  var mensajeError = "";
  var dibujado = "";           // para no redibujar si nada cambió
  var dibujadoT = 0;

  /* ---------- Utilidades ---------- */

  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  function tiene(t, re) { return re.test(t); }
  function enVRBOX() { return document.body.classList.contains("modo-vrbox"); }

  // Palabras con las que se puede nombrar cada planeta
  var ALIAS = {
    "mecanica": ["mecanica", "mecanico", "motores", "motor", "autos", "carros"],
    "arte": ["arte", "artes", "pintura"],
    "realeza": ["realeza", "reyes", "reina", "castillo", "castillos"],
    "vida marina": ["vida marina", "marina", "oceano", "mar"],
    "cosmetologia": ["cosmetologia", "cosmetica", "belleza", "cosmetologa"]
  };

  function planetaNombrado(t) {
    for (var i = 0; i < PLANETAS.length; i++) {
      var clave = norm(PLANETAS[i].nombre);
      var lista = (ALIAS[clave] || []).concat([clave]);
      for (var j = 0; j < lista.length; j++) {
        if (new RegExp("(^| )" + lista[j] + "( |$)").test(t)) return i;
      }
    }
    return -1;
  }

  function indiceActual() {
    return (typeof panel !== "undefined" && panel.actual) ? PLANETAS.indexOf(panel.actual) : -1;
  }

  /* ---------- Acciones ---------- */

  function irAPlaneta(i) {
    i = ((i % PLANETAS.length) + PLANETAS.length) % PLANETAS.length;
    var item = astros[i];
    if (!item) return;
    decir("Vamos a " + item.p.nombre + ".", true);
    seleccionarPlaneta(item.p, item.astro);
    // al llegar, Xandro cuenta de qué trata el planeta
    var esperaT = setInterval(function () {
      if (typeof panel !== "undefined" && panel.actual === item.p) {
        clearInterval(esperaT);
        if (LUNIX.vozActiva) hablarNavegador(item.p.texto);
      }
    }, 400);
    setTimeout(function () { clearInterval(esperaT); }, 9000);
  }

  function irALaEstrella() {
    cancelarRecorrido();
    cerrarPanel();
    decir("Vamos a la estrella de LUNIX.", true);
    nav().volar({ objeto: $("#sol").object3D, dist: 5.5 });
  }

  // Xandro dice algo corto (burbuja + voz)
  function decir(texto, hablar) {
    mostrarEnBurbuja(texto);
    if (hablar !== false && LUNIX.vozActiva) hablarNavegador(texto);
  }

  function ayuda() {
    var txt = "Puedes decir: llévame a Arte, a Mecánica, a Realeza, a Vida marina o a Cosmetología. " +
      "También: siguiente planeta, ir a la estrella, volver al inicio, hacer el recorrido, o detente. " +
      "Y cualquier pregunta sobre LUNIX.";
    mostrarEnBurbuja(txt);
    if (LUNIX.vozActiva) hablarNavegador(txt);
  }

  /* ---------- Intérprete de frases ---------- */

  function procesar(crudo) {
    var t = norm(crudo);
    if (t.length < 2) return;
    // evita procesar dos veces la misma frase
    var ahora = Date.now();
    if (t === ultimoTexto && ahora - ultimoTextoT < 2000) return;
    ultimoTexto = t; ultimoTextoT = ahora;

    oido = crudo.trim();
    dibujarEstado(true);

    var verbo = tiene(t, /\b(lleva\w*|ve|vamos|vamonos|ir|voy|vuela\w*|volar|visit\w+|muestra\w*|ensena\w*|ver|acerca\w*|llegar|dirigete|salta|viaja\w*)\b/);

    // 1) Detener todo
    if (tiene(t, /\b(parate|detente|detener|alto|quieto|cancela\w*|basta|silencio|callate)\b/)) {
      cancelarRecorrido();
      nav().cancelar();
      detenerVoz();
      LUNIX.pausa = false;
      mostrarEnBurbuja("Listo, me detengo. Dime a dónde quieres ir.");
      return;
    }

    // 2) Ayuda
    if (tiene(t, /\b(ayuda|que puedo decir|que puedes hacer|comandos|instrucciones)\b/)) { ayuda(); return; }

    // 3) Cerrar la ficha del planeta
    if (tiene(t, /\b(cierra|cerrar|quita|oculta)\b/) && !tiene(t, /\b(chat)\b/)) {
      cancelarRecorrido();
      cerrarPanel();
      mostrarEnBurbuja("Cerrado.");
      return;
    }

    // 4) Recorrido guiado
    if (tiene(t, /\b(recorrido|tour|guiame|visita guiada|recorrelo)\b/)) {
      decir("¡Vamos! Te llevo a conocer cada planeta.", true);
      recorrido();
      return;
    }

    // 5) Volver al inicio
    if (tiene(t, /\b(inicio|volver|vuelve|regresa\w*|principio|punto de partida|desde el principio)\b/)) {
      cancelarRecorrido();
      decir("Volvemos al inicio.", true);
      volverAlInicio();
      return;
    }

    // 6) La estrella central
    if (tiene(t, /\b(estrella|sol|centro)\b/) && (verbo || tiene(t, /\b(a la|al)\b/))) {
      irALaEstrella();
      return;
    }

    // 7) Planeta siguiente / anterior
    if (tiene(t, /\b(siguiente|proximo|otro planeta)\b/)) { irAPlaneta(indiceActual() + 1); return; }
    if (tiene(t, /\b(anterior|previo|planeta de antes)\b/)) { irAPlaneta(indiceActual() - 1); return; }

    // 8) Ir a un planeta por su nombre
    var p = planetaNombrado(t);
    if (p >= 0 && verbo) { cancelarRecorrido(); irAPlaneta(p); return; }

    // 9) Todo lo demás: se lo preguntamos a Xandro (IA)
    cancelarRecorrido();
    estado = "pensando";
    preguntarXandro(crudo.trim());
  }

  /* ---------- Reconocimiento de voz continuo ---------- */

  function crearReconocimiento() {
    rec = new Reconocimiento();
    rec.lang = "es-CO";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = function () { enMarcha = true; };

    rec.onresult = function (ev) {
      for (var i = ev.resultIndex; i < ev.results.length; i++) {
        var r = ev.results[i];
        var txt = (r[0] && r[0].transcript || "").trim();
        if (!txt) continue;
        if (r.isFinal) procesar(txt);
        else { oido = txt + "…"; dibujarEstado(false); }
      }
    };

    rec.onerror = function (e) {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        activo = false;
        estado = "error";
        mensajeError = "Permite el micrófono en el navegador (y abre la página con https).";
        actualizarBoton();
        dibujarEstado(true);
      } else if (e.error === "audio-capture") {
        mensajeError = "No encuentro el micrófono.";
        noAntesDe = Date.now() + 3000;
      } else if (e.error === "network") {
        mensajeError = "Sin internet para reconocer la voz.";
        noAntesDe = Date.now() + 3000;
      }
    };

    rec.onend = function () {
      enMarcha = false;
      noAntesDe = Math.max(noAntesDe, Date.now() + 350);
    };
  }

  function arrancar() {
    if (!rec) crearReconocimiento();
    try { rec.start(); } catch (e) { /* ya estaba iniciado */ }
  }

  // Vigilante: pausa el micrófono mientras Xandro habla y lo reanuda después
  setInterval(function () {
    if (!activo) return;
    var habla = LUNIX.hablando;
    var nuevo = habla ? "hablando" : (LUNIX.pensando ? "pensando" : (mensajeError && !enMarcha ? "error" : "escuchando"));

    if (habla) {
      noAntesDe = Date.now() + 800; // espera un poco tras terminar de hablar
      if (enMarcha) { try { rec.abort(); } catch (e) {} }
    } else if (!enMarcha && Date.now() >= noAntesDe) {
      arrancar();
    }
    if (enMarcha && !habla) mensajeError = "";

    if (nuevo !== estado) { estado = nuevo; dibujarEstado(true); }
  }, 300);

  /* ---------- Indicadores en pantalla ---------- */

  function textoEstado() {
    if (estado === "hablando") return "Xandro está hablando";
    if (estado === "pensando") return "Xandro está pensando…";
    if (estado === "error") return mensajeError || "Micrófono no disponible";
    return "Te escucho · di “llévame a Arte”";
  }

  // Panel 3D pegado a la cámara: se ve en los dos ojos del VR BOX
  function construirHud() {
    if (hud) return hud;
    var cam = document.querySelector("#camara");
    if (!cam || typeof crearPlano === "undefined") return null;
    hud = crearPlano(1.15, 0.36);
    hud.mat.depthTest = false;
    hud.mesh.renderOrder = 999;
    hud.montar(cam);
    hud.el.setAttribute("position", "0 -0.62 -1.2");
    hud.el.setAttribute("visible", false);
    return hud;
  }

  function dibujarHud() {
    var h = construirHud();
    if (!h) return;
    var ctx = h.ctx, w = h.canvas.width, ht = h.canvas.height;
    ctx.clearRect(0, 0, w, ht);
    rectRedondeado(ctx, 4, 4, w - 8, ht - 8, 40);
    ctx.fillStyle = "rgba(8,10,26,0.82)";
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = estado === "error" ? "#ff5a6e" : (estado === "hablando" ? "#ffd54a" : "#4dd0e1");
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 " + Math.round(ht * 0.24) + "px " + FUENTE;
    ctx.fillStyle = "#ffffff";
    ctx.fillText((estado === "escuchando" ? "🎤 " : "") + textoEstado(), w / 2, ht * 0.34, w - 50);

    ctx.font = "500 " + Math.round(ht * 0.2) + "px " + FUENTE;
    ctx.fillStyle = "#ffd54a";
    var linea = oido ? "“" + oido + "”" : "";
    if (linea.length > 42) linea = "…" + linea.slice(-40);
    ctx.fillText(linea, w / 2, ht * 0.7, w - 50);
    h.refrescar();
  }

  function dibujarEstado(forzar) {
    var firma = estado + "|" + oido + "|" + (enVRBOX() ? "v" : "n");
    var ahora = Date.now();
    if (!forzar && ahora - dibujadoT < 300) return;
    if (firma === dibujado && !forzar) return;
    dibujado = firma; dibujadoT = ahora;

    if (hud) hud.el.setAttribute("visible", activo && enVRBOX());
    if (activo && enVRBOX()) dibujarHud();

    // aviso 2D cuando no estamos en VR BOX
    if (!pildora) {
      pildora = document.createElement("div");
      pildora.id = "vozEstado";
      document.body.appendChild(pildora);
    }
    var mostrar = (activo || estado === "error") && !enVRBOX();
    pildora.style.display = mostrar ? "block" : "none";
    if (mostrar) pildora.textContent = (estado === "escuchando" ? "🎤 " : "") + textoEstado() + (oido ? "  ·  “" + oido + "”" : "");
    pildora.className = estado;
  }

  function actualizarBoton() {
    if (!btn) return;
    btn.classList.toggle("activo", activo);
    btn.setAttribute("aria-pressed", activo ? "true" : "false");
    btn.textContent = activo ? "🎙 Manos libres: ON" : "🎙 Manos libres";
  }

  /* ---------- Encendido / apagado ---------- */

  function iniciar() {
    if (!Reconocimiento) {
      estado = "error";
      mensajeError = "Este navegador no escucha la voz. Usa Chrome en Android.";
      dibujarEstado(true);
      return false;
    }
    if (activo) return true;
    activo = true;
    estado = "escuchando";
    mensajeError = "";
    oido = "";
    noAntesDe = 0;
    actualizarBoton();
    dibujarEstado(true);
    arrancar(); // se llama dentro del toque del usuario: así el navegador deja usar el micrófono
    return true;
  }

  function detener() {
    activo = false;
    estado = "apagado";
    if (rec) { try { rec.abort(); } catch (e) {} }
    enMarcha = false;
    actualizarBoton();
    dibujarEstado(true);
  }

  if (btn) {
    btn.addEventListener("click", function () { activo ? detener() : iniciar(); });
  }

  // Los botones de entrada y de VR BOX encienden la voz dentro del toque del usuario
  ["#btnEntrarVR", "#btnStereo"].forEach(function (sel) {
    var el = document.querySelector(sel);
    if (el) el.addEventListener("click", function () {
      // btnStereo alterna: solo encendemos al activar (o si todavía no estaba activo el modo)
      if (sel === "#btnStereo" && enVRBOX()) return; // lo está apagando
      iniciar();
    }, true);
  });

  // Si el modo VR BOX se apaga, la voz sigue (puedes apagarla con el botón)
  window.addEventListener("lunix-vrbox", function () { dibujarEstado(true); });

  window.LUNIX_voz = { iniciar: iniciar, detener: detener, procesar: procesar };
})();
