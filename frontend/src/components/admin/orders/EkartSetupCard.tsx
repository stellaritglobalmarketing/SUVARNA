"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { getEkartStatus, registerEkartWebhook } from "@/lib/api/admin";
import { AdminButton, Card, useAdminMutation } from "@/components/admin/ui";

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      {ok ? <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" /> : <CircleAlert size={15} className="mt-0.5 shrink-0 text-amber-600" />}
      <span>{children}</span>
    </li>
  );
}

/** Ekart connection checklist on the Shipments page, with the one-click webhook registration. */
export function EkartSetupCard() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["admin", "ekart-status"], queryFn: getEkartStatus });
  const register = useAdminMutation(() => registerEkartWebhook(), {
    success: "Ekart webhook registered",
    invalidate: [["admin", "ekart-status"]],
  });

  if (isLoading || isError || !data) return null;
  const ready = data.configured && data.seller_details && !!data.pickup_pincode && data.webhook_registered;

  return (
    <Card
      title="Ekart"
      className="mb-6"
      actions={
        data.configured &&
        !data.webhook_registered && (
          <AdminButton size="sm" loading={register.isPending} disabled={!data.webhook_url || !data.webhook_secret_valid} onClick={() => register.mutate(undefined)}>
            Register webhook
          </AdminButton>
        )
      }
    >
      {ready ? (
        <p className="flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 size={16} /> Connected. Tracking updates arrive automatically.
        </p>
      ) : (
        <ul className="space-y-1.5 text-sm text-brand-ink/80">
          <Check ok={data.configured}>API credentials (EKART_CLIENT_ID, EKART_USERNAME, EKART_PASSWORD)</Check>
          <Check ok={data.seller_details}>Seller details (EKART_SELLER_NAME, EKART_SELLER_ADDRESS)</Check>
          <Check ok={!!data.pickup_pincode}>Pickup pincode (EKART_PICKUP_PINCODE), for delivery days and rates</Check>
          <Check ok={!!data.webhook_url && data.webhook_secret_valid}>BACKEND_PUBLIC_URL and EKART_WEBHOOK_SECRET (6–30 characters)</Check>
          <Check ok={data.webhook_registered}>Tracking webhook registered with Ekart{data.webhook_url ? ` (${data.webhook_url})` : ""}</Check>
        </ul>
      )}
      {data.error && <p className="mt-2 text-xs text-red-600">{data.error}</p>}
    </Card>
  );
}
