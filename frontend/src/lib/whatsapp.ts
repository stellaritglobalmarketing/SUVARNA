import type { OrderDetail } from "@/lib/api/checkout";
import { formatInr } from "@/lib/utils/format";

/**
 * Checkout pays online with Razorpay by default; after payment the backend sends the invoice PDF to the
 * store's WhatsApp. Set NEXT_PUBLIC_CHECKOUT_MODE=whatsapp for the fallback mode: the order is still
 * created on the server (stock held, visible in admin), but instead of opening Razorpay the customer
 * sends the order to our WhatsApp and we collect payment there. Admin marks it paid from the order page.
 */
export const IS_WHATSAPP_CHECKOUT = (process.env.NEXT_PUBLIC_CHECKOUT_MODE ?? "razorpay").trim() === "whatsapp";

/** Orders go to this number. Digits only, with country code (wa.me format). */
export const WHATSAPP_ORDER_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_ORDER_NUMBER ?? "919377716183").replace(/\D/g, "");

export const WHATSAPP_ORDER_NUMBER_DISPLAY = "+91 93777 16183";

interface Customer {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

/** Plain-text invoice for the WhatsApp message (WhatsApp renders *bold*). */
export function buildOrderMessage(order: OrderDetail, customer?: Customer, notes?: string): string {
  const address = order.shipping_address;
  const placedOn = new Date(order.created_at).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const lines: string[] = [
    "*New Order — Suvarna7*",
    "",
    `*Invoice / Order No:* ${order.order_number}`,
    `*Date:* ${placedOn}`,
    "",
    "*Items*",
    ...order.items.map(
      (item, index) => `${index + 1}. ${item.product_name} (${item.variant_name}) × ${item.quantity} = ${formatInr(item.total_price)}`,
    ),
    "",
    `Subtotal: ${formatInr(order.subtotal)}`,
    `Delivery: ${order.shipping_amount > 0 ? formatInr(order.shipping_amount) : "Free"}`,
    `*Total Payable: ${formatInr(order.total_amount)}*`,
    "",
    "*Deliver To*",
    address.name,
    [address.address_line1, address.address_line2, address.landmark].filter(Boolean).join(", "),
    `${address.city}, ${address.state} - ${address.pincode}`,
    `Phone: ${address.phone}`,
  ];

  if (customer?.name || customer?.email || customer?.phone) {
    lines.push("", "*Customer*");
    if (customer.name) lines.push(customer.name);
    if (customer.email) lines.push(`Email: ${customer.email}`);
    if (customer.phone) lines.push(`Phone: ${customer.phone}`);
  }

  if (notes?.trim()) lines.push("", `*Delivery instructions:* ${notes.trim()}`);

  lines.push("", "Please share the payment details to confirm my order.");
  return lines.join("\n");
}

export function whatsappOrderUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_ORDER_NUMBER}?text=${encodeURIComponent(message)}`;
}
