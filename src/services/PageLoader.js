const BrowserManager = require("./BrowserManager");
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
  "Protocol error",
  "Cannot navigate to invalid URL",
];

class PageLoader {
  constructor(options = {}) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async load(url) {
    this._validateUrl(url);

    const manager = BrowserManager.getInstance();
    const page = await manager.acquirePage();

    try {
      return await this._navigate(page, url);
    } finally {
      await manager.releasePage(page);
    }
  }

  _validateUrl(url) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      throw new SiteNotAnalyzableError(url, "invalid URL format");
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new SiteNotAnalyzableError(
        url,
        `unsupported protocol "${parsed.protocol}"`,
      );
    }
  }

  async _navigate(page, url) {
    let mainResponse = null;

    page.on("response", (response) => {
      if (mainResponse !== null) return;
      const req = response.request();
      if (req.resourceType() === "document") {
        mainResponse = response;
      }
    });

    const startTime = Date.now();

    try {
      await this._navigateWithFallback(page, url);
    } catch (err) {
      throw this._classifyError(err, url);
    }

    const responseTimeMs = Date.now() - startTime;

    const finalUrl = page.url();
    const html = await page.content();
    const documentSizeKb = +(Buffer.byteLength(html, "utf8") / 1024).toFixed(2);
    const sslValid = this._checkSsl(finalUrl, mainResponse);
    const headers = mainResponse ? mainResponse.headers() : {};

    return {
      html,
      finalUrl,
      headers,
      responseTimeMs,
      documentSizeKb,
      sslValid,
    };
  }

  async _navigateWithFallback(page, url) {
    for (let i = 0; i < NAV_WAIT_UNTIL.length; i++) {
      const waitUntil = NAV_WAIT_UNTIL[i];
      const isLast = i === NAV_WAIT_UNTIL.length - 1;

      try {
        await page.goto(url, {
          timeout: this.timeoutMs,
          waitUntil,
        });
        return;
      } catch (err) {
        const isTimeout =
          err.name === "TimeoutError" ||
          err.message.includes("timeout") ||
          err.message.includes("Timeout");

        if (isTimeout && !isLast) {
          continue;
        }

        throw err;
      }
    }
  }

  _checkSsl(finalUrl, response) {
    try {
      const { protocol } = new URL(finalUrl);
      if (protocol !== "https:") return false;

      if (!response) return true;

      const secDetails = response.securityDetails?.();
      if (secDetails) {
        return true;
      }

      const status = response.status();
      return status > 0 && status < 600;
    } catch {
      return false;
    }
  }

  _classifyError(err, url) {
    const msg = err.message ?? "";

    if (err.name === "TimeoutError" || msg.toLowerCase().includes("timeout")) {
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

  _friendlyReason(msg) {
    if (msg.includes("ERR_NAME_NOT_RESOLVED")) return "DNS resolution failed";
    if (msg.includes("ERR_CONNECTION_REFUSED")) return "connection refused";
    if (msg.includes("ERR_CONNECTION_RESET")) return "connection reset";
    if (msg.includes("ERR_CONNECTION_TIMED_OUT")) return "connection timed out";
    if (msg.includes("ERR_INTERNET_DISCONNECTED"))
      return "no internet connection";
    if (msg.includes("ERR_ADDRESS_UNREACHABLE")) return "address unreachable";
    if (msg.includes("ERR_CERT_") || msg.includes("ERR_SSL_"))
      return "SSL/TLS certificate error";
    if (msg.includes("Cannot navigate to invalid URL")) return "invalid URL";
    return msg;
  }
}

module.exports = PageLoader;
