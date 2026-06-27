jest.mock("puppeteer");

const puppeteer = require("puppeteer");
const BrowserManager = require("../../src/services/BrowserManager");
const PageLoader = require("../../src/services/PageLoader");
const {
  TargetTimeoutError,
  SiteNotAnalyzableError,
} = require("../../src/errors");

function makePage(overrides = {}) {
  const responseListeners = [];

  const page = {
    isClosed: jest.fn(() => false),
    close: jest.fn(),
    setCacheEnabled: jest.fn(),
    setViewport: jest.fn(),
    setExtraHTTPHeaders: jest.fn(),
    goto: jest.fn(),
    url: jest.fn(() => "https://example.com"),
    content: jest.fn(async () => "<html><body>Hello</body></html>"),
    browserContext: jest.fn(() => ({
      cookies: jest.fn(async () => []),
    })),
    on: jest.fn((event, cb) => {
      if (event === "response") responseListeners.push(cb);
    }),
    _triggerResponse: (resp) => responseListeners.forEach((cb) => cb(resp)),
    ...overrides,
  };

  return page;
}

function makeBrowser(page) {
  return {
    connected: true,
    newPage: jest.fn(async () => page),
    close: jest.fn(),
    on: jest.fn(),
  };
}

beforeEach(() => {
  BrowserManager._instance = null;
  jest.clearAllMocks();
});

describe("BrowserManager", () => {
  test("getInstance returns the same object", () => {
    const a = BrowserManager.getInstance();
    const b = BrowserManager.getInstance();

    expect(a).toBe(b);
  });

  test("acquirePage configures the page and returns it", async () => {
    const page = makePage();

    puppeteer.launch.mockResolvedValueOnce(makeBrowser(page));

    const manager = BrowserManager.getInstance();
    const result = await manager.acquirePage();

    expect(result).toBe(page);
    expect(page.setCacheEnabled).toHaveBeenCalledWith(false);
    expect(page.setViewport).toHaveBeenCalledWith({ width: 1280, height: 800 });
    expect(page.setExtraHTTPHeaders).toHaveBeenCalled();
  });

  test("reuses the browser on multiple acquirePage calls", async () => {
    const page = makePage();
    const browser = makeBrowser(page);

    puppeteer.launch.mockResolvedValueOnce(browser);

    const manager = BrowserManager.getInstance();

    await manager.acquirePage();
    await manager.acquirePage();

    expect(puppeteer.launch).toHaveBeenCalledTimes(1);
  });

  test("releasePage closes an open page", async () => {
    const page = makePage();
    const manager = BrowserManager.getInstance();

    await manager.releasePage(page);

    expect(page.close).toHaveBeenCalledTimes(1);
  });

  test("releasePage is safe when page is already closed", async () => {
    const page = makePage({ isClosed: jest.fn(() => true) });
    const manager = BrowserManager.getInstance();

    await expect(manager.releasePage(page)).resolves.toBeUndefined();

    expect(page.close).not.toHaveBeenCalled();
  });

  test("close tears down the browser", async () => {
    const page = makePage();
    const browser = makeBrowser(page);

    puppeteer.launch.mockResolvedValueOnce(browser);

    const manager = BrowserManager.getInstance();

    await manager.acquirePage();
    await manager.close();

    expect(browser.close).toHaveBeenCalledTimes(1);
    expect(manager._browser).toBeNull();
  });
});

