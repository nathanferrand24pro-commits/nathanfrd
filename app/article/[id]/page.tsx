import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "../../../lib/db";
import { SourceBadge, CategoryBadge } from "../../../components/SourceBadge";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ArticlePage({ params }: PageProps) {
  const { id } = await params;

  const article = await prisma.article.findUnique({
    where: { id },
    include: { source: true },
  });

  if (!article) notFound();

  const categories = JSON.parse(article.categories) as string[];

  const formattedDate = new Date(article.publishedAt).toLocaleDateString(
    "fr-FR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back */}
      <Link
        href="/"
        className="text-sm text-blue-800 hover:underline mb-6 inline-flex items-center gap-1"
      >
        ← Retour au tableau de bord
      </Link>

      {/* Article */}
      <article className="bg-white rounded-xl border border-gray-200 p-8 mt-4">
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <SourceBadge name={article.source.name} type={article.source.type} />
          {categories.map((cat) => (
            <CategoryBadge key={cat} category={cat} />
          ))}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
          {article.title}
        </h1>

        {/* Meta */}
        <p className="text-sm text-gray-400 mb-6 capitalize">{formattedDate}</p>

        {/* Summary */}
        {article.summary && (
          <div className="bg-blue-50 border-l-4 border-blue-800 rounded-r-lg p-4 mb-6">
            <p className="text-sm text-gray-700 leading-relaxed">{article.summary}</p>
          </div>
        )}

        {/* CTA */}
        <div className="border-t border-gray-100 pt-6 mt-6">
          <p className="text-sm text-gray-500 mb-3">
            Pour lire la décision complète, consultez la source originale :
          </p>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-blue-800 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Accéder à la source originale
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </article>

      {/* Source info */}
      <div className="mt-6 text-sm text-gray-400 text-center">
        Source :{" "}
        <span className="font-medium text-gray-600">{article.source.name}</span>
        {" · "}
        <span
          className={
            article.source.type === "officiel"
              ? "text-blue-800"
              : "text-amber-600"
          }
        >
          {article.source.type === "officiel"
            ? "Source officielle"
            : "Cabinet d'avocats"}
        </span>
      </div>
    </div>
  );
}
