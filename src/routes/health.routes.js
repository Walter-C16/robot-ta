const express = require("express");

/**
 * STUB.
 *
 * Health check mínimo.
 * Luego puede consultar BrowserManager, Puppeteer, disco, etc.
 */
module.exports = function healthRoutes() {
  const router = express.Router();

  router.get("/health", async (req, res) => {
    return res.status(200).json({ status: "UP" });
  });

  return router;
};
