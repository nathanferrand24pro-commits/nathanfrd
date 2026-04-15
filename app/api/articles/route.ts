import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const search = searchParams.get("q") ?? "";
  const sourceType = searchParams.get("type") ?? ""; // "officiel" | "cabinet"
  const sourceId = searchParams.get("source") ?? "";
  const category = searchParams.get("category") ?? "";
  const dateFrom = searchParams.get("from") ?? "";
  const dateTo = searchParams.get("to") ?? "";

  // Build where clause
  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { summary: { contains: search } },
    ];
  }

  if (category) {
    where.categories = { contains: category };
  }

  if (sourceId) {
    where.sourceId = sourceId;
  } else if (sourceType) {
    where.source = { type: sourceType };
  }

  if (dateFrom || dateTo) {
    where.publishedAt = {};
    if (dateFrom) (where.publishedAt as Record<string, unknown>).gte = new Date(dateFrom);
    if (dateTo) (where.publishedAt as Record<string, unknown>).lte = new Date(dateTo);
  }

  const skip = (page - 1) * limit;

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: { source: true },
      orderBy: { publishedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.article.count({ where }),
  ]);

  return NextResponse.json({
    articles: articles.map((a) => ({
      ...a,
      categories: JSON.parse(a.categories) as string[],
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
