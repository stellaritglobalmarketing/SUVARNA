import { CheckCircle2 } from "lucide-react";
import type { ProductOrigin, ProductProcessing } from "@/types/product";

const QUALITY_CHECKS: { title: string; text: string }[] = [
  { title: "Hand-sorted", text: "Every lot is spread out and sorted by hand — broken, shrivelled and discoloured pieces are picked out." },
  { title: "Size & grade", text: "Pieces are graded by size so each pack is uniform, not topped up with smaller or lower-grade pieces." },
  { title: "Freshness test", text: "We smell and taste a sample from every batch; anything stale or rancid is rejected, not blended in." },
  { title: "Moisture check", text: "Lots that feel damp or overly dry are set aside, since moisture is what leads to fungus and a soft bite." },
  { title: "Foreign matter removed", text: "Stones, shell fragments, stems and dust are cleaned out before anything goes near a pouch." },
  { title: "Final look before sealing", text: "Each pack gets one last visual check at the packing table before it is sealed." },
];

const PROCESSING_STEP: Record<ProductProcessing, string> = {
  Raw: "Kept raw — no roasting, no added salt, no preservatives. Packed the way it was harvested.",
  "Roasted & Salted": "Slow-roasted in small batches and lightly salted, then cooled fully before packing so it stays crisp.",
  Smoked: "Smoked in small batches for an even flavour, then cooled fully before packing.",
  Traditional: "Prepared the traditional way, in small batches, without shortcuts or artificial additives.",
};

export function QualityProcess({ origin, processing }: { origin: ProductOrigin; processing: ProductProcessing }) {
  const steps: { title: string; text: string }[] = [
    { title: "Sourced from origin", text: `Bought directly from the ${origin} harvest, choosing lots on look, taste and grade — not just price.` },
    { title: "Cleaned & sorted", text: "The lot is cleaned and hand-sorted to remove dust, stones, broken and damaged pieces." },
    { title: "Graded", text: "Sorted by size and quality so only the grade we sell makes it to the next step." },
    { title: processing, text: PROCESSING_STEP[processing] },
    { title: "Packed airtight", text: "Weighed and sealed in food-grade, airtight pouches to keep out moisture and air." },
    { title: "Dispatched fresh", text: "Packed in small batches so what reaches you hasn't been sitting in a warehouse for months." },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-brand-sand-dark bg-white p-5 sm:p-6">
        <h2 className="font-serif text-xl font-semibold text-brand-forest">Quality Check</h2>
        <p className="mt-1 text-sm text-brand-ink/60">What every batch has to pass before it is packed.</p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {QUALITY_CHECKS.map(({ title, text }) => (
            <li key={title} className="rounded-xl bg-brand-sand p-3 text-sm text-brand-ink/75">
              <div className="mb-1.5 flex items-center gap-2 font-medium text-brand-forest">
                <CheckCircle2 size={16} className="shrink-0" /> {title}
              </div>
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-brand-sand-dark bg-white p-5 sm:p-6">
        <h2 className="font-serif text-xl font-semibold text-brand-forest">How We Process</h2>
        <p className="mt-1 text-sm text-brand-ink/60">From the harvest to your doorstep, step by step.</p>
        <ol className="mt-5">
          {steps.map(({ title, text }, index) => (
            <li key={title} className="relative flex gap-4 pb-5 last:pb-0">
              {index < steps.length - 1 && (
                <span className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-brand-sand-dark" aria-hidden="true" />
              )}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-forest text-sm font-semibold text-brand-sand tabular-nums">
                {index + 1}
              </span>
              <div className="pt-1">
                <p className="text-sm font-semibold text-brand-ink">{title}</p>
                <p className="mt-0.5 text-sm text-brand-ink/70">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
