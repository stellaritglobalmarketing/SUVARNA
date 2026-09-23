import type { PaginatedResponse, Product, ProductListParams, WeightVariant } from "@/types/product";
import { MOCK_PRODUCTS, getMockProductBySlug, getMockProductsByIds } from "@/lib/data/products.mock";
import { CATEGORIES } from "@/lib/data/categories";
import { formatDiscount } from "@/lib/utils/format";
import { USE_MOCK_API } from "./config";
import { mockDelay } from "./delay";
import { apiGet, apiGetPaginated } from "./http";

// ---- Real backend response shapes (see backend/README.md — Product section) ----
// The backend's Product model doesn't carry every field this UI displays (origin,
// processing, health benefits, nutrients, lipid breakdown, certifications, ratings,
// "frequently bought with"...). Those are filled in from a deterministically-picked
// mock template per product so the existing screens keep their full richness instead
// of showing empty sections; every field the backend *does* provide (name, slug,
// description, category, images, real variants/pricing/stock) always wins.

interface BackendCategoryRef {
  id: number;
  name: string;
  slug: string;
}

interface BackendProductListItem {
  id: number;
  name: string;
  slug: string;
  short_description?: string | null;
  image_url?: string | null;
  min_price: number;
  max_price: number;
  category?: BackendCategoryRef;
  sub_category?: BackendCategoryRef;
}

interface BackendHomeProductCard {
  id: number;
  name: string;
  slug: string;
  short_description?: string | null;
  min_price: number;
  max_price: number;
  image_url?: string | null;
}

interface BackendVariant {
  id: number;
  variant_name: string;
  weight_value?: number | null;
  weight_unit?: string | null;
  sku: string;
  mrp: number;
  selling_price: number;
  is_default?: boolean | number;
  stock_quantity: number;
  in_stock: boolean;
}

interface BackendImage {
  id: number;
  image_url: string;
  alt_text?: string | null;
  sort_order?: number;
  is_primary?: number | boolean;
}

interface BackendProductDetail {
  id: number;
  name: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  brand_name?: string | null;
  category?: BackendCategoryRef;
  sub_category?: BackendCategoryRef;
  variants: BackendVariant[];
  images: BackendImage[];
}

interface BackendHomeCategory {
  id: number;
  name: string;
  slug: string;
  image_url?: string | null;
}

interface BackendHome {
  categories: BackendHomeCategory[];
  featured_products: BackendHomeProductCard[];
  best_sellers: BackendHomeProductCard[];
}

export interface HomeCategory {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
}

export interface HomeData {
  categories: HomeCategory[];
  featuredProducts: Product[];
  bestSellers: Product[];
}

/** Deterministic per-product template pick so the same product always borrows the same placeholder content. */
function pickTemplate(seed: string): Product {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return MOCK_PRODUCTS[hash % MOCK_PRODUCTS.length];
}

function weightToGrams(value?: number | null, unit?: string | null): number {
  if (!value) return 0;
  if (unit === "kg" || unit === "l") return value * 1000;
  return value;
}

function mapVariant(variant: BackendVariant): WeightVariant {
  return {
    label: variant.variant_name,
    grams: weightToGrams(variant.weight_value, variant.weight_unit),
    price: variant.selling_price,
    mrp: variant.mrp,
    stock: variant.in_stock ? variant.stock_quantity : 0,
    sku: variant.sku,
  };
}

/** Listing/home cards only give a min/max price range, not the full variant breakdown (that's detail-only), so we
 * synthesize one buyable "variant" from the starting price — full accurate options load on the product page. */
function mapSummaryToProduct(item: BackendProductListItem | BackendHomeProductCard, isBestSeller = false): Product {
  const template = pickTemplate(item.slug);
  const category = "category" in item ? item.category : undefined;
  const price = item.min_price;

  const variant: WeightVariant = {
    label: item.min_price === item.max_price ? "Standard" : `From ${item.min_price}`,
    grams: 0,
    price,
    mrp: price,
    stock: 1,
    sku: item.slug,
  };

  return {
    id: String(item.id),
    slug: item.slug,
    name: item.name,
    tagline: item.short_description || template.tagline,
    description: item.short_description || template.description,
    category: category?.slug ?? template.category,
    origin: template.origin,
    processing: template.processing,
    healthBenefits: template.healthBenefits,
    images: item.image_url ? [item.image_url] : template.images,
    gradient: template.gradient,
    rating: template.rating,
    reviewCount: template.reviewCount,
    isBestSeller,
    discountPercent: template.discountPercent,
    certifications: template.certifications,
    variants: [variant],
    nutrients: template.nutrients,
    lipidBreakdown: template.lipidBreakdown,
    deliveryEstimateDays: template.deliveryEstimateDays,
    frequentlyBoughtWith: [],
  };
}

