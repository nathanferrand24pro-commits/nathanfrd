import { ScrapedArticle, classifyThemes, parseRSS, fetchHTML } from "./base";
import * as cheerio from "cheerio";

// EUR-Lex — flux RSS directives et règlements droit social UE
const RSS_FEEDS = [
  // Réglementation sociale européenne
  "https://eur-lex.europa.eu/rss/rss-legal-content-FR.xml?type=legislation&subject=social",
  // Actualités EUR-Lex droit social
  "https://eur-lex.europa.eu/rss/rss-news-FR.xml",
];

// Recherche EUR-Lex sur le droit social/emploi
const SEARCH_URL =
  "https://eur-lex.europa.eu/search.html?qid=&text=droit+du+travail+emploi&scope=EURLEX&type=quick&lang=fr&SUBDOM_INIT=ALL_ALL&DTS_SUBDOM=ALL_ALL";

export async function scrapeEurLex(): Promise<ScrapedArticle[]> {
  // Essai RSS
  for (const rssUrl of RSS_FEEDS) {
    try {
      const articles = await parseRSS(rssUrl);
      if (articles.length > 0) {
        return articles.map((a) => ({
          ...a,
          categories: a.categories.length > 0 ? a.categories : ["negociation-collective"],
        }));
      }
    } catch {
      // suivant
    }
  }

  // Fallback : scraping page de recherche
  try {
    const html = await fetchHTML(SEARCH_URL);
    const $ = cheerio.load(html);
    const articles: ScrapedArticle[] = [];

    $(".SearchResult, .result-item, li.result").each((_, el) => {
      const titleEl = $(el).find("a.title, h2 a, .result-title a").first();
      const title = titleEl.text().trim();
      let url = titleEl.attr("href") ?? "";
      if (!title || !url) return;
      if (!url.startsWith("http")) url = `https://eur-lex.europa.eu${url}`;

      const dateStr = $(el).find(".Date, .date, time").first().text().trim();
      const summary = $(el).find(".Abstract, p, .summary").first().text().trim();

      articles.push({
        externalId: url,
        title,
        summary: summary.slice(0, 500),
        url,
        publishedAt: new Date(dateStr) || new Date(),
        categories: classifyThemes(title + " " + summary),
      });
    });

    return articles;
  } catch {
    return [];
  }
}
