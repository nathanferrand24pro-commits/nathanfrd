import * as cheerio from "cheerio";
import { ScrapedArticle, classifyThemes, fetchHTML, parseRSS } from "./base";

const RSS_CANDIDATES = [
  "https://cms.law/fr/fra/rss",
  "https://cms.law/fr/fra/news-information/feed",
  "https://cms.law/rss/fr",
];

const LISTING_URL =
  "https://cms.law/fr/fra/news-information?practice-area=employment-pensions";

export async function scrapeCmsLefebvre(): Promise<ScrapedArticle[]> {
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

    $("article, .insight-item, .publication-item, .news-item, .card").each(
      (_, el) => {
        const titleEl = $(el).find("h2 a, h3 a, .title a, .card-title a").first();
        const title = titleEl.text().trim();
        const url = titleEl.attr("href") ?? "";
        const dateStr =
          $(el).find("time").attr("datetime") ??
          $(el).find(".date, .published, .meta-date").text().trim();
        const summary = $(el)
          .find("p, .summary, .teaser")
          .first()
          .text()
          .trim();

        if (title && url) {
          const fullUrl = url.startsWith("http") ? url : `https://cms.law${url}`;
          articles.push({
            externalId: fullUrl,
            title,
            summary: summary.slice(0, 500),
            url: fullUrl,
            publishedAt: new Date(dateStr) || new Date(),
            categories: classifyThemes(title + " " + summary),
          });
        }
      }
    );

    return articles;
  } catch {
    return [];
  }
}
