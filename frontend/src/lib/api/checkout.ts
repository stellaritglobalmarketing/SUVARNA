import { apiGet, apiPost } from "./http";

/**
 * Checkout = three calls (see backend/README.md — Order and Payment):
 *   1. placeOrder: turns the server cart into a pending order (holds stock, empties the cart)
 *   2. createPaymentOrder: gets the Razorpay order to open Checkout with (amount comes from the server)
 *   3. verifyPayment: hands Razorpay's success response back so the server can confirm and mark it paid
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
  return apiPost<PaymentOrder>("/payment/razorpay/order", { order_number: orderNumber });
}

export async function verifyPayment(orderNumber: string, response: RazorpaySuccess) {
  return apiPost<{ order_number: string; order_status: string; payment_status: string }>("/payment/razorpay/verify", {
    order_number: orderNumber,
    ...response,
  });
}

export async function fetchOrderDetail(orderNumber: string): Promise<OrderDetail> {
  return apiGet<OrderDetail>(`/order/${encodeURIComponent(orderNumber)}`);
}
