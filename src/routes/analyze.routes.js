const express = require("express");
const { validateAnalyzeRequest } = require("../middlewares");
const LoggingService = require("../services/LoggingService");

module.exports = function analyzeRoutes({ analyzerService, config }) {
  const router = express.Router();

  router.post(
    "/analyze",
    validateAnalyzeRequest(config),
    async (req, res, next) => {
      try {
        const { url, options } = req.analysisRequest;

        await LoggingService.logIncomingAnalyzeRequest({ url });
        await LoggingService.logRobotRequest({ url });

        const response = await analyzerService.analyze(url, options);

        await LoggingService.logRobotResponse({
          url,
          statusCode: 200,
        });

        return res.status(200).json(response);
      } catch (error) {
        await LoggingService.error("ANALYZE", error);
        return next(error);
      }
    },
  );

  return router;
};
