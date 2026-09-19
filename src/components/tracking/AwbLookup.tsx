"use client";

import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";

const SAMPLE_AWBS = [
  { awb: "BLD-9038472911", label: "On Track" },
  { awb: "EKT-7742910385", label: "Delayed" },
  { awb: "DLV-5521837460", label: "Delivery Attempt Failed" },
  { awb: "DTC-3391005567", label: "RTO" },
];

export function AwbLookup({ initialAwb, onSearch }: { initialAwb: string; onSearch: (awb: string) => void }) {
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
          placeholder="Enter AWB number"
          className="flex-1 rounded-lg border border-brand-sand-dark px-3 py-2.5 text-sm font-mono outline-none focus:border-brand-forest"
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg bg-brand-forest px-4 py-2.5 text-sm font-medium text-brand-sand cursor-pointer"
        >
          <Search size={15} /> Track
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-xs text-brand-ink/50 self-center">Try a sample shipment:</span>
        {SAMPLE_AWBS.map((sample) => (
          <button
            key={sample.awb}
            type="button"
            onClick={() => {
              setValue(sample.awb);
              onSearch(sample.awb);
            }}
            className="rounded-full border border-brand-sand-dark bg-brand-sand px-3 py-1 text-xs font-medium text-brand-ink hover:border-brand-forest cursor-pointer"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
}
