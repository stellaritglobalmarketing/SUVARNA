import { Clock3, Refrigerator, ShieldCheck, Snowflake, Sun } from "lucide-react";
import type { StorageTipSet } from "@/types/product";

const GENERAL_TIPS: { icon: typeof Sun; text: string }[] = [
  { icon: Sun, text: "Store in a cool, dry place away from direct sunlight — ideal pantry temperature keeps the natural oils stable." },
  { icon: ShieldCheck, text: "Reseal the nitrogen-flushed pouch tightly after every use to lock in freshness and prevent moisture absorption." },
  { icon: Refrigerator, text: "In hot, humid climates, keep the pack in the refrigerator after opening to extend the shelf life by several months." },
  { icon: Snowflake, text: "Avoid freezing; it can dull the crunch and affect texture, especially in nuts and seeds." },
];

/** `tips` is the product category's copy from the backend; any missing piece falls back to generic text. */
export function StorageTips({ tips }: { tips: StorageTipSet | null }) {
  return (
    <div className="rounded-2xl border border-brand-sand-dark bg-white p-5">
      <h3 className="font-serif text-lg font-semibold text-brand-forest">Storage &amp; Usage Tips</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-brand-sand p-3 text-sm text-brand-ink/75">
          <div className="mb-2 flex items-center gap-2 font-medium text-brand-forest">
            <Clock3 size={16} /> Freshness
          </div>
          <p>{tips?.shelfLife ?? "Best enjoyed within a few months of opening when stored airtight."}</p>
        </div>
        <div className="rounded-xl bg-brand-sand p-3 text-sm text-brand-ink/75">
          <div className="mb-2 flex items-center gap-2 font-medium text-brand-forest">
            <Sun size={16} /> Storage
          </div>
          <p>{tips?.storage ?? "Keep in a cool, dry place away from direct sunlight and moisture."}</p>
        </div>
        <div className="rounded-xl bg-brand-sand p-3 text-sm text-brand-ink/75">
          <div className="mb-2 flex items-center gap-2 font-medium text-brand-forest">
            <ShieldCheck size={16} /> Usage
          </div>
          <p>{tips?.usage ?? "Enjoy as a clean, nourishing snack or mix into breakfast bowls and smoothies."}</p>
        </div>
      </div>

      <ul className="mt-4 space-y-2.5">
        {GENERAL_TIPS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-2.5 text-sm text-brand-ink/75">
            <Icon size={16} className="mt-0.5 shrink-0 text-brand-forest" />
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
