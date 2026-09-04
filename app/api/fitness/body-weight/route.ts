import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { parseDayParam, startOfDay } from "../../../../lib/nutrition";

export async function GET() {
  const entries = await prisma.bodyWeightEntry.findMany({
    orderBy: { date: "desc" },
    take: 120,
  });
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const weightKg = Number(body.weightKg);
  if (isNaN(weightKg) || weightKg < 20 || weightKg > 400) {
    return NextResponse.json({ error: "Poids invalide (20–400 kg)" }, { status: 400 });
  }
  const date =
    (typeof body.date === "string" ? parseDayParam(body.date) : null) ?? startOfDay(new Date());

  // Une pesée par jour : la nouvelle valeur remplace l'ancienne.
  const entry = await prisma.bodyWeightEntry.upsert({
    where: { date },
    update: { weightKg },
    create: { date, weightKg },
  });
  return NextResponse.json(entry, { status: 201 });
}
