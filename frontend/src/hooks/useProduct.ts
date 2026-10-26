import { useQuery } from "@tanstack/react-query";
import { fetchProductBySlug, fetchProductsByIds } from "@/lib/api/products";
import { queryKeys } from "@/lib/query/keys";
import type { ProductDetail } from "@/types/product";

/** `initialData` is the product the server already fetched for this page (shown at once, refreshed in the background). */
export function useProduct(slug: string, initialData?: ProductDetail) {
  return useQuery({
    queryKey: queryKeys.products.detail(slug),
    queryFn: () => fetchProductBySlug(slug),
    enabled: Boolean(slug),
    initialData,
  });
}

export function useProductsByIds(ids: string[]) {
  return useQuery({
    queryKey: queryKeys.products.batch(ids),
    queryFn: () => fetchProductsByIds(ids),
    enabled: ids.length > 0,
  });
}
