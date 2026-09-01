import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Chronicle — Verified News & AI Editorial Intelligence",
    template: "%s | Chronicle News",
  },
  description: "Global news discovery, AI-curated analysis, and verified reporting across India, world affairs, technology, science, and business.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  keywords: ["news", "breaking news", "technology", "world affairs", "india", "business", "science", "AI news"],
  authors: [{ name: "Chronicle Newsroom" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    siteName: "Chronicle News",
    title: "Chronicle — Verified News & AI Editorial Intelligence",
    description: "Global news discovery, AI-curated analysis, and verified reporting across India, world affairs, technology, science, and business.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chronicle — Verified News & AI Editorial Intelligence",
    description: "Global news discovery, AI-curated analysis, and verified reporting across India, world affairs, technology, science, and business.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
