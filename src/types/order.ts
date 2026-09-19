export type CourierPartner = "Ekart" | "Delhivery" | "BlueDart" | "DTDC" | "Shiprocket";

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

export type ShipmentDiagnostic = "on-track" | "delayed" | "delivery-attempt-failed" | "rto";

export interface OrderTracking {
  awb: string;
  orderId: string;
  courierPartner: CourierPartner;
  placedOn: string;
  expectedDelivery: string;
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
