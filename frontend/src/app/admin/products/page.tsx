"use client";

import { Suspense } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { getCategories, getProducts, setProductStatus } from "@/lib/api/admin";
import { formatInr } from "@/lib/utils/format";
import { ProductImagePlaceholder } from "@/components/ui/ProductImagePlaceholder";
import { ActivePill, AdminButton, FilterSelect, PageHeader, Pagination, SearchInput, StatusPill, Table, TableState, useAdminMutation } from "@/components/admin/ui";
import { useUrlFilters } from "@/components/admin/useUrlFilters";

const FILTERS = ["search", "category_id", "status", "sort"] as const;
const PLACEHOLDER_GRADIENT: [string, string] = ["#8a6a4f", "#d4a373"];

function ProductsList() {
  const { filters, page, setFilter } = useUrlFilters(FILTERS);
  const { data, isLoading, isError, refetch, isPlaceholderData } = useQuery({
    queryKey: ["admin", "products", filters, page],
    queryFn: () => getProducts({ ...filters, page, limit: 20 }),
    placeholderData: keepPreviousData,
  });
  const { data: categories } = useQuery({ queryKey: ["admin", "categories"], queryFn: () => getCategories() });

  const toggle = useAdminMutation(({ id, active }: { id: number; active: boolean }) => setProductStatus(id, active), {
    success: "Product updated",
    invalidate: [["admin", "products"], ["admin", "dashboard"]],
  });

  function priceRange(min: number | null, max: number | null) {
    if (min == null) return "—";
    return min === max ? formatInr(min) : `${formatInr(min)} – ${formatInr(max ?? min)}`;
  }

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Add products, set their prices and stock, photos and product-page content."
        actions={
          <Link href="/admin/products/new" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-forest px-4 py-2 text-sm font-medium text-brand-sand hover:bg-brand-forest-light">
            <Plus size={15} /> New product
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput value={filters.search} onChange={(v) => setFilter("search", v)} placeholder="Search products…" />
        <FilterSelect
          label="Category"
          value={filters.category_id}
          onChange={(v) => setFilter("category_id", v)}
          options={[{ value: "", label: "All categories" }, ...(categories?.items ?? []).map((c) => ({ value: String(c.id), label: c.name }))]}
        />
        <FilterSelect
          label="Status"
          value={filters.status}
          onChange={(v) => setFilter("status", v)}
          options={[
            { value: "", label: "Any status" },
            { value: "active", label: "Live" },
            { value: "inactive", label: "Hidden" },
          ]}
        />
        <FilterSelect
          label="Sort"
          value={filters.sort}
          onChange={(v) => setFilter("sort", v)}
          options={[
            { value: "", label: "Newest first" },
            { value: "oldest", label: "Oldest first" },
            { value: "name_asc", label: "Name A–Z" },
            { value: "name_desc", label: "Name Z–A" },
          ]}
        />
      </div>

      <div className={isPlaceholderData ? "opacity-60" : ""}>
        <Table head={["Product", "Category", "Price", "Variants", "Stock", "Status", ""]} minWidth={900}>
          <TableState isLoading={isLoading} isError={isError} isEmpty={!!data && data.items.length === 0} columns={7} emptyText="No products found." onRetry={refetch} />
          {data?.items.map((product) => (
            <tr key={product.id} className="hover:bg-brand-sand/40">
              <td className="px-4 py-3">
                <Link href={`/admin/products/${product.id}`} className="flex items-center gap-3">
                  <ProductImagePlaceholder
                    src={product.image_url ?? undefined}
                    alt={product.name}
                    gradient={PLACEHOLDER_GRADIENT}
                    iconSize={16}
                    sizes="44px"
                    className="h-11 w-11 shrink-0 rounded-lg"
                  />
                  <span>
                    <span className="block font-medium text-brand-forest hover:underline">{product.name}</span>
                    <span className="flex gap-1 pt-0.5">
                      {product.is_featured && <StatusPill status="confirmed" label="Featured" />}
                      {product.is_bestseller && <StatusPill status="pending" label="Best seller" />}
                    </span>
                  </span>
                </Link>
              </td>
              <td className="px-4 py-3 text-brand-ink/70">
                {product.category.name}
                {product.sub_category.name !== product.category.name && <span className="block text-xs text-brand-ink/50">{product.sub_category.name}</span>}
              </td>
              <td className="px-4 py-3">{priceRange(product.min_price, product.max_price)}</td>
              <td className="px-4 py-3">{product.variant_count}</td>
              <td className="px-4 py-3">
                <span className={product.available_stock === 0 ? "font-semibold text-red-600" : ""}>{product.available_stock}</span>
              </td>
              <td className="px-4 py-3">
                <ActivePill active={product.is_active} />
              </td>
              <td className="px-4 py-3 text-right">
                <AdminButton
                  variant="outline"
                  size="sm"
                  disabled={toggle.isPending}
                  onClick={() => toggle.mutate({ id: product.id, active: !product.is_active })}
                >
                  {product.is_active ? "Hide" : "Make live"}
                </AdminButton>
              </td>
            </tr>
          ))}
        </Table>
      </div>
      <Pagination pagination={data?.pagination} onPage={(p) => setFilter("page", p)} />
    </>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsList />
    </Suspense>
  );
}
