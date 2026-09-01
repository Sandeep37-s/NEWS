import React from "react";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy practices, data retention policies, and user protections on Chronicle News.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="border-b-2 border-gray-950 pb-4">
        <h1 className="font-serif text-4xl font-bold text-gray-950">Privacy Policy</h1>
        <p className="text-gray-600 text-sm mt-2">
          Effective date: September 1, 2026. Customization placeholder for your domain deployment.
        </p>
      </div>

      <div className="prose prose-lg text-gray-800 space-y-6 leading-relaxed font-serif">
        <p>
          At Chronicle News, we value reader privacy. This policy outlines how information is collected, used, and protected when you visit our website.
        </p>

        <h2 className="font-serif text-2xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
        <p>
          We do not require public readers to create accounts. We collect standard server access logs (such as IP addresses, browser user agent, and timestamp) strictly for security, rate-limiting, and error diagnostics.
        </p>

        <h2 className="font-serif text-2xl font-bold text-gray-900 mt-8 mb-4">2. Cookies and Session Storage</h2>
        <p>
          Public readers do not receive tracking cookies. Editorial administrators receive secure HTTP-only cookies necessary to maintain authenticated dashboard sessions.
        </p>

        <h2 className="font-serif text-2xl font-bold text-gray-900 mt-8 mb-4">3. Third-Party Links & Outbound Traffic</h2>
        <p>
          Our platform links to external primary news publishers. When you click outbound attribution links, you are subject to the privacy policies of the destination website.
        </p>
      </div>
    </div>
  );
}
