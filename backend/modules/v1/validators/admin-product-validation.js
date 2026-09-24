const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const ALLOWED_SORTS = {
    latest: "p.created_at DESC",
    oldest: "p.created_at ASC",
    name_asc: "p.name ASC",
    name_desc: "p.name DESC",
};

const WEIGHT_UNITS = ["g", "kg", "ml", "l", "pcs"];

function isPositiveInt(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0;
}

function isNonNegativeNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0;
}

function slugify(text, maxLength) {
    return String(text)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, maxLength);
}

function toBool01(value) {
    return Number(value) ? 1 : 0;
}

function parseProductListingQuery(query = {}) {
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
    const sort = Object.prototype.hasOwnProperty.call(ALLOWED_SORTS, query.sort) ? query.sort : "latest";

    let status = null;
    if (query.status === "active") {
        status = 1;
    } else if (query.status === "inactive") {
        status = 0;
    }

    const category_id = isPositiveInt(query.category_id) ? Number(query.category_id) : null;
    const subcategory_id = isPositiveInt(query.subcategory_id) ? Number(query.subcategory_id) : null;

    return {
        page,
        limit,
        offset: (page - 1) * limit,
        search,
        status,
        category_id,
        subcategory_id,
        sortSql: ALLOWED_SORTS[sort],
    };
}

function validateProductBody(body, { requireName, requireSubCategory }) {
    const { sub_category_id, name, slug, short_description, description, brand_name, is_featured } = body || {};

    if (requireSubCategory && !isPositiveInt(sub_category_id)) {
        return "sub_category_id is required and must be a valid positive integer";
    }
    if (sub_category_id !== undefined && sub_category_id !== null && !isPositiveInt(sub_category_id)) {
        return "sub_category_id must be a valid positive integer";
    }
    if (requireName && (!name || !String(name).trim())) {
        return "name is required";
    }
    if (name !== undefined && String(name).trim().length > 128) {
        return "name must be 128 characters or fewer";
    }
    if (slug !== undefined && slug !== null && slug !== "" && String(slug).trim().length > 160) {
        return "slug must be 160 characters or fewer";
    }
    if (short_description !== undefined && short_description !== null && String(short_description).length > 255) {
        return "short_description must be 255 characters or fewer";
    }
    if (brand_name !== undefined && brand_name !== null && String(brand_name).length > 64) {
        return "brand_name must be 64 characters or fewer";
    }
    if (is_featured !== undefined && ![0, 1].includes(Number(is_featured))) {
        return "is_featured must be a boolean";
    }

    const { origin, processing, delivery_min_days, delivery_max_days, is_bestseller, sort_order } = body || {};
    if (origin !== undefined && origin !== null && String(origin).trim().length > 64) {
        return "origin must be 64 characters or fewer";
    }
    if (processing !== undefined && processing !== null && String(processing).trim().length > 64) {
        return "processing must be 64 characters or fewer";
    }
    for (const [key, value] of [["delivery_min_days", delivery_min_days], ["delivery_max_days", delivery_max_days]]) {
        if (value !== undefined && (!Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) > 60)) {
            return `${key} must be a whole number from 0 to 60`;
        }
    }
    if (delivery_min_days !== undefined && delivery_max_days !== undefined && Number(delivery_min_days) > Number(delivery_max_days)) {
        return "delivery_min_days cannot be more than delivery_max_days";
    }
    if (is_bestseller !== undefined && ![0, 1].includes(Number(is_bestseller))) {
        return "is_bestseller must be a boolean";
    }
    if (sort_order !== undefined && (!Number.isInteger(Number(sort_order)) || Number(sort_order) < 0 || Number(sort_order) > 65535)) {
        return "sort_order must be a whole number ≥ 0";
    }

    return null;
}

/**
 * Storefront fields that older admin clients don't send: only the ones present in the body are
 * returned, so an update that omits them leaves the stored values alone.
 */
