# Literary Universe — Buscador con backend

## Qué cambia

El navegador ya no contiene las claves de las APIs. Las búsquedas pasan por `server.js`, que mantiene las claves en `.env`.

Fuentes:
- Brave Search: fuente web principal.
- Wikipedia: fuente de conocimiento y respaldo.
- YouTube Data API v3: múltiples videos con miniaturas y paginación.
- Google Programmable Search: opcional como segunda fuente web.

El backend analiza la consulta con reglas sencillas para identificar si parece una búsqueda general, académica, de noticias o de videos. Las fuentes se consultan en paralelo y Literary Universe presenta los resultados juntos.

## Cómo arrancar

1. Instala Node.js 18 o superior.
2. Copia `.env.example` y renómbralo a `.env`.
3. Pon tus claves en `.env`.
4. Abre una terminal dentro de `LINUX/WEB`.
5. Ejecuta:

   `node server.js`

6. Abre en el navegador:

   `http://localhost:3000`

## Importante

No abras `index.html` haciendo doble clic. Debes entrar por `http://localhost:3000` para que el frontend pueda usar `/api/search`.

No compartas el archivo `.env` ni publiques sus claves.
