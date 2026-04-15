import axios from "axios";
import { ScrapedArticle, classifyThemes } from "./base";

const PISTE_TOKEN_URL =
  "https://oauth.piste.gouv.fr/api/oauth/token";
const PISTE_API_URL =
  "https://api.piste.gouv.fr/dila/legifrance/lf-engine-app";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.PISTE_CLIENT_ID;
  const clientSecret = process.env.PISTE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  // Return cached token if still valid
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "openid",
  });

  const res = await axios.post(PISTE_TOKEN_URL, params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 10000,
  });

  const { access_token, expires_in } = res.data as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    token: access_token,
    expiresAt: Date.now() + (expires_in - 60) * 1000,
  };

  return access_token;
}

export async function scrapeLegifrance(): Promise<ScrapedArticle[]> {
  const token = await getAccessToken();
  if (!token) {
    console.log(
      "[Légifrance] Pas de clé API PISTE configurée — scraper désactivé"
    );
    return [];
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const today = new Date();

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const body = {
    fond: "JURI",
    recherche: {
      champs: [
        {
          typeChamp: "ALL",
          critere: "CONTIENT",
          valeur: "*",
        },
      ],
      typeRecherche: "DATE",
      dateDebut: formatDate(yesterday),
      dateFin: formatDate(today),
      facettes: [
        {
          singleFacette: {
            champ: "FORMATION",
            valeur: "CHAMBRE_SOCIALE",
          },
        },
      ],
      pageNumber: 1,
      pageSize: 30,
      sort: "DATE_DESC",
    },
  };

  const res = await axios.post(`${PISTE_API_URL}/search`, body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    timeout: 15000,
  });

  const results = (res.data as { results?: unknown[] }).results ?? [];

  return results.map((item: unknown) => {
    const r = item as Record<string, unknown>;
    const title = String(r.titre ?? r.title ?? "Décision Légifrance");
    const summary = String(r.resume ?? r.summary ?? "").slice(0, 500);
    const url = `https://www.legifrance.gouv.fr/juri/id/${r.id ?? ""}`;
    const pubDate = r.dateDecision
      ? new Date(r.dateDecision as string)
      : new Date();

    return {
      externalId: String(r.id ?? url),
      title,
      summary,
      url,
      publishedAt: pubDate,
      categories: classifyThemes(title + " " + summary),
    };
  });
}
