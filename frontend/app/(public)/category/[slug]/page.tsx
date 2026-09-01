import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { api } from "@/lib/api";
import ArticleCard from "@/components/public/ArticleCard";

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const catSlug = params.slug.toLowerCase();
  try {
    const category = await api.getCategoryBySlug(catSlug);
    return {
      title: `${category.name} News & Updates`,
      description: category.description || `Latest news, updates, and in-depth reporting in ${category.name}.`,
    };
  } catch {
    return {
      title: `${catSlug.charAt(0).toUpperCase() + catSlug.slice(1)} News`,
    };
  }
}

export const revalidate = 60;

export default async function CategoryPage({ params }: CategoryPageProps) {
  const catSlug = params.slug.toLowerCase();
  let category: any = null;
  let articles: any[] = [];

  try {
    const [catData, articlesData] = await Promise.allSettled([
      api.getCategoryBySlug(catSlug),
      api.getArticles({ category: catSlug, size: 24, sort: "latest" }),
    ]);

    if (catData.status === "fulfilled") {
      category = catData.value;
    } else {
      const prettyName = catSlug.charAt(0).toUpperCase() + catSlug.slice(1);
      category = {
        name: prettyName,
        slug: catSlug,
        description: `Comprehensive news, analysis, and reports in ${prettyName}.`,
      };
    }

    if (articlesData.status === "fulfilled") {
      articles = articlesData.value.items || [];
    }
  } catch (err) {
    category = {
      name: catSlug.charAt(0).toUpperCase() + catSlug.slice(1),
      slug: catSlug,
      description: `News coverage for ${catSlug}.`,
    };
  }

  return (
    <div className="space-y-8">
      {/* Category Header */}
      <div className="border-b-2 border-gray-950 pb-4">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
          Editorial Desk
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-950 mt-1">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-gray-600 text-sm sm:text-base mt-2 max-w-2xl">
            {category.description}
          </p>
        )}
      </div>

      {/* Articles Grid */}
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((art) => (
            <ArticleCard key={art.id} article={art} variant="standard" />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center max-w-md mx-auto my-8">
          <h3 className="font-serif text-xl font-bold text-gray-900">No articles yet</h3>
          <p className="text-gray-500 text-sm mt-2">
            Coverage for {category.name} will appear as stories are curated.
          </p>
        </div>
      )}
    </div>
  );
}
