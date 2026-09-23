"use client";

import { useHome } from "@/hooks/useHome";
import { toCategoryDisplay } from "@/lib/utils/categoryDisplay";
import { CategoryCircle } from "@/components/home/CategoryCircle";
import { ProductGridSkeleton } from "@/components/product/ProductGrid";

export function CategoriesPageClient() {
  const { data, isLoading } = useHome();
  const categories = (data?.categories ?? []).map(toCategoryDisplay);

  if (isLoading) return <ProductGridSkeleton count={7} />;

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-brand-sand-dark py-20 text-center">
        <p className="text-brand-ink/70">No categories available yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 sm:gap-x-6 lg:grid-cols-7">
      {categories.map((item) => (
        <div key={item.category} className="flex justify-center">
          <CategoryCircle item={item} />
        </div>
      ))}
    </div>
  );
}
