class TechDetector {
  detect(pageData = {}) {
    const html = String(pageData.html ?? "");
    const headers = this._normalizeHeaders(pageData.headers ?? {});
    const url = String(pageData.finalUrl ?? pageData.url ?? "");

    const htmlLower = html.toLowerCase();
    const urlLower = url.toLowerCase();
    const hostname = this._getHostname(urlLower);

    const scriptSources = this._extractScriptSources(htmlLower);
    const metaGenerator = this._extractMetaGenerator(htmlLower);

    const server = this._detectServer(headers, hostname, htmlLower);
    const language = this._detectLanguage({
      headers,
      html: htmlLower,
      url: urlLower,
      metaGenerator,
    });

    const frontendFramework = this._detectFrontendFramework({
      html: htmlLower,
      scriptSources,
      hostname,
    });

    const platforms = this._detectPlatforms({
      headers,
      html: htmlLower,
      scriptSources,
      hostname,
      metaGenerator,
    });

    const detected = this._buildDetected({
      server,
      language,
      frontendFramework,
      platforms,
    });

    return {
      server,
      language,
      frontendFramework,
      detected,
    };
  }

  _normalizeHeaders(headers) {
    const normalized = {};

    Object.keys(headers).forEach((key) => {
      normalized[key.toLowerCase()] = String(headers[key]).toLowerCase();
    });

    return normalized;
  }

