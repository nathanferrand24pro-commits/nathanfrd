import { prisma } from "../db";
import { ScrapedArticle } from "./base";
import { scrapeCourdeCassation } from "./cour-cassation";
import { scrapeConseilEtat } from "./conseil-etat";
import { scrapeLegifrance } from "./legifrance";
import { scrapeTravailEmploi } from "./travail-emploi";
import { scrapeFlichyGrange } from "./flichy-grange";
import { scrapeFromontBriens } from "./fromont-briens";
import { scrapeCapstan } from "./capstan";
import { scrapeCmsLefebvre } from "./cms-lefebvre";
import { scrapeBarthelemy } from "./barthelemy";

type ScraperFn = () => Promise<ScrapedArticle[]>;

const SCRAPERS: Record<string, ScraperFn> = {
  "cour-cassation": scrapeCourdeCassation,
  "conseil-etat": scrapeConseilEtat,
  legifrance: scrapeLegifrance,
  "travail-emploi": scrapeTravailEmploi,
  "flichy-grange": scrapeFlichyGrange,
  "fromont-briens": scrapeFromontBriens,
  capstan: scrapeCapstan,
  "cms-lefebvre": scrapeCmsLefebvre,
  barthelemy: scrapeBarthelemy,
};

export interface ScrapeResult {
  sourceId: string;
  sourceName: string;
  newArticles: number;
  error?: string;
}

export async function runAllScrapers(): Promise<ScrapeResult[]> {
  const sources = await prisma.source.findMany({ where: { active: true } });
  const results: ScrapeResult[] = [];

  for (const source of sources) {
    const scraperFn = SCRAPERS[source.scraper];
    if (!scraperFn) {
      console.warn(`[Scraper] Pas de scraper trouvé pour: ${source.scraper}`);
      continue;
    }

    try {
      console.log(`[Scraper] Démarrage: ${source.name}`);
      const articles = await scraperFn();
      let newCount = 0;

      for (const article of articles) {
        try {
          const existing = await prisma.article.findFirst({
            where: { url: article.url },
          });
          if (!existing) {
            await prisma.article.create({
              data: {
                title: article.title,
                summary: article.summary,
                url: article.url,
                publishedAt: article.publishedAt,
                categories: JSON.stringify(article.categories),
                sourceId: source.id,
              },
            });
            newCount++;
          }
        } catch (e) {
          // Skip duplicate articles
          const err = e as Error;
          if (!err.message?.includes("Unique constraint")) {
            console.error(`[Scraper] Erreur article ${article.url}:`, err.message);
          }
        }
      }

      await prisma.source.update({
        where: { id: source.id },
        data: { lastScrapedAt: new Date() },
      });

      console.log(
        `[Scraper] ${source.name}: ${newCount} nouveaux articles (${articles.length} trouvés)`
      );
      results.push({ sourceId: source.id, sourceName: source.name, newArticles: newCount });
    } catch (error) {
      const err = error as Error;
      console.error(`[Scraper] Erreur pour ${source.name}:`, err.message);
      results.push({
        sourceId: source.id,
        sourceName: source.name,
        newArticles: 0,
        error: err.message,
      });
    }
  }

  return results;
}
