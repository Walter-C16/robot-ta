/**
 * STUB.
 *
 * Luego se implementa con reglas reales usando:
 * - html
 * - headers
 * - finalUrl
 */
class TechDetector {
  async detect({ html, headers, finalUrl } = {}) {
    return {
      server: "cloudflare",
      language: "HTML Estático / Desconocido",
      frontendFramework: "React",
      detected: ["React", "Cloudflare", "Google Analytics"],
    };
  }
}

module.exports = TechDetector;
