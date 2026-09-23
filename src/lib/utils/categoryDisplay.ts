import type { CategoryDisplay } from "@/lib/data/categories";
import type { HomeCategory } from "@/lib/api/products";

/** The real backend doesn't send a gradient/subtitle per category — cycle a small brand palette instead. */
const GRADIENTS: [string, string][] = [
  ["#8a6a4f", "#d4a373"],
  ["#7a1f2b", "#c9a227"],
  ["#c9a227", "#e4c563"],
  ["#e7d3a1", "#fdf9f1"],
  ["#4a2c1d", "#8a6a4f"],
  ["#6b3f2a", "#c9a887"],
  ["#c9a887", "#8a6a4f"],
  ["#3f4d2b", "#7a8f4a"],
];

export function toCategoryDisplay(category: HomeCategory, index: number): CategoryDisplay {
  return {
    label: category.name,
    subtitle: "Shop the collection",
    category: category.slug,
    image: category.imageUrl ?? "",
    gradient: GRADIENTS[index % GRADIENTS.length],
  };
}
