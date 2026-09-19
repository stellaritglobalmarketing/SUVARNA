"use client";

import { MapPin, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { closeDeliverySheet, selectIsDeliverySheetOpen, setDeliveryPincode } from "@/lib/redux/slices/uiSlice";
import { PincodeChecker } from "@/components/product/PincodeChecker";

export function DeliverySheet() {
  const isOpen = useAppSelector(selectIsDeliverySheetOpen);
  const dispatch = useAppDispatch();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close"
        onClick={() => dispatch(closeDeliverySheet())}
        className="absolute inset-0 bg-black/40 cursor-pointer"
      />
      <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-brand-sand pb-[env(safe-area-inset-bottom)] shadow-xl">
        <div className="flex items-center justify-between border-b border-brand-sand-dark px-5 py-4">
          <span className="font-serif text-lg font-semibold text-brand-forest">Delivery Location</span>
          <button
            type="button"
            onClick={() => dispatch(closeDeliverySheet())}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-brand-sand-dark cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 pb-6 pt-4">
          <p className="mb-3 flex items-center gap-1.5 text-sm text-brand-ink/70">
            <MapPin size={15} className="text-brand-forest" /> Enter your pincode to check delivery estimate
          </p>
          <PincodeChecker
            bordered={false}
            showHeading={false}
            onChecked={(result) => {
              if (result.serviceable) {
                dispatch(setDeliveryPincode(result.pincode));
                dispatch(closeDeliverySheet());
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
