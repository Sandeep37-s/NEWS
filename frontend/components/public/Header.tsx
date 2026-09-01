"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Menu, X, Globe, Shield, Sparkles, TrendingUp } from "lucide-react";
import { Category } from "@/types";

const NAV_CATEGORIES = [
  { name: "India", slug: "india" },
  { name: "World", slug: "world" },
  { name: "Technology", slug: "technology" },
  { name: "Business", slug: "business" },
  { name: "Sports", slug: "sports" },
  { name: "Entertainment", slug: "entertainment" },
  { name: "Science", slug: "science" },
  { name: "Health", slug: "health" },
  { name: "Education", slug: "education" },
];

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const currentDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-40">
      {/* Top Banner: Date, Trust Badge & Admin Link */}
      <div className="bg-gray-900 text-gray-300 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span>{currentDate}</span>
            <span className="text-gray-600">|</span>
            <span className="flex items-center text-blue-400 font-medium">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> AI-Curated Editorial Intelligence
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/about" className="hover:text-white transition">About</Link>
            <Link href="/copyright" className="hover:text-white transition">Attribution & Ethics</Link>
            <Link
              href="/admin/dashboard"
              className="flex items-center text-amber-400 hover:text-amber-300 transition font-medium"
            >
              <Shield className="w-3.5 h-3.5 mr-1" /> Admin Desk
            </Link>
          </div>
        </div>
      </div>

      {/* Main Brand & Search Bar */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <Link href="/" className="group">
            <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-gray-950 group-hover:text-blue-600 transition">
              CHRONICLE
            </h1>
            <p className="text-[10px] tracking-widest uppercase font-semibold text-gray-500">
              Verified Global News Wire
            </p>
          </Link>
        </div>

        {/* Desktop Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center relative w-72 lg:w-96">
          <input
            type="text"
            placeholder="Search verified news, topics, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
          <button
            type="submit"
            className="absolute right-1.5 p-1.5 text-gray-500 hover:text-blue-600 rounded-full"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Categories Navigation Bar */}
      <nav className="border-t border-gray-100 hidden md:block bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center space-x-1 lg:space-x-6 overflow-x-auto py-2.5 text-sm font-medium text-gray-700">
            <li>
              <Link
                href="/latest"
                className="flex items-center px-3 py-1 rounded-md text-red-600 hover:bg-red-50 font-semibold transition"
              >
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse mr-2" />
                Latest Wire
              </Link>
            </li>
            {NAV_CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/category/${cat.slug}`}
                  className="px-3 py-1 rounded-md hover:text-blue-600 hover:bg-gray-50 transition block whitespace-nowrap"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 pt-3 pb-6 space-y-4 shadow-xl">
          <form onSubmit={handleSearch} className="flex items-center relative">
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="absolute right-2 p-1.5 text-gray-500">
              <Search className="w-4 h-4" />
            </button>
          </form>

          <div className="space-y-1">
            <Link
              href="/latest"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center px-3 py-2 rounded-lg text-red-600 font-semibold bg-red-50"
            >
              <span className="w-2 h-2 rounded-full bg-red-600 mr-2" />
              Latest News Wire
            </Link>
            {NAV_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg"
              >
                {cat.name}
              </Link>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-3 space-y-2 text-sm text-gray-600">
            <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="block py-1">About Us</Link>
            <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block py-1">Contact Newsroom</Link>
            <Link href="/copyright" onClick={() => setMobileMenuOpen(false)} className="block py-1">Copyright Policy</Link>
            <Link href="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-amber-600 font-medium">Admin Dashboard</Link>
          </div>
        </div>
      )}
    </header>
  );
}
