"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  PlusCircle,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Eye
} from "lucide-react";
import { api } from "@/lib/api";
import { Article } from "@/types";
import { formatDate, formatTimeAgo } from "@/lib/utils";
import AdminHeader from "@/components/admin/AdminHeader";

const STATUS_TABS = [
  { label: "All Stories", value: "" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Pending Review", value: "PENDING_REVIEW" },
  { label: "Drafts", value: "DRAFT" },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "Rejected", value: "REJECTED" },
];

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getArticles({
        status: status || undefined,
        q: search || undefined,
        page,
        size: 20,
      });
      setArticles(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Error fetching admin articles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [status, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchArticles();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      await api.admin.deleteArticle(id);
      setArticles(articles.filter((a) => a.id !== id));
      setTotal(total - 1);
    } catch (err) {
      alert("Failed to delete article");
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const updated = await api.admin.publishArticle(id);
      setArticles(articles.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      alert("Failed to publish article");
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Article Management"
        subtitle="Catalog of all original reports, aggregated briefs, drafts, and scheduled releases."
        onRefresh={fetchArticles}
      />

      <div className="p-6 sm:p-8 space-y-6 max-w-7xl">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
          {STATUS_TABS.map((tab) => {
            const isActive = status === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setStatus(tab.value);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search articles by headline or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition"
          >
            Search
          </button>
        </form>

        {/* Articles Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-bold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-4">Headline</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Origin / Source</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Views</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {articles.map((art) => (
                <tr key={art.id} className="hover:bg-gray-50 transition">
                  <td className="py-3.5 px-4 max-w-sm">
                    <p className="font-semibold text-gray-950 line-clamp-2 text-sm">
                      {art.title}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{art.slug}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">
                      {art.category?.name || "Uncategorized"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-gray-800">
                      {art.source ? art.source.name : "Staff Original"}
                    </span>
                    <span className="block text-[10px] text-gray-400 uppercase">
                      {art.content_origin}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                        art.status === "PUBLISHED"
                          ? "bg-green-100 text-green-800"
                          : art.status === "PENDING_REVIEW"
                          ? "bg-amber-100 text-amber-800"
                          : art.status === "DRAFT"
                          ? "bg-gray-100 text-gray-800"
                          : art.status === "SCHEDULED"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {art.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-gray-800">
                    {art.view_count}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {formatDate(art.published_at || art.created_at)}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                    {art.status === "PUBLISHED" && (
                      <Link
                        href={`/article/${art.slug}`}
                        target="_blank"
                        className="p-1.5 text-gray-400 hover:text-blue-600 inline-block"
                        title="View on site"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    )}
                    {art.status !== "PUBLISHED" && (
                      <button
                        onClick={() => handlePublish(art.id)}
                        className="p-1.5 text-green-600 hover:text-green-700 inline-block"
                        title="Publish"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    <Link
                      href={`/admin/edit/${art.id}`}
                      className="p-1.5 text-gray-500 hover:text-gray-900 inline-block"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(art.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 inline-block"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    No articles found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
