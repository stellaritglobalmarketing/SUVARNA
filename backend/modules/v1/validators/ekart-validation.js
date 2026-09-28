const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const NDR_ACTIONS = ["Re-Attempt", "RTO"];

function isPincode(value) {
    return typeof value === "string" && /^[1-9]\d{5}$/.test(value.trim());
}

function positiveInt(value, max) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 && parsed <= max ? parsed : null;
}

/** Package for booking / quoting: weight in grams, box in whole cm (Ekart takes integers). Returns { error } or { pkg }. */
function parsePackage(source = {}) {
    const weight_g = positiveInt(source.weight_g, 50000);
    if (!weight_g) return { error: "weight_g is required: package weight in grams (1–50000)" };
    const dims = {};
    for (const key of ["length_cm", "width_cm", "height_cm"]) {
        const value = positiveInt(source[key], 300);
        if (!value) return { error: `${key} is required: a whole number of centimetres (1–300)` };
        dims[key] = value;
    }
    return { pkg: { weight_g, ...dims } };
}

function validatePreferredDispatchDate(value) {
    if (value === undefined || value === null || value === "") return null;
    if (!DATE_REGEX.test(String(value))) return "preferred_dispatch_date must be YYYY-MM-DD";
    const today = new Date().toISOString().slice(0, 10);
    if (String(value) < today) return "preferred_dispatch_date can't be in the past";
    return null;
}

/** Ekart NDR v2: Re-Attempt needs a date within the next 7 days (not today); RTO needs nothing else. */
function parseNdrBody(body = {}) {
    const action = String(body.action || "");
    if (!NDR_ACTIONS.includes(action)) return { error: `action must be one of: ${NDR_ACTIONS.join(", ")}` };

    const ndr = { action };
    if (action === "Re-Attempt") {
        if (!DATE_REGEX.test(String(body.date || ""))) return { error: "date (YYYY-MM-DD) is required for a re-attempt" };
        const date = new Date(`${body.date}T12:00:00+05:30`);
        const days = Math.round((date.getTime() - Date.now()) / 86400000);
        if (!Number.isFinite(date.getTime()) || days < 1 || days > 7) return { error: "Re-attempt date must be within the next 7 days, not today" };
        ndr.date = date.getTime();
    }
    if (body.phone) {
        const phone = String(body.phone).replace(/\D/g, "").slice(-10);
        if (!/^\d{10}$/.test(phone)) return { error: "phone must be a 10-digit number" };
        ndr.phone = phone;
    }
    if (body.address) ndr.address = String(body.address).trim().slice(0, 255);
    if (body.instructions) ndr.instructions = String(body.instructions).trim().slice(0, 255);
    return { ndr };
}

function parseIdList(value, max = 100) {
    if (!Array.isArray(value) || value.length === 0) return { error: "ids must be a non-empty array of shipment ids" };
    if (value.length > max) return { error: `At most ${max} shipments at a time` };
    const ids = [...new Set(value.map(Number))];
    if (ids.some((id) => !Number.isInteger(id) || id <= 0)) return { error: "ids must be shipment ids" };
    return { ids };
}

export { isPincode, parsePackage, validatePreferredDispatchDate, parseNdrBody, parseIdList };
