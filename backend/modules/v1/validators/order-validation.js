const DEFAULT_LIMIT = 10;
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

export { validateCreateOrder, isValidOrderNumber, parseMyOrdersQuery };
