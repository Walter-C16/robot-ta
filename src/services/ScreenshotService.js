class ScreenshotService {
  constructor({ storage } = {}) {
    if (!storage || typeof storage.save !== "function") {
      throw new Error("ScreenshotService requires a storage with save()");
    }

    this.storage = storage;
  }

  async capture(page, scanId) {
    if (!page || typeof page.screenshot !== "function") {
      throw new Error(
        "Invalid ScreenshotService argument: page must be a Puppeteer Page",
      );
    }

    if (!scanId || typeof scanId !== "string") {
      throw new Error(
        "Invalid ScreenshotService argument: scanId must be a string",
      );
    }

    const filename = `${scanId}.png`;

    const buffer = await page.screenshot({
      type: "png",
      fullPage: true,
    });

    const screenshotUrl = await this.storage.save(buffer, filename);

    return [screenshotUrl];
  }
}

module.exports = ScreenshotService;
