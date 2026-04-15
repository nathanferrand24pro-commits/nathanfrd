import * as cheerio from "cheerio";
import { ScrapedArticle, classifyThemes, fetchHTML, parseRSS } from "./base";

const RSS_CANDIDATES = [
  "https://www.fromont-briens.com/feed/",
  "https://www.fromont-briens.com/actualites/feed/",
  "https://www.fromont-briens.com/rss",
];

const LISTING_URL = "https://www.fromont-briens.com/actualites/";

export async function scrapeFromontBriens(): Promise<ScrapedArticle[]> {
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

    $("article, .actualite-item, .post, .news-item").each((_, el) => {
      const titleEl = $(el).find("h2 a, h3 a, .title a").first();
      const title = titleEl.text().trim();
      const url = titleEl.attr("href") ?? "";
      const dateStr =
        $(el).find("time").attr("datetime") ??
        $(el).find(".date, .published, .entry-date").text().trim();
      const summary = $(el).find("p, .excerpt, .summary").first().text().trim();

      if (title && url) {
        const fullUrl = url.startsWith("http")
          ? url
          : `https://www.fromont-briens.com${url}`;
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
