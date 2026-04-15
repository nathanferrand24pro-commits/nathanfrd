import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export async function GET() {
  const subs = await prisma.alertSubscription.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(
    subs.map((s) => ({ ...s, keywords: JSON.parse(s.keywords) as string[] }))
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { email: string; keywords: string[] };
  const { email, keywords } = body;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  const sub = await prisma.alertSubscription.upsert({
    where: { email },
    create: {
      email,
      keywords: JSON.stringify(keywords ?? []),
    },
    update: {
      keywords: JSON.stringify(keywords ?? []),
      active: true,
    },
  });

  return NextResponse.json(
    { ...sub, keywords: JSON.parse(sub.keywords) as string[] },
    { status: 201 }
  );
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }

  await prisma.alertSubscription.update({
    where: { email },
    data: { active: false },
  });

  return NextResponse.json({ message: "Désabonnement effectué" });
}
