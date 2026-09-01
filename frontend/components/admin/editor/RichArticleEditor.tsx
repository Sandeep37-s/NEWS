"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Unlink,
  Minus,
  Image as ImageIcon,
  RotateCcw,
  RotateCw,
  RemoveFormatting,
  Sparkles,
  Loader2
} from "lucide-react";
import { RichImageExtension } from "./RichImageExtension";
import MediaLibraryModal from "../media/MediaLibraryModal";
import { api } from "@/lib/api";

interface RichArticleEditorProps {
  content: string; // JSON string or HTML string
  onChange: (data: { json: any; jsonString: string; html: string; text: string }) => void;
  placeholder?: string;
  className?: string;
}

export default function RichArticleEditor({
  content,
  onChange,
  placeholder = "Write your comprehensive news article here... Click 'Image' to insert photos between paragraphs.",
  className = ""
}: RichArticleEditorProps) {
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isDropUploading, setIsDropUploading] = useState(false);
  const [linkInputOpen, setLinkInputOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  // Parse initial content safely (JSON or HTML)
  const parseInitialContent = (raw: string) => {
    if (!raw) return "";
    try {
      if (raw.trim().startsWith("{") && raw.includes('"type"')) {
        return JSON.parse(raw);
      }
    } catch {}
    return raw;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline font-medium hover:text-blue-800 transition",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      RichImageExtension,
    ],
    content: parseInitialContent(content),
    editorProps: {
      attributes: {
        class: "prose prose-base sm:prose-lg max-w-none focus:outline-none min-h-[380px] p-6 text-gray-900 font-serif leading-relaxed",
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
            uploadAndInsertDroppedFile(file, coordinates?.pos);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event, slice) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
              const file = items[i].getAsFile();
              if (file) {
                event.preventDefault();
                uploadAndInsertDroppedFile(file);
                return true;
              }
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const html = editor.getHTML();
      const text = editor.getText();
      onChange({
        json,
        jsonString: JSON.stringify(json),
        html,
        text,
      });
    },
  });

  // Keep content in sync if externally loaded (e.g. on initial edit fetch)
  useEffect(() => {
    if (editor && content && !editor.isFocused) {
      const currentHTML = editor.getHTML();
      const parsed = parseInitialContent(content);
      if (typeof parsed === "object") {
        if (JSON.stringify(editor.getJSON()) !== JSON.stringify(parsed)) {
          editor.commands.setContent(parsed, { emitUpdate: false });
        }
      } else if (content !== currentHTML && content !== `<p>${editor.getText()}</p>`) {
        editor.commands.setContent(content, { emitUpdate: false });
      }
    }
  }, [content, editor]);

  // Handle direct file drop / clipboard upload
  const uploadAndInsertDroppedFile = async (file: File, pos?: number) => {
    setIsDropUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("license_type", "OWNED");
      formData.append("alt_text", file.name.replace(/\.[^/.]+$/, ""));
      formData.append("original_source", "Staff Drag & Drop Upload");

      const asset = await api.admin.uploadMedia(formData);

      if (editor) {
        if (pos !== undefined) {
          editor
            .chain()
            .focus()
            .setTextSelection(pos)
            .setRichImage({
              src: asset.storage_url,
              imageId: asset.id,
              alt: asset.alt_text || file.name,
              caption: asset.caption || "",
              credit: asset.credit || "",
              alignment: "center",
              size: "large",
            })
            .run();
        } else {
          editor
            .chain()
            .focus()
            .setRichImage({
              src: asset.storage_url,
              imageId: asset.id,
              alt: asset.alt_text || file.name,
              caption: asset.caption || "",
              credit: asset.credit || "",
              alignment: "center",
              size: "large",
            })
            .run();
        }
      }
    } catch (err) {
      console.error("Direct drop upload failed:", err);
      alert("Failed to upload dropped image. Please use standard formats (JPEG, PNG, WebP).");
    } finally {
      setIsDropUploading(false);
    }
  };

  const handleInsertImageFromModal = (img: {
    src: string;
    imageId?: string;
    alt?: string;
    caption?: string;
    credit?: string;
    source?: string;
    license?: string;
    alignment?: "left" | "center" | "right" | "full";
    size?: "small" | "medium" | "large" | "full";
  }) => {
    if (editor) {
      editor
        .chain()
        .focus()
        .setRichImage({
          src: img.src,
          imageId: img.imageId,
          alt: img.alt || "",
          caption: img.caption || "",
          credit: img.credit || "",
          source: img.source || "",
          license: img.license || "OWNED",
          alignment: img.alignment || "center",
          size: img.size || "large",
        })
        .run();
    }
  };

  const handleSetLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    setLinkUrl(previousUrl || "");
    setLinkInputOpen(true);
  }, [editor]);

  const handleApplyLink = () => {
    if (!editor) return;
    if (linkUrl.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      let formatted = linkUrl.trim();
      if (!/^https?:\/\//i.test(formatted)) {
        formatted = `https://${formatted}`;
      }
      editor.chain().focus().extendMarkRange("link").setLink({ href: formatted }).run();
    }
    setLinkInputOpen(false);
    setLinkUrl("");
  };

  if (!editor) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-600" />
        <span>Initializing Rich Article Editor...</span>
      </div>
    );
  }

  return (
    <div className={`border border-gray-300 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col ${className}`}>
      {/* Sticky Top Toolbar */}
      <div className="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-md border-b border-gray-200 p-2 flex flex-wrap items-center gap-1">
        {/* Text Style Group */}
        <div className="flex items-center space-x-0.5 border-r border-gray-200 pr-1.5 mr-1">
          <button
            type="button"
            title="Bold (Ctrl+B)"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded-lg text-xs font-bold transition ${
              editor.isActive("bold") ? "bg-blue-600 text-white shadow-xs" : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Italic (Ctrl+I)"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded-lg text-xs font-bold transition ${
              editor.isActive("italic") ? "bg-blue-600 text-white shadow-xs" : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Underline (Ctrl+U)"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded-lg text-xs font-bold transition ${
              editor.isActive("underline") ? "bg-blue-600 text-white shadow-xs" : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center space-x-0.5 border-r border-gray-200 pr-1.5 mr-1">
          <button
            type="button"
            title="Main Heading (H1)"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded-lg text-xs font-bold transition ${
              editor.isActive("heading", { level: 1 }) ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Subheading (H2)"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded-lg text-xs font-bold transition ${
              editor.isActive("heading", { level: 2 }) ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Section Header (H3)"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded-lg text-xs font-bold transition ${
              editor.isActive("heading", { level: 3 }) ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Heading3 className="w-4 h-4" />
          </button>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center space-x-0.5 border-r border-gray-200 pr-1.5 mr-1">
          <button
            type="button"
            title="Bullet List"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded-lg text-xs transition ${
              editor.isActive("bulletList") ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Numbered List"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded-lg text-xs transition ${
              editor.isActive("orderedList") ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Pull Quote"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded-lg text-xs transition ${
              editor.isActive("blockquote") ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Horizontal Rule"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-2 rounded-lg text-xs text-gray-700 hover:bg-gray-200 transition"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Links */}
        <div className="flex items-center space-x-0.5 border-r border-gray-200 pr-1.5 mr-1">
          <button
            type="button"
            title="Insert Link"
            onClick={handleSetLink}
            className={`p-2 rounded-lg text-xs transition ${
              editor.isActive("link") ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          {editor.isActive("link") && (
            <button
              type="button"
              title="Remove Link"
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="p-2 rounded-lg text-xs text-red-600 hover:bg-red-50 transition"
            >
              <Unlink className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* INSERT INLINE IMAGE (CRITICAL FEATURE) */}
        <div className="flex items-center space-x-1 border-r border-gray-200 pr-1.5 mr-1">
          <button
            type="button"
            onClick={() => setIsMediaModalOpen(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm active:scale-95"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Insert Image</span>
          </button>
        </div>

        {/* Undo / Redo & Clear */}
        <div className="flex items-center space-x-0.5 ml-auto">
          <button
            type="button"
            title="Clear Formatting"
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            className="p-2 rounded-lg text-xs text-gray-600 hover:bg-gray-200 transition"
          >
            <RemoveFormatting className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Undo (Ctrl+Z)"
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
            className="p-2 rounded-lg text-xs text-gray-600 hover:bg-gray-200 transition disabled:opacity-30"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Redo (Ctrl+Y)"
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
            className="p-2 rounded-lg text-xs text-gray-600 hover:bg-gray-200 transition disabled:opacity-30"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Link Input Sub-bar */}
      {linkInputOpen && (
        <div className="p-3 bg-blue-50 border-b border-blue-200 flex items-center space-x-2 text-xs animate-in slide-in-from-top-1">
          <span className="font-semibold text-blue-900">Insert URL:</span>
          <input
            type="url"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleApplyLink();
              if (e.key === "Escape") setLinkInputOpen(false);
            }}
            className="flex-1 bg-white border border-blue-300 rounded-md p-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            autoFocus
          />
          <button
            type="button"
            onClick={handleApplyLink}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => setLinkInputOpen(false)}
            className="px-2 py-1.5 text-gray-600 hover:bg-blue-100 rounded"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Drop uploading indicator */}
      {isDropUploading && (
        <div className="p-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
          <span>Uploading and optimizing dropped image...</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative min-h-[420px] bg-white cursor-text" onClick={() => editor.chain().focus()}>
        <EditorContent editor={editor} />
      </div>

      {/* Footer Word & Character Counter */}
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-[11px] text-gray-400">
        <span className="flex items-center space-x-1">
          <Sparkles className="w-3 h-3 text-blue-500" />
          <span>Drag & Drop images directly anywhere in the editor, or paste from clipboard.</span>
        </span>
        <div className="space-x-3">
          <span>{editor.storage.characterCount?.words?.() || editor.getText().split(/\s+/).filter(Boolean).length} words</span>
          <span>•</span>
          <span>{editor.getText().length} characters</span>
        </div>
      </div>

      {/* Image Insertion & Media Picker Modal */}
      <MediaLibraryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelectImage={handleInsertImageFromModal}
      />
    </div>
  );
}
