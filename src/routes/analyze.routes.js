const express = require("express");
const { validateAnalyzeRequest } = require("../middlewares");

module.exports = function analyzeRoutes({
  analyzerService,
  loggingService,
  config,
}) {
  const router = express.Router();

  router.post(
    "/analyze",
    validateAnalyzeRequest(config),
    async (req, res, next) => {
      try {
        const { url, options } = req.analysisRequest;

        await loggingService.logIncomingAnalyzeRequest({ url });
        await loggingService.logRobotRequest({ url });

        const response = await analyzerService.analyze(url, options);

        await loggingService.logRobotResponse({
          url,
          statusCode: 200,
        });

        return res.status(200).json(response);
      } catch (error) {
        await loggingService.logError(error);
        return next(error);
      }
    },
  );

  return router;
};
