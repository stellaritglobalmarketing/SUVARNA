"use client";

import { Suspense } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Eye, IndianRupee, Radio, Users } from "lucide-react";
import { getActivitySessions, getActivitySummary, type ActivitySource, type ActivitySummary } from "@/lib/api/admin";
import { formatInr } from "@/lib/utils/format";
import { Card, FilterSelect, PageHeader, Pagination, SearchInput, StatusPill, Table, TableState, Tile, formatDateTime } from "@/components/admin/ui";
import { describeEvent, mediumLabel, sourceLabel } from "@/components/admin/activity/labels";
import { useUrlFilters } from "@/components/admin/useUrlFilters";
import { ProductImagePlaceholder } from "@/components/ui/ProductImagePlaceholder";

const FILTERS = ["range", "search", "source", "status"] as const;
const REFRESH_MS = 15 * 1000;
const PLACEHOLDER_GRADIENT: [string, string] = ["#8a6a4f", "#d4a373"];

const RANGES = [
  { value: "24h", label: "Last 24 hours" },
  { value: "", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

function percent(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : "0%";
}

/** A value next to its share of the largest row, so sizes read at a glance. */
function Bar({ value, max }: { value: number; max: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-brand-sand-dark/50">
      <div className="h-full rounded-full bg-brand-forest" style={{ width: `${max > 0 ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0}%` }} />
    </div>
  );
}

function SourcesCard({ sources }: { sources: ActivitySource[] }) {
  const max = Math.max(1, ...sources.map((row) => row.visits));
  return (
    <Card title="Where visitors come from" className="xl:col-span-2">
      {sources.length === 0 ? (
        <p className="text-sm text-brand-ink/60">No visits in this period yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-brand-ink/50">
                <th className="pb-2 pr-4 font-semibold">Source</th>
                <th className="pb-2 pr-4 font-semibold">Visits</th>
                <th className="pb-2 pr-4 text-right font-semibold">Orders</th>
                <th className="pb-2 text-right font-semibold">Paid revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-sand-dark/60">
              {sources.map((row) => (
                <tr key={`${row.source}-${row.medium}`}>
                  <td className="py-2.5 pr-4">
                    <p className="font-medium text-brand-ink">{sourceLabel(row.source)}</p>
                    {mediumLabel(row.medium) && <p className="text-xs text-brand-ink/55">{mediumLabel(row.medium)}</p>}
                  </td>
                  <td className="w-2/5 py-2.5 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Bar value={row.visits} max={max} />
                      </div>
                      <span className="w-8 text-right font-semibold tabular-nums">{row.visits}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{row.orders}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatInr(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function FunnelCard({ funnel }: { funnel: ActivitySummary["funnel"] }) {
  const first = funnel[0]?.visits ?? 0;
  return (
    <Card title="From visit to order">
      <ul className="space-y-3">
        {funnel.map(({ step, visits }) => (
          <li key={step}>
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span className="text-brand-ink/80">{step}</span>
              <span className="tabular-nums">
                <span className="font-semibold">{visits}</span> <span className="text-xs text-brand-ink/55">{percent(visits, first)}</span>
              </span>
            </div>
            <Bar value={visits} max={first} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TopProductsCard({ products }: { products: ActivitySummary["top_products"] }) {
  if (products.length === 0) return null;
  return (
    <Card title="Most viewed products">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-brand-ink/50">
              <th className="pb-2 pr-4 font-semibold">Product</th>
              <th className="pb-2 pr-4 text-right font-semibold">Views</th>
              <th className="pb-2 pr-4 text-right font-semibold">Visitors</th>
              <th className="pb-2 pr-4 text-right font-semibold">Added to cart</th>
              <th className="pb-2 pr-4 text-right font-semibold">Sold</th>
              <th className="pb-2 pr-4 text-right font-semibold">Revenue</th>
              <th className="pb-2 pr-4 font-semibold">Top source</th>
              <th className="pb-2 font-semibold">Last viewed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-sand-dark/60">
            {products.map((product) => (
              <tr key={product.slug}>
                <td className="py-2.5 pr-4">
                  <Link href={`/products/${product.slug}`} target="_blank" className="flex items-center gap-3 font-medium text-brand-forest hover:underline">
                    <ProductImagePlaceholder
                      src={product.image_url ?? undefined}
                      alt={product.name ?? product.slug}
                      gradient={PLACEHOLDER_GRADIENT}
                      iconSize={14}
                      sizes="40px"
                      className="h-10 w-10 shrink-0 rounded-lg"
                    />
                    {product.name ?? product.slug}
                  </Link>
                </td>
                <td className="py-2.5 pr-4 text-right font-semibold tabular-nums">{product.views}</td>
                <td className="py-2.5 pr-4 text-right tabular-nums">{product.visitors}</td>
                <td className="py-2.5 pr-4 text-right tabular-nums">
                  {product.added_to_cart}
                  {product.add_to_cart_rate != null && <p className="text-xs text-brand-ink/55">{product.add_to_cart_rate}% of viewing visits</p>}
                </td>
                <td className="py-2.5 pr-4 text-right tabular-nums">{product.units_sold}</td>
                <td className="py-2.5 pr-4 text-right tabular-nums">{formatInr(product.revenue)}</td>
                <td className="py-2.5 pr-4">{product.top_source ? sourceLabel(product.top_source) : "—"}</td>
                <td className="whitespace-nowrap py-2.5 text-xs text-brand-ink/70">{formatDateTime(product.last_viewed_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-brand-ink/55">Sold and revenue count paid orders placed during these visits, not cancelled ones.</p>
    </Card>
  );
}

function ActivityPage() {
  const { filters, page, setFilter } = useUrlFilters(FILTERS);
  const summary = useQuery({
    queryKey: ["admin", "activity-summary", filters.range],
    queryFn: () => getActivitySummary(filters.range),
    placeholderData: keepPreviousData,
    refetchInterval: REFRESH_MS,
  });
  const sessions = useQuery({
    queryKey: ["admin", "activity-sessions", filters, page],
    queryFn: () => getActivitySessions({ ...filters, page, limit: 25 }),
    placeholderData: keepPreviousData,
    refetchInterval: REFRESH_MS,
  });
  const data = summary.data;

  const sourceOptions = [...new Set([...(data?.sources.map((row) => row.source) ?? []), ...(filters.source ? [filters.source] : [])])].map((source) => ({
    value: source,
    label: sourceLabel(source),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Activity"
        subtitle="Where visitors come from and what they do on the store. Updates every 15 seconds. Nothing is counted from a browser signed in as an admin, so to test, stay signed in here and open the store in an Incognito window."
        actions={<FilterSelect label="Period" value={filters.range} onChange={(v) => setFilter("range", v)} options={RANGES} />}
      />

      {summary.isError && (
        <p className="text-sm text-red-600">
          Couldn&apos;t load the summary.{" "}
          <button type="button" onClick={() => summary.refetch()} className="font-semibold underline cursor-pointer">
            Try again
          </button>
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {!data ? (
          Array.from({ length: 4 }, (_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />)
        ) : (
          <>
            <Tile label="On the site now" value={data.live_now} sub="Active in the last 5 minutes" icon={Radio} href="/admin/activity?status=live" />
            <Tile label="Visitors" value={data.visitors} sub={`${data.visits} ${data.visits === 1 ? "visit" : "visits"}`} icon={Users} />
            <Tile label="Viewed a product" value={data.funnel[1]?.visits ?? 0} sub={`${percent(data.funnel[1]?.visits ?? 0, data.visits)} of visits`} icon={Eye} />
            <Tile
              label="Paid revenue"
              value={formatInr(data.revenue)}
              sub={`${data.paid_orders} of ${data.orders} ${data.orders === 1 ? "order" : "orders"} paid`}
              icon={IndianRupee}
              href="/admin/activity?status=ordered"
            />
          </>
        )}
      </div>

      {data && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <SourcesCard sources={data.sources} />
          <FunnelCard funnel={data.funnel} />
        </div>
      )}

      {data && <TopProductsCard products={data.top_products} />}

      <div>
        <h2 className="mb-3 font-serif text-lg font-semibold text-brand-forest">Visits</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          <SearchInput value={filters.search} onChange={(v) => setFilter("search", v)} placeholder="Customer, phone, campaign or order…" />
          <FilterSelect label="Source" value={filters.source} onChange={(v) => setFilter("source", v)} options={[{ value: "", label: "All sources" }, ...sourceOptions]} />
          <FilterSelect
            label="Visit type"
            value={filters.status}
            onChange={(v) => setFilter("status", v)}
            options={[
              { value: "", label: "All visits" },
              { value: "live", label: "On the site now" },
              { value: "ordered", label: "Placed an order" },
            ]}
          />
        </div>
        <div className={sessions.isPlaceholderData ? "opacity-60" : undefined}>
          <Table head={["Visitor", "Came from", "Last action", "Pages", "Order", "Device", "Last seen"]} minWidth={940}>
            <TableState
              isLoading={sessions.isLoading}
              isError={sessions.isError}
              isEmpty={sessions.data?.items.length === 0}
              columns={7}
              emptyText="No visits match. Open the store in a private window and they'll show up here."
              onRetry={() => sessions.refetch()}
            />
            {sessions.data?.items.map((visit) => (
              <tr key={visit.id} className="hover:bg-brand-sand/40">
                <td className="px-4 py-3">
                  <Link href={`/admin/activity/${visit.id}`} className="flex items-center gap-2 font-medium text-brand-forest hover:underline">
                    {visit.is_live && <span title="On the site now" className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />}
                    {visit.customer?.name ?? `Guest #${visit.id}`}
                  </Link>
                  {visit.customer && <p className="text-xs text-brand-ink/55">{visit.customer.phone}</p>}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-brand-ink">{sourceLabel(visit.source)}</p>
                  <p className="text-xs text-brand-ink/55">{[mediumLabel(visit.medium), visit.campaign].filter(Boolean).join(" · ")}</p>
                </td>
                <td className="max-w-64 truncate px-4 py-3 text-brand-ink/80" title={describeEvent(visit.last_event_type, visit.last_event_label)}>
                  {describeEvent(visit.last_event_type, visit.last_event_label)}
                </td>
                <td className="px-4 py-3 tabular-nums">{visit.page_views}</td>
                <td className="px-4 py-3">
                  {visit.orders.length === 0 ? (
                    <span className="text-brand-ink/40">—</span>
                  ) : (
                    <div className="flex flex-col items-start gap-1">
                      {visit.orders.map((order) => (
                        <Link key={order.order_number} href={`/admin/orders/${encodeURIComponent(order.order_number)}`} className="inline-flex items-center gap-1.5 text-xs text-brand-forest hover:underline">
                          {order.order_number} <StatusPill status={order.payment_status} />
                        </Link>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-brand-ink/70">
                  <p className="capitalize">{visit.device_type}</p>
                  <p className="text-brand-ink/55">{visit.browser}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-brand-ink/70">{formatDateTime(visit.last_seen_at)}</td>
              </tr>
            ))}
          </Table>
        </div>
        <Pagination pagination={sessions.data?.pagination} onPage={(p) => setFilter("page", p)} />
      </div>
    </div>
  );
}

export default function AdminActivityPage() {
  return (
    <Suspense fallback={null}>
      <ActivityPage />
    </Suspense>
  );
}
