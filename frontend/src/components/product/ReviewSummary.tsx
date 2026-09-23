import type { ReviewBreakdown } from "@/types/review";
import { RatingStars } from "@/components/ui/RatingStars";

export function ReviewSummary({
  rating,
  reviewCount,
  breakdown,
}: {
  rating: number;
  reviewCount: number;
  breakdown: ReviewBreakdown[];
}) {
  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-brand-sand-dark bg-white p-5 sm:flex-row sm:items-center">
      <div className="text-center sm:border-r sm:border-brand-sand-dark sm:pr-6">
        <p className="font-serif text-4xl font-bold text-brand-forest">{rating.toFixed(1)}</p>
        <RatingStars rating={rating} size={16} className="justify-center mt-1" />
        <p className="mt-1 text-xs text-brand-ink/60">{reviewCount} verified reviews</p>
      </div>
      <div className="flex-1 space-y-1.5">
        {breakdown.map((row) => (
          <div key={row.stars} className="flex items-center gap-2 text-xs">
            <span className="w-10 text-brand-ink/60">{row.stars} star</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-sand-dark">
              <div className="h-full rounded-full bg-brand-gold" style={{ width: `${row.percent}%` }} />
            </div>
            <span className="w-8 text-right text-brand-ink/60">{row.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
