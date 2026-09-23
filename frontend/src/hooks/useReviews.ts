import { useQuery } from "@tanstack/react-query";
import { fetchReviewsBySlug } from "@/lib/api/reviews";
import { queryKeys } from "@/lib/query/keys";

export function useReviews(slug: string) {
  return useQuery({
    queryKey: queryKeys.reviews.bySlug(slug),
    queryFn: () => fetchReviewsBySlug(slug),
    enabled: Boolean(slug),
  });
}
