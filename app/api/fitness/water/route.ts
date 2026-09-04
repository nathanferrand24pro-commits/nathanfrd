import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { parseDayParam, startOfDay } from "../../../../lib/nutrition";

export async function GET(request: NextRequest) {
  const day = parseDayParam(request.nextUrl.searchParams.get("date")) ?? startOfDay(new Date());
  const next = new Date(day);
  next.setDate(next.getDate() + 1);

  const [entries, setting] = await Promise.all([
    prisma.waterEntry.findMany({
      where: { date: { gte: day, lt: next } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.fitnessSetting.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } }),
  ]);
  const totalMl = entries.reduce((s, e) => s + e.amountMl, 0);
  return NextResponse.json({ entries, totalMl, goalMl: setting.waterGoalMl });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const amountMl = Number(body.amountMl);
  if (!Number.isInteger(amountMl) || amountMl < 1 || amountMl > 5000) {
    return NextResponse.json({ error: "Quantité invalide (1–5000 ml)" }, { status: 400 });
  }
  const date =
    (typeof body.date === "string" ? parseDayParam(body.date) : null) ?? startOfDay(new Date());

  const entry = await prisma.waterEntry.create({ data: { date, amountMl } });
  return NextResponse.json(entry, { status: 201 });
}
