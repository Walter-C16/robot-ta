const fs = require("fs/promises");
const os = require("os");
const path = require("path");

const LoggingService = require("../../src/services/LoggingService");

describe("LoggingService", () => {
  let tempDir;
  let logFilePath;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "logging-service-"));
    logFilePath = path.join(tempDir, "test-log.txt");

    LoggingService.logsDir = tempDir;
    LoggingService.fileName = "test-log.txt";
    LoggingService.level = "DEBUG";
    LoggingService.consoleEnabled = false;
    LoggingService.fileEnabled = true;

    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function readLogFile() {
    return fs.readFile(logFilePath, "utf8");
  }

  test("escribe logs INFO en archivo", async () => {
    const result = await LoggingService.info("TEST_EVENT", "Mensaje de prueba");

    expect(result).toBe(true);

    const content = await readLogFile();

    expect(content).toContain("[INFO]");
    expect(content).toContain("[TEST_EVENT]");
    expect(content).toContain("Mensaje de prueba");
  });

  test("escribe timestamp con formato esperado", async () => {
    await LoggingService.info("TEST_EVENT", "Mensaje");

    const content = await readLogFile();

    expect(content).toMatch(
      /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] \[INFO\] \[TEST_EVENT\] Mensaje/,
    );
  });

  test("respeta nivel DEBUG", async () => {
    LoggingService.level = "DEBUG";

    await LoggingService.debug("DEBUG_EVENT", "debug message");
    await LoggingService.info("INFO_EVENT", "info message");
    await LoggingService.warn("WARN_EVENT", "warn message");
    await LoggingService.error("ERROR_EVENT", "error message");

    const content = await readLogFile();

    expect(content).toContain("[DEBUG] [DEBUG_EVENT] debug message");
    expect(content).toContain("[INFO] [INFO_EVENT] info message");
    expect(content).toContain("[WARN] [WARN_EVENT] warn message");
    expect(content).toContain("[ERROR] [ERROR_EVENT] error message");
  });

  test("respeta nivel WARN", async () => {
    LoggingService.level = "WARN";

    const debugResult = await LoggingService.debug("DEBUG_EVENT", "debug");
    const infoResult = await LoggingService.info("INFO_EVENT", "info");
    const warnResult = await LoggingService.warn("WARN_EVENT", "warn");
    const errorResult = await LoggingService.error("ERROR_EVENT", "error");

    expect(debugResult).toBe(false);
    expect(infoResult).toBe(false);
    expect(warnResult).toBe(true);
    expect(errorResult).toBe(true);

    const content = await readLogFile();

    expect(content).not.toContain("DEBUG_EVENT");
    expect(content).not.toContain("INFO_EVENT");
    expect(content).toContain("[WARN] [WARN_EVENT] warn");
    expect(content).toContain("[ERROR] [ERROR_EVENT] error");
  });

  test("respeta nivel ERROR", async () => {
    LoggingService.level = "ERROR";

    await LoggingService.debug("DEBUG_EVENT", "debug");
    await LoggingService.info("INFO_EVENT", "info");
    await LoggingService.warn("WARN_EVENT", "warn");
    await LoggingService.error("ERROR_EVENT", "error");

    const content = await readLogFile();

    expect(content).not.toContain("DEBUG_EVENT");
    expect(content).not.toContain("INFO_EVENT");
    expect(content).not.toContain("WARN_EVENT");
    expect(content).toContain("[ERROR] [ERROR_EVENT] error");
  });

  test("no escribe nada con nivel OFF", async () => {
    LoggingService.level = "OFF";

    const result = await LoggingService.error("ERROR_EVENT", "error");

    expect(result).toBe(false);

    await expect(fs.readFile(logFilePath, "utf8")).rejects.toThrow();
  });

  test("escribe en consola si consoleEnabled está activo", async () => {
    LoggingService.consoleEnabled = true;
    LoggingService.fileEnabled = false;

    await LoggingService.info("CONSOLE_EVENT", "mensaje consola");

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("[INFO] [CONSOLE_EVENT] mensaje consola"),
    );
  });

  test("usa console.warn para logs WARN", async () => {
    LoggingService.consoleEnabled = true;
    LoggingService.fileEnabled = false;

    await LoggingService.warn("WARN_EVENT", "warning");

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("[WARN] [WARN_EVENT] warning"),
    );
  });

  test("usa console.error para logs ERROR", async () => {
    LoggingService.consoleEnabled = true;
    LoggingService.fileEnabled = false;

    await LoggingService.error("ERROR_EVENT", "error message");

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[ERROR] [ERROR_EVENT] error message"),
    );
  });

  test("no escribe en archivo si fileEnabled está desactivado", async () => {
    LoggingService.consoleEnabled = false;
    LoggingService.fileEnabled = false;

    await LoggingService.info("NO_FILE_EVENT", "no debería escribirse");

    await expect(fs.readFile(logFilePath, "utf8")).rejects.toThrow();
  });

  test("logSystemStart escribe evento SYSTEM_START", async () => {
    await LoggingService.logSystemStart({ port: 3001 });

    const content = await readLogFile();

    expect(content).toContain("[INFO]");
    expect(content).toContain("[SYSTEM_START]");
    expect(content).toContain("Servidor activo en puerto 3001");
  });

  test("logIncomingAnalyzeRequest escribe evento REQUEST_RECEIVED", async () => {
    await LoggingService.logIncomingAnalyzeRequest({
      url: "https://example.com",
    });

    const content = await readLogFile();

    expect(content).toContain("[INFO]");
    expect(content).toContain("[REQUEST_RECEIVED]");
    expect(content).toContain("URL recibida: https://example.com");
  });

  test("logRobotRequest escribe evento ROBOT_REQUEST_SENT", async () => {
    await LoggingService.logRobotRequest({
      url: "https://example.com",
    });

    const content = await readLogFile();

    expect(content).toContain("[INFO]");
    expect(content).toContain("[ROBOT_REQUEST_SENT]");
    expect(content).toContain("Analizando URL: https://example.com");
  });

  test("logRobotResponse escribe evento ROBOT_RESPONSE_RECEIVED", async () => {
    await LoggingService.logRobotResponse({
      url: "https://example.com",
      statusCode: 200,
    });

    const content = await readLogFile();

    expect(content).toContain("[INFO]");
    expect(content).toContain("[ROBOT_RESPONSE_RECEIVED]");
    expect(content).toContain(
      "Análisis finalizado. URL: https://example.com. Status: 200",
    );
  });

  test("sanitiza saltos de línea en el mensaje", async () => {
    await LoggingService.info("MULTILINE_EVENT", "línea 1\nlínea 2\tlínea 3");

    const content = await readLogFile();

    expect(content).toContain("línea 1 línea 2 línea 3");
  });
});
