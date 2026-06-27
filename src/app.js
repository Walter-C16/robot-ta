const express = require("express");
const cors = require("cors");

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

function createDefaultDependencies() {
  const browserManager = new BrowserManager();
  const pageLoader = new PageLoader();
  const htmlParser = new HtmlParser();
  const topWordsAnalyzer = new TopWordsAnalyzer();
  const techDetector = new TechDetector();
  const metricsBuilder = new MetricsBuilder();
  const cookieAnalyzer = new CookieAnalyzer();

  const screenshotStorage = new LocalScreenshotStorage({
    baseUrl: config.baseUrl,
  });

  const screenshotService = new ScreenshotService({
    storage: screenshotStorage,
  });

  const loggingService = new LoggingService({
    logsDir: config.logsDir,
    logFileName: config.logFileName,
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
    loggingService,
  });

  return {
    browserManager,
    analyzerService,
    loggingService,
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

  app.use("/api/v1", analyzeRoutes(dependencies));
  app.use("/api/v1", healthRoutes(dependencies));

  app.use(globalErrorHandler);

  return app;
}

module.exports = {
  createApp,
};
