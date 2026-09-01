import React from "react";
import { Search as SearchIcon, Filter } from "lucide-react";
import { api } from "@/lib/api";
import ArticleCard from "@/components/public/ArticleCard";

interface SearchPageProps {
  searchParams: {
    q?: string;
    category?: string;
    tag?: string;
    sort?: string;
    page?: string;
  };
}

export const metadata = {
  title: "Search News & Archives",
  description: "Search across verified news articles, topics, and editorial reporting.",
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || "";
  const category = searchParams.category;
  const tag = searchParams.tag;
  const sort = searchParams.sort || "latest";
  const page = parseInt(searchParams.page || "1", 10);

  let searchResults: any = { items: [], total: 0, pages: 1, page: 1 };
  let categories: any[] = [];

  try {
    const [res, cats] = await Promise.all([
      api.search(query, { category, tag, sort, page, size: 18 }),
      api.getCategories(),
    ]);
    searchResults = res;
    categories = cats;
  } catch (err) {
    console.error("Search error:", err);
  }

  return (
    <div className="space-y-8">
      {/* Search Header Form */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <h1 className="font-serif text-3xl font-bold text-gray-950">
          Search News Archive
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Explore articles across all desks, topics, and publishers.
        </p>

        <form method="GET" action="/search" className="mt-6 space-y-4">
          <div className="relative">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by keywords, companies, events, or people..."
              className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3 pl-5 pr-12 text-base text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <SearchIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-4 items-center text-sm pt-2">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 font-medium">Category:</span>
              <select
                name="category"
                defaultValue={category || ""}
                className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-gray-500 font-medium">Sort by:</span>
              <select
                name="sort"
                defaultValue={sort}
                className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="latest">Latest First</option>
                <option value="popular">Most Read</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-4 py-1.5 bg-gray-900 text-white rounded-lg font-medium text-xs hover:bg-gray-800 transition"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <h2 className="text-sm font-semibold text-gray-700">
          Found <span className="text-gray-950 font-bold">{searchResults.total}</span> stories
          {query && <span> for &ldquo;{query}&rdquo;</span>}
          {tag && <span> matching tag #{tag}</span>}
        </h2>
      </div>

      {/* Results Grid */}
      {searchResults.items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.items.map((art: any) => (
            <ArticleCard key={art.id} article={art} variant="standard" />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center max-w-md mx-auto">
          <SearchIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-gray-800">No matching articles found</h3>
          <p className="text-gray-500 text-sm mt-1">
            Try adjusting your search terms or clearing category filters.
          </p>
        </div>
      )}
    </div>
  );
}
