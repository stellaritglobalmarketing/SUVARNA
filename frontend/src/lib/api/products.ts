import type {
  HealthBenefit,
  PaginatedResponse,
  Product,
  ProductListParams,
  ProductDetail,
  ProductOrigin,
  ProductProcessing,
  WeightVariant,
} from "@/types/product";
import type { HomeBanner, HomeData } from "@/types/home";
import { MOCK_PRODUCTS, getMockProductBySlug, getMockProductsByIds } from "@/lib/data/products.mock";
import {
  MOCK_FAQS,
  MOCK_HAMPERS,
  MOCK_HERO,
  MOCK_HERO_HIGHLIGHTS,
  MOCK_PROMO,
  MOCK_TESTIMONIALS,
  MOCK_TRUST_BADGES,
  MOCK_TRUST_POINTS,
} from "@/lib/data/home.mock";
import { USE_MOCK_API } from "./config";
import { mockDelay } from "./delay";
import { apiGet, apiGetPaginated } from "./http";

// ---- Real backend response shapes (see backend/README.md — Product section) ----
// Home, listing/search and detail all return the same full product card (mapCardToProduct).

interface BackendHomeProductCard {
  id: number;
  name: string;
  slug: string;
  short_description?: string | null;
  min_price: number;
  max_price: number;
  image_url?: string | null;
}

interface BackendCardVariant {
  id: number;
  variant_name: string;
  weight_value?: number | null;
  weight_unit?: string | null;
  sku: string;
  mrp: number;
  selling_price: number;
  is_default: boolean;
  available_quantity: number;
  in_stock: boolean;
}

/** Full storefront card from GET /product/home — carries everything ProductCard renders. */
interface BackendProductCard extends BackendHomeProductCard {
  description?: string | null;
  origin?: string | null;
  processing?: string | null;
  health_benefits: string[];
  certifications: { label: string; description: string }[];
  rating: number;
  review_count: number;
  is_bestseller: boolean;
  discount_percent: number;
  delivery_estimate_days: [number, number];
  images: string[];
  variants: BackendCardVariant[];
}

/** GET /product/:slug — the full card plus product-page-only data. */
interface BackendProductDetail extends BackendProductCard {
  nutrients: { label: string; value_per_100g: string; daily_value_percent: number | null }[];
  lipid_profile: { label: string; percent: number; color: string }[];
  storage_tips: { shelf_life: string | null; storage: string | null; usage: string | null } | null;
  frequently_bought_with: BackendProductCard[];
  similar_products: BackendProductCard[];
}

interface BackendHomeLink {
  label: string;
  href: string;
}

interface BackendHomeBanner {
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  image_url: string;
  image_alt: string | null;
  cta: BackendHomeLink | null;
  secondary_cta: BackendHomeLink | null;
}

interface BackendHomeHighlight {
  icon: string;
  title: string;
  description: string | null;
}

interface BackendHome {
  hero: BackendHomeBanner | null;
  promo: BackendHomeBanner | null;
  highlights: {
    hero: BackendHomeHighlight[];
    trust_badges: BackendHomeHighlight[];
    trust_points: BackendHomeHighlight[];
  };
  products: BackendProductCard[];
  featured_products: BackendProductCard[];
  best_sellers: BackendProductCard[];
  hampers: { slug: string; name: string; subtitle: string | null; image_url: string | null; product_slugs: string[] }[];
  testimonials: { name: string; location: string | null; rating: number; quote: string }[];
  faqs: { question: string; answer: string }[];
}

function weightToGrams(value?: number | null, unit?: string | null): number {
  if (!value) return 0;
  if (unit === "kg" || unit === "l") return value * 1000;
  return value;
}

function mapSort(sort?: ProductListParams["sort"]): string | undefined {
  switch (sort) {
    case "price-asc":
      return "price_asc";
    case "price-desc":
      return "price_desc";
    case "newest":
      return "latest";
    case "popularity":
    default:
      // The storefront's own ordering (products.sort_order), same as the home grid.
      return "featured";
  }
}

