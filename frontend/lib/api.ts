import { Article, ArticleListResponse, Category, Tag, Source, DashboardStats, ProcessingJob, AuditLog, User } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Generic fetcher supporting SSR and client side
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Attach stored JWT token from localStorage on browser side if not explicitly provided
  if (typeof window !== "undefined" && !headers.has("Authorization")) {
    const token = localStorage.getItem("access_token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // Next.js caching options
  const defaultOptions: RequestInit = {
    ...options,
    headers,
    signal: options.signal || (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal ? AbortSignal.timeout(15000) : undefined),
    credentials: "include", // For HTTP-only JWT cookies
  };

  const response = await fetch(url, defaultOptions);

  if (!response.ok) {
    let errorDetail = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {}
    throw new Error(errorDetail);
  }

  return response.json();
}

// -----------------------------------------------------------------------------
// PUBLIC API
// -----------------------------------------------------------------------------
export const api = {
  // Articles
  getArticles: (params?: { category?: string; tag?: string; page?: number; size?: number; sort?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append("category", params.category);
    if (params?.tag) searchParams.append("tag", params.tag);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.size) searchParams.append("size", params.size.toString());
    if (params?.sort) searchParams.append("sort", params.sort);
    
    return apiFetch<ArticleListResponse>(`/articles?${searchParams.toString()}`, { next: { revalidate: 60 } });
  },

  getLatestArticles: (limit = 10) => {
    return apiFetch<ArticleListResponse>(`/articles/latest?limit=${limit}`, { next: { revalidate: 30 } });
  },

  getFeaturedArticles: (limit = 5) => {
    return apiFetch<ArticleListResponse>(`/articles/featured?limit=${limit}`, { next: { revalidate: 60 } });
  },

  getArticleBySlug: (slug: string) => {
    return apiFetch<Article>(`/articles/${slug}`, { next: { revalidate: 30 } });
  },

  // Categories & Tags
  getCategories: () => {
    return apiFetch<Category[]>("/categories", { next: { revalidate: 300 } });
  },

  getCategoryBySlug: (slug: string) => {
    return apiFetch<Category>(`/categories/${slug}`, { next: { revalidate: 300 } });
  },

  getPopularTags: (limit = 20) => {
    return apiFetch<Tag[]>(`/tags?limit=${limit}`, { next: { revalidate: 300 } });
  },

  // Search
  search: (query: string, params?: { category?: string; tag?: string; page?: number; size?: number; sort?: string }) => {
    const searchParams = new URLSearchParams();
    searchParams.append("q", query);
    if (params?.category) searchParams.append("category", params.category);
    if (params?.tag) searchParams.append("tag", params.tag);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.size) searchParams.append("size", params.size.toString());
    if (params?.sort) searchParams.append("sort", params.sort);
    return apiFetch<ArticleListResponse>(`/search?${searchParams.toString()}`, { cache: "no-store" });
  },

  // ---------------------------------------------------------------------------
  // AUTH
  // ---------------------------------------------------------------------------
  login: async (credentials: { email: string; password: string }) => {
    const res = await apiFetch<{ access_token: string; token_type: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (typeof window !== "undefined" && res.access_token) {
      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("auth_user", JSON.stringify(res.user));
    }
    return res;
  },

  logout: async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("auth_user");
    }
    return apiFetch<{ message: string }>("/auth/logout", { method: "POST" });
  },

  getCurrentUser: (token?: string) => {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return apiFetch<User>("/auth/me", { headers, cache: "no-store" });
  },

  // ---------------------------------------------------------------------------
  // ADMIN API
  // ---------------------------------------------------------------------------
  admin: {
    getDashboardStats: (token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return apiFetch<DashboardStats>("/admin/dashboard", { headers, cache: "no-store" });
    },

    getArticles: (params?: { status?: string; category_id?: string; source_id?: string; q?: string; page?: number; size?: number }, token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.append("status", params.status);
      if (params?.category_id) searchParams.append("category_id", params.category_id);
      if (params?.source_id) searchParams.append("source_id", params.source_id);
      if (params?.q) searchParams.append("q", params.q);
      if (params?.page) searchParams.append("page", params.page.toString());
      if (params?.size) searchParams.append("size", params.size.toString());

      return apiFetch<ArticleListResponse>(`/admin/articles?${searchParams.toString()}`, { headers, cache: "no-store" });
    },

    getArticleById: (id: string, token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return apiFetch<Article>(`/admin/articles/${id}`, { headers, cache: "no-store" });
    },

    createArticle: (data: Omit<Partial<Article>, 'tags'> & { tags?: string[] }, token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return apiFetch<Article>("/admin/articles", {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
    },

    updateArticle: (id: string, data: Omit<Partial<Article>, 'tags'> & { tags?: string[] }, token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return apiFetch<Article>(`/admin/articles/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
      });
    },

    deleteArticle: (id: string, token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return apiFetch<{ message: string }>(`/admin/articles/${id}`, {
        method: "DELETE",
        headers,
      });
    },

    publishArticle: (id: string, token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return apiFetch<Article>(`/admin/articles/${id}/publish`, {
        method: "POST",
        headers,
      });
    },

    rejectArticle: (id: string, reason?: string, token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const url = reason ? `/admin/articles/${id}/reject?reason=${encodeURIComponent(reason)}` : `/admin/articles/${id}/reject`;
      return apiFetch<Article>(url, {
        method: "POST",
        headers,
      });
    },

    scheduleArticle: (id: string, scheduledAt: string, token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return apiFetch<Article>(`/admin/articles/${id}/schedule?scheduled_at=${encodeURIComponent(scheduledAt)}`, {
        method: "POST",
        headers,
      });
    },

    // Sources
    getSources: (token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return apiFetch<Source[]>("/admin/sources", { headers, cache: "no-store" });
    },

    createSource: (data: Partial<Source>, token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return apiFetch<Source>("/admin/sources", {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
    },

    updateSource: (id: string, data: Partial<Source>, token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return apiFetch<Source>(`/admin/sources/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
      });
    },

    deleteSource: (id: string, token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return apiFetch<{ message: string }>(`/admin/sources/${id}`, {
        method: "DELETE",
        headers,
      });
    },

    testSource: (id: string, token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return apiFetch<{ status: string; message: string; sample_articles?: any[] }>(`/admin/sources/${id}/test`, {
        method: "POST",
        headers,
      });
    },

    fetchSourceNow: (id: string, token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return apiFetch<ProcessingJob>(`/admin/sources/${id}/fetch-now`, {
        method: "POST",
        headers,
      });
    },

    // Jobs & Ingestion
    getJobs: (limit = 30, token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return apiFetch<ProcessingJob[]>(`/admin/jobs?limit=${limit}`, { headers, cache: "no-store" });
    },

    triggerAllIngestion: (token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return apiFetch<{ status: string; message: string; jobs_summary: any[] }>("/admin/jobs/trigger-ingestion", {
        method: "POST",
        headers,
      });
    },

    // Logs
    getLogs: (limit = 50, token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return apiFetch<AuditLog[]>(`/admin/logs?limit=${limit}`, { headers, cache: "no-store" });
    },

    // Image & Media Library Management
    uploadImage: (formData: FormData, token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return apiFetch<any>("/admin/media/upload", {
        method: "POST",
        headers,
        body: formData,
      });
    },

    uploadMedia: (formData: FormData, token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return apiFetch<any>("/admin/media/upload", {
        method: "POST",
        headers,
        body: formData,
      });
    },

    getMediaList: (params?: { q?: string; license_type?: string; page?: number; size?: number }, token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const searchParams = new URLSearchParams();
      if (params?.q) searchParams.append("q", params.q);
      if (params?.license_type) searchParams.append("license_type", params.license_type);
      if (params?.page) searchParams.append("page", params.page.toString());
      if (params?.size) searchParams.append("size", params.size.toString());

      return apiFetch<any>(`/admin/media?${searchParams.toString()}`, { headers, cache: "no-store" });
    },

    getMediaById: (id: string, token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return apiFetch<any>(`/admin/media/${id}`, { headers, cache: "no-store" });
    },

    updateMedia: (id: string, data: any, token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return apiFetch<any>(`/admin/media/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
      });
    },

    deleteMedia: (id: string, token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return apiFetch<{ message: string }>(`/admin/media/${id}`, {
        method: "DELETE",
        headers,
      });
    },
  },
};
