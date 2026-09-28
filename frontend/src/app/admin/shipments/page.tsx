"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { SHIPMENT_STATUSES, generateManifest, getShipments, updateShipmentStatus } from "@/lib/api/admin";
import { formatInr } from "@/lib/utils/format";
import {
  AdminButton,
  FilterSelect,
  PageHeader,
  Pagination,
  SearchInput,
  StatusPill,
  Table,
  TableState,
  formatDateTime,
  humanize,
  inputClass,
  useAdminMutation,
} from "@/components/admin/ui";
import { EkartSetupCard } from "@/components/admin/orders/EkartSetupCard";

/** Ekart parcels waiting for pickup can go on a manifest (the list Ekart's pickup person signs). */
const MANIFESTABLE = ["created", "pickup_scheduled"];
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
  const [selected, setSelected] = useState<number[]>([]);
  const manifest = useAdminMutation((ids: number[]) => generateManifest(ids), {
    success: "Manifest generated",
    invalidate: [["admin", "shipments"], ["admin", "order"]],
    onSuccess: (result) => {
      setSelected([]);
      if (result.manifest_url) window.open(result.manifest_url, "_blank", "noopener");
    },
  });
  const toggle = (id: number) => setSelected((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <>
      <PageHeader
        title="Shipments"
        subtitle="Book Ekart shipments from an order's page; track them here. Tick parcels waiting for pickup to print one manifest."
        actions={
          selected.length > 0 && (
            <AdminButton loading={manifest.isPending} onClick={() => manifest.mutate(selected)}>
              Manifest {selected.length} parcel{selected.length === 1 ? "" : "s"}
            </AdminButton>
          )
        }
      />
      <EkartSetupCard />
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
        <Table head={["", "Order", "Provider / courier", "AWB", "Charge", "Status", "Created"]} minWidth={900}>
          <TableState isLoading={isLoading} isError={isError} isEmpty={!!data && data.items.length === 0} columns={7} emptyText="No shipments yet." onRetry={refetch} />
          {data?.items.map((sh) => (
            <tr key={sh.id}>
              <td className="w-10 px-4 py-3">
                {sh.provider === "ekart" && MANIFESTABLE.includes(sh.shipment_status) && (
                  <input
                    type="checkbox"
                    aria-label={`Add ${sh.order_number} to manifest`}
                    checked={selected.includes(sh.id)}
                    onChange={() => toggle(sh.id)}
                    className="h-4 w-4 accent-brand-forest"
                  />
                )}
              </td>
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
                {sh.provider === "ekart" ? (
                  <>
                    <StatusPill status={sh.shipment_status} />
                    {sh.ndr_status && <span className="mt-1 block text-xs text-amber-700">{sh.ndr_status}</span>}
                    {sh.manifest_number && <span className="mt-1 block text-xs text-brand-ink/50">Manifest {sh.manifest_number}</span>}
                  </>
                ) : (
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
                )}
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
