import { MetadataRoute } from "next";
import { api } from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/latest`,
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/copyright`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  try {
    const [categories, articlesRes] = await Promise.allSettled([
      api.getCategories(),
      api.getArticles({ size: 100, sort: "latest" }),
    ]);

    if (categories.status === "fulfilled") {
      for (const cat of categories.value) {
        routes.push({
          url: `${siteUrl}/category/${cat.slug}`,
          lastModified: new Date(),
          changeFrequency: "daily",
          priority: 0.8,
        });
      }
    }

    if (articlesRes.status === "fulfilled") {
      for (const art of articlesRes.value.items || []) {
        routes.push({
          url: `${siteUrl}/article/${art.slug}`,
          lastModified: art.updated_at ? new Date(art.updated_at) : new Date(art.created_at),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
  } catch (e) {
    console.error("Error generating sitemap:", e);
  }

  return routes;
}
