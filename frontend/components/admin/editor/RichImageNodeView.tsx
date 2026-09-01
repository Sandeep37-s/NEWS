"use client";

import React, { useState } from "react";
import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Trash2,
  Edit3,
  RefreshCw,
  Info,
  Check,
  X
} from "lucide-react";
import { getFullImageUrl } from "@/lib/utils";

export default function RichImageNodeView(props: NodeViewProps) {
  const { node, updateAttributes, deleteNode, selected } = props;
  const {
    src,
    alt = "",
    caption = "",
    credit = "",
    source = "",
    license = "OWNED",
    alignment = "center",
    size = "large"
  } = node.attrs;

  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [tempCaption, setTempCaption] = useState(caption);
  const [tempCredit, setTempCredit] = useState(credit);
  const [tempAlt, setTempAlt] = useState(alt);

  const fullSrc = getFullImageUrl(src);

  // Size mapping classes
  const sizeClasses = {
    small: "max-w-xs",
    medium: "max-w-md",
    large: "max-w-2xl",
    full: "w-full max-w-full"
  }[size as "small" | "medium" | "large" | "full"] || "max-w-2xl";

  // Alignment container classes
  const alignmentClasses = {
    left: "mr-auto",
    center: "mx-auto",
    right: "ml-auto",
    full: "w-full"
  }[alignment as "left" | "center" | "right" | "full"] || "mx-auto";

  const handleSaveMeta = () => {
    updateAttributes({
      caption: tempCaption,
      credit: tempCredit,
      alt: tempAlt
    });
    setIsEditingMeta(false);
  };

  const handleCancelMeta = () => {
    setTempCaption(caption);
    setTempCredit(credit);
    setTempAlt(alt);
    setIsEditingMeta(false);
  };

  return (
    <NodeViewWrapper className="my-6 relative group transition-all" data-drag-handle>
      <div className={`flex flex-col ${alignmentClasses} ${sizeClasses}`}>
        {/* Main Image Container */}
        <div
          className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 bg-gray-50 shadow-sm ${
            selected
              ? "border-blue-500 ring-4 ring-blue-500/20"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          {/* Floating Action Overlay Toolbar */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center bg-gray-900/90 backdrop-blur-md text-white p-1 rounded-lg shadow-xl border border-white/10 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-150 scale-95 group-hover:scale-100 space-x-1">
            {/* Alignment Group */}
            <div className="flex items-center space-x-0.5 border-r border-gray-700 pr-1 mr-1">
              <button
                type="button"
                title="Align Left"
                onClick={() => updateAttributes({ alignment: "left" })}
                className={`p-1.5 rounded hover:bg-white/20 transition ${
                  alignment === "left" ? "bg-blue-600 text-white" : "text-gray-300"
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Align Center"
                onClick={() => updateAttributes({ alignment: "center" })}
                className={`p-1.5 rounded hover:bg-white/20 transition ${
                  alignment === "center" ? "bg-blue-600 text-white" : "text-gray-300"
                }`}
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Align Right"
                onClick={() => updateAttributes({ alignment: "right" })}
                className={`p-1.5 rounded hover:bg-white/20 transition ${
                  alignment === "right" ? "bg-blue-600 text-white" : "text-gray-300"
                }`}
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Full Width"
                onClick={() => updateAttributes({ alignment: "full", size: "full" })}
                className={`p-1.5 rounded hover:bg-white/20 transition ${
                  alignment === "full" ? "bg-blue-600 text-white" : "text-gray-300"
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Size Group */}
            <div className="flex items-center space-x-0.5 border-r border-gray-700 pr-1 mr-1 text-[11px] font-semibold">
              {(["small", "medium", "large", "full"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => updateAttributes({ size: s })}
                  className={`px-1.5 py-1 rounded hover:bg-white/20 transition uppercase ${
                    size === s ? "bg-blue-600 text-white" : "text-gray-300"
                  }`}
                >
                  {s === "small" ? "S" : s === "medium" ? "M" : s === "large" ? "L" : "100%"}
                </button>
              ))}
            </div>

            {/* Caption & Metadata Modal Trigger */}
            <button
              type="button"
              title="Edit Caption & Copyright"
              onClick={() => setIsEditingMeta(!isEditingMeta)}
              className={`p-1.5 rounded hover:bg-white/20 transition ${
                isEditingMeta ? "bg-blue-600 text-white" : "text-gray-300"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            {/* Delete Image */}
            <button
              type="button"
              title="Remove Image"
              onClick={deleteNode}
              className="p-1.5 rounded hover:bg-red-600/80 text-red-400 hover:text-white transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Actual Rendered Image */}
          <img
            src={fullSrc}
            alt={alt || "Article illustration"}
            className="w-full h-auto object-cover max-h-[600px] select-none block"
            loading="lazy"
          />

          {/* Copyright badge on top right */}
          {credit && (
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-[10px] text-white/90 px-2 py-0.5 rounded pointer-events-none">
              Photo: {credit}
            </div>
          )}
        </div>

        {/* Caption Display / Inline Editor */}
        {isEditingMeta ? (
          <div className="mt-2 p-3 bg-gray-50 border border-gray-300 rounded-lg shadow-sm space-y-2 text-xs">
            <div className="flex items-center justify-between font-semibold text-gray-700 pb-1 border-b border-gray-200">
              <span className="flex items-center">
                <Info className="w-3.5 h-3.5 mr-1 text-blue-600" /> Image Details & Copyright
              </span>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={handleSaveMeta}
                  className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium flex items-center space-x-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Done</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelMeta}
                  className="p-1 text-gray-500 hover:bg-gray-200 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase">Caption</label>
              <input
                type="text"
                placeholder="Descriptive editorial caption..."
                value={tempCaption}
                onChange={(e) => setTempCaption(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded p-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Photo Credit / Agency</label>
                <input
                  type="text"
                  placeholder="e.g. PTI / Reuters"
                  value={tempCredit}
                  onChange={(e) => setTempCredit(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded p-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Alt Text (Accessibility & SEO)</label>
                <input
                  type="text"
                  placeholder="Image description..."
                  value={tempAlt}
                  onChange={(e) => setTempAlt(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded p-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        ) : (
          caption && (
            <figcaption className="mt-2 text-xs text-gray-500 text-center italic font-sans px-2">
              {caption}
              {credit && <span className="not-italic text-gray-400 ml-1">({credit})</span>}
            </figcaption>
          )
        )}
      </div>
    </NodeViewWrapper>
  );
}
