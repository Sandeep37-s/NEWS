"use client";

import React, { useEffect, useState } from "react";
import { Tags as TagsIcon, Plus, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Tag } from "@/types";
import AdminHeader from "@/components/admin/AdminHeader";

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const data = await api.getPopularTags(100);
      setTags(data);
    } catch (err: any) {
      setToast({ type: "error", text: err.message || "Failed to load tags" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/admin/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      setToast({ type: "success", text: "Tag created!" });
      setName("");
      fetchTags();
    } catch (err: any) {
      setToast({ type: "error", text: err.message || "Failed to create tag" });
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Tag Management"
        subtitle="Manage keyword topics and automated AI tag classifiers."
        onRefresh={fetchTags}
      />

      <div className="p-6 sm:p-8 space-y-8 max-w-5xl">
        {toast && (
          <div
            className={`p-4 rounded-xl flex items-center space-x-3 text-sm font-medium ${
              toast.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {toast.type === "success" ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <span>{toast.text}</span>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <form onSubmit={handleCreateTag} className="flex gap-3 max-w-md">
            <input
              type="text"
              placeholder="Add new tag (e.g. Semiconductors)..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-grow bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
            >
              Add Tag
            </button>
          </form>

          <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="px-3 py-1 bg-gray-100 border border-gray-200 text-gray-800 rounded-full text-xs font-medium flex items-center space-x-1.5"
              >
                <span>#{tag.name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
