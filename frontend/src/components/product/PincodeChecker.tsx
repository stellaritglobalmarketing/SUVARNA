"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, MapPin, XCircle } from "lucide-react";
import { usePincodeCheck } from "@/hooks/usePincodeCheck";
import type { PincodeServiceability } from "@/lib/api/pincode";
import { cn } from "@/lib/utils/cn";

export function PincodeChecker({
  onChecked,
  bordered = true,
  showHeading = true,
}: {
  onChecked?: (result: PincodeServiceability) => void;
  /** Set false when the parent already provides its own card/heading (e.g. inside a sheet). */
  bordered?: boolean;
  showHeading?: boolean;
}) {
  const [pincode, setPincode] = useState("");
  const { mutate, data, error, isPending } = usePincodeCheck();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (pincode.trim().length === 6) {
      mutate(pincode.trim(), {
        onSuccess: (result) => onChecked?.(result),
      });
    }
  };

  return (
    <div className={cn(bordered && "rounded-xl border border-brand-sand-dark bg-white p-4")}>
      {showHeading && (
        <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-ink">
          <MapPin size={16} className="text-brand-forest" /> Check Delivery Estimate
        </p>
      )}
      <form onSubmit={handleSubmit} className={cn("flex gap-2", showHeading && "mt-3")}>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="Enter 6-digit pincode"
          value={pincode}
          onChange={(event) => setPincode(event.target.value.replace(/\D/g, ""))}
          className="flex-1 rounded-lg border border-brand-sand-dark px-3 py-2 text-sm outline-none focus:border-brand-forest"
        />
        <button
          type="submit"
          disabled={pincode.length !== 6 || isPending}
          className="rounded-lg bg-brand-forest px-4 py-2 text-sm font-medium text-brand-sand disabled:opacity-50 cursor-pointer"
        >
          {isPending ? "Checking…" : "Check"}
        </button>
      </form>

      {error && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-red-600">
          <XCircle size={16} /> {error instanceof Error ? error.message : "Something went wrong"}
        </p>
      )}

      {data && data.serviceable && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-green-700">
          <CheckCircle2 size={16} /> Delivers in {data.estimatedDays[0]}–{data.estimatedDays[1]} days
          {data.codAvailable && " · Cash on Delivery available"}
        </p>
      )}

      {data && !data.serviceable && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-red-600">
          <XCircle size={16} /> We don&apos;t deliver to this pincode yet.
        </p>
      )}
    </div>
  );
}