function pickStorefrontFields(body = {}) {
    const fields = {};
    if (body.origin !== undefined) fields.origin = body.origin ? String(body.origin).trim() : null;
    if (body.processing !== undefined) fields.processing = body.processing ? String(body.processing).trim() : null;
    if (body.delivery_min_days !== undefined) fields.delivery_min_days = Number(body.delivery_min_days);
    if (body.delivery_max_days !== undefined) fields.delivery_max_days = Number(body.delivery_max_days);
    if (body.is_bestseller !== undefined) fields.is_bestseller = Number(body.is_bestseller) ? 1 : 0;
    if (body.sort_order !== undefined) fields.sort_order = Number(body.sort_order);
    return fields;
}

function validateVariantBody(body, { requireAll }) {
    const { variant_name, weight_value, weight_unit, sku, mrp, selling_price, is_default } = body || {};

    if (requireAll && (!variant_name || !String(variant_name).trim())) {
        return "variant_name is required";
    }
    if (variant_name !== undefined && String(variant_name).trim().length > 64) {
        return "variant_name must be 64 characters or fewer";
    }
    if (requireAll && (!sku || !String(sku).trim())) {
        return "sku is required";
    }
    if (sku !== undefined && String(sku).trim().length > 64) {
        return "sku must be 64 characters or fewer";
    }
    if (weight_value !== undefined && weight_value !== null && weight_value !== "" && !isNonNegativeNumber(weight_value)) {
        return "weight_value must be a valid non-negative number";
    }
    if (weight_unit !== undefined && weight_unit !== null && weight_unit !== "" && !WEIGHT_UNITS.includes(String(weight_unit).toLowerCase())) {
        return `weight_unit must be one of: ${WEIGHT_UNITS.join(", ")}`;
    }
    if (requireAll && !isNonNegativeNumber(mrp)) {
        return "mrp is required and must be a valid non-negative number";
    }
    if (mrp !== undefined && !isNonNegativeNumber(mrp)) {
        return "mrp must be a valid non-negative number";
    }
    if (requireAll && !isNonNegativeNumber(selling_price)) {
        return "selling_price is required and must be a valid non-negative number";
    }
    if (selling_price !== undefined && !isNonNegativeNumber(selling_price)) {
        return "selling_price must be a valid non-negative number";
    }
    if (mrp !== undefined && selling_price !== undefined && Number(selling_price) > Number(mrp)) {
        return "selling_price cannot be greater than mrp";
    }
    if (is_default !== undefined && ![0, 1].includes(Number(is_default))) {
        return "is_default must be a boolean";
    }

    return null;
}

function validateImageBody(body, { requireAll }) {
    const { cloudinary_public_id, image_url, alt_text, sort_order, is_primary, variant_id } = body || {};

    if (requireAll && (!cloudinary_public_id || !String(cloudinary_public_id).trim())) {
        return "cloudinary_public_id is required";
    }
    if (requireAll && (!image_url || !String(image_url).trim())) {
        return "image_url is required";
    }
    if (image_url !== undefined && String(image_url).length > 512) {
        return "image_url must be 512 characters or fewer";
    }
    if (alt_text !== undefined && alt_text !== null && String(alt_text).length > 160) {
        return "alt_text must be 160 characters or fewer";
    }
    if (sort_order !== undefined && sort_order !== null && sort_order !== "" && !Number.isInteger(Number(sort_order))) {
        return "sort_order must be an integer";
    }
    if (is_primary !== undefined && ![0, 1].includes(Number(is_primary))) {
        return "is_primary must be a boolean";
    }
    if (variant_id !== undefined && variant_id !== null && variant_id !== "" && !isPositiveInt(variant_id)) {
        return "variant_id must be a valid positive integer";
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
    pickStorefrontFields,
    isPositiveInt,
    isNonNegativeNumber,
    slugify,
    toBool01,
    parseProductListingQuery,
    validateProductBody,
    validateVariantBody,
    validateImageBody,
    validateStatusBody,
};
