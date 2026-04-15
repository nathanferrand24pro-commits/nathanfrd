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
    <article
      className="card-hover group"
      style={{
        background: "#ffffff",
        borderRadius: "16px",
        border: "1px solid rgba(0,0,0,0.06)",
        padding: "20px 24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Top row: source badge + date */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-wrap gap-1.5">
          <SourceBadge name={article.source.name} type={article.source.type} />
          {article.categories.slice(0, 2).map((cat) => (
            <CategoryBadge key={cat} category={cat} />
          ))}
        </div>
        <span className="text-xs shrink-0 ml-3" style={{ color: "#aeaeb2" }}>
          {formatDate(article.publishedAt)}
        </span>
      </div>

      {/* Title */}
      <h2 className="font-semibold leading-snug mb-2" style={{ color: "#1d1d1f", fontSize: "15px", letterSpacing: "-0.01em" }}>
        <Link
          href={`/article/${article.id}`}
          className="hover:opacity-70"
          style={{ color: "inherit" }}
        >
          {article.title}
        </Link>
      </h2>

      {/* Summary */}
      {article.summary && (
        <p className="text-sm line-clamp-2 mb-4" style={{ color: "#6e6e73", lineHeight: "1.5" }}>
          {article.summary}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid #f2f2f7" }}>
        <Link
          href={`/article/${article.id}`}
          className="text-xs font-medium"
          style={{ color: "#0071e3" }}
        >
          Lire le résumé
        </Link>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs flex items-center gap-1"
          style={{ color: "#aeaeb2" }}
        >
          Source originale
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </article>
  );
}
