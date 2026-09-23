export type ProductOrigin = "Kashmir" | "California" | "Afghanistan" | "Iran" | "India";

export type ProductProcessing = "Raw" | "Smoked" | "Roasted & Salted" | "Traditional";

export type HealthBenefit =
  | "Heart Health"
  | "Keto Friendly"
  | "Diabetic Friendly"
  | "High Protein"
  | "Weight Management"
  | "Immunity Boost";

/**
 * The real backend's categories are dynamic, admin-managed rows (see
 * backend/README.md's Category/Sub-category admin APIs) rather than a fixed
 * set, so this is a plain string — the category's slug — instead of a
 * closed union. Existing lookups keyed by the old union values (e.g.
 * StorageTips) simply fall back to their generic copy for slugs they don't
 * recognise.
 */
export type ProductCategory = string;

export interface WeightVariant {
  /** e.g. "100g" | "250g" | "500g" | "1kg" */
  label: string;
  grams: number;
  price: number;
  mrp: number;
  stock: number;
  sku: string;
}

export interface NutrientInfo {
  label: string;
  valuePer100g: string;
  dailyValuePercent?: number;
}

export interface LipidBreakdownItem {
  label: string;
  percent: number;
  color: string;
}

export interface Certification {
  label: string;
  description: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: ProductCategory;
  origin: ProductOrigin;
  processing: ProductProcessing;
  healthBenefits: HealthBenefit[];
  images: string[];
  gradient: [string, string];
  rating: number;
  reviewCount: number;
  isBestSeller: boolean;
  discountPercent: number;
  certifications: Certification[];
  variants: WeightVariant[];
  nutrients: NutrientInfo[];
  lipidBreakdown: LipidBreakdownItem[];
  deliveryEstimateDays: [number, number];
  frequentlyBoughtWith: string[];
}

export interface ProductListParams {
  page?: number;
  pageSize?: number;
  category?: ProductCategory;
  search?: string;
  priceMin?: number;
  priceMax?: number;
  weights?: string[];
  origins?: ProductOrigin[];
  processing?: ProductProcessing[];
  healthBenefits?: HealthBenefit[];
  sort?: "popularity" | "price-asc" | "price-desc" | "rating" | "newest";
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
