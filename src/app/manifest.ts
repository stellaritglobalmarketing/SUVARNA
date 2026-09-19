import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Harvesta — Artisanal Dry Fruits & Healthy Pantry",
    short_name: "Harvesta",
    description: "Grade-A Kashmiri & Californian dry fruits, dates and pantry staples, delivered fresh across India.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fdf9f1",
    theme_color: "#23412e",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
