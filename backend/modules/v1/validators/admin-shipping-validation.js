const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Provider-agnostic by design — any courier name is accepted, not just a fixed list,
// so Ekart/DTDC/Shiprocket/Delhivery/others all work without code changes.
const SHIPMENT_STATUSES = ["created", "pickup_scheduled", "picked_up", "in_transit", "out_for_delivery", "delivered", "failed", "rto", "cancelled"];

function isPositiveInt(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0;
}

function isNonNegativeNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0;
}

function parseShipmentListingQuery(query = {}) {
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

    const search = query.search ? String(query.search).trim().slice(0, 100) : null;
    const provider = query.provider ? String(query.provider).trim().slice(0, 32) : null;
    const shipment_status = SHIPMENT_STATUSES.includes(query.shipment_status) ? query.shipment_status : null;
    const order_id = isPositiveInt(query.order_id) ? Number(query.order_id) : null;

    return { page, limit, offset: (page - 1) * limit, search, provider, shipment_status, order_id };
}

function validateCreateShipmentBody(body) {
    const { provider, awb_number, courier_name, tracking_url, shipping_charge, package_weight, length_cm, width_cm, height_cm } = body || {};

    if (!provider || !String(provider).trim()) {
        return "provider is required";
    }
    if (String(provider).trim().length > 32) {
        return "provider must be 32 characters or fewer";
    }
    if (awb_number !== undefined && awb_number !== null && String(awb_number).length > 64) {
        return "awb_number must be 64 characters or fewer";
    }
    if (courier_name !== undefined && courier_name !== null && String(courier_name).length > 64) {
        return "courier_name must be 64 characters or fewer";
    }
    if (tracking_url !== undefined && tracking_url !== null && String(tracking_url).length > 512) {
        return "tracking_url must be 512 characters or fewer";
    }
    if (shipping_charge !== undefined && shipping_charge !== null && shipping_charge !== "" && !isNonNegativeNumber(shipping_charge)) {
        return "shipping_charge must be a valid non-negative number";
    }
    if (package_weight !== undefined && package_weight !== null && package_weight !== "" && !isNonNegativeNumber(package_weight)) {
        return "package_weight must be a valid non-negative number";
    }
    for (const [key, value] of Object.entries({ length_cm, width_cm, height_cm })) {
        if (value !== undefined && value !== null && value !== "" && !isNonNegativeNumber(value)) {
            return `${key} must be a valid non-negative number`;
        }
    }

    return null;
}

function validateShipmentStatusBody(body) {
    const { shipment_status } = body || {};
    if (!shipment_status || !SHIPMENT_STATUSES.includes(shipment_status)) {
        return `shipment_status is required and must be one of: ${SHIPMENT_STATUSES.join(", ")}`;
    }
    return null;
}

export { isPositiveInt, SHIPMENT_STATUSES, parseShipmentListingQuery, validateCreateShipmentBody, validateShipmentStatusBody };
