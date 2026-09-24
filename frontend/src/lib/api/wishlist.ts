import { apiDelete, apiGet, apiPut } from "./http";

/**
 * Server-side wishlist for a logged-in customer, keyed by product slug (see backend/README.md —
 * Wishlist). Guests keep theirs in Redux only; lib/redux/sync.ts merges it on login.
 */

/** Saved product slugs, most recently saved first. */
export async function fetchServerWishlistSlugs(): Promise<string[]> {
  const products = await apiGet<{ slug: string }[]>("/product/wishlist");
  return products.map((product) => product.slug);
}

export async function addServerWishlistItem(slug: string): Promise<void> {
  await apiPut<unknown>(`/product/wishlist/${encodeURIComponent(slug)}`);
}

export async function removeServerWishlistItem(slug: string): Promise<void> {
  await apiDelete<unknown>(`/product/wishlist/${encodeURIComponent(slug)}`);
}
