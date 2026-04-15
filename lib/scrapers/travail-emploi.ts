import * as cheerio from "cheerio";
import { ScrapedArticle, classifyThemes, fetchHTML, parseRSS } from "./base";

const RSS_URLS = [
  "https://travail-emploi.gouv.fr/rss",
  "https://travail-emploi.gouv.fr/feed",
  "https://travail-emploi.gouv.fr/actualites-presse-et-outils/actualites-et-breves/feed",
];

const LISTING_URL =
  "https://travail-emploi.gouv.fr/actualites-presse-et-outils/actualites-et-breves";

export async function scrapeTravailEmploi(): Promise<ScrapedArticle[]> {
  for (const rssUrl of RSS_URLS) {
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

    $(".views-row, article, .teaser").each((_, el) => {
      const titleEl = $(el).find("h2 a, h3 a, .field--name-title a").first();
      const title = titleEl.text().trim();
      const url = titleEl.attr("href") ?? "";
      const dateStr =
        $(el).find("time[datetime]").attr("datetime") ??
        $(el).find(".date-display-single, time").text().trim();
      const summary = $(el)
        .find(".field--name-body p, .field--name-field-chapo, .summary")
        .first()
        .text()
        .trim();

      if (title && url) {
        const fullUrl = url.startsWith("http")
          ? url
          : `https://travail-emploi.gouv.fr${url}`;
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
