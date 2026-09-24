import type { ProductCategory, StorageTipSet } from "@/types/product";

/**
 * Per-category storage tips for mock mode (no NEXT_PUBLIC_API_BASE_URL). With the real API
 * they come from the category's shelf_life_tip / storage_tip / usage_tip columns.
 */
export const MOCK_STORAGE_TIPS: Partial<Record<ProductCategory, StorageTipSet>> = {
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
