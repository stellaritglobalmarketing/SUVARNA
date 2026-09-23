import db from "../../../config/db.js";
import dbHelper from "../../../config/dbHelper.js";
import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";
import { parseListingQuery, isValidSlug, validateToggle } from "../validators/product-validation.js";

// Batches the "best" image (primary first, else lowest sort_order) for a set of
// product ids in a single query, regardless of how many products were passed in.
async function attachImages(products) {
    if (products.length === 0) {
        return products;
    }

    const ids = products.map((p) => p.id);
    const placeholders = ids.map(() => "?").join(",");

    const [imageRows] = await db.query(
        `SELECT product_id, image_url FROM (
            SELECT product_id, image_url,
                   ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY is_primary DESC, sort_order ASC) AS rn
            FROM product_images
            WHERE product_id IN (${placeholders}) AND is_active = 1 AND is_delete = 0
        ) ranked
        WHERE rn = 1`,
        ids
    );

    const imageMap = new Map(imageRows.map((r) => [r.product_id, r.image_url]));
    return products.map((p) => ({ ...p, image_url: imageMap.get(p.id) || null }));
}

// mysql2 returns DECIMAL columns (and expressions derived from them) as strings
// to avoid float precision loss — cast back to Number for the JSON response.
function toNumber(value) {
    return value === null || value === undefined ? value : Number(value);
}

const PRICE_AGGREGATE_SUBQUERY = `
    SELECT product_id, MIN(selling_price) AS min_price, MAX(selling_price) AS max_price
    FROM product_variants
    WHERE is_active = 1 AND is_delete = 0
    GROUP BY product_id
`;

// Shared by every "product card" section on the home page (featured, best sellers, ...):
// batches images and casts the DECIMAL price columns back to numbers.
async function finalizeProductCards(rows) {
    const withImages = await attachImages(rows);
    return withImages.map((p) => ({
        ...p,
        min_price: toNumber(p.min_price),
        max_price: toNumber(p.max_price),
    }));
}

