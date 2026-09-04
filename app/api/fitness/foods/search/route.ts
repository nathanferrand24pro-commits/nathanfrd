import { NextRequest, NextResponse } from "next/server";
import type { FoodSearchResult } from "../../../../../lib/nutrition";

// Proxy serveur vers Open Food Facts (évite CORS et normalise les données).
const OFF_URL = "https://world.openfoodfacts.org/cgi/search.pl";

interface OffProduct {
  product_name?: string;
  product_name_fr?: string;
  brands?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ error: "Saisissez au moins 2 caractères" }, { status: 400 });
  }

  const params = new URLSearchParams({
    search_terms: q,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: "12",
    fields: "product_name,product_name_fr,brands,nutriments",
    // Priorité aux produits vendus en France (base plus pertinente en français)
    tagtype_0: "countries",
    tag_contains_0: "contains",
    tag_0: "france",
    sort_by: "unique_scans_n",
  });

  try {
    const res = await fetch(`${OFF_URL}?${params}`, {
      headers: { "User-Agent": "nathanfrd-fitness/1.0 (suivi personnel)" },
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Open Food Facts a répondu ${res.status}`);
    const data = (await res.json()) as { products?: OffProduct[] };

    const results: FoodSearchResult[] = (data.products ?? [])
      .map((p) => ({
        name: p.product_name_fr || p.product_name || "",
        brand: p.brands ? p.brands.split(",")[0].trim() : null,
        per100g: {
          kcal: p.nutriments?.["energy-kcal_100g"] ?? 0,
          proteinG: p.nutriments?.proteins_100g ?? 0,
          carbsG: p.nutriments?.carbohydrates_100g ?? 0,
          fatG: p.nutriments?.fat_100g ?? 0,
        },
      }))
      .filter((r) => r.name && r.per100g.kcal > 0)
      .slice(0, 8);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      {
        error:
          "Base alimentaire inaccessible pour le moment — utilisez la saisie manuelle ci-dessous.",
      },
      { status: 502 }
    );
  }
}
