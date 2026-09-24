import db from "../../../config/db.js";
import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";

// Admin CRUD for the home page content blocks. Each resource is described once below (table,
// fields and their rules); the handlers are shared. All deletes are soft deletes.

// Icon keys the storefront can render (frontend/src/lib/utils/homeIcons.ts).
const HIGHLIGHT_ICONS = ["badge-check", "heart-pulse", "leaf", "package-check", "shield-check", "sprout", "truck", "users"];

const RESOURCES = {
    banners: {
        table: "home_banners",
        label: "Banner",
        orderBy: "placement ASC, sort_order ASC, id ASC",
        fields: {
            placement: { type: "enum", values: ["hero", "promo"], required: true },
            eyebrow: { type: "text", max: 64 },
            title: { type: "text", max: 160, required: true },
            subtitle: { type: "text", max: 512 },
            image_url: { type: "text", max: 512, required: true },
            image_alt: { type: "text", max: 160 },
            cta_label: { type: "text", max: 64 },
            cta_href: { type: "text", max: 255 },
            secondary_cta_label: { type: "text", max: 64 },
            secondary_cta_href: { type: "text", max: 255 },
            sort_order: { type: "int", min: 0, max: 65535 },
        },
    },
    highlights: {
        table: "home_highlights",
        label: "Highlight",
        orderBy: "placement ASC, sort_order ASC, id ASC",
        unique: ["placement", "title"],
        fields: {
            placement: { type: "enum", values: ["hero", "trust_badge", "trust_point"], required: true },
            icon: { type: "enum", values: HIGHLIGHT_ICONS, required: true },
            title: { type: "text", max: 128, required: true },
            description: { type: "text", max: 255 },
            sort_order: { type: "int", min: 0, max: 65535 },
        },
    },
    testimonials: {
        table: "testimonials",
        label: "Testimonial",
        orderBy: "sort_order ASC, id ASC",
        unique: ["customer_name"],
        fields: {
            customer_name: { type: "text", max: 64, required: true },
            location: { type: "text", max: 128 },
            rating: { type: "int", min: 1, max: 5, required: true },
            quote: { type: "text", max: 1000, required: true },
            sort_order: { type: "int", min: 0, max: 65535 },
        },
    },
    faqs: {
        table: "faqs",
        label: "FAQ",
        orderBy: "sort_order ASC, id ASC",
        unique: ["question"],
        fields: {
            question: { type: "text", max: 255, required: true },
            answer: { type: "text", max: 1000, required: true },
            sort_order: { type: "int", min: 0, max: 65535 },
        },
    },
    hampers: {
        table: "hampers",
        label: "Hamper",
        orderBy: "sort_order ASC, id ASC",
        unique: ["slug"],
        fields: {
            name: { type: "text", max: 128, required: true },
            slug: { type: "slug", max: 160 },
            subtitle: { type: "text", max: 255 },
            image_url: { type: "text", max: 512 },
            sort_order: { type: "int", min: 0, max: 65535 },
        },
    },
};

function isPositiveInt(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0;
}

function slugify(text) {
    return String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 160);
}

function labelFor(field) {
    return field.replace(/_/g, " ");
}

/** Validates a full create/update body against a resource's fields. Returns { error } or { values }. */
function parseBody(resource, body = {}) {
    const values = {};
    for (const [field, rule] of Object.entries(resource.fields)) {
        const raw = body[field];
        const empty = raw === undefined || raw === null || String(raw).trim() === "";

        if (empty) {
            if (rule.required) return { error: `${labelFor(field)} is required` };
            values[field] = rule.type === "int" ? 0 : null;
            continue;
        }

        if (rule.type === "int") {
            const n = Number(raw);
            if (!Number.isInteger(n) || n < rule.min || n > rule.max) {
                return { error: `${labelFor(field)} must be a whole number from ${rule.min} to ${rule.max}` };
            }
            values[field] = n;
        } else if (rule.type === "enum") {
            const v = String(raw).trim();
            if (!rule.values.includes(v)) return { error: `${labelFor(field)} must be one of: ${rule.values.join(", ")}` };
            values[field] = v;
        } else {
            const v = rule.type === "slug" ? slugify(raw) : String(raw).trim();
            if (v.length > rule.max) return { error: `${labelFor(field)} must be ${rule.max} characters or fewer` };
            values[field] = v || null;
        }
    }
    if (resource.fields.slug && !values.slug) {
        values.slug = slugify(values.name || "");
        if (!values.slug) return { error: "A valid slug could not be made from the name" };
    }
    return { values };
}

