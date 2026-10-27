/* =========================================================
   VARIABLES
========================================================= */

let mundoActual = null;
let indiceActual = 0;

let velocidad = 0.55;
let posicion = 0;
let scrollActivo = false;


/* =========================================================
   SCROLL AUTOMÁTICO
========================================================= */

function scrollAutomatico() {

    if (!scrollActivo) return;

    posicion += velocidad;

    window.scrollTo(0, posicion);

    const limite =
        document.documentElement.scrollHeight -
        window.innerHeight;

    if (posicion >= limite) {
        posicion = 0;
        window.scrollTo(0, 0);
    }

    requestAnimationFrame(scrollAutomatico);
}


/* =========================================================
   SISTEMA DE PLANETAS
========================================================= */

const sistema =
    document.getElementById("sistema");

const planetas = [];


function prepararPlanetas() {

    if (!sistema) return;

    const elementos =
        sistema.querySelectorAll(".planeta");

    elementos.forEach(planeta => {

        const radio =
            Number(planeta.dataset.radio);

        const velocidadPlaneta =
            Number(planeta.dataset.velocidad);

        const inicio =
            Number(planeta.dataset.inicio);

        const orbita =
            document.createElement("div");

        orbita.className = "orbita";

        orbita.style.width =
            `${radio * 2}%`;

        orbita.style.height =
            `${radio * 2}%`;

        sistema.insertBefore(
            orbita,
            planeta
        );

        planetas.push({
            elemento: planeta,
            radio: radio,
            velocidad: velocidadPlaneta,
            inicio: inicio
        });
    });
}


function moverPlanetas(tiempo) {

    const segundos =
        tiempo / 1000;

    planetas.forEach(planeta => {

        const angulo =
            planeta.inicio +
            segundos * planeta.velocidad;

        const radianes =
            angulo * Math.PI / 180;

        const x =
            50 +
            planeta.radio *
            Math.cos(radianes);

        const y =
            50 +
            planeta.radio *
            Math.sin(radianes);

        planeta.elemento.style.left =
            `${x}%`;

        planeta.elemento.style.top =
            `${y}%`;
    });

    requestAnimationFrame(
        moverPlanetas
    );
}


/* =========================================================
   DATOS DE LOS MUNDOS
========================================================= */

