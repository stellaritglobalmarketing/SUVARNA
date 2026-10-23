import { apiGet, apiPost, downloadFile } from "./http";

/**
 * Checkout = three calls (see backend/README.md — Order and Payment):
 *   1. placeOrder: turns the server cart into a pending order (holds stock, empties the cart)
 *   2. createPaymentOrder: starts a Cashfree payment and returns the session its popup opens with (amount comes from the server)
 *   3. verifyPayment: after the popup closes, the server asks Cashfree how it went and marks the order paid
 */

export interface PlacedOrder {
  order_number: string;
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  tax_amount: number;
  total_amount: number;
}

export type PaymentOrder =
  | { order_number: string; already_paid: true }
  | {
      order_number: string;
      already_paid: false;
      cashfree_mode: "sandbox" | "production";
      cashfree_order_id: string;
      payment_session_id: string;
    };

export interface PaymentStatus {
  order_number: string;
  order_status: string;
  payment_status: string;
}

/** `gateway_status`: PAID, PENDING (bank still confirming), or the latest attempt's — FAILED, USER_DROPPED, … */
export type VerifyResult = PaymentStatus & { gateway_status: string; message: string };

export interface OrderDetail {
  order_number: string;
  order_status: string;
  payment_status: string;
  created_at: string;
  shipping_address: {
    name: string;
    phone: string;
    address_line1: string;
    address_line2: string | null;
    landmark: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  subtotal: number;
  shipping_amount: number;
  total_amount: number;
  items: { product_name: string; variant_name: string; quantity: number; total_price: number; image_url: string | null }[];
}

export async function placeOrder(addressId: number, notes?: string): Promise<PlacedOrder> {
  return apiPost<PlacedOrder>("/order", { address_id: addressId, notes: notes || undefined });
}

export async function createPaymentOrder(orderNumber: string): Promise<PaymentOrder> {
  return apiPost<PaymentOrder>("/payment/order", { order_number: orderNumber });
}

/**
 * Asks the backend to re-check an unpaid order with Cashfree. Catches payments whose success
 * callback never ran (e.g. UPI paid in the GPay app on a phone and the checkout tab reloaded).
 */
export async function syncPayment(orderNumber: string) {
  return apiPost<PaymentStatus>("/payment/sync", { order_number: orderNumber });
}

/** After the Cashfree popup closes: the backend asks Cashfree how the order stands. */
export async function verifyPayment(orderNumber: string) {
  return apiPost<VerifyResult>("/payment/verify", { order_number: orderNumber });
}

export async function fetchOrderDetail(orderNumber: string): Promise<OrderDetail> {
  return apiGet<OrderDetail>(`/order/${encodeURIComponent(orderNumber)}`);
}

/** Saves the PDF invoice for one of the customer's paid orders. */
export const downloadOrderInvoice = (orderNumber: string) =>
  downloadFile(`/order/${encodeURIComponent(orderNumber)}/invoice`, `Suvarna7-Invoice-${orderNumber}.pdf`);
