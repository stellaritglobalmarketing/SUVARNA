const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function isPositiveInt(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0;
}

function isNonNegativeInt(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0;
}

function parseListingQuery(query = {}) {
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
    const lowStockOnly = query.low_stock === "true" || query.low_stock === "1";

    return { page, limit, offset: (page - 1) * limit, search, lowStockOnly };
}

function validateSetInventoryBody(body) {
    const { stock_quantity, low_stock_limit } = body || {};

    if (!isNonNegativeInt(stock_quantity)) {
        return "stock_quantity is required and must be a non-negative integer";
    }
    if (low_stock_limit !== undefined && low_stock_limit !== null && low_stock_limit !== "" && !isNonNegativeInt(low_stock_limit)) {
        return "low_stock_limit must be a non-negative integer";
    }

    return null;
}

function validateAdjustBody(body) {
    const { quantity, type, reason } = body || {};

    if (!isPositiveInt(quantity)) {
        return "quantity is required and must be a positive integer";
    }
    if (type !== "add" && type !== "remove") {
        return "type is required and must be either 'add' or 'remove'";
    }
    if (reason !== undefined && reason !== null && String(reason).length > 255) {
        return "reason must be 255 characters or fewer";
    }

    return null;
}

export { isPositiveInt, isNonNegativeInt, parseListingQuery, validateSetInventoryBody, validateAdjustBody };
