"use client";

import { X } from "lucide-react";
import type { Product } from "@/types/product";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { selectFilters, setSearch } from "@/lib/redux/slices/filtersSlice";
import { useProducts } from "@/hooks/useProducts";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/ProductGrid";

const SEARCH_PAGE_SIZE = 24;

/**
 * Single unified catalog listing — the client's full product range in one grid.
 * A search from the header swaps the grid for the backend's search results until it's cleared.
 */
export function AllProducts({ products }: { products: Product[] }) {
  const dispatch = useAppDispatch();
  const search = useAppSelector(selectFilters).search.trim();
  const isSearching = search.length > 0;

  const { data, isLoading, isError, isPlaceholderData } = useProducts(
    { search, page: 1, pageSize: SEARCH_PAGE_SIZE },
    { enabled: isSearching },
  );
  const results = isSearching ? data?.items : products;

  return (
    <section id="products" className="scroll-mt-20 py-4 sm:py-12">
      <Container>
        {isSearching ? (
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionHeading
              eyebrow="Search"
              title={`Results for “${search}”`}
              subtitle={data ? `${data.total} product${data.total === 1 ? "" : "s"} found` : undefined}
            />
            <button
              type="button"
              onClick={() => dispatch(setSearch(""))}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-sand-dark bg-white px-4 py-2 text-xs font-semibold text-brand-forest hover:bg-brand-sand-dark cursor-pointer"
            >
              <X size={14} /> Clear search
            </button>
          </div>
        ) : (
          <SectionHeading eyebrow="Our Range" title="Our Products" subtitle="Everything we grow, harvest and churn — in one place." />
        )}

        <div className={`mt-6 transition-opacity sm:mt-8 ${isSearching && isPlaceholderData ? "opacity-60" : "opacity-100"}`}>
          {isSearching && isLoading && <ProductGridSkeleton count={4} />}
          {isSearching && isError && (
            <p className="text-sm text-red-600">Something went wrong while searching. Please try again.</p>
          )}
          {results && <ProductGrid products={results} />}
        </div>
      </Container>
    </section>
  );
}
