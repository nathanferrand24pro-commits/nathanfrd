import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { parseDayParam, startOfDay } from "../../../../lib/nutrition";

export async function GET() {
  const entries = await prisma.sleepEntry.findMany({
    orderBy: { date: "desc" },
    take: 60,
  });
  return NextResponse.json(entries);
}

// Convertit "23:15" ou un ISO complet en Date, relative au jour du réveil.
// Une heure >= 15h est interprétée comme la veille (coucher), sinon le jour même.
function parseTime(value: unknown, wakeDay: Date): Date | null {
  if (typeof value !== "string" || !value) return null;
  const hm = value.match(/^(\d{1,2}):(\d{2})$/);
  if (hm) {
    const h = Number(hm[1]);
    const m = Number(hm[2]);
    if (h > 23 || m > 59) return null;
    const d = new Date(wakeDay);
    if (h >= 15) d.setDate(d.getDate() - 1);
    d.setHours(h, m, 0, 0);
    return d;
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(request: NextRequest) {
  // Protection optionnelle pour un déploiement public : définir FITNESS_API_TOKEN
  // et envoyer "Authorization: Bearer <token>" (depuis le Raccourci iOS notamment).
  const token = process.env.FITNESS_API_TOKEN;
  if (token) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${token}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }

  const body = await request.json();

  const date =
    (typeof body.date === "string" ? parseDayParam(body.date) : null) ?? startOfDay(new Date());
  const bedTime = parseTime(body.bedTime, date);
  const wakeTime = parseTime(body.wakeTime, date);

  let durationMin = Number(body.durationMin);
  if (!Number.isFinite(durationMin) || durationMin <= 0) {
    if (bedTime && wakeTime && wakeTime > bedTime) {
      durationMin = Math.round((wakeTime.getTime() - bedTime.getTime()) / 60000);
    } else {
      return NextResponse.json(
        { error: "Indiquez durationMin ou bedTime/wakeTime cohérents" },
        { status: 400 }
      );
    }
  }
  durationMin = Math.round(durationMin);
  if (durationMin < 30 || durationMin > 20 * 60) {
    return NextResponse.json({ error: "Durée de sommeil invalide" }, { status: 400 });
  }

  const quality = Number(body.quality);
  const data = {
    bedTime,
    wakeTime,
    durationMin,
    quality: Number.isInteger(quality) && quality >= 1 && quality <= 5 ? quality : null,
    source: body.source === "apple-sante" ? "apple-sante" : "manuel",
    notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
  };

  // Une entrée par nuit : renvoyer la nuit écrase la précédente.
  const entry = await prisma.sleepEntry.upsert({
    where: { date },
    update: data,
    create: { date, ...data },
  });
  return NextResponse.json(entry, { status: 201 });
}
