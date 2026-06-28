const express = require("express");
const cors = require("cors");
const path = require("path");

const config = require("./config");
const { globalErrorHandler } = require("./middlewares");

const AnalyzerService = require("./services/AnalyzerService");
const BrowserManager = require("./services/BrowserManager");
const PageLoader = require("./services/PageLoader");
const HtmlParser = require("./services/HtmlParser");
const TopWordsAnalyzer = require("./services/TopWordsAnalyzer");
const TechDetector = require("./services/TechDetector");
const CookieAnalyzer = require("./services/CookieAnalyzer");
const MetricsBuilder = require("./services/MetricsBuilder");
const ScreenshotService = require("./services/ScreenshotService");
const LocalScreenshotStorage = require("./services/LocalScreenshotStorage");
const LoggingService = require("./services/LoggingService");

const analyzeRoutes = require("./routes/analyze.routes");
const healthRoutes = require("./routes/health.routes");
const screenshotsRoutes = require("./routes/screenshots.routes");

function createDefaultDependencies() {
  const browserManager = BrowserManager.getInstance();

  const pageLoader = new PageLoader();
  const htmlParser = new HtmlParser();
  const topWordsAnalyzer = new TopWordsAnalyzer();
  const techDetector = new TechDetector();
  const cookieAnalyzer = new CookieAnalyzer();
  const metricsBuilder = new MetricsBuilder();

  LoggingService.configure({
    logsDir: config.logsDir,
    fileName: config.logFileName,
    level: config.logLevel,
  });

  const screenshotStorage = new LocalScreenshotStorage({
    screenshotsDir: config.screenshotsDir,
    baseUrl: config.baseUrl,
  });

  const screenshotService = new ScreenshotService({
    storage: screenshotStorage,
  });

  const analyzerService = new AnalyzerService({
    browserManager,
    pageLoader,
    screenshotService,
    htmlParser,
    topWordsAnalyzer,
    techDetector,
    cookieAnalyzer,
    metricsBuilder,
  });

  return {
    browserManager,
    analyzerService,
  };
}

function createApp(overrides = {}) {
  const dependencies = {
    ...createDefaultDependencies(),
    ...overrides,
    config,
  };

  const app = express();

  app.locals.dependencies = dependencies;

  app.use(cors());
  app.use(express.json());

  app.use(screenshotsRoutes(dependencies));

  app.use("/api/v1", analyzeRoutes(dependencies));
  app.use("/api/v1", healthRoutes(dependencies));

  app.use(globalErrorHandler);

  return app;
}

module.exports = {
  createApp,
};
