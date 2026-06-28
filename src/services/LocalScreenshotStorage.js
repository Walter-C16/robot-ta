const fs = require("fs/promises");
const path = require("path");

class LocalScreenshotStorage {
  constructor(options = {}) {
    this.screenshotsDir =
      options.screenshotsDir ?? process.env.SCREENSHOTS_DIR ?? "./screenshots";

    this.baseUrl =
      options.baseUrl ?? process.env.BASE_URL ?? "http://localhost:3001";

    this.publicPath = options.publicPath ?? "/screenshots";
  }

  async save(buffer, filename) {
    if (!buffer) {
      throw new Error("Screenshot buffer is required");
    }

    if (!filename || typeof filename !== "string") {
      throw new Error("Screenshot filename is required");
    }

    const safeFilename = this._sanitizeFilename(filename);
    const dirPath = path.resolve(this.screenshotsDir);
    const filePath = path.join(dirPath, safeFilename);

    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, buffer);

    return this._buildPublicUrl(safeFilename);
  }

  _buildPublicUrl(filename) {
    const normalizedBaseUrl = this.baseUrl.replace(/\/$/, "");
    const normalizedPublicPath = this.publicPath.startsWith("/")
      ? this.publicPath
      : `/${this.publicPath}`;

    return `${normalizedBaseUrl}${normalizedPublicPath}/${filename}`;
  }

  _sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  }
}

module.exports = LocalScreenshotStorage;
