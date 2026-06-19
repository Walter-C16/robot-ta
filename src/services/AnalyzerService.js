const { v4: uuid } = require("uuid");

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
    metricsBuilder,
    loggingService
  }) {
    this.browserManager = browserManager;
    this.pageLoader = pageLoader;
    this.screenshotService = screenshotService;
    this.htmlParser = htmlParser;
    this.topWordsAnalyzer = topWordsAnalyzer;
    this.techDetector = techDetector;
    this.metricsBuilder = metricsBuilder;
    this.loggingService = loggingService;
  }

  async analyze(url, options = {}) {
    const scanId = uuid();
    const page = await this.browserManager.getPage();

    try {
      const pageData = await this.pageLoader.load(page, url);

      const screenshots = await this.screenshotService.capture(page, scanId);

      const parsed = this.htmlParser.parse(
        pageData.html,
        pageData.finalUrl,
        options
      );

      const topWords = this.topWordsAnalyzer.getTopWords(
        parsed.visibleText,
        options.topWordsLimit
      );

      const technologies = await this.techDetector.detect(pageData);

      const metrics = this.metricsBuilder.build({
        pageData,
        parsed,
        topWords
      });

      return {
        url: pageData.finalUrl,
        identity: parsed.identity,
        screenshots,
        links: parsed.links,
        technologies,
        metrics
      };
    } finally {
      await this.browserManager.closePage(page);
    }
  }
}

module.exports = AnalyzerService;
