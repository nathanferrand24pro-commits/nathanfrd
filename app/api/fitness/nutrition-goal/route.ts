import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET() {
  const goal = await prisma.nutritionGoal.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  return NextResponse.json(goal);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const calories = Number(body.calories);
  const proteinG = Number(body.proteinG);

  if (!Number.isInteger(calories) || calories < 800 || calories > 10000) {
    return NextResponse.json({ error: "Objectif calorique invalide (800–10000)" }, { status: 400 });
  }
  if (!Number.isInteger(proteinG) || proteinG < 0 || proteinG > 500) {
    return NextResponse.json({ error: "Objectif protéines invalide (0–500)" }, { status: 400 });
  }

  const goal = await prisma.nutritionGoal.upsert({
    where: { id: "default" },
    update: { calories, proteinG },
    create: { id: "default", calories, proteinG },
  });
  return NextResponse.json(goal);
}
