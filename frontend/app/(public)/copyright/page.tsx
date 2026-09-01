import React from "react";
import { ShieldCheck, Scale, FileText, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Content & Copyright Policy",
  description: "Our comprehensive intellectual property standards, attribution requirements, and DMCA takedown procedures.",
};

export default function CopyrightPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="border-b-2 border-gray-950 pb-4">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
          Legal & Intellectual Property
        </span>
        <h1 className="font-serif text-4xl font-bold text-gray-950 mt-1">
          Content & Copyright Policy
        </h1>
        <p className="text-gray-600 text-sm mt-2">
          Last updated: September 1, 2026. This policy outlines our architecture for copyright respect, source attribution, and publisher collaboration.
        </p>
      </div>

      <div className="prose prose-lg text-gray-800 space-y-6 leading-relaxed font-serif">
        <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl not-prose font-sans text-sm text-amber-900">
          <strong>Notice:</strong> This document reflects our technical architecture and operational standards. It is provided for transparency and does not constitute formal legal counsel.
        </div>

        <h2 className="font-serif text-2xl font-bold text-gray-900 mt-8 mb-4">1. Architectural Commitment to Original Journalism</h2>
        <p>
          Chronicle firmly upholds that independent journalism is irreplaceable. Our platform is strictly engineered <strong>never to scrape, copy, or republish full-text third-party articles</strong>. We do not treat publicly accessible RSS feeds as licenses for wholesale reproduction.
        </p>

        <h2 className="font-serif text-2xl font-bold text-gray-900 mt-8 mb-4">2. Permitted Use of Metadata & Transformative Summaries</h2>
        <p>
          In accordance with international fair use principles and source usage policies:
        </p>
        <ul>
          <li>We index only headline metadata, publication timestamps, and permitted excerpts.</li>
          <li>Our AI models synthesize brief, transformative executive summaries (typically under 150 words) designed to inform readers while directing traffic back to primary sources.</li>
          <li>Every syndicated entry includes prominent publisher attribution and a canonical outbound link (`rel=&quot;nofollow noopener&quot;`).</li>
        </ul>

        <h2 className="font-serif text-2xl font-bold text-gray-900 mt-8 mb-4">3. Imagery and Media Rights</h2>
        <p>
          We do not scrape or reproduce arbitrary imagery from external news websites. Third-party images are only displayed when explicitly provided under open licenses (such as Creative Commons CC-BY), licensed through media providers, or accompanied by owned editorial staff photography. If a source restricts image syndication, all image links are discarded by our ingestion pipeline.
        </p>

        <h2 className="font-serif text-2xl font-bold text-gray-900 mt-8 mb-4">4. Publisher Opt-Out & DMCA Takedown Process</h2>
        <p>
          Publishers who wish to modify how their feeds are indexed or request removal of specific metadata may submit a formal request:
        </p>
        <div className="bg-gray-100 p-4 rounded-lg not-prose font-sans text-xs space-y-1 text-gray-800">
          <p><strong>Designated Copyright Officer:</strong> Legal & Copyright Desk, Chronicle News</p>
          <p><strong>Email:</strong> copyright@chronicle-news.local</p>
          <p><strong>Response Time:</strong> Takedown requests and feed adjustments are processed within 24–48 business hours.</p>
        </div>
      </div>
    </div>
  );
}
