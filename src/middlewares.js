/**
 * STUB.
 *
 * Este middleware queda preparado para que luego se implemente validación real:
 * - validar url
 * - validar topWordsLimit
 * - validar linksLimit
 * - aplicar defaults
 * - aplicar máximos
 *
 * Por ahora solo arma req.analysisRequest para que el router y AnalyzerService funcionen.
 */
function validateAnalyzeRequest(config) {
  return (req, res, next) => {
    const { url, options = {} } = req.body || {};

    req.analysisRequest = {
      url,
      options
    };

    return next();
  };
}

/**
 * STUB.
 *
 * Error handler mínimo para que Express no rompa.
 * Luego se puede ampliar con manejo de 400, 422, 500, 503 y 504.
 */
function globalErrorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    error: error.statusCode ? error.message : "Internal server error"
  });
}

module.exports = {
  validateAnalyzeRequest,
  globalErrorHandler
};
