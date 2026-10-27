/* Lecciones automáticas: lectura + preguntas generadas desde Wikipedia */
(function () {
  const TEMAS = {
    "Biología marina": ["Arrecife de coral","Tiburón ballena","Fosa de las Marianas","Manglar","Delfín","Pulpo","Medusa","Tortuga marina"],
    "Mecánica": ["Motor de combustión interna","Caja de cambios","Freno de disco","Turbocompresor","Cigüeñal","Suspensión de automóvil","Engranaje","Motor eléctrico"],
    "Arte": ["Impresionismo","Renacimiento","Cubismo","La Gioconda","Escultura","Acuarela","Vincent van Gogh","Surrealismo"],
    "Realeza": ["Monarquía","Isabel II","Palacio de Versalles","Corona real","Luis XIV de Francia","Cleopatra","Felipe II de España","Imperio bizantino"],
    "Cosmetología": ["Cosmética","Piel humana","Peluquería","Manicura","Protector solar","Perfume","Maquillaje","Cabello"]
  };
  const COL = {"Biología marina":"#3396FF","Mecánica":"#FF3222","Arte":"#FFA424","Realeza":"#F5B82F","Cosmetología":"#F40898"};
  let xp = 0; try { xp = +localStorage.getItem("lu_xp") || 0; } catch (e) {}
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const mk = h => { const d = document.createElement("div"); d.innerHTML = h.trim(); return d.firstChild; };
  const btn = mk('<button class="lx-abrir" type="button">✨ Crear lección</button>');
  const modal = mk('<div class="lx-modal" hidden><div class="lx-ventana"><button class="lx-cerrar" type="button" aria-label="Cerrar">×</button><div class="lx-cuerpo"></div></div></div>');
  document.body.append(btn, modal);
  const cuerpo = modal.querySelector(".lx-cuerpo");
  btn.onclick = () => { modal.hidden = false; menu(); };
  modal.querySelector(".lx-cerrar").onclick = () => { modal.hidden = true; };

  function menu() {
    cuerpo.innerHTML = "<h2>Aprende lo que quieras</h2><p>Escribe un tema y se crea una lección con lectura y preguntas. XP total: <b>" + xp + "</b></p>" +
      '<div class="lx-buscar"><input id="lxq" placeholder="Ej: impresionismo, motor, arrecife..."><button data-act="go" type="button">Crear</button></div>' +
      Object.keys(TEMAS).map(m => '<h3 style="color:' + COL[m] + '">' + m + '</h3><div class="lx-chips">' +
        TEMAS[m].map(t => '<button type="button" data-t="' + esc(t) + '" style="--c:' + COL[m] + '">' + esc(t) + "</button>").join("") + "</div>").join("");
  }
  cuerpo.addEventListener("click", e => {
    const t = e.target.dataset.t, a = e.target.dataset.act;
    if (t) crear(t);
    if (a === "go") crear((document.getElementById("lxq") || {}).value || "");
    if (a === "menu") menu();
    if (a === "quiz") pregunta();
    if (a === "next") { S.i++; pregunta(); }
    if (a === "cerrar") modal.hidden = true;
    if (e.target.dataset.o !== undefined) responder(+e.target.dataset.o);
  });
  cuerpo.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.id === "lxq") crear(e.target.value); });

  async function crear(q) {
    q = q.trim(); if (!q) return;
    cuerpo.innerHTML = '<p class="lx-cargando">Preparando lección sobre «' + esc(q) + '»…</p>';
    try {
      const u = "https://es.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrlimit=1&gsrsearch=" + encodeURIComponent(q) +
        "&prop=extracts|pageimages&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=700";
      const r = await (await fetch(u)).json();
      leccion(Object.values(r.query.pages)[0]);
    } catch (e) {
      cuerpo.innerHTML = '<p>No encontré información de ese tema o no hay conexión a internet. Prueba con otra palabra.</p><button class="lx-sig" data-act="menu" type="button">Volver</button>';
    }
  }
  let S = {};
  function leccion(p) {
    const txt = (p.extract || "").replace(/\s*\([^)]*\)/g, "").replace(/\s+/g, " ");
    const fr = txt.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/).filter(s => s.length > 40);
    const W = /[A-Za-zÁÉÍÓÚáéíóúñÑü]{6,}/g;
    const pool = [...new Set((txt.match(W) || []).map(w => w.toLowerCase()))];
    const preg = [];
    fr.slice(0, 10).forEach(s => {
      if (preg.length >= 5 || s.length < 60 || s.length > 260) return;
      const ws = (s.match(W) || []).filter(w => s.indexOf(w) > 0 && w === w.toLowerCase());
      if (!ws.length || pool.length < 4) return;
      const ans = ws.sort((a, b) => b.length - a.length)[0];
      const d = pool.filter(w => w !== ans.toLowerCase()).sort(() => Math.random() - .5).slice(0, 3);
      const ops = [ans, ...d].sort(() => Math.random() - .5);
      preg.push({ t: s.replace(ans, "_____"), ops, ok: ops.indexOf(ans) });
    });
    S = { titulo: p.title, preg, i: 0, vidas: 3, pts: 0 };
    cuerpo.innerHTML = "<h2>" + esc(p.title) + "</h2>" + (p.thumbnail ? '<img class="lx-img" src="' + esc(p.thumbnail.source) + '" alt="">' : "") +
      "<p class='lx-lectura'>" + esc(fr.slice(0, 4).join(" ") || txt.slice(0, 600)) + "</p>" +
      (preg.length ? '<button class="lx-sig" data-act="quiz" type="button">Empezar preguntas</button>' : '<p>Este tema es muy corto para crear preguntas. Prueba con otro.</p><button class="lx-sig" data-act="menu" type="button">Volver</button>');
  }
  function pregunta() {
    const q = S.preg[S.i];
    if (!q || S.vidas <= 0) {
      xp += S.pts; try { localStorage.setItem("lu_xp", xp); } catch (e) {}
      cuerpo.innerHTML = "<h2>" + (S.vidas > 0 ? "¡Lección completada!" : "Te quedaste sin vidas") + "</h2><p class='lx-lectura'>Ganaste <b>+" + S.pts + " XP</b> con «" + esc(S.titulo) + "». XP total: " + xp + ".</p>" +
        '<button class="lx-sig" data-act="menu" type="button">Otro tema</button> <button class="lx-sig" data-act="cerrar" type="button">Cerrar</button>';
      return;
    }
    cuerpo.innerHTML = '<div class="lx-barra"><i style="width:' + (S.i / S.preg.length * 100) + '%"></i></div><p class="lx-vidas">' + "❤".repeat(S.vidas) + "</p>" +
      "<h3>Completa la frase</h3><p class='lx-lectura'>" + esc(q.t) + "</p>" + q.ops.map((o, n) => '<button class="lx-op" data-o="' + n + '" type="button">' + esc(o) + "</button>").join("");
  }
  function responder(n) {
    const q = S.preg[S.i], ops = cuerpo.querySelectorAll(".lx-op");
    ops.forEach((b, k) => { b.disabled = true; if (k === q.ok) b.classList.add("ok"); });
    if (n === q.ok) S.pts += 10; else { ops[n].classList.add("bad"); S.vidas--; }
    cuerpo.insertAdjacentHTML("beforeend", '<p>' + (n === q.ok ? "¡Correcto! +10 XP" : "Casi. La respuesta correcta está en verde.") + '</p><button class="lx-sig" data-act="next" type="button">Continuar</button>');
  }
})();
