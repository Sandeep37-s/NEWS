"use client";

import React, { useState } from "react";
import Link from "next/link";
import { RefreshCw, PlusCircle, CheckCircle, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
}

export default function AdminHeader({ title, subtitle, onRefresh }: AdminHeaderProps) {
  const [ingesting, setIngesting] = useState(false);
  const [ingestMsg, setIngestMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleTriggerIngestion = async () => {
    setIngesting(true);
    setIngestMsg(null);
    try {
      const res = await api.admin.triggerAllIngestion();
      setIngestMsg({ type: "success", text: res.message || "Ingestion cycle completed." });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setIngestMsg({ type: "error", text: err.message || "Ingestion trigger failed." });
    } finally {
      setIngesting(false);
      setTimeout(() => setIngestMsg(null), 4000);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-3">
        {ingestMsg && (
          <span
            className={`text-xs font-medium px-3 py-1.5 rounded-md flex items-center ${
              ingestMsg.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {ingestMsg.type === "success" ? (
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
            )}
            {ingestMsg.text}
          </span>
        )}

        <button
          onClick={handleTriggerIngestion}
          disabled={ingesting}
          className="flex items-center space-x-2 px-3.5 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${ingesting ? "animate-spin text-blue-600" : ""}`} />
          <span>{ingesting ? "Fetching Feeds..." : "Fetch Feeds Now"}</span>
        </button>

        <Link
          href="/admin/create"
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Article</span>
        </Link>
      </div>
    </header>
  );
}
