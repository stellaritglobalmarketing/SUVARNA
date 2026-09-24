import { Suspense } from "react";
import type { Metadata } from "next";
import { TrackOrderClient } from "@/components/tracking/TrackOrderClient";

export const metadata: Metadata = {
  title: "Suvarna7 — Order Tracking & Shipment Status",
  description: "Track your Suvarna7 shipment across Ekart, Delhivery, BlueDart, DTDC and Shiprocket in real time.",
};

export default function TrackOrderPage() {
  return (
    <Suspense fallback={null}>
      <TrackOrderClient />
    </Suspense>
  );
}
