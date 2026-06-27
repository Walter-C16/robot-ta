const puppeteer = require("puppeteer");

const LAUNCH_OPTIONS = {
  headless: "new",
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

  async _getOrLaunch() {
    if (this._browser && this._browser.isConnected()) {
      return this._browser;
    }

    if (this._launching) {
      return this._launching;
    }

    this._launching = puppeteer
      .launch(LAUNCH_OPTIONS)
      .then((browser) => {
        this._browser = browser;
        this._launching = null;

        browser.on("disconnected", () => {
          this._browser = null;
        });

        return browser;
      })
      .catch((err) => {
        this._launching = null;
        throw err;
      });

    return this._launching;
  }

  async acquirePage() {
    const browser = await this._getOrLaunch();
    const page = await browser.newPage();

    await page.setCacheEnabled(false);
    await page.setViewport({ width: 1280, height: 800 });

    await page.setExtraHTTPHeaders({
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    });

    return page;
  }

  async releasePage(page) {
    try {
      if (page && !page.isClosed()) {
        await page.close();
      }
    } catch {
      // Ignorar errores de cleanup
    }
  }

  async close() {
    if (this._browser) {
      try {
        await this._browser.close();
      } catch {
        // Ignorar
      } finally {
        this._browser = null;
      }
    }
  }
}

BrowserManager._instance = null;

module.exports = BrowserManager;
