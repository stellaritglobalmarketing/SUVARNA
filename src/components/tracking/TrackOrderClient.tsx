"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useOrderTracking } from "@/hooks/useOrderTracking";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { AwbLookup } from "./AwbLookup";
import { ShipmentSummary } from "./ShipmentSummary";
import { TrackingTimeline } from "./TrackingTimeline";
import { ManifestList } from "./ManifestList";

const DEFAULT_AWB = "BLD-9038472911";

export function TrackOrderClient() {
  const searchParams = useSearchParams();
  const [awb, setAwb] = useState(searchParams.get("awb") ?? DEFAULT_AWB);
  const { data: order, isLoading, isError, error } = useOrderTracking(awb);

  return (
    <div className="border-t border-brand-sand-dark">
      <div className="border-b border-brand-sand-dark bg-brand-sand-dark/30 py-10">
        <Container>
          <SectionHeading eyebrow="Logistics" title="Order Tracking & Shipment Status" />
        </Container>
      </div>

      <Container className="py-10">
        <AwbLookup initialAwb={awb} onSearch={setAwb} />

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {isLoading && <Skeleton className="h-40 w-full" />}
            {isError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                {error instanceof Error ? error.message : "No shipment found for this AWB."}
              </div>
            )}
            {order && <ShipmentSummary order={order} />}
            {order && (
              <div className="rounded-2xl border border-brand-sand-dark bg-white p-5">
                <h3 className="font-serif text-lg font-semibold text-brand-forest">Shipment Journey</h3>
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
      </Container>
    </div>
  );
}
