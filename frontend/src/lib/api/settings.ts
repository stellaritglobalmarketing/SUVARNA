import { WHATSAPP_ORDER_NUMBER, WHATSAPP_ORDER_NUMBER_DISPLAY } from "@/lib/whatsapp";
import { API_BASE_URL, API_KEY, USE_MOCK_API } from "./config";
import { apiGet } from "./http";

/** Store settings an admin can change in Admin → Settings (GET /settings). */
export interface StoreSettings {
  /** Digits with country code, wa.me format — e.g. "916353684881". */
  whatsapp_number: string;
  /** For display — e.g. "+91 63536 84881". */
  whatsapp_display: string;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  whatsapp_number: WHATSAPP_ORDER_NUMBER,
  whatsapp_display: WHATSAPP_ORDER_NUMBER_DISPLAY,
};

/** Client-side read (through useStoreSettings). */
export async function fetchStoreSettings(): Promise<StoreSettings> {
  if (USE_MOCK_API) return DEFAULT_STORE_SETTINGS;
  return apiGet<StoreSettings>("/settings");
}

/**
 * Server-component read for static pages (Help, Return Policy). Re-fetched at most once a minute, so
 * a number saved in Admin → Settings shows up shortly without a rebuild. Never throws.
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  if (USE_MOCK_API) return DEFAULT_STORE_SETTINGS;
  try {
    const res = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/settings`, {
      headers: API_KEY ? { "api-key": API_KEY } : {},
      next: { revalidate: 60 },
    });
    const body = (await res.json()) as { code: number; data?: StoreSettings };
    return body.code === 1 && body.data?.whatsapp_number ? body.data : DEFAULT_STORE_SETTINGS;
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
}
