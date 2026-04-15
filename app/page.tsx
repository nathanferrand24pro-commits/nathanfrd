import { Suspense } from "react";
import { prisma } from "../lib/db";
import { ArticleCard, ArticleData } from "../components/ArticleCard";
import { FilterBar } from "../components/FilterBar";
import { ScrapeButton } from "../components/ScrapeButton";
import { ImportButton } from "../components/ImportButton";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    source?: string;
    category?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

async function StatsBar() {
  const [totalArticles, totalSources, recent] = await Promise.all([
    prisma.article.count(),
    prisma.source.count({ where: { active: true } }),
    prisma.article.count({
      where: {
        publishedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const lastScrape = await prisma.source.findFirst({
    where: { lastScrapedAt: { not: null } },
    orderBy: { lastScrapedAt: "desc" },
    select: { lastScrapedAt: true },
  });

  const stats = [
    { value: totalArticles.toLocaleString("fr-FR"), label: "Articles indexés" },
    { value: recent.toLocaleString("fr-FR"), label: "Cette semaine" },
    { value: String(totalSources), label: "Sources actives" },
    {
      value: lastScrape?.lastScrapedAt
        ? new Date(lastScrape.lastScrapedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
        : "—",
      label: "Dernière MAJ",
    },
  ];

  return (
    <div
      className="rounded-2xl p-6 mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4"
      style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
    >
      {stats.map((s) => (
        <div key={s.label} className="text-center">
          <div
            className="text-2xl font-bold tabular-nums"
            style={{ color: "#1d1d1f", letterSpacing: "-0.03em" }}
          >
            {s.value}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "#aeaeb2" }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

async function ArticleFeed({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1"));
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (sp.q) {
    where.OR = [{ title: { contains: sp.q } }, { summary: { contains: sp.q } }];
  }
  if (sp.category) where.categories = { contains: sp.category };
  if (sp.source) {
    where.sourceId = sp.source;
  } else if (sp.type) {
    where.source = { type: sp.type };
  }
  if (sp.from || sp.to) {
    where.publishedAt = {};
    if (sp.from) (where.publishedAt as Record<string, unknown>).gte = new Date(sp.from);
    if (sp.to) (where.publishedAt as Record<string, unknown>).lte = new Date(sp.to);
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: { source: true },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.article.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  if (articles.length === 0) {
    return (
      <div
        className="text-center py-24 rounded-2xl"
        style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="text-5xl mb-4">📋</div>
        <p className="font-medium mb-1" style={{ color: "#1d1d1f" }}>
          Aucun article pour l&apos;instant
        </p>
        <p className="text-sm" style={{ color: "#6e6e73" }}>
          Cliquez sur &quot;Actualiser&quot; pour lancer la première veille.
        </p>
      </div>
    );
  }

  const articlesWithParsed = articles.map((a) => ({
    ...a,
    publishedAt: a.publishedAt.toISOString(),
    createdAt: a.createdAt.toISOString(),
    categories: JSON.parse(a.categories) as string[],
  })) as ArticleData[];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm" style={{ color: "#6e6e73" }}>
          <span className="font-semibold" style={{ color: "#1d1d1f" }}>{total}</span> résultat(s)
          {sp.q && <span> · &quot;{sp.q}&quot;</span>}
        </p>
        <p className="text-xs" style={{ color: "#aeaeb2" }}>
          Page {page} / {totalPages || 1}
        </p>
      </div>

      <div className="space-y-3">
        {articlesWithParsed.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {page > 1 && <PaginationLink page={page - 1} searchParams={sp} label="←" />}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
            return (
              <PaginationLink key={p} page={p} searchParams={sp} label={String(p)} active={p === page} />
            );
          })}
          {page < totalPages && <PaginationLink page={page + 1} searchParams={sp} label="→" />}
        </div>
      )}
    </div>
  );
}

function PaginationLink({
  page, searchParams, label, active,
}: {
  page: number;
  searchParams: Record<string, string | undefined>;
  label: string;
  active?: boolean;
}) {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => {
    if (v && k !== "page") params.set(k, v);
  });
  params.set("page", String(page));
  return (
    <Link
      href={`/?${params.toString()}`}
      className="w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium"
      style={{
        background: active ? "#0071e3" : "#ffffff",
        color: active ? "#ffffff" : "#1d1d1f",
        border: active ? "none" : "1px solid rgba(0,0,0,0.1)",
        boxShadow: active ? "0 2px 8px rgba(0,113,227,0.3)" : "none",
      }}
    >
      {label}
    </Link>
  );
}

export default async function HomePage({ searchParams }: PageProps) {
  const sources = await prisma.source.findMany({
    where: { active: true },
    orderBy: [{ type: "asc" }, { name: "asc" }],
    select: { id: true, name: true, type: true },
  });
  const sp = await searchParams;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">

      {/* Hero */}
      <div className="mb-8">
        <h1
          className="text-3xl font-bold mb-1"
          style={{ color: "#1d1d1f", letterSpacing: "-0.03em" }}
        >
          Veille Droit Social
        </h1>
        <p className="text-base" style={{ color: "#6e6e73" }}>
          Jurisprudence, doctrine et publications des cabinets spécialisés — actualisé quotidiennement.
        </p>
      </div>

      {/* Stats */}
      <Suspense fallback={<div className="h-24 rounded-2xl bg-white mb-8" />}>
        <StatsBar />
      </Suspense>

      {/* Search + Refresh */}
      <div className="flex gap-3 mb-8">
        <form className="flex-1" action="/" method="GET">
          <div className="relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "#aeaeb2" }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Rechercher une décision, un thème…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "#ffffff",
                border: "1px solid rgba(0,0,0,0.1)",
                color: "#1d1d1f",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            />
          </div>
        </form>
        <ImportButton />
        <ScrapeButton />
      </div>

      {/* Content layout */}
      <div className="flex gap-8">
        <Suspense fallback={<div className="w-56 shrink-0" />}>
          <FilterBar sources={sources} />
        </Suspense>

        <div className="flex-1 min-w-0">
          <Suspense
            fallback={
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-5 animate-pulse"
                    style={{ background: "#fff", height: "120px" }}
                  />
                ))}
              </div>
            }
          >
            <ArticleFeed searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
