# Cambios de esta versión

- **Aprender**: letras mucho más grandes y paneles oscuros detrás del texto (ASSETS/CSS/mejoras.css, sección 1).
- **Sistema solar**: estrellas, resplandor, órbitas de color, planetas con volumen y detalles, halo arcoíris en XANDRO (mejoras.css, sección 2). El JS no cambió.
- **Juegos**: objetos grandes con disco claro y brillo, chispas, sonidos (botón 🔊), rachas y 5 juegos nuevos
  (Ruta del motor, Lluvia de colores, Torneo de arco, Salva a la tortuga, Rutina de cuidado).
- **Voz de XANDRO**: usa la voz en español de Colombia del dispositivo. En `ASSETS/JS/chat-xandro.js` y `vr/script.js`
  está `FUENTE_DE_VOZ`: pon `'elevenlabs'` para volver al audio de n8n.

## Segunda ronda
- **Scrolls**: barra con degradado arcoíris, redondeada, que brilla al pasar el mouse (mejoras.css, sección 3).
- **Órbitas**: anillos finos que se desvanecen por tramos, con el color de cada mundo.
- **Rendimiento en celulares**: los planetas se mueven con `transform` (sin recalcular el diseño), a 30 cuadros por segundo en equipos modestos; en celulares se quitan animaciones de fondo, blur y filtros pesados (mejoras.css, sección 4; index.js).

## Tercera ronda (juegos)
- Pantalla de inicio con instrucciones y metas de estrellas, cuenta regresiva 3-2-1.
- Botón de pausa ⏸ (también tecla P); se pausa solo si cambias de pestaña.
- Pantalla final con 1 a 3 estrellas y aviso de nuevo récord.

## Cuarta ronda (Arte)
- **lienzo.html** (+ ASSETS/CSS/lienzo.css, ASSETS/JS/lienzo.js): lienzo libre con caballete y marco de madera.
  Pinceles (pincel, acuarela, marcador, crayón, spray), borrador, rellenar, gotero, 24 colores + color propio,
  tamaño e intensidad, simetría (espejo, 4 lados, estrella, mandala), 6 papeles, deshacer/rehacer y guardar PNG.
- Enlazado desde juegos.html (tarjeta en Arte) y desde el mundo Arte del inicio (botón «Abrir el lienzo para pintar»).

## Quinta ronda (tarjetas de los mundos)
- Botones (Explorar, Aprender, Descubrir…) ya no se aplastan: las tarjetas hacen scroll en vez de encoger su contenido.
- Scroll de la tarjeta: barra más ancha con el color del mundo y brillo; la barra horizontal del carrusel quedó sobre los botones ‹ ›.
- Controles ‹ 01/08 › centrados (antes se corrían a la derecha en pantalla y celular).

## Sexta ronda (página de Juegos)
- Tarjetas organizadas por mundo (01 a 05 + VR), cada mundo en su banda de color con sus 2 juegos (el lienzo en Arte).
- Menú de botones arriba para saltar a cada mundo.
- Letras más grandes en título, textos, etiquetas y botones; botones alineados abajo en todas las tarjetas.

## Séptima ronda (racha diaria y progreso)
- Nuevo ASSETS/JS/progreso.js: la racha usa la fecha LOCAL (antes usaba UTC y en Colombia se reiniciaba por las noches).
- Copia de seguridad en cookie + código de progreso (Perfil > Copiar / Restaurar código) para llevarlo a otro dispositivo.
- La misión del día se reinicia cada día; terminar un juego también cuenta como día activo; Juegos muestra la racha.

## Octava ronda (fuente y animaciones)
- **Fuente Montserrat en todas las páginas** (incluida VR): archivos incluidos en ASSETS/Fonts y vr/fonts (sin depender de internet);
  se cargan desde ASSETS/CSS/fuente.css y vr/fuente.css. Se quitaron las importaciones de Google Fonts.
- **Aprender**: nuevo ASSETS/JS/aprender-anim.js + estilos en mejoras.css (sección 8): respuesta correcta en verde con ✓, onda, confeti
  y «¡Correcto!»; respuesta incorrecta con sacudida; marcadores de racha/XP/vidas que reaccionan; trofeo y XP animados al terminar.
- **Animaciones generales** (mejoras.css sección 9): las tarjetas ya no pierden el efecto hover tras aparecer; los mundos entran en cascada
  al abrirse o cambiar; la ventana de juegos y cada página entran con suavidad; controles ‹ › sin conflicto de transformaciones.
- Se corrigió el botón CONTINUAR / VOLVER AL CAMINO (texto oscuro sobre fondo oscuro).
- Nota: faltan archivos de medios en el zip (ASSETS/Videos/*.mp4 y la diapositiva PDF); no los modifiqué.

## Novena ronda (VR: voz manos libres)
- vr/voz-vrbox.js: en modo VR BOX el micrófono escucha de forma continua; órdenes de voz para viajar a cada planeta, a la estrella, al inicio, recorrido y detener; el resto va a Xandro (IA).
- Panel 3D con el estado del micrófono visible en ambos ojos; botón «Manos libres» en la barra.
- VR BOX se activa dentro del toque del usuario (antes con retardo, fallaba el permiso de movimiento en iPhone).
