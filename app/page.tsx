import { Suspense } from "react";
import { prisma } from "../lib/db";
import { ArticleCard, ArticleData } from "../components/ArticleCard";
import { FilterBar } from "../components/FilterBar";
import { ScrapeButton } from "../components/ScrapeButton";
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

async function ArticleFeed({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1"));
  const limit = 20;

  const where: Record<string, unknown> = {};

  if (sp.q) {
    where.OR = [
      { title: { contains: sp.q } },
      { summary: { contains: sp.q } },
    ];
  }

  if (sp.category) {
    where.categories = { contains: sp.category };
  }

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
      <div className="text-center py-20">
        <div className="text-5xl mb-4">📋</div>
        <p className="text-gray-500 text-lg mb-2">Aucun article pour l&apos;instant</p>
        <p className="text-gray-400 text-sm">
          Cliquez sur &quot;Actualiser maintenant&quot; pour lancer la première veille.
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
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{total}</span> article(s) trouvé(s)
          {sp.q && (
            <span>
              {" "}pour &quot;<span className="text-blue-800">{sp.q}</span>&quot;
            </span>
          )}
        </p>
        <p className="text-xs text-gray-400">
          Page {page} / {totalPages || 1}
        </p>
      </div>

      <div className="space-y-4">
        {articlesWithParsed.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <PaginationLink page={page - 1} searchParams={sp} label="← Précédent" />
          )}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
            return (
              <PaginationLink
                key={p}
                page={p}
                searchParams={sp}
                label={String(p)}
                active={p === page}
              />
            );
          })}
          {page < totalPages && (
            <PaginationLink page={page + 1} searchParams={sp} label="Suivant →" />
          )}
        </div>
      )}
    </div>
  );
}

function PaginationLink({
  page,
  searchParams,
  label,
  active,
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
      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
        active
          ? "bg-blue-800 text-white"
          : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
      }`}
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
  const searchValue = sp.q ?? "";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search bar + actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <form className="flex-1" action="/" method="GET">
          <div className="flex gap-2">
            <input
              type="search"
              name="q"
              defaultValue={searchValue}
              placeholder="Rechercher une décision, un thème, un mot-clé..."
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 bg-white"
            />
            <button
              type="submit"
              className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Rechercher
            </button>
          </div>
        </form>
        <ScrapeButton />
      </div>

      {/* Content */}
      <div className="flex gap-8">
        {/* Filters sidebar */}
        <Suspense fallback={<div className="w-64 shrink-0" />}>
          <FilterBar sources={sources} />
        </Suspense>

        {/* Article feed */}
        <div className="flex-1 min-w-0">
          <Suspense
            fallback={
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse"
                  >
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-full mb-1" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
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
