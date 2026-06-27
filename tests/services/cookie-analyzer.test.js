const CookieAnalyzer = require("../../src/services/CookieAnalyzer");

describe("CookieAnalyzer", () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new CookieAnalyzer();
  });

  test("returns zero metrics when cookies is empty", () => {
    const result = analyzer.analyze([], "https://example.com");

    expect(result).toEqual({
      count: 0,
      secureCount: 0,
      httpOnlyCount: 0,
      sessionCount: 0,
      thirdPartyCount: 0,
    });
  });

  test("counts secure and httpOnly cookies", () => {
    const cookies = [
      {
        name: "session",
        domain: "example.com",
        secure: true,
        httpOnly: true,
        expires: -1,
      },
      {
        name: "theme",
        domain: "example.com",
        secure: false,
        httpOnly: false,
        expires: 1893456000,
      },
    ];

    const result = analyzer.analyze(cookies, "https://example.com");

    expect(result.count).toBe(2);
    expect(result.secureCount).toBe(1);
    expect(result.httpOnlyCount).toBe(1);
  });

  test("counts session cookies", () => {
    const cookies = [
      {
        name: "a",
        domain: "example.com",
        expires: -1,
      },
      {
        name: "b",
        domain: "example.com",
        session: true,
      },
      {
        name: "c",
        domain: "example.com",
        expires: 1893456000,
      },
    ];

    const result = analyzer.analyze(cookies, "https://example.com");

    expect(result.sessionCount).toBe(2);
  });

  test("counts third party cookies", () => {
    const cookies = [
      {
        name: "first",
        domain: "example.com",
      },
      {
        name: "sub",
        domain: ".example.com",
      },
      {
        name: "third",
        domain: "analytics.com",
      },
    ];

    const result = analyzer.analyze(cookies, "https://www.example.com");

    expect(result.thirdPartyCount).toBe(1);
  });

  test("handles invalid finalUrl safely", () => {
    const cookies = [
      {
        name: "a",
        domain: "example.com",
      },
    ];

    const result = analyzer.analyze(cookies, "not-a-url");

    expect(result.thirdPartyCount).toBe(0);
  });
});
