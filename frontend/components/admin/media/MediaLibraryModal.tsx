"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Upload,
  Image as ImageIcon,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Filter
} from "lucide-react";
import { api } from "@/lib/api";
import { ImageAsset } from "@/types";
import { getFullImageUrl, formatDate } from "@/lib/utils";

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageData: {
    src: string;
    imageId?: string;
    alt?: string;
    caption?: string;
    credit?: string;
    source?: string;
    license?: string;
    alignment?: "left" | "center" | "right" | "full";
    size?: "small" | "medium" | "large" | "full";
  }) => void;
  title?: string;
}

export default function MediaLibraryModal({
  isOpen,
  onClose,
  onSelectImage,
  title = "Insert Image into Article"
}: MediaLibraryModalProps) {
  const [activeTab, setActiveTab] = useState<"library" | "upload" | "url">("library");

  // Media Library state
  const [mediaItems, setMediaItems] = useState<ImageAsset[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLicense, setSelectedLicense] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<ImageAsset | null>(null);

  // Upload tab state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadAlt, setUploadAlt] = useState("");
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadCredit, setUploadCredit] = useState("");
  const [uploadSource, setUploadSource] = useState("Staff Photography");
  const [uploadLicense, setUploadLicense] = useState("OWNED");
  const [uploadLicenseUrl, setUploadLicenseUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Direct URL tab state
  const [directUrl, setDirectUrl] = useState("");
  const [directAlt, setDirectAlt] = useState("");
  const [directCaption, setDirectCaption] = useState("");
  const [directCredit, setDirectCredit] = useState("");

  // Default insertion options
  const [insertAlignment, setInsertAlignment] = useState<"left" | "center" | "right" | "full">("center");
  const [insertSize, setInsertSize] = useState<"small" | "medium" | "large" | "full">("large");

  useEffect(() => {
    if (isOpen && activeTab === "library") {
      loadMedia();
    }
  }, [isOpen, activeTab, searchQuery, selectedLicense]);

  const loadMedia = async () => {
    try {
      setLoadingMedia(true);
      const res = await api.admin.getMediaList({
        q: searchQuery || undefined,
        license_type: selectedLicense || undefined,
        size: 30
      });
      setMediaItems(res.items || []);
      if (res.items && res.items.length > 0 && !selectedAsset) {
        setSelectedAsset(res.items[0]);
      }
    } catch (err) {
      console.error("Failed to load media library:", err);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
    if (!uploadAlt) {
      setUploadAlt(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
    }
  };

  const handlePerformUpload = async () => {
    if (!uploadFile) {
      setUploadError("Please select an image file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("license_type", uploadLicense);
      formData.append("alt_text", uploadAlt);
      formData.append("caption", uploadCaption);
      formData.append("credit", uploadCredit);
      formData.append("original_source", uploadSource);
      if (uploadLicenseUrl) formData.append("license_url", uploadLicenseUrl);

      const createdAsset: ImageAsset = await api.admin.uploadMedia(formData);

      onSelectImage({
        src: createdAsset.storage_url,
        imageId: createdAsset.id,
        alt: uploadAlt || createdAsset.alt_text || "",
        caption: uploadCaption || createdAsset.caption || "",
        credit: uploadCredit || createdAsset.credit || "",
        source: uploadSource || createdAsset.original_source || "",
        license: uploadLicense || createdAsset.license_type || "OWNED",
        alignment: insertAlignment,
        size: insertSize
      });

      onClose();
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload image. Please verify file type and size.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleInsertFromLibrary = () => {
    if (!selectedAsset) return;

    onSelectImage({
      src: selectedAsset.storage_url,
      imageId: selectedAsset.id,
      alt: selectedAsset.alt_text || "",
      caption: selectedAsset.caption || "",
      credit: selectedAsset.credit || "",
      source: selectedAsset.original_source || "",
      license: selectedAsset.license_type || "OWNED",
      alignment: insertAlignment,
      size: insertSize
    });

    onClose();
  };

  const handleInsertDirectUrl = () => {
    if (!directUrl.trim()) return;

    onSelectImage({
      src: directUrl.trim(),
      alt: directAlt.trim(),
      caption: directCaption.trim(),
      credit: directCredit.trim(),
      alignment: insertAlignment,
      size: insertSize
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-500">Insert verified high-resolution media into the article flow.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-6 bg-white space-x-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("library")}
            className={`py-3 border-b-2 transition flex items-center space-x-2 ${
              activeTab === "library"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Media Library</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`py-3 border-b-2 transition flex items-center space-x-2 ${
              activeTab === "upload"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload New File</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`py-3 border-b-2 transition flex items-center space-x-2 ${
              activeTab === "url"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            <span>Image URL</span>
          </button>
        </div>

        {/* Body Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: MEDIA LIBRARY */}
          {activeTab === "library" && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, caption, photo credit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Filter className="w-3.5 h-3.5 text-gray-400" />
                  <select
                    value={selectedLicense}
                    onChange={(e) => setSelectedLicense(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-700"
                  >
                    <option value="">All Rights & Licenses</option>
                    <option value="OWNED">Owned / Original</option>
                    <option value="LICENSED">Licensed Provider</option>
                    <option value="CC_BY">Creative Commons (CC-BY)</option>
                    <option value="PUBLIC_DOMAIN">Public Domain</option>
                  </select>
                </div>
              </div>

              {/* Grid + Details Sidebar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* Media Grid */}
                <div className="md:col-span-2 max-h-[400px] overflow-y-auto pr-1">
                  {loadingMedia ? (
                    <div className="h-60 flex flex-col items-center justify-center text-gray-400">
                      <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-600" />
                      <span className="text-xs">Loading media assets...</span>
                    </div>
                  ) : mediaItems.length === 0 ? (
                    <div className="h-60 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                      <ImageIcon className="w-10 h-10 mb-2 stroke-1 text-gray-300" />
                      <p className="text-sm font-medium text-gray-600">No media assets found</p>
                      <p className="text-xs text-gray-400 mt-1">Upload images using the "Upload New File" tab.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {mediaItems.map((asset) => {
                        const isSelected = selectedAsset?.id === asset.id;
                        return (
                          <div
                            key={asset.id}
                            onClick={() => setSelectedAsset(asset)}
                            className={`relative group aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                              isSelected
                                ? "border-blue-600 ring-2 ring-blue-500/20"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <img
                              src={getFullImageUrl(asset.storage_url)}
                              alt={asset.alt_text || "Thumbnail"}
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 bg-blue-600 text-white rounded-full p-0.5 shadow">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 text-[10px] text-white truncate opacity-0 group-hover:opacity-100 transition">
                              {asset.filename || asset.alt_text || "Image"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected Asset Details Sidebar */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3.5 text-xs text-gray-600 flex flex-col justify-between">
                  {selectedAsset ? (
                    <div className="space-y-3">
                      <div className="aspect-video w-full rounded-lg overflow-hidden border border-gray-200 bg-white">
                        <img
                          src={getFullImageUrl(selectedAsset.storage_url)}
                          alt="Selected preview"
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div>
                        <span className="font-bold text-gray-900 block truncate">{selectedAsset.filename || "Image Asset"}</span>
                        <span className="text-[11px] text-gray-400">
                          {selectedAsset.width && selectedAsset.height
                            ? `${selectedAsset.width} × ${selectedAsset.height} px`
                            : "Standard resolution"}
                          {selectedAsset.file_size
                            ? ` • ${(selectedAsset.file_size / 1024).toFixed(0)} KB`
                            : ""}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-gray-200 space-y-1.5">
                        {selectedAsset.caption && (
                          <p><strong className="text-gray-700">Caption:</strong> {selectedAsset.caption}</p>
                        )}
                        {selectedAsset.credit && (
                          <p><strong className="text-gray-700">Credit:</strong> {selectedAsset.credit}</p>
                        )}
                        <p>
                          <strong className="text-gray-700">License:</strong>{" "}
                          <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono text-[10px]">
                            {selectedAsset.license_type}
                          </span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-center text-gray-400">
                      Select an image to preview details
                    </div>
                  )}

                  {/* Alignment & Size Controls */}
                  <div className="pt-3 border-t border-gray-200 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Alignment</label>
                        <select
                          value={insertAlignment}
                          onChange={(e) => setInsertAlignment(e.target.value as any)}
                          className="w-full bg-white border border-gray-200 rounded p-1.5 text-xs text-gray-800"
                        >
                          <option value="center">Center</option>
                          <option value="left">Left</option>
                          <option value="right">Right</option>
                          <option value="full">Full Width</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Size</label>
                        <select
                          value={insertSize}
                          onChange={(e) => setInsertSize(e.target.value as any)}
                          className="w-full bg-white border border-gray-200 rounded p-1.5 text-xs text-gray-800"
                        >
                          <option value="large">Large (Default)</option>
                          <option value="medium">Medium</option>
                          <option value="small">Small</option>
                          <option value="full">100% Full Width</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!selectedAsset}
                      onClick={handleInsertFromLibrary}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition shadow-sm disabled:opacity-40"
                    >
                      Insert Selected Image
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD NEW FILE */}
          {activeTab === "upload" && (
            <div className="space-y-5">
              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dropzone */}
                <div>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-6 text-center flex flex-col items-center justify-center bg-gray-50/50 hover:bg-blue-50/20 transition cursor-pointer min-h-[220px]"
                    onClick={() => document.getElementById("modal-file-input")?.click()}
                  >
                    <input
                      id="modal-file-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    {uploadPreview ? (
                      <div className="space-y-2">
                        <img
                          src={uploadPreview}
                          alt="Preview"
                          className="max-h-40 mx-auto rounded-lg object-contain border border-gray-200 shadow-sm"
                        />
                        <p className="text-xs text-blue-600 font-semibold hover:underline">Click or drop to replace</p>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3">
                          <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-gray-800">Drag and drop high-res image here</p>
                        <p className="text-xs text-gray-500 mt-1">Supports JPEG, PNG, WebP, AVIF up to 10MB</p>
                        <button
                          type="button"
                          className="mt-3 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg shadow-sm hover:bg-gray-50"
                        >
                          Browse Files
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Metadata Fields */}
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Caption / Editorial Note</label>
                    <input
                      type="text"
                      placeholder="e.g. AI research laboratory in Bengaluru..."
                      value={uploadCaption}
                      onChange={(e) => setUploadCaption(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Photo Credit</label>
                      <input
                        type="text"
                        placeholder="e.g. Rajesh Kumar / Reuters"
                        value={uploadCredit}
                        onChange={(e) => setUploadCredit(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Alt Text (Accessibility)</label>
                      <input
                        type="text"
                        placeholder="e.g. Scientists working on computers"
                        value={uploadAlt}
                        onChange={(e) => setUploadAlt(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Copyright License</label>
                      <select
                        value={uploadLicense}
                        onChange={(e) => setUploadLicense(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-800 focus:bg-white focus:outline-none"
                      >
                        <option value="OWNED">Owned / Original Photo</option>
                        <option value="LICENSED">Licensed Provider</option>
                        <option value="CC_BY">Creative Commons (CC-BY)</option>
                        <option value="PUBLIC_DOMAIN">Public Domain / Press Kit</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Original Source</label>
                      <input
                        type="text"
                        value={uploadSource}
                        onChange={(e) => setUploadSource(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-900 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Initial Alignment & Size */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Initial Alignment</label>
                      <select
                        value={insertAlignment}
                        onChange={(e) => setInsertAlignment(e.target.value as any)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-800"
                      >
                        <option value="center">Center</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                        <option value="full">Full Width</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Initial Size</label>
                      <select
                        value={insertSize}
                        onChange={(e) => setInsertSize(e.target.value as any)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-800"
                      >
                        <option value="large">Large</option>
                        <option value="medium">Medium</option>
                        <option value="small">Small</option>
                        <option value="full">100% Full</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  disabled={!uploadFile || isUploading}
                  onClick={handlePerformUpload}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition flex items-center space-x-2 shadow-sm disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Optimizing & Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload & Insert into Article</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: DIRECT IMAGE URL */}
          {activeTab === "url" && (
            <div className="space-y-4 max-w-xl mx-auto py-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Image URL <span className="text-red-500">*</span></label>
                <input
                  type="url"
                  placeholder="https://example.com/images/photo.jpg"
                  value={directUrl}
                  onChange={(e) => setDirectUrl(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Caption</label>
                <input
                  type="text"
                  placeholder="Article caption..."
                  value={directCaption}
                  onChange={(e) => setDirectCaption(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Photo Credit</label>
                  <input
                    type="text"
                    placeholder="Photographer / Source"
                    value={directCredit}
                    onChange={(e) => setDirectCredit(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Alt Text</label>
                  <input
                    type="text"
                    placeholder="Descriptive text"
                    value={directAlt}
                    onChange={(e) => setDirectAlt(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs text-gray-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  disabled={!directUrl.trim()}
                  onClick={handleInsertDirectUrl}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition disabled:opacity-50"
                >
                  Insert Image URL
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
