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
}
