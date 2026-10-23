import crypto from "node:crypto";
import "dotenv/config";

// Thin client for the few Cashfree Payment Gateway endpoints checkout needs
// (https://www.cashfree.com/docs/api-reference/payments/latest/orders/create).
// Keys come only from the environment: CASHFREE_APP_ID (client id) and CASHFREE_SECRET_KEY (never
// leaves the server). CASHFREE_ENV=production uses the live API; anything else uses the sandbox.
const BASE_URLS = {
    sandbox: "https://sandbox.cashfree.com/pg",
    production: "https://api.cashfree.com/pg",
};
const API_VERSION = "2025-01-01";
const REQUEST_TIMEOUT_MS = 15000;
// Webhooks signed longer ago than this are rejected as replays. A rejected one is harmless: the
// order is still picked up when the customer or an admin re-checks the payment.
const WEBHOOK_MAX_AGE_MS = 15 * 60 * 1000;

const mode = () => (process.env.CASHFREE_ENV?.trim().toLowerCase() === "production" ? "production" : "sandbox");

function credentials() {
    const appId = process.env.CASHFREE_APP_ID?.trim();
    const secretKey = process.env.CASHFREE_SECRET_KEY?.trim();
    if (!appId || !secretKey) {
        throw new Error("Cashfree is not configured (CASHFREE_APP_ID / CASHFREE_SECRET_KEY)");
    }
    return { appId, secretKey };
}

async function request(method, path, body) {
    const { appId, secretKey } = credentials();
    const res = await fetch(BASE_URLS[mode()] + path, {
        method,
        headers: {
            "x-client-id": appId,
            "x-client-secret": secretKey,
            "x-api-version": API_VERSION,
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        const error = new Error(data?.message || `Cashfree request failed (${res.status})`);
        error.status = res.status;
        error.cashfree = data ?? null;
        throw error;
    }
    return data;
}

const cashfree = {
    configured: () => Boolean(process.env.CASHFREE_APP_ID?.trim() && process.env.CASHFREE_SECRET_KEY?.trim()),

    /** "sandbox" or "production" — the checkout page's JS SDK must be opened in the same mode. */
    mode,

    /** `order_amount` is in rupees. Returns the Cashfree order, including `payment_session_id`. */
    createOrder: (body) => request("POST", "/orders", body),

    /** `order_status` is ACTIVE (unpaid), PAID, EXPIRED or TERMINATED. */
    fetchOrder: (orderId) => request("GET", `/orders/${encodeURIComponent(orderId)}`),

    /** Every payment attempt on the order; a completed one has `payment_status: "SUCCESS"`. */
    fetchOrderPayments: (orderId) => request("GET", `/orders/${encodeURIComponent(orderId)}/payments`),

    /**
     * Webhook signature: Base64 HMAC-SHA256 of "<x-webhook-timestamp><raw body>" with the secret key
     * (x-webhook-signature). Cashfree's docs also show the two joined by a "."; both forms are accepted.
     */
    isValidWebhookSignature(rawBody, signature, timestamp) {
        const secret = process.env.CASHFREE_SECRET_KEY?.trim();
        if (!secret || !Buffer.isBuffer(rawBody) || typeof signature !== "string" || !/^\d+$/.test(String(timestamp ?? ""))) {
            return false;
        }
        const sentAt = Number(timestamp) < 1e12 ? Number(timestamp) * 1000 : Number(timestamp); // seconds or ms
        if (Math.abs(Date.now() - sentAt) > WEBHOOK_MAX_AGE_MS) {
            return false;
        }
        const given = Buffer.from(signature);
        return [String(timestamp), `${timestamp}.`].some((prefix) => {
            const expected = Buffer.from(
                crypto.createHmac("sha256", secret).update(Buffer.concat([Buffer.from(prefix), rawBody])).digest("base64")
            );
            return expected.length === given.length && crypto.timingSafeEqual(expected, given);
        });
    },
};

export default cashfree;
