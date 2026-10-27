/* LUNIX · microinteracciones equilibradas */
(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Entrada progresiva de tarjetas, sin alterar su estructura ni contenido.
    const tarjetas = document.querySelectorAll('.mundo-card, .media-card, .game-card, .recommendations');
    if ('IntersectionObserver' in window && !reduceMotion) {
        const observador = new IntersectionObserver((entradas, observer) => {
            entradas.forEach((entrada) => {
                if (!entrada.isIntersecting) return;
                var tarjeta = entrada.target;
                tarjeta.classList.add('lu-visible');
                observer.unobserve(tarjeta);
                // Al terminar la entrada se quita la clase: así el hover (elevar la tarjeta, brillo) vuelve a funcionar
                setTimeout(function () {
                    tarjeta.classList.remove('lu-reveal', 'lu-visible');
                    tarjeta.style.removeProperty('--lu-delay');
                }, 900 + (parseInt(tarjeta.style.getPropertyValue('--lu-delay')) || 0));
            });
        }, { threshold: 0.12 });
        tarjetas.forEach((tarjeta, indice) => {
            tarjeta.classList.add('lu-reveal');
            tarjeta.style.setProperty('--lu-delay', `${Math.min(indice % 5, 4) * 65}ms`);
            observador.observe(tarjeta);
        });
        setTimeout(function () {
            tarjetas.forEach(function (t) { if (t.classList.contains('lu-reveal') && !t.classList.contains('lu-visible')) { var r = t.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) t.classList.add('lu-visible'); } });
        }, 2500);
    }

    // XANDRO flotante y arrastrable. Al pulsarlo, vuelve al XANDRO del sistema solar.
    const original = document.getElementById('sol');
    const imagen = original?.querySelector('img');
    if (!original || !imagen || document.getElementById('xandroFlotante')) return;

    const burbuja = document.createElement('button');
    burbuja.type = 'button';
    burbuja.id = 'xandroFlotante';
    burbuja.className = 'xandro-flotante';
    burbuja.setAttribute('aria-label', 'XANDRO: volver al sistema de mundos');
    burbuja.title = 'Arrástrame o pulsa para volver a XANDRO';
    const retrato = imagen.cloneNode(true);
    retrato.alt = '';
    burbuja.appendChild(retrato);
    document.body.appendChild(burbuja);

    let inicioX = 0;
    let inicioY = 0;
    let movida = false;
    let arrastrando = false;

    burbuja.addEventListener('pointerdown', (evento) => {
        if (evento.button !== 0) return;
        arrastrando = true;
        movida = false;
        inicioX = evento.clientX - burbuja.offsetLeft;
        inicioY = evento.clientY - burbuja.offsetTop;
        burbuja.classList.add('arrastrando');
        burbuja.setPointerCapture(evento.pointerId);
    });

    burbuja.addEventListener('pointermove', (evento) => {
        if (!arrastrando) return;
        if (Math.abs(evento.movementX) + Math.abs(evento.movementY) > 1) movida = true;
        const x = Math.max(8, Math.min(window.innerWidth - burbuja.offsetWidth - 8, evento.clientX - inicioX));
        const y = Math.max(8, Math.min(window.innerHeight - burbuja.offsetHeight - 8, evento.clientY - inicioY));
        burbuja.style.left = `${x}px`;
        burbuja.style.top = `${y}px`;
        burbuja.style.right = 'auto';
        burbuja.style.bottom = 'auto';
    });

    const soltar = () => {
        arrastrando = false;
        burbuja.classList.remove('arrastrando');
    };
    burbuja.addEventListener('pointerup', soltar);
    burbuja.addEventListener('pointercancel', soltar);
    burbuja.setAttribute('aria-label', 'Abrir chat con XANDRO');
    burbuja.title = 'Pulsa para hablar con XANDRO · También puedes arrastrarme';
    burbuja.addEventListener('click', () => {
        if (movida) { movida = false; return; }
        const chat = document.getElementById('chatXandro');
        const entrada = document.getElementById('entradaChatXandro');
        if (chat) {
            chat.classList.remove('oculto');
            chat.setAttribute('aria-hidden', 'false');
            if (!document.getElementById('mensajesXandro')?.children.length) {
                document.dispatchEvent(new CustomEvent('xandro:abrir'));
            }
            window.setTimeout(() => entrada?.focus(), 80);
        }
    });
})();
