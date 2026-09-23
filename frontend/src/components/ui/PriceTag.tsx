import { formatDiscount, formatInr } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function PriceTag({
  price,
  mrp,
  size = "md",
  className,
}: {
  price: number;
  mrp: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const discount = formatDiscount(price, mrp);
  const sizeClasses = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  } satisfies Record<string, string>;

  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className={cn("font-semibold text-brand-forest", sizeClasses[size])}>{formatInr(price)}</span>
      {mrp > price && (
        <>
          <span className="text-sm text-brand-ink/50 line-through">{formatInr(mrp)}</span>
          <span className="text-sm font-medium text-brand-gold-light bg-brand-forest rounded px-1.5 py-0.5">
            {discount}% off
          </span>
        </>
      )}
    </div>
  );
}
