import React from "react";

export const metadata = {
  title: "Terms and Conditions of Service",
  description: "Terms and conditions governing access and usage of Chronicle News.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="border-b-2 border-gray-950 pb-4">
        <h1 className="font-serif text-4xl font-bold text-gray-950">Terms of Service</h1>
        <p className="text-gray-600 text-sm mt-2">
          Effective date: September 1, 2026.
        </p>
      </div>

      <div className="prose prose-lg text-gray-800 space-y-6 leading-relaxed font-serif">
        <p>
          By accessing or using Chronicle News, you agree to be bound by these Terms of Service. If you disagree with any portion of these terms, you should cease usage immediately.
        </p>

        <h2 className="font-serif text-2xl font-bold text-gray-900 mt-8 mb-4">1. Use of Content</h2>
        <p>
          The summaries, original commentary, and curated indices provided on Chronicle are for informational and non-commercial educational purposes. Automated scraping or bulk copying of our platform index without authorization is prohibited.
        </p>

        <h2 className="font-serif text-2xl font-bold text-gray-900 mt-8 mb-4">2. Disclaimer of Warranties</h2>
        <p>
          News developments move rapidly. While we endeavor to ensure high fidelity and accuracy in our AI synthesis and editorial review, Chronicle provides content &ldquo;as is&rdquo; without warranties of any kind.
        </p>
      </div>
    </div>
  );
}
