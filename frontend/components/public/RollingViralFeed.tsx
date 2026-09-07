import React from "react";
import Link from "next/link";
import { Flame, Clock, Layers, ArrowUpRight, Radio, Sparkles, CheckCircle2 } from "lucide-react";
import { HotNewsItem, HotNewsResponse } from "@/types";

interface RollingViralFeedProps {
  hotNewsData?: HotNewsResponse | null;
}

export default function RollingViralFeed({ hotNewsData }: RollingViralFeedProps) {
  const items = hotNewsData?.items || [];
  const activeCount = hotNewsData?.count ?? items.length;
  const maxItems = hotNewsData?.max_items ?? 30;
  const remainingSlots = hotNewsData?.remaining_slots ?? Math.max(0, maxItems - activeCount);

  // Helper for relative time
  const getRelativeTime = (dateStr?: string) => {
    if (!dateStr) return "Just now";
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return "Recently";
    }
  };

  // Helper for score badge styling
  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-red-500/10 text-red-600 border-red-200 dark:border-red-900/40";
    if (score >= 75) return "bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-900/40";
    return "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/40";
  };

  return (
    <section className="bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-800 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
              <Radio className="w-3.5 h-3.5 mr-1.5 text-red-400" />
              Live Viral Pulse
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-800 text-gray-300 border border-gray-700">
              <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
              12h Rolling Window
            </span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white mt-2.5 tracking-tight flex items-center">
            Rolling Viral News <span className="text-red-500 ml-2">30</span>
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-xl">
            Continuously ranked across global wire reports via SimHash deduplication, cross-source confirmation, and real-time viral scoring.
          </p>
        </div>

        {/* Capacity Indicator Meter */}
        <div className="bg-gray-800/80 backdrop-blur-md border border-gray-700/80 rounded-2xl p-4 flex-shrink-0 flex flex-col justify-center min-w-[220px]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-400 font-medium">Feed Capacity:</span>
            <span className="font-bold text-white">
              <span className="text-emerald-400">{activeCount}</span> / {maxItems} Slots
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-gray-700 h-2.5 rounded-full overflow-hidden flex">
            <div
              className="bg-gradient-to-r from-orange-500 to-red-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${(activeCount / maxItems) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2">
            <span className="flex items-center text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3 h-3 mr-1" /> {activeCount} Active
            </span>
            <span className="text-gray-400">
              {remainingSlots > 0 ? `${remainingSlots} Available Slots` : "Full (Top 30 Contested)"}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Stories (Supporting 20 + 10 Slot Layout) */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-6">
        {/* Render Real Active Stories */}
        {items.map((item, index) => {
          const rank = index + 1;
          const targetUrl = item.slug ? `/article/${item.slug}` : (item.source_url || "#");
          const isInternal = Boolean(item.slug);

          return (
            <div
              key={item.id}
              className="bg-gray-800/60 hover:bg-gray-800/90 border border-gray-700/70 hover:border-gray-600 rounded-2xl p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between group hover:shadow-xl hover:-translate-y-0.5"
            >
              <div>
                {/* Card Top: Rank & Viral Score */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-7 h-7 rounded-lg bg-gray-900 border border-gray-700 font-black text-xs flex items-center justify-center text-gray-300">
                      #{rank}
                    </span>
                    {item.source_name && (
                      <span className="text-[11px] font-semibold text-gray-400 truncate max-w-[130px]">
                        {item.source_name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {item.source_count > 1 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        <Layers className="w-3 h-3 mr-1" />
                        {item.source_count} Sources
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold border ${getScoreColor(
                        item.viral_score
                      )}`}
                    >
                      <Flame className="w-3 h-3 mr-0.5 fill-current" />
                      {item.viral_score}
                    </span>
                  </div>
                </div>

                {/* Title */}
                {isInternal ? (
                  <Link href={targetUrl} className="block group-hover:text-red-400 transition-colors">
                    <h3 className="font-serif text-base font-bold text-white line-clamp-2 leading-snug">
                      {item.title}
                    </h3>
                  </Link>
                ) : (
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="block group-hover:text-red-400 transition-colors"
                  >
                    <h3 className="font-serif text-base font-bold text-white line-clamp-2 leading-snug flex items-start justify-between">
                      <span>{item.title}</span>
                      <ArrowUpRight className="w-4 h-4 ml-1 flex-shrink-0 opacity-70 group-hover:opacity-100" />
                    </h3>
                  </a>
                )}

                {/* Summary Excerpt */}
                {item.summary && (
                  <p className="text-gray-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>
                )}
              </div>

              {/* Card Footer: Metadata & Age */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-700/50 text-[11px] text-gray-400">
                <span className="capitalize font-medium text-gray-300 bg-gray-900/60 px-2 py-0.5 rounded">
                  {item.category_slug || "World"}
                </span>
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1 text-gray-500" />
                  {getRelativeTime(item.published_at || item.added_at)}
                </span>
              </div>
            </div>
          );
        })}

        {/* Render Available / Open Slots (20 + 10 Capacity Visualization) */}
        {remainingSlots > 0 &&
          Array.from({ length: remainingSlots }).map((_, i) => {
            const slotNumber = activeCount + i + 1;
            return (
              <div
                key={`empty-slot-${slotNumber}`}
                className="border-2 border-dashed border-gray-800/80 hover:border-gray-700/80 bg-gray-900/20 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-colors min-h-[160px]"
              >
                <div className="flex items-center justify-between text-gray-500">
                  <span className="w-7 h-7 rounded-lg bg-gray-900/80 border border-gray-800 font-bold text-xs flex items-center justify-center text-gray-500">
                    #{slotNumber}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-800/50 text-gray-400">
                    <Sparkles className="w-3 h-3 mr-1 text-gray-500" /> Open Position
                  </span>
                </div>

                <div className="my-auto py-2">
                  <p className="text-xs font-semibold text-gray-400">
                    Evaluating incoming wire reports...
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Position reserved for qualifying breaking or cross-verified news stories.
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-800/40 text-[10px] text-gray-500 flex items-center justify-between">
                  <span>Zero fabricated news</span>
                  <span>12h Rolling TTL</span>
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
