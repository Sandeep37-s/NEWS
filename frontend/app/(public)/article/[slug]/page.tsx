import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { Clock, User, ExternalLink, ShieldCheck, Tag as TagIcon, Sparkles, BookOpen } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate, formatTimeAgo, estimateReadingTime, getFullImageUrl } from "@/lib/utils";
import { generateNewsArticleJsonLd } from "@/lib/seo";
import SocialShare from "@/components/public/SocialShare";
import ArticleCard from "@/components/public/ArticleCard";

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  try {
    const article = await api.getArticleBySlug(params.slug);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const imageUrl = getFullImageUrl(article.image?.storage_url);

    return {
      title: article.title,
      description: article.summary || article.title,
      alternates: {
        canonical: `${siteUrl}/article/${article.slug}`,
      },
      openGraph: {
        title: article.title,
        description: article.summary || article.title,
        url: `${siteUrl}/article/${article.slug}`,
        siteName: "Chronicle News",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: article.title,
          },
        ],
        type: "article",
        publishedTime: article.published_at || article.created_at,
        authors: [article.author || "Chronicle Editorial Team"],
      },
      twitter: {
        card: "summary_large_image",
        title: article.title,
        description: article.summary || article.title,
        images: [imageUrl],
      },
    };
  } catch {
    return {
      title: "Article Not Found",
    };
  }
}

export const revalidate = 30;

export default async function ArticlePage({ params }: ArticlePageProps) {
  let article: any = null;
  let relatedArticles: any[] = [];

  try {
    article = await api.getArticleBySlug(params.slug);
    if (article.category?.slug) {
      const relRes = await api.getArticles({ category: article.category.slug, size: 4 });
      relatedArticles = (relRes.items || []).filter((a: any) => a.id !== article.id).slice(0, 3);
    }
  } catch (err) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const jsonLd = generateNewsArticleJsonLd(article, siteUrl);
  const imageUrl = getFullImageUrl(article.image?.storage_url);
  const readingTime = estimateReadingTime(article.content || article.summary);
  const currentUrl = `${siteUrl}/article/${article.slug}`;

  return (
    <>
      {/* Schema.org NewsArticle Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-4xl mx-auto space-y-8">
        {/* Category & Metadata Breadcrumbs */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider">
            {article.category && (
              <Link
                href={`/category/${article.category.slug}`}
                className="text-blue-600 hover:underline bg-blue-50 px-2.5 py-1 rounded"
              >
                {article.category.name}
              </Link>
            )}
            <span className="text-gray-300">•</span>
            <span className="text-gray-500 flex items-center">
              <BookOpen className="w-3.5 h-3.5 mr-1" /> {readingTime} min read
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-gray-950 leading-tight">
            {article.title}
          </h1>

          {/* Subheader / Author / Date */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-y border-gray-200 text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span className="flex items-center font-medium text-gray-900">
                <User className="w-4 h-4 mr-1.5 text-gray-500" />
                {article.author || "News Desk"}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-gray-500" />
                {formatDate(article.published_at || article.created_at)}
              </span>
            </div>

            {/* Social Share Controls */}
            <SocialShare title={article.title} url={currentUrl} />
          </div>
        </div>

        {/* Executive Summary / Key Takeaway Callout */}
        {article.summary && (
          <div className="bg-amber-50/70 border-l-4 border-amber-500 p-5 rounded-r-xl">
            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-900 flex items-center mb-2">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-600" /> Executive Briefing
            </h3>
            <p className="text-gray-800 text-base sm:text-lg leading-relaxed font-serif">
              {article.summary}
            </p>
          </div>
        )}

        {/* Featured Image */}
        {article.image && (
          <figure className="space-y-2">
            <div className="relative w-full h-80 sm:h-[450px] bg-gray-100 rounded-xl overflow-hidden shadow-sm">
              <img
                src={imageUrl}
                alt={article.image.alt_text || article.title}
                className="w-full h-full object-cover"
              />
            </div>
            {article.image.original_source && (
              <figcaption className="text-xs text-gray-500 text-right italic">
                Photo credit / License: {article.image.original_source} ({article.image.license_type})
              </figcaption>
            )}
          </figure>
        )}

        {/* Article Body Content */}
        <div
          className="prose prose-lg max-w-none text-gray-800 leading-relaxed space-y-6 font-serif"
          dangerouslySetInnerHTML={{ __html: article.content || `<p>${article.summary}</p>` }}
        />

        {/* Source Attribution & Copyright Card */}
        {article.source && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-gray-700">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Source Attribution & Editorial Policy</span>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              This news summary is curated and synthesized from reporting by{" "}
              <strong className="text-gray-900">{article.source.name}</strong>. Chronicle News maintains strict attribution standards and provides direct links to the original reporting.
            </p>

            {article.original_url && (
              <div className="pt-2">
                <a
                  href={article.original_url}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 hover:border-blue-500 hover:text-blue-600 rounded-lg text-sm font-semibold text-gray-800 transition shadow-sm"
                >
                  <span>Read Original Story on {article.source.name}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Tags Section */}
        {article.tags && article.tags.length > 0 && (
          <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center mr-2">
              <TagIcon className="w-3.5 h-3.5 mr-1" /> Topics:
            </span>
            {article.tags.map((tag: any) => (
              <Link
                key={tag.id}
                href={`/search?tag=${tag.slug}`}
                className="px-3 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 text-xs font-medium rounded-full transition"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Bottom Social Share */}
        <div className="pt-6 border-t border-gray-200 flex justify-between items-center">
          <Link
            href="/"
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            ← Back to Homepage
          </Link>
          <SocialShare title={article.title} url={currentUrl} />
        </div>

        {/* Related Stories */}
        {relatedArticles.length > 0 && (
          <section className="pt-12 space-y-6">
            <h3 className="font-serif text-2xl font-bold text-gray-950 border-b-2 border-gray-950 pb-2">
              Related Coverage in {article.category?.name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedArticles.map((art) => (
                <ArticleCard key={art.id} article={art} variant="standard" />
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
