const AnalyzerService = require("../../src/services/AnalyzerService");

describe("AnalyzerService", () => {
  function createService() {
    const page = { id: "stub-page" };

    const browserManager = {
      getPage: jest.fn().mockResolvedValue(page),
      closePage: jest.fn().mockResolvedValue(undefined)
    };

    const pageLoader = {
      load: jest.fn().mockResolvedValue({
        html: "<html><body>Example text</body></html>",
        finalUrl: "https://example.com",
        headers: { server: "stub-server" },
        responseTimeMs: 1200,
        documentSizeKb: 56.4,
        sslValid: true
      })
    };

    const screenshotService = {
      capture: jest
        .fn()
        .mockResolvedValue(["http://localhost:3001/screenshots/stub.png"])
    };

    const htmlParser = {
      parse: jest.fn().mockReturnValue({
        identity: {
          title: "Example Site",
          description: "Example description"
        },
        links: ["https://example.com/contact"],
        linkCount: 1,
        imageCount: 2,
        paragraphCount: 3,
        wordCount: 4,
        visibleText: "example text example"
      })
    };

    const topWordsAnalyzer = {
      getTopWords: jest.fn().mockReturnValue([
        { word: "example", frequency: 2 }
      ])
    };

    const techDetector = {
      detect: jest.fn().mockResolvedValue({
        server: "cloudflare",
        language: "HTML Estático / Desconocido",
        frontendFramework: "React",
        detected: ["React", "Cloudflare"]
      })
    };

    const metricsBuilder = {
      build: jest.fn().mockReturnValue({
        responseTimeMs: 1200,
        documentSizeKb: 56.4,
        sslValid: true,
        linkCount: 1,
        imageCount: 2,
        paragraphCount: 3,
        wordCount: 4,
        topWords: [{ word: "example", frequency: 2 }]
      })
    };

    const loggingService = {};

    const service = new AnalyzerService({
      browserManager,
      pageLoader,
      screenshotService,
      htmlParser,
      topWordsAnalyzer,
      techDetector,
      metricsBuilder,
      loggingService
    });

    return {
      service,
      page,
      browserManager,
      pageLoader,
      screenshotService,
      htmlParser,
      topWordsAnalyzer,
      techDetector,
      metricsBuilder
    };
  }

  test("coordina todos los servicios y arma el response final", async () => {
    const {
      service,
      page,
      browserManager,
      pageLoader,
      screenshotService,
      htmlParser,
      topWordsAnalyzer,
      techDetector,
      metricsBuilder
    } = createService();

    const response = await service.analyze("https://example.com", {
      topWordsLimit: 2,
      linksLimit: 1
    });

    expect(response).toEqual({
      url: "https://example.com",
      identity: {
        title: "Example Site",
        description: "Example description"
      },
      screenshots: ["http://localhost:3001/screenshots/stub.png"],
      links: ["https://example.com/contact"],
      technologies: {
        server: "cloudflare",
        language: "HTML Estático / Desconocido",
        frontendFramework: "React",
        detected: ["React", "Cloudflare"]
      },
      metrics: {
        responseTimeMs: 1200,
        documentSizeKb: 56.4,
        sslValid: true,
        linkCount: 1,
        imageCount: 2,
        paragraphCount: 3,
        wordCount: 4,
        topWords: [{ word: "example", frequency: 2 }]
      }
    });

    expect(browserManager.getPage).toHaveBeenCalledTimes(1);
    expect(pageLoader.load).toHaveBeenCalledWith(page, "https://example.com");
    expect(screenshotService.capture).toHaveBeenCalledWith(page, expect.any(String));
    expect(htmlParser.parse).toHaveBeenCalledWith(
      "<html><body>Example text</body></html>",
      "https://example.com",
      { topWordsLimit: 2, linksLimit: 1 }
    );
    expect(topWordsAnalyzer.getTopWords).toHaveBeenCalledWith(
      "example text example",
      2
    );
    expect(techDetector.detect).toHaveBeenCalledWith({
      html: "<html><body>Example text</body></html>",
      finalUrl: "https://example.com",
      headers: { server: "stub-server" },
      responseTimeMs: 1200,
      documentSizeKb: 56.4,
      sslValid: true
    });
    expect(metricsBuilder.build).toHaveBeenCalled();
    expect(browserManager.closePage).toHaveBeenCalledWith(page);
  });

  test("cierra la página aunque ocurra un error", async () => {
    const {
      service,
      page,
      browserManager,
      pageLoader
    } = createService();

    pageLoader.load.mockRejectedValue(new Error("Unexpected failure"));

    await expect(
      service.analyze("https://example.com")
    ).rejects.toThrow("Unexpected failure");

    expect(browserManager.closePage).toHaveBeenCalledWith(page);
  });
});
