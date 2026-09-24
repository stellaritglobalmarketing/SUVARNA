import { Suspense } from "react";
import type { Metadata } from "next";
import { OrderSuccessClient } from "@/components/checkout/OrderSuccessClient";

export const metadata: Metadata = {
  title: "Suvarna7 — Order Confirmed",
  robots: { index: false },
};

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <OrderSuccessClient />
    </Suspense>
  );
}
