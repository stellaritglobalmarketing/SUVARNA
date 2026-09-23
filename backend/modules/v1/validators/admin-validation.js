const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function isPositiveInt(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0;
}

function parseCustomerListingQuery(query = {}) {
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

    let status = null;
    if (query.status === "active") {
        status = 1;
    } else if (query.status === "inactive") {
        status = 0;
    }

    return { page, limit, offset: (page - 1) * limit, search, status };
}

function validateStatusBody(body) {
    const { is_active } = body || {};
    if (is_active === undefined || is_active === null || ![0, 1].includes(Number(is_active))) {
        return "is_active is required and must be 0 or 1";
    }
    return null;
}

export { isPositiveInt, parseCustomerListingQuery, validateStatusBody };
