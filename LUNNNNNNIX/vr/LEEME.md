# LUNIX · Realidad Virtual con Xandro

Sitio de realidad virtual (A-Frame / WebXR) donde flotas por el universo LUNIX:
una estrella central, 5 planetas orbitando y Xandro, el asistente, que te acompaña,
habla con la voz de ElevenLabs (Thorthugo) y responde con el agente de n8n.

## Archivos
- index.html  -> escena VR y pantallas 2D
- style.css   -> estilos de la interfaz 2D
- script.js   -> toda la lógica (planetas, movimiento, Xandro, chat y voz)
- libs/aframe.min.js -> motor VR (incluido, no necesita internet para cargar)
- estrella.js -> la estrella central de Xandro, animada (cara viva, corona de arcoíris, piruetas)
- xandro3d.js -> Xandro como personaje 3D animado (cuerpo, brazos, piernas, capa, libro y pluma)
- dibujos.js  -> dibujos 2D que usa Xandro: su cara con expresiones, la portada del libro y la capa
- xandro-img.js -> imagen oficial de Xandro (se ve en la pantalla de inicio y en el chat)
- xandro-prompt.md -> prompt del agente para pegar en n8n (completa la base de conocimiento)
- LUNIX-Chat-Xandro-con-voz.json -> workflow de n8n (chat + voz)

## Cómo abrirlo
1. En n8n importa y activa LUNIX-Chat-Xandro-con-voz.json
   (pon tu API key de ElevenLabs en el nodo "ElevenLabs – Voz de Xandro"
   y desactiva el workflow anterior del chat).
2. Si la URL del chat cambió, edita WEBHOOK_URL al inicio de script.js.
3. Abre index.html en Chrome o Edge (doble clic funciona para verlo en pantalla).
4. Para las gafas VR (Quest, etc.) la página debe estar en https o localhost:
   - en el PC: VS Code + extensión Live Server, o "npx serve"
   - en las gafas: súbela a un hosting con https (GitHub Pages, Netlify...)
     y ábrela en el navegador de las gafas; pulsa el botón de las gafas.

## Controles
- Computador: W A S D mover (vuelas hacia donde miras), arrastrar = mirar,
  clic en un planeta = volar hasta él.
- Celular: gira el teléfono; toca los planetas.
- Gafas VR: palanca izquierda = moverte, palanca derecha = girar,
  gatillo con el láser = elegir planetas y botones de Xandro.
- Botones de arriba: Recorrido guiado, volver al Inicio, voz on/off.
- Botón "Hablar con Xandro": chat de texto con micrófono (solo en pantalla normal).
  Dentro de las gafas usa los botones 3D bajo Xandro.

## Personalizar (en script.js, sección 1)
- PLANETAS: nombre, color, tamaño, órbita, velocidad y texto de cada planeta.
- "url" de cada planeta: si pones una página (ej. "mecanica.html") aparece el botón "Abrir página".
- SALUDO_AUTOMATICO: false para que Xandro no se presente solo al entrar.

## Cómo se mueve y qué expresiones tiene Xandro
- Siempre en movimiento: flota, parpadea, mira a los lados, balancea brazos y piernas,
  la capa ondea y la pluma suelta chispas.
- Cuando habla: la boca sigue el volumen real de la voz de ElevenLabs.
- Expresiones: normal, feliz (ojos en arco), sorpresa, pensando (mientras espera la respuesta),
  guiño y hablando. Cambian solas según lo que pasa:
  pensando al esperar al agente, feliz al visitar un planeta, sorpresa al abrir su ficha, guiño al entrar.
- Gestos espontáneos cada 6 a 12 segundos: guiño, sonrisa, sorpresa o saludo con la pluma.
- Si caminas o vuelas rápido, mueve las piernas y la capa ondea con más fuerza.
- Para agregar o ajustar expresiones: tabla EXPRESIONES en xandro3d.js
  y función dibujarCara en dibujos.js.

## La estrella (estrella.js)
La estrella del centro es la estrella de Xandro: cuerpo facetado de arcoíris con su cara.
Se activa con `estrella-viva` en el `<a-entity id="sol">` de index.html.
Animaciones: te mira siempre, parpadea y cambia de expresión sola, flota y late,
corona de arcoíris con rayos y destellos, brillo que recorre las 5 puntas, arcos de purpurina,
polvo de estrellas y una pirueta mágica cada 11-19 s (giro con salto, onda expansiva y confeti).
La luz sobre los planetas también parpadea.
Para ajustar frecuencia de piruetas, cantidad de arcos o tamaño del resplandor, edita la
sección AJUSTES al inicio de estrella.js.

## Voz manos libres con VR BOX (voz-vrbox.js)
Al entrar con «Modo VR BOX» la pantalla se divide en dos y el micrófono queda siempre escuchando
(también se puede encender solo con el botón «🎙 Manos libres»). Abajo, en ambos ojos, aparece
un panel con lo que el micrófono entendió. Mientras Xandro habla, el micrófono se pausa.
Órdenes que mueven la nave:
- «Llévame a Arte / Mecánica / Realeza / Vida marina / Cosmetología» (también «vamos al océano», «quiero ir a belleza»…)
- «Siguiente planeta» / «planeta anterior»
- «Ir a la estrella» · «Volver al inicio» · «Haz el recorrido» · «Cierra el panel» · «Detente» · «Ayuda»
Cualquier otra frase se le pregunta a Xandro (n8n) y responde con voz y burbuja 3D.
Para añadir sinónimos de un planeta edita ALIAS en voz-vrbox.js.
Requisitos: Chrome en Android (en iPhone el reconocimiento continuo es inestable), página en https,
y permitir micrófono + sensor de movimiento.
