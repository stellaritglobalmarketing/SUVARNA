import type { Product } from "@/types/product";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid } from "@/components/product/ProductGrid";

/** "You may also like" — products sharing the most health benefits, delivered with the product detail response. */
export function SimilarProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <div>
      <SectionHeading eyebrow="Keep Exploring" title="You May Also Like" />
      <div className="mt-6">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
