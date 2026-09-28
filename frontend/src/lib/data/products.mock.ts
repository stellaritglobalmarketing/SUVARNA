import type { Product } from "@/types/product";

/**
 * Dummy catalog — the client's actual 7-product range. Shape mirrors the
 * planned REST contract (see src/lib/api/products.ts) so swapping the mock
 * reader for a real fetch requires no changes downstream.
 */
export const MOCK_PRODUCTS: Product[] = [
  {
    id: "p-saffron-mongra",
    slug: "kashmiri-mongra-saffron",
    name: "Kashmiri Mongra Saffron",
    tagline: "Grade-1 mongra kesar, hand-picked from Pampore",
    description:
      "Hand-harvested from the saffron fields of Pampore, Kashmir, this Mongra-grade saffron is prized for its deep crimson threads, intense aroma and rich flavour — the finest grade of Indian kesar.",
    origin: "Kashmir",
    processing: "Traditional",
    healthBenefits: ["Immunity Boost", "Heart Health"],
    images: ["/images/products/kashmiri-mongra-saffron.webp"],
    gradient: ["#7a1f2b", "#c9a227"],
    rating: 4.9,
    reviewCount: 87,
    isBestSeller: false,
    discountPercent: 16,
    certifications: [
      { label: "Direct Farmer Fair Trade", description: "Sourced directly from Pampore saffron growers." },
      { label: "100% Pure, No Additives", description: "Zero colouring, zero artificial fragrance." },
      { label: "Grade-1 Mongra", description: "Hand-picked for maximum crocin (colour) and safranal (aroma)." },
    ],
    variants: [{ label: "50g", grams: 50, price: 15999, mrp: 18999, stock: 6, sku: "SAF-MON-50" }],
    deliveryEstimateDays: [2, 4],
    frequentlyBoughtWith: ["pure-cow-ghee", "kashmir-mamra-almonds"],
  },
  {
    id: "p-honey",
    slug: "raw-forest-honey",
    name: "Raw Forest Honey",
    tagline: "Unheated, cold-extracted honey straight from the hive",
    description:
      "Naturally extracted and never heated above room temperature, this raw honey retains its live enzymes, pollen and natural aroma — a wholesome everyday sweetener straight from the hive.",
    origin: "India",
    processing: "Raw",
    healthBenefits: ["Immunity Boost", "Heart Health"],
    images: ["/images/products/raw-forest-honey.webp"],
    gradient: ["#c9891f", "#f0c05a"],
    rating: 4.7,
    reviewCount: 94,
    isBestSeller: false,
    discountPercent: 16,
    certifications: [
      { label: "Direct Farmer Fair Trade", description: "Sourced directly from apiary partners." },
      { label: "100% Pure, No Adulteration", description: "No added sugar syrup or glucose." },
      { label: "Raw & Unheated", description: "Cold-extracted to preserve natural enzymes." },
    ],
    variants: [
      { label: "250ml", grams: 250, price: 249, mrp: 299, stock: 40, sku: "HNY-RAW-250" },
      { label: "1L", grams: 1000, price: 799, mrp: 949, stock: 18, sku: "HNY-RAW-1000" },
    ],
    deliveryEstimateDays: [2, 4],
    frequentlyBoughtWith: ["kashmir-mamra-almonds", "pure-cow-ghee"],
  },
  {
    id: "p-almond-afghani",
    slug: "afghani-gurbandi-almonds",
    name: "Afghani Gurbandi Almonds",
    tagline: "Slim, sweet almonds from the Gurbandi valley",
    description:
      "Grown in the Gurbandi valley of Afghanistan, these slim-shelled almonds are prized for their delicate sweetness and soft bite — a traditional favourite across South Asian kitchens.",
    origin: "Afghanistan",
    processing: "Raw",
    healthBenefits: ["Heart Health", "High Protein"],
    images: ["/images/products/afghani-gurbandi-almonds.webp"],
    gradient: ["#7a5a3f", "#c9a887"],
    rating: 4.6,
    reviewCount: 129,
    isBestSeller: false,
    discountPercent: 16,
    certifications: [
      { label: "Direct Farmer Fair Trade", description: "Sourced through certified Afghan orchard cooperatives." },
      { label: "100% Chemical-Free", description: "Sun-dried naturally, no fumigation." },
      { label: "Gurbandi Grade", description: "Hand-sorted for the thin-shell Gurbandi variety." },
    ],
    variants: [
      { label: "250g", grams: 250, price: 459, mrp: 549, stock: 24, sku: "ALM-AFG-250" },
      { label: "500g", grams: 500, price: 869, mrp: 1049, stock: 12, sku: "ALM-AFG-500" },
      { label: "1kg", grams: 1000, price: 1649, mrp: 1999, stock: 5, sku: "ALM-AFG-1000" },
    ],
    deliveryEstimateDays: [3, 5],
    frequentlyBoughtWith: ["kashmiri-walnut-kernels", "pure-cow-ghee"],
  },
  {
    id: "p-almond-mamra",
    slug: "kashmir-mamra-almonds",
    name: "Kashmir Mamra Almonds",
    tagline: "Wild-harvested, cold-pressed oil-rich almonds",
    description:
      "Hand-picked from the Mamra orchards of Kashmir, these almonds are prized for their dense, oil-rich kernel and distinct sweet aroma. Sun-dried naturally with zero chemical treatment.",
    origin: "Kashmir",
    processing: "Raw",
    healthBenefits: ["Heart Health", "Keto Friendly", "High Protein"],
    images: ["/images/products/kashmir-mamra-almonds.webp"],
    gradient: ["#8a6a4f", "#d4a373"],
    rating: 4.8,
    reviewCount: 312,
    isBestSeller: true,
    discountPercent: 17,
    certifications: [
      { label: "Direct Farmer Fair Trade", description: "Sourced directly from Kashmiri orchard families." },
      { label: "100% Chemical-Free", description: "No fumigation, bleaching, or artificial preservatives." },
      { label: "42% Oil Content", description: "Lab-verified for premium Mamra-grade richness." },
    ],
    variants: [
      { label: "250g", grams: 250, price: 579, mrp: 699, stock: 27, sku: "ALM-MAM-250" },
      { label: "500g", grams: 500, price: 1099, mrp: 1349, stock: 14, sku: "ALM-MAM-500" },
      { label: "1kg", grams: 1000, price: 2099, mrp: 2599, stock: 6, sku: "ALM-MAM-1000" },
    ],
    deliveryEstimateDays: [2, 4],
    frequentlyBoughtWith: ["kashmiri-walnut-kernels", "kashmiri-mongra-saffron"],
  },
  {
    id: "p-ghee-cow",
    slug: "pure-cow-ghee",
    name: "Pure Cow Ghee",
    tagline: "A2 bilona-method cow ghee, slow-churned",
    description:
      "Made using the traditional bilona method from A2 cow milk, this ghee is slow-churned in small batches for a rich, nutty aroma and golden-grain texture — the way ghee was made generations ago.",
    origin: "India",
    processing: "Traditional",
    healthBenefits: ["Keto Friendly", "Heart Health"],
    images: ["/images/products/pure-cow-ghee.webp"],
    gradient: ["#c9a227", "#e4c563"],
    rating: 4.8,
    reviewCount: 156,
    isBestSeller: true,
    discountPercent: 13,
    certifications: [
      { label: "Direct Farmer Fair Trade", description: "Sourced from small-scale A2 gaushalas." },
      { label: "100% Pure, No Adulteration", description: "No vanaspati, palm oil or added colour." },
      { label: "Bilona Method", description: "Traditionally hand-churned from cultured cream, not cream separators." },
    ],
    variants: [
      { label: "250ml", grams: 250, price: 329, mrp: 379, stock: 30, sku: "GHE-COW-250" },
      { label: "1L", grams: 1000, price: 1199, mrp: 1399, stock: 12, sku: "GHE-COW-1000" },
    ],
    deliveryEstimateDays: [2, 4],
    frequentlyBoughtWith: ["kashmiri-mongra-saffron", "raw-forest-honey"],
  },
  {
    id: "p-ghee-buffalo",
    slug: "pure-buffalo-ghee",
    name: "Pure Buffalo Ghee",
    tagline: "Rich, traditionally simmered buffalo-milk ghee",
    description:
      "Slow-simmered from full-cream buffalo milk, this ghee has a paler colour and a richer, more intense texture than cow ghee — a traditional favourite for its deep flavour in everyday cooking.",
    origin: "India",
    processing: "Traditional",
    healthBenefits: ["Keto Friendly", "Heart Health"],
    images: ["/images/products/pure-buffalo-ghee.webp"],
    gradient: ["#b8860b", "#f0d878"],
    rating: 4.7,
    reviewCount: 68,
    isBestSeller: false,
    discountPercent: 13,
    certifications: [
      { label: "Direct Farmer Fair Trade", description: "Sourced from small-scale buffalo dairy farmers." },
      { label: "100% Pure, No Adulteration", description: "No vanaspati, palm oil or added colour." },
      { label: "Traditional Simmering", description: "Slow-simmered in small batches for authentic flavour." },
    ],
    variants: [
      { label: "250ml", grams: 250, price: 349, mrp: 399, stock: 28, sku: "GHE-BUF-250" },
      { label: "1L", grams: 1000, price: 1299, mrp: 1499, stock: 10, sku: "GHE-BUF-1000" },
    ],
    deliveryEstimateDays: [2, 4],
    frequentlyBoughtWith: ["pure-cow-ghee", "kashmiri-walnut-kernels"],
  },
  {
    id: "p-walnut-kashmiri",
    slug: "kashmiri-walnut-kernels",
    name: "Kashmiri Walnut Kernels",
    tagline: "Light amber halves, cracked fresh to order",
    description:
      "Premium light-amber walnut kernels cracked fresh from Kashmiri orchards, prized for their thin skin, low bitterness, and high omega-3 content.",
    origin: "Kashmir",
    processing: "Raw",
    healthBenefits: ["Heart Health", "Keto Friendly", "Diabetic Friendly"],
    images: ["/images/products/kashmiri-walnut-kernels.webp"],
    gradient: ["#c9a887", "#8a6a4f"],
    rating: 4.6,
    reviewCount: 143,
    isBestSeller: true,
    discountPercent: 16,
    certifications: [
      { label: "Direct Farmer Fair Trade", description: "Sourced from family-run Kashmiri orchards." },
      { label: "100% Chemical-Free", description: "Air-dried, no bleaching agents." },
      { label: "Light Amber Grade", description: "Premium color grade with low bitterness." },
    ],
    variants: [
      { label: "250g", grams: 250, price: 539, mrp: 639, stock: 25, sku: "WAL-KSH-250" },
      { label: "500g", grams: 500, price: 1029, mrp: 1229, stock: 13, sku: "WAL-KSH-500" },
      { label: "1kg", grams: 1000, price: 1949, mrp: 2349, stock: 7, sku: "WAL-KSH-1000" },
    ],
    deliveryEstimateDays: [3, 5],
    frequentlyBoughtWith: ["kashmir-mamra-almonds", "raw-forest-honey"],
  },
];

export function getMockProductBySlug(slug: string): Product | undefined {
  return MOCK_PRODUCTS.find((product) => product.slug === slug);
}

/** Matches by `slug` (wishlist/recently-viewed store slugs, the only identifier the real API can look products up by). */
export function getMockProductsByIds(slugs: string[]): Product[] {
  return slugs
    .map((slug) => MOCK_PRODUCTS.find((product) => product.slug === slug))
    .filter((product): product is Product => Boolean(product));
}
