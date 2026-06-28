const HtmlParser = require("../../src/services/HtmlParser");

describe("HtmlParser", () => {
  let parser;

  beforeEach(() => {
    parser = new HtmlParser();
  });

  test("extrae title y description", () => {
    const html = `
      <html>
        <head>
          <title>Example Site</title>
          <meta name="description" content="Example description">
        </head>
        <body></body>
      </html>
    `;

    const result = parser.parse(html, "https://example.com");

    expect(result.identity).toEqual({
      title: "Example Site",
      description: "Example description",
    });
  });

  test("usa valores por defecto si no hay title ni description", () => {
    const html = `
      <html>
        <body>
          <p>Contenido visible</p>
        </body>
      </html>
    `;

    const result = parser.parse(html, "https://example.com");

    expect(result.identity).toEqual({
      title: "Sin título",
      description: "Sin descripción",
    });
  });

  test("extrae links absolutos y relativos", () => {
    const html = `
      <html>
        <body>
          <a href="/about">About</a>
          <a href="https://external.com/contact">Contact</a>
        </body>
      </html>
    `;

    const result = parser.parse(html, "https://example.com");

    expect(result.links).toEqual([
      "https://example.com/about",
      "https://external.com/contact",
    ]);

    expect(result.linkCount).toBe(2);
  });

  test("ignora links duplicados", () => {
    const html = `
      <html>
        <body>
          <a href="/about">About 1</a>
          <a href="https://example.com/about">About 2</a>
        </body>
      </html>
    `;

    const result = parser.parse(html, "https://example.com");

    expect(result.links).toEqual(["https://example.com/about"]);
    expect(result.linkCount).toBe(1);
  });

  test("ignora anchors, javascript, mailto y tel", () => {
    const html = `
      <html>
        <body>
          <a href="#section">Anchor</a>
          <a href="javascript:void(0)">JS</a>
          <a href="mailto:test@example.com">Mail</a>
          <a href="tel:+5491111111111">Phone</a>
          <a href="/valid">Valid</a>
        </body>
      </html>
    `;

    const result = parser.parse(html, "https://example.com");

    expect(result.links).toEqual(["https://example.com/valid"]);
    expect(result.linkCount).toBe(1);
  });

  test("respeta linksLimit", () => {
    const html = `
      <html>
        <body>
          <a href="/1">One</a>
          <a href="/2">Two</a>
          <a href="/3">Three</a>
        </body>
      </html>
    `;

    const result = parser.parse(html, "https://example.com", {
      linksLimit: 2,
    });

    expect(result.links).toEqual([
      "https://example.com/1",
      "https://example.com/2",
    ]);

    expect(result.linkCount).toBe(2);
  });

  test("cuenta imágenes y párrafos", () => {
    const html = `
      <html>
        <body>
          <img src="a.png">
          <img src="b.png">
          <p>Primer párrafo</p>
          <p>Segundo párrafo</p>
          <p>Tercer párrafo</p>
        </body>
      </html>
    `;

    const result = parser.parse(html, "https://example.com");

    expect(result.imageCount).toBe(2);
    expect(result.paragraphCount).toBe(3);
  });

  test("extrae texto visible sin script, style, noscript ni head", () => {
    const html = `
      <html>
        <head>
          <title>No debe aparecer</title>
          <style>.x { color: red; }</style>
        </head>
        <body>
          <h1>Título visible</h1>
          <p>Texto visible</p>
          <script>console.log("oculto")</script>
          <noscript>Texto noscript oculto</noscript>
        </body>
      </html>
    `;

    const result = parser.parse(html, "https://example.com");

    expect(result.visibleText).toBe("Título visible Texto visible");
    expect(result.wordCount).toBe(4);
  });

  test("calcula wordCount correctamente", () => {
    const html = `
      <html>
        <body>
          <p>Hola mundo desde Robot</p>
        </body>
      </html>
    `;

    const result = parser.parse(html, "https://example.com");

    expect(result.visibleText).toBe("Hola mundo desde Robot");
    expect(result.wordCount).toBe(4);
  });

  test("soporta HTML vacío", () => {
    const result = parser.parse("", "https://example.com");

    expect(result).toEqual({
      identity: {
        title: "Sin título",
        description: "Sin descripción",
      },
      links: [],
      linkCount: 0,
      imageCount: 0,
      paragraphCount: 0,
      wordCount: 0,
      visibleText: "",
    });
  });
});
