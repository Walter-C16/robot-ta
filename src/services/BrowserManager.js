/**
 * STUB.
 *
 * Luego se implementa con Puppeteer:
 * - abrir una única instancia de Chrome
 * - entregar páginas nuevas
 * - cerrar páginas
 * - apagar navegador
 */
class BrowserManager {
  async getPage() {
    return {
      id: "stub-page",
      type: "STUB_PAGE"
    };
  }

  async closePage(page) {
    return {
      closed: true,
      page
    };
  }

  async shutdown() {
    return {
      shutdown: true
    };
  }
}

module.exports = BrowserManager;
