import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/** suvarna7.com/robots.txt — the storefront is open to search engines; admin, account and checkout pages aren't. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/cart", "/checkout", "/orders", "/addresses", "/profile", "/wishlist", "/login", "/signup"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
