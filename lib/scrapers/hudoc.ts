import axios from "axios";
import { ScrapedArticle, classifyThemes } from "./base";

// HUDOC — Cour Européenne des Droits de l'Homme
// API publique JSON, aucune authentification requise
const HUDOC_API =
  "https://hudoc.echr.coe.int/app/query/results?query=(contentsitename=ECHR)%20AND%20(documentcollectionid2:%22GRANDCHAMBER%22%20OR%20documentcollectionid2:%22CHAMBER%22)%20AND%20((kpdate%3E={YESTERDAY})%20AND%20(kpdate%3C={TODAY}))%20AND%20(languageisocode=%22FRE%22)%20AND%20(article=%224%22%20OR%20article=%228%22%20OR%20article=%2214%22)&select=sharepointid,Rank,ECHRRank,languageisocode,docname,doctype,applicability,application,importance,country,decisionbody,introductiondate,kpdate,kpdateAsText,documentcollectionid,documentcollectionid2,languageisocode,extractedappno,conclusion,docname&sort=kpdate%20Descending&start=0&length=20&rankingModelId=11111111-0000-0000-0000-000000000000";

export async function scrapeHudoc(): Promise<ScrapedArticle[]> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours
      .toISOString()
      .split("T")[0];

    const url = HUDOC_API.replace("{TODAY}", today).replace("{YESTERDAY}", yesterday);

    const res = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
      timeout: 15000,
    });

    const data = res.data as { results?: { columns?: Record<string, unknown> }[] };
    const results = data.results ?? [];

    return results
      .map((item) => {
        const cols = item.columns ?? (item as Record<string, unknown>);
        const docname = String(
          (cols as Record<string, unknown>).docname ?? "Arrêt CEDH"
        );
        const kpdate = String(
          (cols as Record<string, unknown>).kpdate ?? new Date().toISOString()
        );
        const appno = String(
          (cols as Record<string, unknown>).extractedappno ?? ""
        );
        const conclusion = String(
          (cols as Record<string, unknown>).conclusion ?? ""
        ).slice(0, 400);
        const sharepointid = String(
          (cols as Record<string, unknown>).sharepointid ?? ""
        );

        const articleUrl = sharepointid
          ? `https://hudoc.echr.coe.int/eng?i=${sharepointid}`
          : "https://hudoc.echr.coe.int";

        const title = appno
          ? `CEDH — ${docname} (n° ${appno})`
          : `CEDH — ${docname}`;

        return {
          externalId: sharepointid || docname,
          title,
          summary: conclusion,
          url: articleUrl,
          publishedAt: new Date(kpdate),
          categories: classifyThemes(title + " " + conclusion),
        };
      })
      .filter((a) => a.title && a.url);
  } catch {
    return [];
  }
}
