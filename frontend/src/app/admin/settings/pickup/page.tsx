"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, MapPin, Plus } from "lucide-react";
import { addEkartAddress, getEkartAddresses, setEkartPickup, type EkartAddressInput } from "@/lib/api/admin";
import { AdminButton, Card, Checkbox, Field, FormError, Modal, PageHeader, errorText, inputClass, useAdminMutation } from "@/components/admin/ui";

const QUERY_KEY = ["admin", "ekart-addresses"];

const EMPTY: EkartAddressInput = {
  alias: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  pincode: "",
  city: "",
  state: "",
  country: "India",
  geo: { lat: "", lon: "" },
  make_pickup: true,
};

function AddAddressModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<EkartAddressInput>(EMPTY);
  const set = (key: keyof EkartAddressInput, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const setGeo = (key: "lat" | "lon", value: string) => setForm((f) => ({ ...f, geo: { lat: f.geo?.lat ?? "", lon: f.geo?.lon ?? "", [key]: value } }));

  const add = useAdminMutation(addEkartAddress, {
    success: "Address added to Ekart",
    invalidate: [QUERY_KEY, ["admin", "ekart-status"]],
    onSuccess: onClose,
  });

  const phoneOk = /^[6-9]\d{9}$/.test(form.phone);
  const pincodeOk = /^\d{6}$/.test(form.pincode);
  const complete = form.alias.trim() && form.address_line1.trim() && form.city.trim() && form.state.trim() && phoneOk && pincodeOk;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const geo = form.geo?.lat && form.geo?.lon ? form.geo : undefined;
    add.mutate({ ...form, geo });
  };

  return (
    <Modal title="Add pickup address" onClose={onClose}>
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Alias" hint="Short unique name, e.g. Main Warehouse" className="sm:col-span-2">
          <input className={inputClass} value={form.alias} maxLength={60} onChange={(e) => set("alias", e.target.value)} />
        </Field>
        <Field label="Phone" hint="10-digit mobile number">
          <input className={inputClass} inputMode="numeric" maxLength={10} value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))} />
        </Field>
        <Field label="Pincode">
          <input className={inputClass} inputMode="numeric" maxLength={6} value={form.pincode} onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))} />
        </Field>
        <Field label="Address line 1" className="sm:col-span-2">
          <input className={inputClass} value={form.address_line1} maxLength={200} onChange={(e) => set("address_line1", e.target.value)} />
        </Field>
        <Field label="Address line 2 (optional)" className="sm:col-span-2">
          <input className={inputClass} value={form.address_line2} maxLength={200} onChange={(e) => set("address_line2", e.target.value)} />
        </Field>
        <Field label="City">
          <input className={inputClass} value={form.city} maxLength={60} onChange={(e) => set("city", e.target.value)} />
        </Field>
        <Field label="State">
          <input className={inputClass} value={form.state} maxLength={60} onChange={(e) => set("state", e.target.value)} />
        </Field>
        <Field label="Country">
          <input className={inputClass} value={form.country} maxLength={60} onChange={(e) => set("country", e.target.value)} />
        </Field>
        <div />
        <Field label="Latitude (optional)">
          <input className={inputClass} inputMode="decimal" value={form.geo?.lat ?? ""} onChange={(e) => setGeo("lat", e.target.value)} />
        </Field>
        <Field label="Longitude (optional)">
          <input className={inputClass} inputMode="decimal" value={form.geo?.lon ?? ""} onChange={(e) => setGeo("lon", e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Checkbox label="Use this as the pickup address" checked={!!form.make_pickup} onChange={(checked) => setForm((f) => ({ ...f, make_pickup: checked }))} />
        </div>
        {form.phone && !phoneOk && <p className="text-xs text-red-600 sm:col-span-2">Phone must be a 10-digit mobile number starting with 6–9.</p>}
        {form.pincode && !pincodeOk && <p className="text-xs text-red-600 sm:col-span-2">Pincode must be 6 digits.</p>}
        <div className="sm:col-span-2">
          <FormError error={add.error} />
        </div>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <AdminButton variant="outline" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton type="submit" disabled={!complete} loading={add.isPending}>
            Add to Ekart
          </AdminButton>
        </div>
      </form>
    </Modal>
  );
}

export default function PickupAddressPage() {
  const { data, isLoading, isError, error } = useQuery({ queryKey: QUERY_KEY, queryFn: getEkartAddresses, retry: false });
  const [adding, setAdding] = useState(false);
  const choose = useAdminMutation(setEkartPickup, {
    success: "Pickup address updated",
    invalidate: [QUERY_KEY, ["admin", "ekart-status"]],
  });

  const pickup = data?.pickup;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pickup address"
        subtitle="Where Ekart collects parcels from. Bookings, rate estimates and delivery days use the selected address."
        actions={
          <div className="flex gap-2">
            <Link href="/admin/settings" className="inline-flex items-center gap-1.5 rounded-lg border border-brand-sand-dark bg-white px-4 py-2 text-sm font-medium text-brand-forest">
              <ArrowLeft size={14} /> Settings
            </Link>
            <AdminButton onClick={() => setAdding(true)} disabled={isError}>
              <Plus size={14} /> Add address
            </AdminButton>
          </div>
        }
      />

      {pickup && (
        <Card title="Current pickup">
          {pickup.alias ? (
            <p className="flex items-center gap-2 text-sm text-brand-ink/80">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span className="font-semibold text-brand-ink">{pickup.alias}</span>
              {pickup.pincode && <span>· {pickup.pincode}</span>}
            </p>
          ) : (
            <p className="text-sm text-amber-700">
              No pickup address selected. Pick one below — bookings, rates and delivery days need it.
            </p>
          )}
        </Card>
      )}

      <Card title="Addresses on your Ekart account">
        {isLoading && <div className="h-24 animate-pulse rounded-xl bg-brand-sand" />}
        {isError && <p className="text-sm text-red-600">{errorText(error)}</p>}
        {data && data.addresses.length === 0 && <p className="text-sm text-brand-ink/60">No addresses yet. Add your warehouse or shop address.</p>}
        {data && data.addresses.length > 0 && (
          <ul className="divide-y divide-brand-sand-dark">
            {data.addresses.map((address) => {
              const selected = pickup?.alias === address.alias;
              return (
                <li key={address.alias} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm">
                    <p className="flex items-center gap-2 font-semibold text-brand-ink">
                      <MapPin size={14} className="text-brand-forest" /> {address.alias}
                      {selected && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">Pickup</span>}
                    </p>
                    <p className="mt-1 text-brand-ink/70">
                      {[address.address_line1, address.address_line2].filter(Boolean).join(", ")}
                    </p>
                    <p className="text-brand-ink/70">
                      {address.city}, {address.state} - {address.pincode} · {address.phone}
                    </p>
                  </div>
                  {!selected && (
                    <AdminButton size="sm" variant="outline" loading={choose.isPending && choose.variables === address.alias} onClick={() => choose.mutate(address.alias)}>
                      Use as pickup
                    </AdminButton>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {adding && <AddAddressModal onClose={() => setAdding(false)} />}
    </div>
  );
}
