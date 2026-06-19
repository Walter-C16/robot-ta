/**
 * STUB.
 *
 * Luego se implementa con escritura real en disco:
 * - archivo .txt
 * - nombre: registro_bunker.txt
 * - timestamp
 * - tipo de evento
 * - mensaje
 */
class LoggingService {
  constructor({ logsDir, logFileName }) {
    this.logsDir = logsDir;
    this.logFileName = logFileName;
  }

  async logSystemStart({ port }) {
    return {
      logged: true,
      event: "SYSTEM_START",
      port
    };
  }

  async logIncomingAnalyzeRequest({ url }) {
    return {
      logged: true,
      event: "REQUEST_RECEIVED",
      url
    };
  }

  async logRobotRequest({ url }) {
    return {
      logged: true,
      event: "ROBOT_REQUEST_SENT",
      url
    };
  }

  async logRobotResponse({ url, statusCode }) {
    return {
      logged: true,
      event: "ROBOT_RESPONSE_RECEIVED",
      url,
      statusCode
    };
  }

  async logError(error) {
    return {
      logged: true,
      event: "ERROR",
      message: error.message
    };
  }
}

module.exports = LoggingService;
