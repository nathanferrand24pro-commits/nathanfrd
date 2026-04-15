import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { classifyThemes } from "../../../../lib/scrapers/base";
import * as cheerio from "cheerio";
import axios from "axios";

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Détecte la source à partir de l'URL
function detectSource(url: string): string {
  if (url.includes("legifrance.gouv.fr")) return "legifrance";
  if (url.includes("courdecassation.fr")) return "cour-cassation";
  if (url.includes("conseil-etat.fr")) return "conseil-etat";
  if (url.includes("travail-emploi.gouv.fr")) return "travail-emploi";
  if (url.includes("hudoc.echr.coe.int")) return "hudoc";
  if (url.includes("eur-lex.europa.eu")) return "eur-lex";
  if (url.includes("juricaf.org")) return "juricaf";
  if (url.includes("flichygrange.com")) return "flichy-grange";
  if (url.includes("fromont-briens.com")) return "fromont-briens";
  if (url.includes("capstan.fr")) return "capstan";
  if (url.includes("cms.law")) return "cms-lefebvre";
  if (url.includes("barthelemy-avocats.com")) return "barthelemy";
  return "legifrance"; // par défaut
}

// Extraction du contenu selon la source
async function extractArticle(url: string): Promise<{
  title: string;
  summary: string;
  publishedAt: Date;
}> {
  const res = await axios.get(url, {
    headers: {
      "User-Agent": BROWSER_UA,
      "Accept-Language": "fr-FR,fr;q=0.9",
      Accept: "text/html,application/xhtml+xml",
    },
    timeout: 20000,
  });

  const $ = cheerio.load(res.data as string);

  // Supprimer les scripts et styles
  $("script, style, nav, header, footer, .cookie-banner, .nav").remove();

  // Titre : priorité aux balises sémantiques
  const title =
    $("h1").first().text().trim() ||
    $('meta[property="og:title"]').attr("content") ||
    $("title").text().trim() ||
    "Article importé";

  // Résumé
  const ogDesc = $('meta[property="og:description"]').attr("content") || "";
  const firstPara = $("article p, main p, .content p, .decision p")
    .first()
    .text()
    .trim();
  const summary = (ogDesc || firstPara).slice(0, 600);

  // Date : chercher dans les metas et balises time
  const metaDate =
    $('meta[property="article:published_time"]').attr("content") ||
    $('meta[name="date"]').attr("content") ||
    $("time[datetime]").first().attr("datetime") ||
    $(".date, .published, .decision-date, .dateDecision").first().text().trim();

  let publishedAt = new Date();
  if (metaDate) {
    const parsed = new Date(metaDate);
    if (!isNaN(parsed.getTime())) publishedAt = parsed;
  }

  return { title: title.slice(0, 300), summary, publishedAt };
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { url: string; sourceId?: string };
  const { url, sourceId } = body;

  if (!url || !url.startsWith("http")) {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }

  // Vérifier si déjà importé
  const existing = await prisma.article.findFirst({ where: { url } });
  if (existing) {
    return NextResponse.json({ error: "Cet article est déjà dans la base.", article: existing }, { status: 409 });
  }

  // Détecter ou utiliser la source fournie
  const scraperId = detectSource(url);
  const source = await prisma.source.findFirst({
    where: sourceId ? { id: sourceId } : { scraper: scraperId },
  });

  if (!source) {
    return NextResponse.json({ error: "Source non trouvée" }, { status: 404 });
  }

  // Extraire le contenu
  let title = "Article importé";
  let summary = "";
  let publishedAt = new Date();

  try {
    const extracted = await extractArticle(url);
    title = extracted.title;
    summary = extracted.summary;
    publishedAt = extracted.publishedAt;
  } catch (err) {
    console.error("[Import] Extraction échouée, import avec données minimales:", err);
    // On importe quand même avec l'URL comme titre si l'extraction échoue
    title = url;
  }

  const categories = classifyThemes(title + " " + summary);

  const article = await prisma.article.create({
    data: {
      title,
      summary: summary || null,
      url,
      publishedAt,
      categories: JSON.stringify(categories),
      sourceId: source.id,
    },
    include: { source: true },
  });

  return NextResponse.json({
    ...article,
    categories: JSON.parse(article.categories) as string[],
  }, { status: 201 });
}