function getResource(req, res) {
    const resource = RESOURCES[req.params.resource];
    if (!resource) {
        middleware.sendResponse(res, 404, Codes.NO_DATA_FOUND, `Unknown content type. Use one of: ${Object.keys(RESOURCES).join(", ")}`, null);
        return null;
    }
    return resource;
}

/** Hamper → its product ids (for the builder presets), keyed by hamper id. */
async function hamperProductIds(conn, hamperIds) {
    if (hamperIds.length === 0) return new Map();
    const [rows] = await conn.query(
        `SELECT hp.hamper_id, p.id, p.name
         FROM hamper_products hp JOIN products p ON p.id = hp.product_id
         WHERE hp.hamper_id IN (${hamperIds.map(() => "?").join(",")})
         ORDER BY hp.sort_order ASC`,
        hamperIds
    );
    const map = new Map();
    for (const row of rows) {
        const list = map.get(row.hamper_id) || [];
        list.push({ id: row.id, name: row.name });
        map.set(row.hamper_id, list);
    }
    return map;
}

async function parseHamperProducts(conn, body) {
    if (body.product_ids === undefined) return { ids: undefined };
    if (!Array.isArray(body.product_ids) || body.product_ids.length > 20) {
        return { error: "product_ids must be a list of up to 20 product ids" };
    }
    const ids = [...new Set(body.product_ids.map(Number))];
    if (!ids.every((id) => Number.isInteger(id) && id > 0)) return { error: "product_ids must be product ids" };
    if (ids.length > 0) {
        const [found] = await conn.query(`SELECT id FROM products WHERE id IN (${ids.map(() => "?").join(",")}) AND is_delete = 0`, ids);
        const missing = ids.filter((id) => !found.some((row) => row.id === id));
        if (missing.length > 0) return { error: `Product(s) not found: ${missing.join(", ")}` };
    }
    return { ids };
}

async function saveHamperProducts(conn, hamperId, ids) {
    await conn.query("DELETE FROM hamper_products WHERE hamper_id = ?", [hamperId]);
    if (ids.length > 0) {
        await conn.query("INSERT INTO hamper_products (hamper_id, product_id, sort_order) VALUES ?", [
            ids.map((id, i) => [hamperId, id, i + 1]),
        ]);
    }
}

/**
 * True if another live row already uses these unique values. A soft-deleted row holding them
 * (the unique keys cover deleted rows too) is removed for good, since the admin can't see or
 * restore it anyway — otherwise a deleted FAQ could never be re-added.
 */
async function findDuplicate(conn, resource, values, excludeId = null) {
    if (!resource.unique) return false;
    const where = resource.unique.map((f) => `${f} = ?`).join(" AND ");
    const params = resource.unique.map((f) => values[f]);
    const [rows] = await conn.query(
        `SELECT id, is_delete FROM ${resource.table} WHERE ${where}${excludeId ? " AND id <> ?" : ""}`,
        excludeId ? [...params, excludeId] : params
    );
    for (const row of rows.filter((r) => r.is_delete)) {
        await conn.query(`DELETE FROM ${resource.table} WHERE id = ?`, [row.id]);
    }
    return rows.some((r) => !r.is_delete);
}

