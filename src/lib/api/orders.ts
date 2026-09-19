import type { OrderTracking } from "@/types/order";
import { getMockOrderByAwb } from "@/lib/data/orders.mock";
import { USE_MOCK_API } from "./config";
import { mockDelay } from "./delay";
import { apiGet } from "./http";

export async function fetchOrderTracking(awb: string): Promise<OrderTracking> {
  if (USE_MOCK_API) {
    await mockDelay(450);
    const order = getMockOrderByAwb(awb);
    if (!order) throw new Error(`No shipment found for AWB ${awb}`);
    return order;
  }
  return apiGet<OrderTracking>(`/orders/track/${encodeURIComponent(awb)}`);
}
