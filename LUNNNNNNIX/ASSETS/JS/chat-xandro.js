/* Chat de XANDRO compartido con LUNIX VR */
(() => {
    const chat = document.getElementById('chatXandro');
    if (!chat) return;

    const WEBHOOK_URL = 'https://tomas78.app.n8n.cloud/webhook/b95277fb-9225-4baf-b1f1-4cbd3292dfd7/chat';

    // ---- VOZ DE XANDRO ----
    // 'colombiana' = voz del navegador en español de Colombia (la mejor disponible).
    // 'elevenlabs' = usa el audio que manda n8n (voz Thorthugo u otra que configures).
    const FUENTE_DE_VOZ = 'colombiana';
    const sessionId = 'lunix-web-' + Math.random().toString(36).slice(2) + Date.now();
    const mensajes = document.getElementById('mensajesXandro');
    const entrada = document.getElementById('entradaChatXandro');
    const formulario = document.getElementById('formChatXandro');
    const btnVoz = document.getElementById('alternarVozXandro');
    const btnMic = document.getElementById('microfonoXandro');
    let vozActiva = true;
    let audioActual = null;
    let primerSaludo = false;

    function agregarMensaje(texto, tipo) {
        const elemento = document.createElement('div');
        elemento.className = 'msg-xandro ' + tipo;
        elemento.textContent = texto;
        mensajes.appendChild(elemento);
        mensajes.scrollTop = mensajes.scrollHeight;
    }

    function detenerVoz() {
        if (audioActual) {
            audioActual.pause();
            audioActual = null;
        }
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }

    // Elige la voz más colombiana que tenga el dispositivo (hombre primero)
    function elegirVozColombiana() {
        const todas = window.speechSynthesis.getVoices();
        const es = todas.filter(v => /^es/i.test(v.lang.replace('_', '-')));
        const hombre = /gonzalo|carlos|jorge|diego|raul|raúl|pablo|alvaro|álvaro|andres|andrés|juan|male|hombre/i;
        const natural = /natural|neural|online/i;
        const co = es.filter(v => /^es[-_]CO/i.test(v.lang) || /colombia/i.test(v.name));
        const latam = es.filter(v => /^es[-_](MX|US|419|AR|CL|PE|VE)/i.test(v.lang));
        return co.find(v => hombre.test(v.name) && natural.test(v.name)) ||
               co.find(v => hombre.test(v.name)) ||
               co.find(v => natural.test(v.name)) ||
               co[0] ||
               latam.find(v => hombre.test(v.name) && natural.test(v.name)) ||
               latam.find(v => hombre.test(v.name)) ||
               latam[0] ||
               es.find(v => hombre.test(v.name)) ||
               es[0] || null;
    }

    function hablarNavegador(texto) {
        if (!vozActiva || !('speechSynthesis' in window)) return;
        detenerVoz();
        const limpio = texto
            .replace(/\[(.*?)\]\(.*?\)/g, '$1')
            .replace(/https?:\/\/\S+/g, '')
            .replace(/\p{Extended_Pictographic}/gu, ' ')
            .replace(/[\u200d\ufe0f]/g, '')
            .replace(/[^\p{L}\p{N}\s.,;:¿?¡!]/gu, ' ')
            .replace(/\s+/g, ' ').trim();
        if (!limpio) return;
        const voz = elegirVozColombiana();
        // Frase por frase: suena más natural y con pausas como al hablar
        const frases = (limpio.match(/[^.!?¿¡]+[.!?]*/g) || [limpio]).filter(f => f.trim());
        frases.forEach(f => {
            const frase = new SpeechSynthesisUtterance(f.trim());
            frase.lang = 'es-CO';
            if (voz) frase.voice = voz;
            frase.rate = 1.03;   // ritmo ágil, como se habla en Colombia
            frase.pitch = 0.92;  // voz de hombre, pero cálida (no robótica)
            window.speechSynthesis.speak(frase);
        });
    }
    // Algunos navegadores cargan las voces con retraso
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }

    async function preguntar(texto) {
        agregarMensaje(texto, 'user');
        const esperando = document.createElement('div');
        esperando.className = 'msg-xandro bot';
        esperando.textContent = 'XANDRO está pensando…';
        mensajes.appendChild(esperando);
        mensajes.scrollTop = mensajes.scrollHeight;
        detenerVoz();

        try {
            const respuesta = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sendMessage', sessionId, chatInput: texto })
            });
            if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
            const data = await respuesta.json();
            esperando.remove();
            const textoRespuesta = data.output || data.text || 'XANDRO no devolvió respuesta.';
            agregarMensaje(textoRespuesta, 'bot');
            if (vozActiva) {
                if (data.audio && FUENTE_DE_VOZ === 'elevenlabs') {
                    audioActual = new Audio('data:audio/mpeg;base64,' + data.audio);
                    audioActual.play().catch(() => hablarNavegador(textoRespuesta));
                } else {
                    hablarNavegador(textoRespuesta);
                }
            }
        } catch (error) {
            esperando.remove();
            agregarMensaje('No pude conectar con XANDRO (' + error.message + '). Revisa que el workflow esté activo en n8n.', 'error');
        }
    }

    function abrirChat() {
        chat.classList.remove('oculto');
        chat.setAttribute('aria-hidden', 'false');
        if (!primerSaludo && !mensajes.children.length) {
            primerSaludo = true;
            agregarMensaje('Hola, soy XANDRO, el asistente de LUNIX. ¿En qué te puedo ayudar hoy?', 'bot');
        }
        entrada.focus();
    }

    document.addEventListener('xandro:abrir', abrirChat);
    document.getElementById('cerrarChatXandro')?.addEventListener('click', () => {
        chat.classList.add('oculto');
        chat.setAttribute('aria-hidden', 'true');
        detenerVoz();
    });

    btnVoz?.addEventListener('click', () => {
        vozActiva = !vozActiva;
        btnVoz.textContent = vozActiva ? '🔊' : '🔇';
        btnVoz.setAttribute('aria-label', vozActiva ? 'Silenciar voz' : 'Activar voz');
        if (!vozActiva) detenerVoz();
    });

    formulario.addEventListener('submit', event => {
        event.preventDefault();
        const texto = entrada.value.trim();
        if (!texto) return;
        entrada.value = '';
        preguntar(texto);
    });

    const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Reconocimiento) {
        if (btnMic) btnMic.hidden = true;
    } else {
        const reconocimiento = new Reconocimiento();
        reconocimiento.lang = 'es-CO';
        reconocimiento.interimResults = false;
        btnMic?.addEventListener('click', () => {
            detenerVoz();
            try {
                reconocimiento.start();
                btnMic.classList.add('escuchando');
            } catch (e) {}
        });
        reconocimiento.onresult = evento => {
            entrada.value = evento.results[0][0].transcript;
            formulario.requestSubmit();
        };
        reconocimiento.onend = reconocimiento.onerror = () => btnMic?.classList.remove('escuchando');
    }
})();