  _getHostname(url) {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return "";
    }
  }

  _extractScriptSources(html) {
    const sources = [];
    const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi;

    let match;

    while ((match = scriptRegex.exec(html)) !== null) {
      sources.push(match[1].toLowerCase());
    }

    return sources;
  }

  _extractMetaGenerator(html) {
    const generatorRegex =
      /<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i;

    const match = html.match(generatorRegex);

    return match ? match[1].toLowerCase() : "";
  }

  _detectServer(headers, hostname, html) {
    const serverHeader = headers["server"] || "";
    const poweredBy = headers["x-powered-by"] || "";
    const via = headers["via"] || "";
    const cfRay = headers["cf-ray"] || "";
    const xServedBy = headers["x-served-by"] || "";

    if (serverHeader.includes("gws")) return "Google Web Server";
    if (serverHeader.includes("nginx")) return "Nginx";
    if (serverHeader.includes("apache")) return "Apache";
    if (serverHeader.includes("cloudflare")) return "Cloudflare";
    if (serverHeader.includes("microsoft-iis")) return "Microsoft-IIS";
    if (serverHeader.includes("openresty")) return "OpenResty";
    if (serverHeader.includes("gunicorn")) return "Gunicorn";
    if (serverHeader.includes("uvicorn")) return "Uvicorn";

    if (poweredBy.includes("express")) return "Express / Node.js";
    if (poweredBy.includes("next.js")) return "Next.js";
    if (poweredBy.includes("asp.net")) return "Microsoft-IIS / ASP.NET";

    if (cfRay) return "Cloudflare";
    if (via.includes("google") || xServedBy.includes("google")) {
      return "Google Infrastructure";
    }

    if (
      hostname.endsWith("google.com") ||
      hostname.endsWith("gstatic.com") ||
      hostname.endsWith("googleusercontent.com") ||
      html.includes("google")
    ) {
      return "Google Infrastructure";
    }

    return "Desconocido";
  }

  _detectLanguage({ headers, html, url, metaGenerator }) {
    const languages = new Set();

    const poweredBy = headers["x-powered-by"] || "";
    const server = headers["server"] || "";
    const setCookie = headers["set-cookie"] || "";

    if (
      poweredBy.includes("php") ||
      headers["x-php-pid"] ||
      html.includes("laravel_session") ||
      html.includes("wp-content") ||
      html.includes("wp-includes") ||
      metaGenerator.includes("wordpress") ||
      url.includes(".php")
    ) {
      languages.add("PHP");
    }

    if (
      poweredBy.includes("asp.net") ||
      poweredBy.includes(".net") ||
      url.includes(".aspx") ||
      url.includes(".asp")
    ) {
      languages.add(".NET / C#");
    }

    if (
      poweredBy.includes("express") ||
      poweredBy.includes("node") ||
      poweredBy.includes("next.js") ||
      html.includes("/_next/static") ||
      html.includes("__next_data__")
    ) {
      languages.add("JavaScript / TypeScript");
    }

    if (
      poweredBy.includes("django") ||
      poweredBy.includes("flask") ||
      server.includes("gunicorn") ||
      server.includes("uvicorn")
    ) {
      languages.add("Python");
    }

    if (url.includes(".jsp") || setCookie.includes("jsessionid")) {
      languages.add("Java");
    }

    if (html.includes("ruby on rails") || setCookie.includes("_session_id")) {
      languages.add("Ruby");
    }

    return languages.size > 0
      ? Array.from(languages).join(", ")
      : "HTML Estático / Desconocido";
  }

  _detectFrontendFramework({ html, scriptSources, hostname }) {
    const scripts = scriptSources.join(" ");

    if (
      html.includes('id="__next"') ||
      html.includes("/_next/static") ||
      html.includes("__next_data__") ||
      scripts.includes("/_next/static")
    ) {
      return "React / Next.js";
    }

    if (
      html.includes("data-reactroot") ||
      html.includes("react-dom") ||
      html.includes("__react") ||
      scripts.includes("react")
    ) {
      return "React";
    }

    if (
      html.includes('id="__nuxt"') ||
      html.includes("/_nuxt/") ||
      scripts.includes("/_nuxt/")
    ) {
      return "Vue.js / Nuxt.js";
    }

    if (
      html.includes("data-v-") ||
      html.includes("v-app") ||
      html.includes("vue")
    ) {
      return "Vue.js";
    }

    if (
      html.includes("ng-version") ||
      html.includes("ng-app") ||
      html.includes("_ngcontent") ||
      html.includes("angular")
    ) {
      return "Angular";
    }

    if (html.includes('class="svelte-') || scripts.includes("svelte")) {
      return "Svelte";
    }

    if (
      html.includes("data-turbo") ||
      html.includes("turbo-") ||
      scripts.includes("turbo")
    ) {
      return "Hotwire / Turbo";
    }

    if (
      hostname.endsWith("google.com") ||
      scripts.includes("gstatic.com") ||
      scripts.includes("google.com")
    ) {
      return "JavaScript propietario";
    }

    return "Ninguno / Vanilla JS";
  }

  _detectPlatforms({ headers, html, scriptSources, hostname, metaGenerator }) {
    const detected = new Set();
    const scripts = scriptSources.join(" ");
    const poweredBy = headers["x-powered-by"] || "";

    if (
      hostname.endsWith("google.com") ||
      scripts.includes("gstatic.com") ||
      html.includes("google")
    ) {
      detected.add("Google");
    }

    if (
      hostname === "www.google.com" ||
      hostname === "google.com" ||
      html.includes("/search?")
    ) {
      detected.add("Google Search");
    }

    if (
      html.includes("googletagmanager.com") ||
      scripts.includes("googletagmanager.com")
    ) {
      detected.add("Google Tag Manager");
    }

    if (
      html.includes("google-analytics.com") ||
      html.includes("gtag(") ||
      scripts.includes("google-analytics.com")
    ) {
      detected.add("Google Analytics");
    }

    if (
      html.includes("wp-content") ||
      html.includes("wp-includes") ||
      metaGenerator.includes("wordpress")
    ) {
      detected.add("WordPress");
    }

    if (
      html.includes("shopify") ||
      scripts.includes("cdn.shopify.com") ||
      poweredBy.includes("shopify")
    ) {
      detected.add("Shopify");
    }

    if (html.includes("wix.com") || scripts.includes("wixstatic.com")) {
      detected.add("Wix");
    }

    if (html.includes("squarespace") || scripts.includes("squarespace.com")) {
      detected.add("Squarespace");
    }

    if (scripts.includes("bootstrap") || html.includes("bootstrap")) {
      detected.add("Bootstrap");
    }

    if (scripts.includes("jquery") || html.includes("jquery")) {
      detected.add("jQuery");
    }

    if (scripts.includes("cloudflare") || headers["cf-ray"]) {
      detected.add("Cloudflare");
    }

    return Array.from(detected);
  }

  _buildDetected({ server, language, frontendFramework, platforms }) {
    const detected = new Set();

    if (server && server !== "Desconocido") {
      detected.add(server);
    }

    if (language && language !== "HTML Estático / Desconocido") {
      language.split(",").forEach((item) => {
        const value = item.trim();

        if (value) detected.add(value);
      });
    }

    if (frontendFramework && frontendFramework !== "Ninguno / Vanilla JS") {
      detected.add(frontendFramework);
    }

    platforms.forEach((platform) => detected.add(platform));

    return Array.from(detected);
  }
}

module.exports = TechDetector;
