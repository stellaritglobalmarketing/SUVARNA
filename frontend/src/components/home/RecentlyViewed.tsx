"use client";

import { useAppSelector } from "@/lib/redux/hooks";
import { selectRecentlyViewedIds } from "@/lib/redux/slices/recentlyViewedSlice";
import { useProductsByIds } from "@/hooks/useProduct";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/ProductGrid";

export function RecentlyViewed() {
  const recentlyViewedIds = useAppSelector(selectRecentlyViewedIds);
  const { data: products, isLoading } = useProductsByIds(recentlyViewedIds);

  if (recentlyViewedIds.length === 0) return null;

  return (
    <section className="py-4 sm:py-12">
      <Container>
        <SectionHeading eyebrow="Pick Up Where You Left" title="Recently Viewed" />
        <div className="mt-6 sm:mt-8">
          {isLoading && <ProductGridSkeleton count={4} />}
          {products && <ProductGrid products={products} />}
        </div>
      </Container>
    </section>
  );
}
