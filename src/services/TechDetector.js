class TechDetector {
  detect(pageData = {}) {
    const html = pageData.html ?? "";
    const headers = pageData.headers ?? {};
    const url = pageData.finalUrl ?? pageData.url ?? "";

    const normalizedHeaders = {};

    Object.keys(headers).forEach((key) => {
      normalizedHeaders[key.toLowerCase()] = String(headers[key]).toLowerCase();
    });

    const htmlLower = String(html).toLowerCase();
    const urlLower = String(url).toLowerCase();

    const server = this._detectServer(normalizedHeaders, htmlLower);
    const language = this._detectLanguage(
      normalizedHeaders,
      htmlLower,
      urlLower,
    );
    const frontendFramework = this._detectFrontendFramework(htmlLower);

    const detected = this._buildDetected({
      server,
      language,
      frontendFramework,
    });

    return {
      server,
      language,
      frontendFramework,
      detected,
    };
  }

  _detectServer(headers, html) {
    const serverHeader = headers["server"] || "";

    if (serverHeader.includes("nginx")) return "Nginx";
    if (serverHeader.includes("apache")) return "Apache";
    if (serverHeader.includes("cloudflare")) return "Cloudflare";
    if (serverHeader.includes("microsoft-iis")) return "Microsoft-IIS";

    if (headers["x-powered-by"]?.includes("express")) {
      return "Express / Node.js";
    }

    return "Desconocido";
  }

  _detectLanguage(headers, html, url) {
    const languages = new Set();
    const xPoweredBy = headers["x-powered-by"] || "";

    if (xPoweredBy.includes("php") || headers["x-php-pid"]) {
      languages.add("PHP");
    }

    if (xPoweredBy.includes("asp.net")) {
      languages.add(".NET / C#");
    }

    if (url.includes(".php")) {
      languages.add("PHP");
    }

    if (url.includes(".aspx") || url.includes(".asp")) {
      languages.add(".NET / C#");
    }

    if (url.includes(".jsp")) {
      languages.add("Java");
    }

    if (html.includes("wp-content") || html.includes("laravel_session")) {
      languages.add("PHP");
    }

    if (html.includes("/next/static") || html.includes("react")) {
      languages.add("JavaScript / TypeScript");
    }

    return languages.size > 0
      ? Array.from(languages).join(", ")
      : "HTML Estático / Desconocido";
  }

  _detectFrontendFramework(html) {
    if (
      html.includes('id="__next"') ||
      html.includes("data-reactroot") ||
      html.includes("/next/static")
    ) {
      return "React / Next.js";
    }

    if (
      html.includes("data-v-") ||
      html.includes('id="__nuxt"') ||
      html.includes("v-app")
    ) {
      return "Vue.js / Nuxt.js";
    }

    if (
      html.includes("ng-version") ||
      html.includes("ng-app") ||
      html.includes("_ngcontent")
    ) {
      return "Angular";
    }

    if (html.includes('class="svelte-')) {
      return "Svelte";
    }

    return "Ninguno / Vanilla JS";
  }

  _buildDetected({ server, language, frontendFramework }) {
    const detected = new Set();

    if (server && server !== "Desconocido") {
      detected.add(server);
    }

    if (language && language !== "HTML Estático / Desconocido") {
      language.split(",").forEach((item) => detected.add(item.trim()));
    }

    if (frontendFramework && frontendFramework !== "Ninguno / Vanilla JS") {
      detected.add(frontendFramework);
    }

    return Array.from(detected);
  }
}

module.exports = TechDetector;
