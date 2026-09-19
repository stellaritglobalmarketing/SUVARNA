"use client";

import { SlidersHorizontal } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { selectActiveFilterCount, selectFilters, setSort } from "@/lib/redux/slices/filtersSlice";
import type { ProductListParams } from "@/types/product";

const SORT_OPTIONS: { value: NonNullable<ProductListParams["sort"]>; label: string }[] = [
  { value: "popularity", label: "Popularity" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Customer Rating" },
  { value: "newest", label: "Newest" },
];

export function SortBar({ total, onOpenFilters }: { total: number; onOpenFilters: () => void }) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);
  const activeFilterCount = useAppSelector(selectActiveFilterCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-sand-dark pb-4">
      <p className="text-sm text-brand-ink/70">
        <span className="font-semibold text-brand-forest">{total}</span> products
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenFilters}
          className="relative flex items-center gap-1.5 rounded-lg border border-brand-sand-dark bg-white px-3 py-2 text-sm font-medium text-brand-ink lg:hidden cursor-pointer"
        >
          <SlidersHorizontal size={14} /> Filters
          {activeFilterCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-gold px-1 text-[10px] font-bold text-brand-ink">
              {activeFilterCount}
            </span>
          )}
        </button>
        <label className="flex items-center gap-2 text-sm">
          <span className="hidden text-brand-ink/60 sm:inline">Sort by</span>
          <select
            value={filters.sort}
            onChange={(event) => dispatch(setSort(event.target.value as NonNullable<ProductListParams["sort"]>))}
            className="rounded-lg border border-brand-sand-dark bg-white px-3 py-2 text-sm text-brand-ink"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
