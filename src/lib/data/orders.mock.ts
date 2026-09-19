import type { OrderTracking, ShipmentDiagnostic, TrackingStage } from "@/types/order";

const STAGE_TEMPLATE: Omit<TrackingStage, "status" | "timestamp">[] = [
  { key: "order-placed", label: "Order Placed", description: "Order confirmed and sent to the Harvesta fulfilment centre." },
  { key: "quality-check", label: "Quality Check", description: "Batch verified for freshness and grade before packing." },
  { key: "nitrogen-flush", label: "Nitrogen Flush Packaging", description: "Pouch sealed with nitrogen flush to lock in freshness." },
  { key: "handover", label: "Handed to Courier", description: "Shipment handed over to the logistics partner." },
  { key: "hub-transfer", label: "Carrier Hub Transfer", description: "Shipment scanned in at the regional sorting hub." },
  { key: "in-transit", label: "In Transit", description: "Shipment moving toward the destination city hub." },
  { key: "out-for-delivery", label: "Out for Delivery", description: "Shipment is with the delivery agent for final mile." },
  { key: "delivered", label: "Delivered", description: "Shipment delivered to the recipient." },
];

function buildStages(
  completedThrough: number,
  diagnostic: ShipmentDiagnostic,
  baseDate: string,
): TrackingStage[] {
  return STAGE_TEMPLATE.map((stage, index) => {
    if (index < completedThrough) {
      return {
        ...stage,
        status: "completed",
        timestamp: offsetDate(baseDate, index),
        location: LOCATIONS[index],
      };
    }
    if (index === completedThrough) {
      const isFailure = diagnostic === "delivery-attempt-failed" || diagnostic === "rto";
      return {
        ...stage,
        status: isFailure ? "failed" : "current",
        timestamp: offsetDate(baseDate, index),
        location: LOCATIONS[index],
      };
    }
    return { ...stage, status: "pending", timestamp: null };
  });
}

const LOCATIONS = [
  "Harvesta Fulfilment Centre, Srinagar",
  "Harvesta Fulfilment Centre, Srinagar",
  "Harvesta Fulfilment Centre, Srinagar",
  "Srinagar Courier Hub",
  "Delhi Regional Sorting Hub",
  "Destination City Hub",
  "Local Delivery Station",
  "Customer Address",
];

function offsetDate(base: string, days: number): string {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export const MOCK_ORDERS: OrderTracking[] = [
  {
    awb: "BLD-9038472911",
    orderId: "HRV-100234",
    courierPartner: "BlueDart",
    placedOn: "2026-09-12T10:15:00.000Z",
    expectedDelivery: "2026-09-20T18:00:00.000Z",
    destination: {
      name: "Ritika Sharma",
      addressLine: "B-42, Green Meadows Society, Baner Road",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411045",
    },
    manifest: [
      { productName: "Kashmir Mamra Almonds", variant: "500g", quantity: 1, price: 1099 },
      { productName: "Jumbo Medjool Dates", variant: "250g", quantity: 2, price: 349 },
    ],
    stages: buildStages(6, "on-track", "2026-09-12T10:15:00.000Z"),
    diagnostic: "on-track",
  },
  {
    awb: "EKT-7742910385",
    orderId: "HRV-100198",
    courierPartner: "Ekart",
    placedOn: "2026-09-08T09:30:00.000Z",
    expectedDelivery: "2026-09-16T18:00:00.000Z",
    destination: {
      name: "Arjun Mehta",
      addressLine: "14/2, MG Road, Indiranagar",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560038",
    },
    manifest: [{ productName: "King Cashews W180", variant: "1kg", quantity: 1, price: 1799 }],
    stages: buildStages(5, "delayed", "2026-09-08T09:30:00.000Z"),
    diagnostic: "delayed",
  },
  {
    awb: "DLV-5521837460",
    orderId: "HRV-100176",
    courierPartner: "Delhivery",
    placedOn: "2026-09-05T13:00:00.000Z",
    expectedDelivery: "2026-09-13T18:00:00.000Z",
    destination: {
      name: "Fatima Khan",
      addressLine: "22, Sector 15, Vasundhara",
      city: "Ghaziabad",
      state: "Uttar Pradesh",
      pincode: "201012",
    },
    manifest: [
      { productName: "Kashmiri Walnut Kernels", variant: "250g", quantity: 1, price: 539 },
      { productName: "Kashmir Mamra Almonds", variant: "100g", quantity: 2, price: 249 },
    ],
    stages: buildStages(6, "delivery-attempt-failed", "2026-09-05T13:00:00.000Z"),
    diagnostic: "delivery-attempt-failed",
  },
  {
    awb: "DTC-3391005567",
    orderId: "HRV-100142",
    courierPartner: "DTDC",
    placedOn: "2026-08-28T11:45:00.000Z",
    expectedDelivery: "2026-09-05T18:00:00.000Z",
    destination: {
      name: "Suresh Nair",
      addressLine: "7, Marine Drive Apartments",
      city: "Kochi",
      state: "Kerala",
      pincode: "682031",
    },
    manifest: [{ productName: "Jumbo Medjool Dates", variant: "1kg", quantity: 1, price: 1199 }],
    stages: buildStages(4, "rto", "2026-08-28T11:45:00.000Z"),
    diagnostic: "rto",
  },
];

export function getMockOrderByAwb(awb: string): OrderTracking | undefined {
  return MOCK_ORDERS.find((order) => order.awb.toLowerCase() === awb.trim().toLowerCase());
}
