"use client";

import { useProductsByIds } from "@/hooks/useProduct";
import { useAppDispatch } from "@/lib/redux/hooks";
import { addToCart } from "@/lib/redux/slices/cartSlice";
import { pushToast } from "@/lib/redux/slices/uiSlice";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductImagePlaceholder } from "@/components/ui/ProductImagePlaceholder";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatInr } from "@/lib/utils/format";

const COMBOS = [
  {
    id: "combo-nutty-duo",
    title: "The Nutty Duo",
    description: "Mamra Almonds + King Cashews, shipped together.",
    productIds: ["p-almond-mamra", "p-cashew-king"],
  },
  {
    id: "combo-heart-health",
    title: "Heart Health Combo",
    description: "Medjool Dates + Kashmiri Walnuts, for daily wellness.",
    productIds: ["p-date-medjool", "p-walnut-kashmiri"],
  },
  {
    id: "combo-golden-kitchen",
    title: "The Golden Kitchen Combo",
    description: "Mongra Saffron + Pure Desi Ghee, for festive cooking.",
    productIds: ["p-saffron-mongra", "p-ghee-desi"],
  },
];

export function ComboDeals() {
  return (
    <section className="py-4 sm:py-12">
      <Container>
        <SectionHeading eyebrow="Shop Together" title="Combo Deals" subtitle="Curated pairings our customers buy again and again." />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2">
          {COMBOS.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))}
        </div>
      </Container>
    </section>
  );
}

function ComboCard({ combo }: { combo: (typeof COMBOS)[number] }) {
  const { data: products, isLoading } = useProductsByIds(combo.productIds);
  const dispatch = useAppDispatch();

  if (isLoading || !products) {
    return <Skeleton className="h-40 w-full rounded-2xl" />;
  }

  const total = products.reduce((sum, product) => sum + product.variants[0].price, 0);

  const handleAddCombo = () => {
    products.forEach((product) => {
      const variant = product.variants[0];
      dispatch(
        addToCart({
          productId: product.id,
          productSlug: product.slug,
          productName: product.name,
          image: product.images[0] ?? "",
          variantLabel: variant.label,
          unitPrice: variant.price,
          unitMrp: variant.mrp,
        }),
      );
    });
    dispatch(pushToast(`${combo.title} added to cart`, "success"));
  };

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-brand-sand-dark bg-white p-4">
      <div className="flex shrink-0 -space-x-3">
        {products.map((product) => (
          <ProductImagePlaceholder
            key={product.id}
            src={product.images[0]}
            alt={product.name}
            gradient={product.gradient}
            iconSize={18}
            sizes="56px"
            className="h-14 w-14 rounded-xl border-2 border-white shadow-sm"
          />
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-serif text-base font-semibold text-brand-forest">{combo.title}</p>
        <p className="truncate text-xs text-brand-ink/60">{combo.description}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-brand-ink">{formatInr(total)}</span>
          <button
            type="button"
            onClick={handleAddCombo}
            className="rounded-full bg-brand-forest px-3.5 py-1.5 text-xs font-semibold text-brand-sand active:bg-brand-forest-light cursor-pointer"
          >
            Add Combo
          </button>
        </div>
      </div>
    </div>
  );
}
