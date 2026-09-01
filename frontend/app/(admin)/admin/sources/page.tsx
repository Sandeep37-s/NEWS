"use client";

import React, { useEffect, useState } from "react";
import {
  Rss,
  Plus,
  Play,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  X
} from "lucide-react";
import { api } from "@/lib/api";
import { Source, Category } from "@/types";
import { formatTimeAgo } from "@/lib/utils";
import AdminHeader from "@/components/admin/AdminHeader";

export default function SourcesManagementPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ id: string; msg: string; success: boolean } | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [rssUrl, setRssUrl] = useState("");
  const [defaultCategoryId, setDefaultCategoryId] = useState("");
  const [usagePolicy, setUsagePolicy] = useState<"METADATA_ONLY" | "SUMMARY_ALLOWED" | "LICENSED_REPUBLISH">("METADATA_ONLY");
  const [imagePolicy, setImagePolicy] = useState<"NOT_ALLOWED" | "LICENSED" | "OWNED">("NOT_ALLOWED");
  const [trustLevel, setTrustLevel] = useState<"MANUAL_REVIEW" | "AUTO_PUBLISH">("MANUAL_REVIEW");

  const fetchSources = async () => {
    try {
      setLoading(true);
      const [srcsResult, catsResult] = await Promise.allSettled([
        api.admin.getSources(),
        api.getCategories(),
      ]);

      if (srcsResult.status === "fulfilled") {
        setSources(srcsResult.value);
      } else {
        setToast({ type: "error", text: srcsResult.reason?.message || "Failed to load sources" });
      }

      if (catsResult.status === "fulfilled") {
        setCategories(catsResult.value);
        if (catsResult.value.length > 0) {
          setDefaultCategoryId((prev) => prev || catsResult.value[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSaving(true);
    try {
      await api.admin.createSource({
        name,
        website_url: websiteUrl,
        rss_url: rssUrl,
        default_category_id: defaultCategoryId || undefined,
        usage_policy: usagePolicy,
        image_policy: imagePolicy,
        trust_level: trustLevel,
        enabled: true,
      });
      setToast({ type: "success", text: "Source added successfully!" });
      setModalOpen(false);
      setName("");
      setWebsiteUrl("");
      setRssUrl("");
      fetchSources();
    } catch (err: any) {
      setModalError(err.message || "Failed to add source. Please verify you are logged in as admin.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestSource = async (id: string) => {
    try {
      setTestResult({ id, msg: "Connecting to feed...", success: true });
      const res = await api.admin.testSource(id);
      setTestResult({ id, msg: res.message, success: res.status === "success" });
    } catch (err: any) {
      setTestResult({ id, msg: err.message || "Test failed", success: false });
    }
  };

  const handleFetchNow = async (id: string) => {
    try {
      setToast({ type: "success", text: "Triggering ingestion job for source..." });
      const job = await api.admin.fetchSourceNow(id);
      setToast({
        type: "success",
        text: `Job completed: fetched ${job.items_fetched}, processed ${job.items_processed}, skipped ${job.items_skipped}.`,
      });
      fetchSources();
    } catch (err: any) {
      setToast({ type: "error", text: err.message || "Failed to fetch source" });
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!confirm("Are you sure you want to delete this source?")) return;
    try {
      await api.admin.deleteSource(id);
      setSources(sources.filter((s) => s.id !== id));
      setToast({ type: "success", text: "Source removed" });
    } catch (err) {
      alert("Failed to delete source");
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="News Sources & Feed Configuration"
        subtitle="Manage RSS wire inputs, copyright policies, and automated ingestion parameters."
        onRefresh={fetchSources}
      />

      <div className="p-6 sm:p-8 space-y-6 max-w-7xl">
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

        <div className="flex justify-between items-center bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Configured Sources ({sources.length})</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Each source has fine-grained copyright and image permissions.
            </p>
          </div>
          <button
            onClick={() => {
              setModalError(null);
              setModalOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Source</span>
          </button>
        </div>

        {/* Sources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sources.map((src) => {
            const hasError = Boolean(src.last_error);
            const currentTest = testResult?.id === src.id ? testResult : null;

            return (
              <div
                key={src.id}
                className={`bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4 ${
                  hasError ? "border-red-300" : "border-gray-200"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Rss className="w-4 h-4 text-amber-500" />
                      <h4 className="font-bold text-gray-900 text-base">{src.name}</h4>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        src.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {src.enabled ? "Active" : "Disabled"}
                    </span>
                  </div>

                  <p className="text-xs font-mono text-gray-500 truncate mt-1.5" title={src.rss_url}>
                    {src.rss_url}
                  </p>

                  {/* Policy Pills */}
                  <div className="grid grid-cols-2 gap-2 mt-4 text-[11px]">
                    <div className="bg-gray-50 p-2 rounded border border-gray-100">
                      <span className="text-gray-400 block font-semibold">Usage Policy:</span>
                      <span className="font-bold text-gray-800">{src.usage_policy}</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded border border-gray-100">
                      <span className="text-gray-400 block font-semibold">Image Policy:</span>
                      <span className="font-bold text-gray-800">{src.image_policy}</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded border border-gray-100">
                      <span className="text-gray-400 block font-semibold">Trust Level:</span>
                      <span className="font-bold text-gray-800">{src.trust_level}</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded border border-gray-100">
                      <span className="text-gray-400 block font-semibold">Last Fetched:</span>
                      <span className="text-gray-700">
                        {src.last_fetched_at ? formatTimeAgo(src.last_fetched_at) : "Never"}
                      </span>
                    </div>
                  </div>

                  {hasError && (
                    <div className="mt-3 p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{src.last_error}</span>
                    </div>
                  )}

                  {currentTest && (
                    <div
                      className={`mt-3 p-2.5 text-xs rounded-lg border ${
                        currentTest.success
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {currentTest.msg}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                  <button
                    onClick={() => handleDeleteSource(src.id)}
                    className="text-red-500 hover:text-red-700 font-semibold flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTestSource(src.id)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-semibold transition"
                    >
                      Test Feed
                    </button>

                    <button
                      onClick={() => handleFetchNow(src.id)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-md transition flex items-center space-x-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Fetch Now</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Source Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-bold text-lg text-gray-900">Add News Wire Source</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center space-x-2 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleAddSource} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">
                    Source Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BBC Technology"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">
                    Website URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.bbc.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">
                    RSS / Atom Feed URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://feeds.bbci.co.uk/news/technology/rss.xml"
                    value={rssUrl}
                    onChange={(e) => setRssUrl(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">
                      Default Category
                    </label>
                    <select
                      value={defaultCategoryId}
                      onChange={(e) => setDefaultCategoryId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                      {categories.length === 0 && (
                        <option value="">No Categories Available</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">
                      Content Usage Rule
                    </label>
                    <select
                      value={usagePolicy}
                      onChange={(e: any) => setUsagePolicy(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs"
                    >
                      <option value="METADATA_ONLY">METADATA_ONLY (Recommended)</option>
                      <option value="SUMMARY_ALLOWED">SUMMARY_ALLOWED</option>
                      <option value="LICENSED_REPUBLISH">LICENSED_REPUBLISH</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">
                      Image Policy
                    </label>
                    <select
                      value={imagePolicy}
                      onChange={(e: any) => setImagePolicy(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs"
                    >
                      <option value="NOT_ALLOWED">NOT_ALLOWED (Safest)</option>
                      <option value="LICENSED">LICENSED</option>
                      <option value="OWNED">OWNED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">
                      Trust / Automation Level
                    </label>
                    <select
                      value={trustLevel}
                      onChange={(e: any) => setTrustLevel(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs"
                    >
                      <option value="MANUAL_REVIEW">MANUAL_REVIEW (Human approval)</option>
                      <option value="AUTO_PUBLISH">AUTO_PUBLISH (Instant live)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save & Enable Source"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
