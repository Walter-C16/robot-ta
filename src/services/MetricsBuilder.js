/**
 * STUB.
 *
 * Luego puede validar o enriquecer métricas.
 * Por ahora solo junta datos que vienen de PageLoader, HtmlParser y TopWordsAnalyzer.
 */
class MetricsBuilder {
  build({ pageData, parsed, topWords }) {
    return {
      responseTimeMs: pageData.responseTimeMs,
      documentSizeKb: pageData.documentSizeKb,
      sslValid: pageData.sslValid,
      linkCount: parsed.linkCount,
      imageCount: parsed.imageCount,
      paragraphCount: parsed.paragraphCount,
      wordCount: parsed.wordCount,
      topWords
    };
  }
}

module.exports = MetricsBuilder;
