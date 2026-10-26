import type { RazorpaySuccess } from "@/lib/api/checkout";

/** The subset of Razorpay Checkout's options we use — https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/ */
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: RazorpaySuccess) => void;
  modal: { ondismiss: () => void };
}

interface RazorpayFailure {
  error: { description?: string; reason?: string };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", callback: (response: RazorpayFailure) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let scriptPromise: Promise<void> | null = null;

/** Loads Razorpay's Checkout script once, on first use (so it's never on pages that don't pay). */
export function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null; // allow a retry after e.g. a network blip
        script.remove();
        reject(new Error("Couldn't load the payment window. Check your connection and try again."));
      };
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
}

/** Opens Razorpay Checkout; `onFailed` receives Razorpay's reason when an attempt inside the popup fails. */
export async function openRazorpay(options: RazorpayOptions, onFailed: (message: string) => void): Promise<void> {
  await loadRazorpay();
  if (!window.Razorpay) throw new Error("Payment window is unavailable. Please try again.");
  const instance = new window.Razorpay(options);
  instance.on("payment.failed", (response) => {
    onFailed(response.error.description || "Payment failed. Please try again.");
  });
  instance.open();
}
