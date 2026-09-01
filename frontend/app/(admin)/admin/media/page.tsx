"use client";

import React, { useEffect, useState } from "react";
import {
  Upload,
  Search,
  Filter,
  Image as ImageIcon,
  Trash2,
  Edit2,
  Copy,
  Check,
  Calendar,
  Layers,
  FileText,
  ShieldCheck,
  ExternalLink,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { ImageAsset } from "@/types";
import AdminHeader from "@/components/admin/AdminHeader";
import { getFullImageUrl, formatDate } from "@/lib/utils";
import MediaLibraryModal from "@/components/admin/media/MediaLibraryModal";

export default function AdminMediaPage() {
  const [mediaItems, setMediaItems] = useState<ImageAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLicense, setSelectedLicense] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<ImageAsset | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit metadata form state
  const [editCaption, setEditCaption] = useState("");
  const [editCredit, setEditCredit] = useState("");
  const [editAltText, setEditAltText] = useState("");
  const [editSource, setEditSource] = useState("");
  const [editLicense, setEditLicense] = useState("OWNED");
  const [editLicenseUrl, setEditLicenseUrl] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadMedia();
  }, [page, searchQuery, selectedLicense]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getMediaList({
        q: searchQuery || undefined,
        license_type: selectedLicense || undefined,
        page,
        size: 24,
      });
      setMediaItems(res.items || []);
      setTotalPages(res.pages || 1);
      setTotalCount(res.total || 0);
    } catch (err: any) {
      showToast("error", err.message || "Failed to load media assets");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const handleOpenEdit = (asset: ImageAsset) => {
    setEditingAsset(asset);
    setEditCaption(asset.caption || "");
    setEditCredit(asset.credit || "");
    setEditAltText(asset.alt_text || "");
    setEditSource(asset.original_source || "");
    setEditLicense(asset.license_type || "OWNED");
    setEditLicenseUrl(asset.license_url || "");
  };

  const handleSaveEdit = async () => {
    if (!editingAsset) return;
    setSavingEdit(true);
    try {
      const updated = await api.admin.updateMedia(editingAsset.id, {
        caption: editCaption,
        credit: editCredit,
        alt_text: editAltText,
        original_source: editSource,
        license_type: editLicense,
        license_url: editLicenseUrl,
      });
      setMediaItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditingAsset(null);
      showToast("success", "Media metadata updated successfully!");
    } catch (err: any) {
      showToast("error", err.message || "Failed to update media item");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this media asset?")) return;
    try {
      await api.admin.deleteMedia(id);
      setMediaItems((prev) => prev.filter((item) => item.id !== id));
      if (editingAsset?.id === id) setEditingAsset(null);
      showToast("success", "Image asset deleted from storage.");
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete media asset");
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${url}` : url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Media Library & Copyright Assets"
        subtitle={`Centralized repository for verified high-res editorial photography, charts, and graphics (${totalCount} assets).`}
      />

      <div className="p-6 sm:p-8 max-w-7xl space-y-6">
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
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        )}

        {/* Action Header & Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 w-full sm:w-auto items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by filename, caption, photographer..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={selectedLicense}
                onChange={(e) => {
                  setSelectedLicense(e.target.value);
                  setPage(1);
                }}
                className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 font-medium"
              >
                <option value="">All Copyright Licenses</option>
                <option value="OWNED">Owned / Staff Photography</option>
                <option value="LICENSED">Licensed Wire Provider</option>
                <option value="CC_BY">Creative Commons (CC-BY)</option>
                <option value="PUBLIC_DOMAIN">Public Domain / Press Kit</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Media</span>
          </button>
        </div>

        {/* Media Grid */}
        {loading ? (
          <div className="h-72 flex flex-col items-center justify-center text-gray-400 bg-white border border-gray-200 rounded-xl">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <span className="text-xs">Loading media library items...</span>
          </div>
        ) : mediaItems.length === 0 ? (
          <div className="h-72 border-2 border-dashed border-gray-200 rounded-xl bg-white flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <ImageIcon className="w-12 h-12 mb-3 stroke-1 text-gray-300" />
            <h3 className="text-base font-bold text-gray-700">No media assets found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">
              Upload photographs, infographics, and graphics to store them securely and use them across news articles.
            </p>
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition"
            >
              Upload Your First Image
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mediaItems.map((asset) => (
              <div
                key={asset.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition group flex flex-col"
              >
                {/* Thumbnail Preview */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden cursor-pointer" onClick={() => handleOpenEdit(asset)}>
                  <img
                    src={getFullImageUrl(asset.storage_url)}
                    alt={asset.alt_text || "Thumbnail"}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      title="Copy URL"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyUrl(asset.storage_url, asset.id);
                      }}
                      className="p-1.5 bg-gray-900/80 hover:bg-gray-900 text-white rounded-md shadow backdrop-blur-xs text-xs"
                    >
                      {copiedId === asset.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button
                      type="button"
                      title="Delete Image"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(asset.id);
                      }}
                      className="p-1.5 bg-red-600/80 hover:bg-red-700 text-white rounded-md shadow backdrop-blur-xs text-xs"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Metadata Card Footer */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2 text-xs">
                  <div>
                    <h4
                      onClick={() => handleOpenEdit(asset)}
                      className="font-bold text-gray-900 truncate hover:text-blue-600 cursor-pointer"
                      title={asset.filename || asset.alt_text}
                    >
                      {asset.filename || asset.alt_text || "Untitled"}
                    </h4>
                    <div className="flex items-center space-x-1 text-[10px] text-gray-400 mt-0.5">
                      <span>{asset.width && asset.height ? `${asset.width}×${asset.height}` : "Web Image"}</span>
                      <span>•</span>
                      <span>{asset.file_size ? `${(asset.file_size / 1024).toFixed(0)}KB` : "WebP"}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px]">
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-mono font-semibold">
                      {asset.license_type}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(asset)}
                      className="text-gray-500 hover:text-blue-600 font-medium flex items-center space-x-0.5"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 text-xs font-semibold text-gray-600 shadow-sm">
            <span>
              Page {page} of {totalPages} ({totalCount} total assets)
            </span>
            <div className="flex space-x-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Metadata Modal / Drawer */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Edit Image Metadata & Copyright</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAsset(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <img
                  src={getFullImageUrl(editingAsset.storage_url)}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                />
                <div className="space-y-1">
                  <p className="font-bold text-gray-900 text-sm truncate">{editingAsset.filename || "Image"}</p>
                  <p className="text-gray-500 text-[11px]">
                    Dimensions: {editingAsset.width || "?"} × {editingAsset.height || "?"} px
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    Uploaded: {formatDate(editingAsset.created_at)}
                  </p>
                  <p className="text-blue-600 text-[11px] font-mono break-all">{editingAsset.storage_url}</p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Editorial Caption</label>
                <textarea
                  rows={2}
                  placeholder="Contextual description of what appears in the photo..."
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Photographer / Agency Credit</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Chandra / PTI"
                    value={editCredit}
                    onChange={(e) => setEditCredit(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Alt Text (Accessibility)</label>
                  <input
                    type="text"
                    value={editAltText}
                    onChange={(e) => setEditAltText(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Copyright License</label>
                  <select
                    value={editLicense}
                    onChange={(e) => setEditLicense(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-800 focus:bg-white focus:outline-none"
                  >
                    <option value="OWNED">Owned / Staff Photography</option>
                    <option value="LICENSED">Licensed Commercial Provider</option>
                    <option value="CC_BY">Creative Commons (CC-BY)</option>
                    <option value="PUBLIC_DOMAIN">Public Domain / Press Kit</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Original Source</label>
                  <input
                    type="text"
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">License Terms URL (optional)</label>
                <input
                  type="url"
                  placeholder="https://creativecommons.org/licenses/by/4.0/"
                  value={editLicenseUrl}
                  onChange={(e) => setEditLicenseUrl(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDelete(editingAsset.id)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Asset</span>
              </button>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingAsset(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={handleSaveEdit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                >
                  {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <MediaLibraryModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          loadMedia();
        }}
        onSelectImage={() => {
          setIsUploadModalOpen(false);
          loadMedia();
          showToast("success", "Media uploaded and stored successfully.");
        }}
        title="Upload Media Asset"
      />
    </div>
  );
}
