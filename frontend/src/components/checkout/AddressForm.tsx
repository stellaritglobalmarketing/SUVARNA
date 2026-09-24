"use client";

import { useState, type FormEvent } from "react";
import type { AddressInput, AddressType } from "@/types/address";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

const INPUT_CLASS =
  "w-full rounded-lg border border-brand-sand-dark px-3 py-2.5 text-sm outline-none focus:border-brand-forest";

const ADDRESS_TYPES: { value: AddressType; label: string }[] = [
  { value: "home", label: "Home" },
  { value: "work", label: "Work" },
  { value: "other", label: "Other" },
];

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-sm", className)}>
      <span className="font-medium text-brand-ink">{label}</span>
      {children}
    </label>
  );
}

/** New-address form. The backend re-validates everything; its message is shown if it rejects the address. */
export function AddressForm({
  defaults,
  isSaving,
  error,
  onSubmit,
  onCancel,
}: {
  defaults: Partial<AddressInput>;
  isSaving: boolean;
  error: string | null;
  onSubmit: (input: AddressInput) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<AddressInput>({
    full_name: defaults.full_name ?? "",
    phone: defaults.phone ?? "",
    address_line1: "",
    address_line2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    address_type: "home",
    is_default: defaults.is_default ?? false,
  });

  const set = <K extends keyof AddressInput>(key: K, value: AddressInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({ ...form, address_line2: form.address_line2 || undefined, landmark: form.landmark || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Full Name">
        <input required maxLength={64} value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className={INPUT_CLASS} />
      </Field>
      <Field label="Phone">
        <input
          required
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={form.phone}
          onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))}
          placeholder="9876543210"
          className={INPUT_CLASS}
        />
      </Field>
      <Field label="House / Flat, Street" className="sm:col-span-2">
        <input required maxLength={160} value={form.address_line1} onChange={(e) => set("address_line1", e.target.value)} className={INPUT_CLASS} />
      </Field>
      <Field label="Area / Locality (optional)">
        <input maxLength={160} value={form.address_line2} onChange={(e) => set("address_line2", e.target.value)} className={INPUT_CLASS} />
      </Field>
      <Field label="Landmark (optional)">
        <input maxLength={128} value={form.landmark} onChange={(e) => set("landmark", e.target.value)} className={INPUT_CLASS} />
      </Field>
      <Field label="Pincode">
        <input
          required
          inputMode="numeric"
          maxLength={6}
          value={form.pincode}
          onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))}
          placeholder="411001"
          className={INPUT_CLASS}
        />
      </Field>
      <Field label="City">
        <input required maxLength={64} value={form.city} onChange={(e) => set("city", e.target.value)} className={INPUT_CLASS} />
      </Field>
      <Field label="State" className="sm:col-span-2">
        <input required maxLength={64} value={form.state} onChange={(e) => set("state", e.target.value)} className={INPUT_CLASS} />
      </Field>

      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
        <span className="text-sm font-medium text-brand-ink">Save as</span>
        {ADDRESS_TYPES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => set("address_type", value)}
            aria-pressed={form.address_type === value}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium cursor-pointer",
              form.address_type === value
                ? "border-brand-forest bg-brand-forest text-brand-sand"
                : "border-brand-sand-dark text-brand-ink/70 hover:border-brand-forest",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm text-brand-ink/80 sm:col-span-2">
        <input
          type="checkbox"
          checked={Boolean(form.is_default)}
          onChange={(e) => set("is_default", e.target.checked)}
          className="h-4 w-4 accent-brand-forest"
        />
        Make this my default address
      </label>

      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving…" : "Save Address"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