const mundos = {

    /* =====================================================
       BIOLOGÍA MARINA
    ===================================================== */

    "biologia-marina": {

        etiqueta:
            "MUNDO 04 · DATOS Y EDUCACIÓN",

        titulo:
            "Biología Marina",

        descripcion:
            "Explora los organismos, ecosistemas y fenómenos que hacen posible la vida en los océanos.",

        color:
            "#3396FF",

        oscuro:
            "#082452",

        tipIzq: {
            icono: "🌊",
            titulo: "CONSEJO",
            texto:
                "Evita arrojar residuos a las calles. Muchos terminan llegando a ríos y posteriormente al mar."
        },

        tipDer: {
            icono: "🐢",
            titulo: "DATO CURIOSO",
            texto:
                "Los océanos cubren cerca del 71 % de la superficie terrestre y participan en la regulación del clima."
        },

        tarjetas: [

            {
                titulo: "Ecosistemas marinos",
                texto:
                    "Los ecosistemas marinos incluyen arrecifes de coral, manglares, praderas marinas, estuarios y zonas profundas. Cada uno posee condiciones ambientales y comunidades de organismos diferentes.",
                bloque:
                    "Arrecifes de coral",
                adicional:
                    "Los arrecifes ofrecen refugio y alimento a numerosas especies y funcionan como zonas de alta diversidad biológica.",
                boton:
                    "Explorar"
            },

            {
                titulo: "Vida marina",
                texto:
                    "La vida marina comprende peces, mamíferos, moluscos, crustáceos, cnidarios, algas, microorganismos y muchas otras formas de vida.",
                bloque:
                    "Adaptaciones",
                adicional:
                    "Las especies marinas presentan adaptaciones relacionadas con la salinidad, presión, temperatura, profundidad y disponibilidad de luz.",
                boton:
                    "Descubrir"
            },

            {
                titulo: "El océano",
                texto:
                    "El océano presenta diferentes zonas determinadas por la profundidad, la cantidad de luz, la temperatura y la presión.",
                bloque:
                    "Zonas oceánicas",
                adicional:
                    "La zona superficial recibe mayor cantidad de luz, mientras que en las zonas profundas las condiciones son más extremas.",
                boton:
                    "Aprender"
            },

            {
                titulo: "Pesca y acuicultura",
                texto:
                    "La pesca y la acuicultura son actividades relacionadas con el aprovechamiento y producción de organismos acuáticos.",
                bloque:
                    "Acuicultura",
                adicional:
                    "La acuicultura permite producir especies acuáticas bajo sistemas controlados y puede contribuir al abastecimiento de alimentos.",
                boton:
                    "Investigar"
            },

            {
                titulo: "Conservación",
                texto:
                    "La conservación marina busca proteger los ecosistemas, las especies y los recursos naturales frente a diferentes presiones ambientales.",
                bloque:
                    "Principales amenazas",
                adicional:
                    "Entre las amenazas se encuentran la contaminación, pérdida de hábitats, sobreexplotación de recursos y cambio climático.",
                boton:
                    "Conservar"
            },

            {
                titulo: "Ríos y mares",
                texto:
                    "Los ríos están conectados con los mares mediante sistemas hidrológicos. La contaminación generada en tierra puede terminar desplazándose hacia ambientes costeros.",
                bloque:
                    "Cómo ayudar",
                adicional:
                    "Reducir residuos, ahorrar agua, evitar plásticos de un solo uso y cuidar las fuentes hídricas son acciones sencillas.",
                boton:
                    "Aprender"
            },

            {
                titulo: "Lecturas recomendadas",
                texto:
                    "La literatura y la divulgación científica permiten acercarse a los océanos desde diferentes perspectivas.",
                bloque:
                    "Recursos",
                adicional:
                    "Puedes complementar el tema mediante libros de divulgación, cuentos sobre océanos y publicaciones científicas.",
                boton:
                    "Buscar libros",
                enlace:
                    "https://www.google.com/search?q=libros+sobre+biologia+marina"
            },

            {
                titulo: "Curiosidades marinas",
                texto:
                    "Los océanos contienen ambientes extremadamente diversos y todavía existen numerosos procesos y organismos que continúan siendo estudiados.",
                bloque:
                    "Explora",
                adicional:
                    "La investigación científica permite conocer mejor la biodiversidad marina y comprender cómo los cambios ambientales afectan los ecosistemas.",
                boton:
                    "Ver más"
            },

            {
                tipo: "videos",
                titulo: "Videos",
                texto: "El océano, sus ecosistemas y la vida marina explicados mediante contenido audiovisual.",
                bloque: "Contenido audiovisual",
                adicional: "Puedes reproducir el video directamente desde esta tarjeta.",
                boton: "Reproducir",
                videoTemplate: "video-template-biologia-marina",
                orientacionVideo: "biologia"
            }

        ]
    },


    /* =====================================================
       MECÁNICA
    ===================================================== */

    "mecanica": {

        etiqueta:
            "MUNDO 01 · MECÁNICA",

        titulo:
            "Mecánica",

        descripcion:
            "Descubre los principios que permiten comprender el movimiento, las máquinas y los sistemas mecánicos.",

        color:
            "#FF3222",

        oscuro:
            "#48110d",

        tipIzq: {
            icono: "🔧",
            titulo: "CONSEJO",
            texto:
                "Realizar mantenimiento preventivo ayuda a detectar problemas antes de que produzcan daños mayores."
        },

        tipDer: {
            icono: "⚙️",
            titulo: "DATO CURIOSO",
            texto:
                "Un automóvil está formado por numerosos sistemas que trabajan coordinadamente para producir movimiento."
        },

        tarjetas: [

            {
                titulo: "Movimiento",
                texto:
                    "La mecánica estudia el movimiento de los cuerpos y las fuerzas que pueden modificarlo.",
                bloque:
                    "Fuerza",
                adicional:
                    "Una fuerza puede producir cambios en el movimiento, deformaciones o modificaciones en el estado de un objeto.",
                boton:
                    "Aprender"
            },

            {
                titulo: "Motor",
                texto:
                    "El motor transforma energía en trabajo mecánico para producir movimiento.",
                bloque:
                    "Combustión",
                adicional:
                    "En los motores de combustión interna, una mezcla de combustible y aire participa en un proceso que genera energía mecánica.",
                boton:
                    "Explorar"
            },

            {
                titulo: "Transmisión",
                texto:
                    "El sistema de transmisión permite llevar la potencia generada por el motor hacia las ruedas.",
                bloque:
                    "Componentes",
                adicional:
                    "Entre sus componentes pueden encontrarse embrague, caja de cambios, diferencial y diferentes elementos de transmisión.",
                boton:
                    "Descubrir"
            },

            {
                titulo: "Frenos",
                texto:
                    "El sistema de frenos permite reducir la velocidad o detener el vehículo.",
                bloque:
                    "Seguridad",
                adicional:
                    "El mantenimiento de pastillas, discos, líquido y demás componentes es fundamental para el funcionamiento adecuado.",
                boton:
                    "Investigar"
            },

            {
                titulo: "Suspensión",
                texto:
                    "La suspensión ayuda a mantener el contacto de las ruedas con la superficie y mejora la estabilidad.",
                bloque:
                    "Elementos",
                adicional:
                    "Amortiguadores, resortes y otros componentes trabajan conjuntamente para controlar los movimientos del vehículo.",
                boton:
                    "Aprender"
            },

            {
                titulo: "Electricidad automotriz",
                texto:
                    "Los vehículos modernos utilizan numerosos sistemas eléctricos y electrónicos.",
                bloque:
                    "Sistema eléctrico",
                adicional:
                    "Batería, alternador, sensores, unidades de control y cableado participan en diferentes funciones.",
                boton:
                    "Explorar"
            },

            {
                titulo: "Mantenimiento",
                texto:
                    "El mantenimiento preventivo permite revisar periódicamente diferentes componentes.",
                bloque:
                    "Prevención",
                adicional:
                    "Revisar niveles, filtros, neumáticos y componentes mecánicos ayuda a conservar el vehículo en buenas condiciones.",
                boton:
                    "Consultar"
            },

            {
                titulo: "Lecturas",
                texto:
                    "La mecánica puede estudiarse mediante manuales técnicos, libros educativos y material especializado.",
                bloque:
                    "Recursos",
                adicional:
                    "Consulta libros y documentos de mecánica para profundizar en principios y sistemas.",
                boton:
                    "Buscar libros",
                enlace:
                    "https://www.google.com/search?q=libros+de+mecanica+automotriz"
            },

            {
                tipo: "videos",
                titulo: "Videos",
                texto: "Observa conceptos de movimiento, motores y sistemas mecánicos mediante contenido audiovisual.",
                bloque: "Contenido audiovisual",
                adicional: "Puedes reproducir el video directamente desde esta tarjeta.",
                boton: "Reproducir",
                videoTemplate: "video-template-mecanica",
                orientacionVideo: "horizontal"
            }

        ]
    },


    /* =====================================================
       ARTE
    ===================================================== */

    "arte": {

        etiqueta:
            "MUNDO 02 · ARTE",

        titulo:
            "Arte",

        descripcion:
            "Conoce movimientos, técnicas, artistas y formas de expresión que han construido la historia del arte.",

        color:
            "#F238FF",

        oscuro:
            "#350c3d",

        tipIzq: {
            icono: "🎨",
            titulo: "CONSEJO",
            texto:
                "Observar una obra con atención permite descubrir detalles, símbolos y decisiones que pueden pasar desapercibidos."
        },

        tipDer: {
            icono: "🖼️",
            titulo: "DATO CURIOSO",
            texto:
                "El arte ha servido como forma de expresión, comunicación y registro cultural durante miles de años."
        },

        tarjetas: [

            {
                titulo: "Historia del arte",
                texto:
                    "La historia del arte estudia diferentes manifestaciones visuales producidas por las sociedades a través del tiempo.",
                bloque:
                    "Culturas",
                adicional:
                    "Pintura, escultura, arquitectura y otras disciplinas reflejan diferentes contextos históricos.",
                boton:
                    "Explorar"
            },

            {
                titulo: "Pintura",
                texto:
                    "La pintura utiliza pigmentos y diferentes superficies para crear imágenes, composiciones y representaciones.",
                bloque:
                    "Técnicas",
                adicional:
                    "Óleo, acuarela, acrílico y temple son algunas técnicas utilizadas en diferentes épocas.",
                boton:
                    "Aprender"
            },

            {
                titulo: "Escultura",
                texto:
                    "La escultura trabaja con volumen y espacio mediante materiales como piedra, madera, metal o arcilla.",
                bloque:
                    "Materiales",
                adicional:
                    "Las técnicas escultóricas han cambiado según los materiales y herramientas disponibles.",
                boton:
                    "Descubrir"
            },

            {
                titulo: "Arte moderno",
                texto:
                    "El arte moderno reunió diferentes movimientos que experimentaron con nuevas formas, colores y conceptos.",
                bloque:
                    "Innovación",
                adicional:
                    "Las vanguardias cuestionaron algunas normas tradicionales de representación.",
                boton:
                    "Investigar"
            },

            {
                titulo: "Arte colombiano",
                texto:
                    "El arte colombiano reúne manifestaciones relacionadas con diferentes regiones, épocas y contextos culturales.",
                bloque:
                    "Identidad",
                adicional:
                    "La diversidad cultural del país se refleja en sus expresiones artísticas.",
                boton:
                    "Conocer"
            },

            {
                titulo: "Diseño y creatividad",
                texto:
                    "El diseño utiliza elementos visuales para comunicar ideas y solucionar necesidades.",
                bloque:
                    "Elementos",
                adicional:
                    "Color, forma, composición, tipografía y espacio pueden combinarse para construir mensajes visuales.",
                boton:
                    "Explorar"
            },

            {
                titulo: "Libros y cuentos",
                texto:
                    "La literatura artística permite conocer movimientos, artistas y contextos históricos.",
                bloque:
                    "Recursos",
                adicional:
                    "Puedes complementar este mundo con libros de historia del arte, cuentos y publicaciones culturales.",
                boton:
                    "Buscar libros",
                enlace:
                    "https://www.google.com/search?q=libros+sobre+historia+del+arte"
            },

            {
                titulo: "Curiosidades",
                texto:
                    "Una obra puede tener diferentes interpretaciones dependiendo del contexto y de la persona que la observa.",
                bloque:
                    "Observación",
                adicional:
                    "Analizar una obra implica observar sus elementos y relacionarlos con su contexto.",
                boton:
                    "Descubrir"
            },

            {
                tipo: "videos",
                titulo: "Videos",
                texto: "Explora técnicas, obras y formas de expresión artística mediante contenido audiovisual.",
                bloque: "Contenido audiovisual",
                adicional: "Puedes reproducir el video directamente desde esta tarjeta.",
                boton: "Reproducir",
                videoTemplate: "video-template-arte",
                orientacionVideo: "horizontal"
            }

        ]
    },


    /* =====================================================
       REALEZA
    ===================================================== */

    "realeza": {

        etiqueta:
            "MUNDO 03 · REALEZA",

        titulo:
            "Realeza",

        descripcion:
            "Explora la historia de las monarquías, sus símbolos, estructuras sociales, tradiciones y patrimonio.",

        color:
            "#8450FF",

        oscuro:
            "#170b38",

        tipIzq: {
            icono: "🏰",
            titulo: "CONSEJO",
            texto:
                "Conocer la historia ayuda a comprender cómo las sociedades y sus instituciones han cambiado."
        },

        tipDer: {
            icono: "👑",
            titulo: "DATO CURIOSO",
            texto:
                "Las coronas, cetros y escudos fueron utilizados como símbolos relacionados con el poder y la autoridad."
        },

        tarjetas: [

            {
                titulo: "Monarquías",
                texto:
                    "Una monarquía es una forma de organización política en la que el cargo de monarca tiene un papel central.",
                bloque:
                    "Tipos",
                adicional:
                    "A lo largo de la historia han existido diferentes modelos de monarquía.",
                boton:
                    "Aprender"
            },

            {
                titulo: "Castillos",
                texto:
                    "Los castillos fueron construcciones defensivas y residenciales utilizadas principalmente durante la Edad Media.",
                bloque:
                    "Arquitectura",
                adicional:
                    "Sus murallas, torres y sistemas defensivos respondían a las necesidades de diferentes épocas.",
                boton:
                    "Explorar"
            },

            {
                titulo: "Símbolos reales",
                texto:
                    "Las monarquías utilizaron diferentes símbolos para representar autoridad, tradición e identidad.",
                bloque:
                    "Símbolos",
                adicional:
                    "Coronas, cetros, escudos, banderas y emblemas aparecen en diferentes contextos históricos.",
                boton:
                    "Descubrir"
            },

            {
                titulo: "Vida cortesana",
                texto:
                    "Las cortes reales fueron espacios donde se desarrollaban actividades políticas, sociales y culturales.",
                bloque:
                    "Cultura",
                adicional:
                    "La música, literatura, moda y ceremonias podían ocupar un lugar importante.",
                boton:
                    "Investigar"
            },

            {
                titulo: "Patrimonio",
                texto:
                    "Palacios, castillos, obras de arte y documentos forman parte del patrimonio histórico de diferentes sociedades.",
                bloque:
                    "Conservación",
                adicional:
                    "La conservación permite estudiar estos elementos y transmitirlos a nuevas generaciones.",
                boton:
                    "Conocer"
            },

            {
                titulo: "Moda histórica",
                texto:
                    "La vestimenta de las cortes podía reflejar posición social, riqueza y tendencias culturales.",
                bloque:
                    "Vestuario",
                adicional:
                    "Los materiales, colores y accesorios variaban según época y posición.",
                boton:
                    "Explorar"
            },

            {
                titulo: "Literatura histórica",
                texto:
                    "Novelas, cuentos y documentos permiten acercarse a las sociedades relacionadas con la realeza.",
                bloque:
                    "Lecturas",
                adicional:
                    "La literatura histórica puede servir como complemento para estudiar diferentes períodos.",
                boton:
                    "Buscar libros",
                enlace:
                    "https://www.google.com/search?q=libros+historia+de+la+realeza"
            },

            {
                titulo: "Curiosidades",
                texto:
                    "Muchas tradiciones actuales tienen antecedentes en ceremonias y costumbres desarrolladas durante diferentes períodos históricos.",
                bloque:
                    "Historia",
                adicional:
                    "Investigar el contexto ayuda a distinguir entre hechos históricos y representaciones ficticias.",
                boton:
                    "Descubrir"
            },

            {
                tipo: "videos",
                titulo: "Videos",
                texto: "Conoce la historia, los símbolos y el patrimonio de la realeza mediante contenido audiovisual.",
                bloque: "Contenido audiovisual",
                adicional: "Puedes reproducir el video directamente desde esta tarjeta.",
                boton: "Reproducir",
                videoTemplate: "video-template-realeza",
                orientacionVideo: "horizontal"
            }

        ]
    },


    /* =====================================================
       COSMETOLOGÍA
    ===================================================== */

    "cosmetologia": {

        etiqueta:
            "MUNDO 05 · COSMETOLOGÍA",

        titulo:
            "Cosmetología",

        descripcion:
            "Aprende sobre el cuidado estético, la piel, el cabello, las uñas y diferentes técnicas de cosmetología.",

        color:
            "#F40898",

        oscuro:
            "#3b082a",

        tipIzq: {
            icono: "🧴",
            titulo: "CONSEJO",
            texto:
                "La higiene de las herramientas es fundamental para reducir riesgos durante procedimientos estéticos."
        },

        tipDer: {
            icono: "✨",
            titulo: "DATO CURIOSO",
            texto:
                "La piel es el órgano más grande del cuerpo humano y cumple funciones de protección y regulación."
        },

        tarjetas: [

            {
                titulo: "Cuidado de la piel",
                texto:
                    "La cosmetología estudia y aplica procedimientos relacionados con el cuidado estético de la piel.",
                bloque:
                    "Rutina",
                adicional:
                    "Limpieza, hidratación y protección solar son aspectos importantes del cuidado diario.",
                boton:
                    "Aprender"
            },

            {
                titulo: "Cabello",
                texto:
                    "El cabello requiere cuidados relacionados con limpieza, hidratación, corte y protección.",
                bloque:
                    "Cuidado capilar",
                adicional:
                    "Los productos y procedimientos deben seleccionarse considerando las características del cabello.",
                boton:
                    "Explorar"
            },

            {
                titulo: "Uñas",
                texto:
                    "La estética de las uñas incluye procedimientos de cuidado, limpieza y decoración.",
                bloque:
                    "Higiene",
                adicional:
                    "La limpieza y desinfección de herramientas es importante para realizar procedimientos de manera adecuada.",
                boton:
                    "Descubrir"
            },

            {
                titulo: "Maquillaje",
                texto:
                    "El maquillaje utiliza productos cosméticos para modificar o resaltar determinadas características visuales.",
                bloque:
                    "Técnicas",
                adicional:
                    "Color, iluminación y composición permiten crear diferentes estilos.",
                boton:
                    "Investigar"
            },

            {
                titulo: "Colorimetría",
                texto:
                    "La colorimetría estudia la relación entre colores y su aplicación en diferentes contextos estéticos.",
                bloque:
                    "Combinaciones",
                adicional:
                    "La elección de tonos puede considerar piel, cabello, ojos y preferencias personales.",
                boton:
                    "Aprender"
            },

            {
                titulo: "Higiene estética",
                texto:
                    "La higiene es fundamental en los espacios donde se realizan procedimientos cosméticos.",
                bloque:
                    "Prevención",
                adicional:
                    "Limpiar, desinfectar y mantener correctamente los instrumentos ayuda a reducir riesgos.",
                boton:
                    "Conocer"
            },

            {
                titulo: "Lecturas",
                texto:
                    "Los libros especializados permiten ampliar conocimientos sobre piel, cabello, estética y procedimientos.",
                bloque:
                    "Recursos",
                adicional:
                    "Puedes complementar este mundo mediante manuales y libros educativos.",
                boton:
                    "Buscar libros",
                enlace:
                    "https://www.google.com/search?q=libros+de+cosmetologia"
            },

            {
                titulo: "Curiosidades",
                texto:
                    "La cosmetología combina conocimientos técnicos con creatividad y cuidado personal.",
                bloque:
                    "Explora",
                adicional:
                    "El sector incluye diferentes áreas relacionadas con estética y bienestar.",
                boton:
                    "Descubrir"
            },

            {
                tipo: "videos",
                titulo: "Videos",
                texto: "Contenido audiovisual sobre cuidado estético, piel, cabello y técnicas de cosmetología.",
                bloque: "Contenido audiovisual",
                adicional: "Puedes reproducir el video directamente desde esta tarjeta.",
                boton: "Reproducir",
                videoTemplate: "video-template-cosmetologia",
                orientacionVideo: "vertical"
            }

        ]
    }

};


