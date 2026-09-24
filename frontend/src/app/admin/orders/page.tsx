"use client";

import { Suspense } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { FULFILLMENT_STATUSES, ORDER_STATUSES, PAYMENT_STATUSES, getOrders } from "@/lib/api/admin";
import { formatInr } from "@/lib/utils/format";
import { FilterSelect, PageHeader, Pagination, SearchInput, StatusPill, Table, TableState, formatDateTime, humanize } from "@/components/admin/ui";
import { useUrlFilters } from "@/components/admin/useUrlFilters";

const FILTERS = ["search", "order_status", "payment_status", "fulfillment_status"] as const;

function options(values: readonly string[], all: string) {
  return [{ value: "", label: all }, ...values.map((value) => ({ value, label: humanize(value) }))];
}

function OrdersList() {
  const { filters, page, setFilter } = useUrlFilters(FILTERS);
  const { data, isLoading, isError, refetch, isPlaceholderData } = useQuery({
    queryKey: ["admin", "orders", filters, page],
    queryFn: () => getOrders({ ...filters, page, limit: 20 }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title="Orders" subtitle="Every order placed on the store. Click one to update its status or add a shipment." />

      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput value={filters.search} onChange={(v) => setFilter("search", v)} placeholder="Order no., customer name, phone…" />
        <FilterSelect label="Order status" value={filters.order_status} onChange={(v) => setFilter("order_status", v)} options={options(ORDER_STATUSES, "All statuses")} />
        <FilterSelect label="Payment" value={filters.payment_status} onChange={(v) => setFilter("payment_status", v)} options={options(PAYMENT_STATUSES, "All payments")} />
        <FilterSelect
          label="Fulfillment"
          value={filters.fulfillment_status}
          onChange={(v) => setFilter("fulfillment_status", v)}
          options={options(FULFILLMENT_STATUSES, "All fulfillment")}
        />
      </div>

      <div className={isPlaceholderData ? "opacity-60" : ""}>
        <Table head={["Order", "Customer", "Total", "Status", "Payment", "Fulfillment", "Placed"]} minWidth={860}>
          <TableState
            isLoading={isLoading}
            isError={isError}
            isEmpty={!!data && data.items.length === 0}
            columns={7}
            emptyText="No orders match these filters."
            onRetry={refetch}
          />
          {data?.items.map((order) => (
            <tr key={order.id} className="hover:bg-brand-sand/40">
              <td className="px-4 py-3 font-medium">
                <Link href={`/admin/orders/${order.order_number}`} className="text-brand-forest hover:underline">
                  {order.order_number}
                </Link>
              </td>
              <td className="px-4 py-3">
                <p>{order.customer.name}</p>
                <p className="text-xs text-brand-ink/50">{order.customer.phone}</p>
              </td>
              <td className="px-4 py-3 font-medium">{formatInr(order.total_amount)}</td>
              <td className="px-4 py-3">
                <StatusPill status={order.order_status} />
              </td>
              <td className="px-4 py-3">
                <StatusPill status={order.payment_status} />
              </td>
              <td className="px-4 py-3">
                <StatusPill status={order.fulfillment_status} />
              </td>
              <td className="px-4 py-3 text-brand-ink/60">{formatDateTime(order.created_at)}</td>
            </tr>
          ))}
        </Table>
      </div>
      <Pagination pagination={data?.pagination} onPage={(p) => setFilter("page", p)} />
    </>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={null}>
      <OrdersList />
    </Suspense>
  );
}
