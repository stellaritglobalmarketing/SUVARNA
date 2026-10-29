/**
 * Diwali 2026 campaign, times in IST. Until DIWALI_ORDER_BY the home page counts down to the last day to order
 * for delivery before Diwali ("Order by 1 Nov"). The festive decor stays up until DIWALI_DECOR_UNTIL and then
 * goes away on its own, so nothing has to be removed by hand after the festival.
 */
export const DIWALI_ORDER_BY = Date.parse("2026-11-01T23:59:59+05:30");

export const DIWALI_DECOR_UNTIL = Date.parse("2026-11-10T23:59:59+05:30");

export const isDiwaliSeason = (now: number) => now <= DIWALI_DECOR_UNTIL;

/** Time left to order for Diwali delivery, e.g. "2d 14h 05m"; null once the cut-off has passed. */
export function diwaliOrderCountdown(now: number): string | null {
  const minutesLeft = Math.floor((DIWALI_ORDER_BY - now) / 60_000);
  if (minutesLeft <= 0) return null;
  const days = Math.floor(minutesLeft / 1440);
  const hours = Math.floor((minutesLeft % 1440) / 60);
  const minutes = String(minutesLeft % 60).padStart(2, "0");
  return days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m`;
}
