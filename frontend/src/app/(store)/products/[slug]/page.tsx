import { cache } from "react";
import type { Metadata } from "next";
import { fetchProductBySlug } from "@/lib/api/products";
import { absoluteUrl, productJsonLd } from "@/lib/seo";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";

/** One API call per request, shared by the metadata and the page. Null when the product can't be loaded. */
const loadProduct = cache(async (slug: string) => {
  try {
    return await fetchProductBySlug(slug);
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return { title: "Suvarna7 — Product Details" };

  const title = product.metaTitle || `${product.name} | Suvarna7`;
  const description = product.metaDescription || product.shortDescription || product.tagline;
  const image = product.images[0];
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/products/${product.slug}`,
      images: image ? [{ url: absoluteUrl(image), alt: product.imageAlt || product.name }] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  return (
    <>
      {product &&
        productJsonLd(product).map((schema, index) => (
          <script
            key={index}
            type="application/ld+json"
            // "<" is escaped so product text can never close the script tag.
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
          />
        ))}
      <ProductDetailClient slug={slug} initialProduct={product ?? undefined} />
    </>
  );
}
