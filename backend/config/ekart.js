import "dotenv/config";

// Thin client for the Ekart Elite API (https://app.elite.ekartlogistics.in — OpenAPI "Ekart API Docs" v3.8).
// Credentials come only from the environment: EKART_CLIENT_ID, EKART_USERNAME, EKART_PASSWORD.
// Auth is a bearer token from /integrations/v2/auth/token/{client_id}, valid ~24h; it is cached here
// and fetched again shortly before it expires, or immediately if Ekart answers 401.
const DEFAULT_BASE_URL = "https://app.elite.ekartlogistics.in";
const REQUEST_TIMEOUT_MS = 20000;
const TOKEN_REFRESH_MARGIN_MS = 10 * 60 * 1000;

let cachedToken = null; // { value, expiresAt }
let pendingToken = null;

function baseUrl() {
    return (process.env.EKART_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/$/, "");
}

function credentials() {
    const clientId = process.env.EKART_CLIENT_ID;
    const username = process.env.EKART_USERNAME;
    const password = process.env.EKART_PASSWORD;
    if (!clientId || !username || !password) {
        throw new Error("Ekart is not configured (EKART_CLIENT_ID / EKART_USERNAME / EKART_PASSWORD)");
    }
    return { clientId, username, password };
}

function isConfigured() {
    return process.env.EKART_ENABLED !== "false" && Boolean(process.env.EKART_CLIENT_ID && process.env.EKART_USERNAME && process.env.EKART_PASSWORD);
}

function errorFrom(res, data, fallback) {
    const message =
        (data && (data.description || data.message || data.remark || data.error)) ||
        (typeof data === "string" && data.trim() ? data.trim().slice(0, 200) : null) ||
        `${fallback} (${res.status})`;
    const error = new Error(`Ekart: ${message}`);
    error.status = res.status;
    error.ekart = data ?? null;
    return error;
}

async function readBody(res) {
    const text = await res.text();
    try {
        return text ? JSON.parse(text) : null;
    } catch {
        return text;
    }
}

async function fetchToken() {
    const { clientId, username, password } = credentials();
    const res = await fetch(`${baseUrl()}/integrations/v2/auth/token/${encodeURIComponent(clientId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ username, password }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const data = await readBody(res);
    if (!res.ok || !data?.access_token) {
        throw errorFrom(res, data, "login failed");
    }
    const lifetimeMs = (Number(data.expires_in) || 3600) * 1000;
    cachedToken = { value: data.access_token, expiresAt: Date.now() + Math.max(lifetimeMs - TOKEN_REFRESH_MARGIN_MS, 60 * 1000) };
    return cachedToken.value;
}

async function getToken({ force = false } = {}) {
    if (!force && cachedToken && cachedToken.expiresAt > Date.now()) {
        return cachedToken.value;
    }
    // One login at a time, even if several requests notice the expired token together.
    pendingToken ??= fetchToken().finally(() => {
        pendingToken = null;
    });
    return pendingToken;
}

/**
 * `auth: false` for Ekart's open endpoints (tracking). `binary: true` returns a Buffer (label PDFs).
 * Throws an Error with `.status` (HTTP) and `.ekart` (Ekart's error body) on failure.
 */
async function request(method, path, { body, auth = true, binary = false } = {}) {
    const send = async (token) =>
        fetch(baseUrl() + path, {
            method,
            headers: {
                ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
                Accept: binary ? "application/pdf, application/octet-stream, application/json" : "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

    let res = await send(auth ? await getToken() : null);
    if (auth && res.status === 401) {
        res = await send(await getToken({ force: true }));
    }

    if (binary && res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("json")) {
            return { buffer: Buffer.from(await res.arrayBuffer()), contentType: contentType || "application/pdf" };
        }
    }
    const data = await readBody(res);
    if (!res.ok) {
        throw errorFrom(res, data, "request failed");
    }
    return data;
}

/** Ekart acknowledgements carry `status: false` + `remark` for business errors even on HTTP 200. */
function assertAcknowledged(ack, fallback) {
    if (ack && ack.status === false) {
        const error = new Error(`Ekart: ${ack.remark || fallback}`);
        error.ekart = ack;
        throw error;
    }
    return ack;
}

const ekart = {
    isConfigured,

    /** Public tracking page for an Ekart tracking id. */
    trackingUrl: (trackingId) => `${baseUrl()}/track/${encodeURIComponent(trackingId)}`,

    /** PUT /api/v1/package/create — returns { status, remark, tracking_id, vendor, barcodes: { wbn, order, cod } }. */
    createShipment: async (payload) => assertAcknowledged(await request("PUT", "/api/v1/package/create", { body: payload }), "shipment was not created"),

    /** DELETE /api/v1/package/cancel — only possible before the parcel is picked up. */
    cancelShipment: async (trackingId) => {
        const data = await request("DELETE", `/api/v1/package/cancel?tracking_id=${encodeURIComponent(trackingId)}`);
        for (const ack of data?.data ?? []) assertAcknowledged(ack, "shipment could not be cancelled");
        return data;
    },

    /** GET /api/v1/track/{id} (open API) — { _id, order_number, edd, track: { status, ctime, desc, location, ndrStatus, ndrActions, pickupTime, details[] } }. */
    track: (trackingId) => request("GET", `/api/v1/track/${encodeURIComponent(trackingId)}`, { auth: false }),

    /** GET /api/v2/serviceability/{pincode} — { status, pincode, remark, details: { cod, max_cod_amount, forward_drop, city, state, … } }. */
    serviceability: (pincode) => request("GET", `/api/v2/serviceability/${encodeURIComponent(pincode)}`),

    /** POST /data/v3/serviceability — courier options with delivery TAT and charges for a pickup → drop lane. */
    laneServiceability: (body) => request("POST", "/data/v3/serviceability", { body }),

    /** POST /data/pricing/estimate — { zone, billingWeight, shippingCharge, codCharge, rtoCharge, taxes, total, … } (strings). */
    estimate: (body) => request("POST", "/data/pricing/estimate", { body }),

    /** POST /api/v1/package/label — PDF of up to 100 labels. Returns { buffer, contentType }. */
    downloadLabels: (trackingIds) => request("POST", "/api/v1/package/label?json_only=false", { body: { ids: trackingIds }, binary: true }),

    /** POST /data/v2/generate/manifest — { ctime, manifestNumber, manifestDownloadUrl }. */
    generateManifest: (trackingIds) => request("POST", "/data/v2/generate/manifest", { body: { ids: trackingIds } }),

    /** POST /api/v2/package/ndr — action "Re-Attempt" (with `date` in ms) or "RTO". */
    ndrAction: async (body) => assertAcknowledged(await request("POST", "/api/v2/package/ndr", { body }), "NDR action was not accepted"),

    listWebhooks: () => request("GET", "/api/v2/webhook"),
    addWebhook: (body) => request("POST", "/api/v2/webhook", { body }),
    updateWebhook: (id, body) => request("PUT", `/api/v2/webhook/${encodeURIComponent(id)}`, { body }),
};

export default ekart;
