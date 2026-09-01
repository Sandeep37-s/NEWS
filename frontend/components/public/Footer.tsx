import React from "react";
import Link from "next/link";
import { ShieldCheck, Info, Mail, Scale, FileText } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 text-gray-400 border-t border-gray-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Editorial Mission */}
          <div className="space-y-4 md:col-span-1">
            <h2 className="font-serif text-2xl font-bold text-white tracking-tight">
              CHRONICLE
            </h2>
            <p className="text-xs leading-relaxed text-gray-400">
              An AI-assisted news curation and editorial publishing platform delivering verified, copyright-compliant summaries and real-time world intelligence.
            </p>
            <div className="flex items-center space-x-2 text-xs text-blue-400 font-medium bg-gray-900 px-3 py-2 rounded-lg border border-gray-800">
              <ShieldCheck className="w-4 h-4" />
              <span>Strict Attribution & Fair Use Architecture</span>
            </div>
          </div>

          {/* News Desks */}
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Editorial Desks
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/category/india" className="hover:text-white transition">India</Link></li>
              <li><Link href="/category/world" className="hover:text-white transition">World Affairs</Link></li>
              <li><Link href="/category/technology" className="hover:text-white transition">Technology & AI</Link></li>
              <li><Link href="/category/business" className="hover:text-white transition">Markets & Business</Link></li>
              <li><Link href="/category/science" className="hover:text-white transition">Science & Space</Link></li>
            </ul>
          </div>

          {/* More Categories */}
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Specialized Feeds
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/category/sports" className="hover:text-white transition">Sports</Link></li>
              <li><Link href="/category/entertainment" className="hover:text-white transition">Entertainment</Link></li>
              <li><Link href="/category/health" className="hover:text-white transition">Health & Medicine</Link></li>
              <li><Link href="/category/education" className="hover:text-white transition">Education</Link></li>
              <li><Link href="/latest" className="hover:text-white transition text-red-400 font-medium">Breaking Live Wire</Link></li>
            </ul>
          </div>

          {/* Legal & Newsroom Links */}
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Ethics & Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white transition">About Newsroom</Link></li>
              <li><Link href="/copyright" className="hover:text-white transition text-amber-400">Content & Copyright Policy</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">Newsroom Contacts</Link></li>
            </ul>
          </div>
        </div>

        {/* Attribution & Legal Notice */}
        <div className="border-t border-gray-900 mt-10 pt-6 text-xs text-gray-500 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p>© {currentYear} Chronicle News Platform. All rights reserved.</p>
          <p className="max-w-xl text-center md:text-right">
            Content on this platform consists of original staff reporting and AI-synthesized metadata summaries with explicit publisher attribution. We do not republish copyrighted full-text articles without explicit bilateral licensing.
          </p>
        </div>
      </div>
    </footer>
  );
}
