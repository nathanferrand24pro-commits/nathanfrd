import { NextRequest, NextResponse } from "next/server";
import { runAllScrapers } from "../../../lib/scrapers/index";

export async function POST(request: NextRequest) {
  // Optional: check secret for manual trigger security
  const secret = request.headers.get("x-scrape-secret");
  const configuredSecret = process.env.SCRAPE_SECRET;
  if (configuredSecret && secret !== configuredSecret) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Run scrapers asynchronously (don't await to respond quickly)
  setImmediate(async () => {
    try {
      await runAllScrapers();
    } catch (err) {
      console.error("[API/scrape] Erreur:", err);
    }
  });

  return NextResponse.json({ message: "Actualisation lancée" }, { status: 202 });
}
