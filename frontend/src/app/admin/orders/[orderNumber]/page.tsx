"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import {
  FULFILLMENT_STATUSES,
  ORDER_TRANSITIONS,
  PAYMENT_STATUSES,
  SHIPMENT_STATUSES,
  createShipment,
  getOrder,
  updateOrderStatus,
  updateShipmentStatus,
  type ShipmentInput,
} from "@/lib/api/admin";
import { formatInr } from "@/lib/utils/format";
import {
  AdminButton,
  Card,
  Field,
  PageHeader,
  StatusPill,
  confirmAction,
  formatDateTime,
  humanize,
  inputClass,
  useAdminMutation,
} from "@/components/admin/ui";
import { ProductImagePlaceholder } from "@/components/ui/ProductImagePlaceholder";

const PLACEHOLDER_GRADIENT: [string, string] = ["#8a6a4f", "#d4a373"];
const EMPTY_SHIPMENT: ShipmentInput = { provider: "", courier_name: "", awb_number: "", tracking_url: "", shipping_charge: "" };

export default function AdminOrderDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const queryKey = ["admin", "order", orderNumber];
  const { data: order, isLoading, isError } = useQuery({ queryKey, queryFn: () => getOrder(orderNumber) });

  const refresh = { invalidate: [queryKey, ["admin", "orders"], ["admin", "dashboard"], ["admin", "shipments"]] };
  const statusMutation = useAdminMutation(
    (body: Parameters<typeof updateOrderStatus>[1]) => updateOrderStatus(orderNumber, body),
    { success: "Order updated", ...refresh },
  );
  const shipmentStatusMutation = useAdminMutation(
    ({ id, status }: { id: number; status: string }) => updateShipmentStatus(id, status),
    { success: "Shipment updated", ...refresh },
  );
  const [shipment, setShipment] = useState<ShipmentInput>(EMPTY_SHIPMENT);
  const [isAddingShipment, setAddingShipment] = useState(false);
  const addShipmentMutation = useAdminMutation((body: ShipmentInput) => createShipment(orderNumber, body), {
    success: "Shipment added",
    ...refresh,
    onSuccess: () => {
      setShipment(EMPTY_SHIPMENT);
      setAddingShipment(false);
    },
  });

  if (isLoading) return <div className="h-96 animate-pulse rounded-2xl bg-white" />;
  if (isError || !order) {
    return (
      <p className="text-sm text-red-600">
        Order not found. <Link href="/admin/orders" className="underline">Back to orders</Link>
      </p>
    );
  }

  const nextStatuses = ORDER_TRANSITIONS[order.order_status] ?? [];
  const address = order.shipping_address;

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-brand-ink/60 hover:text-brand-forest">
        <ArrowLeft size={14} /> Orders
      </Link>
      <PageHeader
        title={order.order_number}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            Placed {formatDateTime(order.created_at)}
            <StatusPill status={order.order_status} />
            <StatusPill status={order.payment_status} label={`Payment: ${humanize(order.payment_status)}`} />
            <StatusPill status={order.fulfillment_status} />
          </span>
        }
      />

      {order.order_status === "cancelled" && order.payment_status === "paid" && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This order was cancelled after it was paid. Refund the payment from the Razorpay dashboard, then set payment to &ldquo;Refunded&rdquo;.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title={`Items (${order.items.length})`}>
            <ul className="divide-y divide-brand-sand-dark">
              {order.items.map((item) => (
                <li key={`${item.sku}-${item.variant_name}`} className="flex items-center gap-3 py-3 text-sm">
                  <ProductImagePlaceholder
                    src={item.image_url ?? undefined}
                    alt={item.product_name}
                    gradient={PLACEHOLDER_GRADIENT}
                    iconSize={16}
                    sizes="48px"
                    className="h-12 w-12 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-brand-ink">{item.product_name}</p>
                    <p className="text-xs text-brand-ink/60">
                      {item.variant_name} · SKU {item.sku}
                    </p>
                  </div>
                  <span className="text-brand-ink/70">
                    {formatInr(item.unit_price)} × {item.quantity}
                  </span>
                  <span className="w-24 text-right font-semibold">{formatInr(item.total_price)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-brand-sand-dark pt-4 text-sm">
              {[
                ["Subtotal", order.subtotal],
                ["Discount", -order.discount_amount],
                ["Shipping", order.shipping_amount],
                ["Tax", order.tax_amount],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between text-brand-ink/70">
                  <dt>{label}</dt>
                  <dd>{formatInr(value as number)}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t border-brand-sand-dark pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatInr(order.total_amount)}</dd>
              </div>
            </dl>
            {order.notes && (
              <p className="mt-4 rounded-xl bg-brand-sand px-4 py-3 text-sm">
                <span className="font-semibold text-brand-forest">Customer note: </span>
                {order.notes}
              </p>
            )}
          </Card>

          <Card
            title={`Shipments (${order.shipments.length})`}
            actions={
              !isAddingShipment &&
              order.order_status !== "cancelled" && (
                <AdminButton variant="outline" size="sm" onClick={() => setAddingShipment(true)}>
                  Add shipment
                </AdminButton>
              )
            }
          >
            {order.shipments.length === 0 && !isAddingShipment && (
              <p className="text-sm text-brand-ink/60">No shipment yet. Book the courier, then add the AWB here.</p>
            )}
            <ul className="space-y-3">
              {order.shipments.map((sh) => (
                <li key={sh.id} className="rounded-xl border border-brand-sand-dark p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">
                      {sh.provider}
                      {sh.courier_name ? ` · ${sh.courier_name}` : ""}
                      {sh.awb_number && <span className="ml-2 text-brand-ink/60">AWB {sh.awb_number}</span>}
                    </p>
                    <select
                      value={sh.shipment_status}
                      onChange={(e) => shipmentStatusMutation.mutate({ id: sh.id, status: e.target.value })}
                      disabled={shipmentStatusMutation.isPending}
                      aria-label="Shipment status"
                      className={`${inputClass} w-auto py-1 text-xs`}
                    >
                      {SHIPMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {humanize(s)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1 text-xs text-brand-ink/60">
                    Created {formatDateTime(sh.created_at)}
                    {sh.shipped_at && ` · Shipped ${formatDateTime(sh.shipped_at)}`}
                    {sh.delivered_at && ` · Delivered ${formatDateTime(sh.delivered_at)}`}
                    {sh.shipping_charge > 0 && ` · Charge ${formatInr(sh.shipping_charge)}`}
                  </p>
                  {sh.tracking_url && (
                    <a href={sh.tracking_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-brand-forest underline">
                      Tracking link <ExternalLink size={11} />
                    </a>
                  )}
                </li>
              ))}
            </ul>

            {isAddingShipment && (
              <form
                className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-brand-sand/60 p-4 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  addShipmentMutation.mutate(shipment);
                }}
              >
                <Field label="Provider *" hint="e.g. Shiprocket, Delhivery, DTDC">
                  <input required maxLength={32} value={shipment.provider} onChange={(e) => setShipment({ ...shipment, provider: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Courier">
                  <input maxLength={64} value={shipment.courier_name} onChange={(e) => setShipment({ ...shipment, courier_name: e.target.value })} className={inputClass} />
                </Field>
                <Field label="AWB number">
                  <input maxLength={64} value={shipment.awb_number} onChange={(e) => setShipment({ ...shipment, awb_number: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Shipping charge (₹)">
                  <input type="number" min={0} step="0.01" value={shipment.shipping_charge} onChange={(e) => setShipment({ ...shipment, shipping_charge: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Tracking URL" className="sm:col-span-2">
                  <input type="url" maxLength={512} value={shipment.tracking_url} onChange={(e) => setShipment({ ...shipment, tracking_url: e.target.value })} className={inputClass} />
                </Field>
                <div className="flex gap-2 sm:col-span-2">
                  <AdminButton type="submit" loading={addShipmentMutation.isPending}>
                    Save shipment
                  </AdminButton>
                  <AdminButton variant="ghost" onClick={() => setAddingShipment(false)}>
                    Cancel
                  </AdminButton>
                </div>
              </form>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Update status">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-ink/50">Order</p>
            {nextStatuses.length === 0 ? (
              <p className="mt-1 text-sm text-brand-ink/60">This order is {order.order_status} — no further changes.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {nextStatuses.map((status) => (
                  <AdminButton
                    key={status}
                    size="sm"
                    variant={status === "cancelled" ? "danger" : "primary"}
                    loading={statusMutation.isPending && statusMutation.variables?.order_status === status}
                    disabled={statusMutation.isPending}
                    onClick={() => {
                      const warning =
                        status === "cancelled"
                          ? `Cancel ${order.order_number}? Its reserved stock is released.${order.payment_status === "paid" ? " It is PAID — you'll need to refund it in Razorpay." : ""}`
                          : `Mark ${order.order_number} as ${humanize(status)}?`;
                      if (confirmAction(warning)) statusMutation.mutate({ order_status: status });
                    }}
                  >
                    Mark {humanize(status)}
                  </AdminButton>
                ))}
              </div>
            )}
            {order.payment_status !== "paid" && nextStatuses.includes("confirmed") && (
              <p className="mt-2 text-xs text-amber-700">Not paid yet — confirm only if you&apos;ve received payment another way.</p>
            )}

            <div className="mt-5 grid grid-cols-1 gap-3">
              <Field label="Payment status">
                <select
                  value={order.payment_status}
                  disabled={statusMutation.isPending}
                  onChange={(e) => {
                    if (confirmAction(`Set payment to ${humanize(e.target.value)}?`)) statusMutation.mutate({ payment_status: e.target.value });
                  }}
                  className={inputClass}
                >
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {humanize(s)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fulfillment">
                <select
                  value={order.fulfillment_status}
                  disabled={statusMutation.isPending}
                  onChange={(e) => statusMutation.mutate({ fulfillment_status: e.target.value })}
                  className={inputClass}
                >
                  {FULFILLMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {humanize(s)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Card>

          <Card title="Customer">
            <Link href={`/admin/customers/${order.customer.id}`} className="font-medium text-brand-forest hover:underline">
              {order.customer.name}
            </Link>
            <p className="text-sm text-brand-ink/70">{order.customer.phone}</p>
            {order.customer.email && <p className="text-sm text-brand-ink/70">{order.customer.email}</p>}
          </Card>

          <Card title="Ship to">
            <div className="text-sm text-brand-ink/80">
              <p className="font-medium text-brand-ink">{address.name}</p>
              <p>{address.address_line1}</p>
              {address.address_line2 && <p>{address.address_line2}</p>}
              {address.landmark && <p>Near {address.landmark}</p>}
              <p>
                {address.city}, {address.state} {address.pincode}
              </p>
              <p>{address.country}</p>
              <p className="mt-1">Phone: {address.phone}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
