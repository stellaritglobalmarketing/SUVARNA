import type { Review, ReviewBreakdown } from "@/types/review";
import { MOCK_REVIEW_BREAKDOWN, getMockReviewsBySlug } from "@/lib/data/reviews.mock";
import { USE_MOCK_API } from "./config";
import { mockDelay } from "./delay";
import { apiGet } from "./http";

export interface ReviewsResponse {
  reviews: Review[];
  breakdown: ReviewBreakdown[];
}

// ---- Real backend response shape (see backend/README.md — "GET /product/:slug/reviews") ----
interface BackendReview {
  id: number;
  author: string;
  is_verified_purchase: boolean;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
}

interface BackendReviews {
  rating: number;
  review_count: number;
  breakdown: ReviewBreakdown[];
  reviews: BackendReview[];
}

/** First page of a product's approved reviews, newest first, plus its star breakdown. */
export async function fetchReviewsBySlug(slug: string): Promise<ReviewsResponse> {
  if (USE_MOCK_API) {
    await mockDelay(350);
    return { reviews: getMockReviewsBySlug(slug), breakdown: MOCK_REVIEW_BREAKDOWN };
  }
  const data = await apiGet<BackendReviews>(`/product/${encodeURIComponent(slug)}/reviews`);
  return {
    breakdown: data.breakdown,
    reviews: data.reviews.map((review) => ({
      id: String(review.id),
      productSlug: slug,
      author: review.author,
      isVerifiedBuyer: review.is_verified_purchase,
      rating: review.rating,
      title: review.title ?? "",
      body: review.body ?? "",
      date: review.created_at,
      // Review photos and "helpful" votes aren't collected yet.
      photos: [],
      helpfulCount: 0,
    })),
  };
}
