"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Save,
  Send,
  Calendar,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Eye,
  Trash2,
  Clock,
  ArrowLeft,
  X,
  Sparkles,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Category, ImageAsset, Article } from "@/types";
import AdminHeader from "@/components/admin/AdminHeader";
import RichArticleEditor from "@/components/admin/editor/RichArticleEditor";
import MediaLibraryModal from "@/components/admin/media/MediaLibraryModal";
import ArticleContentRenderer from "@/components/public/ArticleContentRenderer";
import { getFullImageUrl } from "@/lib/utils";

export default function EditArticlePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [article, setArticle] = useState<Article | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [author, setAuthor] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [isFeatured, setIsFeatured] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");

  // Featured Media
  const [featuredAsset, setFeaturedAsset] = useState<ImageAsset | null>(null);
  const [isFeaturedModalOpen, setIsFeaturedModalOpen] = useState(false);

  // Categories & UI
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Autosave & Guard
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Preview Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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
        setSlug(art.slug);
        setSummary(art.summary || "");
        setContent(art.content || "");
        setCategoryId(art.category_id);
        setAuthor(art.author || "");
        setStatus(art.status);
        setIsFeatured(art.is_featured);
        setTagsInput((art.tags || []).map((t) => t.name).join(", "));
        setCategories(cats);
        if (art.image) {
          setFeaturedAsset(art.image);
        }
        if (art.scheduled_at) {
          setScheduledAt(new Date(art.scheduled_at).toISOString().slice(0, 16));
        }
      } catch (err: any) {
        showToast("error", err.message || "Failed to load article");
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  // Unsaved changes beforeunload protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes.";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Debounced autosave mechanism
  const triggerAutosave = useCallback(
    (newTitle: string, newContent: string, newSummary: string, newCatId: string) => {
      if (!id || !newTitle.trim() || !newCatId) return;

      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

      autosaveTimerRef.current = setTimeout(async () => {
        try {
          setSaveStatus("saving");
          const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);

          await api.admin.updateArticle(id, {
            title: newTitle,
            summary: newSummary || undefined,
            content: newContent,
            category_id: newCatId,
            author: author || undefined,
            image_id: featuredAsset?.id || undefined,
            tags,
            is_featured: isFeatured,
          });

          setSaveStatus("saved");
          setIsDirty(false);
          setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        } catch (err) {
          console.error("Autosave error:", err);
          setSaveStatus("idle");
        }
      }, 3000);
    },
    [id, tagsInput, author, featuredAsset, isFeatured]
  );

  const handleEditorChange = (data: { json: any; jsonString: string; html: string; text: string }) => {
    setContent(data.jsonString);
    setIsDirty(true);
    triggerAutosave(title, data.jsonString, summary, categoryId);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setIsDirty(true);
    triggerAutosave(val, content, summary, categoryId);
  };

  const handleSummaryChange = (val: string) => {
    setSummary(val);
    setIsDirty(true);
    triggerAutosave(title, content, val, categoryId);
  };

  const handleCategoryChange = (val: string) => {
    setCategoryId(val);
    setIsDirty(true);
    triggerAutosave(title, content, summary, val);
  };

  const handleUpdate = async (targetStatus?: string) => {
    setSaving(true);
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    try {
      const finalStatus = targetStatus || status;
      const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);

      const updated = await api.admin.updateArticle(id, {
        title,
        summary,
        content,
        category_id: categoryId,
        author,
        image_id: featuredAsset?.id || undefined,
        tags,
        status: finalStatus as Article["status"],
        is_featured: isFeatured,
        scheduled_at: finalStatus === "SCHEDULED" && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      });

      setIsDirty(false);
      setStatus(updated.status);
      showToast("success", "Article updated successfully!");
      setTimeout(() => router.push("/admin/articles"), 1200);
    } catch (err: any) {
      showToast("error", err.message || "Failed to update article");
    } finally {
      setSaving(false);
    }
  };

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <span>Loading article editor...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50/50">
      <AdminHeader
        title="Edit News Article"
        subtitle={`Editing: ${article?.title || id}`}
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Navigation Ribbon */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center space-x-3">
            <Link
              href="/admin/articles"
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-sm font-bold text-gray-900 truncate max-w-md">
                {title || "Untitled"}
              </h2>
              <div className="flex items-center space-x-2 text-[11px] text-gray-400">
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {saveStatus === "saving" ? (
                    <span className="text-amber-600 font-semibold flex items-center">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Autosaving...
                    </span>
                  ) : saveStatus === "saved" ? (
                    <span className="text-green-600 font-semibold">Autosaved at {lastSavedTime}</span>
                  ) : isDirty ? (
                    <span className="text-gray-500">Unsaved changes</span>
                  ) : (
                    <span>Current Status: <strong className="text-gray-700">{status}</strong></span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition flex items-center space-x-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-gray-600" />
              <span>Preview</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleUpdate("DRAFT")}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-gray-600" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleUpdate("PUBLISHED")}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publish Live</span>
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toast && (
          <div
            className={`p-4 rounded-xl flex items-center space-x-3 text-sm font-medium animate-in fade-in ${
              toast.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        )}

        {/* Editor Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Body (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
              {/* Title */}
              <div>
                <input
                  type="text"
                  placeholder="Story Headline..."
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full text-2xl sm:text-4xl font-serif font-bold text-gray-950 placeholder-gray-300 border-none outline-none focus:ring-0 leading-tight p-0"
                />
              </div>

              {/* Summary */}
              <div className="border-t border-gray-100 pt-4">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Executive Briefing / Summary
                </label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => handleSummaryChange(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-200 rounded-xl p-3 text-sm font-serif text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none leading-relaxed"
                />
              </div>

              {/* Rich Visual Editor */}
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Article Content (Visual Editor with Inline Images)
                </label>
                <RichArticleEditor
                  content={content}
                  onChange={handleEditorChange}
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Featured Image */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Featured Cover Media
                </h3>
                <span className="text-[10px] text-gray-400">Homepage & Card Cover</span>
              </div>

              {featuredAsset ? (
                <div className="space-y-2">
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-100 group">
                    <img
                      src={getFullImageUrl(featuredAsset.storage_url)}
                      alt="Featured Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFeaturedAsset(null)}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition shadow"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span className="truncate max-w-[180px]">{featuredAsset.filename || "Cover Image"}</span>
                    <button
                      type="button"
                      onClick={() => setIsFeaturedModalOpen(true)}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsFeaturedModalOpen(true)}
                  className="border-2 border-dashed border-gray-200 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer bg-gray-50/50 hover:bg-blue-50/20 transition flex flex-col items-center justify-center space-y-2"
                >
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-full">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">Set Featured Image</span>
                  <span className="text-[10px] text-gray-400">Choose from Media Library</span>
                </div>
              )}
            </div>

            {/* Classification */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
                Classification
              </h3>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 focus:bg-white focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Author / Byline
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => {
                    setAuthor(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => {
                    setTagsInput(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="featured-hero-edit"
                  checked={isFeatured}
                  onChange={(e) => {
                    setIsFeatured(e.target.checked);
                    setIsDirty(true);
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="featured-hero-edit" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  Feature on Homepage Hero
                </label>
              </div>
            </div>

            {/* Scheduled Date */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
                Publishing Schedule
              </h3>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => {
                  setScheduledAt(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-800"
              />
              <button
                type="button"
                disabled={saving || !scheduledAt}
                onClick={() => handleUpdate("SCHEDULED")}
                className="w-full py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Save Schedule</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Media Modal */}
      <MediaLibraryModal
        isOpen={isFeaturedModalOpen}
        onClose={() => setIsFeaturedModalOpen(false)}
        onSelectImage={(img) => {
          setFeaturedAsset({
            id: img.imageId || "",
            storage_url: img.src,
            alt_text: img.alt,
            caption: img.caption,
            credit: img.credit,
            license_type: img.license || "OWNED",
            created_at: new Date().toISOString(),
          });
          setIsDirty(true);
        }}
        title="Select Featured Article Cover"
      />

      {/* Live Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-950/80 backdrop-blur-md p-4 sm:p-8 flex justify-center animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 relative flex flex-col space-y-8 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-bold text-gray-900">Live Reader Preview</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <article className="space-y-6">
              <div className="space-y-3">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold uppercase tracking-wider">
                  {categories.find((c) => c.id === categoryId)?.name || "General"}
                </span>
                <h1 className="font-serif text-3xl sm:text-5xl font-bold text-gray-950 leading-tight">
                  {title || "Untitled Article"}
                </h1>
                <div className="text-xs text-gray-500 flex items-center space-x-2 border-y border-gray-100 py-3">
                  <span>By {author || "Editorial Desk"}</span>
                  <span>•</span>
                  <span>{article?.published_at ? new Date(article.published_at).toLocaleDateString(undefined, { dateStyle: "long" }) : new Date().toLocaleDateString(undefined, { dateStyle: "long" })}</span>
                </div>
              </div>

              {summary && (
                <div className="bg-amber-50/70 border-l-4 border-amber-500 p-5 rounded-r-xl">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-amber-900 flex items-center mb-1">
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-600" /> Executive Briefing
                  </h3>
                  <p className="text-gray-800 text-base font-serif leading-relaxed">{summary}</p>
                </div>
              )}

              {featuredAsset && (
                <figure className="space-y-2">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={getFullImageUrl(featuredAsset.storage_url)}
                      alt="Featured"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {featuredAsset.credit && (
                    <figcaption className="text-xs text-gray-400 text-right italic">
                      Photo credit: {featuredAsset.credit} ({featuredAsset.license_type})
                    </figcaption>
                  )}
                </figure>
              )}

              <ArticleContentRenderer content={content} />
            </article>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-5 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
