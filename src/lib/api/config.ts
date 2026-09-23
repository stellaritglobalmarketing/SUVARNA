/**
 * Single switch for the whole data layer. Set NEXT_PUBLIC_API_BASE_URL once
 * the real backend is ready and every fetch* function in src/lib/api starts
 * hitting it instead of the local mock readers — no call-site changes needed.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
export const USE_MOCK_API = API_BASE_URL.length === 0;

/** Shared API key the backend requires on every request (see backend/README.md). */
export const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";
