import React from "react";
import Link from "next/link";
import { Clock, Rss } from "lucide-react";
import { api } from "@/lib/api";
import ArticleCard from "@/components/public/ArticleCard";

export const metadata = {
  title: "Latest News Wire",
  description: "Real-time updates, breaking developments, and chronological live news stream.",
};

export const revalidate = 30; // Revalidate every 30 seconds

export default async function LatestNewsPage() {
  let articles: any[] = [];

  try {
    const res = await api.getArticles({ size: 24, sort: "latest" });
    articles = res.items || [];
  } catch (err) {
    console.error("Failed to load latest wire:", err);
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b-2 border-red-600 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-red-600 text-xs font-bold uppercase tracking-widest">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <span>Real-Time Stream</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-950 mt-1">
            Latest News Wire
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Continuous chronological feed of verified global stories and summaries.
          </p>
        </div>
      </div>

      {/* Feed List */}
      {articles.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm divide-y divide-gray-100">
          {articles.map((art) => (
            <ArticleCard key={art.id} article={art} variant="horizontal" />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800">No recent wire stories</h3>
          <p className="text-gray-500 text-sm mt-1">
            New updates will appear here automatically as feeds are processed.
          </p>
        </div>
      )}
    </div>
  );
}
