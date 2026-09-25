import { getToken } from "@/lib/auth/token";
import { API_BASE_URL, API_KEY } from "./config";
import { ApiError, apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost, apiPut, type PaginationMeta } from "./http";

/**
 * Typed client for the admin API (backend/README.md — Admin). Every call needs an admin token,
 * which lib/api/http.ts attaches from the stored session.
 */

export interface Paged<T> {
  items: T[];
  pagination?: PaginationMeta;
}

type Query = Record<string, string | number | undefined | null | boolean>;

function toParams(query: Query): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(query).map(([key, value]) => [key, value === undefined || value === null || value === "" ? undefined : String(value)]),
  );
}

async function paged<T>(path: string, query: Query = {}): Promise<Paged<T>> {
  const { data, pagination } = await apiGetPaginated<T[]>(path, toParams(query));
  return { items: data, pagination };
}

// ============================================================================ constants (mirror the backend)

export const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
export const FULFILLMENT_STATUSES = ["unfulfilled", "processing", "fulfilled"] as const;
/** Allowed next order_status values (backend/modules/v1/validators/admin-order-validation.js). */
export const ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};
export const SHIPMENT_STATUSES = [
  "created",
  "pickup_scheduled",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "failed",
  "rto",
  "cancelled",
] as const;
export const WEIGHT_UNITS = ["g", "kg", "ml", "l", "pcs"] as const;
export const HIGHLIGHT_ICONS = ["badge-check", "heart-pulse", "leaf", "package-check", "shield-check", "sprout", "truck", "users"] as const;

// ============================================================================ dashboard

export interface Dashboard {
  total_users: number;
  total_active_products: number;
  total_orders: number;
  total_revenue: number;
  revenue_last_30_days: number;
  paid_orders: number;
  orders_today: number;
  awaiting_payment: number;
  pending_reviews: number;
  low_stock_variants: number;
  pending_orders: number;
  confirmed_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  recent_orders: { order_number: string; customer_name: string; total_amount: number; order_status: string; payment_status: string; created_at: string }[];
}

export const getDashboard = () => apiGet<Dashboard>("/admin/dashboard");

// ============================================================================ orders

export interface AdminOrderRow {
  id: number;
  order_number: string;
  customer: { name: string; phone: string; email: string | null };
  total_amount: number;
  order_status: string;
  payment_status: string;
  fulfillment_status: string;
  created_at: string;
}

