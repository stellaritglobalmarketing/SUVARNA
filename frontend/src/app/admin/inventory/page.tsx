"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adjustInventory, getInventory, type InventoryRow } from "@/lib/api/admin";
import { AdminButton, Field, FilterSelect, Modal, PageHeader, Pagination, SearchInput, StatusPill, Table, TableState, inputClass, useAdminMutation } from "@/components/admin/ui";
import { useUrlFilters } from "@/components/admin/useUrlFilters";
import { cn } from "@/lib/utils/cn";

const FILTERS = ["search", "low_stock"] as const;
const REFRESH = { invalidate: [["admin", "inventory"], ["admin", "products"], ["admin", "product"], ["admin", "dashboard"], ["products"]] };

function AdjustModal({ row, onClose }: { row: InventoryRow; onClose: () => void }) {
  const [type, setType] = useState<"add" | "remove">("add");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const save = useAdminMutation(() => adjustInventory(row.variant_id, { type, quantity: Number(quantity), reason: reason.trim() || undefined }), {
    success: "Stock adjusted",
    ...REFRESH,
    onSuccess: onClose,
  });
  const qty = Number(quantity) || 0;
  const after = type === "add" ? row.available_quantity + qty : row.available_quantity - qty;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate(undefined);
  };

  return (
    <Modal title={`Adjust stock — ${row.product.name} (${row.variant_name})`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-brand-sand p-3 text-center text-sm">
          <div>
            <p className="text-xs text-brand-ink/50">In stock</p>
            <p className="font-semibold">{row.stock_quantity}</p>
          </div>
          <div>
            <p className="text-xs text-brand-ink/50">Held by orders</p>
            <p className="font-semibold">{row.reserved_quantity}</p>
          </div>
          <div>
            <p className="text-xs text-brand-ink/50">Available</p>
            <p className="font-semibold">{row.available_quantity}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(["add", "remove"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-sm font-medium cursor-pointer",
                type === t ? "border-brand-forest bg-brand-forest text-brand-sand" : "border-brand-sand-dark bg-white text-brand-ink/70",
              )}
            >
              {t === "add" ? "Add stock (new supply)" : "Remove (damaged / lost)"}
            </button>
          ))}
        </div>
        <Field label="Quantity *">
          <input required type="number" min={1} max={type === "remove" ? row.available_quantity : undefined} value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Reason (optional)">
          <input maxLength={255} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. New batch received" className={inputClass} />
        </Field>
        {qty > 0 && <p className="text-sm text-brand-ink/70">Available after this: <strong>{Math.max(after, 0)}</strong></p>}
        <div className="flex gap-2">
          <AdminButton type="submit" loading={save.isPending} disabled={qty <= 0}>
            Save
          </AdminButton>
          <AdminButton variant="ghost" onClick={onClose}>
            Cancel
          </AdminButton>
        </div>
      </form>
    </Modal>
  );
}

function InventoryList() {
  const { filters, page, setFilter } = useUrlFilters(FILTERS);
  const [adjusting, setAdjusting] = useState<InventoryRow | null>(null);
  const { data, isLoading, isError, refetch, isPlaceholderData } = useQuery({
    queryKey: ["admin", "inventory", filters, page],
    queryFn: () => getInventory({ ...filters, page, limit: 25 }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title="Inventory" subtitle="Stock for every pack size, lowest first. Units held by unpaid or unshipped orders can't be sold again." />
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput value={filters.search} onChange={(v) => setFilter("search", v)} placeholder="Product, pack or SKU…" />
        <FilterSelect
          label="Stock level"
          value={filters.low_stock}
          onChange={(v) => setFilter("low_stock", v)}
          options={[
            { value: "", label: "All stock levels" },
            { value: "true", label: "Low stock only" },
          ]}
        />
      </div>

      <div className={isPlaceholderData ? "opacity-60" : ""}>
        <Table head={["Product", "Pack", "SKU", "In stock", "Held", "Available", ""]} minWidth={860}>
          <TableState isLoading={isLoading} isError={isError} isEmpty={!!data && data.items.length === 0} columns={7} emptyText="Nothing matches." onRetry={refetch} />
          {data?.items.map((row) => (
            <tr key={row.variant_id} className={row.is_low_stock ? "bg-red-50/40" : ""}>
              <td className="px-4 py-3">
                <Link href={`/admin/products/${row.product.id}?tab=variants`} className="font-medium text-brand-forest hover:underline">
                  {row.product.name}
                </Link>
              </td>
              <td className="px-4 py-3">{row.variant_name}</td>
              <td className="px-4 py-3 text-brand-ink/60">{row.sku}</td>
              <td className="px-4 py-3">{row.stock_quantity}</td>
              <td className="px-4 py-3 text-brand-ink/60">{row.reserved_quantity}</td>
              <td className="px-4 py-3">
                <span className="font-semibold">{row.available_quantity}</span>{" "}
                {row.is_low_stock && <StatusPill status="low" label={row.available_quantity === 0 ? "Sold out" : `Low (≤ ${row.low_stock_limit})`} />}
              </td>
              <td className="px-4 py-3 text-right">
                <AdminButton size="sm" variant="outline" onClick={() => setAdjusting(row)}>
                  Adjust
                </AdminButton>
              </td>
            </tr>
          ))}
        </Table>
      </div>
      <Pagination pagination={data?.pagination} onPage={(p) => setFilter("page", p)} />
      {adjusting && <AdjustModal row={adjusting} onClose={() => setAdjusting(null)} />}
    </>
  );
}

export default function AdminInventoryPage() {
  return (
    <Suspense fallback={null}>
      <InventoryList />
    </Suspense>
  );
}
