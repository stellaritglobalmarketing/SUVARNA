import { Check } from "lucide-react";
import type { Certification } from "@/types/product";

/** Product highlights as a two-column checklist between hairlines. */
export function CertificationBadges({ certifications }: { certifications: Certification[] }) {
  if (certifications.length === 0) return null;
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-2.5 border-y border-brand-sand-dark py-4 sm:grid-cols-2">
      {certifications.map((cert) => (
        <li key={cert.label} title={cert.description || undefined} className="flex items-start gap-2.5 text-sm text-brand-ink/85">
          <Check size={16} strokeWidth={2.5} className="mt-0.5 shrink-0 text-brand-gold" aria-hidden="true" />
          <span>
            {cert.label}
            {cert.description && <span className="block text-xs text-brand-ink/55">{cert.description}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