/* =========================================================
   ELEMENTOS
========================================================= */

const mundoPanel =
    document.getElementById("mundoPanel");

const cerrarMundo =
    document.getElementById("cerrarMundo");

const mundoCarrusel =
    document.getElementById("mundoCarrusel");

const mundoEtiqueta =
    document.getElementById("mundoEtiqueta");

const mundoTitulo =
    document.getElementById("mundoTitulo");

const mundoDescripcion =
    document.getElementById("mundoDescripcion");

const tipIconoIzq =
    document.getElementById("tipIconoIzq");

const tipTituloIzq =
    document.getElementById("tipTituloIzq");

const tipTextoIzq =
    document.getElementById("tipTextoIzq");

const tipIconoDer =
    document.getElementById("tipIconoDer");

const tipTituloDer =
    document.getElementById("tipTituloDer");

const tipTextoDer =
    document.getElementById("tipTextoDer");

const mundoContador =
    document.getElementById("mundoContador");

const btnAnterior =
    document.getElementById("btnAnterior");

const btnSiguiente =
    document.getElementById("btnSiguiente");


/* =========================================================
   ABRIR MUNDO
========================================================= */

document.querySelectorAll(".planeta").forEach(planeta => {

    planeta.addEventListener("click", () => {

        const nombre =
            planeta.dataset.section;

        if (!mundos[nombre]) return;

        abrirMundo(nombre);
    });

});


