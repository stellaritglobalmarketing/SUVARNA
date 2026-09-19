import { AlertTriangle, CheckCircle2, RotateCcw, Truck } from "lucide-react";
import type { OrderTracking } from "@/types/order";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils/format";

const DIAGNOSTIC_META = {
  "on-track": { label: "On Track", tone: "forest" as const, icon: CheckCircle2 },
  delayed: { label: "Delayed", tone: "walnut" as const, icon: AlertTriangle },
  "delivery-attempt-failed": { label: "Delivery Attempt Failed", tone: "danger" as const, icon: AlertTriangle },
  rto: { label: "Return to Origin", tone: "danger" as const, icon: RotateCcw },
};

export function ShipmentSummary({ order }: { order: OrderTracking }) {
  const diagnostic = DIAGNOSTIC_META[order.diagnostic];
  const Icon = diagnostic.icon;

  return (
    <div className="rounded-2xl border border-brand-sand-dark bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Truck size={20} className="text-brand-forest" />
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-ink/50">AWB Number</p>
            <p className="font-mono text-sm font-semibold text-brand-ink">{order.awb}</p>
          </div>
        </div>
        <Badge tone={diagnostic.tone} className="flex items-center gap-1">
          <Icon size={12} /> {diagnostic.label}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-brand-sand-dark pt-4 text-sm sm:grid-cols-4">
        <SummaryField label="Order ID" value={order.orderId} />
        <SummaryField label="Courier Partner" value={order.courierPartner} />
        <SummaryField label="Placed On" value={formatDate(order.placedOn)} />
        <SummaryField label="Expected Delivery" value={formatDate(order.expectedDelivery)} />
      </div>

      <div className="mt-4 border-t border-brand-sand-dark pt-4 text-sm">
        <p className="text-xs uppercase tracking-wide text-brand-ink/50">Delivering To</p>
        <p className="mt-1 font-medium text-brand-ink">{order.destination.name}</p>
        <p className="text-brand-ink/70">
          {order.destination.addressLine}, {order.destination.city}, {order.destination.state} -{" "}
          {order.destination.pincode}
        </p>
      </div>
    </div>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-brand-ink/50">{label}</p>
      <p className="mt-0.5 font-medium text-brand-ink">{value}</p>
    </div>
  );
}
