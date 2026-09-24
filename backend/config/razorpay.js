import crypto from "node:crypto";
import "dotenv/config";

// Thin client for the few Razorpay REST endpoints checkout needs (https://razorpay.com/docs/api/).
// Keys come only from the environment: RAZORPAY_KEY_ID (safe to show the browser) and
// RAZORPAY_KEY_SECRET (never leaves the server).
const API_BASE = "https://api.razorpay.com/v1";
const REQUEST_TIMEOUT_MS = 15000;

const ORDER_ID_REGEX = /^order_[A-Za-z0-9]+$/;
const PAYMENT_ID_REGEX = /^pay_[A-Za-z0-9]+$/;

function credentials() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
        throw new Error("Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)");
    }
    return { keyId, keySecret };
}

async function request(method, path, body) {
    const { keyId, keySecret } = credentials();
    const res = await fetch(API_BASE + path, {
        method,
        headers: {
            Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        const error = new Error(data?.error?.description || `Razorpay request failed (${res.status})`);
        error.status = res.status;
        error.razorpay = data?.error ?? null;
        throw error;
    }
    return data;
}

const razorpay = {
    isValidOrderId: (id) => typeof id === "string" && ORDER_ID_REGEX.test(id),
    isValidPaymentId: (id) => typeof id === "string" && PAYMENT_ID_REGEX.test(id),

    keyId: () => credentials().keyId,

    /** `amount` is in paise. */
    createOrder: ({ amount, receipt, notes }) => request("POST", "/orders", { amount, currency: "INR", receipt, notes }),

    fetchPayment: (paymentId) => request("GET", `/payments/${paymentId}`),

    fetchOrderPayments: (orderId) => request("GET", `/orders/${orderId}/payments`),

    /** Needed only when the account doesn't auto-capture: an authorized payment is refunded after a few days if never captured. */
    capturePayment: (paymentId, amount) => request("POST", `/payments/${paymentId}/capture`, { amount, currency: "INR" }),

    /** Checkout's success signature: HMAC-SHA256 of "<order_id>|<payment_id>" with the key secret. */
    isValidSignature(orderId, paymentId, signature) {
        if (typeof signature !== "string" || !/^[a-f0-9]{64}$/.test(signature)) {
            return false;
        }
        const expected = crypto.createHmac("sha256", credentials().keySecret).update(`${orderId}|${paymentId}`).digest("hex");
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    },
};

export default razorpay;
