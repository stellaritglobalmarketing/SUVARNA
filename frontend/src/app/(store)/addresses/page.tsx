import type { Metadata } from "next";
import { MyAddressesClient } from "@/components/account/MyAddressesClient";

export const metadata: Metadata = {
  title: "Suvarna7 — My Addresses",
  robots: { index: false },
};

export default function MyAddressesPage() {
  return <MyAddressesClient />;
}