describe("PageLoader", () => {
  function setupPage() {
    const fakeResponse = {
      request: jest.fn(() => ({
        resourceType: () => "document",
      })),
      headers: jest.fn(() => ({
        "content-type": "text/html",
      })),
      status: jest.fn(() => 200),
      securityDetails: jest.fn(() => ({
        issuer: "Let's Encrypt",
      })),
    };

    const page = makePage();

    page.goto.mockResolvedValue(fakeResponse);

    return { page, fakeResponse };
  }

  test("returns correct shape for a successful HTTPS load", async () => {
    const { page } = setupPage();

    page.url.mockReturnValue("https://example.com");
    page.content.mockResolvedValue("<html><body>content</body></html>");

    const loader = new PageLoader({ timeoutMs: 5000 });

    const result = await loader.load(page, "https://example.com");

    expect(result).toMatchObject({
      finalUrl: "https://example.com",
      sslValid: true,
      responseTimeMs: expect.any(Number),
      documentSizeKb: expect.any(Number),
      headers: expect.objectContaining({
        "content-type": "text/html",
      }),
      cookies: [],
    });

    expect(typeof result.html).toBe("string");
    expect(result.html.length).toBeGreaterThan(0);
  });

  test("calls page.goto with timeout and waitUntil", async () => {
    const { page } = setupPage();

    const loader = new PageLoader({ timeoutMs: 5000 });

    await loader.load(page, "https://example.com");

    expect(page.goto).toHaveBeenCalledWith("https://example.com/", {
      timeout: 5000,
      waitUntil: "networkidle2",
    });
  });

  test("sslValid is false for HTTP final URL", async () => {
    const { page } = setupPage();

    page.url.mockReturnValue("http://example.com");

    const loader = new PageLoader();

    const result = await loader.load(page, "http://example.com");

    expect(result.sslValid).toBe(false);
  });

  test("returns cookies from browser context", async () => {
    const cookies = [
      {
        name: "session",
        value: "abc",
        domain: "example.com",
        secure: true,
        httpOnly: true,
      },
    ];

    const page = makePage({
      browserContext: jest.fn(() => ({
        cookies: jest.fn(async () => cookies),
      })),
    });

    page.goto.mockResolvedValue();
    page.url.mockReturnValue("https://example.com");

    const loader = new PageLoader();

    const result = await loader.load(page, "https://example.com");

    expect(result.cookies).toEqual(cookies);
  });

  test("throws TargetTimeoutError on navigation timeout", async () => {
    const page = makePage();

    const timeoutError = new Error("Navigation timeout of 5000ms exceeded");
    timeoutError.name = "TimeoutError";

    page.goto.mockRejectedValue(timeoutError);

    const loader = new PageLoader({ timeoutMs: 5000 });

    await expect(loader.load(page, "https://slow.example.com")).rejects.toThrow(
      TargetTimeoutError,
    );
  });

  test("TargetTimeoutError carries the correct timeoutMs", async () => {
    const page = makePage();

    const timeoutError = new Error("timeout");
    timeoutError.name = "TimeoutError";

    page.goto.mockRejectedValue(timeoutError);

    const loader = new PageLoader({ timeoutMs: 8000 });

    try {
      await loader.load(page, "https://slow.example.com");
      throw new Error("Expected load to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(TargetTimeoutError);
      expect(err.timeoutMs).toBe(8000);
    }
  });

  test("throws SiteNotAnalyzableError on DNS failure", async () => {
    const page = makePage();

    page.goto.mockRejectedValue(new Error("net::ERR_NAME_NOT_RESOLVED"));

    const loader = new PageLoader();

    await expect(loader.load(page, "https://notexist.xyz")).rejects.toThrow(
      SiteNotAnalyzableError,
    );
  });

  test("throws SiteNotAnalyzableError on connection refused", async () => {
    const page = makePage();

    page.goto.mockRejectedValue(new Error("net::ERR_CONNECTION_REFUSED"));

    const loader = new PageLoader();

    const err = await loader
      .load(page, "https://refused.example.com")
      .catch((e) => e);

    expect(err).toBeInstanceOf(SiteNotAnalyzableError);
    expect(err.reason).toBe("connection refused");
  });

  test("throws SiteNotAnalyzableError for invalid URL", async () => {
    const page = makePage();

    page.goto.mockRejectedValue(new Error("Cannot navigate to invalid URL"));

    const loader = new PageLoader();

    await expect(loader.load(page, "not-a-url")).rejects.toThrow(
      SiteNotAnalyzableError,
    );
  });

  test("throws SiteNotAnalyzableError for non-HTTP protocol", async () => {
    const page = makePage();

    page.goto.mockRejectedValue(new Error("Cannot navigate to invalid URL"));

    const loader = new PageLoader();

    await expect(loader.load(page, "ftp://example.com")).rejects.toThrow(
      SiteNotAnalyzableError,
    );
  });

  test("documentSizeKb reflects HTML byte length", async () => {
    const html = "A".repeat(10_240);
    const page = makePage();

    page.content.mockResolvedValue(html);
    page.url.mockReturnValue("https://example.com");
    page.goto.mockResolvedValue();

    const loader = new PageLoader();

    const result = await loader.load(page, "https://example.com");

    expect(result.documentSizeKb).toBeCloseTo(10, 0);
  });
});
