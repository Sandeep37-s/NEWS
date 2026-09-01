"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Rss,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Activity,
  PlusCircle,
  ExternalLink
} from "lucide-react";
import { api } from "@/lib/api";
import { DashboardStats } from "@/types";
import { formatTimeAgo } from "@/lib/utils";
import AdminHeader from "@/components/admin/AdminHeader";
import StatsCard from "@/components/admin/StatsCard";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Editorial Dashboard"
        subtitle="Platform metrics, pending ingestion review, and newsroom activity."
        onRefresh={fetchStats}
      />

      <div className="p-6 sm:p-8 space-y-8 max-w-7xl">
        {/* Pending Review Alert Banner */}
        {stats && stats.pending_review > 0 && (
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">
                  {stats.pending_review} Article{stats.pending_review > 1 ? "s" : ""} Pending Review
                </h3>
                <p className="text-amber-100 text-xs mt-0.5">
                  AI-processed news stories are awaiting editorial validation and publishing.
                </p>
              </div>
            </div>
            <Link
              href="/admin/pending"
              className="px-5 py-2 bg-white text-amber-900 rounded-lg font-bold text-sm hover:bg-amber-50 transition shadow-sm self-start sm:self-auto flex items-center"
            >
              Open Review Queue <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard
            title="Total Articles"
            value={stats?.total_articles ?? "—"}
            icon={FileText}
            color="blue"
            subtitle={`${stats?.articles_this_week ?? 0} this week`}
          />
          <StatsCard
            title="Published Today"
            value={stats?.published_today ?? "—"}
            icon={CheckCircle}
            color="green"
            subtitle="Active on live site"
          />
          <StatsCard
            title="Pending Review"
            value={stats?.pending_review ?? "—"}
            icon={Clock}
            color="amber"
            subtitle="Awaiting editorial action"
          />
          <StatsCard
            title="Active Sources"
            value={stats?.total_sources ?? "—"}
            icon={Rss}
            color="purple"
            subtitle={stats?.failed_sources ? `${stats.failed_sources} failing` : "All feeds healthy"}
          />
        </div>

        {/* Action Shortcuts & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Publishing Controls */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-base border-b border-gray-100 pb-3">
              Editorial Workflow
            </h3>

            <div className="space-y-2.5">
              <Link
                href="/admin/pending"
                className="flex items-center justify-between p-3.5 bg-amber-50/60 hover:bg-amber-100/70 border border-amber-200 rounded-lg text-amber-900 transition group"
              >
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-bold">Review Queue</p>
                    <p className="text-xs text-amber-700">Approve or reject automated feeds</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition" />
              </Link>

              <Link
                href="/admin/create"
                className="flex items-center justify-between p-3.5 bg-blue-50/60 hover:bg-blue-100/70 border border-blue-200 rounded-lg text-blue-900 transition group"
              >
                <div className="flex items-center space-x-3">
                  <PlusCircle className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-bold">Create Original Story</p>
                    <p className="text-xs text-blue-700">Draft and publish original reporting</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition" />
              </Link>

              <Link
                href="/admin/sources"
                className="flex items-center justify-between p-3.5 bg-purple-50/60 hover:bg-purple-100/70 border border-purple-200 rounded-lg text-purple-900 transition group"
              >
                <div className="flex items-center space-x-3">
                  <Rss className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-bold">Manage News Sources</p>
                    <p className="text-xs text-purple-700">Configure RSS feeds & usage rules</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition" />
              </Link>
            </div>
          </div>

          {/* Activity Log */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 text-base border-b border-gray-100 pb-3 flex items-center justify-between">
              <span>Recent Activity & Audit Trail</span>
              <Activity className="w-4 h-4 text-gray-400" />
            </h3>

            {stats?.recent_activity && stats.recent_activity.length > 0 ? (
              <div className="divide-y divide-gray-100 mt-2">
                {stats.recent_activity.map((log) => (
                  <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-gray-900">{log.action}</span>
                      <p className="text-gray-500 mt-0.5">
                        {log.details?.title || log.entity_type}
                      </p>
                    </div>
                    <span className="text-gray-400 flex-shrink-0">
                      {formatTimeAgo(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400 text-xs">
                No recent administrative actions recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
