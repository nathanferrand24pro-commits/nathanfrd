import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "../../../lib/db";
import { SourceBadge, CategoryBadge } from "../../../components/SourceBadge";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ArticlePage({ params }: PageProps) {
  const { id } = await params;
  const article = await prisma.article.findUnique({ where: { id }, include: { source: true } });
  if (!article) notFound();

  const categories = JSON.parse(article.categories) as string[];
  const formattedDate = new Date(article.publishedAt).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm mb-8 font-medium"
        style={{ color: "#0071e3" }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Tableau de bord
      </Link>

      <article
        className="rounded-2xl p-8"
        style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
      >
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-5">
          <SourceBadge name={article.source.name} type={article.source.type} />
          {categories.map((cat) => <CategoryBadge key={cat} category={cat} />)}
        </div>

        {/* Title */}
        <h1
          className="text-2xl font-bold leading-tight mb-3"
          style={{ color: "#1d1d1f", letterSpacing: "-0.02em" }}
        >
          {article.title}
        </h1>

        {/* Date */}
        <p className="text-sm capitalize mb-7" style={{ color: "#aeaeb2" }}>{formattedDate}</p>

        {/* Summary */}
        {article.summary && (
          <div
            className="rounded-xl p-5 mb-7"
            style={{ background: "#f5f5f7", borderLeft: "3px solid #0071e3" }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "#1d1d1f" }}>
              {article.summary}
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="pt-6" style={{ borderTop: "1px solid #f2f2f7" }}>
          <p className="text-sm mb-4" style={{ color: "#6e6e73" }}>
            Consultez la décision complète sur la source originale :
          </p>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl"
            style={{ background: "#0071e3", color: "#fff", boxShadow: "0 2px 8px rgba(0,113,227,0.3)" }}
          >
            Accéder à la source
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </article>

      <p className="text-xs text-center mt-6" style={{ color: "#aeaeb2" }}>
        {article.source.name} ·{" "}
        <span style={{ color: article.source.type === "officiel" ? "#0071e3" : "#d4720a" }}>
          {article.source.type === "officiel" ? "Source officielle" : article.source.type === "europeen" ? "Source européenne" : "Cabinet d'avocats"}
        </span>
      </p>
    </div>
  );
}
