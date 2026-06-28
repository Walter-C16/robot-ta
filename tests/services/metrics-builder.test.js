const MetricsBuilder = require("../../src/services/MetricsBuilder");

describe("MetricsBuilder", () => {
  let builder;

  beforeEach(() => {
    builder = new MetricsBuilder();
  });

  test("arma el objeto metrics con datos de pageData, parsed, topWords y cookies", () => {
    const pageData = {
      responseTimeMs: 1200,
      documentSizeKb: 56.4,
      sslValid: true,
    };

    const parsed = {
      linkCount: 25,
      imageCount: 12,
      paragraphCount: 45,
      wordCount: 340,
    };

    const topWords = [
      { word: "universidad", frequency: 10 },
      { word: "pilar", frequency: 8 },
    ];

    const cookieMetrics = {
      count: 3,
      secureCount: 2,
      httpOnlyCount: 1,
      sessionCount: 1,
      thirdPartyCount: 0,
    };

    const result = builder.build({
      pageData,
      parsed,
      topWords,
      cookieMetrics,
    });

    expect(result).toEqual({
      responseTimeMs: 1200,
      documentSizeKb: 56.4,
      sslValid: true,
      linkCount: 25,
      imageCount: 12,
      paragraphCount: 45,
      wordCount: 340,
      topWords: [
        { word: "universidad", frequency: 10 },
        { word: "pilar", frequency: 8 },
      ],
      cookies: {
        count: 3,
        secureCount: 2,
        httpOnlyCount: 1,
        sessionCount: 1,
        thirdPartyCount: 0,
      },
    });
  });

  test("usa objeto vacío para cookies si no se reciben métricas de cookies", () => {
    const result = builder.build({
      pageData: {
        responseTimeMs: 500,
        documentSizeKb: 10,
        sslValid: false,
      },
      parsed: {
        linkCount: 1,
        imageCount: 2,
        paragraphCount: 3,
        wordCount: 4,
      },
      topWords: [],
    });

    expect(result.cookies).toEqual({});
  });
});
