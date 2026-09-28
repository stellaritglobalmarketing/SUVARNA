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

interface BackendShipmentEvent {
  status: string;
  /** Courier's own wording, e.g. "Out for Delivery". */
  label: string | null;
  location: string | null;
  message: string | null;
  time: string;
}

interface BackendShipment {
  courier: string;
  awb_number: string | null;
  tracking_url: string | null;
  status: string;
  ndr_status: string | null;
  expected_delivery_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  events: BackendShipmentEvent[];
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
  shipment?: BackendShipment | null;
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

const SHIPMENT_LABEL: Record<string, string> = {
  created: "Shipment Booked",
  pickup_scheduled: "Pickup Scheduled",
  picked_up: "Picked Up by Courier",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  ndr: "Delivery Attempt Failed",
  delivered: "Delivered",
  rto: "Returning to Seller",
  rto_delivered: "Returned to Seller",
  cancelled: "Shipment Cancelled",
  failed: "Shipment Failed",
  lost: "Shipment Lost",
};

const PROBLEM_STATUSES = ["ndr", "rto", "rto_delivered", "cancelled", "failed", "lost"];

/**
 * Before the courier has the parcel, the timeline follows `order_status`. Once a shipment exists, the
 * order steps up to "Processing" are followed by the courier's real scans, then a pending "Delivered".
 */
function buildStages(orderStatus: string, placedOn: string, shipment?: BackendShipment | null): TrackingStage[] {
  if (shipment && shipment.events.length > 0 && orderStatus !== "cancelled") {
    const orderSteps: TrackingStage[] = ["pending", "confirmed", "processing"].map((key) => ({
      key,
      label: STAGE_LABEL[key],
      description: STAGE_DESCRIPTION[key],
      status: "completed",
      timestamp: key === "pending" ? placedOn : null,
    }));
    const last = shipment.events.length - 1;
    const courierSteps: TrackingStage[] = shipment.events.map((event, index) => ({
      key: `scan-${index}`,
      label: event.label || SHIPMENT_LABEL[event.status] || event.status,
      description: event.message || SHIPMENT_LABEL[event.status] || "",
      status:
        index < last || event.status === "delivered"
          ? "completed"
          : PROBLEM_STATUSES.includes(event.status)
            ? "failed"
            : "current",
      timestamp: event.time,
      location: event.location ?? undefined,
    }));
    const finished = ["delivered", "rto_delivered", "cancelled", "failed", "lost"].includes(shipment.status);
    return [
      ...orderSteps,
      ...courierSteps,
      ...(finished
        ? []
        : [{ key: "delivered", label: STAGE_LABEL.delivered, description: STAGE_DESCRIPTION.delivered, status: "pending" as const, timestamp: null }]),
    ];
  }

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

function toDiagnostic(orderStatus: string, shipment?: BackendShipment | null): ShipmentDiagnostic {
  if (orderStatus === "cancelled") return "cancelled";
  switch (shipment?.status) {
    case "ndr":
      return "delivery-attempt-failed";
    case "rto":
    case "rto_delivered":
      return "rto";
    case "cancelled":
    case "failed":
    case "lost":
      return "delayed";
    default:
      break;
  }
  const expected = shipment?.expected_delivery_at ? new Date(shipment.expected_delivery_at).getTime() : null;
  if (expected && shipment?.status !== "delivered" && expected < Date.now() - 24 * 60 * 60 * 1000) return "delayed";
  return "on-track";
}

function mapOrderDetailToTracking(detail: BackendOrderDetail): OrderTracking {
  const address = detail.shipping_address;
  const addressLine = [address.address_line1, address.address_line2, address.landmark].filter(Boolean).join(", ");

  return {
    awb: detail.order_number,
    orderId: detail.order_number,
    courierPartner: detail.shipment?.courier ?? null,
    courierAwb: detail.shipment?.awb_number ?? null,
    trackingUrl: detail.shipment?.tracking_url ?? null,
    placedOn: detail.created_at,
    expectedDelivery: detail.shipment?.delivered_at ?? detail.shipment?.expected_delivery_at ?? null,
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
    stages: buildStages(detail.order_status, detail.created_at, detail.shipment),
    diagnostic: toDiagnostic(detail.order_status, detail.shipment),
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
