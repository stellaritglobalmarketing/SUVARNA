"use client";

import { useState } from "react";
import type { Product } from "@/types/product";
import { useProductsByIds } from "@/hooks/useProduct";
import { useAppDispatch } from "@/lib/redux/hooks";
import { addToCart } from "@/lib/redux/slices/cartSlice";
import { pushToast } from "@/lib/redux/slices/uiSlice";
import { ProductImagePlaceholder } from "@/components/ui/ProductImagePlaceholder";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { formatInr } from "@/lib/utils/format";

export function FrequentlyBoughtTogether({ mainProduct }: { mainProduct: Product }) {
  const { data: companions, isLoading } = useProductsByIds(mainProduct.frequentlyBoughtWith);
  const dispatch = useAppDispatch();

  const bundleProducts = [mainProduct, ...(companions ?? [])];
  const [selected, setSelected] = useState<Set<string>>(new Set([mainProduct.id]));

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  const toggle = (id: string) => {
    if (id === mainProduct.id) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedProducts = bundleProducts.filter((product) => selected.has(product.id));
  const total = selectedProducts.reduce((sum, product) => sum + product.variants[0].price, 0);

  const handleAddBundle = () => {
    selectedProducts.forEach((product) => {
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
    dispatch(pushToast(`Bundle of ${selectedProducts.length} added to cart`, "success"));
  };

  return (
    <div className="rounded-2xl border border-brand-sand-dark bg-white p-5">
      <h3 className="font-serif text-lg font-semibold text-brand-forest">Frequently Bought Together</h3>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {bundleProducts.map((product, index) => (
          <div key={product.id} className="flex items-center gap-3">
            <label className="flex cursor-pointer flex-col items-center gap-2 text-center">
              <div className="relative">
                <ProductImagePlaceholder
                  src={product.images[0]}
                  alt={product.name}
                  gradient={product.gradient}
                  iconSize={22}
                  sizes="64px"
                  className="h-16 w-16 rounded-lg"
                />
                <input
                  type="checkbox"
                  checked={selected.has(product.id)}
                  onChange={() => toggle(product.id)}
                  disabled={product.id === mainProduct.id}
                  className="absolute -right-1 -top-1 h-4 w-4 accent-brand-forest"
                />
              </div>
              <span className="w-20 text-[11px] leading-tight text-brand-ink/70">{product.name}</span>
              <span className="text-xs font-semibold text-brand-forest">{formatInr(product.variants[0].price)}</span>
            </label>
            {index < bundleProducts.length - 1 && <span className="text-lg text-brand-ink/30">+</span>}
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-brand-sand-dark pt-4">
        <p className="text-sm text-brand-ink/70">
          Total for {selected.size} item{selected.size > 1 ? "s" : ""}:{" "}
          <span className="text-lg font-semibold text-brand-forest">{formatInr(total)}</span>
        </p>
        <Button onClick={handleAddBundle} size="sm">
          Add Bundle to Cart
        </Button>
      </div>
    </div>
  );
}
