"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CircleCheck, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchOrderDetail } from "@/lib/api/checkout";
import { queryKeys } from "@/lib/query/keys";
import { formatInr } from "@/lib/utils/format";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

/** Shown after Razorpay payment is verified. Reads the order back from the server rather than trusting the URL. */
export function OrderSuccessClient() {
  const orderNumber = useSearchParams().get("order") ?? "";
  const { isAuthenticated } = useAuth();

  const { data: order, isLoading, isError } = useQuery({
    queryKey: queryKeys.orderDetail(orderNumber),
    queryFn: () => fetchOrderDetail(orderNumber),
    enabled: isAuthenticated && Boolean(orderNumber),
  });

  if (!orderNumber || isError) {
    return (
      <Container className="py-20 text-center">
        <p className="text-brand-ink/70">We couldn&apos;t find that order.</p>
        <Button href="/" className="mt-4">
          Back to Home
        </Button>
      </Container>
    );
  }

  if (!order || isLoading) {
    return (
      <Container className="max-w-2xl py-16">
        <Skeleton className="mx-auto h-16 w-16 rounded-full" />
        <Skeleton className="mx-auto mt-6 h-8 w-64" />
        <Skeleton className="mt-10 h-48 w-full" />
      </Container>
    );
  }

  const isPaid = order.payment_status === "paid";
  const address = order.shipping_address;

  return (
    <Container className="max-w-2xl py-12 sm:py-16">
      <div className="flex flex-col items-center text-center">
        {isPaid ? (
          <CircleCheck size={64} className="text-green-700" strokeWidth={1.5} />
        ) : (
          <Clock size={64} className="text-brand-gold" strokeWidth={1.5} />
        )}
        <h1 className="mt-4 font-serif text-3xl font-bold text-brand-forest">
          {isPaid ? "Thank you! Your order is confirmed." : "Waiting for payment confirmation"}
        </h1>
        <p className="mt-2 text-brand-ink/70">
          Order <span className="font-semibold text-brand-ink">{order.order_number}</span>
          {isPaid ? " — we'll start packing it right away." : " — this usually takes a few seconds. Refresh to check again."}
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-brand-sand-dark bg-white p-5">
        <ul className="divide-y divide-brand-sand-dark text-sm">
          {order.items.map((item) => (
            <li key={`${item.product_name}-${item.variant_name}`} className="flex justify-between gap-3 py-2.5">
              <span className="text-brand-ink">
                {item.product_name} <span className="text-brand-ink/60">· {item.variant_name} × {item.quantity}</span>
              </span>
              <span className="font-medium text-brand-forest">{formatInr(item.total_price)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-brand-sand-dark pt-3 text-base font-semibold text-brand-ink">
          <span>{isPaid ? "Total Paid" : "Total"}</span>
          <span>{formatInr(order.total_amount)}</span>
        </div>

        <div className="mt-5 rounded-xl bg-brand-sand p-4 text-sm">
          <p className="font-semibold text-brand-forest">Delivering to</p>
          <p className="mt-1 text-brand-ink">{address.name}</p>
          <p className="text-brand-ink/70">
            {[address.address_line1, address.address_line2, address.landmark].filter(Boolean).join(", ")}, {address.city},{" "}
            {address.state} {address.pincode}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button href={`/track-order?order=${encodeURIComponent(order.order_number)}`}>Track Order</Button>
        <Button href="/orders" variant="outline">
          My Orders
        </Button>
        <Button href="/#products" variant="outline">
          Continue Shopping
        </Button>
      </div>
    </Container>
  );
}
