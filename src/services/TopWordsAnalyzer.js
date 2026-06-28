const DEFAULT_LIMIT = 10;
const MIN_WORD_LENGTH = 3;

/**
 * Lista de palabras comunes que no aportan demasiado valor al análisis.
 * Se eliminan para que el ranking muestre palabras más representativas
 * del contenido real del sitio.
 */
const STOP_WORDS = new Set([
  // Español
  "que",
  "con",
  "por",
  "para",
  "una",
  "uno",
  "unos",
  "unas",
  "del",
  "las",
  "los",
  "les",
  "este",
  "esta",
  "estos",
  "estas",
  "como",
  "pero",
  "mas",
  "más",
  "sus",
  "sin",
  "sobre",
  "entre",
  "desde",
  "hasta",
  "tambien",
  "también",
  "donde",
  "cuando",
  "porque",
  "muy",
  "hay",
  "son",
  "ser",
  "fue",
  "han",
  "era",
  "ese",
  "esa",
  "eso",
  "aqui",
  "aquí",
  "alli",
  "allí",
  "todo",
  "toda",
  "todos",
  "todas",
  "cada",
  "puede",
  "pueden",
  "debe",
  "deben",
  "hacer",
  "ver",

  // Artículos y preposiciones frecuentes
  "el",
  "la",
  "lo",
  "al",
  "de",
  "en",
  "un",
  "y",
  "o",
  "u",
  "a",
  "e",

  // Inglés
  "the",
  "and",
  "for",
  "with",
  "from",
  "this",
  "that",
  "these",
  "those",
  "you",
  "your",
  "are",
  "was",
  "were",
  "have",
  "has",
  "had",
  "not",
  "but",
  "can",
  "will",
  "would",
  "there",
  "their",
  "about",
  "into",
  "than",
  "then",
]);

class TopWordsAnalyzer {
  /**
   * Recibe el texto visible de una página y devuelve las palabras
   * más frecuentes, ordenadas por cantidad de apariciones.
   *
   * @param {string} text Texto visible extraído del HTML.
   * @param {number} limit Cantidad máxima de palabras a devolver.
   * @returns {Array<{ word: string, frequency: number }>}
   */
  getTopWords(text, limit = DEFAULT_LIMIT) {
    const safeText = typeof text === "string" ? text : "";
    const safeLimit = this._normalizeLimit(limit);

    // Si no hay texto o el límite es 0, no hay nada que analizar.
    if (!safeText.trim() || safeLimit === 0) {
      return [];
    }

    // Convertimos el texto en palabras limpias y filtradas.
    const words = this._tokenize(safeText);

    // Contamos cuántas veces aparece cada palabra.
    const frequencies = this._countFrequencies(words);

    // Convertimos el Map a array, ordenamos y limitamos el resultado.
    return Array.from(frequencies.entries())
      .map(([word, frequency]) => ({
        word,
        frequency,
      }))
      .sort((a, b) => {
        // Primero ordenamos por frecuencia descendente.
        if (b.frequency !== a.frequency) {
          return b.frequency - a.frequency;
        }

        // Si dos palabras tienen la misma frecuencia,
        // ordenamos alfabéticamente para que el resultado sea estable.
        return a.word.localeCompare(b.word);
      })
      .slice(0, safeLimit);
  }

  /**
   * Normaliza el texto:
   * - pasa todo a minúsculas
   * - elimina acentos
   * - elimina signos y caracteres raros
   * - separa por espacios
   * - descarta palabras no útiles
   */
  _tokenize(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9ñ\s]/gi, " ")
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => this._isValidWord(word));
  }

  /**
   * Define si una palabra sirve para el ranking.
   */
  _isValidWord(word) {
    if (!word) return false;

    // Evitamos palabras muy cortas como "de", "la", "en", etc.
    if (word.length < MIN_WORD_LENGTH) return false;

    // Evitamos números puros como "2024" o "123".
    if (/^\d+$/.test(word)) return false;

    // Evitamos palabras comunes que no aportan significado.
    if (STOP_WORDS.has(word)) return false;

    return true;
  }

  /**
   * Cuenta la frecuencia de cada palabra usando un Map.
   */
  _countFrequencies(words) {
    const frequencies = new Map();

    words.forEach((word) => {
      const current = frequencies.get(word) ?? 0;
      frequencies.set(word, current + 1);
    });

    return frequencies;
  }

  /**
   * Valida el límite recibido.
   * Si no es un número entero, usa el valor por defecto.
   */
  _normalizeLimit(limit) {
    if (!Number.isInteger(limit)) {
      return DEFAULT_LIMIT;
    }

    if (limit < 0) {
      return 0;
    }

    return limit;
  }
}

module.exports = TopWordsAnalyzer;
