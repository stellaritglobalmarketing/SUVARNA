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
  {
    id: "p-almond-afghani",
    slug: "afghani-gurbandi-almonds",
    name: "Afghani Gurbandi Almonds",
    tagline: "Slim, sweet almonds from the Gurbandi valley",
    description:
      "Grown in the Gurbandi valley of Afghanistan, these slim-shelled almonds are prized for their delicate sweetness and soft bite — a traditional favourite across South Asian kitchens.",
    category: "Almonds",
    origin: "Afghanistan",
    processing: "Raw",
    healthBenefits: ["Heart Health", "High Protein"],
    images: [
      "https://images.unsplash.com/photo-1605024344839-e6e41aea6b23?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1577944072511-60bb44c679a2?auto=format&fit=crop&w=1600&q=80",
    ],
    gradient: ["#7a5a3f", "#c9a887"],
    rating: 4.6,
    reviewCount: 129,
    isBestSeller: false,
    discountPercent: 10,
    certifications: [
      { label: "Direct Farmer Fair Trade", description: "Sourced through certified Afghan orchard cooperatives." },
      { label: "100% Chemical-Free", description: "Sun-dried naturally, no fumigation." },
      { label: "Gurbandi Grade", description: "Hand-sorted for the thin-shell Gurbandi variety." },
    ],
    variants: [
      { label: "100g", grams: 100, price: 199, mrp: 239, stock: 38, sku: "ALM-AFG-100" },
      { label: "250g", grams: 250, price: 459, mrp: 549, stock: 24, sku: "ALM-AFG-250" },
      { label: "500g", grams: 500, price: 869, mrp: 1049, stock: 12, sku: "ALM-AFG-500" },
      { label: "1kg", grams: 1000, price: 1649, mrp: 1999, stock: 5, sku: "ALM-AFG-1000" },
    ],
    nutrients: [
      { label: "Protein", valuePer100g: "20.1 g", dailyValuePercent: 40 },
      { label: "Dietary Fiber", valuePer100g: "11.8 g", dailyValuePercent: 42 },
      { label: "Vitamin E", valuePer100g: "22.4 mg", dailyValuePercent: 149 },
      { label: "MUFA (healthy fat)", valuePer100g: "29.8 g" },
      { label: "Magnesium", valuePer100g: "258 mg", dailyValuePercent: 61 },
    ],
    lipidBreakdown: [
      { label: "Monounsaturated", percent: 60, color: "#23412e" },
      { label: "Polyunsaturated", percent: 23, color: "#d4a373" },
      { label: "Saturated", percent: 17, color: "#c9a227" },
    ],
    deliveryEstimateDays: [3, 5],
    frequentlyBoughtWith: ["p-almond-mamra", "p-ghee-desi"],
  },
  {
    id: "p-saffron-mongra",
    slug: "kashmiri-mongra-saffron",
    name: "Kashmiri Mongra Saffron",
    tagline: "Grade-1 mongra kesar, hand-picked from Pampore",
    description:
      "Hand-harvested from the saffron fields of Pampore, Kashmir, this Mongra-grade saffron is prized for its deep crimson threads, intense aroma and rich flavour — the finest grade of Indian kesar.",
    category: "Saffron",
    origin: "Kashmir",
    processing: "Traditional",
    healthBenefits: ["Immunity Boost", "Heart Health"],
    images: [
      "https://images.unsplash.com/photo-1564057779901-11451bfca03b?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1709004789083-139ce217f87f?auto=format&fit=crop&w=1600&q=80",
    ],
    gradient: ["#7a1f2b", "#c9a227"],
    rating: 4.9,
    reviewCount: 87,
    isBestSeller: false,
    discountPercent: 14,
    certifications: [
      { label: "Direct Farmer Fair Trade", description: "Sourced directly from Pampore saffron growers." },
      { label: "100% Pure, No Additives", description: "Zero colouring, zero artificial fragrance." },
      { label: "Grade-1 Mongra", description: "Hand-picked for maximum crocin (colour) and safranal (aroma)." },
    ],
    variants: [
      { label: "0.5g", grams: 0.5, price: 199, mrp: 249, stock: 60, sku: "SAF-MON-0.5" },
      { label: "1g", grams: 1, price: 379, mrp: 449, stock: 44, sku: "SAF-MON-1" },
      { label: "2g", grams: 2, price: 729, mrp: 849, stock: 21, sku: "SAF-MON-2" },
      { label: "5g", grams: 5, price: 1749, mrp: 1999, stock: 9, sku: "SAF-MON-5" },
    ],
    nutrients: [
      { label: "Protein", valuePer100g: "11.4 g", dailyValuePercent: 23 },
      { label: "Dietary Fiber", valuePer100g: "3.9 g", dailyValuePercent: 14 },
      { label: "Manganese", valuePer100g: "28.4 mg", dailyValuePercent: 1234 },
      { label: "Vitamin C", valuePer100g: "80.8 mg", dailyValuePercent: 90 },
      { label: "Potassium", valuePer100g: "1724 mg", dailyValuePercent: 37 },
    ],
    lipidBreakdown: [
      { label: "Polyunsaturated", percent: 45, color: "#d4a373" },
      { label: "Monounsaturated", percent: 30, color: "#23412e" },
      { label: "Saturated", percent: 25, color: "#c9a227" },
    ],
    deliveryEstimateDays: [2, 4],
    frequentlyBoughtWith: ["p-ghee-desi", "p-almond-mamra"],
  },
  {
    id: "p-ghee-desi",
    slug: "pure-desi-ghee",
    name: "Pure Desi Ghee",
    tagline: "A2 bilona-method cow ghee, slow-churned",
    description:
      "Made using the traditional bilona method from A2 cow milk, this ghee is slow-churned in small batches for a rich, nutty aroma and golden-grain texture — the way ghee was made generations ago.",
    category: "Ghee",
    origin: "India",
    processing: "Traditional",
    healthBenefits: ["Keto Friendly", "Heart Health"],
    images: [
      "https://images.unsplash.com/photo-1573812461383-e5f8b759d12e?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1707425197195-240b7ad69047?auto=format&fit=crop&w=1600&q=80",
    ],
    gradient: ["#c9a227", "#e4c563"],
    rating: 4.8,
    reviewCount: 156,
    isBestSeller: true,
    discountPercent: 10,
    certifications: [
      { label: "Direct Farmer Fair Trade", description: "Sourced from small-scale A2 gaushalas." },
      { label: "100% Pure, No Adulteration", description: "No vanaspati, palm oil or added colour." },
      { label: "Bilona Method", description: "Traditionally hand-churned from cultured cream, not cream separators." },
    ],
    variants: [
      { label: "200g", grams: 200, price: 249, mrp: 299, stock: 40, sku: "GHE-DES-200" },
      { label: "500g", grams: 500, price: 549, mrp: 649, stock: 26, sku: "GHE-DES-500" },
      { label: "1kg", grams: 1000, price: 999, mrp: 1199, stock: 15, sku: "GHE-DES-1000" },
    ],
    nutrients: [
      { label: "Fat", valuePer100g: "99.5 g", dailyValuePercent: 153 },
      { label: "Vitamin A", valuePer100g: "3069 IU", dailyValuePercent: 61 },
      { label: "Vitamin E", valuePer100g: "2.8 mg", dailyValuePercent: 19 },
      { label: "Vitamin K2", valuePer100g: "0.03 mg" },
      { label: "Omega-3 (ALA)", valuePer100g: "0.5 g" },
    ],
    lipidBreakdown: [
      { label: "Saturated", percent: 62, color: "#c9a227" },
      { label: "Monounsaturated", percent: 28, color: "#23412e" },
      { label: "Polyunsaturated", percent: 10, color: "#d4a373" },
    ],
    deliveryEstimateDays: [2, 4],
    frequentlyBoughtWith: ["p-saffron-mongra", "p-almond-mamra"],
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
