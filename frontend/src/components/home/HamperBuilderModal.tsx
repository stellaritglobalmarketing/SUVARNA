"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { MOCK_PRODUCTS } from "@/lib/data/products.mock";
import { useAppDispatch } from "@/lib/redux/hooks";
import { addToCart } from "@/lib/redux/slices/cartSlice";
import { pushToast } from "@/lib/redux/slices/uiSlice";
import { ProductImagePlaceholder } from "@/components/ui/ProductImagePlaceholder";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Button } from "@/components/ui/Button";
import { formatInr } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface Selection {
  variantIndex: number;
  quantity: number;
}

type Selections = Record<string, Selection>;

function buildInitialSelections(presetSlugs: string[]): Selections {
  const initial: Selections = {};
  MOCK_PRODUCTS.forEach((product) => {
    initial[product.slug] = { variantIndex: 0, quantity: presetSlugs.includes(product.slug) ? 1 : 0 };
  });
  return initial;
}

/**
 * Mounted by the parent only while open (`{isOpen && <HamperBuilderModal .../>}`), keyed on the
 * chosen preset — so a fresh instance (and fresh form state) is created on every open, with no
 * state-reset effect needed.
 */
export function HamperBuilderModal({
  onClose,
  presetSlugs,
}: {
  onClose: () => void;
  /** Product slugs to pre-select at qty 1 when the modal opens (e.g. from a themed hamper tile). */
  presetSlugs: string[];
}) {
  const dispatch = useAppDispatch();
  const [selections, setSelections] = useState<Selections>(() => buildInitialSelections(presetSlugs));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const setVariantIndex = (slug: string, variantIndex: number) => {
    setSelections((prev) => ({ ...prev, [slug]: { ...prev[slug], variantIndex } }));
  };

  const setQuantity = (slug: string, quantity: number) => {
    setSelections((prev) => ({ ...prev, [slug]: { ...prev[slug], quantity } }));
  };

  const activeRows = MOCK_PRODUCTS.map((product) => ({ product, selection: selections[product.slug] })).filter(
    (row): row is { product: (typeof MOCK_PRODUCTS)[number]; selection: Selection } =>
      Boolean(row.selection && row.selection.quantity > 0),
  );

  const itemCount = activeRows.reduce((sum, row) => sum + row.selection.quantity, 0);
  const total = activeRows.reduce((sum, row) => {
    const variant = row.product.variants[row.selection.variantIndex] ?? row.product.variants[0];
    return sum + variant.price * row.selection.quantity;
  }, 0);

  const handleAddToCart = () => {
    activeRows.forEach(({ product, selection }) => {
      const variant = product.variants[selection.variantIndex] ?? product.variants[0];
      dispatch(
        addToCart({
          productId: product.id,
          productSlug: product.slug,
          productName: product.name,
          image: product.images[0] ?? "",
          variantLabel: variant.label,
          unitPrice: variant.price,
          unitMrp: variant.mrp,
          quantity: selection.quantity,
        }),
      );
    });
    dispatch(pushToast(`Custom hamper added to cart (${activeRows.length} item${activeRows.length === 1 ? "" : "s"})`, "success"));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" aria-label="Close hamper builder" onClick={onClose} className="absolute inset-0 bg-black/40 cursor-pointer" />

      <div className="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-brand-sand shadow-xl sm:max-w-lg sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-brand-sand-dark px-5 py-4">
          <div>
            <h2 className="font-serif text-xl font-semibold text-brand-forest">Build Your Own Hamper</h2>
            <p className="mt-0.5 text-xs text-brand-ink/60">Choose a pack size and quantity for each item you want inside.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-brand-sand-dark cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto px-5 py-4">
          {MOCK_PRODUCTS.map((product) => {
            const selection = selections[product.slug] ?? { variantIndex: 0, quantity: 0 };
            const variant = product.variants[selection.variantIndex] ?? product.variants[0];
            const active = selection.quantity > 0;

            return (
              <div
                key={product.slug}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between",
                  active ? "border-brand-forest bg-brand-forest/5" : "border-brand-sand-dark bg-white",
                )}
              >
                <div className="flex items-center gap-3">
                  <ProductImagePlaceholder
                    src={product.images[0]}
                    alt={product.name}
                    gradient={product.gradient}
                    iconSize={18}
                    sizes="48px"
                    className="h-12 w-12 shrink-0 rounded-lg"
                  />
                  <div>
                    <p className="text-sm font-semibold text-brand-forest">{product.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {product.variants.map((v, index) => (
                        <button
                          key={v.label}
                          type="button"
                          onClick={() => setVariantIndex(product.slug, index)}
                          className={cn(
                            "rounded-md border px-2 py-0.5 text-[11px] font-medium cursor-pointer",
                            index === selection.variantIndex
                              ? "border-brand-forest bg-brand-forest text-brand-sand"
                              : "border-brand-sand-dark text-brand-ink/70 hover:border-brand-forest",
                          )}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="w-16 shrink-0 text-right text-sm font-semibold text-brand-forest">
                    {formatInr(active ? variant.price * selection.quantity : variant.price)}
                  </span>
                  <QuantityStepper quantity={selection.quantity} min={0} max={10} onChange={(q) => setQuantity(product.slug, q)} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-brand-sand-dark px-5 py-4">
          <div className="flex items-center justify-between text-sm font-medium text-brand-ink">
            <span>{itemCount === 0 ? "No items selected yet" : `${itemCount} item${itemCount === 1 ? "" : "s"} selected`}</span>
            <span className="text-lg font-semibold text-brand-forest">{formatInr(total)}</span>
          </div>
          <Button className="mt-3 w-full" disabled={itemCount === 0} onClick={handleAddToCart}>
            Add Hamper to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
