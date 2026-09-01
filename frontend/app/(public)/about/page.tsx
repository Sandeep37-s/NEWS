import React from "react";
import { ShieldCheck, Sparkles, Globe, Cpu } from "lucide-react";

export const metadata = {
  title: "About Newsroom & Mission",
  description: "Learn about Chronicle News, our editorial standards, AI ethics policy, and reporting principles.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="border-b-2 border-gray-950 pb-4">
        <h1 className="font-serif text-4xl font-bold text-gray-950">About Chronicle News</h1>
        <p className="text-gray-600 text-base mt-2">
          Independent global news intelligence powered by ethical AI synthesis and human editorial rigor.
        </p>
      </div>

      <div className="prose prose-lg text-gray-800 space-y-6 leading-relaxed font-serif">
        <p>
          Founded to combat information overload, clickbait sensationalism, and fragmented news feeds, <strong>Chronicle</strong> provides concise, factual, and verified news digests.
        </p>

        <h2 className="font-serif text-2xl font-bold text-gray-900 mt-8 mb-4">Our Three Pillars</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 not-prose my-6 font-sans">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <ShieldCheck className="w-6 h-6 text-blue-600 mb-3" />
            <h3 className="font-bold text-gray-900 text-sm">Copyright Integrity</h3>
            <p className="text-xs text-gray-600 mt-1">
              We never scrape or duplicate full-text articles. Every aggregated story prominently credits the primary publisher with a direct canonical outbound link.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <Sparkles className="w-6 h-6 text-amber-600 mb-3" />
            <h3 className="font-bold text-gray-900 text-sm">Editorial AI Assistance</h3>
            <p className="text-xs text-gray-600 mt-1">
              Our AI pipelines summarize permitted metadata into neutral executive briefings, stripping hype and maintaining strict factual neutrality.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <Globe className="w-6 h-6 text-green-600 mb-3" />
            <h3 className="font-bold text-gray-900 text-sm">Human in the Loop</h3>
            <p className="text-xs text-gray-600 mt-1">
              Every automated brief undergoes editorial review, policy checks, and validation before reaching the public index.
            </p>
          </div>
        </div>

        <h2 className="font-serif text-2xl font-bold text-gray-900 mt-8 mb-4">AI Ethics & Neutrality Statement</h2>
        <p>
          Chronicle adheres to the highest standards of digital transparency. Automated systems are strictly prohibited from generating speculative commentary, emotional framing, or altered quotations. All summaries cite the original journalistic reporting from which the facts originate.
        </p>
      </div>
    </div>
  );
}
