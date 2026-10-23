import crypto from "node:crypto";
import { getSetting, setSetting } from "./store-settings.js";

// Ekart shipping settings the admin edits in Admin → Settings → Ekart shipping (stored in store_settings
// as "ekart_<key>", one row each). Only credentials and on/off switches stay in the backend .env.

const FIELDS = {
    seller_name: { kind: "text", max: 100, fallback: "" },
    seller_address: { kind: "text", max: 300, fallback: "" },
    seller_gstin: { kind: "gstin", fallback: "" },
    category_of_goods: { kind: "text", max: 60, fallback: "Food Products" },
    hsn_code: { kind: "hsn", fallback: "" },
    gst_rate: { kind: "number", min: 0, max: 28, fallback: 0 },
    box_length_cm: { kind: "int", min: 1, max: 200, fallback: 20 },
    box_width_cm: { kind: "int", min: 1, max: 200, fallback: 15 },
    box_height_cm: { kind: "int", min: 1, max: 200, fallback: 10 },
    packaging_weight_g: { kind: "int", min: 0, max: 5000, fallback: 150 },
    return_alias: { kind: "text", max: 60, fallback: "" },
    public_url: { kind: "url", fallback: "" },
};

export const EKART_SETTING_KEYS = Object.keys(FIELDS);

const LABELS = {
    seller_name: "Seller name",
    seller_address: "Seller address",
    seller_gstin: "GSTIN",
    category_of_goods: "Category of goods",
    hsn_code: "HSN code",
    gst_rate: "GST rate",
    box_length_cm: "Box length",
    box_width_cm: "Box width",
    box_height_cm: "Box height",
    packaging_weight_g: "Packaging weight",
    return_alias: "Return address",
    public_url: "Backend public URL",
};

function parseStored(field, raw) {
    if (raw === null || raw === undefined || raw === "") return field.fallback;
    if (field.kind === "int" || field.kind === "number") {
        const value = Number(raw);
        return Number.isFinite(value) ? value : field.fallback;
    }
    return String(raw);
}

/** All Ekart settings, with defaults for anything never saved (or if the settings table can't be read). */
export async function getEkartSettings() {
    const settings = {};
    for (const [key, field] of Object.entries(FIELDS)) {
        let raw = null;
        try {
            raw = await getSetting(`ekart_${key}`);
        } catch (error) {
            console.warn(`Reading Ekart setting ${key} failed: ${error.message}`);
        }
        settings[key] = parseStored(field, raw);
    }
    return settings;
}

/**
 * Validates a partial update from the admin form. Returns { error } or { values } containing only the
 * keys that were sent; "" clears a text value back to its default.
 */
export function validateEkartSettings(body = {}) {
    const values = {};
    for (const [key, field] of Object.entries(FIELDS)) {
        if (!(key in body)) continue;
        const label = LABELS[key];
        const raw = body[key];
        const text = String(raw ?? "").trim().replace(/\s+/g, " ");

        switch (field.kind) {
            case "int":
            case "number": {
                const value = Number(raw);
                const ok = text !== "" && Number.isFinite(value) && (field.kind === "number" || Number.isInteger(value));
                if (!ok || value < field.min || value > field.max) {
                    return { error: `${label} must be a ${field.kind === "int" ? "whole number" : "number"} from ${field.min} to ${field.max}` };
                }
                values[key] = String(value);
                break;
            }
            case "gstin":
                if (text && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(text.toUpperCase())) {
                    return { error: "GSTIN must be a valid 15-character GST number" };
                }
                values[key] = text.toUpperCase();
                break;
            case "hsn":
                if (text && !/^\d{4,8}$/.test(text)) return { error: "HSN code must be 4–8 digits" };
                values[key] = text;
                break;
            case "url": {
                const url = text.replace(/\/+$/, "");
                if (url && !/^https:\/\/[^\s/]+(\/[^\s]*)?$/i.test(url)) {
                    return { error: "Backend public URL must start with https:// (e.g. https://api.suvarna7.com)" };
                }
                if (/\/api\/v1$/i.test(url)) return { error: "Backend public URL should not end with /api/v1" };
                values[key] = url;
                break;
            }
            default:
                if (text.length > field.max) return { error: `${label} can be at most ${field.max} characters` };
                values[key] = text;
        }
    }
    return { values };
}

export async function saveEkartSettings(values) {
    for (const [key, value] of Object.entries(values)) {
        await setSetting(`ekart_${key}`, value);
    }
    return getEkartSettings();
}

/**
 * Secret part of our Ekart webhook URL. Generated once and kept in store_settings, so nobody has to
 * make one up; Ekart accepts 6–30 letters/digits.
 */
export async function getWebhookSecret() {
    const saved = await getSetting("ekart_webhook_secret");
    if (saved && /^[A-Za-z0-9]{6,30}$/.test(saved)) return saved;
    const secret = crypto.randomBytes(12).toString("hex"); // 24 chars
    await setSetting("ekart_webhook_secret", secret);
    return secret;
}

/** Full webhook URL to register with Ekart, or null until the backend public URL is set. */
export async function getWebhookUrl() {
    const { public_url: base } = await getEkartSettings();
    if (!base) return null;
    return `${base}/api/v1/webhooks/ekart/${encodeURIComponent(await getWebhookSecret())}`;
}
