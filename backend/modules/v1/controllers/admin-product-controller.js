import db from "../../../config/db.js";
import dbHelper from "../../../config/dbHelper.js";
import { getProductContent } from "./admin-product-content-controller.js";
import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";
import {
    isPositiveInt,
    pickStorefrontFields,
    slugify,
    toBool01,
    parseProductListingQuery,
    validateProductBody,
    validateVariantBody,
    validateImageBody,
    validateStatusBody,
} from "../validators/admin-product-validation.js";

function toNumber(value) {
    return value === null || value === undefined ? value : Number(value);
}

async function isSlugTaken(slug, excludeId = null) {
    const sql = excludeId
        ? "SELECT id FROM products WHERE slug = ? AND id != ? LIMIT 1"
        : "SELECT id FROM products WHERE slug = ? LIMIT 1";
    const params = excludeId ? [slug, excludeId] : [slug];
    const [rows] = await db.query(sql, params);
    return rows.length > 0;
}

async function isSkuTaken(sku, excludeId = null) {
    const sql = excludeId
        ? "SELECT id FROM product_variants WHERE sku = ? AND id != ? LIMIT 1"
        : "SELECT id FROM product_variants WHERE sku = ? LIMIT 1";
    const params = excludeId ? [sku, excludeId] : [sku];
    const [rows] = await db.query(sql, params);
    return rows.length > 0;
}

async function getActiveSubCategory(sub_category_id) {
    const [rows] = await db.query("SELECT id FROM sub_categories WHERE id = ? AND is_delete = 0 LIMIT 1", [sub_category_id]);
    return rows[0] || null;
}

async function getActiveProduct(product_id) {
    const [rows] = await db.query("SELECT id FROM products WHERE id = ? AND is_delete = 0 LIMIT 1", [product_id]);
    return rows[0] || null;
}

// ---------------- Product ----------------