function abrirMundo(nombre) {

    const mundo =
        mundos[nombre];

    if (!mundo) return;

    mundoActual = nombre;

    indiceActual = 0;

    scrollActivo = false;

    mundoPanel.style.setProperty(
        "--mundo-color",
        mundo.color
    );

    mundoPanel.style.setProperty(
        "--mundo-dark",
        mundo.oscuro
    );

    mundoEtiqueta.textContent =
        mundo.etiqueta;

    mundoTitulo.textContent =
        mundo.titulo;

    mundoDescripcion.textContent =
        mundo.descripcion;


    /* TIP IZQUIERDO */

    tipIconoIzq.textContent =
        mundo.tipIzq.icono;

    tipTituloIzq.textContent =
        mundo.tipIzq.titulo;

    tipTextoIzq.textContent =
        mundo.tipIzq.texto;


    /* TIP DERECHO */

    tipIconoDer.textContent =
        mundo.tipDer.icono;

    tipTituloDer.textContent =
        mundo.tipDer.titulo;

    tipTextoDer.textContent =
        mundo.tipDer.texto;


    crearTarjetas(mundo);

    mundoPanel.classList.add("abierto");

    mundoPanel.setAttribute(
        "aria-hidden",
        "false"
    );

    actualizarContador();
}


/* =========================================================
   CREAR TARJETAS
========================================================= */

function crearTarjetas(mundo) {

    mundoCarrusel.innerHTML = "";

    mundo.tarjetas.forEach(
        (tarjeta, indice) => {

            const article =
                document.createElement("article");

            article.className =
                "mundo-card";


            let boton = "";
            const esTarjetaVideos = tarjeta.tipo === "videos";


            if (tarjeta.enlace) {

                boton = `
                    <a
                        class="card-boton"
                        href="${tarjeta.enlace}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        ${tarjeta.boton}
                    </a>
                `;

            } else if (tarjeta.boton === "Explorar") {

                boton = `
                    <button
                        class="card-boton btn-explorar-relacionados"
                        type="button"
                        data-card-index="${indice}"
                    >
                        ${tarjeta.boton}
                    </button>
                `;

            } else {

                boton = `
                    <button
                        class="card-boton"
                        type="button"
                    >
                        ${tarjeta.boton}
                    </button>
                `;
            }


            if (esTarjetaVideos) {

                const template = document.getElementById(tarjeta.videoTemplate);
                const contenidoVideo = template
                    ? template.content.cloneNode(true)
                    : null;

                article.classList.add("mundo-card-videos");
                article.dataset.videoOrientation = tarjeta.orientacionVideo || "horizontal";

                article.innerHTML = `
                    <span class="card-numero">
                        ${String(indice + 1).padStart(2,"0")}
                    </span>
                `;

                if (contenidoVideo) {
                    article.appendChild(contenidoVideo);
                } else {
                    article.insertAdjacentHTML("beforeend", `
                        <div class="video-card-scroll">
                            <h3>Videos</h3>
                            <p>${tarjeta.texto}</p>
                            <div class="video-vacio">No hay un video configurado para este mundo.</div>
                        </div>
                    `);
                }

            } else {

                article.innerHTML = `

                    <span class="card-numero">
                        ${String(indice + 1).padStart(2,"0")}
                    </span>

                    <h3>
                        ${tarjeta.titulo}
                    </h3>

                    <p>
                        ${tarjeta.texto}
                    </p>

                    <div class="info-bloque">

                        <strong>
                            ${tarjeta.bloque}
                        </strong>

                        <p>
                            ${tarjeta.adicional}
                        </p>

                    </div>

                    ${boton}

                `;
            }

            mundoCarrusel.appendChild(
                article
            );
        }
    );

    mundoCarrusel.scrollLeft = 0;
}


/* =========================================================
   ENLACES RELACIONADOS DE EXPLORAR
========================================================= */

const panelEnlacesRelacionados =
    document.getElementById("panelEnlacesRelacionados");

