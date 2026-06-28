# Target Analyzer Robot API

API del módulo **Robot** para el proyecto Target Analyzer.

Este servicio recibe una URL, navega el sitio usando Puppeteer, analiza el HTML con Cheerio y devuelve información útil para el Backend, como links, screenshots, tecnologías detectadas, métricas del documento, cookies agregadas y palabras más frecuentes.

---

## Stack utilizado

* Node.js
* Express
* Puppeteer
* Cheerio
* Jest
* Supertest
* CORS

---

## Instalación

```bash
npm install
```

---

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
PORT=3001
BASE_URL=http://localhost:3001

DEFAULT_TOP_WORDS_LIMIT=10
MAX_TOP_WORDS_LIMIT=50

DEFAULT_LINKS_LIMIT=50
MAX_LINKS_LIMIT=200

SCREENSHOTS_DIR=./screenshots

LOGS_DIR=./logs
LOG_FILE_NAME=registro_bunker.txt
LOG_LEVEL=INFO
LOG_CONSOLE_ENABLED=true
LOG_FILE_ENABLED=true

PUPPETEER_HEADLESS=true
```

---

## Ejecutar en desarrollo

```bash
npm run dev
```

---

## Ejecutar tests

```bash
npm test
```

---

## Endpoints

### Health check

```http
GET /api/v1/health
```

Response:

```json
{
  "status": "UP"
}
```

---

### Analizar sitio

```http
POST /api/v1/analyze
```

Body:

```json
{
  "url": "https://example.com",
  "options": {
    "topWordsLimit": 10,
    "linksLimit": 50
  }
}
```

Response exitoso:

```json
{
  "url": "https://example.com/",
  "identity": {
    "title": "Example Domain",
    "description": "Sin descripción"
  },
  "screenshots": [
    "http://localhost:3001/screenshots/scan-id.png"
  ],
  "links": [
    "https://example.com/"
  ],
  "technologies": {
    "server": "Desconocido",
    "language": "HTML Estático / Desconocido",
    "frontendFramework": "Ninguno / Vanilla JS",
    "detected": []
  },
  "metrics": {
    "responseTimeMs": 1200,
    "documentSizeKb": 56.4,
    "sslValid": true,
    "linkCount": 1,
    "imageCount": 0,
    "paragraphCount": 2,
    "wordCount": 120,
    "topWords": [
      {
        "word": "example",
        "frequency": 2
      }
    ],
    "cookies": {
      "count": 0,
      "secureCount": 0,
      "httpOnlyCount": 0,
      "sessionCount": 0,
      "thirdPartyCount": 0
    }
  }
}
```

---

## CURL de ejemplo

### Analizar Example

```bash
curl -X POST http://localhost:3001/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "options": {
      "topWordsLimit": 10,
      "linksLimit": 50
    }
  }'
```

### Analizar Universidad Nacional de Pilar

```bash
curl -X POST http://localhost:3001/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://unpilar.edu.ar/",
    "options": {
      "topWordsLimit": 10,
      "linksLimit": 50
    }
  }'
```

---

## Screenshots

El Robot toma una captura de pantalla del sitio analizado y la guarda localmente en la carpeta configurada por `SCREENSHOTS_DIR`.

Las imágenes se exponen desde:

```http
GET /screenshots/:filename
```

Ejemplo:

```txt
http://localhost:3001/screenshots/6063f3dc-2351-4233-a185-9bbc4bfcb5d4.png
```

La API devuelve estas URLs dentro del campo:

```json
"screenshots": [
  "http://localhost:3001/screenshots/archivo.png"
]
```

---

## Arquitectura interna

```txt
Request
  ↓
Middlewares
  ↓
AnalyzerService
  ├── BrowserManager
  ├── PageLoader
  ├── ScreenshotService
  ├── LocalScreenshotStorage
  ├── HtmlParser
  ├── TopWordsAnalyzer
  ├── TechDetector
  ├── CookieAnalyzer
  ├── MetricsBuilder
  └── LoggingService
  ↓
