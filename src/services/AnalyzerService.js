const { v4: uuid } = require("uuid");
const LoggingService = require("./LoggingService");

/**
 * Este es el único servicio con lógica de integración real.
 * Su responsabilidad es coordinar todos los servicios y armar él response final.
 */
class AnalyzerService {
  constructor({
    browserManager,
    pageLoader,
    screenshotService,
    htmlParser,
    topWordsAnalyzer,
    techDetector,
    cookieAnalyzer,
    metricsBuilder,
    loggingService,
  }) {
    this.browserManager = browserManager;
    this.pageLoader = pageLoader;
    this.screenshotService = screenshotService;
    this.htmlParser = htmlParser;
    this.topWordsAnalyzer = topWordsAnalyzer;
    this.techDetector = techDetector;
    this.cookieAnalyzer = cookieAnalyzer;
    this.metricsBuilder = metricsBuilder;
    this.loggingService = loggingService;
  }

  async analyze(url, options = {}) {
    const scanId = uuid();
    const page = await this.browserManager.acquirePage();

    try {
      const pageData = await this.pageLoader.load(page, url);

      const screenshots = await this.screenshotService.capture(page, scanId);

      const parsed = this.htmlParser.parse(
        pageData.html,
        pageData.finalUrl,
        options,
      );

      const topWords = this.topWordsAnalyzer.getTopWords(
        parsed.visibleText,
        options.topWordsLimit,
      );

      const technologies = await this.techDetector.detect(pageData);

      const cookieMetrics = this.cookieAnalyzer.analyze(
        pageData.cookies,
        pageData.finalUrl,
      );

      const metrics = this.metricsBuilder.build({
        pageData,
        parsed,
        topWords,
        cookieMetrics,
      });

      return {
        url: pageData.finalUrl,
        identity: parsed.identity,
        screenshots,
        links: parsed.links,
        technologies,
        metrics,
      };
    } catch (error) {
      await LoggingService.error("ANALYZER_SERVICE", error);
      throw error;
    } finally {
      await this.browserManager.releasePage(page);
    }
  }
}

module.exports = AnalyzerService;