const cerrarEnlacesRelacionados =
    document.getElementById("cerrarEnlacesRelacionados");

const relatedLinksTitle =
    document.getElementById("relatedLinksTitle");

const relatedLinksDescription =
    document.getElementById("relatedLinksDescription");

const relatedLinksList =
    document.getElementById("relatedLinksList");

function abrirEnlacesRelacionados(tarjeta) {

    if (!tarjeta || !panelEnlacesRelacionados) return;

    const tema = `${tarjeta.titulo} ${mundos[mundoActual].titulo}`.trim();
    const consulta = encodeURIComponent(tema);

    relatedLinksTitle.textContent = tarjeta.titulo;
    relatedLinksDescription.textContent =
        `Más recursos relacionados con ${tarjeta.titulo.toLowerCase()} en el mundo de ${mundos[mundoActual].titulo}.`;

    const enlaces = [
        {
            nombre: "Buscar en la web",
            descripcion: "Encuentra páginas y recursos relacionados con este tema.",
            url: `https://www.google.com/search?q=${consulta}`
        },
        {
            nombre: "Wikipedia",
            descripcion: "Consulta artículos enciclopédicos relacionados.",
            url: `https://es.wikipedia.org/w/index.php?search=${consulta}`
        },
        {
            nombre: "YouTube",
            descripcion: "Encuentra videos educativos y explicativos.",
            url: `https://www.youtube.com/results?search_query=${consulta}`
        },
        {
            nombre: "Google Académico",
            descripcion: "Busca artículos y material académico sobre el tema.",
            url: `https://scholar.google.com/scholar?q=${consulta}`
        }
    ];

    relatedLinksList.innerHTML = enlaces.map(enlace => `
        <a class="related-link-item" href="${enlace.url}" target="_blank" rel="noopener noreferrer">
            <span class="related-link-arrow">↗</span>
            <span>
                <strong>${enlace.nombre}</strong>
                <small>${enlace.descripcion}</small>
            </span>
        </a>
    `).join("");

    panelEnlacesRelacionados.classList.add("abierto");
    panelEnlacesRelacionados.setAttribute("aria-hidden", "false");
}

function cerrarPanelEnlaces() {
    if (!panelEnlacesRelacionados) return;
    panelEnlacesRelacionados.classList.remove("abierto");
    panelEnlacesRelacionados.setAttribute("aria-hidden", "true");
}

if (cerrarEnlacesRelacionados) {
    cerrarEnlacesRelacionados.addEventListener("click", cerrarPanelEnlaces);
}

if (panelEnlacesRelacionados) {
    panelEnlacesRelacionados.addEventListener("click", (e) => {
        if (e.target === panelEnlacesRelacionados) cerrarPanelEnlaces();
    });
}

document.addEventListener("click", (e) => {
    const botonExplorar = e.target.closest(".btn-explorar-relacionados");
    if (!botonExplorar || !mundos[mundoActual]) return;

    const indice = Number(botonExplorar.dataset.cardIndex);
    const tarjeta = mundos[mundoActual].tarjetas[indice];
    abrirEnlacesRelacionados(tarjeta);
});

/* =========================================================
   MOVER TARJETA
========================================================= */

function moverTarjeta(direccion) {

    if (!mundoActual) return;

    const tarjetas =
        mundoCarrusel.querySelectorAll(
            ".mundo-card"
        );

    if (!tarjetas.length) return;

    indiceActual += direccion;


    if (indiceActual < 0) {

        indiceActual =
            tarjetas.length - 1;
    }


    if (
        indiceActual >=
        tarjetas.length
    ) {

        indiceActual = 0;
    }


    tarjetas[
        indiceActual
    ].scrollIntoView({

        behavior: "smooth",

        block: "nearest",

        inline: "start"

    });


    actualizarContador();
}


/* =========================================================
   BOTONES
========================================================= */

btnAnterior.addEventListener(
    "click",
    () => moverTarjeta(-1)
);

btnSiguiente.addEventListener(
    "click",
    () => moverTarjeta(1)
);


/* =========================================================
   CONTADOR
========================================================= */

function actualizarContador() {

    const total =
        mundoCarrusel.querySelectorAll(
            ".mundo-card"
        ).length;

    mundoContador.textContent =
        `${String(indiceActual + 1).padStart(2,"0")} / ${String(total).padStart(2,"0")}`;
}


/* =========================================================
   SCROLL HORIZONTAL
========================================================= */

mundoCarrusel.addEventListener(
    "scroll",
    () => {

        const tarjetas =
            mundoCarrusel.querySelectorAll(
                ".mundo-card"
            );

        if (!tarjetas.length) return;

        let menorDistancia =
            Infinity;

        let nuevoIndice = 0;


        tarjetas.forEach(
            (tarjeta, indice) => {

                const distancia =
                    Math.abs(
                        tarjeta.offsetLeft -
                        mundoCarrusel.scrollLeft
                    );

                if (
                    distancia <
                    menorDistancia
                ) {

                    menorDistancia =
                        distancia;

                    nuevoIndice =
                        indice;
                }
            }
        );


        indiceActual =
            nuevoIndice;

        actualizarContador();
    }
);


/* =========================================================
   RUEDA DEL RATÓN
========================================================= */

mundoCarrusel.addEventListener(
    "wheel",
    evento => {

        if (
            Math.abs(evento.deltaY) >
            Math.abs(evento.deltaX)
        ) {

            evento.preventDefault();

            mundoCarrusel.scrollLeft +=
                evento.deltaY;
        }

    },
    {
        passive: false
    }
);


/* =========================================================
   CERRAR MUNDO
========================================================= */

function cerrarPanelMundo() {

    mundoPanel.classList.remove(
        "abierto"
    );

    mundoPanel.setAttribute(
        "aria-hidden",
        "true"
    );

    mundoActual = null;

    setTimeout(() => {

        scrollActivo = true;

        posicion =
            window.scrollY;

        requestAnimationFrame(
            scrollAutomatico
        );

    },500);
}


cerrarMundo.addEventListener(
    "click",
    cerrarPanelMundo
);


/* =========================================================
   ESC
========================================================= */

document.addEventListener(
    "keydown",
    evento => {

        if (
            evento.key === "Escape" &&
            mundoPanel.classList.contains(
                "abierto"
            )
        ) {

            cerrarPanelMundo();
        }

    }
);


/* =========================================================
   FLECHAS DEL TECLADO
========================================================= */

document.addEventListener(
    "keydown",
    evento => {

        if (
            !mundoPanel.classList.contains(
                "abierto"
            )
        ) {
            return;
        }

        if (
            evento.key === "ArrowRight"
        ) {
            moverTarjeta(1);
        }

        if (
            evento.key === "ArrowLeft"
        ) {
            moverTarjeta(-1);
        }

    }
);


/* =========================================================
   BUSCADOR
========================================================= */

const buscador = document.getElementById("buscadorLU");
const caja = document.getElementById("resultadosIA");

let busquedaWikiOffset = 0;
let busquedaWikiQuery = "";
let busquedaYoutubeToken = "";
let busquedaYoutubeQuery = "";
let busquedaWebOffset = 0;

const CONFIG_BUSCADOR = window.LITERARY_SEARCH_CONFIG || { backendUrl: "" };
const BACKEND_BUSCADOR = CONFIG_BUSCADOR.backendUrl || "";