const createProduct = async (req, res) => {
    try {
        const error = validateProductBody(req.body, { requireName: true, requireSubCategory: true });
        if (error) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
        }

        const sub_category_id = Number(req.body.sub_category_id);
        if (!(await getActiveSubCategory(sub_category_id))) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Sub-category not found", null);
        }

        const name = String(req.body.name).trim();
        const slug = req.body.slug ? slugify(req.body.slug, 160) : slugify(name, 160);
        if (!slug) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "A valid slug could not be derived from name", null);
        }
        if (await isSlugTaken(slug)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, "A product with this slug already exists", null);
        }

        const [result] = await dbHelper.insertQuery("products", {
            sub_category_id,
            name,
            slug,
            short_description: req.body.short_description ? String(req.body.short_description).trim() : null,
            description: req.body.description ? String(req.body.description).trim() : null,
            brand_name: req.body.brand_name ? String(req.body.brand_name).trim() : null,
            is_featured: req.body.is_featured !== undefined ? toBool01(req.body.is_featured) : 0,
            ...pickStorefrontFields(req.body),
        });

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Product created successfully", { id: result.insertId, name, slug });
    } catch (error) {
        console.error("Admin create product error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const getProducts = async (req, res) => {
    try {
        const { page, limit, offset, search, status, category_id, subcategory_id, sortSql } = parseProductListingQuery(req.query);

        const conditions = ["p.is_delete = 0"];
        const params = [];
        if (search) {
            conditions.push("(p.name LIKE ? OR p.short_description LIKE ? OR p.brand_name LIKE ?)");
            const like = `%${search}%`;
            params.push(like, like, like);
        }
        if (status !== null) {
            conditions.push("p.is_active = ?");
            params.push(status);
        }
        if (subcategory_id) {
            conditions.push("p.sub_category_id = ?");
            params.push(subcategory_id);
        }
        if (category_id) {
            conditions.push("c.id = ?");
            params.push(category_id);
        }
        const whereClause = conditions.join(" AND ");

        const baseFrom = `
            FROM products p
            JOIN sub_categories sc ON sc.id = p.sub_category_id
            JOIN categories c ON c.id = sc.category_id
            WHERE ${whereClause}
        `;

        const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total ${baseFrom}`, params);

        const [rows] = await db.query(
            `SELECT p.id, p.name, p.slug, p.short_description, p.brand_name, p.is_featured, p.is_bestseller, p.is_active, p.created_at,
                    sc.id AS sub_category_id, sc.name AS sub_category_name,
                    c.id AS category_id, c.name AS category_name,
                    (SELECT pi.image_url FROM product_images pi
                     WHERE pi.product_id = p.id AND pi.is_delete = 0
                     ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC LIMIT 1) AS image_url,
                    (SELECT MIN(pv.selling_price) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_delete = 0) AS min_price,
                    (SELECT MAX(pv.selling_price) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_delete = 0) AS max_price,
                    (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_delete = 0) AS variant_count,
                    (SELECT COALESCE(SUM(GREATEST(inv.stock_quantity - inv.reserved_quantity, 0)), 0)
                     FROM product_variants pv JOIN inventory inv ON inv.variant_id = pv.id
                     WHERE pv.product_id = p.id AND pv.is_delete = 0) AS available_stock
             ${baseFrom}
             ORDER BY ${sortSql}
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        const products = rows.map((r) => ({
            id: r.id,
            name: r.name,
            slug: r.slug,
            short_description: r.short_description,
            brand_name: r.brand_name,
            is_featured: !!r.is_featured,
            is_bestseller: !!r.is_bestseller,
            is_active: !!r.is_active,
            created_at: r.created_at,
            image_url: r.image_url,
            min_price: toNumber(r.min_price),
            max_price: toNumber(r.max_price),
            variant_count: Number(r.variant_count),
            available_stock: Number(r.available_stock),
            category: { id: r.category_id, name: r.category_name },
            sub_category: { id: r.sub_category_id, name: r.sub_category_name },
        }));

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Products fetched successfully", products, {
            current_page: page,
            per_page: limit,
            total,
            total_pages: total > 0 ? Math.ceil(total / limit) : 0,
        });
    } catch (error) {
        console.error("Admin get products error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isPositiveInt(id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }

        const [productRows] = await db.query(
            `SELECT p.id, p.name, p.slug, p.short_description, p.description, p.brand_name, p.is_featured, p.is_active, p.created_at, p.updated_at,
                    p.origin, p.processing, p.delivery_min_days, p.delivery_max_days, p.is_bestseller, p.sort_order,
                    sc.id AS sub_category_id, sc.name AS sub_category_name,
                    c.id AS category_id, c.name AS category_name
             FROM products p
             JOIN sub_categories sc ON sc.id = p.sub_category_id
             JOIN categories c ON c.id = sc.category_id
             WHERE p.id = ? AND p.is_delete = 0
             LIMIT 1`,
            [id]
        );
        if (productRows.length === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }
        const product = productRows[0];

        const [variantRows] = await db.query(
            `SELECT pv.id, pv.variant_name, pv.weight_value, pv.weight_unit, pv.sku, pv.mrp, pv.selling_price, pv.is_default, pv.is_active,
                    COALESCE(inv.stock_quantity, 0) AS stock_quantity,
                    COALESCE(inv.reserved_quantity, 0) AS reserved_quantity
             FROM product_variants pv
             LEFT JOIN inventory inv ON inv.variant_id = pv.id AND inv.is_delete = 0
             WHERE pv.product_id = ? AND pv.is_delete = 0
             ORDER BY pv.is_default DESC, pv.id ASC`,
            [product.id]
        );

        const [images] = await db.query(
            `SELECT id, variant_id, image_url, alt_text, sort_order, is_primary, is_active
             FROM product_images
             WHERE product_id = ? AND is_delete = 0
             ORDER BY sort_order ASC`,
            [product.id]
        );

        const content = await getProductContent(db, product.id);

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Product fetched successfully", {
            id: product.id,
            name: product.name,
            slug: product.slug,
            short_description: product.short_description,
            description: product.description,
            brand_name: product.brand_name,
            is_featured: !!product.is_featured,
            is_bestseller: !!product.is_bestseller,
            is_active: !!product.is_active,
            origin: product.origin,
            processing: product.processing,
            delivery_min_days: product.delivery_min_days,
            delivery_max_days: product.delivery_max_days,
            sort_order: product.sort_order,
            created_at: product.created_at,
            updated_at: product.updated_at,
            category: { id: product.category_id, name: product.category_name },
            sub_category: { id: product.sub_category_id, name: product.sub_category_name },
            variants: variantRows.map((v) => ({
                id: v.id,
                variant_name: v.variant_name,
                weight_value: toNumber(v.weight_value),
                weight_unit: v.weight_unit,
                sku: v.sku,
                mrp: toNumber(v.mrp),
                selling_price: toNumber(v.selling_price),
                is_default: !!v.is_default,
                is_active: !!v.is_active,
                stock_quantity: toNumber(v.stock_quantity),
                reserved_quantity: toNumber(v.reserved_quantity),
                available_quantity: Math.max(toNumber(v.stock_quantity) - toNumber(v.reserved_quantity), 0),
            })),
            images: images.map((img) => ({ ...img, is_primary: !!img.is_primary, is_active: !!img.is_active })),
            // nutrients, lipid_profile, certifications, health_benefits, storage_tips, related_products
            ...content,
        });
    } catch (error) {
        console.error("Admin get product error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isPositiveInt(id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }
        const error = validateProductBody(req.body, { requireName: true, requireSubCategory: true });
        if (error) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
        }

        if (!(await getActiveProduct(id))) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }

        const sub_category_id = Number(req.body.sub_category_id);
        if (!(await getActiveSubCategory(sub_category_id))) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Sub-category not found", null);
        }

        const name = String(req.body.name).trim();
        const slug = req.body.slug ? slugify(req.body.slug, 160) : slugify(name, 160);
        if (!slug) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "A valid slug could not be derived from name", null);
        }
        if (await isSlugTaken(slug, id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, "A product with this slug already exists", null);
        }

        await dbHelper.updateQuery(
            "products",
            {
                sub_category_id,
                name,
                slug,
                short_description: req.body.short_description ? String(req.body.short_description).trim() : null,
                description: req.body.description ? String(req.body.description).trim() : null,
                brand_name: req.body.brand_name ? String(req.body.brand_name).trim() : null,
                is_featured: req.body.is_featured !== undefined ? toBool01(req.body.is_featured) : 0,
                ...pickStorefrontFields(req.body),
            },
            "id = ?",
            [id]
        );

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Product updated successfully", { id: Number(id), name, slug });
    } catch (error) {
        console.error("Admin update product error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const updateProductStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isPositiveInt(id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }
        const error = validateStatusBody(req.body);
        if (error) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
        }

        const is_active = toBool01(req.body.is_active);
        const [result] = await db.query("UPDATE products SET is_active = ? WHERE id = ? AND is_delete = 0", [is_active, id]);
        if (result.affectedRows === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Product status updated", { id: Number(id), is_active: !!is_active });
    } catch (error) {
        console.error("Admin update product status error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isPositiveInt(id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }

        const [result] = await db.query("UPDATE products SET is_delete = 1, is_active = 0 WHERE id = ? AND is_delete = 0", [id]);
        if (result.affectedRows === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Product deleted successfully", null);
    } catch (error) {
        console.error("Admin delete product error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

// ---------------- Variant ----------------

const createVariant = async (req, res) => {
    const { productId } = req.params;
    if (!isPositiveInt(productId)) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
    }
    const error = validateVariantBody(req.body, { requireAll: true });
    if (error) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
    }

    const sku = String(req.body.sku).trim();
    if (await isSkuTaken(sku)) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, "A variant with this SKU already exists", null);
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [productRows] = await connection.query("SELECT id FROM products WHERE id = ? AND is_delete = 0 LIMIT 1 FOR UPDATE", [productId]);
        if (productRows.length === 0) {
            await connection.rollback();
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }

        const is_default = req.body.is_default !== undefined ? toBool01(req.body.is_default) : 0;
        if (is_default) {
            await connection.query("UPDATE product_variants SET is_default = 0 WHERE product_id = ?", [productId]);
        }

        const [result] = await connection.query(
            `INSERT INTO product_variants (product_id, variant_name, weight_value, weight_unit, sku, mrp, selling_price, is_default)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                productId,
                String(req.body.variant_name).trim(),
                req.body.weight_value !== undefined && req.body.weight_value !== "" ? Number(req.body.weight_value) : null,
                req.body.weight_unit ? String(req.body.weight_unit).trim().toLowerCase() : null,
                sku,
                Number(req.body.mrp),
                Number(req.body.selling_price),
                is_default,
            ]
        );

        const variantId = result.insertId;
        // Every variant needs an inventory row to be manageable from the Inventory endpoints.
        await connection.query(
            "INSERT INTO inventory (variant_id, stock_quantity, reserved_quantity) VALUES (?, 0, 0)",
            [variantId]
        );

        await connection.commit();

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Variant created successfully", { id: variantId, product_id: Number(productId), sku });
    } catch (error) {
        await connection.rollback();
        console.error("Admin create variant error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    } finally {
        connection.release();
    }
};

const getVariantsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        if (!isPositiveInt(productId)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }
        if (!(await getActiveProduct(productId))) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }

        const [rows] = await db.query(
            `SELECT pv.id, pv.variant_name, pv.weight_value, pv.weight_unit, pv.sku, pv.mrp, pv.selling_price, pv.is_default, pv.is_active,
                    COALESCE(inv.stock_quantity, 0) AS stock_quantity,
                    COALESCE(inv.reserved_quantity, 0) AS reserved_quantity
             FROM product_variants pv
             LEFT JOIN inventory inv ON inv.variant_id = pv.id AND inv.is_delete = 0
             WHERE pv.product_id = ? AND pv.is_delete = 0
             ORDER BY pv.is_default DESC, pv.id ASC`,
            [productId]
        );

        const variants = rows.map((v) => ({
            id: v.id,
            variant_name: v.variant_name,
            weight_value: toNumber(v.weight_value),
            weight_unit: v.weight_unit,
            sku: v.sku,
            mrp: toNumber(v.mrp),
            selling_price: toNumber(v.selling_price),
            is_default: !!v.is_default,
            is_active: !!v.is_active,
            stock_quantity: toNumber(v.stock_quantity),
            reserved_quantity: toNumber(v.reserved_quantity),
            available_quantity: Math.max(toNumber(v.stock_quantity) - toNumber(v.reserved_quantity), 0),
        }));

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Variants fetched successfully", variants);
    } catch (error) {
        console.error("Admin get variants error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const getVariantById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isPositiveInt(id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Variant not found", null);
        }

        const [rows] = await db.query(
            `SELECT pv.id, pv.product_id, p.name AS product_name, pv.variant_name, pv.weight_value, pv.weight_unit, pv.sku,
                    pv.mrp, pv.selling_price, pv.is_default, pv.is_active,
                    COALESCE(inv.stock_quantity, 0) AS stock_quantity,
                    COALESCE(inv.reserved_quantity, 0) AS reserved_quantity
             FROM product_variants pv
             JOIN products p ON p.id = pv.product_id
             LEFT JOIN inventory inv ON inv.variant_id = pv.id AND inv.is_delete = 0
             WHERE pv.id = ? AND pv.is_delete = 0
             LIMIT 1`,
            [id]
        );
        if (rows.length === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Variant not found", null);
        }
        const v = rows[0];

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Variant fetched successfully", {
            id: v.id,
            product: { id: v.product_id, name: v.product_name },
            variant_name: v.variant_name,
            weight_value: toNumber(v.weight_value),
            weight_unit: v.weight_unit,
            sku: v.sku,
            mrp: toNumber(v.mrp),
            selling_price: toNumber(v.selling_price),
            is_default: !!v.is_default,
            is_active: !!v.is_active,
            stock_quantity: toNumber(v.stock_quantity),
            reserved_quantity: toNumber(v.reserved_quantity),
            available_quantity: Math.max(toNumber(v.stock_quantity) - toNumber(v.reserved_quantity), 0),
        });
    } catch (error) {
        console.error("Admin get variant error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const updateVariant = async (req, res) => {
    const { id } = req.params;
    if (!isPositiveInt(id)) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Variant not found", null);
    }
    const error = validateVariantBody(req.body, { requireAll: true });
    if (error) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
    }

    const sku = String(req.body.sku).trim();

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [existingRows] = await connection.query("SELECT id, product_id FROM product_variants WHERE id = ? AND is_delete = 0 LIMIT 1 FOR UPDATE", [id]);
        if (existingRows.length === 0) {
            await connection.rollback();
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Variant not found", null);
        }
        const productId = existingRows[0].product_id;

        const [dupRows] = await connection.query("SELECT id FROM product_variants WHERE sku = ? AND id != ? LIMIT 1", [sku, id]);
        if (dupRows.length > 0) {
            await connection.rollback();
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, "A variant with this SKU already exists", null);
        }

        const is_default = req.body.is_default !== undefined ? toBool01(req.body.is_default) : 0;
        if (is_default) {
            await connection.query("UPDATE product_variants SET is_default = 0 WHERE product_id = ? AND id != ?", [productId, id]);
        }

        await connection.query(
            `UPDATE product_variants
             SET variant_name = ?, weight_value = ?, weight_unit = ?, sku = ?, mrp = ?, selling_price = ?, is_default = ?
             WHERE id = ?`,
            [
                String(req.body.variant_name).trim(),
                req.body.weight_value !== undefined && req.body.weight_value !== "" ? Number(req.body.weight_value) : null,
                req.body.weight_unit ? String(req.body.weight_unit).trim().toLowerCase() : null,
                sku,
                Number(req.body.mrp),
                Number(req.body.selling_price),
                is_default,
                id,
            ]
        );

        await connection.commit();

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Variant updated successfully", { id: Number(id), sku });
    } catch (error) {
        await connection.rollback();
        console.error("Admin update variant error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    } finally {
        connection.release();
    }
};

const updateVariantStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isPositiveInt(id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Variant not found", null);
        }
        const error = validateStatusBody(req.body);
        if (error) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
        }

        const is_active = toBool01(req.body.is_active);
        const [result] = await db.query("UPDATE product_variants SET is_active = ? WHERE id = ? AND is_delete = 0", [is_active, id]);
        if (result.affectedRows === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Variant not found", null);
        }

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Variant status updated", { id: Number(id), is_active: !!is_active });
    } catch (error) {
        console.error("Admin update variant status error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const deleteVariant = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isPositiveInt(id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Variant not found", null);
        }

        const [result] = await db.query("UPDATE product_variants SET is_delete = 1, is_active = 0 WHERE id = ? AND is_delete = 0", [id]);
        if (result.affectedRows === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Variant not found", null);
        }

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Variant deleted successfully", null);
    } catch (error) {
        console.error("Admin delete variant error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

// ---------------- Image ----------------

const createImage = async (req, res) => {
    const { productId } = req.params;
    if (!isPositiveInt(productId)) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
    }
    const error = validateImageBody(req.body, { requireAll: true });
    if (error) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [productRows] = await connection.query("SELECT id FROM products WHERE id = ? AND is_delete = 0 LIMIT 1 FOR UPDATE", [productId]);
        if (productRows.length === 0) {
            await connection.rollback();
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }

        const is_primary = req.body.is_primary !== undefined ? toBool01(req.body.is_primary) : 0;
        if (is_primary) {
            await connection.query("UPDATE product_images SET is_primary = 0 WHERE product_id = ?", [productId]);
        }

        const [result] = await connection.query(
            `INSERT INTO product_images (product_id, variant_id, cloudinary_public_id, image_url, alt_text, sort_order, is_primary)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                productId,
                req.body.variant_id ? Number(req.body.variant_id) : null,
                String(req.body.cloudinary_public_id).trim(),
                String(req.body.image_url).trim(),
                req.body.alt_text ? String(req.body.alt_text).trim() : null,
                req.body.sort_order !== undefined && req.body.sort_order !== "" ? Number(req.body.sort_order) : 0,
                is_primary,
            ]
        );

        await connection.commit();

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Image added successfully", { id: result.insertId, product_id: Number(productId) });
    } catch (error) {
        await connection.rollback();
        console.error("Admin create image error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    } finally {
        connection.release();
    }
};

const getImagesByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        if (!isPositiveInt(productId)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }
        if (!(await getActiveProduct(productId))) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }

        const [rows] = await db.query(
            `SELECT id, variant_id, cloudinary_public_id, image_url, alt_text, sort_order, is_primary, is_active
             FROM product_images
             WHERE product_id = ? AND is_delete = 0
             ORDER BY sort_order ASC`,
            [productId]
        );

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Images fetched successfully",
            rows.map((img) => ({ ...img, is_primary: !!img.is_primary, is_active: !!img.is_active }))
        );
    } catch (error) {
        console.error("Admin get images error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const updateImage = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isPositiveInt(id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Image not found", null);
        }
        const error = validateImageBody(req.body, { requireAll: true });
        if (error) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
        }

        const [existingRows] = await db.query("SELECT id FROM product_images WHERE id = ? AND is_delete = 0 LIMIT 1", [id]);
        if (existingRows.length === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Image not found", null);
        }

        await dbHelper.updateQuery(
            "product_images",
            {
                variant_id: req.body.variant_id ? Number(req.body.variant_id) : null,
                cloudinary_public_id: String(req.body.cloudinary_public_id).trim(),
                image_url: String(req.body.image_url).trim(),
                alt_text: req.body.alt_text ? String(req.body.alt_text).trim() : null,
                sort_order: req.body.sort_order !== undefined && req.body.sort_order !== "" ? Number(req.body.sort_order) : 0,
            },
            "id = ?",
            [id]
        );

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Image updated successfully", { id: Number(id) });
    } catch (error) {
        console.error("Admin update image error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const setPrimaryImage = async (req, res) => {
    const { id } = req.params;
    if (!isPositiveInt(id)) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Image not found", null);
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [rows] = await connection.query("SELECT id, product_id FROM product_images WHERE id = ? AND is_delete = 0 LIMIT 1 FOR UPDATE", [id]);
        if (rows.length === 0) {
            await connection.rollback();
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Image not found", null);
        }

        await connection.query("UPDATE product_images SET is_primary = 0 WHERE product_id = ?", [rows[0].product_id]);
        await connection.query("UPDATE product_images SET is_primary = 1 WHERE id = ?", [id]);

        await connection.commit();

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Image set as primary", { id: Number(id) });
    } catch (error) {
        await connection.rollback();
        console.error("Admin set primary image error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    } finally {
        connection.release();
    }
};

const deleteImage = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isPositiveInt(id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Image not found", null);
        }

        const [result] = await db.query("UPDATE product_images SET is_delete = 1, is_active = 0, is_primary = 0 WHERE id = ? AND is_delete = 0", [id]);
        if (result.affectedRows === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Image not found", null);
        }

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Image deleted successfully", null);
    } catch (error) {
        console.error("Admin delete image error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

export {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    updateProductStatus,
    deleteProduct,
    createVariant,
    getVariantsByProduct,
    getVariantById,
    updateVariant,
    updateVariantStatus,
    deleteVariant,
    createImage,
    getImagesByProduct,
    updateImage,
    setPrimaryImage,
    deleteImage,
};
