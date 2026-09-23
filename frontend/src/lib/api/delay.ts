/** Simulates network latency so loading/skeleton states are visible against mock data. */
export function mockDelay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
