import type { CartLineItem } from "@/types/cart";
import { apiDelete, apiGet, apiPost, apiPut } from "./http";

/**
 * Server-side cart for a logged-in customer (see backend/README.md — Cart). Guests keep their
 * cart in Redux only; lib/redux/sync.ts merges it into the server cart on login.
 */

// ---- Real backend response shape ----
interface BackendCartItem {
  id: number;
  product_variant_id: number;
  product: { id: number; name: string; slug: string };
  variant: { id: number; variant_name: string };
  image_url: string | null;
  mrp: number;
  selling_price: number;
  quantity: number;
}

export function mapCartItem(item: BackendCartItem): CartLineItem {
  const productId = String(item.product.id);
  return {
    // Same key the storefront builds locally (product id + pack label), so server and local lines match up.
    lineId: `${productId}__${item.variant.variant_name}`,
    productId,
    productSlug: item.product.slug,
    productName: item.product.name,
    image: item.image_url ?? "",
    variantLabel: item.variant.variant_name,
    unitPrice: item.selling_price,
    unitMrp: item.mrp,
    quantity: item.quantity,
    variantId: item.product_variant_id,
    serverId: item.id,
  };
}

export async function fetchServerCart(): Promise<CartLineItem[]> {
  const data = await apiGet<{ items: BackendCartItem[] }>("/cart");
  return data.items.map(mapCartItem);
}

/** Adds `quantity` on top of whatever is already in the server cart for this variant. */
export async function addServerCartItem(variantId: number, quantity: number): Promise<CartLineItem> {
  const item = await apiPost<BackendCartItem>("/cart", { product_variant_id: variantId, quantity });
  return mapCartItem(item);
}

export async function updateServerCartItem(serverId: number, quantity: number): Promise<CartLineItem> {
  const item = await apiPut<BackendCartItem>(`/cart/${serverId}`, { quantity });
  return mapCartItem(item);
}

export async function removeServerCartItem(serverId: number): Promise<void> {
  await apiDelete<null>(`/cart/${serverId}`);
}

export async function clearServerCart(): Promise<void> {
  await apiDelete<null>("/cart");
}
