"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, FileText, RefreshCw, Truck } from "lucide-react";
import {
  cancelEkartShipment,
  createEkartShipment,
  generateManifest,
  getEkartQuote,
  openShipmentLabel,
  shipmentNdrAction,
  syncShipment,
  type AdminShipment,
  type EkartPackage,
} from "@/lib/api/admin";
import { formatInr } from "@/lib/utils/format";
import { AdminButton, Field, confirmAction, errorText, formatDate, formatDateTime, inputClass, useAdminMutation } from "@/components/admin/ui";
import { useAppDispatch } from "@/lib/redux/hooks";
import { pushToast } from "@/lib/redux/slices/uiSlice";

type Refresh = { invalidate: unknown[][] };

const PACKAGE_FIELDS: { key: keyof EkartPackage; label: string; hint?: string }[] = [
  { key: "weight_g", label: "Weight (g)", hint: "Box with packing" },
  { key: "length_cm", label: "Length (cm)" },
  { key: "width_cm", label: "Width (cm)" },
  { key: "height_cm", label: "Height (cm)" },
];

function hasError<T extends object>(value: T | { error: string } | null | undefined): value is { error: string } {
  return !!value && "error" in value;
}

/** Books an order's parcel with Ekart: suggested box + weight, delivery check and Ekart's rate, then "Book". */
export function EkartBookingForm({ orderNumber, refresh, onDone }: { orderNumber: string; refresh: Refresh; onDone: () => void }) {
  const [draft, setDraft] = useState<Record<keyof EkartPackage, string> | null>(null);
  const [quotedPkg, setQuotedPkg] = useState<EkartPackage | undefined>(undefined);
  const [dispatchDate, setDispatchDate] = useState("");

  const quote = useQuery({
    queryKey: ["admin", "ekart-quote", orderNumber, quotedPkg],
    queryFn: () => getEkartQuote(orderNumber, quotedPkg),
  });

  const book = useAdminMutation(
    (pkg: EkartPackage) => createEkartShipment(orderNumber, { ...pkg, preferred_dispatch_date: dispatchDate || undefined }),
    { success: "Shipment booked with Ekart", ...refresh, onSuccess: onDone },
  );

  const suggested = quote.data?.package;
  const values: Record<keyof EkartPackage, string> =
    draft ??
    (suggested
      ? { weight_g: String(suggested.weight_g), length_cm: String(suggested.length_cm), width_cm: String(suggested.width_cm), height_cm: String(suggested.height_cm) }
      : { weight_g: "", length_cm: "", width_cm: "", height_cm: "" });
  const pkg: EkartPackage = {
    weight_g: Math.round(Number(values.weight_g)),
    length_cm: Math.round(Number(values.length_cm)),
    width_cm: Math.round(Number(values.width_cm)),
    height_cm: Math.round(Number(values.height_cm)),
  };
  const pkgValid = Object.values(pkg).every((n) => Number.isFinite(n) && n > 0);
  const volumetricKg = pkgValid ? (pkg.length_cm * pkg.width_cm * pkg.height_cm) / 5000 : 0;

  const serviceability = quote.data?.serviceability;
  const estimate = quote.data?.estimate;
  const notServiceable = serviceability && !hasError(serviceability) && !serviceability.serviceable;

  if (quote.data && !quote.data.configured) {
    return (
      <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Ekart isn&apos;t set up yet. Add the <code>EKART_*</code> credentials to the backend <code>.env</code> and restart the server.
      </p>
    );
  }

  return (
    <form
      className="mt-4 space-y-4 rounded-xl bg-brand-sand/60 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (pkgValid && confirmAction(`Book ${orderNumber} with Ekart (${pkg.weight_g} g, ${pkg.length_cm}×${pkg.width_cm}×${pkg.height_cm} cm)?`)) {
          book.mutate(pkg);
        }
      }}
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-brand-forest">
        <Truck size={16} /> Ship with Ekart
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PACKAGE_FIELDS.map(({ key, label, hint }) => (
          <Field key={key} label={label} hint={hint}>
            <input
              type="number"
              min={1}
              step={1}
              required
              value={values[key]}
              onChange={(e) => setDraft({ ...values, [key]: e.target.value })}
              className={inputClass}
            />
          </Field>
        ))}
      </div>
      {pkgValid && (
        <p className="text-xs text-brand-ink/60">
          Volumetric weight {volumetricKg.toFixed(2)} kg · Ekart bills the higher of this and the actual {(pkg.weight_g / 1000).toFixed(2)} kg.
        </p>
      )}

      <div className="rounded-lg bg-white px-3 py-2.5 text-sm">
        {quote.isLoading || quote.isFetching ? (
          <p className="text-brand-ink/60">Checking delivery and rate…</p>
        ) : quote.isError ? (
          <p className="text-red-600">{errorText(quote.error)}</p>
        ) : (
          <div className="space-y-1">
            {hasError(serviceability) ? (
              <p className="text-amber-700">Couldn&apos;t check delivery: {serviceability.error}</p>
            ) : serviceability ? (
              <p className={serviceability.serviceable ? "text-emerald-700" : "text-red-600"}>
                {serviceability.serviceable
                  ? `Ekart delivers here${serviceability.city ? ` (${serviceability.city})` : ""}${
                      serviceability.estimated_days ? ` · ${serviceability.estimated_days[0]}–${serviceability.estimated_days[1]} days` : ""
                    }`
                  : "Ekart doesn't deliver to this pincode."}
              </p>
            ) : null}
            {hasError(estimate) ? (
              <p className="text-amber-700">Couldn&apos;t get Ekart&apos;s rate: {estimate.error}</p>
            ) : estimate?.total != null ? (
              <p className="text-brand-ink/80">
                Ekart charge ≈ <span className="font-semibold">{formatInr(estimate.total)}</span>
                {estimate.billing_weight && ` · billed on ${estimate.billing_weight}`}
                {estimate.zone && ` · zone ${estimate.zone}`}
              </p>
            ) : (
              <p className="text-brand-ink/50">Set EKART_PICKUP_PINCODE to see Ekart&apos;s rate here.</p>
            )}
          </div>
        )}
      </div>

      <Field label="Pickup date (optional)" hint="Leave empty to hand it over on the next pickup." className="max-w-xs">
        <input type="date" value={dispatchDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDispatchDate(e.target.value)} className={inputClass} />
      </Field>

      <div className="flex flex-wrap gap-2">
        <AdminButton type="submit" loading={book.isPending} disabled={!pkgValid || !!notServiceable}>
          Book with Ekart
        </AdminButton>
        <AdminButton variant="outline" disabled={!pkgValid || quote.isFetching} onClick={() => setQuotedPkg(pkg)}>
          Re-check rate
        </AdminButton>
        <AdminButton variant="ghost" onClick={onDone}>
          Cancel
        </AdminButton>
      </div>
    </form>
  );
}

