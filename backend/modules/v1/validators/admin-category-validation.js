const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function isPositiveInt(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0;
}

function slugify(text, maxLength) {
    return String(text)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, maxLength);
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

    let status = null;
    if (query.status === "active") {
        status = 1;
    } else if (query.status === "inactive") {
        status = 0;
    }

    return { page, limit, offset: (page - 1) * limit, search, status };
}

function validateCategoryBody(body, { requireName }) {
    const { name, slug, description, image_url, is_featured } = body || {};

    if (requireName && (!name || !String(name).trim())) {
        return "name is required";
    }
    if (name !== undefined && String(name).trim().length > 64) {
        return "name must be 64 characters or fewer";
    }
    if (slug !== undefined && slug !== null && slug !== "" && String(slug).trim().length > 80) {
        return "slug must be 80 characters or fewer";
    }
    if (description !== undefined && description !== null && String(description).length > 255) {
        return "description must be 255 characters or fewer";
    }
    if (image_url !== undefined && image_url !== null && String(image_url).length > 512) {
        return "image_url must be 512 characters or fewer";
    }
    if (is_featured !== undefined && ![0, 1, true, false].includes(is_featured) && ![0, 1].includes(Number(is_featured))) {
        return "is_featured must be a boolean";
    }

    return null;
}

function validateSubCategoryBody(body, { requireName, requireCategory }) {
    const { category_id, name, slug, description, image_url, is_featured } = body || {};

    if (requireCategory && !isPositiveInt(category_id)) {
        return "category_id is required and must be a valid positive integer";
    }
    if (category_id !== undefined && category_id !== null && !isPositiveInt(category_id)) {
        return "category_id must be a valid positive integer";
    }
    if (requireName && (!name || !String(name).trim())) {
        return "name is required";
    }
    if (name !== undefined && String(name).trim().length > 64) {
        return "name must be 64 characters or fewer";
    }
    if (slug !== undefined && slug !== null && slug !== "" && String(slug).trim().length > 80) {
        return "slug must be 80 characters or fewer";
    }
    if (description !== undefined && description !== null && String(description).length > 255) {
        return "description must be 255 characters or fewer";
    }
    if (image_url !== undefined && image_url !== null && String(image_url).length > 512) {
        return "image_url must be 512 characters or fewer";
    }
    if (is_featured !== undefined && ![0, 1, true, false].includes(is_featured) && ![0, 1].includes(Number(is_featured))) {
        return "is_featured must be a boolean";
    }

    return null;
}

function validateStatusBody(body) {
    const { is_active } = body || {};
    if (is_active === undefined || is_active === null || ![0, 1].includes(Number(is_active))) {
        return "is_active is required and must be 0 or 1";
    }
    return null;
}

export {
    isPositiveInt,
    slugify,
    parseListingQuery,
    validateCategoryBody,
    validateSubCategoryBody,
    validateStatusBody,
};
