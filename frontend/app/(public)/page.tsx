import React from "react";
import Link from "next/link";
import { ArrowRight, Flame, Sparkles, TrendingUp, Rss } from "lucide-react";
import { api } from "@/lib/api";
import HeroStory from "@/components/public/HeroStory";
import ArticleCard from "@/components/public/ArticleCard";

export const revalidate = 60; // ISR revalidate every 60 seconds

export default async function HomePage() {
  let latestArticles: any[] = [];
  let featuredArticles: any[] = [];
  let categories: any[] = [];
  let tags: any[] = [];

  try {
    const [latestRes, featuredRes, categoriesRes, tagsRes] = await Promise.allSettled([
      api.getArticles({ size: 15, sort: "latest" }),
      api.getFeaturedArticles(5),
      api.getCategories(),
      api.getPopularTags(15),
    ]);

    if (latestRes.status === "fulfilled") latestArticles = latestRes.value.items || [];
    if (featuredRes.status === "fulfilled") featuredArticles = featuredRes.value.items || [];
    if (categoriesRes.status === "fulfilled") categories = categoriesRes.value || [];
    if (tagsRes.status === "fulfilled") tags = tagsRes.value || [];
  } catch (err) {
    console.error("Error loading home data:", err);
  }

  const leadStory = featuredArticles[0] || latestArticles[0];
  const sideArticles = latestArticles.slice(1, 6);
  const gridArticles = latestArticles.slice(6, 12);

  // Group by category for section blocks
  const techArticles = latestArticles.filter((a) => a.category?.slug === "technology").slice(0, 3);
  const worldArticles = latestArticles.filter((a) => a.category?.slug === "world" || a.category?.slug === "india").slice(0, 3);

  return (
    <div className="space-y-12">
      {/* Top Topic Badges */}
      {tags.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 text-xs border-b border-gray-200">
          <span className="flex items-center font-bold text-gray-500 uppercase tracking-wider flex-shrink-0">
            <Flame className="w-3.5 h-3.5 mr-1 text-red-500" /> Trending Topics:
          </span>
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/search?tag=${tag.slug}`}
              className="px-2.5 py-1 bg-white border border-gray-200 rounded-full hover:border-blue-500 hover:text-blue-600 transition flex-shrink-0 text-gray-700"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      )}

      {/* Main Top Section */}
      {leadStory ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Lead Story */}
          <div className="lg:col-span-8">
            <HeroStory article={leadStory} />
          </div>

          {/* Real-time Wire Sidebar */}
          <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
              <h3 className="font-serif text-lg font-bold text-gray-900 flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse mr-2" />
                Live Wire Feed
              </h3>
              <Link href="/latest" className="text-xs font-semibold text-blue-600 hover:underline flex items-center">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>

            <div className="divide-y divide-gray-100">
              {sideArticles.map((art) => (
                <ArticleCard key={art.id} article={art} variant="compact" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State / Quick Starter Guide */
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center max-w-2xl mx-auto my-12">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-gray-900">Welcome to Chronicle News</h2>
          <p className="text-gray-600 text-sm mt-2 max-w-md mx-auto">
            Your platform is installed and configured. To populate news, log in to the admin panel and trigger automated feed ingestion or create original articles.
          </p>
          <div className="mt-6 flex justify-center space-x-4">
            <Link
              href="/admin/login"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
            >
              Open Admin Desk
            </Link>
          </div>
        </div>
      )}

      {/* Primary News Grid */}
      {gridArticles.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b-2 border-gray-950 pb-2">
            <h2 className="font-serif text-2xl font-bold text-gray-950">Top Stories & Analysis</h2>
            <Link href="/latest" className="text-sm font-semibold text-blue-600 hover:underline flex items-center">
              All Stories <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridArticles.map((art) => (
              <ArticleCard key={art.id} article={art} variant="standard" />
            ))}
          </div>
        </section>
      )}

      {/* Technology & Science Section */}
      {techArticles.length > 0 && (
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b-2 border-blue-600 pb-2">
            <h2 className="font-serif text-2xl font-bold text-gray-950">Technology & Innovation</h2>
            <Link href="/category/technology" className="text-sm font-semibold text-blue-600 hover:underline flex items-center">
              Explore Tech <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {techArticles.map((art) => (
              <ArticleCard key={art.id} article={art} variant="standard" />
            ))}
          </div>
        </section>
      )}

      {/* Categories Horizontal Banner */}
      <section className="bg-gray-900 text-white rounded-2xl p-8">
        <div className="max-w-3xl">
          <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">
            Editorial Desks
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mt-2">
            Discover Global News by Section
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            Browse verified coverage curated across international geopolitics, economic trends, medical advances, and scientific breakthroughs.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="p-3 bg-gray-800/80 hover:bg-blue-600 border border-gray-700 hover:border-blue-500 rounded-lg text-center transition group"
            >
              <span className="text-sm font-semibold block group-hover:text-white">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
