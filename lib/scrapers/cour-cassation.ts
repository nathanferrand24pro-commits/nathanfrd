import * as cheerio from "cheerio";
import { ScrapedArticle, classifyThemes, fetchHTML, parseRSS } from "./base";

const RSS_URLS = [
  "https://www.courdecassation.fr/recherche-jurisprudence/rss/chambre-sociale",
  "https://www.courdecassation.fr/rss/arrets/chambre-sociale",
  "https://www.courdecassation.fr/rss",
];

const LISTING_URL =
  "https://www.courdecassation.fr/recherche-jurisprudence?formation=CC_CHAMBRE_SOCIALE&sort=date_desc";

export async function scrapeCourdeCassation(): Promise<ScrapedArticle[]> {
  // Try RSS feeds first
  for (const rssUrl of RSS_URLS) {
    try {
      const articles = await parseRSS(rssUrl);
      if (articles.length > 0) {
        return articles.map((a) => ({
          ...a,
          categories:
            a.categories.length > 0
              ? a.categories
              : ["procedure-prudhomale"],
        }));
      }
    } catch {
      // Try next
    }
  }

  // Fallback: scrape Judilibre search page
  try {
    const html = await fetchHTML(LISTING_URL);
    const $ = cheerio.load(html);
    const articles: ScrapedArticle[] = [];

    $(".result-item, .search-result, article.decision, .jurisprudence-item").each(
      (_, el) => {
        const titleEl = $(el).find("h2 a, h3 a, .title a, a.result-link").first();
        const title = titleEl.text().trim();
        const url = titleEl.attr("href") ?? "";
        const dateStr =
          $(el).find("time, .date, .decision-date").attr("datetime") ??
          $(el).find("time, .date, .decision-date").text().trim();
        const summary = $(el).find("p, .abstract, .summary").first().text().trim();

        if (title && url) {
          const fullUrl = url.startsWith("http")
            ? url
            : `https://www.courdecassation.fr${url}`;
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
