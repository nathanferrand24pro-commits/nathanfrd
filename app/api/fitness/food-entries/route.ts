import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { MEALS, Meal, parseDayParam, startOfDay } from "../../../../lib/nutrition";

export async function GET(request: NextRequest) {
  const day = parseDayParam(request.nextUrl.searchParams.get("date")) ?? startOfDay(new Date());
  const next = new Date(day);
  next.setDate(next.getDate() + 1);

  const entries = await prisma.foodEntry.findMany({
    where: { date: { gte: day, lt: next } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const meal = body.meal as Meal;
  const quantityG = Number(body.quantityG);
  const calories = Number(body.calories);
  const proteinG = Number(body.proteinG ?? 0);
  const carbsG = Number(body.carbsG ?? 0);
  const fatG = Number(body.fatG ?? 0);

  if (!name) return NextResponse.json({ error: "Nom de l'aliment requis" }, { status: 400 });
  if (!MEALS.includes(meal)) {
    return NextResponse.json({ error: "Repas invalide" }, { status: 400 });
  }
  if (isNaN(quantityG) || quantityG <= 0 || quantityG > 5000) {
    return NextResponse.json({ error: "Quantité invalide" }, { status: 400 });
  }
  if (isNaN(calories) || calories < 0 || calories > 10000) {
    return NextResponse.json({ error: "Calories invalides" }, { status: 400 });
  }
  for (const v of [proteinG, carbsG, fatG]) {
    if (isNaN(v) || v < 0 || v > 1000) {
      return NextResponse.json({ error: "Macronutriments invalides" }, { status: 400 });
    }
  }

  const day =
    (typeof body.date === "string" ? parseDayParam(body.date) : null) ?? startOfDay(new Date());

  const entry = await prisma.foodEntry.create({
    data: {
      date: day,
      meal,
      name,
      quantityG,
      calories,
      proteinG,
      carbsG,
      fatG,
      source: body.source === "openfoodfacts" ? "openfoodfacts" : "manuel",
    },
  });
  return NextResponse.json(entry, { status: 201 });
}
