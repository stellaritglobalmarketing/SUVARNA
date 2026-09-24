import { normalizePhone } from "./user-validation.js";

const PHONE_REGEX = /^[6-9]\d{9}$/;
const PINCODE_REGEX = /^[1-9]\d{5}$/;
const ADDRESS_TYPES = ["home", "work", "other"];

// Column limits from the `addresses` table. The DB isn't in strict mode, so anything longer
// would be silently cut off — reject it here instead.
const LIMITS = {
    full_name: 64,
    address_line1: 160,
    address_line2: 160,
    landmark: 128,
    city: 64,
    state: 64,
};

const LABELS = {
    full_name: "Full name",
    address_line1: "Address line 1",
    address_line2: "Address line 2",
    landmark: "Landmark",
    city: "City",
    state: "State",
};

function clean(value) {
    return value === undefined || value === null ? "" : String(value).trim();
}

/**
 * Validates and normalises an address body. Returns `{ error }` or `{ address }` with the
 * cleaned values ready to insert (optional text fields become null when empty).
 */
function parseAddress(body = {}) {
    const address = {
        full_name: clean(body.full_name),
        phone: normalizePhone(body.phone),
        address_line1: clean(body.address_line1),
        address_line2: clean(body.address_line2) || null,
        landmark: clean(body.landmark) || null,
        city: clean(body.city),
        state: clean(body.state),
        pincode: clean(body.pincode),
        address_type: clean(body.address_type).toLowerCase() || "home",
        is_default: body.is_default === true || body.is_default === 1 || body.is_default === "1" ? 1 : 0,
    };

    for (const field of ["full_name", "address_line1", "city", "state"]) {
        if (!address[field]) {
            return { error: `${LABELS[field]} is required` };
        }
    }
    for (const [field, max] of Object.entries(LIMITS)) {
        if (address[field] && address[field].length > max) {
            return { error: `${LABELS[field]} must be ${max} characters or fewer` };
        }
    }
    if (!PHONE_REGEX.test(address.phone)) {
        return { error: "Enter a valid 10-digit phone number" };
    }
    if (!PINCODE_REGEX.test(address.pincode)) {
        return { error: "Enter a valid 6-digit pincode" };
    }
    if (!ADDRESS_TYPES.includes(address.address_type)) {
        return { error: `Address type must be one of: ${ADDRESS_TYPES.join(", ")}` };
    }

    return { address };
}

function isPositiveInt(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0;
}

export { parseAddress, isPositiveInt };
