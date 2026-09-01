"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Save, Send, Trash2, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Category, Article } from "@/types";
import AdminHeader from "@/components/admin/AdminHeader";

export default function EditArticlePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [article, setArticle] = useState<Article | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [author, setAuthor] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [isFeatured, setIsFeatured] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [art, cats] = await Promise.all([
          api.admin.getArticleById(id),
          api.getCategories(),
        ]);
        setArticle(art);
        setTitle(art.title);
        setSummary(art.summary || "");
        setContent(art.content || "");
        setCategoryId(art.category_id);
        setAuthor(art.author || "");
        setStatus(art.status);
        setIsFeatured(art.is_featured);
        setTagsInput((art.tags || []).map((t) => t.name).join(", "));
        setCategories(cats);
      } catch (err: any) {
        setToast({ type: "error", text: err.message || "Failed to load article" });
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleUpdate = async (targetStatus?: string) => {
    try {
      const finalStatus = targetStatus || status;
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const updated = await api.admin.updateArticle(id, {
        title,
        summary,
        content,
        category_id: categoryId,
        author,
        tags,
        status: finalStatus as Article['status'],
        is_featured: isFeatured,
      });

      setToast({ type: "success", text: "Article updated successfully!" });
      setStatus(updated.status);
      setTimeout(() => router.push("/admin/articles"), 1200);
    } catch (err: any) {
      setToast({ type: "error", text: err.message || "Failed to update article" });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading article editor...</div>;
  }

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Edit Article"
        subtitle={`Editing: ${article?.title || id}`}
      />

      <div className="p-6 sm:p-8 max-w-5xl space-y-6">
        <Link
          href="/admin/articles"
          className="inline-flex items-center text-xs font-semibold text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Articles
        </Link>

        {toast && (
          <div
            className={`p-4 rounded-xl flex items-center space-x-3 text-sm font-medium ${
              toast.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span>{toast.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Headline
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-base font-serif font-bold text-gray-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Summary / Briefing
                </label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Article Body (HTML / Rich Text)
                </label>
                <textarea
                  rows={12}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-xs font-mono text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                Publish Status
              </h3>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleUpdate("PUBLISHED")}
                  className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition flex items-center justify-center space-x-2 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Publish to Public Feed</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdate("DRAFT")}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-semibold transition flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save as Draft</span>
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                Classification
              </h3>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm text-gray-800"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Author / Byline
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm text-gray-800"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
