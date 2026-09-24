"use client";

import { useAppSelector } from "@/lib/redux/hooks";
import { selectWishlistIds } from "@/lib/redux/slices/wishlistSlice";
import { useProductsByIds } from "@/hooks/useProduct";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/ProductGrid";

export default function WishlistPage() {
  const wishlistIds = useAppSelector(selectWishlistIds);
  const { data: products, isLoading } = useProductsByIds(wishlistIds);

  return (
    <Container className="py-10">
      <SectionHeading eyebrow="Saved for Later" title="Your Wishlist" />

      {wishlistIds.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-brand-sand-dark py-20 text-center">
          <p className="text-brand-ink/70">Nothing saved yet — tap the heart on any product to add it here.</p>
          <Button href="/#products">Browse Products</Button>
        </div>
      ) : (
        <div className="mt-8">
          {isLoading && <ProductGridSkeleton count={wishlistIds.length} />}
          {products && <ProductGrid products={products} />}
        </div>
      )}
    </Container>
  );
}
