import { useQuery } from "@tanstack/react-query";
import { useGuestToken } from "@/hooks/useBrowserStorage";
import { fetchOrderTracking } from "@/lib/api/orders";
import { queryKeys } from "@/lib/query/keys";
import { useAppSelector } from "@/lib/redux/hooks";
import { selectIsAuthenticated } from "@/lib/redux/slices/authSlice";

export function useOrderTracking(orderNumber: string) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const guestToken = useGuestToken(orderNumber);
  return useQuery({
    queryKey: queryKeys.orders.tracking(orderNumber),
    queryFn: () => fetchOrderTracking(orderNumber),
    enabled: Boolean(orderNumber) && (isAuthenticated || Boolean(guestToken)),
    retry: false,
  });
}
