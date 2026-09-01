"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Send,
  Calendar,
  Image as ImageIcon,
  Upload,
  CheckCircle,
  AlertCircle,
  Tag as TagIcon,
  Sparkles
} from "lucide-react";
import { api } from "@/lib/api";
import { Category } from "@/types";
import AdminHeader from "@/components/admin/AdminHeader";

export default function CreateArticlePage() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [author, setAuthor] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  
  // Image upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [licenseType, setLicenseType] = useState("OWNED");
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    api.getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) setCategoryId(cats[0].id);
    });
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (status: "DRAFT" | "PUBLISHED" | "SCHEDULED") => {
    if (!title.trim() || !categoryId) {
      setToast({ type: "error", text: "Title and Category are required." });
      return;
    }

    if (status === "SCHEDULED" && !scheduledAt) {
      setToast({ type: "error", text: "Please select a scheduled publishing date and time." });
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      let imageId = uploadedImageId;

      // Upload image if selected
      if (imageFile && !uploadedImageId) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("license_type", licenseType);
        formData.append("alt_text", title);
        const imgRes = await api.admin.uploadImage(formData);
        imageId = imgRes.id;
        setUploadedImageId(imgRes.id);
      }

      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const articlePayload = {
        title,
        slug: slug.trim() || undefined,
        summary,
        content: content || `<p>${summary}</p>`,
        category_id: categoryId,
        author: author || undefined,
        image_id: imageId || undefined,
        content_origin: "ORIGINAL" as const,
        status,
        tags,
        is_featured: isFeatured,
        scheduled_at: status === "SCHEDULED" && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      };

      const newArticle = await api.admin.createArticle(articlePayload);
      setToast({ type: "success", text: `Article successfully saved with status: ${status}` });

      setTimeout(() => {
        if (status === "PUBLISHED") {
          router.push(`/article/${newArticle.slug}`);
        } else {
          router.push("/admin/articles");
        }
      }, 1500);
    } catch (err: any) {
      setToast({ type: "error", text: err.message || "Failed to create article" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Author & Publish Original Story"
        subtitle="Compose staff journalism or original breaking reports with verified media rights."
      />

      <div className="p-6 sm:p-8 max-w-5xl space-y-8">
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
          {/* Main Editorial Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Story Headline <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Breakthrough Solar Cell Tech Developed by Indian Researchers"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-base font-serif font-bold text-gray-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Summary / Executive Excerpt */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Executive Summary / Briefing (100–150 words)
                </label>
                <textarea
                  rows={3}
                  placeholder="Concise objective takeaway for readers..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Full Content */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Article Body (HTML / Rich Text)
                </label>
                <textarea
                  rows={10}
                  placeholder="Write full article body paragraphs here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm font-serif text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Sidebar Settings & Media */}
          <div className="space-y-6">
            {/* Publishing Controls */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                Publishing Actions
              </h3>

              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSave("PUBLISHED")}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>Publish Immediately</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSave("DRAFT")}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-semibold transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Save as Draft</span>
                </button>
              </div>

              {/* Scheduled Publishing */}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <label className="block text-xs font-semibold text-gray-600">
                  Schedule Future Release:
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-800"
                />
                <button
                  type="button"
                  disabled={loading || !scheduledAt}
                  onClick={() => handleSave("SCHEDULED")}
                  className="w-full py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Set Schedule</span>
                </button>
              </div>
            </div>

            {/* Classification & Attribution */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                Organization & Metadata
              </h3>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Category <span className="text-red-500">*</span>
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

              {/* Author */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Byline / Author
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Science Reporter"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm text-gray-800"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="AI, Innovation, Hardware, Startups"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm text-gray-800"
                />
              </div>

              {/* Featured Flag */}
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="featured-check"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="featured-check" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  Feature prominently on Homepage Hero
                </label>
              </div>
            </div>

            {/* Media Upload */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                Featured Media & License
              </h3>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="text-xs text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />

              {imagePreview && (
                <div className="relative h-32 w-full rounded-lg overflow-hidden border border-gray-200">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Image Copyright License
                </label>
                <select
                  value={licenseType}
                  onChange={(e) => setLicenseType(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-800"
                >
                  <option value="OWNED">Owned / Original Photography</option>
                  <option value="LICENSED">Licensed Commercial Provider</option>
                  <option value="CC_BY">Creative Commons (CC-BY)</option>
                  <option value="PUBLIC_DOMAIN">Public Domain / Press Kit</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
