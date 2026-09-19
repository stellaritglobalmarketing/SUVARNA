import type { Review, ReviewBreakdown } from "@/types/review";

/** Dummy reviews — 4 entries, all against the almond PDP for now. */
export const MOCK_REVIEWS: Review[] = [
  {
    id: "rev-1",
    productSlug: "kashmir-mamra-almonds",
    author: "Ritika Sharma",
    isVerifiedBuyer: true,
    rating: 5,
    title: "Genuinely oil-rich, not the usual dry almonds",
    body: "You can taste the difference from day one — soft, sweet, and nothing like the papery almonds from supermarkets. Packaging arrived sealed and fresh.",
    date: "2026-08-02",
    photos: ["photo-1", "photo-2"],
    helpfulCount: 48,
  },
  {
    id: "rev-2",
    productSlug: "kashmir-mamra-almonds",
    author: "Arjun Mehta",
    isVerifiedBuyer: true,
    rating: 5,
    title: "Worth the price for Mamra grade",
    body: "Ordered the 500g pack for daily soaking. Skin peels off easily after soaking overnight, which is a good sign of authenticity.",
    date: "2026-07-21",
    photos: [],
    helpfulCount: 31,
  },
  {
    id: "rev-3",
    productSlug: "kashmir-mamra-almonds",
    author: "Fatima Khan",
    isVerifiedBuyer: true,
    rating: 4,
    title: "Great quality, delivery took a day longer",
    body: "Taste and freshness are excellent, matches the description. Only minor complaint is the delivery was a day past the estimate.",
    date: "2026-07-09",
    photos: ["photo-3"],
    helpfulCount: 12,
  },
  {
    id: "rev-4",
    productSlug: "kashmir-mamra-almonds",
    author: "Suresh Nair",
    isVerifiedBuyer: false,
    rating: 4,
    title: "Good for gifting too",
    body: "Bought two packs, one for home and one to gift. The pouch looks premium enough to gift as-is.",
    date: "2026-06-30",
    photos: [],
    helpfulCount: 6,
  },
];

export const MOCK_REVIEW_BREAKDOWN: ReviewBreakdown[] = [
  { stars: 5, percent: 68 },
  { stars: 4, percent: 22 },
  { stars: 3, percent: 6 },
  { stars: 2, percent: 3 },
  { stars: 1, percent: 1 },
];

export function getMockReviewsBySlug(slug: string): Review[] {
  return MOCK_REVIEWS.filter((review) => review.productSlug === slug);
}
