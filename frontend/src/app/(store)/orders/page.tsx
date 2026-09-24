import type { Metadata } from "next";
import { MyOrdersClient } from "@/components/orders/MyOrdersClient";

export const metadata: Metadata = {
  title: "Suvarna7 — My Orders",
  robots: { index: false },
};

export default function MyOrdersPage() {
  return <MyOrdersClient />;
}
