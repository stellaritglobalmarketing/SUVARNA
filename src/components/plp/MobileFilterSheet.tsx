"use client";

import { X } from "lucide-react";
import { useAppSelector } from "@/lib/redux/hooks";
import { selectProductListParams } from "@/lib/redux/slices/filtersSlice";
import { useProducts } from "@/hooks/useProducts";
import { FilterControls } from "./FilterControls";

export function MobileFilterSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const listParams = useAppSelector(selectProductListParams);
  const { data } = useProducts(listParams);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button type="button" aria-label="Close filters" onClick={onClose} className="absolute inset-0 bg-black/40 cursor-pointer" />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-3xl bg-brand-sand pb-[env(safe-area-inset-bottom)] shadow-xl">
        <div className="flex items-center justify-between border-b border-brand-sand-dark px-5 py-4">
          <span className="font-serif text-lg font-semibold text-brand-forest">Filter &amp; Sort</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-brand-sand-dark cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-2">
          <FilterControls />
        </div>

        <div className="border-t border-brand-sand-dark bg-brand-sand px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-brand-forest py-3 text-sm font-semibold text-brand-sand cursor-pointer"
          >
            {data ? `Show ${data.total} Results` : "Show Results"}
          </button>
        </div>
      </div>
    </div>
  );
}
