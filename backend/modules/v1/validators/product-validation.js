// Public listing endpoint — invalid/missing query params silently fall back to
// sane defaults instead of erroring (matches the project's existing pagination convention).

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 24;

const ALLOWED_SORTS = {
    latest: "p.created_at DESC",
    price_asc: "pr.min_price ASC",
    price_desc: "pr.min_price DESC",
    name_asc: "p.name ASC",
    name_desc: "p.name DESC",
};

function parsePositiveInt(value, fallback) {
    const parsed = parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePrice(value) {
    if (value === undefined || value === null || value === "") {
        return null;
    }
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parseListingQuery(query = {}) {
    const page = parsePositiveInt(query.page, 1);
    const limit = Math.min(parsePositiveInt(query.limit, DEFAULT_LIMIT), MAX_LIMIT);

    let minPrice = parsePrice(query.min_price);
    let maxPrice = parsePrice(query.max_price);
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
        [minPrice, maxPrice] = [maxPrice, minPrice];
    }

    const sort = Object.prototype.hasOwnProperty.call(ALLOWED_SORTS, query.sort) ? query.sort : "latest";

    const category = query.category ? String(query.category).trim().toLowerCase().slice(0, 80) : null;
    const subcategory = query.subcategory ? String(query.subcategory).trim().toLowerCase().slice(0, 80) : null;
    const search = query.search ? String(query.search).trim().slice(0, 100) : null;

    return {
        page,
        limit,
        offset: (page - 1) * limit,
        minPrice,
        maxPrice,
        sortSql: ALLOWED_SORTS[sort],
        category,
        subcategory,
        search: search || null,
    };
}

function isValidSlug(slug) {
    return typeof slug === "string" && slug.trim().length > 0 && slug.trim().length <= 160;
}

function validateToggle(body) {
    const { variant_id } = body || {};

    if (variant_id === undefined || variant_id === null || variant_id === "") {
        return "variant_id is required";
    }

    const parsed = Number(variant_id);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        return "variant_id must be a valid positive integer";
    }

    return null;
}

export { parseListingQuery, isValidSlug, validateToggle };
