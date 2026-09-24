import type { Metadata } from "next";
import { fetchProductBySlug } from "@/lib/api/products";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await fetchProductBySlug(slug);
    return {
      title: `Suvarna7 — ${product.name} Product Details`,
      description: product.tagline,
    };
  } catch {
    return { title: "Suvarna7 — Product Details" };
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductDetailClient slug={slug} />;
}
