"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useOrderTracking } from "@/hooks/useOrderTracking";
import { useAppSelector } from "@/lib/redux/hooks";
import { selectIsAuthenticated } from "@/lib/redux/slices/authSlice";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { LoginForm } from "@/components/auth/LoginForm";
import { AwbLookup } from "./AwbLookup";
import { ShipmentSummary } from "./ShipmentSummary";
import { TrackingTimeline } from "./TrackingTimeline";
import { ManifestList } from "./ManifestList";

export function TrackOrderClient() {
  const searchParams = useSearchParams();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [orderNumber, setOrderNumber] = useState(searchParams.get("order") ?? "");
  const { data: order, isLoading, isError, error } = useOrderTracking(orderNumber);

  return (
    <div className="border-t border-brand-sand-dark">
      <div className="border-b border-brand-sand-dark bg-brand-sand-dark/30 py-10">
        <Container>
          <SectionHeading eyebrow="Order Status" title="Track Your Order" />
        </Container>
      </div>

      <Container className="py-10">
        {!isAuthenticated ? (
          <div className="mx-auto max-w-sm rounded-2xl border border-brand-sand-dark bg-white p-6">
            <p className="mb-4 text-sm text-brand-ink/70">Sign in to look up your order status by order number.</p>
            <LoginForm title="Sign in to track your order" />
          </div>
        ) : (
          <>
            <AwbLookup initialAwb={orderNumber} onSearch={setOrderNumber} />

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
          </>
        )}
      </Container>
    </div>
  );
}