export interface AdminShipment {
  id: number;
  provider: string;
  awb_number: string | null;
  courier_name: string | null;
  tracking_url: string | null;
  shipping_charge: number;
  shipment_status: string;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface AdminOrder {
  order_number: string;
  customer: { id: number; name: string; phone: string; email: string | null };
  shipping_address: {
    name: string;
    phone: string;
    address_line1: string;
    address_line2: string | null;
    landmark: string | null;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  tax_amount: number;
  total_amount: number;
  order_status: string;
  payment_status: string;
  fulfillment_status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  shipments: AdminShipment[];
  items: {
    product_id: number | null;
    product_variant_id: number | null;
    product_name: string;
    variant_name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    image_url: string | null;
  }[];
}

export const getOrders = (query: Query) => paged<AdminOrderRow>("/admin/order", query);
export const getOrder = (orderNumber: string) => apiGet<AdminOrder>(`/admin/order/${encodeURIComponent(orderNumber)}`);
export const updateOrderStatus = (
  orderNumber: string,
  body: Partial<{ order_status: string; payment_status: string; fulfillment_status: string }>,
) => apiPatch<unknown>(`/admin/order/${encodeURIComponent(orderNumber)}/status`, body);

export interface ShipmentInput {
  provider: string;
  awb_number?: string;
  courier_name?: string;
  tracking_url?: string;
  shipping_charge?: number | string;
  package_weight?: number | string;
}
export const createShipment = (orderNumber: string, body: ShipmentInput) =>
  apiPost<unknown>(`/admin/order/${encodeURIComponent(orderNumber)}/shipment`, body);

// ============================================================================ shipments

/** List rows don't include tracking_url (the order screen has it). */
export interface AdminShipmentRow extends Omit<AdminShipment, "tracking_url"> {
  order_id: number;
  order_number: string;
}
export const getShipments = (query: Query) => paged<AdminShipmentRow>("/admin/shipment", query);
export const updateShipmentStatus = (id: number, shipment_status: string) =>
  apiPatch<unknown>(`/admin/shipment/${id}/status`, { shipment_status });

// ============================================================================ customers

export interface AdminCustomer {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}
export interface AdminCustomerDetail extends AdminCustomer {
  orders: { order_number: string; total_amount: number; order_status: string; payment_status: string; fulfillment_status: string; created_at: string }[];
}
export const getCustomers = (query: Query) => paged<AdminCustomer>("/admin/customer", query);
export const getCustomer = (id: number) => apiGet<AdminCustomerDetail>(`/admin/customer/${id}`);
export const setCustomerStatus = (id: number, is_active: boolean) =>
  apiPatch<unknown>(`/admin/customer/${id}/status`, { is_active: is_active ? 1 : 0 });

// ============================================================================ products

export interface AdminProductRow {
  id: number;
  name: string;
  slug: string;
  short_description: string | null;
  brand_name: string | null;
  is_featured: boolean;
  is_bestseller: boolean;
  is_active: boolean;
  created_at: string;
  image_url: string | null;
  min_price: number | null;
  max_price: number | null;
  variant_count: number;
  available_stock: number;
}

export interface AdminVariant {
  id: number;
  variant_name: string;
  weight_value: number | null;
  weight_unit: string | null;
  sku: string;
  mrp: number;
  selling_price: number;
  is_default: boolean;
  is_active: boolean;
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_limit: number;
  available_quantity: number;
}

export interface AdminImage {
  id: number;
  variant_id: number | null;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  is_active: boolean;
}

export interface ProductContent {
  nutrients: { label: string; value_per_100g: string; daily_value_percent: number | null }[];
  lipid_profile: { label: string; percent: number; color: string }[];
  certifications: { label: string; description: string | null }[];
  health_benefits: string[];
  storage_tips: { shelf_life: string | null; storage: string | null; usage: string | null } | null;
  related_products: { id: number; name: string; slug: string }[];
}

export interface AdminProduct extends ProductContent {
  id: number;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  brand_name: string | null;
  is_featured: boolean;
  is_bestseller: boolean;
  is_active: boolean;
  origin: string | null;
  processing: string | null;
  delivery_min_days: number;
  delivery_max_days: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  variants: AdminVariant[];
  images: AdminImage[];
}

export interface ProductInput {
  name: string;
  slug?: string;
  short_description?: string;
  description?: string;
  brand_name?: string;
  origin?: string;
  processing?: string;
  delivery_min_days?: number;
  delivery_max_days?: number;
  is_featured?: number;
  is_bestseller?: number;
  sort_order?: number;
}

export interface ContentInput {
  nutrients?: ProductContent["nutrients"];
  lipid_profile?: ProductContent["lipid_profile"];
  certifications?: ProductContent["certifications"];
  health_benefits?: string[];
  storage_tips?: { shelf_life?: string | null; storage?: string | null; usage?: string | null } | null;
  related_product_ids?: number[];
}

export interface VariantInput {
  variant_name: string;
  weight_value?: number | string;
  weight_unit?: string;
  sku: string;
  mrp: number | string;
  selling_price: number | string;
  is_default?: number;
}

export const getProducts = (query: Query) => paged<AdminProductRow>("/admin/product", query);
export const getProduct = (id: number) => apiGet<AdminProduct>(`/admin/product/${id}`);
export const createProduct = (body: ProductInput) => apiPost<{ id: number; name: string; slug: string }>("/admin/product", body);
export const updateProduct = (id: number, body: ProductInput) => apiPut<unknown>(`/admin/product/${id}`, body);
export const setProductStatus = (id: number, active: boolean) => apiPatch<unknown>(`/admin/product/${id}/status`, { is_active: active ? 1 : 0 });
export const deleteProduct = (id: number) => apiDelete<unknown>(`/admin/product/${id}`);
export const updateProductContent = (id: number, body: ContentInput) => apiPut<ProductContent>(`/admin/product/${id}/content`, body);

export const createVariant = (productId: number, body: VariantInput) => apiPost<unknown>(`/admin/product/${productId}/variant`, body);
export const updateVariant = (id: number, body: VariantInput) => apiPut<unknown>(`/admin/variant/${id}`, body);
export const setVariantStatus = (id: number, active: boolean) => apiPatch<unknown>(`/admin/variant/${id}/status`, { is_active: active ? 1 : 0 });
export const deleteVariant = (id: number) => apiDelete<unknown>(`/admin/variant/${id}`);

export const createImage = (
  productId: number,
  body: { cloudinary_public_id: string; image_url: string; alt_text?: string; is_primary?: number; sort_order?: number },
) => apiPost<unknown>(`/admin/product/${productId}/image`, body);
export const updateImage = (id: number, body: { alt_text?: string; sort_order?: number }) => apiPut<unknown>(`/admin/image/${id}`, body);
export const setPrimaryImage = (id: number) => apiPatch<unknown>(`/admin/image/${id}/primary`, {});
export const deleteImage = (id: number) => apiDelete<unknown>(`/admin/image/${id}`);

// ============================================================================ inventory

export interface InventoryRow {
  variant_id: number;
  sku: string;
  variant_name: string;
  product: { id: number; name: string };
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_limit: number;
  available_quantity: number;
  is_low_stock: boolean;
}
export const getInventory = (query: Query) => paged<InventoryRow>("/admin/inventory", query);
export const setInventory = (variantId: number, body: { stock_quantity: number; low_stock_limit?: number }) =>
  apiPut<unknown>(`/admin/inventory/${variantId}`, body);
export const adjustInventory = (variantId: number, body: { quantity: number; type: "add" | "remove"; reason?: string }) =>
  apiPatch<unknown>(`/admin/inventory/${variantId}/adjust`, body);

// ============================================================================ reviews

export interface AdminReview {
  id: number;
  rating: number;
  title: string | null;
  review_text: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
  product: { id: number; name: string; slug: string };
  customer: { id: number; name: string; phone: string };
}
export const getReviews = (query: Query) => paged<AdminReview>("/admin/review", query);
export const setReviewApproved = (id: number, approved: boolean) =>
  apiPatch<unknown>(`/admin/review/${id}/status`, { is_approved: approved ? 1 : 0 });
export const deleteReview = (id: number) => apiDelete<unknown>(`/admin/review/${id}`);

// ============================================================================ home content

export type ContentResource = "banners" | "highlights" | "hampers" | "testimonials" | "faqs";
export type ContentItem = Record<string, unknown> & { id: number; is_active: boolean };

export const getContent = (resource: ContentResource) => apiGet<ContentItem[]>(`/admin/content/${resource}`);
export const createContent = (resource: ContentResource, body: Record<string, unknown>) =>
  apiPost<{ id: number }>(`/admin/content/${resource}`, body);
export const updateContent = (resource: ContentResource, id: number, body: Record<string, unknown>) =>
  apiPut<{ id: number }>(`/admin/content/${resource}/${id}`, body);
export const setContentStatus = (resource: ContentResource, id: number, active: boolean) =>
  apiPatch<unknown>(`/admin/content/${resource}/${id}/status`, { is_active: active ? 1 : 0 });
export const deleteContent = (resource: ContentResource, id: number) => apiDelete<unknown>(`/admin/content/${resource}/${id}`);

// ============================================================================ uploads

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Uploads an image file; returns its public URL and the id to store with it. */
export async function uploadImage(file: File): Promise<{ url: string; public_id: string }> {
  if (!UPLOAD_TYPES.includes(file.type)) throw new ApiError("Choose a JPEG, PNG, WebP or AVIF image.", 0, 2);
  if (file.size > MAX_UPLOAD_BYTES) throw new ApiError("Image is larger than 5 MB.", 0, 2);

  const headers: Record<string, string> = { "Content-Type": file.type };
  if (API_KEY) headers["api-key"] = API_KEY;
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/admin/upload`, { method: "POST", headers, body: file });
  } catch {
    throw new ApiError("Unable to reach the server. Check your connection and try again.", 0, 0);
  }
  const envelope = (await res.json().catch(() => null)) as { code: number; message?: string; data?: { url: string; public_id: string } } | null;
  if (!res.ok || !envelope || envelope.code !== 1 || !envelope.data) {
    throw new ApiError(envelope?.message || "Upload failed.", res.status, envelope?.code ?? 0);
  }
  return envelope.data;
}
