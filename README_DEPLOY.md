# Publicar Esta Web

Este proyecto ya esta listo para publicarse como sitio estatico.

## Archivos importantes de despliegue

- `index.html`: pagina principal.
- `style.css`: estilos.
- `robots.txt`: habilita indexacion.
- `sitemap.xml`: mapa del sitio para buscadores.
- `site.webmanifest`: soporte PWA basico.
- `404.html`: pagina de error para rutas no encontradas.
- `.nojekyll`: evita problemas de procesamiento en GitHub Pages.
- `vercel.json`: configuracion de Vercel.
- `netlify.toml`: configuracion de Netlify.
- `CNAME.example`: plantilla para conectar dominio propio en GitHub Pages.
- `api/chat.js`: API serverless para Vercel.
- `netlify/functions/chat.js`: API serverless para Netlify.
- `.env.example`: ejemplo de variables para activar IA real.

## Opcion 1: GitHub Pages

1. Crea un repositorio nuevo en GitHub.
2. Sube todo el contenido de esta carpeta.
3. En GitHub, entra a `Settings` > `Pages`.
4. En `Build and deployment`, selecciona:
   - Source: `Deploy from a branch`
   - Branch: `main` (root)
5. Guarda y espera el enlace publico.

## Opcion 2: Netlify

1. Entra a Netlify y crea un sitio nuevo desde Git.
2. Conecta tu repositorio.
3. Build command: vacio.
4. Publish directory: `.`
5. Deploy.

Variables de entorno en Netlify (Site settings > Environment variables):

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (opcional, ejemplo `gpt-4o-mini`)

## Opcion 3: Vercel

1. Entra a Vercel y crea proyecto nuevo desde Git.
2. Importa el repositorio.
3. Framework preset: `Other`.
4. Build command: vacio.
5. Output directory: vacio.
6. Deploy.

Variables de entorno en Vercel (Project > Settings > Environment Variables):

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (opcional, ejemplo `gpt-4o-mini`)

## Antes de publicar

- Verifica que el numero de WhatsApp sea el correcto en `index.html`.
- Si cambias el nombre de `descarga.jpeg`, actualiza tambien sus referencias en `index.html`, `style.css` y `site.webmanifest`.
- Reemplaza `https://example.com` por tu URL real en:
   - `index.html` (JSON-LD)
   - `robots.txt`
   - `sitemap.xml`
- Si usaras GitHub Pages con dominio propio, crea un archivo `CNAME` (sin extension) usando como base `CNAME.example`.
- Prueba el sitio en movil y escritorio.

## Activar analitica de conversiones

En `index.html`, busca el bloque:

`window.ANALYTICS_CONFIG`

y reemplaza:

- `gaMeasurementId: "G-XXXXXXXXXX"` por tu ID real de GA4.
- `metaPixelId: "000000000000000"` por tu ID real de Meta Pixel.

Eventos que ya quedan listos:

- `whatsapp_click` (clics en CTAs y botones de WhatsApp)
- `chat_quick_chip_click` (clic en consultas rapidas del chat)
- `chat_user_message` (mensaje enviado desde el chat)

## Activar API real para el asistente virtual

1. Define variables de entorno (`OPENAI_API_KEY` y opcional `OPENAI_MODEL`) en tu hosting.
2. En `index.html`, bloque `window.ANALYTICS_CONFIG`, deja:
   - `enableApiAssistant: true`
   - `chatApiEndpoint: "/api/chat"`
3. Despliega el proyecto.

Nota: si la API falla o no tiene clave, el asistente vuelve automaticamente al modo local para no dejar de responder.
