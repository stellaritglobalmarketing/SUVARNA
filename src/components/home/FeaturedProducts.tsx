"use client";

import { useProducts } from "@/hooks/useProducts";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/ProductGrid";

export function FeaturedProducts() {
  const { data, isLoading, isError } = useProducts({ page: 1, pageSize: 8, sort: "newest" });

  return (
    <section className="py-4 sm:py-12">
      <Container>
        <SectionHeading
          eyebrow="Fresh In"
          title="Featured Products"
          subtitle="More from the full Harvesta range."
          viewAllHref="/products"
        />

        <div className="mt-6 sm:mt-8">
          {isLoading && <ProductGridSkeleton count={4} />}
          {isError && <p className="text-sm text-red-600">Couldn&apos;t load featured products right now.</p>}
          {data && <ProductGrid products={data.items} />}
        </div>
      </Container>
    </section>
  );
}
