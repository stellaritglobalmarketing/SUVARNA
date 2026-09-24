import type { OrderTracking, ShipmentDiagnostic, TrackingStage } from "@/types/order";
import { getMockOrderByAwb } from "@/lib/data/orders.mock";
import { USE_MOCK_API } from "./config";
import { mockDelay } from "./delay";
import { apiGet, apiGetPaginated, type PaginationMeta } from "./http";

// ---- Real backend response shape (see backend/README.md — "GET /order/:order_number") ----
interface BackendShippingAddress {
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

interface BackendOrderItem {
  product_name: string;
  variant_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url?: string | null;
}

interface BackendOrderDetail {
  order_number: string;
  order_status: string;
  payment_status: string;
  fulfillment_status: string;
  created_at: string;
  shipping_address: BackendShippingAddress;
  total_amount: number;
  notes?: string | null;
  items: BackendOrderItem[];
}

const STATUS_FLOW = ["pending", "confirmed", "processing", "shipped", "delivered"];

const STAGE_LABEL: Record<string, string> = {
  pending: "Order Placed",
  confirmed: "Order Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

const STAGE_DESCRIPTION: Record<string, string> = {
  pending: "Your order has been received and is awaiting confirmation.",
  confirmed: "Your order has been confirmed and is being prepared.",
  processing: "Your order is being packed at the fulfilment centre.",
  shipped: "Your order has been handed over to the courier.",
  delivered: "Your order has been delivered.",
};

/**
 * Real customer orders only track `order_status`/`payment_status`/`fulfillment_status` — there's no
 * courier-level tracking exposed to customers yet, so the timeline is built from that status instead
 * of fabricated courier milestones.
 */
function buildStages(orderStatus: string, placedOn: string): TrackingStage[] {
  if (orderStatus === "cancelled") {
    return [
      { key: "pending", label: "Order Placed", description: STAGE_DESCRIPTION.pending, status: "completed", timestamp: placedOn },
      {
        key: "cancelled",
        label: "Order Cancelled",
        description: "This order was cancelled and any reserved stock has been released.",
        status: "failed",
        timestamp: null,
      },
    ];
  }

  const currentIndex = Math.max(STATUS_FLOW.indexOf(orderStatus), 0);
  return STATUS_FLOW.map((key, index) => ({
    key,
    label: STAGE_LABEL[key],
    description: STAGE_DESCRIPTION[key],
    status: index < currentIndex ? "completed" : index === currentIndex ? "current" : "pending",
    timestamp: index === 0 ? placedOn : null,
  }));
}

function toDiagnostic(orderStatus: string): ShipmentDiagnostic {
  return orderStatus === "cancelled" ? "cancelled" : "on-track";
}

function mapOrderDetailToTracking(detail: BackendOrderDetail): OrderTracking {
  const address = detail.shipping_address;
  const addressLine = [address.address_line1, address.address_line2, address.landmark].filter(Boolean).join(", ");

  return {
    awb: detail.order_number,
    orderId: detail.order_number,
    courierPartner: null,
    placedOn: detail.created_at,
    expectedDelivery: null,
    destination: {
      name: address.name,
      addressLine,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    },
    manifest: detail.items.map((item) => ({
      productName: item.product_name,
      variant: item.variant_name,
      quantity: item.quantity,
      price: item.unit_price,
    })),
    stages: buildStages(detail.order_status, detail.created_at),
    diagnostic: toDiagnostic(detail.order_status),
  };
}

/**
 * Looks up a customer's own order by order number (e.g. "ORD-20260919-0001").
 * Requires the caller to be logged in — the backend has no public/AWB-based tracking.
 */
export async function fetchOrderTracking(orderNumber: string): Promise<OrderTracking> {
  if (USE_MOCK_API) {
    await mockDelay(450);
    const order = getMockOrderByAwb(orderNumber);
    if (!order) throw new Error(`No order found for ${orderNumber}`);
    return order;
  }
  const detail = await apiGet<BackendOrderDetail>(`/order/${encodeURIComponent(orderNumber)}`);
  return mapOrderDetailToTracking(detail);
}

// ---- My Orders (see backend/README.md — "GET /order/my-orders") ----
export interface MyOrderItem {
  product_name: string;
  variant_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url: string | null;
}

export interface MyOrder {
  id: number;
  order_number: string;
  total_amount: number;
  order_status: string;
  payment_status: string;
  fulfillment_status: string;
  created_at: string;
  items: MyOrderItem[];
}

export interface MyOrdersPage {
  orders: MyOrder[];
  pagination: PaginationMeta | undefined;
}

/** One page of the logged-in customer's orders, newest first. */
export async function fetchMyOrders(page: number, limit = 10): Promise<MyOrdersPage> {
  if (USE_MOCK_API) {
    await mockDelay(300);
    return { orders: [], pagination: { current_page: 1, per_page: limit, total: 0, total_pages: 0 } };
  }
  const { data, pagination } = await apiGetPaginated<MyOrder[]>("/order/my-orders", { page: String(page), limit: String(limit) });
  return { orders: data, pagination };
}
