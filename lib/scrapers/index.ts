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
import { scrapeEurLex } from "./eur-lex";
import { scrapeHudoc } from "./hudoc";
import { scrapeJuricaf } from "./juricaf";

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
  "eur-lex": scrapeEurLex,
  hudoc: scrapeHudoc,
  juricaf: scrapeJuricaf,
};

export interface ScrapeResult {
  sourceId: string;
  sourceName: string;
  newArticles: number;
  found: number;
  error?: string;
}

export async function runAllScrapers(): Promise<ScrapeResult[]> {
  const sources = await prisma.source.findMany({ where: { active: true } });
  const results: ScrapeResult[] = [];

  for (const source of sources) {
    const scraperFn = SCRAPERS[source.scraper];
    if (!scraperFn) {
      console.warn(`[Scraper] Pas de scraper pour: ${source.scraper}`);
      continue;
    }

    try {
      console.log(`[Scraper] ▶ ${source.name}`);
      const articles = await scraperFn();
      let newCount = 0;

      for (const article of articles) {
        try {
          const existing = await prisma.article.findFirst({ where: { url: article.url } });
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
          const err = e as Error;
          if (!err.message?.includes("Unique constraint")) {
            console.error(`[Scraper] Article KO ${article.url}:`, err.message);
          }
        }
      }

      // Sauvegarder le résultat (succès ou 0 trouvé)
      const errorMsg = articles.length === 0
        ? "Aucun article trouvé — site peut-être bloqué ou sélecteur incorrect"
        : null;

      await prisma.source.update({
        where: { id: source.id },
        data: {
          lastScrapedAt: new Date(),
          lastError: errorMsg,
        },
      });

      console.log(`[Scraper] ✓ ${source.name}: +${newCount} nouveaux (${articles.length} trouvés)`);
      results.push({ sourceId: source.id, sourceName: source.name, newArticles: newCount, found: articles.length });

    } catch (error) {
      const err = error as Error;
      const errorMsg = err.message ?? "Erreur inconnue";
      console.error(`[Scraper] ✗ ${source.name}:`, errorMsg);

      await prisma.source.update({
        where: { id: source.id },
        data: { lastError: errorMsg },
      }).catch(() => {});

      results.push({ sourceId: source.id, sourceName: source.name, newArticles: 0, found: 0, error: errorMsg });
    }
  }

  return results;
}
