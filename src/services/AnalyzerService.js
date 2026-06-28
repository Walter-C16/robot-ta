const { v4: uuid } = require("uuid");

/**
 * Coordina el análisis completo y arma el response final.
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
  }) {
    this.browserManager = browserManager;
    this.pageLoader = pageLoader;
    this.screenshotService = screenshotService;
    this.htmlParser = htmlParser;
    this.topWordsAnalyzer = topWordsAnalyzer;
    this.techDetector = techDetector;
    this.cookieAnalyzer = cookieAnalyzer;
    this.metricsBuilder = metricsBuilder;
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
    } finally {
      await this.browserManager.releasePage(page);
    }
  }
}

module.exports = AnalyzerService;
