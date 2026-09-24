"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Check, PackageSearch } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getToken } from "@/lib/auth/token";
import { fetchMyOrders, type MyOrder } from "@/lib/api/orders";
import { queryKeys } from "@/lib/query/keys";
import { formatInr } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductImagePlaceholder } from "@/components/ui/ProductImagePlaceholder";

const PAGE_SIZE = 10;
const PLACEHOLDER_GRADIENT: [string, string] = ["#8a6a4f", "#d4a373"];
const MAX_THUMBNAILS = 4;

/** Delivery journey shown as a progress line once an order is paid. */
const STEPS = [
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
] as const;

type Tone = "gold" | "forest" | "danger" | "neutral";

/** What the customer should read for an order — combines order_status and payment_status. */
function describeStatus(order: MyOrder): { label: string; tone: Tone; hint: string } {
  if (order.order_status === "cancelled") {
    return {
      label: "Cancelled",
      tone: "danger",
      hint: order.payment_status === "paid" ? "Your refund will be processed to the original payment method." : "This order was cancelled.",
    };
  }
  if (order.payment_status !== "paid") {
    return { label: "Awaiting payment", tone: "gold", hint: "Your items are reserved — complete payment to confirm the order." };
  }
  switch (order.order_status) {
    case "delivered":
      return { label: "Delivered", tone: "forest", hint: "Delivered. Enjoy!" };
    case "shipped":
      return { label: "Shipped", tone: "forest", hint: "On its way to you." };
    case "processing":
      return { label: "Processing", tone: "neutral", hint: "We're packing your order." };
    default:
      return { label: "Confirmed", tone: "neutral", hint: "Payment received — we'll start packing soon." };
  }
}

function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** The logged-in customer's orders, newest first, with status and next action. */
export function MyOrdersClient() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const isCustomer = isAuthenticated && user?.role === "user";

  // The session is restored from storage after the first render — check storage before redirecting.
  useEffect(() => {
    if (!isAuthenticated && !getToken()) {
      router.replace(`/login?next=${encodeURIComponent("/orders")}`);
    }
  }, [isAuthenticated, router]);

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: queryKeys.orders.mine(user?.id),
    queryFn: ({ pageParam }) => fetchMyOrders(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const meta = lastPage.pagination;
      return meta && meta.current_page < meta.total_pages ? meta.current_page + 1 : undefined;
    },
    enabled: isCustomer,
  });

  const orders = data?.pages.flatMap((page) => page.orders) ?? [];
  const total = data?.pages[0]?.pagination?.total ?? 0;

  return (
    <Container className="py-10">
      <SectionHeading
        eyebrow="Your Account"
        title="My Orders"
        subtitle={data && total > 0 ? `${total} order${total === 1 ? "" : "s"} placed` : undefined}
      />

      {isAuthenticated && !isCustomer && (
        <p className="mt-8 text-brand-ink/70">Orders are available for customer accounts only.</p>
      )}

      {(!isAuthenticated || (isCustomer && isLoading)) && (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="mt-8 flex flex-col items-start gap-3">
          <p className="text-sm text-red-600">We couldn&apos;t load your orders.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      )}

      {data && orders.length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-brand-sand-dark py-20 text-center">
          <PackageSearch size={40} className="text-brand-ink/30" />
          <p className="text-brand-ink/70">You haven&apos;t placed any orders yet.</p>
          <Button href="/#products">Start Shopping</Button>
        </div>
      )}

      {orders.length > 0 && (
        <ul className="mt-8 space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </ul>
      )}

      {hasNextPage && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
            {isFetchingNextPage ? "Loading…" : "Load More Orders"}
          </Button>
        </div>
      )}
    </Container>
  );
}

function OrderCard({ order }: { order: MyOrder }) {
  const status = describeStatus(order);
  const needsPayment = order.order_status === "pending" && order.payment_status !== "paid";
  const showProgress = order.payment_status === "paid" && order.order_status !== "cancelled";
  const currentStep = STEPS.findIndex((step) => step.key === order.order_status);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const extraItems = order.items.length - MAX_THUMBNAILS;

  return (
    <li className="rounded-2xl border border-brand-sand-dark bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-serif text-lg font-semibold text-brand-forest">{order.order_number}</p>
          <p className="text-xs text-brand-ink/60">
            Placed on {formatOrderDate(order.created_at)} · {itemCount} item{itemCount === 1 ? "" : "s"}
          </p>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {order.items.slice(0, MAX_THUMBNAILS).map((item) => (
          <ProductImagePlaceholder
            key={`${item.product_name}-${item.variant_name}`}
            src={item.image_url ?? undefined}
            alt={item.product_name}
            gradient={PLACEHOLDER_GRADIENT}
            iconSize={16}
            sizes="56px"
            className="h-14 w-14 shrink-0 rounded-lg border border-brand-sand-dark"
          />
        ))}
        {extraItems > 0 && (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-brand-sand text-xs font-semibold text-brand-ink/70">
            +{extraItems}
          </span>
        )}
        <p className="ml-2 line-clamp-2 min-w-0 flex-1 text-sm text-brand-ink/70">
          {order.items.map((item) => `${item.product_name} (${item.variant_name}) × ${item.quantity}`).join(", ")}
        </p>
      </div>

      {showProgress && (
        <ol className="mt-5 grid grid-cols-4 gap-1" aria-label="Order progress">
          {STEPS.map((step, index) => {
            const done = index <= currentStep;
            return (
              <li key={step.key} className="flex flex-col gap-1.5">
                <span className={cn("h-1.5 rounded-full", done ? "bg-brand-forest" : "bg-brand-sand-dark")} />
                <span className={cn("flex items-center gap-1 text-[11px]", done ? "font-semibold text-brand-forest" : "text-brand-ink/40")}>
                  {done && <Check size={11} />}
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-brand-sand-dark pt-4">
        <div>
          <p className="text-sm text-brand-ink/60">{status.hint}</p>
          <p className="mt-0.5 text-base font-semibold text-brand-ink">
            {formatInr(order.total_amount)}
            {order.payment_status === "paid" && <span className="ml-2 text-xs font-medium text-green-700">Paid</span>}
          </p>
        </div>
        <div className="flex gap-2">
          {needsPayment && (
            <Button href={`/checkout?order=${encodeURIComponent(order.order_number)}`} size="sm">
              Pay Now
            </Button>
          )}
          <Button href={`/track-order?order=${encodeURIComponent(order.order_number)}`} variant="outline" size="sm">
            Track Order
          </Button>
        </div>
      </div>
    </li>
  );
}
