import type { Product } from "@/types/product";
import { ProductCard } from "./ProductCard";

/** Mobile-only swipeable row — an app-native alternative to the grid used on larger screens. */
export function ProductCarousel({ products }: { products: Product[] }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {products.map((product) => (
        <div key={product.id} className="w-[68%] shrink-0 snap-start">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
