"use client";

import { X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  closeCartDrawer,
  removeFromCart,
  selectCartItems,
  selectCartSubtotal,
  selectIsCartDrawerOpen,
  updateQuantity,
} from "@/lib/redux/slices/cartSlice";
import { ProductImagePlaceholder } from "@/components/ui/ProductImagePlaceholder";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Button } from "@/components/ui/Button";
import { formatInr } from "@/lib/utils/format";

export function CartDrawer() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectIsCartDrawerOpen);
  const items = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close cart"
        onClick={() => dispatch(closeCartDrawer())}
        className="absolute inset-0 bg-black/40 cursor-pointer"
      />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-brand-sand shadow-xl">
        <div className="flex items-center justify-between border-b border-brand-sand-dark px-5 py-4">
          <h2 className="font-serif text-xl font-semibold text-brand-forest">Your Cart ({items.length})</h2>
          <button
            type="button"
            onClick={() => dispatch(closeCartDrawer())}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-brand-sand-dark cursor-pointer"
            aria-label="Close cart"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="text-brand-ink/70">Your cart is empty.</p>
              <Button href="/#products" variant="outline" onClick={() => dispatch(closeCartDrawer())}>
                Browse Products
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.lineId} className="flex gap-3">
                  <ProductImagePlaceholder
                    src={item.image}
                    alt={item.productName}
                    gradient={["#8a6a4f", "#d4a373"]}
                    iconSize={20}
                    sizes="64px"
                    className="h-16 w-16 shrink-0 rounded-lg"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-brand-ink">{item.productName}</p>
                        <p className="text-xs text-brand-ink/60">{item.variantLabel}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => dispatch(removeFromCart({ lineId: item.lineId }))}
                        className="text-xs text-brand-ink/50 hover:text-red-600 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <QuantityStepper
                        quantity={item.quantity}
                        onChange={(quantity) => dispatch(updateQuantity({ lineId: item.lineId, quantity }))}
                      />
                      <span className="text-sm font-semibold text-brand-forest">
                        {formatInr(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-brand-sand-dark px-5 py-4">
            <div className="flex items-center justify-between text-sm font-medium text-brand-ink">
              <span>Subtotal</span>
              <span className="text-lg font-semibold text-brand-forest">{formatInr(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-brand-ink/50">Shipping and taxes calculated at checkout.</p>
            <Button href="/cart" className="mt-4 w-full" onClick={() => dispatch(closeCartDrawer())}>
              View Cart & Checkout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
