/**
 * The secret each guest order comes with: it lets this browser pay for and see that order without an account.
 * Kept in localStorage so it survives the page reload a UPI app can cause mid-payment.
 */
const GUEST_ORDERS_KEY = "suvarna_guest_orders";

function readTokens(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(GUEST_ORDERS_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export function getGuestToken(orderNumber: string): string | null {
  return readTokens()[orderNumber] ?? null;
}

export function saveGuestToken(orderNumber: string, token: string): void {
  window.localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify({ ...readTokens(), [orderNumber]: token }));
}

/** On logout, so the next person on a shared phone can't open these orders. */
export function clearGuestTokens(): void {
  window.localStorage.removeItem(GUEST_ORDERS_KEY);
}

/** Request header for a guest's own order; empty when this browser doesn't hold its token. */
export function guestOrderHeaders(orderNumber: string): Record<string, string> {
  const token = getGuestToken(orderNumber);
  return token ? { "guest-token": token } : {};
}
