"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Layers,
  Rss,
  Tags,
  Activity,
  ScrollText,
  Settings,
  LogOut,
  PlusCircle,
  ExternalLink,
  Image as ImageIcon
} from "lucide-react";
import { api } from "@/lib/api";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Pending Review", href: "/admin/pending", icon: Clock, highlight: true },
  { label: "All Articles", href: "/admin/articles", icon: FileText },
  { label: "Write Article", href: "/admin/create", icon: PlusCircle },
  { label: "Media Library", href: "/admin/media", icon: ImageIcon },
  { label: "News Sources", href: "/admin/sources", icon: Rss },
  { label: "Categories", href: "/admin/categories", icon: Layers },
  { label: "Tags", href: "/admin/tags", icon: Tags },
  { label: "Ingestion Jobs", href: "/admin/jobs", icon: Activity },
  { label: "Audit Logs", href: "/admin/logs", icon: ScrollText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    router.push("/admin/login");
  };

  return (
    <aside className="w-64 bg-gray-950 text-gray-300 min-h-screen flex flex-col justify-between border-r border-gray-800 flex-shrink-0">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-xl font-bold text-white tracking-wider">
              CHRONICLE
            </h1>
            <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-widest">
              Editorial Studio
            </p>
          </div>
          <Link
            href="/"
            target="_blank"
            className="p-1.5 rounded-lg bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 transition"
            title="View Live Website"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : item.highlight
                    ? "text-amber-300 hover:bg-gray-900 hover:text-amber-200"
                    : "text-gray-400 hover:bg-gray-900 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : item.highlight ? "text-amber-400" : "text-gray-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-gray-800 space-y-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
