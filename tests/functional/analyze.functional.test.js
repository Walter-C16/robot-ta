const request = require("supertest");

const { createApp } = require("../../src/app");
const LoggingService = require("../../src/services/LoggingService");

describe("Functional API - Analyze", () => {
  let analyzerService;
  let app;

  beforeEach(() => {
    LoggingService.consoleEnabled = false;
    LoggingService.fileEnabled = false;

    analyzerService = {
      analyze: jest.fn(),
    };

    app = createApp({
      analyzerService,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();

    LoggingService.consoleEnabled = true;
    LoggingService.fileEnabled = true;
  });

  test("GET /api/v1/health devuelve status UP", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "UP",
    });
  });

  test("POST /api/v1/analyze analiza una URL válida y devuelve el response esperado", async () => {
    const analyzerResponse = {
      url: "https://unpilar.edu.ar/",
      identity: {
        title: "Universidad Nacional de Pilar",
        description: "Sin descripción",
      },
      screenshots: ["http://localhost:3001/screenshots/test-screenshot.png"],
      links: ["https://unpilar.edu.ar/", "https://unpilar.edu.ar/home"],
      technologies: {
        server: "Cloudflare",
        language: "PHP",
        frontendFramework: "Ninguno / Vanilla JS",
        detected: ["Cloudflare", "PHP", "WordPress", "jQuery"],
      },
      metrics: {
        responseTimeMs: 1200,
        documentSizeKb: 333.71,
        sslValid: true,
        linkCount: 2,
        imageCount: 19,
        paragraphCount: 25,
        wordCount: 1043,
        topWords: [
          {
            word: "universidad",
            frequency: 10,
          },
          {
            word: "pilar",
            frequency: 8,
          },
        ],
        cookies: {
          count: 2,
          secureCount: 1,
          httpOnlyCount: 1,
          sessionCount: 0,
          thirdPartyCount: 0,
        },
      },
    };

    analyzerService.analyze.mockResolvedValueOnce(analyzerResponse);

    const response = await request(app)
      .post("/api/v1/analyze")
      .send({
        url: "https://unpilar.edu.ar/",
        options: {
          topWordsLimit: 10,
          linksLimit: 50,
        },
      })
      .set("Content-Type", "application/json");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(analyzerResponse);

    expect(analyzerService.analyze).toHaveBeenCalledTimes(1);
    expect(analyzerService.analyze).toHaveBeenCalledWith(
      "https://unpilar.edu.ar/",
      {
        topWordsLimit: 10,
        linksLimit: 50,
      },
    );
  });

  test("POST /api/v1/analyze aplica defaults si no se envían options", async () => {
    const analyzerResponse = {
      url: "https://example.com/",
      identity: {
        title: "Example Domain",
        description: "Sin descripción",
      },
      screenshots: [],
      links: [],
      technologies: {
        server: "Desconocido",
        language: "HTML Estático / Desconocido",
        frontendFramework: "Ninguno / Vanilla JS",
        detected: [],
      },
      metrics: {
        responseTimeMs: 100,
        documentSizeKb: 10,
        sslValid: true,
        linkCount: 0,
        imageCount: 0,
        paragraphCount: 0,
        wordCount: 0,
        topWords: [],
        cookies: {},
      },
    };

    analyzerService.analyze.mockResolvedValueOnce(analyzerResponse);

    const response = await request(app)
      .post("/api/v1/analyze")
      .send({
        url: "https://example.com",
      })
      .set("Content-Type", "application/json");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(analyzerResponse);

    expect(analyzerService.analyze).toHaveBeenCalledTimes(1);

    expect(analyzerService.analyze).toHaveBeenCalledWith(
      "https://example.com/",
      expect.objectContaining({
        topWordsLimit: expect.any(Number),
        linksLimit: expect.any(Number),
      }),
    );
  });

  test("POST /api/v1/analyze devuelve 400 si falta url", async () => {
    const response = await request(app)
      .post("/api/v1/analyze")
      .send({
        options: {
          topWordsLimit: 10,
          linksLimit: 50,
        },
      })
      .set("Content-Type", "application/json");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: expect.any(String),
    });

    expect(analyzerService.analyze).not.toHaveBeenCalled();
  });

  test("POST /api/v1/analyze devuelve 400 si url no es válida", async () => {
    const response = await request(app)
      .post("/api/v1/analyze")
      .send({
        url: "no-es-url",
        options: {
          topWordsLimit: 10,
          linksLimit: 50,
        },
      })
      .set("Content-Type", "application/json");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: expect.any(String),
    });

    expect(analyzerService.analyze).not.toHaveBeenCalled();
  });

  test("POST /api/v1/analyze devuelve 400 si topWordsLimit no es válido", async () => {
    const response = await request(app)
      .post("/api/v1/analyze")
      .send({
        url: "https://unpilar.edu.ar/",
        options: {
          topWordsLimit: -1,
          linksLimit: 50,
        },
      })
      .set("Content-Type", "application/json");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: expect.any(String),
    });

    expect(analyzerService.analyze).not.toHaveBeenCalled();
  });

  test("POST /api/v1/analyze devuelve error si analyzerService falla", async () => {
    const error = new Error("Fallo interno del análisis");
    error.statusCode = 500;

    analyzerService.analyze.mockRejectedValueOnce(error);

    const response = await request(app)
      .post("/api/v1/analyze")
      .send({
        url: "https://unpilar.edu.ar/",
        options: {
          topWordsLimit: 10,
          linksLimit: 50,
        },
      })
      .set("Content-Type", "application/json");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: expect.any(String),
    });

    expect(analyzerService.analyze).toHaveBeenCalledTimes(1);
  });
});
