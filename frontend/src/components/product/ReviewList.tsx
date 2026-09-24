import { BadgeCheck, Camera, ThumbsUp } from "lucide-react";
import type { Review } from "@/types/review";
import { RatingStars } from "@/components/ui/RatingStars";
import { formatDate } from "@/lib/utils/format";

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-brand-ink/60">No reviews yet for this product.</p>;
  }

  return (
    <ul className="space-y-4">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-2xl border border-brand-sand-dark bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-brand-ink">{review.author}</span>
              {review.isVerifiedBuyer && (
                <span className="flex items-center gap-1 rounded-full bg-brand-forest/10 px-2 py-0.5 text-[11px] font-medium text-brand-forest">
                  <BadgeCheck size={12} /> Verified Buyer
                </span>
              )}
            </div>
            <span className="text-xs text-brand-ink/50">{formatDate(review.date)}</span>
          </div>
          <RatingStars rating={review.rating} size={13} className="mt-2" />
          <p className="mt-2 text-sm font-medium text-brand-ink">{review.title}</p>
          <p className="mt-1 text-sm text-brand-ink/70">{review.body}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-brand-ink/50">
            {review.photos.length > 0 && (
              <span className="flex items-center gap-1">
                <Camera size={13} /> {review.photos.length} photo{review.photos.length > 1 ? "s" : ""}
              </span>
            )}
            {review.helpfulCount > 0 && (
              <span className="flex items-center gap-1">
                <ThumbsUp size={13} /> {review.helpfulCount} found this helpful
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
