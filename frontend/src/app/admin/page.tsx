"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, IndianRupee, MessageSquareText, Package, ShoppingCart, Users } from "lucide-react";
import { getDashboard, ORDER_STATUSES } from "@/lib/api/admin";
import { formatInr } from "@/lib/utils/format";
import { Card, PageHeader, StatusPill, Table, TableState, formatDateTime, humanize } from "@/components/admin/ui";

function Tile({ label, value, sub, icon: Icon, href }: { label: string; value: string | number; sub?: string; icon: typeof Users; href?: string }) {
  const body = (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-brand-sand-dark bg-white p-5 transition-shadow hover:shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-ink/50">{label}</p>
        <p className="mt-2 font-serif text-2xl font-bold text-brand-forest">{value}</p>
        {sub && <p className="mt-1 text-xs text-brand-ink/60">{sub}</p>}
      </div>
      <span className="rounded-xl bg-brand-sand p-2.5 text-brand-forest">
        <Icon size={20} />
      </span>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default function AdminDashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["admin", "dashboard"], queryFn: getDashboard });

  const statusCounts = data
    ? ORDER_STATUSES.map((status) => ({ status, count: data[`${status}_orders` as keyof typeof data] as number }))
    : [];
  const maxCount = Math.max(1, ...statusCounts.map((s) => s.count));

  // Things that need someone to act on them today.
  const attention = data
    ? [
        { label: "Orders awaiting payment", count: data.awaiting_payment, href: "/admin/orders?order_status=pending&payment_status=pending" },
        { label: "Paid orders to pack", count: data.confirmed_orders, href: "/admin/orders?order_status=confirmed" },
        { label: "Low-stock variants", count: data.low_stock_variants, href: "/admin/inventory?low_stock=true" },
        { label: "Reviews to moderate", count: data.pending_reviews, href: "/admin/reviews" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Your store at a glance." />

      {isError && (
        <p className="text-sm text-red-600">
          Couldn&apos;t load the dashboard.{" "}
          <button type="button" onClick={() => refetch()} className="font-semibold underline cursor-pointer">
            Try again
          </button>
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !data ? (
          Array.from({ length: 4 }, (_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />)
        ) : (
          <>
            <Tile label="Revenue" value={formatInr(data.total_revenue)} sub={`${formatInr(data.revenue_last_30_days)} in the last 30 days`} icon={IndianRupee} />
            <Tile label="Orders" value={data.total_orders} sub={`${data.orders_today} today · ${data.paid_orders} paid`} icon={ShoppingCart} href="/admin/orders" />
            <Tile label="Customers" value={data.total_users} icon={Users} href="/admin/customers" />
            <Tile label="Live products" value={data.total_active_products} sub={`${data.total_categories} categories`} icon={Package} href="/admin/products" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Needs attention">
          <ul className="space-y-2">
            {attention.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between rounded-xl border border-brand-sand-dark px-3 py-2.5 text-sm hover:border-brand-forest"
                >
                  <span className="flex items-center gap-2 text-brand-ink/80">
                    {item.label === "Reviews to moderate" ? <MessageSquareText size={15} /> : <AlertTriangle size={15} className={item.count ? "text-amber-600" : "text-brand-ink/30"} />}
                    {item.label}
                  </span>
                  <span className={item.count ? "font-bold text-brand-forest" : "text-brand-ink/40"}>{item.count}</span>
                </Link>
              </li>
            ))}
            {!data && <li className="h-40 animate-pulse rounded-xl bg-brand-sand" />}
          </ul>
        </Card>

        <Card title="Orders by status" className="xl:col-span-2">
          <ul className="space-y-2.5">
            {statusCounts.map(({ status, count }) => (
              <li key={status} className="grid grid-cols-[110px_1fr_40px] items-center gap-3 text-sm">
                <Link href={`/admin/orders?order_status=${status}`} className="text-brand-ink/70 hover:text-brand-forest">
                  {humanize(status)}
                </Link>
                <span className="h-2.5 overflow-hidden rounded-full bg-brand-sand">
                  <span className="block h-full rounded-full bg-brand-forest" style={{ width: `${(count / maxCount) * 100}%` }} />
                </span>
                <span className="text-right font-semibold text-brand-ink">{count}</span>
              </li>
            ))}
            {!data && <li className="h-40 animate-pulse rounded-xl bg-brand-sand" />}
          </ul>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-brand-forest">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-brand-forest hover:underline">
            View all
          </Link>
        </div>
        <Table head={["Order", "Customer", "Total", "Status", "Payment", "Placed"]}>
          <TableState isLoading={isLoading} isError={isError} isEmpty={!!data && data.recent_orders.length === 0} columns={6} emptyText="No orders yet." />
          {data?.recent_orders.map((order) => (
            <tr key={order.order_number} className="hover:bg-brand-sand/40">
              <td className="px-4 py-3 font-medium">
                <Link href={`/admin/orders/${order.order_number}`} className="text-brand-forest hover:underline">
                  {order.order_number}
                </Link>
              </td>
              <td className="px-4 py-3">{order.customer_name}</td>
              <td className="px-4 py-3 font-medium">{formatInr(order.total_amount)}</td>
              <td className="px-4 py-3">
                <StatusPill status={order.order_status} />
              </td>
              <td className="px-4 py-3">
                <StatusPill status={order.payment_status} />
              </td>
              <td className="px-4 py-3 text-brand-ink/60">{formatDateTime(order.created_at)}</td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  );
}
