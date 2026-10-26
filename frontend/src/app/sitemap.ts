import type { MetadataRoute } from "next";
import { fetchProducts } from "@/lib/api/products";
import { SITE_URL, absoluteUrl } from "@/lib/seo";
import type { Product } from "@/types/product";

// Rebuilt at most once an hour, so new products and renamed URLs show up without a redeploy.
export const revalidate = 3600;

const STATIC_PAGES: { path: string; priority: number }[] = [
  { path: "", priority: 1 },
  { path: "/our-story", priority: 0.6 },
  { path: "/contact", priority: 0.5 },
  { path: "/help", priority: 0.4 },
  { path: "/track-order", priority: 0.3 },
  { path: "/refund-policy", priority: 0.2 },
  { path: "/privacy", priority: 0.2 },
  { path: "/terms", priority: 0.2 },
];

/** Every live product, page by page (the API serves 24 at a time). Empty if the API can't be reached. */
async function allProducts(): Promise<Product[]> {
  const products: Product[] = [];
  try {
    for (let page = 1; ; page += 1) {
      const result = await fetchProducts({ page, pageSize: 24 });
      products.push(...result.items);
      if (page >= result.totalPages) break;
    }
  } catch {
    // Still serve the static pages.
  }
  return products;
}

/** suvarna7.com/sitemap.xml — submit this in Google Search Console. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await allProducts();
  return [
    ...STATIC_PAGES.map(({ path, priority }) => ({ url: `${SITE_URL}${path}`, changeFrequency: "weekly" as const, priority })),
    ...products.map((product) => ({
      url: `${SITE_URL}/products/${product.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      images: product.images.slice(0, 1).map(absoluteUrl),
    })),
  ];
}
