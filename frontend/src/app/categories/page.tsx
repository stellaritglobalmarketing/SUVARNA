import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CategoriesPageClient } from "./CategoriesPageClient";

export const metadata: Metadata = {
  title: "Harvesta — Shop by Category",
  description: "Browse every Harvesta category — almonds, cashews, dates, figs, walnuts, seeds and makhana.",
};

export default function CategoriesPage() {
  return (
    <Container className="py-8 sm:py-12">
      <SectionHeading eyebrow="Shop the Range" title="All Categories" />
      <CategoriesPageClient />
    </Container>
  );
}
