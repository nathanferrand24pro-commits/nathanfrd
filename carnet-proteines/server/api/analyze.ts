import Anthropic from "@anthropic-ai/sdk";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// La clé est lue dans la variable d'environnement ANTHROPIC_API_KEY (réglée sur Vercel).
// Elle ne quitte jamais ce serveur : l'application iPhone ne la connaît pas.
const client = new Anthropic();

const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type MediaType = (typeof MEDIA_TYPES)[number];

const MAX_IMAGE_BASE64 = 3_500_000; // ~2,6 Mo d'image, sous la limite de 4,5 Mo de Vercel
const MAX_NOTE = 500;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["plat", "aliments", "confiance", "remarque"],
  properties: {
    plat: { type: "string", description: "Nom court du repas, en français" },
    aliments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["nom", "grammes", "kcal", "proteines", "glucides", "lipides"],
        properties: {
          nom: { type: "string" },
          grammes: { type: "number" },
          kcal: { type: "number" },
          proteines: { type: "number" },
          glucides: { type: "number" },
          lipides: { type: "number" },
        },
      },
    },
    confiance: { type: "string", enum: ["faible", "moyenne", "élevée"] },
    remarque: { type: "string" },
  },
} as const;

const INSTRUCTIONS = `Tu es diététicien et tu estimes la valeur nutritionnelle d'un repas pour une application de suivi des protéines.

Identifie chaque aliment distinct, estime son poids en grammes tel que servi (cuit s'il est cuit), puis ses calories, protéines, glucides et lipides pour ce poids, d'après des tables de composition courantes (type Ciqual).
- Compte à part les matières grasses de cuisson, les sauces et les boissons visibles ou probables.
- Sois réaliste sur les portions : sers-toi de la taille de l'assiette, des couverts, de la main ou de l'emballage comme repères.
- Les précisions de l'utilisateur sont prioritaires sur ce que montre la photo.
- "remarque" : une phrase courte sur la principale incertitude, ou une chaîne vide.
- Si rien de comestible n'est identifiable, renvoie une liste "aliments" vide et explique pourquoi dans "remarque".`;

function fail(res: VercelResponse, status: number, error: string) {
  return res.status(status).json({ error });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return fail(res, 405, "Méthode non autorisée.");

  const appToken = process.env.APP_TOKEN;
  if (!appToken || req.headers.authorization !== `Bearer ${appToken}`) {
    return fail(res, 401, "Jeton de l'application invalide.");
  }

  const body = (req.body ?? {}) as { image?: unknown; mediaType?: unknown; note?: unknown };
  const image = typeof body.image === "string" && body.image.length > 0 ? body.image : null;
  const note = typeof body.note === "string" ? body.note.trim().slice(0, MAX_NOTE) : "";
  const mediaType: MediaType = MEDIA_TYPES.includes(body.mediaType as MediaType)
    ? (body.mediaType as MediaType)
    : "image/jpeg";

  if (!image && !note) return fail(res, 400, "Envoyez une photo ou une description du repas.");
  if (image && image.length > MAX_IMAGE_BASE64) return fail(res, 413, "Photo trop lourde.");

  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (image) {
    content.push({ type: "image", source: { type: "base64", media_type: mediaType, data: image } });
  }
  content.push({
    type: "text",
    text:
      INSTRUCTIONS +
      "\n\n" +
      (image ? "La photo du repas est jointe." : "Pas de photo : estime d'après la description seule.") +
      (note ? `\n\nPrécisions de l'utilisateur :\n${note}` : ""),
  });

  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      // Si un filtre de sécurité refuse la demande, l'API la relance sur un autre modèle.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: SCHEMA },
      },
      messages: [{ role: "user", content }],
    });

    if (response.stop_reason === "refusal") {
      return fail(res, 422, "Cette photo n'a pas pu être analysée. Essayez-en une autre.");
    }
    if (response.stop_reason === "max_tokens") {
      return fail(res, 502, "L'analyse a été interrompue. Réessayez.");
    }

    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") return fail(res, 502, "Réponse vide. Réessayez.");

    return res.status(200).json(JSON.parse(text.text));
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return fail(res, 429, "Trop de demandes d'affilée. Réessayez dans une minute.");
    }
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("Clé API Anthropic refusée");
      return fail(res, 500, "Le serveur est mal configuré (clé API).");
    }
    if (error instanceof Anthropic.BadRequestError) {
      console.error("Requête refusée :", error.message);
      return fail(res, 400, "Cette photo n'a pas pu être lue. Essayez une autre photo.");
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Erreur API ${error.status}:`, error.message);
      return fail(res, 502, "Le service d'analyse ne répond pas. Réessayez.");
    }
    console.error(error);
    return fail(res, 500, "Erreur inattendue du serveur.");
  }
}
