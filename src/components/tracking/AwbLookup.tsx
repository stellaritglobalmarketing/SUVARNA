"use client";

import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";

/** Looks up a customer's own order by order number (e.g. ORD-20260919-0001) — the backend has no AWB/courier lookup for customers. */
export function AwbLookup({ initialAwb, onSearch }: { initialAwb: string; onSearch: (orderNumber: string) => void }) {
  const [value, setValue] = useState(initialAwb);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (value.trim()) onSearch(value.trim());
  };

  return (
    <div className="rounded-2xl border border-brand-sand-dark bg-white p-5">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Enter your order number (e.g. ORD-20260919-0001)"
          className="flex-1 rounded-lg border border-brand-sand-dark px-3 py-2.5 text-sm font-mono outline-none focus:border-brand-forest"
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg bg-brand-forest px-4 py-2.5 text-sm font-medium text-brand-sand cursor-pointer"
        >
          <Search size={15} /> Track
        </button>
      </form>
      <p className="mt-2 text-xs text-brand-ink/50">You&apos;ll find your order number in your order history and confirmation.</p>
    </div>
  );
}
