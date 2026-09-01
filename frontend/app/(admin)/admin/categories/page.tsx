"use client";

import React, { useEffect, useState } from "react";
import { Layers, Plus, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Category } from "@/types";
import AdminHeader from "@/components/admin/AdminHeader";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await api.getCategories();
      setCategories(data);
    } catch (err: any) {
      setToast({ type: "error", text: err.message || "Failed to load categories" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Auto slug if empty
      const finalSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/admin/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: finalSlug, description }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      setToast({ type: "success", text: "Category created!" });
      setName("");
      setSlug("");
      setDescription("");
      fetchCategories();
    } catch (err: any) {
      setToast({ type: "error", text: err.message || "Failed to create category" });
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Editorial Categories & Desks"
        subtitle="Manage news desks and navigation categories."
        onRefresh={fetchCategories}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Add Category Form */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">
              Add New Category
            </h3>

            <form onSubmit={handleCreate} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Artificial Intelligence"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Slug (URL Safe)
                </label>
                <input
                  type="text"
                  placeholder="artificial-intelligence"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Desk summary for SEO and readers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition shadow-sm"
              >
                Create Category
              </button>
            </form>
          </div>

          {/* Categories List */}
          <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-3">
              Active Desks ({categories.length})
            </h3>

            <div className="divide-y divide-gray-100 mt-2">
              {categories.map((cat) => (
                <div key={cat.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-900 text-sm">{cat.name}</span>
                    <span className="ml-2 text-xs text-gray-400 font-mono">/category/{cat.slug}</span>
                    {cat.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
