const TechDetector = require("../../src/services/TechDetector");

describe("TechDetector", () => {
  let techDetector;

  beforeEach(() => {
    techDetector = new TechDetector();
  });

  test("detecta servidor Nginx desde headers", () => {
    const result = techDetector.detect({
      html: "<html></html>",
      headers: { server: "nginx" },
      finalUrl: "https://example.com",
    });

    expect(result.server).toBe("Nginx");
  });

  test("detecta servidor Apache desde headers", () => {
    const result = techDetector.detect({
      html: "<html></html>",
      headers: { server: "Apache" },
      finalUrl: "https://example.com",
    });

    expect(result.server).toBe("Apache");
  });

  test("detecta Cloudflare desde headers", () => {
    const result = techDetector.detect({
      html: "<html></html>",
      headers: { server: "cloudflare" },
      finalUrl: "https://example.com",
    });

    expect(result.server).toBe("Cloudflare");
  });

  test("detecta Express / Node.js desde x-powered-by", () => {
    const result = techDetector.detect({
      html: "<html></html>",
      headers: { "x-powered-by": "Express" },
      finalUrl: "https://example.com",
    });

    expect(result.server).toBe("Express / Node.js");
  });

  test("devuelve servidor desconocido si no hay señales", () => {
    const result = techDetector.detect({
      html: "<html></html>",
      headers: {},
      finalUrl: "https://example.com",
    });

    expect(result.server).toBe("Desconocido");
  });

  test("detecta PHP desde x-powered-by", () => {
    const result = techDetector.detect({
      html: "<html></html>",
      headers: { "x-powered-by": "PHP/8.2" },
      finalUrl: "https://example.com",
    });

    expect(result.language).toBe("PHP");
  });

  test("detecta PHP desde URL .php", () => {
    const result = techDetector.detect({
      html: "<html></html>",
      headers: {},
      finalUrl: "https://example.com/index.php",
    });

    expect(result.language).toBe("PHP");
  });

  test("detecta .NET / C# desde URL .aspx", () => {
    const result = techDetector.detect({
      html: "<html></html>",
      headers: {},
      finalUrl: "https://example.com/home.aspx",
    });

    expect(result.language).toBe(".NET / C#");
  });

  test("detecta Java desde URL .jsp", () => {
    const result = techDetector.detect({
      html: "<html></html>",
      headers: {},
      finalUrl: "https://example.com/home.jsp",
    });

    expect(result.language).toBe("Java");
  });

  test("detecta PHP desde señales de WordPress", () => {
    const html = `
      <html>
        <body>
          <script src="/wp-content/themes/theme/main.js"></script>
        </body>
      </html>
    `;

    const result = techDetector.detect({
      html,
      headers: {},
      finalUrl: "https://example.com",
    });

    expect(result.language).toBe("PHP");
  });

  test("detecta JavaScript / TypeScript desde señales de Next.js", () => {
    const html = `
      <html>
        <body>
          <script src="/_next/static/app.js"></script>
        </body>
      </html>
    `;

    const result = techDetector.detect({
      html,
      headers: {},
      finalUrl: "https://example.com",
    });

    expect(result.language).toBe("JavaScript / TypeScript");
  });

  test("devuelve lenguaje desconocido si no hay señales", () => {
    const result = techDetector.detect({
      html: "<html></html>",
      headers: {},
      finalUrl: "https://example.com",
    });

    expect(result.language).toBe("HTML Estático / Desconocido");
  });

  test("detecta React / Next.js", () => {
    const html = `
      <html>
        <body>
          <div id="__next"></div>
        </body>
      </html>
    `;

    const result = techDetector.detect({
      html,
      headers: {},
      finalUrl: "https://example.com",
    });

    expect(result.frontendFramework).toBe("React / Next.js");
  });

  test("detecta Vue.js / Nuxt.js", () => {
    const html = `
      <html>
        <body>
          <div id="__nuxt"></div>
        </body>
      </html>
    `;

    const result = techDetector.detect({
      html,
      headers: {},
      finalUrl: "https://example.com",
    });

    expect(result.frontendFramework).toBe("Vue.js / Nuxt.js");
  });

  test("detecta Angular", () => {
    const html = `
      <html>
        <body>
          <app-root ng-version="17.0.0"></app-root>
        </body>
      </html>
    `;

    const result = techDetector.detect({
      html,
      headers: {},
      finalUrl: "https://example.com",
    });

    expect(result.frontendFramework).toBe("Angular");
  });

  test("detecta Svelte", () => {
    const html = `
      <html>
        <body>
          <div class="svelte-abc123"></div>
        </body>
      </html>
    `;

    const result = techDetector.detect({
      html,
      headers: {},
      finalUrl: "https://example.com",
    });

    expect(result.frontendFramework).toBe("Svelte");
  });

  test("devuelve Vanilla JS si no detecta framework frontend", () => {
    const result = techDetector.detect({
      html: "<html><body>Hello</body></html>",
      headers: {},
      finalUrl: "https://example.com",
    });

    expect(result.frontendFramework).toBe("Ninguno / Vanilla JS");
  });

  test("devuelve detected con las tecnologías encontradas", () => {
    const html = `
      <html>
        <body>
          <div id="__next"></div>
        </body>
      </html>
    `;

    const result = techDetector.detect({
      html,
      headers: {
        server: "cloudflare",
        "x-powered-by": "PHP/8.2",
      },
      finalUrl: "https://example.com",
    });

    expect(result.detected).toEqual(
      expect.arrayContaining(["Cloudflare", "PHP", "React / Next.js"]),
    );
  });
});
