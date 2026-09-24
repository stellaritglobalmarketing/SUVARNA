export interface CartLineItem {
  /** Composite key: `${productId}__${variantLabel}` */
  lineId: string;
  productId: string;
  productSlug: string;
  productName: string;
  image: string;
  variantLabel: string;
  unitPrice: number;
  unitMrp: number;
  quantity: number;
  /** Backend product_variants.id — needed to sync the line to the server cart. Absent for mock-data products. */
  variantId?: number;
  /** Backend cart row id, once the line exists in the logged-in customer's server cart. */
  serverId?: number;
}
