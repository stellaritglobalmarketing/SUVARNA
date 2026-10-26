import type { NextConfig } from "next";

// Product URLs that changed (newest catalogue: backend/seeds/data/catalog.js `replaces`). Permanent, so old
// links, bookmarks and Google results land on the new page and pass on their ranking.
const RENAMED_PRODUCTS: Record<string, string[]> = {
  "kashmiri-kesar-saffron": ["kashmir-saffron", "kashmiri-mongra-saffron"],
  "kashmir-wild-forest-honey": ["kashmir-wild-dark-honey", "raw-forest-honey"],
  "buffalo-bilona-ghee": ["pure-buffalo-ghee"],
  "gir-cow-bilona-ghee": ["pure-cow-ghee"],
  "kashmiri-almonds-badam": ["kashmiri-almonds", "kashmir-mamra-almonds"],
  "kashmiri-walnut-kernels-akhrot": ["kashmiri-walnut-kernels"],
  "diwali-dry-fruit-gift-box-kashmir": ["heritage-box"],
};

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
      // The old exchange page was replaced by the Refund, Return & Cancellation Policy.
      { source: "/return-policy", destination: "/refund-policy", permanent: true },
      ...Object.entries(RENAMED_PRODUCTS).flatMap(([slug, oldSlugs]) =>
        oldSlugs.map((oldSlug) => ({ source: `/products/${oldSlug}`, destination: `/products/${slug}`, permanent: true })),
      ),
    ];
  },
};

export default nextConfig;
