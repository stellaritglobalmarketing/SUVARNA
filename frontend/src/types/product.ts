export type ProductOrigin = "Kashmir" | "California" | "Afghanistan" | "Iran" | "India";

export type ProductProcessing = "Raw" | "Smoked" | "Roasted & Salted" | "Traditional";

export type HealthBenefit =
  | "Heart Health"
  | "Keto Friendly"
  | "Diabetic Friendly"
  | "High Protein"
  | "Weight Management"
  | "Immunity Boost";

export interface WeightVariant {
  /** Backend product_variants.id — set when the product came from the API; server-side cart/wishlist need it. */
  id?: number;
  /** e.g. "100g" | "250g" | "500g" | "1kg" */
  label: string;
  grams: number;
  price: number;
  mrp: number;
  stock: number;
  sku: string;
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
  deliveryEstimateDays: [number, number];
  frequentlyBoughtWith: string[];
}

/** Everything the product page renders, from the single GET /product/:slug call. */
export interface ProductDetail extends Product {
  frequentlyBoughtWithProducts: Product[];
  similarProducts: Product[];
}

export interface ProductListParams {
  page?: number;
  pageSize?: number;
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
