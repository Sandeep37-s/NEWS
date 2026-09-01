"use client";

import React, { useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import { api } from "@/lib/api";
import { AuditLog } from "@/types";
import { formatDate, formatTimeAgo } from "@/lib/utils";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getLogs(100);
      setLogs(res);
    } catch (err) {
      console.error("Error loading logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Audit Trail & Security Logs"
        subtitle="Chronological record of editorial publishing, state transitions, source modifications, and administrative operations."
        onRefresh={fetchLogs}
      />

      <div className="p-6 sm:p-8 space-y-6 max-w-6xl">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-bold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-4 whitespace-nowrap text-gray-500">
                    {formatDate(l.created_at)} ({formatTimeAgo(l.created_at)})
                  </td>
                  <td className="py-3 px-4 font-bold text-gray-900">{l.action}</td>
                  <td className="py-3 px-4 uppercase text-[10px] text-gray-500 font-semibold">
                    {l.entity_type}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-gray-700 max-w-md truncate">
                    {JSON.stringify(l.details || {})}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400">
                    No audit logs recorded yet.
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
