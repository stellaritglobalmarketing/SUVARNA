"use client";

import { Suspense } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getCustomers } from "@/lib/api/admin";
import { ActivePill, FilterSelect, PageHeader, Pagination, SearchInput, Table, TableState, formatDate } from "@/components/admin/ui";
import { useUrlFilters } from "@/components/admin/useUrlFilters";

const FILTERS = ["search", "status"] as const;

function CustomersList() {
  const { filters, page, setFilter } = useUrlFilters(FILTERS);
  const { data, isLoading, isError, refetch, isPlaceholderData } = useQuery({
    queryKey: ["admin", "customers", filters, page],
    queryFn: () => getCustomers({ ...filters, page, limit: 25 }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title="Customers" subtitle="Everyone who has signed up on the store." />
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput value={filters.search} onChange={(v) => setFilter("search", v)} placeholder="Name, email or phone…" />
        <FilterSelect
          label="Status"
          value={filters.status}
          onChange={(v) => setFilter("status", v)}
          options={[
            { value: "", label: "All customers" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Deactivated" },
          ]}
        />
      </div>
      <div className={isPlaceholderData ? "opacity-60" : ""}>
        <Table head={["Name", "Phone", "Email", "Joined", "Status"]}>
          <TableState isLoading={isLoading} isError={isError} isEmpty={!!data && data.items.length === 0} columns={5} emptyText="No customers found." onRetry={refetch} />
          {data?.items.map((c) => (
            <tr key={c.id} className="hover:bg-brand-sand/40">
              <td className="px-4 py-3">
                <Link href={`/admin/customers/${c.id}`} className="font-medium text-brand-forest hover:underline">
                  {c.name}
                </Link>
              </td>
              <td className="px-4 py-3">{c.phone}</td>
              <td className="px-4 py-3 text-brand-ink/70">{c.email ?? "—"}</td>
              <td className="px-4 py-3 text-brand-ink/60">{formatDate(c.created_at)}</td>
              <td className="px-4 py-3">
                <ActivePill active={c.is_active} />
              </td>
            </tr>
          ))}
        </Table>
      </div>
      <Pagination pagination={data?.pagination} onPage={(p) => setFilter("page", p)} />
    </>
  );
}

export default function AdminCustomersPage() {
  return (
    <Suspense fallback={null}>
      <CustomersList />
    </Suspense>
  );
}
