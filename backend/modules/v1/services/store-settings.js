import db from "../../../config/db.js";

// Admin-editable store settings (table `store_settings`). Read often (every product page asks for the
// WhatsApp number), changed rarely, so values are cached briefly and the cache is dropped on save.

const DEFAULT_WHATSAPP_NUMBER = "916353684881";
const CACHE_MS = 30 * 1000;

let cache = null; // { at, values }

async function readAll() {
    if (cache && Date.now() - cache.at < CACHE_MS) return cache.values;
    const [rows] = await db.query("SELECT setting_key, setting_value FROM store_settings");
    const values = Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
    cache = { at: Date.now(), values };
    return values;
}

/**
 * Indian mobile in any common form ("63536 84881", "+91-6353684881", "06353684881") → "916353684881".
 * Returns null when it isn't a valid 10-digit Indian mobile number.
 */
function normalizeWhatsappNumber(input) {
    let digits = String(input ?? "").replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
    else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
    return /^[6-9]\d{9}$/.test(digits) ? `91${digits}` : null;
}

/** "916353684881" → "+91 63536 84881" */
function displayWhatsappNumber(number) {
    const local = String(number).replace(/^91/, "");
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
}

/** The store's WhatsApp number (digits with country code). Falls back to the default if unset or unreadable. */
async function getWhatsappNumber() {
    try {
        const values = await readAll();
        return normalizeWhatsappNumber(values.whatsapp_number) || DEFAULT_WHATSAPP_NUMBER;
    } catch (error) {
        console.error("Store settings read error: ", error.message);
        return DEFAULT_WHATSAPP_NUMBER;
    }
}

/** Public settings for the storefront and admin form. */
async function getPublicSettings() {
    const whatsapp_number = await getWhatsappNumber();
    return { whatsapp_number, whatsapp_display: displayWhatsappNumber(whatsapp_number) };
}

async function setWhatsappNumber(number) {
    await db.query(
        `INSERT INTO store_settings (setting_key, setting_value) VALUES ('whatsapp_number', ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [number]
    );
    cache = null;
}

export { normalizeWhatsappNumber, getWhatsappNumber, getPublicSettings, setWhatsappNumber };
