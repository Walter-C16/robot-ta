/**
 * STUB.
 *
 * Luego se implementa con Cheerio:
 * - identity
 * - links
 * - counts
 * - visibleText
 */
class HtmlParser {
  parse(html, baseUrl, options = {}) {
    return {
      identity: {
        title: "Example Site",
        description: "Example description",
      },
      links: [`${baseUrl}/contact`, `${baseUrl}/about`],
      linkCount: 2,
      imageCount: 1,
      paragraphCount: 2,
      wordCount: 12,
      visibleText: "example service example target analyzer",
    };
  }
}

module.exports = HtmlParser;
