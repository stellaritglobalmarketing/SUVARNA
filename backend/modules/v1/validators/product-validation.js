// Public listing endpoint — invalid/missing query params silently fall back to
// sane defaults instead of erroring (matches the project's existing pagination convention).

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 24;

// Values are interpolated into ORDER BY, so only these fixed strings may ever be used.
const ALLOWED_SORTS = {
    featured: "p.sort_order ASC",
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

    const sort = Object.prototype.hasOwnProperty.call(ALLOWED_SORTS, query.sort) ? query.sort : "featured";

    const search = query.search ? String(query.search).trim().slice(0, 100) : null;

    // Comma-separated product slugs, e.g. for rendering a wishlist in one call.
    const slugs = query.slugs
        ? [...new Set(String(query.slugs).split(",").map((s) => s.trim().toLowerCase()).filter(isValidSlug))].slice(0, MAX_LIMIT)
        : [];

    return {
        page,
        limit,
        offset: (page - 1) * limit,
        minPrice,
        maxPrice,
        sortSql: ALLOWED_SORTS[sort],
        search: search || null,
        slugs: slugs.length > 0 ? slugs : null,
    };
}

const DEFAULT_REVIEW_LIMIT = 10;
const MAX_REVIEW_LIMIT = 20;

function parseReviewQuery(query = {}) {
    const page = parsePositiveInt(query.page, 1);
    const limit = Math.min(parsePositiveInt(query.limit, DEFAULT_REVIEW_LIMIT), MAX_REVIEW_LIMIT);
    return { page, limit, offset: (page - 1) * limit };
}

function validateReviewBody(body) {
    const { rating, title, review_text } = body || {};
    const parsed = Number(rating);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
        return "rating must be a whole number from 1 to 5";
    }
    if (title !== undefined && title !== null && String(title).trim().length > 128) {
        return "title must be 128 characters or fewer";
    }
    if (review_text !== undefined && review_text !== null && String(review_text).trim().length > 1000) {
        return "review_text must be 1000 characters or fewer";
    }
    return null;
}

function isValidSlug(slug) {
    return typeof slug === "string" && slug.trim().length > 0 && slug.trim().length <= 160;
}

export { parseListingQuery, parseReviewQuery, isValidSlug, validateReviewBody };