/** Origin/processing/health-benefit/weight facets aren't query params on the backend — applied client-side on the fetched page. */
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
 * Paginated product listing / search — the function TanStack Query's `useProducts` hook calls.
 */
export async function fetchProducts(params: ProductListParams = {}): Promise<PaginatedResponse<Product>> {
  if (USE_MOCK_API) return fetchProductsMock(params);

  const { page = 1, pageSize = 8, search, priceMin, priceMax, sort } = params;
  const { data, pagination } = await apiGetPaginated<BackendProductCard[]>("/product", {
    page: String(page),
    limit: String(pageSize),
    search: search || undefined,
    min_price: priceMin != null ? String(priceMin) : undefined,
    max_price: priceMax != null ? String(priceMax) : undefined,
    sort: mapSort(sort),
  });

  const items = applyClientOnlyFilters(data.map(mapCardToProduct), params);

  return {
    items,
    page: pagination?.current_page ?? page,
    pageSize: pagination?.per_page ?? pageSize,
    total: pagination?.total ?? items.length,
    totalPages: pagination?.total_pages ?? 1,
  };
}

/** Everything the product page shows, from the single GET /product/:slug call. */
export async function fetchProductBySlug(slug: string): Promise<ProductDetail> {
  if (USE_MOCK_API) {
    await mockDelay();
    const product = getMockProductBySlug(slug);
    if (!product) throw new Error(`Product not found: ${slug}`);
    return {
      ...product,
      storageTips: null,
      frequentlyBoughtWithProducts: getMockProductsByIds(product.frequentlyBoughtWith),
      similarProducts: MOCK_PRODUCTS.filter((p) => p.slug !== product.slug).slice(0, 4),
    };
  }
  const detail = await apiGet<BackendProductDetail>(`/product/${encodeURIComponent(slug)}`);
  return mapDetailToProduct(detail);
}

/** No dedicated "best sellers" endpoint exists — it's one of the arrays `GET /product/home` returns. */
export async function fetchBestSellers(limit = 4): Promise<Product[]> {
  if (USE_MOCK_API) {
    await mockDelay(300);
    return MOCK_PRODUCTS.filter((product) => product.isBestSeller).slice(0, limit);
  }
  const home = await apiGet<BackendHome>("/product/home");
  return home.best_sellers.slice(0, limit).map(mapCardToProduct);
}

/** Wishlist/recently-viewed store product `slug`s — fetched in one call, returned in the same order. */
export async function fetchProductsByIds(slugs: string[]): Promise<Product[]> {
  if (slugs.length === 0) return [];
  if (USE_MOCK_API) {
    await mockDelay(200);
    return getMockProductsByIds(slugs);
  }
  const { data } = await apiGetPaginated<BackendProductCard[]>("/product", {
    slugs: slugs.join(","),
    limit: String(slugs.length),
  });
  const bySlug = new Map(data.map((card) => [card.slug, mapCardToProduct(card)]));
  return slugs.map((slug) => bySlug.get(slug)).filter((product): product is Product => Boolean(product));
}

const FALLBACK_GRADIENT: [string, string] = ["#8a6a4f", "#d4a373"];

/** Home/detail cards carry every field the card design shows, so no mock template is needed here. PDP-only
 * data (nutrients, lipid breakdown, "frequently bought with") is added by mapDetailToProduct. */
