import * as cheerio from "cheerio";
import { ScrapedArticle, classifyThemes, fetchHTML, parseRSS } from "./base";

const RSS_URLS = [
  "https://www.conseil-etat.fr/rss/decisions",
  "https://www.conseil-etat.fr/rss",
  "https://conseil-etat.fr/ressources/actualites/rss",
];

const LISTING_URL =
  "https://www.conseil-etat.fr/decisions-avis-publications/decisions/les-decisions-de-la-semaine";

export async function scrapeConseilEtat(): Promise<ScrapedArticle[]> {
  // Try RSS first
  for (const rssUrl of RSS_URLS) {
    try {
      const articles = await parseRSS(rssUrl);
      if (articles.length > 0) return articles;
    } catch {
      // Try next
    }
  }

  // Fallback: scrape listing
  try {
    const html = await fetchHTML(LISTING_URL);
    const $ = cheerio.load(html);
    const articles: ScrapedArticle[] = [];

    $("article, .decision-item, .result-item, .views-row").each((_, el) => {
      const titleEl = $(el).find("h2 a, h3 a, .title a").first();
      const title = titleEl.text().trim();
      const url = titleEl.attr("href") ?? "";
      const dateStr =
        $(el).find("time, .date, .field-date").attr("datetime") ??
        $(el).find("time, .date, .field-date").text().trim();
      const summary = $(el).find("p, .summary, .body").first().text().trim();

      if (title && url) {
        const fullUrl = url.startsWith("http")
          ? url
          : `https://www.conseil-etat.fr${url}`;
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
