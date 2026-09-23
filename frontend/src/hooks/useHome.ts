import { useQuery } from "@tanstack/react-query";
import { fetchHome } from "@/lib/api/products";
import { queryKeys } from "@/lib/query/keys";

export function useHome() {
  return useQuery({
    queryKey: queryKeys.products.home,
    queryFn: fetchHome,
  });
}
