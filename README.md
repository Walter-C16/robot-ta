# Target Analyzer — Robot API

API del Robot para analizar una URL y devolver información técnica del sitio.

## Stack

* Node.js
* Express
* Puppeteer
* Cheerio
* Jest
* Supertest

## Instalación

```bash
npm install
```

Crear `.env`:

```bash
cp .env.example .env
```

En Windows:

```bash
copy .env.example .env
```

## Ejecutar

```bash
npm run dev
```

Servidor local:

```txt
http://localhost:3001
```

## Tests

```bash
npm test
```

## Endpoints

### Health Check

```http
GET /api/v1/health
```

Response:

```json
{
  "status": "UP"
}
```

### Analizar URL

```http
POST /api/v1/analyze
Content-Type: application/json
```

Request:

```json
{
  "url": "https://example.com",
  "options": {
    "topWordsLimit": 10,
    "linksLimit": 50
  }
}
```

Response:

```json
{
  "url": "https://example.com",
  "identity": {
    "title": "Example Site",
    "description": "Example description"
  },
  "screenshots": [
    "http://localhost:3001/screenshots/example-home.png"
  ],
  "links": [
    "https://example.com/contact",
    "https://example.com/about"
  ],
  "technologies": {
    "server": "cloudflare",
    "language": "HTML Estático / Desconocido",
    "frontendFramework": "React",
    "detected": [
      "React",
      "Cloudflare",
      "Google Analytics"
    ]
  },
  "metrics": {
    "responseTimeMs": 1200,
    "documentSizeKb": 56.4,
    "sslValid": true,
    "linkCount": 25,
    "imageCount": 12,
    "paragraphCount": 45,
    "wordCount": 340,
    "topWords": [
      {
        "word": "example",
        "frequency": 14
      }
    ]
  }
}
```

## Códigos de respuesta

| Código | Caso                         |
| -----: | ---------------------------- |
|  `200` | Análisis exitoso             |
|  `400` | Request inválida             |
|  `422` | Sitio objetivo no analizable |
|  `500` | Error interno                |
|  `503` | Servicio no disponible       |
|  `504` | Timeout                      |

## Variables de entorno

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
```

## Arquitectura

```txt
Request
  ↓
Middlewares
  ↓
AnalyzerService
  ├── BrowserManager
  ├── PageLoader
  ├── ScreenshotService
  ├── HtmlParser
  ├── TopWordsAnalyzer
  ├── TechDetector
  ├── MetricsBuilder
  └── LoggingService
  ↓
Response
```

## Flujo esperado

```txt
Frontend → Backend → Robot API → Backend → Frontend
```

El Frontend no debería llamar directamente al Robot.

## Capturas

En el MVP, las capturas se guardan localmente y se exponen mediante URLs, simulando un storage externo.

Ejemplo:

```txt
http://localhost:3001/screenshots/example-home.png
```

## Logs

El sistema debe registrar eventos en disco en:

```txt
registro_bunker.txt
```

Formato sugerido:

```txt
[2026-06-19 15:30:22] [SYSTEM_START] Servidor activo en puerto 3001
[2026-06-19 15:31:10] [REQUEST_RECEIVED] URL recibida: https://example.com
[2026-06-19 15:31:11] [ROBOT_RESPONSE_RECEIVED] Análisis completado
```

## Notas

* `topWordsLimit` y `linksLimit` tienen valores por defecto.
* Si se envían valores mayores al máximo configurado, se aplica el máximo.
* El Robot solo se encarga del análisis técnico del sitio.
