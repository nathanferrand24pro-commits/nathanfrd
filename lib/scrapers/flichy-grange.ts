import * as cheerio from "cheerio";
import { ScrapedArticle, classifyThemes, fetchHTML, parseRSS } from "./base";

const RSS_CANDIDATES = [
  "https://www.flichygrange.com/feed/",
  "https://www.flichygrange.com/feed/rss2/",
  "https://www.flichygrange.com/publications/feed/",
];

const LISTING_URL = "https://www.flichygrange.com/publications/";

export async function scrapeFlichyGrange(): Promise<ScrapedArticle[]> {
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

    $("article, .publication-item, .post, .entry").each((_, el) => {
      const titleEl = $(el).find("h2 a, h3 a, .entry-title a, .title a").first();
      const title = titleEl.text().trim();
      const url = titleEl.attr("href") ?? "";
      const dateStr =
        $(el).find("time").attr("datetime") ??
        $(el).find(".entry-date, .date, .published").text().trim();
      const summary = $(el)
        .find(".entry-summary, .excerpt, p")
        .first()
        .text()
        .trim();

      if (title && url) {
        const fullUrl = url.startsWith("http")
          ? url
          : `https://www.flichygrange.com${url}`;
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
