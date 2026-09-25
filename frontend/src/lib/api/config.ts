/**
 * Single switch for the whole data layer. Set NEXT_PUBLIC_API_BASE_URL once
 * the real backend is ready and every fetch* function in src/lib/api starts
 * hitting it instead of the local mock readers — no call-site changes needed.
 */
const rawBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim();

/** A value pasted without a scheme ("example.com/api/v1") would make `new URL()` throw, so default to https. */
export const API_BASE_URL =
  rawBaseUrl && !/^https?:\/\//i.test(rawBaseUrl) ? `https://${rawBaseUrl}` : rawBaseUrl;
export const USE_MOCK_API = API_BASE_URL.length === 0;

/** Shared API key the backend requires on every request (see backend/README.md). */
export const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";
