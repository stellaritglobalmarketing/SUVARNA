import type { Product } from "@/types/product";

/**
 * Dummy catalog — 4 products, one per hero category. Shape mirrors the
 * planned REST contract (see src/lib/api/products.ts) so swapping the mock
 * reader for a real fetch requires no changes downstream.
 */
export const MOCK_PRODUCTS: Product[] = [
  {
    id: "p-almond-mamra",
    slug: "kashmir-mamra-almonds",
    name: "Kashmir Mamra Almonds",
    tagline: "Wild-harvested, cold-pressed oil-rich almonds",
    description:
      "Hand-picked from the Mamra orchards of Kashmir, these almonds are prized for their dense, oil-rich kernel and distinct sweet aroma. Sun-dried naturally with zero chemical treatment.",
    category: "Almonds",
    origin: "Kashmir",
    processing: "Raw",
    healthBenefits: ["Heart Health", "Keto Friendly", "High Protein"],
    images: [
      "https://images.unsplash.com/photo-1708453860229-cc8a7fa3c56f?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1577944072511-60bb44c679a2?auto=format&fit=crop&w=1600&q=80",
    ],
    gradient: ["#8a6a4f", "#d4a373"],
    rating: 4.8,
    reviewCount: 312,
    isBestSeller: true,
    discountPercent: 12,
    certifications: [
      { label: "Direct Farmer Fair Trade", description: "Sourced directly from Kashmiri orchard families." },
      { label: "100% Chemical-Free", description: "No fumigation, bleaching, or artificial preservatives." },
      { label: "42% Oil Content", description: "Lab-verified for premium Mamra-grade richness." },
    ],
    variants: [
      { label: "100g", grams: 100, price: 249, mrp: 289, stock: 42, sku: "ALM-MAM-100" },
      { label: "250g", grams: 250, price: 579, mrp: 699, stock: 27, sku: "ALM-MAM-250" },
      { label: "500g", grams: 500, price: 1099, mrp: 1349, stock: 14, sku: "ALM-MAM-500" },
      { label: "1kg", grams: 1000, price: 2099, mrp: 2599, stock: 6, sku: "ALM-MAM-1000" },
    ],
    nutrients: [
      { label: "Protein", valuePer100g: "21.2 g", dailyValuePercent: 42 },
      { label: "Dietary Fiber", valuePer100g: "12.5 g", dailyValuePercent: 45 },
      { label: "Vitamin E", valuePer100g: "25.6 mg", dailyValuePercent: 171 },
      { label: "MUFA (healthy fat)", valuePer100g: "31.6 g" },
      { label: "Magnesium", valuePer100g: "270 mg", dailyValuePercent: 64 },
    ],
    lipidBreakdown: [
      { label: "Monounsaturated", percent: 62, color: "#23412e" },
      { label: "Polyunsaturated", percent: 24, color: "#d4a373" },
      { label: "Saturated", percent: 14, color: "#c9a227" },
    ],
    deliveryEstimateDays: [2, 4],
    frequentlyBoughtWith: ["p-cashew-king", "p-date-medjool"],
  },
  {
    id: "p-cashew-king",
    slug: "king-cashews-w180",
    name: "King Cashews W180",
    tagline: "Extra-large, buttery-smooth whole cashews",
    description:
      "Graded W180 for size and uniformity, these king cashews are steam-processed to retain their natural creaminess without any added oil.",
    category: "Cashews",
    origin: "Kashmir",
    processing: "Raw",
    healthBenefits: ["Heart Health", "Weight Management"],
    images: [
      "https://images.unsplash.com/photo-1627820752174-acae1b399128?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1615485925873-7ecbbe90a866?auto=format&fit=crop&w=1600&q=80",
    ],
    gradient: ["#e7d3a1", "#fdf9f1"],
    rating: 4.7,
    reviewCount: 218,
    isBestSeller: true,
    discountPercent: 15,
    certifications: [
      { label: "Direct Farmer Fair Trade", description: "Traceable to source processing units." },
      { label: "100% Chemical-Free", description: "Steam-cleaned, no chemical whitening." },
      { label: "W180 Grade", description: "Top 8% size grade of the harvest." },
    ],
    variants: [
      { label: "100g", grams: 100, price: 219, mrp: 259, stock: 51, sku: "CSH-KNG-100" },
      { label: "250g", grams: 250, price: 499, mrp: 599, stock: 33, sku: "CSH-KNG-250" },
      { label: "500g", grams: 500, price: 949, mrp: 1149, stock: 19, sku: "CSH-KNG-500" },
      { label: "1kg", grams: 1000, price: 1799, mrp: 2199, stock: 9, sku: "CSH-KNG-1000" },
    ],
    nutrients: [
      { label: "Protein", valuePer100g: "18.2 g", dailyValuePercent: 36 },
      { label: "Dietary Fiber", valuePer100g: "3.3 g", dailyValuePercent: 12 },
      { label: "Vitamin E", valuePer100g: "0.9 mg", dailyValuePercent: 6 },
      { label: "MUFA (healthy fat)", valuePer100g: "23.8 g" },
      { label: "Magnesium", valuePer100g: "292 mg", dailyValuePercent: 70 },
    ],
    lipidBreakdown: [
      { label: "Monounsaturated", percent: 54, color: "#23412e" },
      { label: "Polyunsaturated", percent: 18, color: "#d4a373" },
      { label: "Saturated", percent: 28, color: "#c9a227" },
    ],
    deliveryEstimateDays: [2, 5],
    frequentlyBoughtWith: ["p-almond-mamra", "p-walnut-kashmiri"],
  },
  {
    id: "p-date-medjool",
    slug: "medjool-dates-jumbo",
    name: "Jumbo Medjool Dates",
    tagline: "Caramel-soft royal dates from desert oases",
    description:
      "Known as the 'king of dates', these jumbo Medjools are naturally sun-ripened to a rich caramel sweetness with a soft, chewy bite.",
    category: "Dates",
    origin: "Iran",
    processing: "Raw",
    healthBenefits: ["Heart Health", "High Protein"],
    images: [
      "https://images.unsplash.com/photo-1770617476915-7269d29d27dc?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1773038831316-a2f5e52a56e4?auto=format&fit=crop&w=1600&q=80",
    ],
    gradient: ["#4a2c1d", "#8a6a4f"],
    rating: 4.9,
    reviewCount: 176,
    isBestSeller: false,
    discountPercent: 8,
    certifications: [
      { label: "Direct Farmer Fair Trade", description: "Sourced from certified date cooperatives." },
      { label: "100% Chemical-Free", description: "No syrup dipping or sulphur treatment." },
      { label: "Jumbo Grade", description: "Hand-sorted for size and moisture content." },
    ],
    variants: [
      { label: "250g", grams: 250, price: 349, mrp: 399, stock: 38, sku: "DAT-MDJ-250" },
      { label: "500g", grams: 500, price: 649, mrp: 749, stock: 22, sku: "DAT-MDJ-500" },
      { label: "1kg", grams: 1000, price: 1199, mrp: 1399, stock: 11, sku: "DAT-MDJ-1000" },
    ],
    nutrients: [
      { label: "Protein", valuePer100g: "1.8 g", dailyValuePercent: 4 },
      { label: "Dietary Fiber", valuePer100g: "6.7 g", dailyValuePercent: 24 },
      { label: "Potassium", valuePer100g: "696 mg", dailyValuePercent: 15 },
      { label: "Natural Sugars", valuePer100g: "66 g" },
      { label: "Iron", valuePer100g: "0.9 mg", dailyValuePercent: 5 },
    ],
    lipidBreakdown: [
      { label: "Monounsaturated", percent: 38, color: "#23412e" },
      { label: "Polyunsaturated", percent: 22, color: "#d4a373" },
      { label: "Saturated", percent: 40, color: "#c9a227" },
    ],
    deliveryEstimateDays: [2, 4],
    frequentlyBoughtWith: ["p-almond-mamra", "p-walnut-kashmiri"],
  },
  {
    id: "p-walnut-kashmiri",
    slug: "kashmiri-walnut-kernels",
    name: "Kashmiri Walnut Kernels",
    tagline: "Light amber halves, cracked fresh to order",
    description:
      "Premium light-amber walnut kernels cracked fresh from Kashmiri orchards, prized for their thin skin, low bitterness, and high omega-3 content.",
    category: "Walnuts",
    origin: "Kashmir",
    processing: "Raw",
    healthBenefits: ["Heart Health", "Keto Friendly", "Diabetic Friendly"],
    images: [
      "https://images.unsplash.com/photo-1524593656068-fbac72624bb0?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1601966915100-b217f1420977?auto=format&fit=crop&w=1600&q=80",
    ],
    gradient: ["#c9a887", "#8a6a4f"],
    rating: 4.6,
    reviewCount: 143,
    isBestSeller: true,
    discountPercent: 10,
    certifications: [
      { label: "Direct Farmer Fair Trade", description: "Sourced from family-run Kashmiri orchards." },
      { label: "100% Chemical-Free", description: "Air-dried, no bleaching agents." },
      { label: "Light Amber Grade", description: "Premium color grade with low bitterness." },
    ],
    variants: [
      { label: "100g", grams: 100, price: 229, mrp: 269, stock: 47, sku: "WAL-KSH-100" },
      { label: "250g", grams: 250, price: 539, mrp: 639, stock: 25, sku: "WAL-KSH-250" },
      { label: "500g", grams: 500, price: 1029, mrp: 1229, stock: 13, sku: "WAL-KSH-500" },
      { label: "1kg", grams: 1000, price: 1949, mrp: 2349, stock: 7, sku: "WAL-KSH-1000" },
    ],
    nutrients: [
      { label: "Protein", valuePer100g: "15.2 g", dailyValuePercent: 30 },
      { label: "Dietary Fiber", valuePer100g: "6.7 g", dailyValuePercent: 24 },
      { label: "Omega-3 (ALA)", valuePer100g: "9.1 g" },
      { label: "MUFA (healthy fat)", valuePer100g: "8.9 g" },
      { label: "Vitamin E", valuePer100g: "0.7 mg", dailyValuePercent: 5 },
    ],
    lipidBreakdown: [
      { label: "Polyunsaturated", percent: 66, color: "#d4a373" },
      { label: "Monounsaturated", percent: 18, color: "#23412e" },
      { label: "Saturated", percent: 16, color: "#c9a227" },
    ],
    deliveryEstimateDays: [3, 5],
    frequentlyBoughtWith: ["p-almond-mamra", "p-cashew-king"],
  },
];

export function getMockProductBySlug(slug: string): Product | undefined {
  return MOCK_PRODUCTS.find((product) => product.slug === slug);
}

export function getMockProductsByIds(ids: string[]): Product[] {
  return ids
    .map((id) => MOCK_PRODUCTS.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product));
}
