import { BadgeCheck } from "lucide-react";
import type { Certification } from "@/types/product";

export function CertificationBadges({ certifications }: { certifications: Certification[] }) {
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {certifications.map((cert) => (
        <li
          key={cert.label}
          title={cert.description}
          className="flex items-start gap-2 rounded-xl border border-brand-sand-dark bg-white px-3 py-2.5"
        >
          <BadgeCheck size={16} className="mt-0.5 shrink-0 text-brand-forest" />
          <div>
            <p className="text-xs font-semibold text-brand-ink">{cert.label}</p>
            <p className="text-[11px] text-brand-ink/60">{cert.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
