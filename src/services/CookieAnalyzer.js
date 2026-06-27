class CookieAnalyzer {
  analyze(cookies = [], finalUrl = "") {
    const safeCookies = Array.isArray(cookies) ? cookies : [];
    const finalHostname = this._getHostname(finalUrl);

    return {
      count: safeCookies.length,
      secureCount: safeCookies.filter((cookie) => cookie.secure === true)
        .length,
      httpOnlyCount: safeCookies.filter((cookie) => cookie.httpOnly === true)
        .length,
      sessionCount: safeCookies.filter((cookie) =>
        this._isSessionCookie(cookie),
      ).length,
      thirdPartyCount: safeCookies.filter((cookie) =>
        this._isThirdPartyCookie(cookie, finalHostname),
      ).length,
    };
  }

  _isSessionCookie(cookie) {
    if (cookie.session === true) return true;

    return (
      cookie.expires === undefined ||
      cookie.expires === null ||
      cookie.expires === 0 ||
      cookie.expires === -1
    );
  }

  _isThirdPartyCookie(cookie, finalHostname) {
    if (!finalHostname || !cookie.domain) return false;

    const cookieDomain = this._normalizeDomain(cookie.domain);

    return !this._isSameSiteOrSubdomain(finalHostname, cookieDomain);
  }

  _getHostname(url) {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return "";
    }
  }

  _normalizeDomain(domain) {
    return String(domain).replace(/^\./, "").toLowerCase();
  }

  _isSameSiteOrSubdomain(hostname, cookieDomain) {
    return hostname === cookieDomain || hostname.endsWith(`.${cookieDomain}`);
  }
}

module.exports = CookieAnalyzer;