const escaparHTML = texto => String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

function renderResultadosWeb(items) {
    return (items || []).map(item => {
        const extras = Array.isArray(item.extraSnippets) ? item.extraSnippets : [];
        return `
            <a class="card-result" href="${escaparHTML(item.url || "#")}" target="_blank" rel="noopener noreferrer">
                <span class="resultado-fuente">Web · ${escaparHTML(item.source || "internet")}</span>
                <span class="resultado-titulo">${escaparHTML(item.title || "Resultado")}</span>
                <span class="resultado-resumen">${escaparHTML(item.description || "")}</span>
                ${extras[0] ? `<small class="resultado-extra">${escaparHTML(extras[0])}</small>` : ""}
                <span class="resultado-url">Abrir resultado ↗</span>
            </a>
        `;
    }).join("");
}

function renderResultadosWiki(resultados) {
    return (resultados || []).map(resultado => {
        const titulo = escaparHTML(resultado.title);
        const enlace = "https://es.wikipedia.org/wiki/" + encodeURIComponent(resultado.title);
        const resumen = escaparHTML((resultado.snippet || "").replace(/<[^>]*>/g, "").replace(/&quot;/g, '"'));
        return `
            <a class="card-result" href="${enlace}" target="_blank" rel="noopener noreferrer">
                <span class="resultado-fuente">Wikipedia · conocimiento</span>
                <span class="resultado-titulo">${titulo}</span>
                <span class="resultado-resumen">${resumen}</span>
                <span class="resultado-url">Abrir artículo ↗</span>
            </a>
        `;
    }).join("");
}

function renderVideosYoutube(videos) {
    if (!videos || !videos.length) return "";
    return `
        <div class="sec-title">Videos encontrados</div>
        <div class="youtube-grid">
            ${videos.map(video => {
                const id = video.id?.videoId;
                if (!id) return "";
                const titulo = escaparHTML(video.snippet?.title || "Video");
                const canal = escaparHTML(video.snippet?.channelTitle || "YouTube");
                const descripcion = escaparHTML(video.snippet?.description || "");
                const thumb = video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
                return `
                    <a class="youtube-card" href="https://www.youtube.com/watch?v=${encodeURIComponent(id)}" target="_blank" rel="noopener noreferrer">
                        <div class="youtube-thumb-wrap">
                            <img class="youtube-thumb" src="${escaparHTML(thumb)}" alt="Miniatura de ${titulo}" loading="lazy">
                            <span class="youtube-play">▶</span>
                        </div>
                        <div class="youtube-info">
                            <strong>${titulo}</strong>
                            <span>${canal}</span>
                            <small>${descripcion.slice(0, 110)}${descripcion.length > 110 ? "…" : ""}</small>
                        </div>
                    </a>
                `;
            }).join("")}
        </div>
    `;
}

async function buscarBackend(query, options = {}) {
    const params = new URLSearchParams({ q: query });
    if (options.webOffset != null) params.set("offset", String(options.webOffset));
    if (options.wikiOffset != null) params.set("wikiOffset", String(options.wikiOffset));
    if (options.googleStart != null) params.set("googleStart", String(options.googleStart));

    const respuesta = await fetch(`${BACKEND_BUSCADOR}/api/search?${params.toString()}`);
    if (!respuesta.ok) throw new Error(`Backend ${respuesta.status}`);
    return respuesta.json();
}

async function cargarMasWikipedia() {
    const boton = document.getElementById("mostrarMasWiki");
    if (!boton) return;
    boton.disabled = true;
    boton.textContent = "Buscando más...";
    busquedaWikiOffset += 5;
    try {
        const datos = await buscarBackend(busquedaWikiQuery, { wikiOffset: busquedaWikiOffset, webOffset: 0 });
        const resultados = datos.sources?.wikipedia || [];
        const lista = document.getElementById("listaWiki");
        if (lista && resultados.length) {
            lista.insertAdjacentHTML("beforeend", renderResultadosWiki(resultados));
            boton.disabled = false;
            boton.textContent = "Mostrar más";
        } else {
            boton.remove();
        }
    } catch {
        boton.textContent = "Reintentar";
        boton.disabled = false;
    }
}

async function cargarMasYoutube() {
    const boton = document.getElementById("mostrarMasYoutube");
    if (!boton || !busquedaYoutubeToken) return;
    boton.disabled = true;
    boton.textContent = "Buscando más videos...";
    try {
        const params = new URLSearchParams({ q: busquedaYoutubeQuery, pageToken: busquedaYoutubeToken });
        const respuesta = await fetch(`${BACKEND_BUSCADOR}/api/youtube?${params.toString()}`);
        if (!respuesta.ok) throw new Error("YouTube");
        const datos = await respuesta.json();
        busquedaYoutubeToken = datos.nextPageToken || "";
        const lista = document.getElementById("listaYoutube");
        if (lista && datos.videos?.length) lista.insertAdjacentHTML("beforeend", renderVideosYoutube(datos.videos));
        if (!busquedaYoutubeToken) boton.remove();
        else {
            boton.disabled = false;
            boton.textContent = "Mostrar más videos";
        }
    } catch {
        boton.textContent = "Reintentar videos";
        boton.disabled = false;
    }
}

async function cargarMasWeb() {
    const boton = document.getElementById("mostrarMasWeb");
    if (!boton) return;
    boton.disabled = true;
    boton.textContent = "Buscando más...";
    busquedaWebOffset += 1;
    try {
        const datos = await buscarBackend(busquedaYoutubeQuery, { webOffset: busquedaWebOffset, wikiOffset: 0 });
        const items = datos.sources?.web || [];
        const lista = document.getElementById("listaWeb");
        if (lista && items.length) lista.insertAdjacentHTML("beforeend", renderResultadosWeb(items));
        if (datos.sources?.webMore && items.length) {
            boton.disabled = false;
            boton.textContent = "Mostrar más resultados";
        } else boton.remove();
    } catch {
        boton.textContent = "Reintentar";
        boton.disabled = false;
    }
}




async function buscarFuenteDirecta(url) {
    const respuesta = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!respuesta.ok) throw new Error(`Fuente ${respuesta.status}`);
    return respuesta.json();
}

function renderResultadosGenericos(items, fuente) {
    return (items || []).map(item => `
        <a class="card-result" href="${escaparHTML(item.url || '#')}" target="_blank" rel="noopener noreferrer">
            <span class="resultado-fuente">${escaparHTML(fuente)}</span>
            <span class="resultado-titulo">${escaparHTML(item.title || 'Resultado')}</span>
            <span class="resultado-resumen">${escaparHTML(item.description || '')}</span>
            <span class="resultado-url">Abrir resultado ↗</span>
        </a>
    `).join('');
}

async function buscarOpenLibraryDirecto(query) {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&lang=es`;
    const data = await buscarFuenteDirecta(url);
    return (data.docs || []).map(book => ({
        title: book.title || 'Libro',
        description: `${(book.author_name || []).slice(0, 2).join(', ')}${book.first_publish_year ? ` · ${book.first_publish_year}` : ''}`,
        url: book.key ? `https://openlibrary.org${book.key}` : `https://openlibrary.org/search?q=${encodeURIComponent(query)}`
    }));
}

