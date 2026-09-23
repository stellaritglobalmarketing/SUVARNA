import { useQuery } from "@tanstack/react-query";
import { fetchBestSellers } from "@/lib/api/products";
import { queryKeys } from "@/lib/query/keys";

export function useBestSellers(limit = 4) {
  return useQuery({
    queryKey: queryKeys.products.bestSellers(limit),
    queryFn: () => fetchBestSellers(limit),
  });
}
