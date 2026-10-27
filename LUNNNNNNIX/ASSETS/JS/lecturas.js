/* Contenido ampliado de cada mundo: se muestra al pulsar el botón de una tarjeta */
const ampliaciones = {
  "mecanica": {
    parrafos: [
      "Una máquina es una historia contada con piezas: cada engranaje, pistón y rodamiento tiene un motivo para existir. Entender cómo se transmite el movimiento de una pieza a otra es aprender a leer el idioma de los motores.",
      "La literatura también está llena de máquinas: desde los robots de la ciencia ficción hasta viajes en moto que se vuelven filosofía. Leer sobre mecánica entrena la paciencia, la observación y el pensamiento ordenado."
    ],
    libros: [
      "Zen y el arte del mantenimiento de la motocicleta, de Robert M. Pirsig",
      "Yo, robot, de Isaac Asimov",
      "The Way Things Work, de David Macaulay: explica con dibujos cómo funcionan las máquinas"
    ]
  },
  "arte": {
    parrafos: [
      "El arte es una forma de leer el mundo sin palabras: un cuadro, una escultura o una danza guardan ideas, emociones y épocas enteras. Mirar con calma es el primer paso para comprender lo que un artista quiso decir.",
      "Escritores y artistas se han inspirado entre sí durante siglos. Una novela puede nacer de un retrato, y una pintura puede contar lo que un poema apenas sugiere."
    ],
    libros: [
      "La historia del arte, de E. H. Gombrich",
      "Maneras de ver, de John Berger",
      "El retrato de Dorian Gray, de Oscar Wilde"
    ]
  },
  "realeza": {
    parrafos: [
      "Reyes, reinas y príncipes han sido protagonistas de la historia y de la literatura. Sus coronas, palacios y ceremonias muestran cómo se organizó el poder y cómo se contaron esas historias a las generaciones siguientes.",
      "En los libros, la realeza sirve para hablar de ambición, deber, lealtad y soledad. Leer estas historias ayuda a entender decisiones que cambiaron países enteros."
    ],
    libros: [
      "Hamlet, de William Shakespeare",
      "El príncipe, de Nicolás Maquiavelo",
      "El Principito, de Antoine de Saint-Exupéry"
    ]
  },
  "biologia-marina": {
    parrafos: [
      "El océano es el mayor hogar de la Tierra y aún guarda secretos. Cada ecosistema, desde un arrecife hasta una fosa profunda, depende de equilibrios delicados que podemos aprender a cuidar.",
      "Los mares han inspirado grandes aventuras literarias y también libros de divulgación científica. Leer sobre ellos nos recuerda que lo que hacemos en un río termina afectando a la costa."
    ],
    libros: [
      "Veinte mil leguas de viaje submarino, de Julio Verne",
      "El viejo y el mar, de Ernest Hemingway",
      "El mar que nos rodea, de Rachel Carson"
    ]
  },
  "cosmetologia": {
    parrafos: [
      "La cosmetología une ciencia, técnica y cuidado personal. Conocer la piel, el cabello y los ingredientes de cada producto permite elegir con criterio y cuidar la salud además de la apariencia.",
      "A lo largo de la historia, la belleza ha cambiado de significado según la cultura y la época. La literatura la ha retratado como poder, ritual, identidad y también como tema de reflexión."
    ],
    libros: [
      "El perfume, de Patrick Süskind",
      "Historia de la belleza, de Umberto Eco"
    ]
  }
};

/* Imágenes por mundo (se rotan entre las tarjetas) */
const imagenesMundo = {
  "mecanica": ["lenny-kuhne-jHZ70nRk7Ns-unsplash.jpg", "automotriz.webp"],
  "arte": ["dan-farrell-fT49QnFucQ8-unsplash.jpg"],
  "realeza": ["jessica-kantak-bailey-WMCvwBTWSi0-unsplash.jpg", "Victoria_Marriage01.jpg"],
  "biologia-marina": ["kris-mikael-krister-aGihPIbrtVE-unsplash.jpg", "biologia.jpg"],
  "cosmetologia": ["look-studio-HtXyytr9304-unsplash.jpg", "cosmetologia-imagen.jpg", "Cosmetologia.jpg"]
};
function imgMundo(mundo, i) {
  const l = imagenesMundo[mundo] || imagenesMundo["arte"];
  return "ASSETS/Imagenes/" + l[i % l.length];
}

/* Fondo de imágenes que se desplazan detrás del panel de cada mundo */
let _fondoT = null;
function ponerFondoMundo(m) {
  const p = document.getElementById("mundoPanel"); if (!p) return;
  clearInterval(_fondoT); const v = p.querySelector(".mundo-fondo"); if (v) v.remove();
  const f = document.createElement("div"); f.className = "mundo-fondo";
  (imagenesMundo[m] || []).forEach((n, i) => {
    const d = document.createElement("div");
    d.style.backgroundImage = "url('ASSETS/Imagenes/" + n + "')";
    if (!i) d.className = "on"; f.appendChild(d);
  });
  p.prepend(f); let k = 0; const s = f.children;
  if (s.length > 1) _fondoT = setInterval(() => { s[k].classList.remove("on"); k = (k + 1) % s.length; s[k].classList.add("on"); }, 5000);
}
