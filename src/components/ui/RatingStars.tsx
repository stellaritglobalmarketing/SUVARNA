import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function RatingStars({
  rating,
  reviewCount,
  size = 14,
  className,
}: {
  rating: number;
  reviewCount?: number;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => {
          const filled = index + 1 <= Math.round(rating);
          return (
            <Star
              key={index}
              size={size}
              className={filled ? "fill-brand-gold text-brand-gold" : "fill-transparent text-brand-ink/25"}
            />
          );
        })}
      </div>
      <span className="sr-only">{rating.toFixed(1)} out of 5 stars</span>
      <span className="text-xs font-medium text-brand-ink/70">{rating.toFixed(1)}</span>
      {reviewCount != null && <span className="text-xs text-brand-ink/50">({reviewCount})</span>}
    </div>
  );
}
