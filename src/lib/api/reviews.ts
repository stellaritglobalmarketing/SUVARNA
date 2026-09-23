import type { Review, ReviewBreakdown } from "@/types/review";
import { MOCK_REVIEW_BREAKDOWN, getMockReviewsBySlug } from "@/lib/data/reviews.mock";
import { mockDelay } from "./delay";

export interface ReviewsResponse {
  reviews: Review[];
  breakdown: ReviewBreakdown[];
}

/** The backend has no reviews feature yet (see backend/README.md's "Not implemented yet" list) — always mock. */
export async function fetchReviewsBySlug(slug: string): Promise<ReviewsResponse> {
  await mockDelay(350);
  return { reviews: getMockReviewsBySlug(slug), breakdown: MOCK_REVIEW_BREAKDOWN };
}
