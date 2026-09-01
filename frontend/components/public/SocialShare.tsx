"use client";

import React, { useState } from "react";
import { Share2, Link as LinkIcon, Check } from "lucide-react";

interface SocialShareProps {
  title: string;
  url: string;
}

export default function SocialShare({ title, url }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">Share:</span>
      
      {/* WhatsApp */}
      <a
        href={shareLinks.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition"
        title="Share on WhatsApp"
        aria-label="Share on WhatsApp"
      >
        <span className="font-bold text-xs">WA</span>
      </a>

      {/* Twitter (X) */}
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-full bg-gray-100 text-gray-900 hover:bg-gray-200 transition"
        title="Share on X"
        aria-label="Share on X"
      >
        <span className="font-bold text-xs">𝕏</span>
      </a>

      {/* LinkedIn */}
      <a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
        title="Share on LinkedIn"
        aria-label="Share on LinkedIn"
      >
        <span className="font-bold text-xs">in</span>
      </a>

      {/* Facebook */}
      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
        title="Share on Facebook"
        aria-label="Share on Facebook"
      >
        <span className="font-bold text-xs">fb</span>
      </a>

      {/* Copy link */}
      <button
        onClick={handleCopy}
        className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition flex items-center"
        title="Copy Link"
        aria-label="Copy Link"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <LinkIcon className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
