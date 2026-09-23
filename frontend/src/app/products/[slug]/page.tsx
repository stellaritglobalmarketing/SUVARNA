import type { Metadata } from "next";
import { fetchProductBySlug } from "@/lib/api/products";
import { MOCK_PRODUCTS } from "@/lib/data/products.mock";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";

export function generateStaticParams() {
  return MOCK_PRODUCTS.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await fetchProductBySlug(slug);
    return {
      title: `Harvesta — ${product.name} Product Details`,
      description: product.tagline,
    };
  } catch {
    return { title: "Harvesta — Product Details" };
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductDetailClient slug={slug} />;
}