function mapDetailToProduct(detail: BackendProductDetail): Product {
  const template = pickTemplate(detail.slug);

  const variants = detail.variants.length
    ? detail.variants.map(mapVariant)
    : [{ label: "Standard", grams: 0, price: 0, mrp: 0, stock: 0, sku: detail.slug }];

  const defaultVariant = detail.variants.find((v) => Boolean(v.is_default)) ?? detail.variants[0];
  const discountPercent = defaultVariant
    ? formatDiscount(defaultVariant.selling_price, defaultVariant.mrp)
    : template.discountPercent;

  const images = detail.images.length
    ? [...detail.images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((img) => img.image_url)
    : template.images;

  return {
    id: String(detail.id),
    slug: detail.slug,
    name: detail.name,
    tagline: detail.short_description || template.tagline,
    description: detail.description || detail.short_description || template.description,
    category: detail.category?.slug ?? template.category,
    origin: template.origin,
    processing: template.processing,
    healthBenefits: template.healthBenefits,
    images,
    gradient: template.gradient,
    rating: template.rating,
    reviewCount: template.reviewCount,
    isBestSeller: template.isBestSeller,
    discountPercent,
    certifications: template.certifications,
    variants,
    nutrients: template.nutrients,
    lipidBreakdown: template.lipidBreakdown,
    deliveryEstimateDays: template.deliveryEstimateDays,
    frequentlyBoughtWith: [],
  };
}

function mapSort(sort?: ProductListParams["sort"]): string | undefined {
  switch (sort) {
    case "price-asc":
      return "price_asc";
    case "price-desc":
      return "price_desc";
    case "newest":
      return "latest";
    default:
      // The backend has no "rating"/"popularity" sort concept — leave unset and let it use its own default.
      return undefined;
  }
}

/** Origin/processing/health-benefit/weight facets have no backend equivalent — applied client-side on the fetched page. */
function applyClientOnlyFilters(items: Product[], params: ProductListParams): Product[] {
  let result = items;
  if (params.origins?.length) result = result.filter((p) => params.origins!.includes(p.origin));
  if (params.processing?.length) result = result.filter((p) => params.processing!.includes(p.processing));
  if (params.healthBenefits?.length) {
    result = result.filter((p) => p.healthBenefits.some((benefit) => params.healthBenefits!.includes(benefit)));
  }
  if (params.weights?.length) {
    result = result.filter((p) => p.variants.some((variant) => params.weights!.includes(variant.label)));
  }
  return result;
}

/**
 * Paginated product listing — the function TanStack Query's `useProducts`
 * hook calls. Same signature will work once USE_MOCK_API flips to false.
 */
export async function fetchProducts(params: ProductListParams = {}): Promise<PaginatedResponse<Product>> {
  if (USE_MOCK_API) return fetchProductsMock(params);

  const { page = 1, pageSize = 8, category, search, priceMin, priceMax, sort } = params;
  const { data, pagination } = await apiGetPaginated<BackendProductListItem[]>("/product", {
    page: String(page),
    limit: String(pageSize),
    category: category || undefined,
    search: search || undefined,
    min_price: priceMin != null ? String(priceMin) : undefined,
    max_price: priceMax != null ? String(priceMax) : undefined,
    sort: mapSort(sort),
  });

  const items = applyClientOnlyFilters(
    data.map((item) => mapSummaryToProduct(item)),
    params,
  );

  return {
    items,
    page: pagination?.current_page ?? page,
    pageSize: pagination?.per_page ?? pageSize,
    total: pagination?.total ?? items.length,
    totalPages: pagination?.total_pages ?? 1,
  };
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
  if (USE_MOCK_API) {
    await mockDelay();
    const product = getMockProductBySlug(slug);
    if (!product) throw new Error(`Product not found: ${slug}`);
    return product;
  }
  const detail = await apiGet<BackendProductDetail>(`/product/${slug}`);
  return mapDetailToProduct(detail);
}

/** No dedicated "best sellers" endpoint exists — it's one of the arrays `GET /product/home` returns. */
export async function fetchBestSellers(limit = 4): Promise<Product[]> {
  if (USE_MOCK_API) {
    await mockDelay(300);
    return MOCK_PRODUCTS.filter((product) => product.isBestSeller).slice(0, limit);
  }
  const home = await apiGet<BackendHome>("/product/home");
  return home.best_sellers.slice(0, limit).map((item) => mapSummaryToProduct(item, true));
}

/** Wishlist/recently-viewed store product `slug`s (the only identifier the real API can look products up by). */
export async function fetchProductsByIds(slugs: string[]): Promise<Product[]> {
  if (slugs.length === 0) return [];
  if (USE_MOCK_API) {
    await mockDelay(200);
    return getMockProductsByIds(slugs);
  }
  const settled = await Promise.allSettled(slugs.map((slug) => fetchProductBySlug(slug)));
  return settled
    .filter((result): result is PromiseFulfilledResult<Product> => result.status === "fulfilled")
    .map((result) => result.value);
}

export async function fetchHome(): Promise<HomeData> {
  if (USE_MOCK_API) {
    await mockDelay(300);
    return {
      categories: CATEGORIES.map((cat, index) => ({ id: index, name: cat.label, slug: cat.category, imageUrl: cat.image })),
      featuredProducts: MOCK_PRODUCTS.slice(0, 8),
      bestSellers: MOCK_PRODUCTS.filter((product) => product.isBestSeller).slice(0, 8),
    };
  }
  const home = await apiGet<BackendHome>("/product/home");
  return {
    categories: home.categories.map((cat) => ({ id: cat.id, name: cat.name, slug: cat.slug, imageUrl: cat.image_url ?? null })),
    featuredProducts: home.featured_products.map((item) => mapSummaryToProduct(item)),
    bestSellers: home.best_sellers.map((item) => mapSummaryToProduct(item, true)),
  };
}

async function fetchProductsMock(params: ProductListParams): Promise<PaginatedResponse<Product>> {
  await mockDelay();

  const { page = 1, pageSize = 8, category, search, priceMin, priceMax, weights, origins, processing, healthBenefits, sort } =
    params;

  let items = [...MOCK_PRODUCTS];

  if (category) items = items.filter((product) => product.category === category);

  if (search) {
    const query = search.trim().toLowerCase();
    items = items.filter(
      (product) => product.name.toLowerCase().includes(query) || product.tagline.toLowerCase().includes(query),
    );
  }

  if (origins?.length) items = items.filter((product) => origins.includes(product.origin));
  if (processing?.length) items = items.filter((product) => processing.includes(product.processing));
  if (healthBenefits?.length) {
    items = items.filter((product) => product.healthBenefits.some((benefit) => healthBenefits.includes(benefit)));
  }
  if (weights?.length) {
    items = items.filter((product) => product.variants.some((variant) => weights.includes(variant.label)));
  }
  if (priceMin != null || priceMax != null) {
    items = items.filter((product) => {
      const startingPrice = Math.min(...product.variants.map((variant) => variant.price));
      if (priceMin != null && startingPrice < priceMin) return false;
      if (priceMax != null && startingPrice > priceMax) return false;
      return true;
    });
  }

  items = sortProducts(items, sort);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
  };
}

function sortProducts(items: Product[], sort?: ProductListParams["sort"]): Product[] {
  const sorted = [...items];
  const startingPrice = (product: Product) => Math.min(...product.variants.map((variant) => variant.price));

  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => startingPrice(a) - startingPrice(b));
    case "price-desc":
      return sorted.sort((a, b) => startingPrice(b) - startingPrice(a));
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "newest":
      return sorted.reverse();
    case "popularity":
    default:
      return sorted.sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller) || b.reviewCount - a.reviewCount);
  }
}
