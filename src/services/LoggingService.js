const fs = require("fs/promises");
const path = require("path");

const LOG_LEVELS = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
  OFF: 50,
};

class LoggingService {
  static logsDir = process.env.LOGS_DIR ?? "./logs";
  static fileName = process.env.LOG_FILE_NAME ?? "registro_bunker.txt";
  static level = process.env.LOG_LEVEL ?? "INFO";

  static consoleEnabled = process.env.LOG_CONSOLE_ENABLED !== "false";
  static fileEnabled = process.env.LOG_FILE_ENABLED !== "false";

  static get filePath() {
    return path.resolve(this.logsDir, this.fileName);
  }

  static configure({
    logsDir,
    fileName,
    level,
    consoleEnabled,
    fileEnabled,
  } = {}) {
    if (logsDir !== undefined) this.logsDir = logsDir;
    if (fileName !== undefined) this.fileName = fileName;
    if (level !== undefined) this.level = level;
    if (consoleEnabled !== undefined) this.consoleEnabled = consoleEnabled;
    if (fileEnabled !== undefined) this.fileEnabled = fileEnabled;
  }

  static async debug(event, message) {
    return this._write("DEBUG", event, message);
  }

  static async info(event, message) {
    return this._write("INFO", event, message);
  }

  static async warn(event, message) {
    return this._write("WARN", event, message);
  }

  static async error(event, message) {
    return this._write("ERROR", event, message);
  }

  static async logSystemStart({ port } = {}) {
    return this.info("SYSTEM_START", `Servidor activo en puerto ${port}`);
  }

  static async logIncomingAnalyzeRequest({ url } = {}) {
    return this.info("REQUEST_RECEIVED", `URL recibida: ${url}`);
  }

  static async logRobotRequest({ url } = {}) {
    return this.info("ROBOT_REQUEST_SENT", `Analizando URL: ${url}`);
  }

  static async logRobotResponse({ url, statusCode } = {}) {
    return this.info(
      "ROBOT_RESPONSE_RECEIVED",
      `Análisis finalizado. URL: ${url}. Status: ${statusCode}`,
    );
  }

  static async logError(error, event = "ERROR") {
    const message = error?.stack || error?.message || String(error);

    return this.error(event, message);
  }

  static async _write(level, event, message) {
    if (!this._shouldLog(level)) return false;

    const line = this._formatLine(level, event, message);

    let written = false;

    if (this.consoleEnabled) {
      this._writeToConsole(level, line);
      written = true;
    }

    if (this.fileEnabled) {
      const fileWritten = await this._writeToFile(line);
      written = written || fileWritten;
    }

    return written;
  }

  static _writeToConsole(level, line) {
    const cleanLine = line.trim();

    if (level === "ERROR") {
      console.error(cleanLine);
      return;
    }

    if (level === "WARN") {
      console.warn(cleanLine);
      return;
    }

    console.log(cleanLine);
  }

  static async _writeToFile(line) {
    try {
      await fs.mkdir(this.logsDir, { recursive: true });
      await fs.appendFile(this.filePath, line, "utf8");

      return true;
    } catch {
      return false;
    }
  }

  static _shouldLog(messageLevel) {
    const configuredLevel = String(this.level).toUpperCase();
    const currentLevelValue = LOG_LEVELS[configuredLevel] ?? LOG_LEVELS.INFO;
    const messageLevelValue = LOG_LEVELS[messageLevel] ?? LOG_LEVELS.INFO;

    return messageLevelValue >= currentLevelValue;
  }

  static _formatLine(level, event, message) {
    const timestamp = this._getTimestamp();
    const safeLevel = this._sanitize(level || "INFO");
    const safeEvent = this._sanitize(event || "UNKNOWN");
    const safeMessage = this._sanitizeMessage(message || "");

    return `[${timestamp}] [${safeLevel}] [${safeEvent}] ${safeMessage}\n`;
  }

  static _getTimestamp() {
    const now = new Date();

    const year = now.getFullYear();
    const month = this._pad(now.getMonth() + 1);
    const day = this._pad(now.getDate());
    const hours = this._pad(now.getHours());
    const minutes = this._pad(now.getMinutes());
    const seconds = this._pad(now.getSeconds());

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  static _pad(value) {
    return String(value).padStart(2, "0");
  }

  static _sanitize(value) {
    return String(value).replace(/\s+/g, " ").trim();
  }

  static _sanitizeMessage(value) {
    return String(value).replace(/\s+/g, " ").trim();
  }
}

module.exports = LoggingService;
