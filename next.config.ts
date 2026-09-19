import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The floating dev-tools indicator (bottom-left "N" badge) has a known pointer-capture
  // bug under touch/mobile-emulation input and visually collides with our own bottom
  // tab bar. It's dev-only and never ships to production, so just turn it off.
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
