import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The floating dev-tools indicator (bottom-left "N" badge) has a known pointer-capture
  // bug under touch/mobile-emulation input and visually collides with our own bottom
  // tab bar. It's dev-only and never ships to production, so just turn it off.
  devIndicators: false,
  images: {
    // Product/category image URLs are admin-controlled (Cloudinary uploads, or arbitrary
    // URLs in test/seed data), not end-user input, so a wildcard host is an acceptable
    // trade-off to avoid the app breaking on unpredictable real data.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  // One address for the store: www.suvarna7.com permanently redirects to suvarna7.com, so customers,
  // search engines and Razorpay's registered-website check all see the same site.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.suvarna7.com" }],
        destination: "https://suvarna7.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
