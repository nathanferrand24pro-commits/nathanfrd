import axios from "axios";
import RSSParser from "rss-parser";

export interface ScrapedArticle {
  externalId: string;
  title: string;
  summary?: string;
  url: string;
  publishedAt: Date;
  categories: string[];
}

const THEME_KEYWORDS: Record<string, string[]> = {
  licenciement: [
    "licenciement",
    "licencié",
    "licenciée",
    "rupture conventionnelle",
    "PSE",
    "plan de sauvegarde",
    "cause réelle et sérieuse",
    "faute grave",
    "faute lourde",
  ],
  "contrat-de-travail": [
    "contrat de travail",
    "CDI",
    "CDD",
    "période d'essai",
    "requalification",
    "travail dissimulé",
  ],
  discrimination: [
    "discrimination",
    "harcèlement",
    "égalité",
    "inégalité de traitement",
    "sexisme",
    "racisme",
  ],
  "duree-du-travail": [
    "durée du travail",
    "heures supplémentaires",
    "RTT",
    "temps partiel",
    "forfait jours",
    "temps de travail",
    "repos compensateur",
  ],
  "securite-sociale": [
    "sécurité sociale",
    "AT/MP",
    "accident du travail",
    "maladie professionnelle",
    "URSSAF",
    "cotisations sociales",
  ],
  "negociation-collective": [
    "accord collectif",
    "convention collective",
    "négociation",
    "syndicat",
    "CSE",
    "comité social et économique",
    "représentant du personnel",
    "délégué syndical",
  ],
  "sante-travail": [
    "pénibilité",
    "risques professionnels",
    "inaptitude",
    "médecin du travail",
    "harcèlement moral",
    "burn-out",
    "risques psychosociaux",
  ],
  remuneration: [
    "salaire",
    "rémunération",
    "primes",
    "SMIC",
    "classification",
    "rappel de salaire",
    "bulletin de paie",
  ],
  "procedure-prudhomale": [
    "prud'hommes",
    "conseil de prud'hommes",
    "CPH",
    "procédure",
    "prescription",
    "conciliation",
  ],
  "representation-personnel": [
    "représentant du personnel",
    "CSE",
    "délégué syndical",
    "IRP",
    "mandat",
    "protection",
  ],
};

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const rssParser = new RSSParser({
  headers: {
    "User-Agent": BROWSER_UA,
    Accept: "application/rss+xml, application/xml, text/xml",
  },
  timeout: 10000,
});

export function classifyThemes(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      found.push(theme);
    }
  }
  return found;
}

export async function parseRSS(url: string): Promise<ScrapedArticle[]> {
  const feed = await rssParser.parseURL(url);
  return (feed.items || []).map((item) => {
    const title = item.title?.trim() ?? "Sans titre";
    const summary = item.contentSnippet?.slice(0, 500) ?? item.content?.slice(0, 500);
    const articleUrl = item.link ?? url;
    const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
    return {
      externalId: articleUrl,
      title,
      summary,
      url: articleUrl,
      publishedAt: isNaN(pubDate.getTime()) ? new Date() : pubDate,
      categories: classifyThemes(title + " " + (summary ?? "")),
    };
  });
}

export async function fetchHTML(url: string): Promise<string> {
  const res = await axios.get(url, {
    headers: {
      "User-Agent": BROWSER_UA,
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      Accept: "text/html,application/xhtml+xml",
    },
    timeout: 15000,
  });
  return res.data as string;
}

export function parseFrenchDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  // Try standard parse first
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;

  // French month names
  const months: Record<string, number> = {
    janvier: 0,
    février: 1,
    mars: 2,
    avril: 3,
    mai: 4,
    juin: 5,
    juillet: 6,
    août: 7,
    septembre: 8,
    octobre: 9,
    novembre: 10,
    décembre: 11,
  };

  const match = dateStr
    .toLowerCase()
    .match(/(\d{1,2})\s+([\wéû]+)\s+(\d{4})/);
  if (match) {
    const day = parseInt(match[1]);
    const month = months[match[2]];
    const year = parseInt(match[3]);
    if (month !== undefined) {
      return new Date(year, month, day);
    }
  }

  return new Date();
}
