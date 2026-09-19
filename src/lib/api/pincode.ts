import { USE_MOCK_API } from "./config";
import { mockDelay } from "./delay";
import { apiGet } from "./http";

export interface PincodeServiceability {
  pincode: string;
  serviceable: boolean;
  city?: string;
  state?: string;
  estimatedDays: [number, number];
  codAvailable: boolean;
}

const UNSERVICEABLE_PREFIXES = ["79", "19"];

export async function checkPincodeServiceability(pincode: string): Promise<PincodeServiceability> {
  if (USE_MOCK_API) {
    await mockDelay(350);
    const isValid = /^\d{6}$/.test(pincode);
    if (!isValid) {
      throw new Error("Enter a valid 6-digit pincode");
    }
    const serviceable = !UNSERVICEABLE_PREFIXES.some((prefix) => pincode.startsWith(prefix));
    return {
      pincode,
      serviceable,
      city: serviceable ? "Delivery city" : undefined,
      state: serviceable ? "Delivery state" : undefined,
      estimatedDays: serviceable ? [2, 4] : [0, 0],
      codAvailable: serviceable,
    };
  }
  return apiGet<PincodeServiceability>(`/logistics/serviceability/${pincode}`);
}
