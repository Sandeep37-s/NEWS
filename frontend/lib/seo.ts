import { Article } from "@/types";
import { getFullImageUrl } from "./utils";

export function generateNewsArticleJsonLd(article: Article, siteUrl: string) {
  const imageUrl = getFullImageUrl(article.image?.storage_url);
  const articleUrl = `${siteUrl}/article/${article.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    "headline": article.title,
    "description": article.summary || article.title,
    "image": [imageUrl],
    "datePublished": article.published_at || article.created_at,
    "dateModified": article.updated_at || article.created_at,
    "author": {
      "@type": "Person",
      "name": article.author || "Chronicle Newsroom",
    },
    "publisher": {
      "@type": "Organization",
      "name": "Chronicle News",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo.png`,
      },
    },
    ...(article.source && {
      "isBasedOn": article.original_url || article.source.website_url,
      "provider": {
        "@type": "NewsMediaOrganization",
        "name": article.source.name,
        "url": article.source.website_url,
      },
    }),
  };
}

export function generateWebSiteJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Chronicle News",
    "url": siteUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
