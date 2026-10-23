/** What Cashfree's JS SDK resolves `checkout()` with — https://www.cashfree.com/docs/payments/online/web/redirect */
export interface CashfreeCheckoutResult {
  /** The customer closed the popup, or the payment errored. */
  error?: { message?: string; code?: string };
  /** The popup couldn't open (in-app browsers); the customer is sent to the order's return_url instead. */
  redirect?: boolean;
  /** The payment finished — successfully or not; the backend has the verdict. */
  paymentDetails?: { paymentMessage?: string };
}

interface CashfreeInstance {
  checkout: (options: { paymentSessionId: string; redirectTarget: "_modal" | "_self" }) => Promise<CashfreeCheckoutResult>;
}

declare global {
  interface Window {
    Cashfree?: (options: { mode: "sandbox" | "production" }) => CashfreeInstance;
  }
}

const SCRIPT_SRC = "https://sdk.cashfree.com/js/v3/cashfree.js";
let scriptPromise: Promise<void> | null = null;

/** Loads Cashfree's SDK once, on first use (so it's never on pages that don't pay). */
function loadCashfree(): Promise<void> {
  if (window.Cashfree) return Promise.resolve();
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

/** Opens Cashfree's payment popup; resolves when it closes. `mode` must match the backend's keys. */
export async function openCashfree(paymentSessionId: string, mode: "sandbox" | "production"): Promise<CashfreeCheckoutResult> {
  await loadCashfree();
  if (!window.Cashfree) throw new Error("Payment window is unavailable. Please try again.");
  return window.Cashfree({ mode }).checkout({ paymentSessionId, redirectTarget: "_modal" });
}
