const fs = require("fs/promises");
const os = require("os");
const path = require("path");

const ScreenshotService = require("../../src/services/ScreenshotService");
const LocalScreenshotStorage = require("../../src/services/LocalScreenshotStorage");

describe("LocalScreenshotStorage", () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "screenshots-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test("guarda el archivo y devuelve una URL pública", async () => {
    const storage = new LocalScreenshotStorage({
      screenshotsDir: tempDir,
      baseUrl: "http://localhost:3001",
    });

    const buffer = Buffer.from("fake-image");

    const url = await storage.save(buffer, "scan-123.png");

    const savedFile = await fs.readFile(path.join(tempDir, "scan-123.png"));

    expect(savedFile).toEqual(buffer);
    expect(url).toBe("http://localhost:3001/screenshots/scan-123.png");
  });

  test("sanitiza nombres de archivo inválidos", async () => {
    const storage = new LocalScreenshotStorage({
      screenshotsDir: tempDir,
      baseUrl: "http://localhost:3001",
    });

    const buffer = Buffer.from("fake-image");

    const url = await storage.save(buffer, "../bad/name.png");

    expect(url).toBe("http://localhost:3001/screenshots/.._bad_name.png");
  });
});

describe("ScreenshotService", () => {
  test("toma screenshot, lo guarda y devuelve array de URLs", async () => {
    const page = {
      screenshot: jest.fn().mockResolvedValue(Buffer.from("fake-image")),
    };

    const storage = {
      save: jest
        .fn()
        .mockResolvedValue("http://localhost:3001/screenshots/id.png"),
    };

    const service = new ScreenshotService({ storage });

    const result = await service.capture(page, "id");

    expect(page.screenshot).toHaveBeenCalledWith({
      type: "png",
      fullPage: true,
    });

    expect(storage.save).toHaveBeenCalledWith(
      Buffer.from("fake-image"),
      "id.png",
    );

    expect(result).toEqual(["http://localhost:3001/screenshots/id.png"]);
  });

  test("lanza error si page no es válida", async () => {
    const storage = {
      save: jest.fn(),
    };

    const service = new ScreenshotService({ storage });

    await expect(service.capture({}, "id")).rejects.toThrow(
      "page must be a Puppeteer Page",
    );
  });

  test("lanza error si scanId no es válido", async () => {
    const page = {
      screenshot: jest.fn(),
    };

    const storage = {
      save: jest.fn(),
    };

    const service = new ScreenshotService({ storage });

    await expect(service.capture(page, null)).rejects.toThrow(
      "scanId must be a string",
    );
  });
});
