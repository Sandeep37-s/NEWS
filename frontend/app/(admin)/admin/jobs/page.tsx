"use client";

import React, { useEffect, useState } from "react";
import { Activity, CheckCircle, AlertCircle, Clock, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { ProcessingJob } from "@/types";
import { formatTimeAgo } from "@/lib/utils";
import AdminHeader from "@/components/admin/AdminHeader";

export default function IngestionJobsPage() {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getJobs(50);
      setJobs(res);
    } catch (err) {
      console.error("Error loading jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Background Ingestion Job Logs"
        subtitle="Real-time execution log of RSS fetch cycles, AI synthesis tasks, and error tracking."
        onRefresh={fetchJobs}
      />

      <div className="p-6 sm:p-8 space-y-6 max-w-6xl">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-bold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Job Type</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Fetched</th>
                <th className="py-3 px-4">Processed</th>
                <th className="py-3 px-4">Skipped (Dup)</th>
                <th className="py-3 px-4">Started</th>
                <th className="py-3 px-4">Error Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-4 font-bold text-gray-900">{j.job_type}</td>
                  <td className="py-3 px-4 text-gray-800">{j.source?.name || "System Batch"}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                        j.status === "SUCCESS"
                          ? "bg-green-100 text-green-800"
                          : j.status === "FAILED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {j.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">{j.items_fetched}</td>
                  <td className="py-3 px-4 font-semibold text-green-700">{j.items_processed}</td>
                  <td className="py-3 px-4 text-gray-500">{j.items_skipped}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{formatTimeAgo(j.started_at)}</td>
                  <td className="py-3 px-4 text-red-600 max-w-xs truncate" title={j.error_message || ""}>
                    {j.error_message || "—"}
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    No ingestion jobs executed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