// GET /admin/content/:resource — every non-deleted row (these lists are short).
const listContent = async (req, res) => {
    const resource = getResource(req, res);
    if (!resource) return;
    try {
        const [rows] = await db.query(`SELECT * FROM ${resource.table} WHERE is_delete = 0 ORDER BY ${resource.orderBy}`);
        let items = rows.map(({ is_delete, ...row }) => ({ ...row, is_active: !!row.is_active }));
        if (resource.table === "hampers") {
            const products = await hamperProductIds(db, rows.map((r) => r.id));
            items = items.map((item) => ({ ...item, products: products.get(item.id) || [] }));
        }
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, `${resource.label}s fetched successfully`, items);
    } catch (error) {
        console.error("Admin list content error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

async function saveContent(req, res, id) {
    const resource = getResource(req, res);
    if (!resource) return;
    const { error, values } = parseBody(resource, req.body);
    if (error) return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        if (id) {
            const [existing] = await conn.query(`SELECT id FROM ${resource.table} WHERE id = ? AND is_delete = 0 LIMIT 1`, [id]);
            if (existing.length === 0) {
                await conn.rollback();
                return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, `${resource.label} not found`, null);
            }
        }
        if (await findDuplicate(conn, resource, values, id)) {
            await conn.rollback();
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, `A ${resource.label.toLowerCase()} with the same ${resource.unique.join(" and ")} already exists`, null);
        }

        let hamperIds;
        if (resource.table === "hampers") {
            const parsed = await parseHamperProducts(conn, req.body);
            if (parsed.error) {
                await conn.rollback();
                return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, parsed.error, null);
            }
            hamperIds = parsed.ids;
        }

        let rowId = id;
        if (id) {
            await conn.query(`UPDATE ${resource.table} SET ? WHERE id = ?`, [values, id]);
        } else {
            const [result] = await conn.query(`INSERT INTO ${resource.table} SET ?`, [values]);
            rowId = result.insertId;
        }
        if (hamperIds !== undefined) {
            await saveHamperProducts(conn, rowId, hamperIds);
        }

        await conn.commit();
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, `${resource.label} ${id ? "updated" : "created"}`, { id: rowId });
    } catch (err) {
        await conn.rollback();
        console.error("Admin save content error: ", err);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    } finally {
        conn.release();
    }
}

// POST /admin/content/:resource
const createContent = (req, res) => saveContent(req, res, null);

// PUT /admin/content/:resource/:id — full update (hampers: product_ids replaced only when sent)
const updateContent = (req, res) => {
    if (!isPositiveInt(req.params.id)) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Not found", null);
    }
    return saveContent(req, res, Number(req.params.id));
};

// PATCH /admin/content/:resource/:id/status { is_active: 0 | 1 } — hide/show on the site
const updateContentStatus = async (req, res) => {
    const resource = getResource(req, res);
    if (!resource) return;
    const value = Number(req.body?.is_active);
    if (!isPositiveInt(req.params.id) || ![0, 1].includes(value) || req.body?.is_active === undefined) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "is_active must be 0 or 1", null);
    }
    try {
        const [result] = await db.query(`UPDATE ${resource.table} SET is_active = ? WHERE id = ? AND is_delete = 0`, [value, req.params.id]);
        if (result.affectedRows === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, `${resource.label} not found`, null);
        }
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, `${resource.label} ${value ? "shown" : "hidden"}`, {
            id: Number(req.params.id),
            is_active: !!value,
        });
    } catch (error) {
        console.error("Admin content status error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

// DELETE /admin/content/:resource/:id — soft delete
const deleteContent = async (req, res) => {
    const resource = getResource(req, res);
    if (!resource) return;
    if (!isPositiveInt(req.params.id)) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, `${resource.label} not found`, null);
    }
    try {
        const [result] = await db.query(`UPDATE ${resource.table} SET is_delete = 1 WHERE id = ? AND is_delete = 0`, [req.params.id]);
        if (result.affectedRows === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, `${resource.label} not found`, null);
        }
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, `${resource.label} deleted`, null);
    } catch (error) {
        console.error("Admin delete content error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

export { listContent, createContent, updateContent, updateContentStatus, deleteContent, HIGHLIGHT_ICONS };
