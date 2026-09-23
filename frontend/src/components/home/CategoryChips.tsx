"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { useHome } from "@/hooks/useHome";
import { toCategoryDisplay } from "@/lib/utils/categoryDisplay";
import { CategoryCircle } from "./CategoryCircle";

const MOBILE_VISIBLE_COUNT = 4;

export function CategoryChips() {
  const { data } = useHome();
  const categories = (data?.categories ?? []).map(toCategoryDisplay);

  if (categories.length === 0) return null;

  const mobileCategories = categories.slice(0, MOBILE_VISIBLE_COUNT);

  return (
    <section className="py-5 sm:py-10">
      <Container>
        {/* Mobile: exactly 4 categories + a "View All" tile, no horizontal scroll */}
        <div className="grid grid-cols-4 gap-3 sm:hidden">
          {mobileCategories.map((item) => (
            <CategoryCircle key={item.category} item={item} size="sm" />
          ))}
        </div>
        <div className="mt-4 text-center sm:hidden">
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-sand-dark bg-white px-4 py-2 text-xs font-semibold text-brand-forest active:bg-brand-sand-dark"
          >
            <MoreHorizontal size={14} /> View All Categories
          </Link>
        </div>

        {/* Desktop: full set, wraps gracefully instead of squeezing into one line */}
        <div className="hidden flex-wrap items-start justify-center gap-x-6 gap-y-6 sm:flex">
          {categories.map((item) => (
            <CategoryCircle key={item.category} item={item} />
          ))}
          <Link
            href="/categories"
            className="flex flex-col items-center gap-2 text-center text-brand-forest hover:text-brand-forest-light"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-brand-sand-dark sm:h-24 sm:w-24">
              <MoreHorizontal size={22} />
            </span>
            <span className="text-xs font-medium sm:text-sm">View All</span>
          </Link>
        </div>
      </Container>
    </section>
  );
}
