const puppeteer = require("puppeteer");
const LoggingService = require("./LoggingService");

const LAUNCH_OPTIONS = {
  headless: process.env.PUPPETEER_HEADLESS !== "false",
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-extensions",
    "--disable-background-networking",
    "--disable-sync",
    "--disable-translate",
    "--mute-audio",
    "--no-first-run",
  ],
};

const DEFAULT_VIEWPORT = {
  width: 1280,
  height: 800,
};

const DEFAULT_HEADERS = {
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

class BrowserManager {
  constructor() {
    this._browser = null;
    this._launching = null;
  }

  static getInstance() {
    if (!BrowserManager._instance) {
      BrowserManager._instance = new BrowserManager();
    }

    return BrowserManager._instance;
  }

  async acquirePage() {
    const browser = await this._getOrLaunch();
    const page = await browser.newPage();

    await this._configurePage(page);

    void LoggingService.debug("PAGE_ACQUIRED", "Nueva página creada");

    return page;
  }

  async releasePage(page) {
    try {
      if (page && !page.isClosed()) {
        await page.close();

        void LoggingService.debug("PAGE_RELEASED", "Página cerrada");
      }
    } catch (error) {
      void LoggingService.warn(
        "PAGE_RELEASE_FAILED",
        error?.message || "No se pudo cerrar la página",
      );
    }
  }

  async close() {
    if (!this._browser) return;

    try {
      await this._browser.close();

      void LoggingService.info("BROWSER_CLOSED", "Browser cerrado");
    } catch (error) {
      void LoggingService.warn(
        "BROWSER_CLOSE_FAILED",
        error?.message || "No se pudo cerrar el browser",
      );
    } finally {
      this._browser = null;
      this._launching = null;
    }
  }

  _isBrowserConnected() {
    if (!this._browser) return false;

    if (typeof this._browser.connected === "boolean") {
      return this._browser.connected;
    }

    if (typeof this._browser.isConnected === "function") {
      return this._browser.isConnected();
    }

    return false;
  }

  async _getOrLaunch() {
    if (this._isBrowserConnected()) {
      return this._browser;
    }

    if (this._launching) {
      return this._launching;
    }

    void LoggingService.info("BROWSER_LAUNCHING", "Iniciando Puppeteer");

    this._launching = puppeteer
      .launch(LAUNCH_OPTIONS)
      .then((browser) => {
        this._browser = browser;
        this._launching = null;

        browser.on("disconnected", () => {
          this._browser = null;

          void LoggingService.warn(
            "BROWSER_DISCONNECTED",
            "El browser se desconectó",
          );
        });

        void LoggingService.info("BROWSER_READY", "Puppeteer iniciado");

        return browser;
      })
      .catch((error) => {
        this._launching = null;
        throw error;
      });

    return this._launching;
  }

  async _configurePage(page) {
    await page.setCacheEnabled(false);
    await page.setViewport(DEFAULT_VIEWPORT);
    await page.setExtraHTTPHeaders(DEFAULT_HEADERS);
  }
}

BrowserManager._instance = null;

module.exports = BrowserManager;
