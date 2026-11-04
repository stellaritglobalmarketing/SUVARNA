"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { usePincodeCheck } from "@/hooks/usePincodeCheck";
import { Field, INPUT_CLASS } from "./AddressForm";

export interface GuestDetails {
  name: string;
  phone: string;
  email: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
}

const EMPTY: GuestDetails = { name: "", phone: "", email: "", address: "", pincode: "", city: "", state: "" };

/**
 * Checkout without an account: name, mobile, optional email, address and pincode. City and state come from
 * the pincode, and are asked for only when the courier has no data for it. The pay button lives in the order
 * summary and submits this form through `id`.
 */
export function GuestCheckoutForm({ id, onSubmit }: { id: string; onSubmit: (details: GuestDetails) => void }) {
  const [form, setForm] = useState<GuestDetails>(EMPTY);
  const pincodeCheck = usePincodeCheck();

  const set = (key: keyof GuestDetails, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const changePincode = (value: string) => {
    const pincode = value.replace(/\D/g, "");
    set("pincode", pincode);
    if (pincode.length === 6) pincodeCheck.mutate(pincode);
    else pincodeCheck.reset();
  };

  const lookup = pincodeCheck.data?.pincode === form.pincode ? pincodeCheck.data : undefined;
  const isUnserviceable = lookup?.serviceable === false;
  const needsCityAndState = pincodeCheck.isError || (lookup?.serviceable === true && !(lookup.city && lookup.state));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!isUnserviceable) onSubmit(form);
  };

  return (
    <form id={id} onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Name">
        <input required maxLength={64} autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} className={INPUT_CLASS} />
      </Field>
      <Field label="Mobile Number">
        <input
          required
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          pattern="[6-9][0-9]{9}"
          title="Enter a 10-digit mobile number"
          maxLength={10}
          value={form.phone}
          onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))}
          placeholder="9876543210"
          className={INPUT_CLASS}
        />
      </Field>
      <Field label="Email (optional)" className="sm:col-span-2">
        <input type="email" maxLength={128} autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={INPUT_CLASS} />
      </Field>
      <Field label="Full Address" className="sm:col-span-2">
        <textarea
          required
          rows={3}
          minLength={10}
          maxLength={300}
          autoComplete="street-address"
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
          placeholder="House / flat number, street, area, landmark"
          className={`${INPUT_CLASS} resize-none`}
        />
      </Field>
      <Field label="Pincode" className="sm:col-span-2">
        <input
          required
          inputMode="numeric"
          autoComplete="postal-code"
          pattern="[1-9][0-9]{5}"
          title="Enter a 6-digit pincode"
          maxLength={6}
          value={form.pincode}
          onChange={(e) => changePincode(e.target.value)}
          placeholder="411001"
          className={INPUT_CLASS}
        />
        <span aria-live="polite" className="text-xs">
          {pincodeCheck.isPending && <span className="text-brand-ink/50">Checking delivery…</span>}
          {isUnserviceable && <span className="text-red-600">Sorry, we don&apos;t deliver to this pincode yet.</span>}
          {lookup?.serviceable && lookup.city && lookup.state && (
            <span className="text-green-700">
              Delivering to {lookup.city}, {lookup.state}
            </span>
          )}
        </span>
      </Field>
      {needsCityAndState && (
        <>
          <Field label="City">
            <input required maxLength={64} autoComplete="address-level2" value={form.city} onChange={(e) => set("city", e.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field label="State">
            <input required maxLength={64} autoComplete="address-level1" value={form.state} onChange={(e) => set("state", e.target.value)} className={INPUT_CLASS} />
          </Field>
        </>
      )}
      <p className="text-xs text-brand-ink/60 sm:col-span-2">
        No sign-up needed. After payment we&apos;ll set up your account with this mobile number, so you can track your order.{" "}
        <Link href={`/login?next=${encodeURIComponent("/checkout")}`} className="font-medium text-brand-forest underline">
          Already have an account? Log in
        </Link>
      </p>
    </form>
  );
}
