/**
 * STUB.
 *
 * Luego se implementa con lógica real:
 * - tokenizar
 * - limpiar signos
 * - stopwords
 * - contar frecuencia
 * - aplicar limit
 */
class TopWordsAnalyzer {
  getTopWords(text, limit = 10) {
    return [
      { word: "example", frequency: 2 },
      { word: "service", frequency: 1 },
      { word: "target", frequency: 1 }
    ];
  }
}

module.exports = TopWordsAnalyzer;