function tomorrow(): string {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

/** Courier details and actions for one Ekart shipment: label, manifest, sync, cancel, failed-delivery handling. */
export function EkartShipmentActions({ shipment, refresh }: { shipment: AdminShipment; refresh: Refresh }) {
  const dispatch = useAppDispatch();
  const [reattemptDate, setReattemptDate] = useState(tomorrow());
  const [labelLoading, setLabelLoading] = useState(false);

  const sync = useAdminMutation(() => syncShipment(shipment.id), { success: "Tracking updated", ...refresh });
  const cancel = useAdminMutation(() => cancelEkartShipment(shipment.id), { success: "Shipment cancelled", ...refresh });
  const manifest = useAdminMutation(() => generateManifest([shipment.id]), {
    success: "Manifest generated",
    ...refresh,
    onSuccess: (result) => {
      if (result.manifest_url) window.open(result.manifest_url, "_blank", "noopener");
    },
  });
  const ndr = useAdminMutation((body: Parameters<typeof shipmentNdrAction>[1]) => shipmentNdrAction(shipment.id, body), {
    success: "Sent to Ekart",
    ...refresh,
  });

  const canCancel = ["created", "pickup_scheduled"].includes(shipment.shipment_status);
  const isOpen = !["delivered", "rto_delivered", "cancelled", "lost", "failed"].includes(shipment.shipment_status);
  const allowed = shipment.ndr_actions?.length ? shipment.ndr_actions : ["Re-Attempt", "RTO"];

  const printLabel = async () => {
    setLabelLoading(true);
    try {
      await openShipmentLabel(shipment.id);
    } catch (error) {
      dispatch(pushToast(errorText(error), "error"));
    } finally {
      setLabelLoading(false);
    }
  };

  return (
    <div className="mt-2 space-y-2">
      <p className="text-xs text-brand-ink/60">
        {shipment.provider_status && <>Ekart: {shipment.provider_status}</>}
        {shipment.expected_delivery_at && ` · Expected ${formatDate(shipment.expected_delivery_at)}`}
        {shipment.last_synced_at && ` · Synced ${formatDateTime(shipment.last_synced_at)}`}
        {shipment.package_weight ? ` · ${Math.round(shipment.package_weight * 1000)} g` : ""}
        {shipment.length_cm ? `, ${shipment.length_cm}×${shipment.width_cm}×${shipment.height_cm} cm` : ""}
      </p>

      {shipment.shipment_status === "ndr" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-semibold">Delivery attempt failed{shipment.ndr_status ? `: ${shipment.ndr_status}` : ""}</p>
          <p className="mt-0.5">Call the customer, then ask Ekart to try again or send the parcel back.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {allowed.includes("Re-Attempt") && (
              <>
                <input
                  type="date"
                  aria-label="Re-attempt date"
                  value={reattemptDate}
                  min={tomorrow()}
                  onChange={(e) => setReattemptDate(e.target.value)}
                  className={`${inputClass} w-auto py-1 text-xs`}
                />
                <AdminButton size="sm" loading={ndr.isPending && ndr.variables?.action === "Re-Attempt"} disabled={ndr.isPending} onClick={() => ndr.mutate({ action: "Re-Attempt", date: reattemptDate })}>
                  Re-attempt delivery
                </AdminButton>
              </>
            )}
            {allowed.includes("RTO") && (
              <AdminButton
                size="sm"
                variant="danger"
                loading={ndr.isPending && ndr.variables?.action === "RTO"}
                disabled={ndr.isPending}
                onClick={() => confirmAction("Send this parcel back to you (RTO)? Ekart charges return shipping.") && ndr.mutate({ action: "RTO" })}
              >
                Return to origin
              </AdminButton>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {isOpen && (
          <AdminButton size="sm" variant="outline" loading={labelLoading} onClick={printLabel}>
            <FileText size={13} /> Label
          </AdminButton>
        )}
        {isOpen && (
          <AdminButton size="sm" variant="outline" loading={manifest.isPending} onClick={() => manifest.mutate(undefined)}>
            Manifest
          </AdminButton>
        )}
        {shipment.manifest_url && (
          <a href={shipment.manifest_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-1 text-xs text-brand-forest underline">
            Manifest {shipment.manifest_number} <ExternalLink size={11} />
          </a>
        )}
        <AdminButton size="sm" variant="ghost" loading={sync.isPending} onClick={() => sync.mutate(undefined)}>
          <RefreshCw size={13} /> Sync tracking
        </AdminButton>
        {canCancel && (
          <AdminButton
            size="sm"
            variant="danger"
            loading={cancel.isPending}
            onClick={() => confirmAction("Cancel this Ekart shipment? The pickup is called off.") && cancel.mutate(undefined)}
          >
            Cancel shipment
          </AdminButton>
        )}
      </div>
    </div>
  );
}
