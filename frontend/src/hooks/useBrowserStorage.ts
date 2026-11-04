import { useSyncExternalStore } from "react";
import { getGuestToken } from "@/lib/auth/guestOrders";
import { getToken } from "@/lib/auth/token";

// These read localStorage while rendering, so the server's render and the browser's first one have to agree.
const noSubscription = () => () => undefined;

/** False during the server render and hydration, true after. Until then, storage can't be read. */
export const useIsClient = () => useSyncExternalStore(noSubscription, () => true, () => false);

/** The saved session token, which is there before Redux has been rehydrated from it. */
export const useStoredSessionToken = () => useSyncExternalStore(noSubscription, getToken, () => null);

export const useGuestToken = (orderNumber: string) =>
  useSyncExternalStore(noSubscription, () => getGuestToken(orderNumber), () => null);
