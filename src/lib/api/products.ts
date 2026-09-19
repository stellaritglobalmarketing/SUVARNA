import type { PaginatedResponse, Product, ProductListParams } from "@/types/product";
import { MOCK_PRODUCTS, getMockProductBySlug, getMockProductsByIds } from "@/lib/data/products.mock";
import { USE_MOCK_API } from "./config";
import { mockDelay } from "./delay";
import { apiGet, toQueryString } from "./http";

/**
 * Paginated product listing — the function TanStack Query's `useProducts`
 * hook calls. Same signature will work once USE_MOCK_API flips to false.
 */
export async function fetchProducts(params: ProductListParams = {}): Promise<PaginatedResponse<Product>> {
  if (USE_MOCK_API) return fetchProductsMock(params);
  return apiGet<PaginatedResponse<Product>>(`/products${toQueryString(params)}`);
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
  if (USE_MOCK_API) {
    await mockDelay();
    const product = getMockProductBySlug(slug);
    if (!product) throw new Error(`Product not found: ${slug}`);
    return product;
  }
  return apiGet<Product>(`/products/${slug}`);
}

export async function fetchBestSellers(limit = 4): Promise<Product[]> {
  if (USE_MOCK_API) {
    await mockDelay(300);
    return MOCK_PRODUCTS.filter((product) => product.isBestSeller).slice(0, limit);
  }
  return apiGet<Product[]>(`/products/best-sellers${toQueryString({ limit })}`);
}

export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (USE_MOCK_API) {
    await mockDelay(200);
    return getMockProductsByIds(ids);
  }
  return apiGet<Product[]>(`/products/batch${toQueryString({ ids })}`);
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
