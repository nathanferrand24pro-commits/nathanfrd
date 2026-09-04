import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET() {
  const setting = await prisma.fitnessSetting.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  return NextResponse.json(setting);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const data: { phaseOverride?: string | null; waterGoalMl?: number } = {};

  if ("phaseOverride" in body) {
    const v = body.phaseOverride;
    if (v !== null && v !== "force" && v !== "hypertrophie") {
      return NextResponse.json({ error: "Phase invalide" }, { status: 400 });
    }
    data.phaseOverride = v;
  }
  if ("waterGoalMl" in body) {
    const v = Number(body.waterGoalMl);
    if (!Number.isInteger(v) || v < 500 || v > 8000) {
      return NextResponse.json({ error: "Objectif hydratation invalide (500–8000 ml)" }, { status: 400 });
    }
    data.waterGoalMl = v;
  }

  const setting = await prisma.fitnessSetting.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });
  return NextResponse.json(setting);
}