async function buscarOpenAlexDirecto(query) {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=8`;
    const data = await buscarFuenteDirecta(url);
    return (data.results || []).map(work => ({
        title: work.display_name || 'Trabajo académico',
        description: `${(work.authorships || []).slice(0, 2).map(a => a.author?.display_name).filter(Boolean).join(', ')}${work.publication_year ? ` · ${work.publication_year}` : ''}`,
        url: work.primary_location?.landing_page_url || work.doi || `https://openalex.org/${work.id?.split('/').pop() || ''}`
    }));
}

async function buscarCrossrefDirecto(query) {
    const url = `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}&rows=8`;
    const data = await buscarFuenteDirecta(url);
    return (data.message?.items || []).map(work => ({
        title: (work.title || ['Trabajo académico'])[0],
        description: `${(work.author || []).slice(0, 2).map(a => `${a.given || ''} ${a.family || ''}`.trim()).filter(Boolean).join(', ')}${work.published?.['date-parts']?.[0]?.[0] ? ` · ${work.published['date-parts'][0][0]}` : ''}`,
        url: work.URL || `https://search.crossref.org/?q=${encodeURIComponent(query)}`
    }));
}

async function buscarFuentesDirectas(query) {
    const tareas = await Promise.allSettled([
        buscarOpenLibraryDirecto(query),
        buscarOpenAlexDirecto(query),
        buscarCrossrefDirecto(query)
    ]);
    return {
        libros: tareas[0].status === 'fulfilled' ? tareas[0].value : [],
        openalex: tareas[1].status === 'fulfilled' ? tareas[1].value : [],
        crossref: tareas[2].status === 'fulfilled' ? tareas[2].value : []
    };
}

async function buscarWikipediaDirecto(query, offset = 0) {
    const params = new URLSearchParams({
        action: 'query', list: 'search', srsearch: query, srlimit: '10',
        sroffset: String(Math.max(0, Number(offset) || 0)), format: 'json', origin: '*'
    });
    const respuesta = await fetch(`https://es.wikipedia.org/w/api.php?${params.toString()}`);
    if (!respuesta.ok) throw new Error(`Wikipedia ${respuesta.status}`);
    const datos = await respuesta.json();
    return datos?.query?.search || [];
}

async function mostrarBusquedaDirecta(qOriginal, consultaSegura) {
    try {
        const resultados = await buscarFuentesDirectas(qOriginal);
        const resultadosWiki = await buscarWikipediaDirecto(qOriginal, 0);
        busquedaWikiQuery = qOriginal;
        busquedaWikiOffset = 0;

        const totalFuentes = resultados.libros.length + resultados.openalex.length + resultados.crossref.length + resultadosWiki.length;
        caja.innerHTML = `
            <div class="busqueda-cabecera">
                <div class="busqueda-marca">Literary Universe · explorador inteligente</div>
                <div class="busqueda-consulta">Resultados para <span>“${consultaSegura}”</span></div>
            </div>
            <div class="sec-title">Internet y conocimiento · ${totalFuentes} resultados</div>
            <div id="listaWiki">${renderResultadosWiki(resultadosWiki)}</div>
            ${resultadosWiki.length ? `<button class="mostrar-mas" id="mostrarMasWikiDirecto">Mostrar más Wikipedia</button>` : ''}

            ${resultados.libros.length ? `<div class="sec-title">Libros · Open Library</div><div id="listaLibros">${renderResultadosGenericos(resultados.libros, 'Open Library · libros')}</div>` : ''}
            ${resultados.openalex.length ? `<div class="sec-title">Investigación · OpenAlex</div><div id="listaOpenAlex">${renderResultadosGenericos(resultados.openalex, 'OpenAlex · investigación')}</div>` : ''}
            ${resultados.crossref.length ? `<div class="sec-title">Publicaciones · Crossref</div><div id="listaCrossref">${renderResultadosGenericos(resultados.crossref, 'Crossref · publicaciones')}</div>` : ''}

            <div class="sec-title">Explorar directamente</div>
            <div class="busqueda-plataformas">
                <a class="busqueda-plataforma" href="https://www.google.com/search?q=${encodeURIComponent(qOriginal)}" target="_blank" rel="noopener noreferrer">🌐 Buscar en Google</a>
                <a class="busqueda-plataforma" href="https://www.bing.com/search?q=${encodeURIComponent(qOriginal)}" target="_blank" rel="noopener noreferrer">🔎 Buscar en Bing</a>
                <a class="busqueda-plataforma" href="https://www.youtube.com/results?search_query=${encodeURIComponent(qOriginal)}" target="_blank" rel="noopener noreferrer">🎥 Buscar en YouTube</a>
                <a class="busqueda-plataforma" href="https://www.google.com/search?tbm=isch&q=${encodeURIComponent(qOriginal)}" target="_blank" rel="noopener noreferrer">🖼️ Imágenes</a>
            </div>
            <div class="card-close" onclick="cerrarBusqueda()">✕ Cerrar explorador</div>
        `;

        const boton = document.getElementById('mostrarMasWikiDirecto');
        if (boton) {
            boton.addEventListener('click', async () => {
                boton.disabled = true;
                boton.textContent = 'Buscando más...';
                busquedaWikiOffset += 10;
                try {
                    const mas = await buscarWikipediaDirecto(qOriginal, busquedaWikiOffset);
                    const lista = document.getElementById('listaWiki');
                    if (lista && mas.length) lista.insertAdjacentHTML('beforeend', renderResultadosWiki(mas));
                    if (!mas.length) boton.remove();
                    else { boton.disabled = false; boton.textContent = 'Mostrar más Wikipedia'; }
                } catch { boton.disabled = false; boton.textContent = 'Reintentar'; }
            });
        }
    } catch {
        caja.innerHTML = `
            <div class="busqueda-cabecera">
                <div class="busqueda-marca">Literary Universe · explorador</div>
                <div class="busqueda-consulta">Búsqueda directa</div>
            </div>
            <div class="busqueda-plataformas">
                <a class="busqueda-plataforma" href="https://www.google.com/search?q=${encodeURIComponent(qOriginal)}" target="_blank" rel="noopener noreferrer">🌐 Google</a>
                <a class="busqueda-plataforma" href="https://www.bing.com/search?q=${encodeURIComponent(qOriginal)}" target="_blank" rel="noopener noreferrer">🔎 Bing</a>
                <a class="busqueda-plataforma" href="https://www.youtube.com/results?search_query=${encodeURIComponent(qOriginal)}" target="_blank" rel="noopener noreferrer">🎥 YouTube</a>
            </div>
            <div class="card-close" onclick="cerrarBusqueda()">✕ Cerrar explorador</div>
        `;
    }
}

