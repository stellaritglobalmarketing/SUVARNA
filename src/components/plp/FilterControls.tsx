"use client";

import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  resetFilters,
  selectActiveFilterCount,
  selectFilters,
  setPriceRange,
  toggleHealthBenefit,
  toggleOrigin,
  toggleProcessing,
  toggleWeight,
} from "@/lib/redux/slices/filtersSlice";
import type { HealthBenefit, ProductOrigin, ProductProcessing } from "@/types/product";
import { formatInr } from "@/lib/utils/format";

const WEIGHTS = ["100g", "250g", "500g", "1kg", "2kg", "5kg"];
const ORIGINS: ProductOrigin[] = ["Kashmir", "California", "Afghanistan", "Iran"];
const PROCESSING: ProductProcessing[] = ["Raw", "Smoked", "Roasted & Salted"];
const HEALTH_BENEFITS: HealthBenefit[] = [
  "Heart Health",
  "Keto Friendly",
  "Diabetic Friendly",
  "High Protein",
  "Weight Management",
];
const MAX_PRICE = 3000;

/** The actual filter form — shared by the desktop static sidebar and the mobile bottom-sheet. */
export function FilterControls({ onClearAll }: { onClearAll?: () => void }) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);
  const activeCount = useAppSelector(selectActiveFilterCount);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-brand-forest">Filters</h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => {
              dispatch(resetFilters());
              onClearAll?.();
            }}
            className="text-xs font-medium text-brand-walnut-dark hover:text-brand-forest cursor-pointer"
          >
            Clear all ({activeCount})
          </button>
        )}
      </div>

      <FilterGroup title="Price Range" defaultOpen>
        <input
          type="range"
          min={0}
          max={MAX_PRICE}
          step={50}
          value={filters.priceMax ?? MAX_PRICE}
          onChange={(event) => dispatch(setPriceRange({ min: filters.priceMin, max: Number(event.target.value) }))}
          className="w-full accent-brand-forest"
          aria-label="Maximum price"
        />
        <div className="mt-1 flex justify-between text-xs text-brand-ink/60">
          <span>₹0</span>
          <span>Up to {formatInr(filters.priceMax ?? MAX_PRICE)}</span>
        </div>
      </FilterGroup>

      <FilterGroup title="Weight (100g – 5kg bulk)" defaultOpen>
        <div className="flex flex-wrap gap-2">
          {WEIGHTS.map((weight) => (
            <CheckboxChip
              key={weight}
              label={weight}
              checked={filters.weights.includes(weight)}
              onChange={() => dispatch(toggleWeight(weight))}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Origin">
        <div className="flex flex-col gap-2">
          {ORIGINS.map((origin) => (
            <Checkbox
              key={origin}
              label={origin}
              checked={filters.origins.includes(origin)}
              onChange={() => dispatch(toggleOrigin(origin))}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Processing">
        <div className="flex flex-col gap-2">
          {PROCESSING.map((option) => (
            <Checkbox
              key={option}
              label={option}
              checked={filters.processing.includes(option)}
              onChange={() => dispatch(toggleProcessing(option))}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Health Benefits">
        <div className="flex flex-col gap-2">
          {HEALTH_BENEFITS.map((benefit) => (
            <Checkbox
              key={benefit}
              label={benefit}
              checked={filters.healthBenefits.includes(benefit)}
              onChange={() => dispatch(toggleHealthBenefit(benefit))}
            />
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="border-b border-brand-sand-dark py-4" open={defaultOpen}>
      <summary className="cursor-pointer list-none text-sm font-semibold text-brand-ink marker:content-none">
        <span className="flex items-center justify-between">
          {title}
          <span className="text-brand-ink/40">+</span>
        </span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-brand-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-brand-sand-dark accent-brand-forest"
      />
      {label}
    </label>
  );
}

function CheckboxChip({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label
      className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        checked ? "border-brand-forest bg-brand-forest text-brand-sand" : "border-brand-sand-dark bg-white text-brand-ink"
      }`}
    >
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      {label}
    </label>
  );
}
