const express = require("express");
const path = require("path");

/**
 * Ruta para exponer screenshots guardadas localmente.
 *
 * Las imágenes se guardan en SCREENSHOTS_DIR y se sirven desde:
 *
 * GET /screenshots/:filename
 */
module.exports = function screenshotsRoutes({ config }) {
  const router = express.Router();

  const screenshotsDir = path.resolve(config.screenshotsDir);

  router.use("/screenshots", express.static(screenshotsDir));

  return router;
};
