/**
 * STUB.
 *
 * Luego se implementa con Puppeteer:
 * - page.goto(...)
 * - page.content()
 * - headers
 * - responseTimeMs
 * - documentSizeKb
 * - sslValid
 */
class PageLoader {
  async load(page, url) {
    return {
      html: "<html><body>STUB_HTML</body></html>",
      finalUrl: url,
      headers: {
        server: "cloudflare",
        "cf-ray": "stub-ray"
      },
      responseTimeMs: 1200,
      documentSizeKb: 56.4,
      sslValid: true
    };
  }
}

module.exports = PageLoader;
