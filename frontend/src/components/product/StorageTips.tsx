import { Clock3, Refrigerator, ShieldCheck, Snowflake, Sun } from "lucide-react";
import type { ProductCategory } from "@/types/product";

const GENERAL_TIPS: { icon: typeof Sun; text: string }[] = [
  { icon: Sun, text: "Store in a cool, dry place away from direct sunlight — ideal pantry temperature keeps the natural oils stable." },
  { icon: ShieldCheck, text: "Reseal the nitrogen-flushed pouch tightly after every use to lock in freshness and prevent moisture absorption." },
  { icon: Refrigerator, text: "In hot, humid climates, keep the pack in the refrigerator after opening to extend the shelf life by several months." },
  { icon: Snowflake, text: "Avoid freezing; it can dull the crunch and affect texture, especially in nuts and seeds." },
];

const CATEGORY_TIPS: Partial<Record<ProductCategory, { shelfLife: string; usage: string; storage: string }>> = {
  Almonds: {
    shelfLife: "Best consumed within 6 months from opening when stored airtight.",
    usage: "Soak overnight for a softer bite and easier digestion, especially during breakfast or post-workout snacking.",
    storage: "Keep in a dry, airtight jar after opening; avoid the kitchen counter during monsoon humidity.",
  },
  Cashews: {
    shelfLife: "Freshest for up to 5–6 months once the pack is resealed properly.",
    usage: "Lightly roast for 2–3 minutes to bring out the buttery flavour before serving with fruit or yogurt.",
    storage: "Store in a cool pantry and refrigerate after opening if your home is warm and humid.",
  },
  Dates: {
    shelfLife: "Stay soft and fresh for 4–6 months if kept sealed and away from heat.",
    usage: "Pit and stuff with a nut or cheese cube for a naturally sweet snack or quick energy boost.",
    storage: "Keep in a sealed container away from sunlight; the fruit stays softer and sweeter when protected from moisture.",
  },
  Walnuts: {
    shelfLife: "Quality stays excellent for around 4–5 months once opened if stored airtight.",
    usage: "Add to oats, smoothies, or yogurt in the morning for an easy Omega-3 boost.",
    storage: "Prefer a cool cupboard or refrigerator after opening to preserve the delicate nutty aroma.",
  },
  Figs: {
    shelfLife: "Best enjoyed within 3–4 months after opening when stored in a cool, dry place.",
    usage: "Soak in warm water for 10 minutes if you prefer a softer, juicier bite before eating.",
    storage: "Keep the pack closed tightly and avoid damp conditions, which can make the fruit sticky or stale faster.",
  },
  Makhana: {
    shelfLife: "Crisp for up to 3 months after opening when kept in a moisture-free container.",
    usage: "Roast with a little ghee and rock salt for a crunchy, protein-rich evening snack.",
    storage: "Store in an airtight jar away from steam and humidity so it stays crisp and light.",
  },
  Seeds: {
    shelfLife: "Stay fresh for 4–6 months if packed tightly and kept cool and dry.",
    usage: "Sprinkle over salads, yogurt, or oatmeal for a quick nutrient boost in the morning.",
    storage: "Keep in a sealed container and stay away from sunlight; a fridge helps in warm weather.",
  },
};

export function StorageTips({ category }: { category: ProductCategory }) {
  const categoryTip = CATEGORY_TIPS[category];

  return (
    <div className="rounded-2xl border border-brand-sand-dark bg-white p-5">
      <h3 className="font-serif text-lg font-semibold text-brand-forest">Storage &amp; Usage Tips</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-brand-sand p-3 text-sm text-brand-ink/75">
          <div className="mb-2 flex items-center gap-2 font-medium text-brand-forest">
            <Clock3 size={16} /> Freshness
          </div>
          <p>{categoryTip?.shelfLife ?? "Best enjoyed within a few months of opening when stored airtight."}</p>
        </div>
        <div className="rounded-xl bg-brand-sand p-3 text-sm text-brand-ink/75">
          <div className="mb-2 flex items-center gap-2 font-medium text-brand-forest">
            <Sun size={16} /> Storage
          </div>
          <p>{categoryTip?.storage ?? "Keep in a cool, dry place away from direct sunlight and moisture."}</p>
        </div>
        <div className="rounded-xl bg-brand-sand p-3 text-sm text-brand-ink/75">
          <div className="mb-2 flex items-center gap-2 font-medium text-brand-forest">
            <ShieldCheck size={16} /> Usage
          </div>
          <p>{categoryTip?.usage ?? "Enjoy as a clean, nourishing snack or mix into breakfast bowls and smoothies."}</p>
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
