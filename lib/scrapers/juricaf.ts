import axios from "axios";
import * as cheerio from "cheerio";
import { ScrapedArticle, classifyThemes } from "./base";

// Juricaf — jurisprudence francophone (France, Belgique, Suisse, Québec, Afrique…)
// Site public, pas d'API officielle → scraping léger de la recherche
const BASE_URL = "https://juricaf.org";
const SEARCH_URL = `${BASE_URL}/search/droit+social+licenciement+travail/facets_pays-FRA`;

export async function scrapeJuricaf(): Promise<ScrapedArticle[]> {
  try {
    const res = await axios.get(SEARCH_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/xml",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(res.data as string);
    const articles: ScrapedArticle[] = [];

    // Juricaf structure: .search-result, .decision, .result
    $(".search-result, .arret, .decision-item, li.result, .result").each(
      (_, el) => {
        const titleEl = $(el).find("a.title, h2 a, h3 a, a").first();
        const title = titleEl.text().trim();
        let url = titleEl.attr("href") ?? "";
        if (!title || !url) return;
        if (!url.startsWith("http")) url = `${BASE_URL}${url}`;

        const dateStr = $(el)
          .find(".date, time, .decision-date, .datejugement")
          .first()
          .text()
          .trim();
        const summary = $(el)
          .find("p, .abstract, .extrait, .summary")
          .first()
          .text()
          .trim();
        const juridiction = $(el)
          .find(".juridiction, .court, .source")
          .first()
          .text()
          .trim();

        const fullTitle = juridiction
          ? `[${juridiction}] ${title}`
          : title;

        articles.push({
          externalId: url,
          title: fullTitle,
          summary: summary.slice(0, 500),
          url,
          publishedAt: new Date(dateStr) || new Date(),
          categories: classifyThemes(fullTitle + " " + summary),
        });
      }
    );

    return articles;
  } catch {
    return [];
  }
}