function mapCardToProduct(card: BackendProductCard): Product {
  const variants: WeightVariant[] = card.variants.length
    ? card.variants.map((variant) => ({
        id: variant.id,
        label: variant.variant_name,
        grams: weightToGrams(variant.weight_value, variant.weight_unit),
        price: variant.selling_price,
        mrp: variant.mrp,
        stock: variant.in_stock ? variant.available_quantity : 0,
        sku: variant.sku,
      }))
    : [{ label: "Standard", grams: 0, price: card.min_price, mrp: card.min_price, stock: 0, sku: card.slug }];

  return {
    id: String(card.id),
    slug: card.slug,
    name: card.name,
    tagline: card.short_description || "",
    description: card.description || card.short_description || "",
    origin: (card.origin ?? "India") as ProductOrigin,
    processing: (card.processing ?? "Raw") as ProductProcessing,
    healthBenefits: card.health_benefits as HealthBenefit[],
    images: card.images.length ? card.images : card.image_url ? [card.image_url] : [],
    // Placeholder colours behind a missing product photo — a storefront design choice, not product data.
    gradient: FALLBACK_GRADIENT,
    rating: card.rating,
    reviewCount: card.review_count,
    isBestSeller: card.is_bestseller,
    discountPercent: card.discount_percent,
    certifications: card.certifications,
    variants,
    nutrients: [],
    lipidBreakdown: [],
    deliveryEstimateDays: card.delivery_estimate_days,
    frequentlyBoughtWith: [],
  };
}

function mapDetailToProduct(detail: BackendProductDetail): ProductDetail {
  const tips = detail.storage_tips;
  return {
    ...mapCardToProduct(detail),
    nutrients: detail.nutrients.map((n) => ({
      label: n.label,
      valuePer100g: n.value_per_100g,
      dailyValuePercent: n.daily_value_percent ?? undefined,
    })),
    lipidBreakdown: detail.lipid_profile,
    frequentlyBoughtWith: detail.frequently_bought_with.map((companion) => companion.slug),
    storageTips: tips ? { shelfLife: tips.shelf_life, storage: tips.storage, usage: tips.usage } : null,
    frequentlyBoughtWithProducts: detail.frequently_bought_with.map(mapCardToProduct),
    similarProducts: detail.similar_products.map(mapCardToProduct),
  };
}

function mapBanner(banner: BackendHomeBanner | null): HomeBanner | null {
  if (!banner) return null;
  return {
    eyebrow: banner.eyebrow,
    title: banner.title,
    subtitle: banner.subtitle,
    imageUrl: banner.image_url,
    imageAlt: banner.image_alt ?? banner.title,
    cta: banner.cta,
    secondaryCta: banner.secondary_cta,
  };
}

/** Everything the home page renders, from the single GET /product/home call. */
export async function fetchHome(): Promise<HomeData> {
  if (USE_MOCK_API) {
    await mockDelay(300);
    return {
      hero: MOCK_HERO,
      promo: MOCK_PROMO,
      heroHighlights: MOCK_HERO_HIGHLIGHTS,
      trustBadges: MOCK_TRUST_BADGES,
      trustPoints: MOCK_TRUST_POINTS,
      products: MOCK_PRODUCTS,
      featuredProducts: MOCK_PRODUCTS.slice(0, 8),
      bestSellers: MOCK_PRODUCTS.filter((product) => product.isBestSeller).slice(0, 8),
      hampers: MOCK_HAMPERS,
      testimonials: MOCK_TESTIMONIALS,
      faqs: MOCK_FAQS,
    };
  }
  const home = await apiGet<BackendHome>("/product/home");
  return {
    hero: mapBanner(home.hero),
    promo: mapBanner(home.promo),
    heroHighlights: home.highlights.hero,
    trustBadges: home.highlights.trust_badges,
    trustPoints: home.highlights.trust_points,
    products: home.products.map(mapCardToProduct),
    featuredProducts: home.featured_products.map(mapCardToProduct),
    bestSellers: home.best_sellers.map(mapCardToProduct),
    hampers: home.hampers.map((hamper) => ({
      slug: hamper.slug,
      name: hamper.name,
      subtitle: hamper.subtitle,
      imageUrl: hamper.image_url,
      productSlugs: hamper.product_slugs,
    })),
    testimonials: home.testimonials,
    faqs: home.faqs,
  };
}

async function fetchProductsMock(params: ProductListParams): Promise<PaginatedResponse<Product>> {
  await mockDelay();

  const { page = 1, pageSize = 8, search, priceMin, priceMax, weights, origins, processing, healthBenefits, sort } =
    params;

  let items = [...MOCK_PRODUCTS];

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
