"use client";

import { useBestSellers } from "@/hooks/useBestSellers";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/ProductGrid";
import { ProductCarousel } from "@/components/product/ProductCarousel";

export function BestSellers() {
  const { data: products, isLoading, isError } = useBestSellers(4);

  return (
    <section className="py-4 sm:py-12">
      <Container>
        <SectionHeading
          eyebrow="Customer Favourites"
          title="Dynamic Best Sellers"
          subtitle="Switch pack sizes right here — prices recalculate instantly, just like on the product page."
          viewAllHref="/products"
        />
        <div className="mt-6 sm:mt-8">
          {isLoading && <ProductGridSkeleton count={4} />}
          {isError && <p className="text-sm text-red-600">Couldn&apos;t load best sellers right now.</p>}
          {products && (
            <>
              <div className="sm:hidden">
                <ProductCarousel products={products} />
              </div>
              <div className="hidden sm:block">
                <ProductGrid products={products} />
              </div>
            </>
          )}
        </div>
      </Container>
    </section>
  );
}
