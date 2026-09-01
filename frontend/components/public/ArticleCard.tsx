import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, ExternalLink, Sparkles } from "lucide-react";
import { Article } from "@/types";
import { formatTimeAgo, getFullImageUrl } from "@/lib/utils";

interface ArticleCardProps {
  article: Article;
  variant?: "standard" | "compact" | "horizontal";
}

export default function ArticleCard({ article, variant = "standard" }: ArticleCardProps) {
  const imageUrl = getFullImageUrl(article.image?.storage_url);
  const timeAgo = formatTimeAgo(article.published_at || article.created_at);

  if (variant === "compact") {
    return (
      <article className="border-b border-gray-100 py-3 last:border-0 group">
        {article.category && (
          <Link
            href={`/category/${article.category.slug}`}
            className="text-[11px] font-bold text-blue-600 uppercase tracking-wider hover:underline"
          >
            {article.category.name}
          </Link>
        )}
        <h3 className="font-serif text-base font-semibold text-gray-900 leading-snug group-hover:text-blue-600 transition mt-1">
          <Link href={`/article/${article.slug}`}>{article.title}</Link>
        </h3>
        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1.5">
          <span>{timeAgo}</span>
          {article.source && (
            <>
              <span>•</span>
              <span className="text-gray-600 font-medium">{article.source.name}</span>
            </>
          )}
        </div>
      </article>
    );
  }

  if (variant === "horizontal") {
    return (
      <article className="flex space-x-4 py-4 border-b border-gray-100 last:border-0 group">
        <div className="relative w-28 h-20 sm:w-36 sm:h-24 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
          <img
            src={imageUrl}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            loading="lazy"
          />
        </div>
        <div className="flex flex-col justify-between flex-grow">
          <div>
            {article.category && (
              <Link
                href={`/category/${article.category.slug}`}
                className="text-[11px] font-bold text-blue-600 uppercase tracking-wider hover:underline"
              >
                {article.category.name}
              </Link>
            )}
            <h3 className="font-serif text-sm sm:text-base font-bold text-gray-900 leading-snug group-hover:text-blue-600 transition mt-0.5 line-clamp-2">
              <Link href={`/article/${article.slug}`}>{article.title}</Link>
            </h3>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500 mt-2">
            <span>{timeAgo}</span>
            {article.source && (
              <>
                <span>•</span>
                <span className="text-gray-700 font-medium">{article.source.name}</span>
              </>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col hover:shadow-md transition duration-200 group">
      {/* Image thumbnail */}
      <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
        <img
          src={imageUrl}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          loading="lazy"
        />
        {article.category && (
          <Link
            href={`/category/${article.category.slug}`}
            className="absolute top-3 left-3 bg-gray-900/85 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow-sm hover:bg-blue-600 transition"
          >
            {article.category.name}
          </Link>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col justify-between flex-grow">
        <div>
          <h3 className="font-serif text-lg font-bold text-gray-900 leading-snug group-hover:text-blue-600 transition">
            <Link href={`/article/${article.slug}`}>{article.title}</Link>
          </h3>
          {article.summary && (
            <p className="text-sm text-gray-600 line-clamp-3 mt-2 leading-relaxed">
              {article.summary}
            </p>
          )}
        </div>

        {/* Footer info & source badge */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeAgo}</span>
          </div>

          {article.source ? (
            <div className="flex items-center space-x-1 text-gray-700 font-medium bg-gray-100 px-2 py-0.5 rounded">
              <span>{article.source.name}</span>
            </div>
          ) : (
            <span className="text-blue-600 font-semibold">Editorial Desk</span>
          )}
        </div>
      </div>
    </article>
  );
}
