import db from "../../../config/db.js";
import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";
import { parseProductContent } from "../validators/admin-product-content-validation.js";

function isPositiveInt(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0;
}

/**
 * Product-page content for one product, as the admin edits it. Also used by
 * GET /admin/product/:id so the edit form loads everything in one call.
 */
async function getProductContent(conn, productId) {
    const [[nutrients], [lipidProfile], [certifications], [benefits], [tips], [related]] = await Promise.all([
        conn.query(
            "SELECT label, value_per_100g, daily_value_percent FROM product_nutrients WHERE product_id = ? ORDER BY sort_order, id",
            [productId]
        ),
        conn.query("SELECT label, percent, color FROM product_lipid_profile WHERE product_id = ? ORDER BY sort_order, id", [productId]),
        conn.query("SELECT label, description FROM product_certifications WHERE product_id = ? ORDER BY sort_order, id", [productId]),
        conn.query("SELECT benefit FROM product_health_benefits WHERE product_id = ? ORDER BY benefit", [productId]),
        conn.query("SELECT shelf_life_tip, storage_tip, usage_tip FROM product_storage_tips WHERE product_id = ?", [productId]),
        conn.query(
            `SELECT p.id, p.name, p.slug
             FROM product_related pr
             JOIN products p ON p.id = pr.related_product_id AND p.is_delete = 0
             WHERE pr.product_id = ?
             ORDER BY pr.sort_order`,
            [productId]
        ),
    ]);

    return {
        nutrients,
        lipid_profile: lipidProfile.map((row) => ({ ...row, percent: Number(row.percent) })),
        certifications,
        health_benefits: benefits.map((row) => row.benefit),
        storage_tips: tips[0] ? { shelf_life: tips[0].shelf_life_tip, storage: tips[0].storage_tip, usage: tips[0].usage_tip } : null,
        related_products: related,
    };
}

/**
 * PUT /admin/product/:id/content — replaces any of: nutrients, lipid_profile, certifications,
 * health_benefits, storage_tips, related_product_ids. Sections left out are untouched; an empty
 * array (or null storage_tips) clears that section. All changes apply together or not at all.
 */
const updateProductContent = async (req, res) => {
    const { id } = req.params;
    if (!isPositiveInt(id)) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
    }
    const { error, content } = parseProductContent(req.body);
    if (error) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
    }

    const productId = Number(id);
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [productRows] = await conn.query("SELECT id FROM products WHERE id = ? AND is_delete = 0 LIMIT 1 FOR UPDATE", [productId]);
        if (productRows.length === 0) {
            await conn.rollback();
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }

        if (content.related_product_ids) {
            const ids = content.related_product_ids;
            if (ids.includes(productId)) {
                await conn.rollback();
                return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "A product can't be related to itself", null);
            }
            if (ids.length > 0) {
                const [found] = await conn.query(
                    `SELECT id FROM products WHERE id IN (${ids.map(() => "?").join(",")}) AND is_delete = 0`,
                    ids
                );
                const missing = ids.filter((relatedId) => !found.some((row) => row.id === relatedId));
                if (missing.length > 0) {
                    await conn.rollback();
                    return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, `Related product(s) not found: ${missing.join(", ")}`, null);
                }
            }
        }

        // Replace each list: delete the product's rows, then bulk-insert the new ones in order.
        const replaceList = async (table, columns, rows) => {
            await conn.query(`DELETE FROM ${table} WHERE product_id = ?`, [productId]);
            if (rows.length > 0) {
                await conn.query(`INSERT INTO ${table} (product_id, ${columns.join(", ")}) VALUES ?`, [
                    rows.map((row) => [productId, ...row]),
                ]);
            }
        };

        if (content.nutrients) {
            await replaceList(
                "product_nutrients",
                ["label", "value_per_100g", "daily_value_percent", "sort_order"],
                content.nutrients.map((n, i) => [n.label, n.value_per_100g, n.daily_value_percent, i + 1])
            );
        }
        if (content.lipid_profile) {
            await replaceList(
                "product_lipid_profile",
                ["label", "percent", "color", "sort_order"],
                content.lipid_profile.map((l, i) => [l.label, l.percent, l.color, i + 1])
            );
        }
        if (content.certifications) {
            await replaceList(
                "product_certifications",
                ["label", "description", "sort_order"],
                content.certifications.map((c, i) => [c.label, c.description, i + 1])
            );
        }
        if (content.health_benefits) {
            await replaceList("product_health_benefits", ["benefit"], content.health_benefits.map((b) => [b]));
        }
        if (content.related_product_ids) {
            await replaceList(
                "product_related",
                ["related_product_id", "sort_order"],
                content.related_product_ids.map((relatedId, i) => [relatedId, i + 1])
            );
        }
        if (content.storage_tips !== undefined) {
            if (content.storage_tips === null) {
                await conn.query("DELETE FROM product_storage_tips WHERE product_id = ?", [productId]);
            } else {
                await conn.query(
                    `INSERT INTO product_storage_tips (product_id, shelf_life_tip, storage_tip, usage_tip)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE shelf_life_tip = VALUES(shelf_life_tip), storage_tip = VALUES(storage_tip), usage_tip = VALUES(usage_tip)`,
                    [productId, content.storage_tips.shelf_life_tip, content.storage_tips.storage_tip, content.storage_tips.usage_tip]
                );
            }
        }

        const updated = await getProductContent(conn, productId);
        await conn.commit();
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Product content updated", updated);
    } catch (err) {
        await conn.rollback();
        console.error("Admin update product content error: ", err);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    } finally {
        conn.release();
    }
};

export { getProductContent, updateProductContent };
