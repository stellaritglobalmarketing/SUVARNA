import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductsPageClient } from "@/components/plp/ProductsPageClient";

export const metadata: Metadata = {
  title: "Harvesta — Dry Fruits Category & Almonds Listing",
  description: "Browse Grade-A almonds, cashews, dates, walnuts and more with weight variants, origin and health-benefit filters.",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsPageClient />
    </Suspense>
  );
}
