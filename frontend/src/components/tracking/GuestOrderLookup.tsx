"use client";

import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";

/** Tracking without logging in: the order number plus the mobile number used for that order. */
export function GuestOrderLookup({
  initialOrder,
  isSearching,
  onSearch,
}: {
  initialOrder: string;
  isSearching: boolean;
  onSearch: (orderNumber: string, phone: string) => void;
}) {
  const [orderNumber, setOrderNumber] = useState(initialOrder);
  const [phone, setPhone] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSearch(orderNumber.trim(), phone);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-brand-sand-dark bg-white p-5">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input
          required
          aria-label="Order number"
          value={orderNumber}
          onChange={(event) => setOrderNumber(event.target.value)}
          placeholder="Order number (e.g. ORD-20261104-0001)"
          className="rounded-lg border border-brand-sand-dark px-3 py-2.5 font-mono text-sm outline-none focus:border-brand-forest"
        />
        <input
          required
          type="tel"
          inputMode="numeric"
          maxLength={10}
          aria-label="Mobile number"
          value={phone}
          onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
          placeholder="Mobile number used for the order"
          className="rounded-lg border border-brand-sand-dark px-3 py-2.5 text-sm outline-none focus:border-brand-forest"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-forest px-4 py-2.5 text-sm font-medium text-brand-sand cursor-pointer disabled:opacity-50"
        >
          <Search size={15} /> {isSearching ? "Tracking…" : "Track"}
        </button>
      </div>
      <p className="mt-2 text-xs text-brand-ink/50">You&apos;ll find your order number on your order confirmation.</p>
    </form>
  );
}
