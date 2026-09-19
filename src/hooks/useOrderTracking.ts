import { useQuery } from "@tanstack/react-query";
import { fetchOrderTracking } from "@/lib/api/orders";
import { queryKeys } from "@/lib/query/keys";

export function useOrderTracking(awb: string) {
  return useQuery({
    queryKey: queryKeys.orders.tracking(awb),
    queryFn: () => fetchOrderTracking(awb),
    enabled: Boolean(awb),
    retry: false,
  });
}