Response
```

---

## Responsabilidades principales

### BrowserManager

Administra la instancia de Puppeteer y crea páginas nuevas para analizar sitios.

También se encarga de cerrar páginas y cerrar el browser cuando corresponde.

---

### PageLoader

Carga la URL con Puppeteer y devuelve datos básicos de navegación:

* HTML final.
* URL final después de redirects.
* Headers.
* Tiempo de respuesta.
* Tamaño del documento.
* Validez aproximada de SSL.
* Cookies obtenidas desde el contexto del browser.

---

### ScreenshotService

Toma una captura de pantalla usando Puppeteer.

No guarda archivos directamente. Delega esa responsabilidad en un storage.

---

### LocalScreenshotStorage

Guarda screenshots en disco local y devuelve una URL pública.

Esto simula un storage real. Más adelante podría reemplazarse por S3, Cloudinary, Firebase Storage u otro servicio externo.

---

### HtmlParser

Analiza el HTML con Cheerio y extrae:

* `identity.title`
* `identity.description`
* Links absolutos.
* Cantidad de links.
* Cantidad de imágenes.
* Cantidad de párrafos.
* Texto visible.
* Cantidad de palabras.

---

### TopWordsAnalyzer

Recibe el texto visible de la página y calcula las palabras más frecuentes.

El proceso incluye:

* Pasar texto a minúsculas.
* Normalizar acentos.
* Eliminar signos.
* Eliminar palabras demasiado cortas.
* Ignorar stop words comunes en español e inglés.
* Contar frecuencias.
* Ordenar por frecuencia descendente.

---

### TechDetector

Detecta tecnologías a partir del HTML, headers y URL final.

Puede detectar señales como:

* Servidor o proxy: Cloudflare, Nginx, Apache, Google Infrastructure.
* Lenguaje probable: PHP, JavaScript / TypeScript, Python, Java, .NET.
* Framework frontend: React, Next.js, Vue, Nuxt, Angular, Svelte.
* CMS o librerías: WordPress, Shopify, jQuery, Bootstrap.

El resultado es aproximado, ya que muchos sitios ocultan o minimizan sus tecnologías.

---

### CookieAnalyzer

Analiza cookies de forma agregada.

No devuelve nombres ni valores de cookies, solo métricas:

```json
"cookies": {
  "count": 2,
  "secureCount": 1,
  "httpOnlyCount": 1,
  "sessionCount": 0,
  "thirdPartyCount": 0
}
```

Esto evita exponer información sensible.

---

### MetricsBuilder

Construye el bloque final de métricas combinando información de:

* `PageLoader`
* `HtmlParser`
* `TopWordsAnalyzer`
* `CookieAnalyzer`

---

### LoggingService

Servicio de logging estático.

Puede escribir logs en consola y archivo según configuración.

Ejemplo de línea de log:

```txt
[2026-06-28 14:30:12] [INFO] [REQUEST_RECEIVED] URL recibida: https://example.com
```

Eventos usados:

* `SYSTEM_START`
* `REQUEST_RECEIVED`
* `ROBOT_REQUEST_SENT`
* `ROBOT_RESPONSE_RECEIVED`
* `BROWSER_LAUNCHING`
* `BROWSER_READY`
* `PAGE_ACQUIRED`
* `PAGE_RELEASED`
* `ERROR`

---

## Manejo de errores

La API debería devolver `200` solo cuando el análisis fue exitoso.

Errores esperados:

### Request inválido

```http
400 Bad Request
```

Ejemplo:

```json
{
  "error": "URL must be a valid URL"
}
```

---

### Sitio no analizable

```http
422 Unprocessable Entity
```

Ejemplo:

```json
{
  "error": "DNS resolution failed"
}
```

---

### Timeout

```http
504 Gateway Timeout
```

Ejemplo:

```json
{
  "error": "Target page timeout after 30000ms"
}
```

---

### Error interno

```http
500 Internal Server Error
```

Ejemplo:

```json
{
  "error": "Internal server error"
}
```

---

## Contrato con Backend

El Backend consume este servicio.

Flujo esperado:

```txt
Frontend
  ↓
Backend
  ↓
Robot API
  ↓
Backend
  ↓
Frontend
```

El Frontend no debería llamar directamente al Robot.

---

## Notas importantes

La detección de tecnologías es aproximada.

Si un sitio usa Cloudflare, CDN, proxy o infraestructura distribuida, algunos datos pueden representar al proveedor intermedio y no al servidor real de origen.

Las screenshots se guardan localmente para el MVP. En una versión productiva convendría usar storage externo.

Las cookies se reportan solo como métricas agregadas para evitar exponer datos sensibles.
