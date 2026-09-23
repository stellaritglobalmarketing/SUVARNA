import type { WeightVariant } from "@/types/product";
import { cn } from "@/lib/utils/cn";

export function WeightVariantSelector({
  variants,
  selected,
  onSelect,
  size = "md",
}: {
  variants: WeightVariant[];
  selected: WeightVariant;
  onSelect: (variant: WeightVariant) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select pack weight">
      {variants.map((variant) => {
        const isSelected = variant.label === selected.label;
        const isOutOfStock = variant.stock === 0;
        return (
          <button
            key={variant.label}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={isOutOfStock}
            onClick={() => onSelect(variant)}
            className={cn(
              "rounded-lg border text-left transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40",
              size === "sm" ? "min-w-[3.25rem] px-2 py-1.5" : "min-w-[5.5rem] px-3 py-2",
              isSelected
                ? "border-brand-forest bg-brand-forest text-brand-sand"
                : "border-brand-sand-dark bg-white text-brand-ink hover:border-brand-forest",
            )}
          >
            <div className={cn("font-semibold", size === "sm" ? "text-xs" : "text-sm")}>{variant.label}</div>
            {isOutOfStock && <div className="text-[10px] uppercase tracking-wide">Sold out</div>}
          </button>
        );
      })}
    </div>
  );
}
