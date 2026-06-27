const { BadRequestError } = require("./errors");
const config = require("./config");

/**
 * STUB.
 *
 * Este middleware queda preparado para que luego se implemente validación real:
 * - validar url [x]
 * - validar topWordsLimit [x]
 * - validar linksLimit [x]
 * - aplicar defaults [x]
 * - aplicar máximos [x]
 *
 * Por ahora solo arma req.analysisRequest para que el router y AnalyzerService funcionen.
 */
function validateAnalyzeRequest(conf) {
  return (req, res, next) => {
    const { url, options = {} } = req.body || {};

    console.log(config.defaultTopWordsLimit);
    console.log(config.maxTopWordsLimit);
    console.log(config.defaultLinksLimit);
    console.log(config.maxLinksLimit);

    // devolver error si no se envía ninguna URL
    if (url === undefined) throw new BadRequestError("URL not provided");

    // validar url
    if (typeof url !== "string")
      throw new BadRequestError("URL must be a string");
    if (!validateUrl(url)) throw new BadRequestError("URL must be a valid URL");

    // validar topWordsLimit y linksLimit si existen
    if (options.topWordsLimit !== undefined) {
      if (typeof options.topWordsLimit !== "number")
        throw new BadRequestError("topWordsLimit must be a positive integer");
      if (options.topWordsLimit < 1)
        throw new BadRequestError("topWordsLimit must be a positive integer");
    }
    if (options.linksLimit !== undefined) {
      if (typeof options.linksLimit !== "number")
        throw new BadRequestError("linksLimit must be a positive integer");
      if (options.linksLimit < 1)
        throw new BadRequestError("linksLimit must be a positive integer");
    }

    // aplicar valores por defecto
    options.topWordsLimit =
      options.topWordsLimit || config.defaultTopWordsLimit;
    options.linksLimit = options.linksLimit || config.defaultLinksLimit;

    // aplicar máximos
    options.topWordsLimit = Math.min(
      options.topWordsLimit,
      config.maxTopWordsLimit,
    );
    options.linksLimit = Math.min(options.linksLimit, config.maxLinksLimit);

    console.log(JSON.stringify({ url, options }));

    // armar req.analysisRequest para el router y AnalyzerService
    req.analysisRequest = {
      url,
      options,
    };

    return next();
  };
}

// función utilitaria para validar la URL
function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * STUB.
 *
 * Error handler mínimo para que Express no rompa.
 * Luego se puede ampliar con manejo de 400, 422, 500, 503 y 504.
 */
function globalErrorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  console.log(error);

  return res.status(statusCode).json({
    error: error.statusCode ? error.message : "Internal server error",
  });
}

module.exports = {
  validateAnalyzeRequest,
  globalErrorHandler,
};
