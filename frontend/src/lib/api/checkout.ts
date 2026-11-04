import type { AuthSession } from "@/types/auth";
import { guestOrderHeaders } from "@/lib/auth/guestOrders";
import { apiGet, apiPost, downloadFile } from "./http";

/**
 * Checkout = three calls (see backend/README.md — Order and Payment):
 *   1. placeOrder: turns the server cart into a pending order (holds stock, empties the cart)
 *   2. createPaymentOrder: gets the Razorpay order to open Checkout with (amount comes from the server)
 *   3. verifyPayment: hands Razorpay's success response back so the server can confirm and mark it paid
 * A guest starts with placeGuestOrder instead of 1. Each later call sends the order's guest token when this browser holds one.
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
      key_id: string;
      razorpay_order_id: string;
      /** In paise. */
      amount: number;
      currency: string;
      name: string;
      description: string;
      prefill: { name: string; email: string; contact: string };
    };

export interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/** What verify and sync report. `session` logs a guest into the account their order just created, once. */
export interface PaymentStatus {
  order_number: string;
  order_status: string;
  payment_status: string;
  session?: AuthSession;
}

export interface GuestOrderInput {
  name: string;
  phone: string;
  email: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  items: { product_variant_id: number; quantity: number }[];
  /** The total the customer is looking at; the server refuses the order if prices have moved. */
  expected_subtotal: number;
}

export interface OrderDetail {
  order_number: string;
  /** Whether a paid guest order has joined an account yet. */
  has_account: boolean;
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

export async function placeGuestOrder(input: GuestOrderInput): Promise<PlacedOrder & { guest_token: string }> {
  return apiPost<PlacedOrder & { guest_token: string }>("/order/guest", input);
}

export async function createPaymentOrder(orderNumber: string): Promise<PaymentOrder> {
  return apiPost<PaymentOrder>("/payment/razorpay/order", { order_number: orderNumber }, guestOrderHeaders(orderNumber));
}

/**
 * Asks the backend to re-check an unpaid order with Razorpay. Catches payments whose success callback
 * never ran (e.g. UPI paid in the GPay app on a phone and the checkout tab reloaded).
 */
export async function syncPayment(orderNumber: string) {
  return apiPost<PaymentStatus>("/payment/razorpay/sync", { order_number: orderNumber }, guestOrderHeaders(orderNumber));
}

export async function verifyPayment(orderNumber: string, response: RazorpaySuccess) {
  return apiPost<PaymentStatus>("/payment/razorpay/verify", { order_number: orderNumber, ...response }, guestOrderHeaders(orderNumber));
}

export async function fetchOrderDetail(orderNumber: string): Promise<OrderDetail> {
  return apiGet<OrderDetail>(`/order/${encodeURIComponent(orderNumber)}`, undefined, guestOrderHeaders(orderNumber));
}

/** Saves the PDF invoice for one of the customer's paid orders. */
export const downloadOrderInvoice = (orderNumber: string) =>
  downloadFile(`/order/${encodeURIComponent(orderNumber)}/invoice`, `Suvarna7-Invoice-${orderNumber}.pdf`, guestOrderHeaders(orderNumber));