const getHome = async (req, res) => {
    try {
        const [categories] = await db.query(
            `SELECT id, name, slug, image_url
             FROM categories
             WHERE is_active = 1 AND is_delete = 0
             ORDER BY is_featured DESC, name ASC`
        );

        const [featuredRows] = await db.query(
            `SELECT p.id, p.name, p.slug, p.short_description, pr.min_price, pr.max_price
             FROM products p
             JOIN sub_categories sc ON sc.id = p.sub_category_id AND sc.is_active = 1 AND sc.is_delete = 0
             JOIN categories c ON c.id = sc.category_id AND c.is_active = 1 AND c.is_delete = 0
             JOIN (${PRICE_AGGREGATE_SUBQUERY}) pr ON pr.product_id = p.id
             WHERE p.is_featured = 1 AND p.is_active = 1 AND p.is_delete = 0
             ORDER BY p.created_at DESC
             LIMIT 10`
        );
        const featured_products = await finalizeProductCards(featuredRows);

        // No is_bestseller flag exists — "best seller" is derived from actual
        // sales: total quantity sold across non-cancelled orders. Cancelled
        // orders never resulted in a real sale, so they're excluded.
        const [bestSellerRows] = await db.query(
            `SELECT p.id, p.name, p.slug, p.short_description, pr.min_price, pr.max_price
             FROM order_items oi
             JOIN orders o ON o.id = oi.order_id AND o.is_delete = 0 AND o.order_status != 'cancelled'
             JOIN products p ON p.id = oi.product_id AND p.is_active = 1 AND p.is_delete = 0
             JOIN sub_categories sc ON sc.id = p.sub_category_id AND sc.is_active = 1 AND sc.is_delete = 0
             JOIN categories c ON c.id = sc.category_id AND c.is_active = 1 AND c.is_delete = 0
             JOIN (${PRICE_AGGREGATE_SUBQUERY}) pr ON pr.product_id = p.id
             GROUP BY p.id, p.name, p.slug, p.short_description, pr.min_price, pr.max_price
             ORDER BY SUM(oi.quantity) DESC
             LIMIT 10`
        );
        const best_sellers = await finalizeProductCards(bestSellerRows);

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Home data fetched successfully", {
            categories,
            featured_products,
            best_sellers,
        });
    } catch (error) {
        console.error("Get home error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const getProducts = async (req, res) => {
    try {
        const { page, limit, offset, minPrice, maxPrice, sortSql, category, subcategory, search } = parseListingQuery(req.query);

        const conditions = ["p.is_active = 1", "p.is_delete = 0"];
        const params = [];

        if (category) {
            conditions.push("c.slug = ?");
            params.push(category);
        }
        if (subcategory) {
            conditions.push("sc.slug = ?");
            params.push(subcategory);
        }
        if (search) {
            conditions.push("(p.name LIKE ? OR p.short_description LIKE ? OR p.brand_name LIKE ?)");
            const like = `%${search}%`;
            params.push(like, like, like);
        }
        if (minPrice !== null || maxPrice !== null) {
            let priceCondition = `EXISTS (
                SELECT 1 FROM product_variants pvf
                WHERE pvf.product_id = p.id AND pvf.is_active = 1 AND pvf.is_delete = 0`;
            if (minPrice !== null) {
                priceCondition += " AND pvf.selling_price >= ?";
                params.push(minPrice);
            }
            if (maxPrice !== null) {
                priceCondition += " AND pvf.selling_price <= ?";
                params.push(maxPrice);
            }
            priceCondition += ")";
            conditions.push(priceCondition);
        }

        const whereClause = conditions.join(" AND ");

        const baseFrom = `
            FROM products p
            JOIN sub_categories sc ON sc.id = p.sub_category_id AND sc.is_active = 1 AND sc.is_delete = 0
            JOIN categories c ON c.id = sc.category_id AND c.is_active = 1 AND c.is_delete = 0
            JOIN (${PRICE_AGGREGATE_SUBQUERY}) pr ON pr.product_id = p.id
            WHERE ${whereClause}
        `;

        const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total ${baseFrom}`, params);

        const [rows] = await db.query(
            `SELECT p.id, p.name, p.slug, p.short_description, pr.min_price, pr.max_price,
                    c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
                    sc.id AS sub_category_id, sc.name AS sub_category_name, sc.slug AS sub_category_slug
             ${baseFrom}
             ORDER BY ${sortSql}
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        const withImages = await attachImages(rows);

        const products = withImages.map((r) => ({
            id: r.id,
            name: r.name,
            slug: r.slug,
            short_description: r.short_description,
            image_url: r.image_url,
            min_price: toNumber(r.min_price),
            max_price: toNumber(r.max_price),
            category: { id: r.category_id, name: r.category_name, slug: r.category_slug },
            sub_category: { id: r.sub_category_id, name: r.sub_category_name, slug: r.sub_category_slug },
        }));

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Products fetched successfully", products, {
            current_page: page,
            per_page: limit,
            total,
            total_pages: total > 0 ? Math.ceil(total / limit) : 0,
        });
    } catch (error) {
        console.error("Get products error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const getProductDetails = async (req, res) => {
    try {
        const { slug } = req.params;
        if (!isValidSlug(slug)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }

        const [productRows] = await db.query(
            `SELECT p.id, p.name, p.slug, p.short_description, p.description, p.brand_name,
                    c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
                    sc.id AS sub_category_id, sc.name AS sub_category_name, sc.slug AS sub_category_slug
             FROM products p
             JOIN sub_categories sc ON sc.id = p.sub_category_id AND sc.is_active = 1 AND sc.is_delete = 0
             JOIN categories c ON c.id = sc.category_id AND c.is_active = 1 AND c.is_delete = 0
             WHERE p.slug = ? AND p.is_active = 1 AND p.is_delete = 0
             LIMIT 1`,
            [slug.trim()]
        );

        if (productRows.length === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }

        const product = productRows[0];

        const [variantRows] = await db.query(
            `SELECT pv.id, pv.variant_name, pv.weight_value, pv.weight_unit, pv.sku, pv.mrp, pv.selling_price, pv.is_default,
                    COALESCE(inv.stock_quantity, 0) AS stock_quantity,
                    (COALESCE(inv.stock_quantity, 0) > COALESCE(inv.reserved_quantity, 0)) AS in_stock
             FROM product_variants pv
             LEFT JOIN inventory inv ON inv.variant_id = pv.id AND inv.is_active = 1 AND inv.is_delete = 0
             WHERE pv.product_id = ? AND pv.is_active = 1 AND pv.is_delete = 0
             ORDER BY pv.is_default DESC, pv.weight_value ASC`,
            [product.id]
        );

        const [images] = await db.query(
            `SELECT id, image_url, alt_text, sort_order, is_primary
             FROM product_images
             WHERE product_id = ? AND is_active = 1 AND is_delete = 0
             ORDER BY sort_order ASC`,
            [product.id]
        );

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Product details fetched successfully", {
            id: product.id,
            name: product.name,
            slug: product.slug,
            short_description: product.short_description,
            description: product.description,
            brand_name: product.brand_name,
            category: { id: product.category_id, name: product.category_name, slug: product.category_slug },
            sub_category: { id: product.sub_category_id, name: product.sub_category_name, slug: product.sub_category_slug },
            variants: variantRows.map((v) => ({
                id: v.id,
                variant_name: v.variant_name,
                weight_value: toNumber(v.weight_value),
                weight_unit: v.weight_unit,
                sku: v.sku,
                mrp: toNumber(v.mrp),
                selling_price: toNumber(v.selling_price),
                is_default: !!v.is_default,
                stock_quantity: toNumber(v.stock_quantity),
                in_stock: !!v.in_stock,
            })),
            images,
        });
    } catch (error) {
        console.error("Get product details error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const toggleWishlist = async (req, res) => {
    try {
        const error = validateToggle(req.body);
        if (error) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
        }

        const user_id = req.user.id;
        const variant_id = Number(req.body.variant_id);

        const [existing] = await db.query(
            "SELECT id FROM wishlist WHERE user_id = ? AND product_variant_id = ? LIMIT 1",
            [user_id, variant_id]
        );

        if (existing.length > 0) {
            await db.query("DELETE FROM wishlist WHERE id = ?", [existing[0].id]);
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Removed from wishlist", {
                variant_id,
                wishlisted: false,
            });
        }

        const [variantRows] = await db.query(
            "SELECT id FROM product_variants WHERE id = ? AND is_active = 1 AND is_delete = 0 LIMIT 1",
            [variant_id]
        );
        if (variantRows.length === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product variant not found", null);
        }

        try {
            await dbHelper.insertQuery("wishlist", { user_id, product_variant_id: variant_id });
        } catch (err) {
            // Two rapid toggles racing each other can both pass the existence
            // check before either inserts — the unique constraint on
            // (user_id, product_variant_id) then rejects the second insert.
            // Treat that as "already wishlisted" rather than a failure.
            if (err.code !== "ER_DUP_ENTRY") {
                throw err;
            }
        }

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Added to wishlist", {
            variant_id,
            wishlisted: true,
        });
    } catch (error) {
        console.error("Toggle wishlist error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

export { getHome, getProducts, getProductDetails, toggleWishlist };
