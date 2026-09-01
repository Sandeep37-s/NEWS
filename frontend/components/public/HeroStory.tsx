import React from "react";
import Link from "next/link";
import { Clock, User, Sparkles } from "lucide-react";
import { Article } from "@/types";
import { formatTimeAgo, getFullImageUrl } from "@/lib/utils";

interface HeroStoryProps {
  article: Article;
}

export default function HeroStory({ article }: HeroStoryProps) {
  const imageUrl = getFullImageUrl(article.image?.storage_url);
  const timeAgo = formatTimeAgo(article.published_at || article.created_at);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Leading Image */}
        <div className="lg:col-span-7 relative h-72 sm:h-96 lg:h-full min-h-[320px] bg-gray-100 overflow-hidden group">
          <img
            src={imageUrl}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
          {article.category && (
            <Link
              href={`/category/${article.category.slug}`}
              className="absolute top-4 left-4 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded shadow-lg hover:bg-blue-700 transition"
            >
              {article.category.name}
            </Link>
          )}
        </div>

        {/* Lead Narrative */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs text-red-600 font-bold uppercase tracking-wider mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <span>Lead Story</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-950 leading-tight hover:text-blue-600 transition">
              <Link href={`/article/${article.slug}`}>{article.title}</Link>
            </h2>

            {article.summary && (
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed mt-4 line-clamp-4">
                {article.summary}
              </p>
            )}
          </div>

          <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <User className="w-3.5 h-3.5 mr-1" />
                {article.author || "News Desk"}
              </span>
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1" />
                {timeAgo}
              </span>
            </div>

            {article.source && (
              <span className="text-gray-700 font-semibold bg-gray-100 px-2.5 py-1 rounded">
                Source: {article.source.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
