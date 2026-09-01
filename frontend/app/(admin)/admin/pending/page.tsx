"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Edit,
  Clock,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Tag as TagIcon,
  Trash2,
  AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { Article } from "@/types";
import { formatTimeAgo, getFullImageUrl } from "@/lib/utils";
import AdminHeader from "@/components/admin/AdminHeader";

export default function PendingReviewPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getArticles({ status: "PENDING_REVIEW", size: 50 });
      setArticles(res.items || []);
    } catch (err: any) {
      setToast({ type: "error", text: err.message || "Failed to load pending queue" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handlePublish = async (id: string) => {
    setActionLoading(id);
    try {
      await api.admin.publishArticle(id);
      setArticles(articles.filter((a) => a.id !== id));
      setToast({ type: "success", text: "Article published successfully to live website!" });
    } catch (err: any) {
      setToast({ type: "error", text: err.message || "Failed to publish article" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await api.admin.rejectArticle(id, "Rejected during editorial review");
      setArticles(articles.filter((a) => a.id !== id));
      setToast({ type: "success", text: "Article marked as rejected." });
    } catch (err: any) {
      setToast({ type: "error", text: err.message || "Failed to reject article" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this pending article?")) return;
    setActionLoading(id);
    try {
      await api.admin.deleteArticle(id);
      setArticles(articles.filter((a) => a.id !== id));
      setToast({ type: "success", text: "Article deleted." });
    } catch (err: any) {
      setToast({ type: "error", text: err.message || "Failed to delete article" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Pending Ingestion Review Queue"
        subtitle="Review AI summaries and copyright permissions before publishing to the public feed."
        onRefresh={fetchPending}
      />

      <div className="p-6 sm:p-8 space-y-6 max-w-6xl">
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

        {/* Count Bar */}
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-6 py-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-bold text-gray-900">
              {articles.length} Story{articles.length === 1 ? "" : "ies"} Awaiting Decision
            </span>
          </div>
          <span className="text-xs text-gray-500">
            Publishing is strictly controlled. Nothing is public until you click &quot;Publish&quot;.
          </span>
        </div>

        {/* Queue Items */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500">
            Loading pending queue...
          </div>
        ) : articles.length > 0 ? (
          <div className="space-y-6">
            {articles.map((art) => {
              const isProcessing = actionLoading === art.id;
              return (
                <div
                  key={art.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4 hover:border-blue-200 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div className="flex items-center space-x-2">
                      {art.category && (
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded uppercase tracking-wider">
                          {art.category.name}
                        </span>
                      )}
                      {art.source && (
                        <span className="text-xs text-gray-600 font-medium bg-gray-100 px-2.5 py-1 rounded">
                          Source: {art.source.name}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      Discovered {formatTimeAgo(art.created_at)}
                    </span>
                  </div>

                  {/* Headline & Summary */}
                  <div>
                    <h3 className="font-serif text-xl font-bold text-gray-950 leading-snug">
                      {art.title}
                    </h3>
                    {art.summary && (
                      <p className="text-sm text-gray-700 leading-relaxed mt-2 bg-gray-50 p-3.5 rounded-lg border border-gray-100">
                        {art.summary}
                      </p>
                    )}
                  </div>

                  {/* Tags & Source Link */}
                  <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {art.tags &&
                        art.tags.map((t) => (
                          <span
                            key={t.id}
                            className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md"
                          >
                            #{t.name}
                          </span>
                        ))}
                    </div>

                    {art.original_url && (
                      <a
                        href={art.original_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center font-medium"
                      >
                        <span>View Original Article</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleDelete(art.id)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg font-medium transition"
                      title="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <Link
                      href={`/admin/edit/${art.id}`}
                      className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit Story
                    </Link>

                    <button
                      onClick={() => handleReject(art.id)}
                      disabled={isProcessing}
                      className="px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition flex items-center"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject
                    </button>

                    <button
                      onClick={() => handlePublish(art.id)}
                      disabled={isProcessing}
                      className="px-5 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition shadow-sm flex items-center disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Publish to Live Feed
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-serif text-xl font-bold text-gray-900">Review Queue is Clear!</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
              All ingested news stories have been processed. Click &ldquo;Fetch Feeds Now&rdquo; in the header to check for new stories.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
