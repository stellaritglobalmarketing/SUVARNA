import { normalizePhone, EMAIL_REGEX, PHONE_REGEX } from "./user-validation.js";

const DEFAULT_LIMIT = 10;
const PINCODE_REGEX = /^[1-9]\d{5}$/;
const MAX_LINE_ITEMS = 50;
// shipping_address_line1 and line2 are varchar(160) each; a whole address is split across the two.
const ADDRESS_LINE_LENGTH = 160;
const MAX_ADDRESS_LENGTH = 300;
const MIN_ADDRESS_LENGTH = 10;
const MAX_LIMIT = 20;

function validateCreateOrder(body) {
    const { address_id, notes } = body || {};

    const parsedAddressId = Number(address_id);
    if (!address_id || !Number.isInteger(parsedAddressId) || parsedAddressId <= 0) {
        return "address_id is required and must be a valid positive integer";
    }
    if (notes !== undefined && notes !== null && String(notes).length > 255) {
        return "notes must be 255 characters or fewer";
    }

    return null;
}

const clean = (value) => (value === undefined || value === null ? "" : String(value).trim());

function splitAddress(text) {
    if (text.length <= ADDRESS_LINE_LENGTH) return [text, null];
    const head = text.slice(0, ADDRESS_LINE_LENGTH);
    const cut = Math.max(head.lastIndexOf(","), head.lastIndexOf(" "));
    const end = cut > 0 ? cut : ADDRESS_LINE_LENGTH;
    return [text.slice(0, end).trim(), text.slice(end).replace(/^[,\s]+/, "")];
}

/**
 * Validates a guest checkout body. Returns `{ error }` or `{ order }`. The same variant twice is merged.
 * city and state are optional: the courier's pincode data is preferred, and the form asks only when there is none.
 */
function parseGuestOrder(body = {}) {
    const name = clean(body.name);
    const phone = normalizePhone(body.phone);
    const email = clean(body.email).toLowerCase() || null;
    const address = clean(body.address).replace(/\s+/g, " ");
    const pincode = clean(body.pincode);
    const notes = clean(body.notes).slice(0, 255) || null;
    const city = clean(body.city).slice(0, 64);
    const state = clean(body.state).slice(0, 64);
    const expected_subtotal = Number(body.expected_subtotal);

    if (!name) return { error: "Name is required" };
    if (name.length > 64) return { error: "Name must be 64 characters or fewer" };
    if (!PHONE_REGEX.test(phone)) return { error: "Enter a valid 10-digit mobile number" };
    if (email && (!EMAIL_REGEX.test(email) || email.length > 128)) return { error: "Enter a valid email address" };
    if (address.length < MIN_ADDRESS_LENGTH) return { error: "Enter your full address: house number, street and area" };
    if (address.length > MAX_ADDRESS_LENGTH) return { error: `Address must be ${MAX_ADDRESS_LENGTH} characters or fewer` };
    if (!PINCODE_REGEX.test(pincode)) return { error: "Enter a valid 6-digit pincode" };

    const lines = Array.isArray(body.items) ? body.items : [];
    if (lines.length === 0) return { error: "Your cart is empty" };
    if (lines.length > MAX_LINE_ITEMS) return { error: "Too many items in one order" };
    const quantities = new Map();
    for (const line of lines) {
        const variantId = Number(line?.product_variant_id);
        const quantity = Number(line?.quantity);
        if (!Number.isInteger(variantId) || variantId <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
            return { error: "Your cart has an invalid item. Please remove it and add it again." };
        }
        quantities.set(variantId, (quantities.get(variantId) ?? 0) + quantity);
    }
    if (!Number.isFinite(expected_subtotal)) return { error: "expected_subtotal is required" };

    const [address_line1, address_line2] = splitAddress(address);
    return { order: { name, phone, email, address_line1, address_line2, pincode, city, state, notes, quantities, expected_subtotal } };
}

function parseOrderLookup(body = {}) {
    const order_number = clean(body.order_number);
    const phone = normalizePhone(body.phone);
    if (!isValidOrderNumber(order_number)) return { error: "Enter a valid order number, like ORD-20261104-0001" };
    if (!PHONE_REGEX.test(phone)) return { error: "Enter the 10-digit mobile number used for the order" };
    return { order_number, phone };
}

function isValidOrderNumber(orderNumber) {
    return typeof orderNumber === "string" && /^ORD-\d{8}-\d+$/.test(orderNumber.trim());
}

// Public-facing pagination — invalid/missing values silently fall back to
// defaults, matching the project's existing pagination convention.
function parseMyOrdersQuery(query = {}) {
    let page = parseInt(query.page, 10);
    if (!Number.isInteger(page) || page < 1) {
        page = 1;
    }

    let limit = parseInt(query.limit, 10);
    if (!Number.isInteger(limit) || limit < 1) {
        limit = DEFAULT_LIMIT;
    }
    if (limit > MAX_LIMIT) {
        limit = MAX_LIMIT;
    }

    return { page, limit, offset: (page - 1) * limit };
}

export { validateCreateOrder, parseGuestOrder, parseOrderLookup, isValidOrderNumber, parseMyOrdersQuery };
