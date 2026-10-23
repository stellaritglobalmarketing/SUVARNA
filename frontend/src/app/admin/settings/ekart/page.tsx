"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { getEkartAddresses, getEkartSettings, updateEkartSettings, type EkartSettings } from "@/lib/api/admin";
import { AdminButton, Card, Field, FormError, PageHeader, inputClass, useAdminMutation } from "@/components/admin/ui";

type Form = Record<keyof EkartSettings, string>;

const toForm = (s: EkartSettings): Form =>
  Object.fromEntries(Object.entries(s).map(([key, value]) => [key, value === null || value === undefined ? "" : String(value)])) as Form;

function SettingsForm({ initial }: { initial: EkartSettings }) {
  const [form, setForm] = useState<Form>(() => toForm(initial));
  const set = (key: keyof EkartSettings) => (event: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: event.target.value }));

  // Return address choices come from the Ekart account; if that list can't load, a text box is shown instead.
  const addresses = useQuery({ queryKey: ["admin", "ekart-addresses"], queryFn: getEkartAddresses, retry: false });

  const save = useAdminMutation(updateEkartSettings, {
    success: "Ekart settings saved",
    invalidate: [["admin", "ekart-settings"], ["admin", "ekart-status"]],
    onSuccess: (saved) => setForm(toForm(saved)),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate(form);
  };

  const unchanged = JSON.stringify(form) === JSON.stringify(toForm(initial));

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card title="Seller details">
        <p className="mb-4 max-w-2xl text-sm text-brand-ink/65">Printed on the Ekart shipment and used for the GST split. Name and address are required to book shipments.</p>
        <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Seller name">
            <input className={inputClass} maxLength={100} value={form.seller_name} onChange={set("seller_name")} placeholder="Suvarna7" />
          </Field>
          <Field label="GSTIN (optional)" hint="15 characters, leave empty if not GST registered">
            <input className={inputClass} maxLength={15} value={form.seller_gstin} onChange={(e) => setForm((f) => ({ ...f, seller_gstin: e.target.value.toUpperCase() }))} />
          </Field>
          <Field label="Seller address" className="sm:col-span-2">
            <textarea className={inputClass} rows={2} maxLength={300} value={form.seller_address} onChange={set("seller_address")} />
          </Field>
          <Field label="Category of goods">
            <input className={inputClass} maxLength={60} value={form.category_of_goods} onChange={set("category_of_goods")} />
          </Field>
          <Field label="HSN code (optional)" hint="4–8 digits">
            <input className={inputClass} inputMode="numeric" maxLength={8} value={form.hsn_code} onChange={(e) => setForm((f) => ({ ...f, hsn_code: e.target.value.replace(/\D/g, "") }))} />
          </Field>
          <Field label="GST rate included in prices (%)" hint="0 if you don't charge GST">
            <input className={inputClass} inputMode="decimal" value={form.gst_rate} onChange={set("gst_rate")} />
          </Field>
        </div>
      </Card>

      <Card title="Default box">
        <p className="mb-4 max-w-2xl text-sm text-brand-ink/65">
          Pre-filled when booking a shipment (still editable per order). Package weight = product weights + packaging weight. Ekart bills the higher of actual and volumetric weight (L×W×H ÷ 5000 kg).
        </p>
        <div className="grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Length (cm)">
            <input className={inputClass} inputMode="numeric" value={form.box_length_cm} onChange={set("box_length_cm")} />
          </Field>
          <Field label="Width (cm)">
            <input className={inputClass} inputMode="numeric" value={form.box_width_cm} onChange={set("box_width_cm")} />
          </Field>
          <Field label="Height (cm)">
            <input className={inputClass} inputMode="numeric" value={form.box_height_cm} onChange={set("box_height_cm")} />
          </Field>
          <Field label="Packaging weight (g)">
            <input className={inputClass} inputMode="numeric" value={form.packaging_weight_g} onChange={set("packaging_weight_g")} />
          </Field>
        </div>
      </Card>

      <Card title="Return address">
        <p className="mb-4 max-w-2xl text-sm text-brand-ink/65">Where undelivered (RTO) parcels go back to. Leave as “Same as pickup” unless returns should go elsewhere.</p>
        <div className="max-w-md">
          {addresses.data ? (
            <select className={inputClass} value={form.return_alias} onChange={set("return_alias")}>
              <option value="">Same as pickup address</option>
              {addresses.data.addresses.map((a) => (
                <option key={a.alias} value={a.alias}>
                  {a.alias} — {a.city} {a.pincode}
                </option>
              ))}
              {form.return_alias && !addresses.data.addresses.some((a) => a.alias === form.return_alias) && (
                <option value={form.return_alias}>{form.return_alias} (not found on Ekart)</option>
              )}
            </select>
          ) : (
            <Field label="Return address alias" hint={addresses.isLoading ? "Loading Ekart addresses…" : "Couldn't load Ekart addresses — type the alias, or leave empty for same as pickup"}>
              <input className={inputClass} maxLength={60} value={form.return_alias} onChange={set("return_alias")} />
            </Field>
          )}
        </div>
      </Card>

      <Card title="Tracking webhook">
        <p className="mb-4 max-w-2xl text-sm text-brand-ink/65">
          Public https address of this backend (without /api/v1), so Ekart can send tracking updates. Then click “Register webhook” on the Shipments page. The webhook secret is generated automatically. Not needed for local testing.
        </p>
        <Field label="Backend public URL" className="max-w-md">
          <input className={inputClass} value={form.public_url} onChange={set("public_url")} placeholder="https://api.suvarna7.com" />
        </Field>
      </Card>

      <FormError error={save.error} />
      <AdminButton type="submit" disabled={unchanged} loading={save.isPending}>
        Save settings
      </AdminButton>
    </form>
  );
}

export default function EkartSettingsPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["admin", "ekart-settings"], queryFn: getEkartSettings });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ekart shipping"
        subtitle="Seller details, default box and tracking webhook for Ekart shipments. The pickup address has its own page."
        actions={
          <div className="flex gap-2">
            <Link href="/admin/settings" className="inline-flex items-center gap-1.5 rounded-lg border border-brand-sand-dark bg-white px-4 py-2 text-sm font-medium text-brand-forest">
              <ArrowLeft size={14} /> Settings
            </Link>
            <Link href="/admin/settings/pickup" className="inline-flex items-center gap-1.5 rounded-lg border border-brand-sand-dark bg-white px-4 py-2 text-sm font-medium text-brand-forest">
              Pickup address
            </Link>
          </div>
        }
      />
      {isLoading && <div className="h-40 animate-pulse rounded-xl bg-brand-sand" />}
      {isError && <p className="text-sm text-red-600">Couldn&apos;t load the Ekart settings. Please refresh.</p>}
      {data && <SettingsForm key={JSON.stringify(data)} initial={data} />}
    </div>
  );
}
