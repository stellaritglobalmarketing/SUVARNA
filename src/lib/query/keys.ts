import type { ProductListParams } from "@/types/product";

/** Central query-key factory so cache invalidation never relies on hand-typed arrays. */
export const queryKeys = {
  products: {
    all: ["products"] as const,
    list: (params: ProductListParams) => [...queryKeys.products.all, "list", params] as const,
    detail: (slug: string) => [...queryKeys.products.all, "detail", slug] as const,
    bestSellers: (limit: number) => [...queryKeys.products.all, "best-sellers", limit] as const,
    batch: (ids: string[]) => [...queryKeys.products.all, "batch", ids] as const,
  },
  reviews: {
    bySlug: (slug: string) => ["reviews", slug] as const,
  },
  orders: {
    tracking: (awb: string) => ["orders", "tracking", awb] as const,
  },
  pincode: {
    check: (pincode: string) => ["pincode", pincode] as const,
  },
} as const;
