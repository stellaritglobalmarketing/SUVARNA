"use client";

import { Suspense } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { SHIPMENT_STATUSES, getShipments, updateShipmentStatus } from "@/lib/api/admin";
import { formatInr } from "@/lib/utils/format";
import { FilterSelect, PageHeader, Pagination, SearchInput, Table, TableState, formatDateTime, humanize, inputClass, useAdminMutation } from "@/components/admin/ui";
import { useUrlFilters } from "@/components/admin/useUrlFilters";

const FILTERS = ["search", "shipment_status"] as const;

function ShipmentsList() {
  const { filters, page, setFilter } = useUrlFilters(FILTERS);
  const { data, isLoading, isError, refetch, isPlaceholderData } = useQuery({
    queryKey: ["admin", "shipments", filters, page],
    queryFn: () => getShipments({ ...filters, page, limit: 25 }),
    placeholderData: keepPreviousData,
  });
  const update = useAdminMutation(({ id, status }: { id: number; status: string }) => updateShipmentStatus(id, status), {
    success: "Shipment updated",
    invalidate: [["admin", "shipments"], ["admin", "order"], ["admin", "orders"]],
  });

  return (
    <>
      <PageHeader title="Shipments" subtitle="Add a shipment from an order's page once the courier is booked; track its progress here." />
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput value={filters.search} onChange={(v) => setFilter("search", v)} placeholder="AWB or order number…" />
        <FilterSelect
          label="Shipment status"
          value={filters.shipment_status}
          onChange={(v) => setFilter("shipment_status", v)}
          options={[{ value: "", label: "All statuses" }, ...SHIPMENT_STATUSES.map((s) => ({ value: s, label: humanize(s) }))]}
        />
      </div>
      <div className={isPlaceholderData ? "opacity-60" : ""}>
        <Table head={["Order", "Provider / courier", "AWB", "Charge", "Status", "Created"]} minWidth={860}>
          <TableState isLoading={isLoading} isError={isError} isEmpty={!!data && data.items.length === 0} columns={6} emptyText="No shipments yet." onRetry={refetch} />
          {data?.items.map((sh) => (
            <tr key={sh.id}>
              <td className="px-4 py-3">
                <Link href={`/admin/orders/${sh.order_number}`} className="font-medium text-brand-forest hover:underline">
                  {sh.order_number}
                </Link>
              </td>
              <td className="px-4 py-3">
                {sh.provider}
                {sh.courier_name && <span className="block text-xs text-brand-ink/50">{sh.courier_name}</span>}
              </td>
              <td className="px-4 py-3 text-brand-ink/70">{sh.awb_number ?? "—"}</td>
              <td className="px-4 py-3">{sh.shipping_charge ? formatInr(sh.shipping_charge) : "—"}</td>
              <td className="px-4 py-3">
                <select
                  value={sh.shipment_status}
                  disabled={update.isPending}
                  onChange={(e) => update.mutate({ id: sh.id, status: e.target.value })}
                  aria-label={`Status of shipment for ${sh.order_number}`}
                  className={`${inputClass} w-auto py-1 text-xs`}
                >
                  {SHIPMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {humanize(s)}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 text-brand-ink/60">{formatDateTime(sh.created_at)}</td>
            </tr>
          ))}
        </Table>
      </div>
      <Pagination pagination={data?.pagination} onPage={(p) => setFilter("page", p)} />
    </>
  );
}

export default function AdminShipmentsPage() {
  return (
    <Suspense fallback={null}>
      <ShipmentsList />
    </Suspense>
  );
}
