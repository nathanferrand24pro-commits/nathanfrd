import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export async function GET() {
  const sources = await prisma.source.findMany({
    include: {
      _count: { select: { articles: true } },
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(sources);
}
