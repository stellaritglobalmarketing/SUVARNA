import { useQuery } from "@tanstack/react-query";
import { DEFAULT_STORE_SETTINGS, fetchStoreSettings } from "@/lib/api/settings";
import { queryKeys } from "@/lib/query/keys";

/** The store's WhatsApp number from Admin → Settings; the built-in default until it loads or if it fails. */
export function useStoreSettings() {
  const { data } = useQuery({
    queryKey: queryKeys.storeSettings,
    queryFn: fetchStoreSettings,
    staleTime: 5 * 60 * 1000,
  });
  return data ?? DEFAULT_STORE_SETTINGS;
}
