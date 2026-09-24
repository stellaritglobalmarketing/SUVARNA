"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProducts } from "@/hooks/useProducts";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { selectProductListParams, setCategory, toggleHealthBenefit } from "@/lib/redux/slices/filtersSlice";
import type { HealthBenefit, ProductCategory } from "@/types/product";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FilterSidebar } from "./FilterSidebar";
import { MobileFilterSheet } from "./MobileFilterSheet";
import { SortBar } from "./SortBar";
import { PaginationControls } from "./PaginationControls";
import { NutritionGuide } from "./NutritionGuide";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/ProductGrid";

export function ProductsPageClient() {
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const listParams = useAppSelector(selectProductListParams);
  const { data, isLoading, isError, isPlaceholderData } = useProducts(listParams);
  const [isFilterSheetOpen, setFilterSheetOpen] = useState(false);

  const didSyncFromUrl = useRef(false);
  useEffect(() => {
    if (didSyncFromUrl.current) return;
    didSyncFromUrl.current = true;
    const category = searchParams.get("category") as ProductCategory | null;
    if (category) dispatch(setCategory(category));
    const health = searchParams.get("health") as HealthBenefit | null;
    if (health) dispatch(toggleHealthBenefit(health));
  }, [searchParams, dispatch]);

  return (
    <>
      <div className="border-b border-brand-sand-dark bg-brand-sand-dark/30 py-8 sm:py-10">
        <Container>
          <SectionHeading eyebrow="Dry Fruits & Pantry" title="Shop the Full Suvarna7 Range" />
        </Container>
      </div>

      <Container className="flex flex-col gap-8 py-8 sm:py-10 lg:flex-row">
        <FilterSidebar />

        <div className="flex-1">
          <SortBar total={data?.total ?? 0} onOpenFilters={() => setFilterSheetOpen(true)} />

          <div className={`mt-6 transition-opacity ${isPlaceholderData ? "opacity-60" : "opacity-100"}`}>
            {isLoading && !data && <ProductGridSkeleton />}
            {isError && <p className="text-sm text-red-600">Something went wrong loading products.</p>}
            {data && <ProductGrid products={data.items} />}
          </div>

          {data && <PaginationControls totalPages={data.totalPages} />}
        </div>
      </Container>

      <NutritionGuide />

      <MobileFilterSheet isOpen={isFilterSheetOpen} onClose={() => setFilterSheetOpen(false)} />
    </>
  );
}
