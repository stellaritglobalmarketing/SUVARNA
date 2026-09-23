import { MOCK_PRODUCTS } from "@/lib/data/products.mock";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid } from "@/components/product/ProductGrid";

/** Single unified catalog listing — the client's full (and only) product range, no categories/best-sellers split. */
export function AllProducts() {
  return (
    <section id="products" className="scroll-mt-20 py-4 sm:py-12">
      <Container>
        <SectionHeading eyebrow="Our Range" title="Our Products" subtitle="Everything we grow, harvest and churn — in one place." />

        <div className="mt-6 sm:mt-8">
          <ProductGrid products={MOCK_PRODUCTS} />
        </div>
      </Container>
    </section>
  );
}
