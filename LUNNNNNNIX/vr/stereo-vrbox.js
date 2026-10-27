/* LUNIX · Modo VR BOX: dos vistas lado a lado para gafas tipo Cardboard / VR BOX */
(function () {
  "use strict";

  var sceneEl = document.querySelector("#escena");
  var button = document.querySelector("#btnStereo");
  if (!sceneEl || !button) return;

  var active = false;
  var stereo = null;
  var originalRender = null;
  var renderer = null;
  var savedFov = null;
  var overlay = null;

  /* Separación ocular moderada (metros). Valores altos = más “3D” y más zoom aparente. */
  var EYE_SEP = 0.032;
  /* FOV más amplio en VR BOX para compensar que cada ojo solo ve media pantalla */
  var FOV_VR = 95;
  var FOV_NORMAL = 80;

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "vrbox-mask";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);
    return overlay;
  }

  function initStereo() {
    if (!window.AFRAME || !AFRAME.THREE) return;
    var THREE = AFRAME.THREE;
    if (!stereo) {
      stereo = new THREE.StereoCamera();
      stereo.eyeSep = EYE_SEP;
    }
  }

  function setCameraFov(fov) {
    var camEl = document.querySelector("#camara");
    if (!camEl) return;
    var cam = camEl.getObject3D("camera");
    if (!cam) return;
    if (savedFov === null) savedFov = cam.fov;
    cam.fov = fov;
    cam.aspect = window.innerWidth / Math.max(1, window.innerHeight);
    cam.updateProjectionMatrix();
    try {
      camEl.setAttribute("camera", "fov", fov);
    } catch (e) {}
  }

  function enableStereoRender() {
    initStereo();
    renderer = sceneEl.renderer;
    if (!renderer || !stereo || originalRender) return;

    originalRender = renderer.render.bind(renderer);

    renderer.render = function (scene, camera) {
      if (!active || !camera || camera.isArrayCamera || (sceneEl.is && sceneEl.is("vr-mode"))) {
        return originalRender(scene, camera);
      }

      var canvas = renderer.domElement;
      var width = canvas.width || 0;
      var height = canvas.height || 0;
      if (!width || !height) return;

      /* Cada mitad tiene aspect halfW/height → FOV vertical se mantiene, se ve más “ancha” por FOV alto */
      var half = Math.floor(width / 2);
      stereo.aspect = half / height;
      stereo.eyeSep = EYE_SEP;
      stereo.update(camera);

      var oldAutoClear = renderer.autoClear;
      var hadScissor = renderer.getScissorTest ? renderer.getScissorTest() : false;

      renderer.autoClear = false;
      renderer.setScissorTest(true);
      renderer.clear(true, true, true);

      /* Ojo izquierdo */
      renderer.setViewport(0, 0, half, height);
      renderer.setScissor(0, 0, half, height);
      originalRender(scene, stereo.cameraL);

      /* Ojo derecho */
      renderer.setViewport(half, 0, width - half, height);
      renderer.setScissor(half, 0, width - half, height);
      originalRender(scene, stereo.cameraR);

      renderer.setScissorTest(hadScissor);
      renderer.setViewport(0, 0, width, height);
      renderer.autoClear = oldAutoClear;
    };
  }

  function restoreMono() {
    if (renderer && originalRender) {
      renderer.render = originalRender;
      originalRender = null;
    }
    if (savedFov !== null) {
      setCameraFov(savedFov);
      savedFov = null;
    } else {
      setCameraFov(FOV_NORMAL);
    }
  }

  async function requestOrientationPermission() {
    var D = window.DeviceOrientationEvent;
    if (D && typeof D.requestPermission === "function") {
      try {
        var permission = await D.requestPermission();
        if (permission !== "granted") return false;
      } catch (e) {
        return false;
      }
    }
    return true;
  }

  function setLookMode(vrBox) {
    var cam = document.querySelector("#camara");
    if (!cam) return;
    if (vrBox) {
      cam.setAttribute(
        "look-controls",
        "touchEnabled: true; magicWindowTracking: true; pointerLockEnabled: false"
      );
    } else {
      cam.setAttribute(
        "look-controls",
        "touchEnabled: true; magicWindowTracking: false; pointerLockEnabled: false"
      );
    }
  }

  window.LUNIX_activarVRBOX = async function (forceOn) {
    var wantOn = typeof forceOn === "boolean" ? forceOn : !active;

    if (wantOn && !active) {
      var permitted = await requestOrientationPermission();
      if (!permitted) {
        alert(
          "Para usar VR BOX, permite el acceso al movimiento del dispositivo en el navegador."
        );
        return false;
      }
      active = true;
      document.body.classList.add("modo-vrbox");
      button.setAttribute("aria-pressed", "true");
      button.textContent = "✓ VR BOX activado";
      ensureOverlay();
      setCameraFov(FOV_VR);
      enableStereoRender();
      setLookMode(true);
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock("landscape").catch(function () {});
      }
      /* Fuerza un resize para que A-Frame actualice el canvas a pantalla completa */
      setTimeout(function () {
        window.dispatchEvent(new Event("resize"));
      }, 100);
      window.dispatchEvent(new CustomEvent("lunix-vrbox", { detail: { activo: true } }));
      return true;
    }

    if (!wantOn && active) {
      active = false;
      document.body.classList.remove("modo-vrbox");
      button.setAttribute("aria-pressed", "false");
      button.textContent = "🥽 Modo VR BOX";
      restoreMono();
      setLookMode(false);
      if (screen.orientation && screen.orientation.unlock) {
        try {
          screen.orientation.unlock();
        } catch (e) {}
      }
      window.dispatchEvent(new CustomEvent("lunix-vrbox", { detail: { activo: false } }));
      return false;
    }
    return active;
  };

  button.addEventListener("click", function () {
    window.LUNIX_activarVRBOX(!active);
  });

  sceneEl.addEventListener("renderstart", function () {
    if (active) enableStereoRender();
  });

  window.addEventListener("resize", function () {
    if (active) {
      initStereo();
      setCameraFov(FOV_VR);
    }
  });
})();
