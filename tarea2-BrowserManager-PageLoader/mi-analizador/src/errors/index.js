class PageTimeoutError extends Error {
  constructor(url, timeoutMs) {
    super(`Page load timed out after ${timeoutMs}ms: ${url}`);
    this.name = 'PageTimeoutError';
    this.url = url;
    this.timeoutMs = timeoutMs;
  }
}

class SiteNotAnalyzableError extends Error {
  constructor(url, reason, cause) {
    super(`Site cannot be analyzed — ${reason}: ${url}`);
    this.name = 'SiteNotAnalyzableError';
    this.url = url;
    this.reason = reason;
    if (cause) this.cause = cause;
  }
}

module.exports = { PageTimeoutError, SiteNotAnalyzableError };