async function buscadorGoogle() {
    const qOriginal = buscador.value.trim();
    if (!qOriginal) return;

    scrollActivo = false;
    caja.classList.remove("oculto");
    busquedaWikiOffset = 0;
    busquedaWikiQuery = qOriginal;
    busquedaYoutubeToken = "";
    busquedaYoutubeQuery = qOriginal;
    busquedaWebOffset = 0;

    const consultaSegura = escaparHTML(qOriginal);
    caja.innerHTML = `
        <div class="busqueda-cabecera">
            <div class="busqueda-marca">Literary Universe · explorador inteligente</div>
            <div class="busqueda-consulta">Resultados para <span>“${consultaSegura}”</span></div>
        </div>
        <div class="card-ia">✦ Analizando la pregunta y consultando Internet...</div>
    `;

    if (window.location.protocol === "file:") {
        await mostrarBusquedaDirecta(qOriginal, consultaSegura);
        return;
    }

    try {
        const datos = await buscarBackend(qOriginal, { webOffset: 0, wikiOffset: 0 });
        const sources = datos.sources || {};
        busquedaYoutubeToken = sources.youtubeNextPageToken || "";

        let html = `
            <div class="card-ia">🧠 Tipo de búsqueda detectado: <b>${escaparHTML(datos.intent?.video ? "videos" : datos.intent?.news ? "actualidad" : datos.intent?.academic ? "académica" : "general")}</b>. Literary Universe consultó varias fuentes automáticamente.</div>
            <div class="sec-title">Resultados de Internet</div>
            <div id="listaWeb">${renderResultadosWeb(sources.web || [])}</div>
            ${(sources.webMore && (sources.web || []).length) ? `<button class="mostrar-mas" id="mostrarMasWeb">Mostrar más resultados</button>` : ""}
        `;

        if (!(sources.web || []).length) {
            html += `<div class="card-ia">No se encontraron resultados web con el motor configurado. Wikipedia queda disponible como respaldo.</div>`;
        }

        html += `
            <div class="sec-title">Conocimiento</div>
            <div id="listaWiki">${renderResultadosWiki(sources.wikipedia || [])}</div>
            ${(sources.wikipedia || []).length ? `<button class="mostrar-mas" id="mostrarMasWiki" onclick="cargarMasWikipedia()">Mostrar más</button>` : ""}
        `;

        if (sources.youtubeConfigured && (sources.youtube || []).length) {
            html += `<div id="listaYoutube">${renderVideosYoutube(sources.youtube)}</div>`;
            if (busquedaYoutubeToken) html += `<button class="mostrar-mas" id="mostrarMasYoutube" onclick="cargarMasYoutube()">Mostrar más videos</button>`;
        } else {
            html += `
                <div class="sec-title">YouTube</div>
                <div class="card-ia">🎥 YouTube está preparado, pero necesita una API key en el backend para cargar automáticamente videos y miniaturas.</div>
            `;
        }

        html += `
            <div class="sec-title">Explorar directamente</div>
            <div class="busqueda-plataformas">
                <a class="busqueda-plataforma" href="https://www.youtube.com/results?search_query=${encodeURIComponent(qOriginal)}" target="_blank" rel="noopener noreferrer">🎥 YouTube</a>
                <a class="busqueda-plataforma" href="https://www.google.com/search?q=${encodeURIComponent(qOriginal)}" target="_blank" rel="noopener noreferrer">🌐 Google</a>
                <a class="busqueda-plataforma" href="https://www.google.com/search?tbm=isch&q=${encodeURIComponent(qOriginal)}" target="_blank" rel="noopener noreferrer">🖼️ Imágenes</a>
            </div>
            <div class="card-close" onclick="cerrarBusqueda()">✕ Cerrar explorador</div>
        `;

        caja.innerHTML = `
            <div class="busqueda-cabecera">
                <div class="busqueda-marca">Literary Universe · explorador inteligente</div>
                <div class="busqueda-consulta">Resultados para <span>“${consultaSegura}”</span></div>
            </div>
            ${html}
        `;

        document.getElementById("mostrarMasWeb")?.addEventListener("click", cargarMasWeb);
    } catch (error) {
        caja.innerHTML = `
            <div class="busqueda-cabecera">
                <div class="busqueda-marca">Literary Universe · explorador</div>
                <div class="busqueda-consulta">No se pudo conectar con el buscador</div>
            </div>
            <div class="card-ia">El servidor de búsqueda no está disponible.</div>
            <div class="card-close" onclick="cerrarBusqueda()">✕ Cerrar explorador</div>
        `;
    }
}



/* =========================================================
   CERRAR BUSCADOR
========================================================= */

function cerrarBusqueda() {

    caja.classList.add(
        "oculto"
    );

    scrollActivo = true;

    posicion =
        window.scrollY;

    requestAnimationFrame(
        scrollAutomatico
    );
}


/* =========================================================
   EVENTOS BUSCADOR
========================================================= */

buscador.addEventListener(
    "keydown",
    evento => {

        if (
            evento.key === "Enter"
        ) {

            buscadorGoogle();
        }

    }
);


buscador.addEventListener(
    "focus",
    () => {

        scrollActivo = false;

    }
);


document
    .getElementById(
        "btnAbrirBusqueda"
    )
    ?.addEventListener(
        "click",
        () => buscador.focus()
    );


/* =========================================================
   CERRAR RESULTADOS AFUERA
========================================================= */

document.addEventListener(
    "click",
    evento => {

        if (
            !evento.target.closest(
                ".barra-superior"
            ) &&
            !evento.target.closest(
                "#resultadosIA"
            )
        ) {

            if (
                !caja.classList.contains(
                    "oculto"
                )
            ) {

                cerrarBusqueda();
            }
        }

    }
);


/* =========================================================
   MANUAL CORPORATIVO Y DIAPOSITIVA
========================================================= */

function abrirDocumento(id) {
    const panel = document.getElementById(id);
    if (!panel) return;

    document.querySelectorAll('.document-panel.abierto').forEach(p => {
        if (p !== panel) {
            p.classList.remove('abierto');
            p.setAttribute('aria-hidden', 'true');
        }
    });

    panel.classList.add('abierto');
    panel.setAttribute('aria-hidden', 'false');
    if (typeof scrollActivo !== 'undefined') scrollActivo = false;
}

function cerrarDocumento(id) {
    const panel = document.getElementById(id);
    if (!panel) return;

    panel.classList.remove('abierto');
    panel.setAttribute('aria-hidden', 'true');
    if (typeof scrollActivo !== 'undefined') {
        scrollActivo = true;
        if (typeof posicion !== 'undefined') posicion = window.scrollY;
        if (typeof scrollAutomatico === 'function') requestAnimationFrame(scrollAutomatico);
    }
}

document.getElementById('btnBiblioteca')?.addEventListener('click', () => {
    abrirDocumento('panelManual');
});

document.getElementById('btnFavoritos')?.addEventListener('click', () => {
    abrirDocumento('panelDiapositiva');
});

document.querySelectorAll('[data-close-document]').forEach(btn => {
    btn.addEventListener('click', () => cerrarDocumento(btn.dataset.closeDocument));
});

document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const abierto = document.querySelector('.document-panel.abierto');
    if (abierto) cerrarDocumento(abierto.id);
});

/* =========================================================
   INICIALIZAR TODO
========================================================= */

window.addEventListener(
    "load",
    () => {

        prepararPlanetas();

        requestAnimationFrame(
            moverPlanetas
        );

        setTimeout(() => {

            posicion =
                window.scrollY;

            scrollActivo = true;

            requestAnimationFrame(
                scrollAutomatico
            );

        },500);

    }
);