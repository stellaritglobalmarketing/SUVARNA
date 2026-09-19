import type { Review, ReviewBreakdown } from "@/types/review";
import { MOCK_REVIEW_BREAKDOWN, getMockReviewsBySlug } from "@/lib/data/reviews.mock";
import { USE_MOCK_API } from "./config";
import { mockDelay } from "./delay";
import { apiGet } from "./http";

export interface ReviewsResponse {
  reviews: Review[];
  breakdown: ReviewBreakdown[];
}

export async function fetchReviewsBySlug(slug: string): Promise<ReviewsResponse> {
  if (USE_MOCK_API) {
    await mockDelay(350);
    return { reviews: getMockReviewsBySlug(slug), breakdown: MOCK_REVIEW_BREAKDOWN };
  }
  return apiGet<ReviewsResponse>(`/products/${slug}/reviews`);
}
