"use client";

import React from "react";
import { Settings as SettingsIcon, Shield, Cpu, Database, Globe, Key } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";

export default function SettingsPage() {
  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Platform & Environment Settings"
        subtitle="System architecture configuration, OpenRouter AI parameters, and domain settings."
      />

      <div className="p-6 sm:p-8 space-y-8 max-w-4xl font-sans">
        {/* OpenRouter AI Engine */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 text-gray-900 border-b border-gray-100 pb-3">
            <Cpu className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base">OpenRouter AI Configuration</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-gray-500 block font-medium">Configured Model:</span>
              <span className="font-mono font-bold text-gray-800">
                {process.env.NEXT_PUBLIC_OPENROUTER_MODEL || "google/gemini-2.0-flash-001"}
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-gray-500 block font-medium">Key Storage:</span>
              <span className="font-bold text-green-700 flex items-center mt-0.5">
                <Shield className="w-3.5 h-3.5 mr-1" /> Isolated Backend Pydantic Settings
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-gray-500 block font-medium">Output Format:</span>
              <span className="font-mono text-gray-800">JSON Schema Validated</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-gray-500 block font-medium">Estimated Token Cost:</span>
              <span className="font-semibold text-gray-800">~$0.075 / 1M input tokens (~₹6/1000 arts)</span>
            </div>
          </div>
        </div>

        {/* Database & Storage */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 text-gray-900 border-b border-gray-100 pb-3">
            <Database className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-base">Database & Storage Driver</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-gray-500 block font-medium">Database Engine:</span>
              <span className="font-bold text-gray-800">SQLAlchemy 2.0 Async (PostgreSQL / SQLite)</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-gray-500 block font-medium">Asset Storage:</span>
              <span className="font-bold text-gray-800">Local Uploads (`/uploads`) / Cloudinary</span>
            </div>
          </div>
        </div>

        {/* Domain & SEO Configuration */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 text-gray-900 border-b border-gray-100 pb-3">
            <Globe className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-base">Domain & Site URL</h3>
          </div>

          <div className="text-xs text-gray-600 space-y-2">
            <p>
              Current Public Site URL: <code className="font-bold text-blue-700">{process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}</code>
            </p>
            <p>
              Backend API URL: <code className="font-bold text-blue-700">{process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}</code>
            </p>
            <p className="text-gray-500 pt-2 border-t border-gray-100">
              To migrate domains (e.g. from GitHub Student <code>.me</code> to a production domain), simply update <code>NEXT_PUBLIC_SITE_URL</code> and <code>ALLOWED_ORIGINS</code> in <code>.env</code> without modifying source code.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
