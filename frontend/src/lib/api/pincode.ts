import { USE_MOCK_API } from "./config";
import { mockDelay } from "./delay";
import { apiGet } from "./http";

export interface PincodeServiceability {
  pincode: string;
  serviceable: boolean;
  city?: string;
  state?: string;
  /** Null when the courier didn't give a delivery time for this pincode. */
  estimatedDays: [number, number] | null;
  codAvailable: boolean;
}

/** GET /shipping/serviceability/:pincode (backend/modules/v1/controllers/ekart-controller.js). */
interface BackendServiceability {
  pincode: string;
  serviceable: boolean;
  cod_available: boolean;
  city: string | null;
  state: string | null;
  estimated_days: [number, number] | null;
}

const UNSERVICEABLE_PREFIXES = ["79", "19"];

/** Whether the courier (Ekart) delivers to this pincode, and roughly how fast. */
export async function checkPincodeServiceability(pincode: string): Promise<PincodeServiceability> {
  if (!/^\d{6}$/.test(pincode)) {
    throw new Error("Enter a valid 6-digit pincode");
  }
  if (USE_MOCK_API) {
    await mockDelay(350);
    const serviceable = !UNSERVICEABLE_PREFIXES.some((prefix) => pincode.startsWith(prefix));
    return { pincode, serviceable, estimatedDays: serviceable ? [2, 4] : null, codAvailable: false };
  }
  const result = await apiGet<BackendServiceability>(`/shipping/serviceability/${pincode}`);
  return {
    pincode: result.pincode,
    serviceable: result.serviceable,
    city: result.city ?? undefined,
    state: result.state ?? undefined,
    estimatedDays: result.estimated_days,
    // The store takes prepaid orders only, so COD availability isn't shown to customers.
    codAvailable: false,
  };
}
