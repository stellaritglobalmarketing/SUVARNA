import { useQuery } from "@tanstack/react-query";
import { fetchProductBySlug, fetchProductsByIds } from "@/lib/api/products";
import { queryKeys } from "@/lib/query/keys";

export function useProduct(slug: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(slug),
    queryFn: () => fetchProductBySlug(slug),
    enabled: Boolean(slug),
  });
}

export function useProductsByIds(ids: string[]) {
  return useQuery({
    queryKey: queryKeys.products.batch(ids),
    queryFn: () => fetchProductsByIds(ids),
    enabled: ids.length > 0,
  });
}
