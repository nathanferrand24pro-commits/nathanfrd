import * as cheerio from "cheerio";
import { ScrapedArticle, classifyThemes, fetchHTML, parseRSS } from "./base";

const RSS_CANDIDATES = [
  "https://www.capstan.fr/feed/",
  "https://www.capstan.fr/actualites/feed/",
  "https://www.capstan.fr/rss",
];

const LISTING_URL = "https://www.capstan.fr/actualites/";

export async function scrapeCapstan(): Promise<ScrapedArticle[]> {
  for (const rssUrl of RSS_CANDIDATES) {
    try {
      const articles = await parseRSS(rssUrl);
      if (articles.length > 0) return articles;
    } catch {
      // Try next
    }
  }

  try {
    const html = await fetchHTML(LISTING_URL);
    const $ = cheerio.load(html);
    const articles: ScrapedArticle[] = [];

    $("article, .actualite, .post, .news-item, .card").each((_, el) => {
      const titleEl = $(el).find("h2 a, h3 a, .title a, .card-title a").first();
      const title = titleEl.text().trim();
      const url = titleEl.attr("href") ?? "";
      const dateStr =
        $(el).find("time").attr("datetime") ??
        $(el).find(".date, .card-date, .entry-date").text().trim();
      const summary = $(el)
        .find("p, .card-text, .excerpt")
        .first()
        .text()
        .trim();

      if (title && url) {
        const fullUrl = url.startsWith("http")
          ? url
          : `https://www.capstan.fr${url}`;
        articles.push({
          externalId: fullUrl,
          title,
          summary: summary.slice(0, 500),
          url: fullUrl,
          publishedAt: new Date(dateStr) || new Date(),
          categories: classifyThemes(title + " " + summary),
        });
      }
    });

    return articles;
  } catch {
    return [];
  }
}
