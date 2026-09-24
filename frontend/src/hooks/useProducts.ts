import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/api/products";
import { queryKeys } from "@/lib/query/keys";
import type { ProductListParams } from "@/types/product";

/**
 * PLP listing query. `placeholderData: keepPreviousData` keeps the current
 * page's cards on screen (instead of a flash to skeleton) while the next
 * page/filter combination loads, and each unique params object is cached
 * under its own key so paging back is instant.
 */
export function useProducts(params: ProductListParams, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => fetchProducts(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}
