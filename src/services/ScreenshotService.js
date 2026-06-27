/**
 * STUB.
 *
 * Luego se implementa con Puppeteer:
 * - page.screenshot(...)
 * - delegar guardado al storage
 */
class ScreenshotService {
  constructor({ storage }) {
    this.storage = storage;
  }

  async capture(page, scanId) {
    const filename = `${scanId}.png`;

    const screenshotUrl = await this.storage.save(
      Buffer.from("STUB_SCREENSHOT"),
      filename,
    );

    return [screenshotUrl];
  }
}

module.exports = ScreenshotService;
