"use client";

import Link from "next/link";
import { SourceBadge, CategoryBadge } from "./SourceBadge";

export interface ArticleData {
  id: string;
  title: string;
  summary?: string | null;
  url: string;
  publishedAt: string;
  categories: string[];
  source: {
    id: string;
    name: string;
    type: string;
  };
}

interface ArticleCardProps {
  article: ArticleData;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex flex-wrap gap-2 mb-3">
        <SourceBadge name={article.source.name} type={article.source.type} />
        {article.categories.slice(0, 3).map((cat) => (
          <CategoryBadge key={cat} category={cat} />
        ))}
      </div>

      <h2 className="text-base font-semibold text-gray-900 mb-2 leading-snug">
        <Link
          href={`/article/${article.id}`}
          className="hover:text-blue-800 transition-colors"
        >
          {article.title}
        </Link>
      </h2>

      {article.summary && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
          {article.summary}
        </p>
      )}

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-400">{formatDate(article.publishedAt)}</span>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-700 hover:underline"
        >
          Source originale →
        </a>
      </div>
    </article>
  );
}
