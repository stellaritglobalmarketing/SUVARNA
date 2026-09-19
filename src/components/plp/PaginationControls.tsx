"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { selectFilters, setPage } from "@/lib/redux/slices/filtersSlice";

export function PaginationControls({ totalPages }: { totalPages: number }) {
  const dispatch = useAppDispatch();
  const { page } = useAppSelector(selectFilters);

  if (totalPages <= 1) return null;

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Product pagination">
      <button
        type="button"
        onClick={() => dispatch(setPage(page - 1))}
        disabled={page <= 1}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-sand-dark text-brand-forest disabled:opacity-30 cursor-pointer"
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          onClick={() => dispatch(setPage(pageNumber))}
          aria-current={pageNumber === page ? "page" : undefined}
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium cursor-pointer ${
            pageNumber === page ? "bg-brand-forest text-brand-sand" : "border border-brand-sand-dark text-brand-ink"
          }`}
        >
          {pageNumber}
        </button>
      ))}
      <button
        type="button"
        onClick={() => dispatch(setPage(page + 1))}
        disabled={page >= totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-sand-dark text-brand-forest disabled:opacity-30 cursor-pointer"
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
