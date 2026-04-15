import * as cheerio from "cheerio";
import { ScrapedArticle, classifyThemes, fetchHTML, parseRSS } from "./base";

const RSS_CANDIDATES = [
  "https://www.barthelemy-avocats.com/feed/",
  "https://www.barthelemy-avocats.com/actualites/feed/",
  "https://www.barthelemy-avocats.com/rss",
];

const LISTING_URL = "https://www.barthelemy-avocats.com/nos-actualites/";

export async function scrapeBarthelemy(): Promise<ScrapedArticle[]> {
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
      const titleEl = $(el).find("h2 a, h3 a, .entry-title a, .title a").first();
      const title = titleEl.text().trim();
      const url = titleEl.attr("href") ?? "";
      const dateStr =
        $(el).find("time").attr("datetime") ??
        $(el).find(".date, .entry-date, .published").text().trim();
      const summary = $(el)
        .find("p, .entry-summary, .excerpt")
        .first()
        .text()
        .trim();

      if (title && url) {
        const fullUrl = url.startsWith("http")
          ? url
          : `https://www.barthelemy-avocats.com${url}`;
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
