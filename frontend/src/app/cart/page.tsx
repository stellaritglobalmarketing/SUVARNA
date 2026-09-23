"use client";

import { Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  removeFromCart,
  selectCartItems,
  selectCartMrpTotal,
  selectCartSubtotal,
  updateQuantity,
} from "@/lib/redux/slices/cartSlice";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductImagePlaceholder } from "@/components/ui/ProductImagePlaceholder";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Button } from "@/components/ui/Button";
import { formatInr } from "@/lib/utils/format";

export default function CartPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const mrpTotal = useAppSelector(selectCartMrpTotal);
  const savings = mrpTotal - subtotal;

  return (
    <Container className="py-10">
      <SectionHeading eyebrow="Checkout" title="Your Cart" />

      {items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-brand-sand-dark py-20 text-center">
          <p className="text-brand-ink/70">Your cart is empty.</p>
          <Button href="/products">Browse Products</Button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <ul className="space-y-4 lg:col-span-2">
            {items.map((item) => (
              <li key={item.lineId} className="flex gap-4 rounded-2xl border border-brand-sand-dark bg-white p-4">
                <ProductImagePlaceholder
                  src={item.image}
                  alt={item.productName}
                  gradient={["#8a6a4f", "#d4a373"]}
                  iconSize={24}
                  sizes="80px"
                  className="h-20 w-20 shrink-0 rounded-xl"
                />
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-brand-ink">{item.productName}</p>
                      <p className="text-sm text-brand-ink/60">{item.variantLabel}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => dispatch(removeFromCart({ lineId: item.lineId }))}
                      aria-label="Remove item"
                      className="text-brand-ink/40 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <QuantityStepper
                      quantity={item.quantity}
                      onChange={(quantity) => dispatch(updateQuantity({ lineId: item.lineId, quantity }))}
                    />
                    <span className="font-semibold text-brand-forest">{formatInr(item.unitPrice * item.quantity)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="h-fit rounded-2xl border border-brand-sand-dark bg-white p-5">
            <h3 className="font-serif text-lg font-semibold text-brand-forest">Order Summary</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-brand-ink/70">
                <span>MRP Total</span>
                <span>{formatInr(mrpTotal)}</span>
              </div>
              <div className="flex justify-between text-brand-ink/70">
                <span>You Save</span>
                <span className="text-green-700">-{formatInr(savings)}</span>
              </div>
              <div className="flex justify-between border-t border-brand-sand-dark pt-2 text-base font-semibold text-brand-ink">
                <span>Subtotal</span>
                <span>{formatInr(subtotal)}</span>
              </div>
            </div>
            <Button className="mt-5 w-full" size="lg">
              Proceed to Checkout
            </Button>
            <p className="mt-2 text-center text-xs text-brand-ink/50">Checkout &amp; payments connect once backend APIs are live.</p>
          </div>
        </div>
      )}
    </Container>
  );
}
