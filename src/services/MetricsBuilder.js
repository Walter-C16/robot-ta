/**
 * Construye el bloque de métricas finales del análisis.
 *
 * Este servicio no calcula todo desde cero.
 * Su responsabilidad es centralizar y ordenar métricas que vienen de:
 *
 * - PageLoader: tiempo de respuesta, tamaño del documento, SSL.
 * - HtmlParser: links, imágenes, párrafos, palabras.
 * - TopWordsAnalyzer: palabras más frecuentes.
 * - CookieAnalyzer: métricas agregadas de cookies.
 */
class MetricsBuilder {
  /**
   * Arma el objeto metrics que se devuelve en el response final.
   *
   * @param {Object} params
   * @param {Object} params.pageData Datos obtenidos al cargar la página.
   * @param {Object} params.parsed Datos extraídos del HTML.
   * @param {Array} params.topWords Ranking de palabras más frecuentes.
   * @param {Object} params.cookieMetrics Métricas agregadas de cookies.
   * @returns {Object}
   */
  build({ pageData, parsed, topWords, cookieMetrics = {} }) {
    return {
      responseTimeMs: pageData.responseTimeMs,
      documentSizeKb: pageData.documentSizeKb,
      sslValid: pageData.sslValid,

      linkCount: parsed.linkCount,
      imageCount: parsed.imageCount,
      paragraphCount: parsed.paragraphCount,
      wordCount: parsed.wordCount,

      topWords,

      cookies: cookieMetrics,
    };
  }
}

module.exports = MetricsBuilder;
