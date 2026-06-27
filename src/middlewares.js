const { BadRequestError } = require("./errors");
const defaultConfig = require("./config");
const LoggingService = require("./services/LoggingService");

function validateAnalyzeRequest(conf = defaultConfig) {
  return (req, res, next) => {
    try {
      const body = req.body || {};
      const { url } = body;
      const options = body.options ?? {};

      if (url === undefined) {
        throw new BadRequestError("URL not provided");
      }

      if (typeof url !== "string") {
        throw new BadRequestError("URL must be a string");
      }

      const normalizedUrl = normalizeUrl(url);

      if (!isPlainObject(options)) {
        throw new BadRequestError("options must be an object");
      }

      const topWordsLimit = normalizePositiveIntegerOption({
        name: "topWordsLimit",
        value: options.topWordsLimit,
        defaultValue: conf.defaultTopWordsLimit,
        maxValue: conf.maxTopWordsLimit,
      });

      const linksLimit = normalizePositiveIntegerOption({
        name: "linksLimit",
        value: options.linksLimit,
        defaultValue: conf.defaultLinksLimit,
        maxValue: conf.maxLinksLimit,
      });

      const normalizedOptions = {
        topWordsLimit,
        linksLimit,
      };

      req.analysisRequest = {
        url: normalizedUrl,
        options: normalizedOptions,
      };

      void LoggingService.logIncomingAnalyzeRequest({
        url: normalizedUrl,
      });

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

function normalizeUrl(url) {
  const trimmedUrl = url.trim();

  let parsedUrl;

  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    throw new BadRequestError("URL must be a valid URL");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new BadRequestError("URL protocol must be http or https");
  }

  return parsedUrl.toString();
}

function normalizePositiveIntegerOption({
  name,
  value,
  defaultValue,
  maxValue,
}) {
  if (value === undefined) {
    return defaultValue;
  }

  if (!Number.isInteger(value) || value < 1) {
    throw new BadRequestError(`${name} must be a positive integer`);
  }

  return Math.min(value, maxValue);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function globalErrorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  const responseMessage = error.statusCode
    ? error.message
    : "Internal server error";

  if (statusCode >= 500) {
    void LoggingService.error("ERROR_RESPONSE", error);
  } else {
    void LoggingService.warn("REQUEST_FAILED", error.message);
  }

  void LoggingService.logRobotResponse({
    url:
      req.analysisRequest?.url || req.body?.url || req.originalUrl || req.url,
    statusCode,
  });

  return res.status(statusCode).json({
    error: responseMessage,
  });
}

module.exports = {
  validateAnalyzeRequest,
  globalErrorHandler,
};
