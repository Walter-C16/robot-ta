const cheerio = require("cheerio");

class HtmlParser {
  parse(html, baseUrl, options = {}) {
    const safeHtml = typeof html === "string" ? html : "";
    const linksLimit = options.linksLimit ?? 100;

    const $ = cheerio.load(safeHtml);

    const imageCount = $("img").length;
    const paragraphCount = $("p").length;

    const identity = this._extractIdentity($);
    const links = this._extractLinks($, baseUrl, linksLimit);

    $("script, style, noscript, head, svg").remove();

    const visibleText = $("body").text().replace(/\s+/g, " ").trim();

    const wordCount = visibleText
      .split(/\s+/)
      .filter((word) => word.length > 0).length;

    return {
      identity,
      links,
      linkCount: links.length,
      imageCount,
      paragraphCount,
      wordCount,
      visibleText,
    };
  }

  _extractIdentity($) {
    const title =
      $("title").first().text().trim() ||
      $('meta[property="og:title"]').attr("content")?.trim() ||
      $('meta[name="twitter:title"]').attr("content")?.trim() ||
      "Sin título";

    const description =
      $('meta[name="description"]').attr("content")?.trim() ||
      $('meta[property="og:description"]').attr("content")?.trim() ||
      $('meta[name="twitter:description"]').attr("content")?.trim() ||
      $('meta[property="description"]').attr("content")?.trim() ||
      "Sin descripción";

    return {
      title,
      description,
    };
  }

  _extractLinks($, baseUrl, linksLimit) {
    const seen = new Set();
    const links = [];

    $("a[href]").each((_, el) => {
      const rawHref = $(el).attr("href")?.trim();

      if (!rawHref) return;
      if (rawHref.startsWith("#")) return;
      if (rawHref.toLowerCase().startsWith("javascript:")) return;
      if (rawHref.toLowerCase().startsWith("mailto:")) return;
      if (rawHref.toLowerCase().startsWith("tel:")) return;

      let absoluteUrl;

      try {
        absoluteUrl = new URL(rawHref, baseUrl).href;
      } catch {
        return;
      }

      if (!this._isHttpUrl(absoluteUrl)) return;
      if (seen.has(absoluteUrl)) return;

      seen.add(absoluteUrl);
      links.push(absoluteUrl);
    });

    return links.slice(0, linksLimit);
  }

  _isHttpUrl(url) {
    try {
      const parsedUrl = new URL(url);

      return ["http:", "https:"].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }
}

module.exports = HtmlParser;
