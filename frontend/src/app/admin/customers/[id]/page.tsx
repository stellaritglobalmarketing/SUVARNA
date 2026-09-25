"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { getCustomer, setCustomerStatus } from "@/lib/api/admin";
import { formatInr } from "@/lib/utils/format";
import { ActivePill, AdminButton, Card, PageHeader, StatusPill, Table, confirmAction, formatDate, formatDateTime, useAdminMutation } from "@/components/admin/ui";

export default function AdminCustomerPage() {
  const { id } = useParams<{ id: string }>();
  const customerId = Number(id);
  const queryKey = ["admin", "customer", customerId];
  const { data: customer, isLoading, isError } = useQuery({ queryKey, queryFn: () => getCustomer(customerId), enabled: Number.isInteger(customerId) });

  const toggle = useAdminMutation((active: boolean) => setCustomerStatus(customerId, active), {
    success: "Customer updated",
    invalidate: [queryKey, ["admin", "customers"]],
  });

  if (isLoading) return <div className="h-72 animate-pulse rounded-2xl bg-white" />;
  if (isError || !customer) {
    return (
      <p className="text-sm text-red-600">
        Customer not found. <Link href="/admin/customers" className="underline">Back to customers</Link>
      </p>
    );
  }

  const paidOrders = customer.orders.filter((o) => o.payment_status === "paid" && o.order_status !== "cancelled");
  const spent = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div className="space-y-6">
      <Link href="/admin/customers" className="inline-flex items-center gap-1 text-sm text-brand-ink/60 hover:text-brand-forest">
        <ArrowLeft size={14} /> Customers
      </Link>
      <PageHeader
        title={customer.name}
        subtitle={
          <span className="flex items-center gap-2">
            <ActivePill active={customer.is_active} /> Joined {formatDate(customer.created_at)}
          </span>
        }
        actions={
          <AdminButton
            variant={customer.is_active ? "danger" : "primary"}
            loading={toggle.isPending}
            onClick={() =>
              (customer.is_active
                ? confirmAction(`Deactivate ${customer.name}? They're signed out immediately and can't log in until reactivated.`)
                : true) && toggle.mutate(!customer.is_active)
            }
          >
            {customer.is_active ? "Deactivate account" : "Reactivate account"}
          </AdminButton>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card title="Contact">
          <p className="text-sm">{customer.phone}</p>
          <p className="text-sm text-brand-ink/70">{customer.email ?? "No email"}</p>
        </Card>
        <Card title="Orders">
          <p className="font-serif text-2xl font-bold text-brand-forest">{customer.orders.length}</p>
          <p className="text-xs text-brand-ink/60">{paidOrders.length} paid</p>
        </Card>
        <Card title="Total spent">
          <p className="font-serif text-2xl font-bold text-brand-forest">{formatInr(spent)}</p>
          <p className="text-xs text-brand-ink/60">Paid, not cancelled</p>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 font-serif text-lg font-semibold text-brand-forest">Recent orders</h2>
        <Table head={["Order", "Total", "Status", "Payment", "Fulfillment", "Placed"]}>
          {customer.orders.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-sm text-brand-ink/60">
                No orders yet.
              </td>
            </tr>
          )}
          {customer.orders.map((o) => (
            <tr key={o.order_number}>
              <td className="px-4 py-3">
                <Link href={`/admin/orders/${o.order_number}`} className="font-medium text-brand-forest hover:underline">
                  {o.order_number}
                </Link>
              </td>
              <td className="px-4 py-3">{formatInr(o.total_amount)}</td>
              <td className="px-4 py-3">
                <StatusPill status={o.order_status} />
              </td>
              <td className="px-4 py-3">
                <StatusPill status={o.payment_status} />
              </td>
              <td className="px-4 py-3">
                <StatusPill status={o.fulfillment_status} />
              </td>
              <td className="px-4 py-3 text-brand-ink/60">{formatDateTime(o.created_at)}</td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  );
}
