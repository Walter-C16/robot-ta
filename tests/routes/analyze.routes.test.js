const request = require("supertest");
const { createApp } = require("../../src/app");

describe("Analyze Router - stubs", () => {
  test("POST /api/v1/analyze devuelve response del AnalyzerService", async () => {
    const analyzerResponse = {
      url: "https://example.com",
      identity: {
        title: "Example Site",
        description: "Example description",
      },
      screenshots: ["http://localhost:3001/screenshots/stub.png"],
      links: ["https://example.com/contact"],
      technologies: {
        server: "cloudflare",
        language: "HTML Estático / Desconocido",
        frontendFramework: "React",
        detected: ["React"],
      },
      metrics: {
        responseTimeMs: 1200,
        documentSizeKb: 56.4,
        sslValid: true,
        linkCount: 1,
        imageCount: 2,
        paragraphCount: 3,
        wordCount: 4,
        topWords: [{ word: "example", frequency: 2 }],
      },
    };

    const analyzerService = {
      analyze: jest.fn().mockResolvedValue(analyzerResponse),
    };

    const loggingService = {
      logIncomingAnalyzeRequest: jest.fn().mockResolvedValue({ logged: true }),
      logRobotRequest: jest.fn().mockResolvedValue({ logged: true }),
      logRobotResponse: jest.fn().mockResolvedValue({ logged: true }),
      error: jest.fn().mockResolvedValue({ logged: true }),
    };

    const app = createApp({
      analyzerService,
      loggingService,
    });

    const response = await request(app)
      .post("/api/v1/analyze")
      .send({
        url: "https://example.com",
        options: {
          topWordsLimit: 10,
          linksLimit: 50,
        },
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(analyzerResponse);

    expect(analyzerService.analyze).toHaveBeenCalledWith(
      "https://example.com/",
      {
        topWordsLimit: 10,
        linksLimit: 50,
      },
    );
  });
});
