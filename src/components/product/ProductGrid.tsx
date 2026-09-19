import type { Product } from "@/types/product";
import { ProductCard } from "./ProductCard";
import { Skeleton } from "@/components/ui/Skeleton";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-sand-dark py-20 text-center">
        <p className="text-lg font-medium text-brand-forest">No products match these filters</p>
        <p className="mt-1 text-sm text-brand-ink/60">Try widening your price range or clearing a filter.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-2xl border border-brand-sand-dark bg-white p-4">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}
