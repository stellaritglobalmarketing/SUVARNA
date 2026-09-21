"use client";

import { useProducts } from "@/hooks/useProducts";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/ProductGrid";
import type { ProductCategory } from "@/types/product";

export function SimilarProducts({ category, excludeSlug }: { category: ProductCategory; excludeSlug: string }) {
  const { data, isLoading } = useProducts({
    page: 1,
    pageSize: 8,
    category,
    sort: "popularity",
  });
  const similar = data?.items.filter((product) => product.slug !== excludeSlug).slice(0, 4) ?? [];

  if (!isLoading && similar.length === 0) return null;

  return (
    <div>
      <SectionHeading eyebrow="Keep Exploring" title="You May Also Like" />
      <div className="mt-6">
        {isLoading && <ProductGridSkeleton count={4} />}
        {!isLoading && <ProductGrid products={similar} />}
      </div>
    </div>
  );
}
