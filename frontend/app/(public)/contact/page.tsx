import React from "react";
import { Mail, MessageSquare, ShieldAlert, Phone } from "lucide-react";

export const metadata = {
  title: "Contact Newsroom & Press Office",
  description: "Get in touch with the editorial team, report corrections, or submit press inquiries.",
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="border-b-2 border-gray-950 pb-4">
        <h1 className="font-serif text-4xl font-bold text-gray-950">Contact Newsroom</h1>
        <p className="text-gray-600 text-base mt-2">
          Direct communication channels for editorial tips, corrections, attribution queries, and press inquiries.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg w-fit">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900">General Editorial Desk</h3>
          <p className="text-sm text-gray-600">
            For news submissions, story suggestions, and general editorial correspondence:
          </p>
          <p className="text-sm font-semibold text-blue-600">editor@chronicle-news.local</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg w-fit">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900">Attribution & Copyright Notice</h3>
          <p className="text-sm text-gray-600">
            For publishers with queries regarding syndication, DMCA notices, or feed adjustments:
          </p>
          <p className="text-sm font-semibold text-amber-600">copyright@chronicle-news.local</p>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 space-y-4">
        <h2 className="font-serif text-xl font-bold text-gray-900">Corrections & Clarifications Policy</h2>
        <p className="text-sm text-gray-700 leading-relaxed font-serif">
          Chronicle promptly investigates any reported factual inaccuracy in our AI summaries or staff reporting. When an error is identified, our editorial staff updates the record and appends a formal correction note to the published entry.
        </p>
      </div>
    </div>
  );
}
