"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useGuestToken, useIsClient } from "@/hooks/useBrowserStorage";
import { useOrderTracking } from "@/hooks/useOrderTracking";
import { trackOrderByPhone } from "@/lib/api/orders";
import { useAppSelector } from "@/lib/redux/hooks";
import { selectIsAuthenticated } from "@/lib/redux/slices/authSlice";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { LoginForm } from "@/components/auth/LoginForm";
import { AwbLookup } from "./AwbLookup";
import { GuestOrderLookup } from "./GuestOrderLookup";
import { ShipmentSummary } from "./ShipmentSummary";
import { TrackingTimeline } from "./TrackingTimeline";
import { ManifestList } from "./ManifestList";

export function TrackOrderClient() {
  const searchParams = useSearchParams();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [orderNumber, setOrderNumber] = useState(searchParams.get("order") ?? "");
  const hasGuestToken = Boolean(useGuestToken(orderNumber));
  // This page can hydrate after the session is restored, and the first render has to match the server's HTML.
  const isClient = useIsClient();
  const canSeeOrder = isClient && (isAuthenticated || hasGuestToken);
  const ownOrder = useOrderTracking(orderNumber);
  const phoneLookup = useMutation({
    mutationFn: ({ order, phone }: { order: string; phone: string }) => trackOrderByPhone(order, phone),
  });

  const { data: order, isLoading, isError, error } = canSeeOrder
    ? ownOrder
    : { data: phoneLookup.data, isLoading: phoneLookup.isPending, isError: phoneLookup.isError, error: phoneLookup.error };

  return (
    <div className="border-t border-brand-sand-dark">
      <div className="border-b border-brand-sand-dark bg-brand-sand-dark/30 py-10">
        <Container>
          <SectionHeading eyebrow="Order Status" title="Track Your Order" />
        </Container>
      </div>

      <Container className="py-10">
        {canSeeOrder ? (
          <AwbLookup initialAwb={orderNumber} onSearch={setOrderNumber} />
        ) : (
          <GuestOrderLookup initialOrder={orderNumber} isSearching={phoneLookup.isPending} onSearch={(value, phone) => phoneLookup.mutate({ order: value, phone })} />
        )}

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {isLoading && <Skeleton className="h-40 w-full" />}
            {isError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                {error instanceof Error ? error.message : "No order found for this order number."}
              </div>
            )}
            {order && <ShipmentSummary order={order} />}
            {order && (
              <div className="rounded-2xl border border-brand-sand-dark bg-white p-5">
                <h3 className="font-serif text-lg font-semibold text-brand-forest">Order Journey</h3>
                <div className="mt-4">
                  <TrackingTimeline stages={order.stages} />
                </div>
              </div>
            )}
          </div>

          <div>
            {isLoading && <Skeleton className="h-40 w-full" />}
            {order && <ManifestList manifest={order.manifest} />}
          </div>
        </div>

        {!canSeeOrder && !order && (
          <details className="mx-auto mt-4 max-w-sm rounded-2xl border border-brand-sand-dark bg-white p-5">
            <summary className="cursor-pointer text-sm font-medium text-brand-forest">Have an account? Sign in instead</summary>
            <div className="mt-4">
              <LoginForm title="Sign in to track your order" />
            </div>
          </details>
        )}
      </Container>
    </div>
  );
}
