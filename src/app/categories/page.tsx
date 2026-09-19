import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CategoryCircle } from "@/components/home/CategoryCircle";
import { CATEGORIES } from "@/lib/data/categories";

export const metadata: Metadata = {
  title: "Harvesta — Shop by Category",
  description: "Browse every Harvesta category — almonds, cashews, dates, figs, walnuts, seeds and makhana.",
};

export default function CategoriesPage() {
  return (
    <Container className="py-8 sm:py-12">
      <SectionHeading eyebrow="Shop the Range" title="All Categories" />
      <div className="mt-8 grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 sm:gap-x-6 lg:grid-cols-7">
        {CATEGORIES.map((item) => (
          <div key={item.category} className="flex justify-center">
            <CategoryCircle item={item} />
          </div>
        ))}
      </div>
    </Container>
  );
}
