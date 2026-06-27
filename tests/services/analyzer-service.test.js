const AnalyzerService = require("../../src/services/AnalyzerService");

describe("AnalyzerService", () => {
  function createService() {
    const page = { id: "stub-page" };

    const browserManager = {
      acquirePage: jest.fn().mockResolvedValue(page),
      releasePage: jest.fn().mockResolvedValue(undefined),
    };

    const pageData = {
      html: "<html><body>Example text</body></html>",
      finalUrl: "https://example.com",
      headers: { server: "stub-server" },
      responseTimeMs: 1200,
      documentSizeKb: 56.4,
      sslValid: true,
      cookies: [
        {
          name: "session",
          domain: "example.com",
          secure: true,
          httpOnly: true,
          expires: -1,
        },
      ],
    };

    const pageLoader = {
      load: jest.fn().mockResolvedValue(pageData),
    };

    const screenshotService = {
      capture: jest
        .fn()
        .mockResolvedValue(["http://localhost:3001/screenshots/stub.png"]),
    };

    const htmlParser = {
      parse: jest.fn().mockReturnValue({
        identity: {
          title: "Example Site",
          description: "Example description",
        },
        links: ["https://example.com/contact"],
        linkCount: 1,
        imageCount: 2,
        paragraphCount: 3,
        wordCount: 4,
        visibleText: "example text example",
      }),
    };

    const topWordsAnalyzer = {
      getTopWords: jest
        .fn()
        .mockReturnValue([{ word: "example", frequency: 2 }]),
    };

    const techDetector = {
      detect: jest.fn().mockResolvedValue({
        server: "cloudflare",
        language: "HTML Estático / Desconocido",
        frontendFramework: "React",
        detected: ["React", "Cloudflare"],
      }),
    };

    const cookieAnalyzer = {
      analyze: jest.fn().mockReturnValue({
        count: 1,
        secureCount: 1,
        httpOnlyCount: 1,
        sessionCount: 1,
        thirdPartyCount: 0,
      }),
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
        topWords: [{ word: "example", frequency: 2 }],
        cookies: {
          count: 1,
          secureCount: 1,
          httpOnlyCount: 1,
          sessionCount: 1,
          thirdPartyCount: 0,
        },
      }),
    };

    const loggingService = {};

    const service = new AnalyzerService({
      browserManager,
      pageLoader,
      screenshotService,
      htmlParser,
      topWordsAnalyzer,
      techDetector,
      cookieAnalyzer,
      metricsBuilder,
      loggingService,
    });

    return {
      service,
      page,
      pageData,
      browserManager,
      pageLoader,
      screenshotService,
      htmlParser,
      topWordsAnalyzer,
      techDetector,
      cookieAnalyzer,
      metricsBuilder,
    };
  }

  test("coordina todos los servicios y arma el response final", async () => {
    const {
      service,
      page,
      pageData,
      browserManager,
      pageLoader,
      screenshotService,
      htmlParser,
      topWordsAnalyzer,
      techDetector,
      cookieAnalyzer,
      metricsBuilder,
    } = createService();

    const options = {
      topWordsLimit: 2,
      linksLimit: 1,
    };

    const response = await service.analyze("https://example.com", options);

    expect(response).toEqual({
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
        detected: ["React", "Cloudflare"],
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
        cookies: {
          count: 1,
          secureCount: 1,
          httpOnlyCount: 1,
          sessionCount: 1,
          thirdPartyCount: 0,
        },
      },
    });

    expect(browserManager.acquirePage).toHaveBeenCalledTimes(1);

    expect(pageLoader.load).toHaveBeenCalledWith(page, "https://example.com");

    expect(screenshotService.capture).toHaveBeenCalledWith(
      page,
      expect.any(String),
    );

    expect(htmlParser.parse).toHaveBeenCalledWith(
      pageData.html,
      pageData.finalUrl,
      options,
    );

    expect(topWordsAnalyzer.getTopWords).toHaveBeenCalledWith(
      "example text example",
      2,
    );

    expect(techDetector.detect).toHaveBeenCalledWith(pageData);

    expect(cookieAnalyzer.analyze).toHaveBeenCalledWith(
      pageData.cookies,
      pageData.finalUrl,
    );

    expect(metricsBuilder.build).toHaveBeenCalledWith({
      pageData,
      parsed: {
        identity: {
          title: "Example Site",
          description: "Example description",
        },
        links: ["https://example.com/contact"],
        linkCount: 1,
        imageCount: 2,
        paragraphCount: 3,
        wordCount: 4,
        visibleText: "example text example",
      },
      topWords: [{ word: "example", frequency: 2 }],
      cookieMetrics: {
        count: 1,
        secureCount: 1,
        httpOnlyCount: 1,
        sessionCount: 1,
        thirdPartyCount: 0,
      },
    });

    expect(browserManager.releasePage).toHaveBeenCalledWith(page);
  });

  test("cierra la página aunque ocurra un error", async () => {
    const { service, page, browserManager, pageLoader } = createService();

    pageLoader.load.mockRejectedValue(new Error("Unexpected failure"));

    await expect(service.analyze("https://example.com")).rejects.toThrow(
      "Unexpected failure",
    );

    expect(browserManager.releasePage).toHaveBeenCalledWith(page);
  });
});
