import { Check } from "lucide-react";
import type { Certification } from "@/types/product";

/** Trust points under Add to Cart ("Grown on our own farm", "Free delivery across India"), as small chips. */
export function TrustPoints({ points }: { points: Certification[] }) {
  if (points.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {points.map((point) => (
        <li
          key={point.label}
          title={point.description || undefined}
          className="flex items-center gap-1.5 rounded-full border border-brand-sand-dark bg-brand-sand/60 px-3 py-1.5 text-xs font-medium text-brand-ink/85"
        >
          <Check size={13} strokeWidth={3} className="shrink-0 text-brand-gold" aria-hidden="true" />
          {point.label}
        </li>
      ))}
    </ul>
  );
}
