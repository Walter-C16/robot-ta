const { TargetTimeoutError, SiteNotAnalyzableError } = require("../errors");

const DEFAULT_TIMEOUT_MS = 30_000;

const NAV_WAIT_UNTIL = ["networkidle2", "domcontentloaded"];

const UNREACHABLE_PATTERNS = [
  "net::ERR_NAME_NOT_RESOLVED",
  "net::ERR_CONNECTION_REFUSED",
  "net::ERR_CONNECTION_RESET",
  "net::ERR_CONNECTION_TIMED_OUT",
  "net::ERR_INTERNET_DISCONNECTED",
  "net::ERR_ADDRESS_UNREACHABLE",
  "net::ERR_CERT_",
  "net::ERR_SSL_",
  "net::ERR_TUNNEL_CONNECTION_FAILED",
  "Cannot navigate to invalid URL",
];

class PageLoader {
  constructor(options = {}) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async load(page, url) {
    this._validatePage(page);

    const normalizedUrl = this._normalizeUrl(url);

    return this._navigate(page, normalizedUrl);
  }

  async _navigate(page, url) {
    const startTime = Date.now();

    let mainResponse;
    let navigationStrategy;

    try {
      const result = await this._navigateWithFallback(page, url);

      mainResponse = result.response;
      navigationStrategy = result.waitUntil;
    } catch (err) {
      throw this._classifyError(err, url);
    }

    const responseTimeMs = Date.now() - startTime;

    const finalUrl = page.url();
    const html = await page.content();
    const headers = mainResponse ? mainResponse.headers() : {};
    const documentSizeKb = this._calculateDocumentSizeKb(html);
    const sslValid = this._checkSsl(finalUrl, mainResponse);
    const cookies = await this._safeGetCookies(page, finalUrl);

    return {
      html,
      finalUrl,
      headers,
      responseTimeMs,
      documentSizeKb,
      sslValid,
      cookies,
      navigationStrategy,
    };
  }

  async _navigateWithFallback(page, url) {
    let lastError;

    for (const waitUntil of NAV_WAIT_UNTIL) {
      try {
        const response = await page.goto(url, {
          timeout: this.timeoutMs,
          waitUntil,
        });

        return {
          response,
          waitUntil,
        };
      } catch (err) {
        lastError = err;

        if (!this._isTimeoutError(err)) {
          throw err;
        }
      }
    }

    throw lastError;
  }

  _validatePage(page) {
    if (!page || typeof page.goto !== "function") {
      throw new Error(
        "Invalid PageLoader argument: page must be a Puppeteer Page",
      );
    }
  }

  _normalizeUrl(url) {
    if (typeof url !== "string") {
      throw new SiteNotAnalyzableError(url, "URL must be a string");
    }

    const trimmedUrl = url.trim();

    let parsedUrl;

    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      throw new SiteNotAnalyzableError(trimmedUrl, "invalid URL");
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new SiteNotAnalyzableError(trimmedUrl, "unsupported protocol");
    }

    return parsedUrl.toString();
  }

  _calculateDocumentSizeKb(html) {
    return +(Buffer.byteLength(html, "utf8") / 1024).toFixed(2);
  }

  async _safeGetCookies(page, finalUrl) {
    try {
      return await page.browserContext().cookies(finalUrl);
    } catch {
      return [];
    }
  }

  _checkSsl(finalUrl, response) {
    try {
      const { protocol } = new URL(finalUrl);

      if (protocol !== "https:") return false;
      if (!response) return true;

      const securityDetails = response.securityDetails?.();

      if (securityDetails) return true;

      const status = response.status();

      return status > 0 && status < 600;
    } catch {
      return false;
    }
  }

  _classifyError(err, url) {
    const msg = err.message ?? "";

    if (this._isTimeoutError(err)) {
      return new TargetTimeoutError(url, this.timeoutMs);
    }

    for (const pattern of UNREACHABLE_PATTERNS) {
      if (msg.includes(pattern)) {
        const reason = this._friendlyReason(msg);

        return new SiteNotAnalyzableError(url, reason, err);
      }
    }

    return new SiteNotAnalyzableError(
      url,
      msg || "unknown navigation error",
      err,
    );
  }

  _isTimeoutError(err) {
    const message = err.message ?? "";

    return (
      err.name === "TimeoutError" || message.toLowerCase().includes("timeout")
    );
  }

  _friendlyReason(msg) {
    if (msg.includes("ERR_NAME_NOT_RESOLVED")) return "DNS resolution failed";
    if (msg.includes("ERR_CONNECTION_REFUSED")) return "connection refused";
    if (msg.includes("ERR_CONNECTION_RESET")) return "connection reset";
    if (msg.includes("ERR_CONNECTION_TIMED_OUT")) return "connection timed out";
    if (msg.includes("ERR_INTERNET_DISCONNECTED")) {
      return "no internet connection";
    }
    if (msg.includes("ERR_ADDRESS_UNREACHABLE")) return "address unreachable";
    if (msg.includes("ERR_CERT_") || msg.includes("ERR_SSL_")) {
      return "SSL/TLS certificate error";
    }
    if (msg.includes("Cannot navigate to invalid URL")) return "invalid URL";

    return msg;
  }
}

module.exports = PageLoader;
