const ScreenshotStorage = require("./ScreenshotStorage");

/**
 * STUB.
 *
 * No escribe en disco todavía.
 * Solo devuelve una URL con la forma esperada.
 */
class LocalScreenshotStorage extends ScreenshotStorage {
  constructor({ baseUrl }) {
    super();
    this.baseUrl = baseUrl;
  }

  async save(imageBuffer, filename) {
    return `${this.baseUrl}/screenshots/${filename}`;
  }
}

module.exports = LocalScreenshotStorage;
