export type TrackingStageStatus = "completed" | "current" | "pending" | "failed";

export interface TrackingStage {
  key: string;
  label: string;
  description: string;
  status: TrackingStageStatus;
  timestamp: string | null;
  location?: string;
}

export interface ManifestItem {
  productName: string;
  variant: string;
  quantity: number;
  price: number;
}

export type ShipmentDiagnostic = "on-track" | "delayed" | "delivery-attempt-failed" | "rto" | "cancelled";

export interface OrderTracking {
  /** Holds the order number (e.g. "ORD-20260919-0001") — the real backend has no AWB/courier tracking for customers yet. */
  awb: string;
  orderId: string;
  courierPartner: string | null;
  placedOn: string;
  expectedDelivery: string | null;
  destination: {
    name: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
  };
  manifest: ManifestItem[];
  stages: TrackingStage[];
  diagnostic: ShipmentDiagnostic;
}
