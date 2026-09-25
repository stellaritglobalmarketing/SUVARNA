import db from "../../../config/db.js";
import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";
import { parseListingQuery, parseReviewQuery, isValidSlug, validateReviewBody } from "../validators/product-validation.js";

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

// Default variant first, then smallest pack first — weights are normalised to g/ml so
// "250g" sorts before "1kg" (weight_value alone would put 1 before 250).
const VARIANT_ORDER_SQL = `pv.is_default DESC,
    pv.weight_value * CASE pv.weight_unit WHEN 'kg' THEN 1000 WHEN 'l' THEN 1000 ELSE 1 END ASC,
    pv.id ASC`;

const HOME_PRODUCT_LIMIT = 24;
const SIMILAR_PRODUCT_LIMIT = 4;

// Columns every product card needs (see buildProductCards). Only products with at least one
// live variant come through the join.
const PRODUCT_CARD_COLUMNS = `
    p.id, p.name, p.slug, p.short_description, p.description, p.origin, p.processing,
    p.delivery_min_days, p.delivery_max_days, p.is_featured, p.is_bestseller,
    pr.min_price, pr.max_price`;

const PRODUCT_CARD_FROM = `
    FROM products p
    JOIN (${PRICE_AGGREGATE_SUBQUERY}) pr ON pr.product_id = p.id`;

const LIVE_PRODUCT_WHERE = "p.is_active = 1 AND p.is_delete = 0";

function productWhere(where) {
    return where ? `${LIVE_PRODUCT_WHERE} AND (${where})` : LIVE_PRODUCT_WHERE;
}

// Card rows for live products, optionally narrowed by an extra SQL condition on `p`.
// `orderBy` must come from a fixed whitelist (never user input) since it's interpolated.
async function queryProductCardRows({ where = null, params = [], orderBy = "p.sort_order ASC", limit, offset = 0 }) {
    const [rows] = await db.query(
        `SELECT ${PRODUCT_CARD_COLUMNS}
         ${PRODUCT_CARD_FROM}
         WHERE ${productWhere(where)}
         ORDER BY ${orderBy}, p.id ASC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );
    return rows;
}

function discountPercent(sellingPrice, mrp) {
    return mrp > 0 && sellingPrice < mrp ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
}

// Only approved, non-deleted reviews count towards a product's rating.
const APPROVED_REVIEWS = "r.is_approved = 1 AND r.is_delete = 0";

function groupByProduct(rows, mapRow) {
    const map = new Map();
    for (const row of rows) {
        const list = map.get(row.product_id) || [];
        list.push(mapRow(row));
        map.set(row.product_id, list);
    }
    return map;
}

// Full storefront product card — everything the product card design renders — built from
// already-fetched product rows. Each related list is one batched query for all the rows.
async function buildProductCards(rows) {
    if (rows.length === 0) {
        return [];
    }

    const ids = rows.map((r) => r.id);
    const placeholders = ids.map(() => "?").join(",");

    const [[variantRows], [imageRows], [certificationRows], [benefitRows], [ratingRows]] = await Promise.all([
        db.query(
            `SELECT pv.id, pv.product_id, pv.variant_name, pv.weight_value, pv.weight_unit, pv.sku, pv.mrp,
                    pv.selling_price, pv.is_default,
                    GREATEST(COALESCE(inv.stock_quantity, 0) - COALESCE(inv.reserved_quantity, 0), 0) AS available_quantity
             FROM product_variants pv
             LEFT JOIN inventory inv ON inv.variant_id = pv.id AND inv.is_active = 1 AND inv.is_delete = 0
             WHERE pv.product_id IN (${placeholders}) AND pv.is_active = 1 AND pv.is_delete = 0
             ORDER BY ${VARIANT_ORDER_SQL}`,
            ids
        ),
        db.query(
            `SELECT product_id, image_url
             FROM product_images
             WHERE product_id IN (${placeholders}) AND is_active = 1 AND is_delete = 0
             ORDER BY is_primary DESC, sort_order ASC, id ASC`,
            ids
        ),
        db.query(
            `SELECT product_id, label, description
             FROM product_certifications
             WHERE product_id IN (${placeholders})
             ORDER BY sort_order ASC, id ASC`,
            ids
        ),
        db.query(
            `SELECT product_id, benefit FROM product_health_benefits WHERE product_id IN (${placeholders}) ORDER BY benefit ASC`,
            ids
        ),
        db.query(
            `SELECT r.product_id, ROUND(AVG(r.rating), 1) AS rating, COUNT(*) AS review_count
             FROM reviews r
             WHERE r.product_id IN (${placeholders}) AND ${APPROVED_REVIEWS}
             GROUP BY r.product_id`,
            ids
        ),
    ]);

    const variantsByProduct = groupByProduct(variantRows, (v) => {
        const available = toNumber(v.available_quantity);
        return {
            id: v.id,
            variant_name: v.variant_name,
            weight_value: toNumber(v.weight_value),
            weight_unit: v.weight_unit,
            sku: v.sku,
            mrp: toNumber(v.mrp),
            selling_price: toNumber(v.selling_price),
            is_default: !!v.is_default,
            available_quantity: available,
            in_stock: available > 0,
        };
    });
    const imagesByProduct = groupByProduct(imageRows, (img) => img.image_url);
    const certificationsByProduct = groupByProduct(certificationRows, (c) => ({ label: c.label, description: c.description }));
    const benefitsByProduct = groupByProduct(benefitRows, (b) => b.benefit);
    const ratingByProduct = new Map(ratingRows.map((r) => [r.product_id, r]));

    return rows.map((r) => {
        const variants = variantsByProduct.get(r.id) || [];
        const images = imagesByProduct.get(r.id) || [];
        const rating = ratingByProduct.get(r.id);
        const defaultVariant = variants[0];

        return {
            id: r.id,
            name: r.name,
            slug: r.slug,
            short_description: r.short_description,
            description: r.description,
            origin: r.origin,
            processing: r.processing,
            health_benefits: benefitsByProduct.get(r.id) || [],
            certifications: certificationsByProduct.get(r.id) || [],
            rating: rating ? toNumber(rating.rating) : 0,
            review_count: rating ? Number(rating.review_count) : 0,
            is_featured: !!r.is_featured,
            is_bestseller: !!r.is_bestseller,
            discount_percent: defaultVariant ? discountPercent(defaultVariant.selling_price, defaultVariant.mrp) : 0,
            delivery_estimate_days: [r.delivery_min_days, r.delivery_max_days],
            image_url: images[0] || null,
            images,
            min_price: toNumber(r.min_price),
            max_price: toNumber(r.max_price),
            variants,
        };
    });
}

/** Star distribution for the review summary bars: [{ stars: 5, percent: 68 }, …, { stars: 1, … }]. */
async function ratingBreakdown(productId) {
    const [rows] = await db.query(
        `SELECT r.rating, COUNT(*) AS count
         FROM reviews r
         WHERE r.product_id = ? AND ${APPROVED_REVIEWS}
         GROUP BY r.rating`,
        [productId]
    );
    const counts = new Map(rows.map((row) => [row.rating, Number(row.count)]));
    const total = rows.reduce((sum, row) => sum + Number(row.count), 0);
    return [5, 4, 3, 2, 1].map((stars) => ({
        stars,
        count: counts.get(stars) || 0,
        percent: total > 0 ? Math.round(((counts.get(stars) || 0) / total) * 100) : 0,
    }));
}

function mapBanner(row) {
    if (!row) {
        return null;
    }
    return {
        id: row.id,
        eyebrow: row.eyebrow,
        title: row.title,
        subtitle: row.subtitle,
        image_url: row.image_url,
        image_alt: row.image_alt,
        cta: row.cta_label && row.cta_href ? { label: row.cta_label, href: row.cta_href } : null,
        secondary_cta:
            row.secondary_cta_label && row.secondary_cta_href
                ? { label: row.secondary_cta_label, href: row.secondary_cta_href }
                : null,
    };
}

// Everything the home page renders, in one request. Each list is independent, so the
// queries run in parallel; any section can come back empty and the frontend hides it.
const getHome = async (req, res) => {
    try {
        const [
            productRows,
            [bannerRows],
            [highlightRows],
            [hamperRows],
            [testimonialRows],
            [faqRows],
        ] = await Promise.all([
            queryProductCardRows({ limit: HOME_PRODUCT_LIMIT }),
            db.query(
                `SELECT id, placement, eyebrow, title, subtitle, image_url, image_alt,
                        cta_label, cta_href, secondary_cta_label, secondary_cta_href
                 FROM home_banners
                 WHERE placement IN ('hero', 'promo') AND is_active = 1 AND is_delete = 0
                 ORDER BY sort_order ASC, id ASC`
            ),
            db.query(
                `SELECT id, placement, icon, title, description
                 FROM home_highlights
                 WHERE is_active = 1 AND is_delete = 0
                 ORDER BY sort_order ASC, id ASC`
            ),
            db.query(
                `SELECT h.id, h.name, h.slug, h.subtitle, h.image_url,
                        GROUP_CONCAT(p.slug ORDER BY hp.sort_order ASC SEPARATOR ',') AS product_slugs
                 FROM hampers h
                 LEFT JOIN hamper_products hp ON hp.hamper_id = h.id
                 LEFT JOIN products p ON p.id = hp.product_id AND p.is_active = 1 AND p.is_delete = 0
                 WHERE h.is_active = 1 AND h.is_delete = 0
                 GROUP BY h.id, h.name, h.slug, h.subtitle, h.image_url, h.sort_order
                 ORDER BY h.sort_order ASC, h.id ASC`
            ),
            db.query(
                `SELECT id, customer_name, location, rating, quote
                 FROM testimonials
                 WHERE is_active = 1 AND is_delete = 0
                 ORDER BY sort_order ASC, id ASC`
            ),
            db.query(
                `SELECT id, question, answer
                 FROM faqs
                 WHERE is_active = 1 AND is_delete = 0
                 ORDER BY sort_order ASC, id ASC`
            ),
        ]);

        const products = await buildProductCards(productRows);

        const highlightsFor = (placement) =>
            highlightRows
                .filter((h) => h.placement === placement)
                .map((h) => ({ id: h.id, icon: h.icon, title: h.title, description: h.description }));

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Home data fetched successfully", {
            hero: mapBanner(bannerRows.find((b) => b.placement === "hero")),
            promo: mapBanner(bannerRows.find((b) => b.placement === "promo")),
            highlights: {
                hero: highlightsFor("hero"),
                trust_badges: highlightsFor("trust_badge"),
                trust_points: highlightsFor("trust_point"),
            },
            products,
            featured_products: products.filter((p) => p.is_featured),
            best_sellers: products.filter((p) => p.is_bestseller),
            hampers: hamperRows.map((h) => ({
                id: h.id,
                name: h.name,
                slug: h.slug,
                subtitle: h.subtitle,
                image_url: h.image_url,
                product_slugs: h.product_slugs ? h.product_slugs.split(",") : [],
            })),
            testimonials: testimonialRows.map((t) => ({
                id: t.id,
                name: t.customer_name,
                location: t.location,
                rating: t.rating,
                quote: t.quote,
            })),
            faqs: faqRows,
        });
    } catch (error) {
        console.error("Get home error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

// Search / listing — returns the same full card as the home page. `slugs` fetches specific
// products in one call (wishlist, recently viewed).
const getProducts = async (req, res) => {
    try {
        const { page, limit, offset, minPrice, maxPrice, sortSql, search, slugs } = parseListingQuery(req.query);

        const conditions = [];
        const params = [];

        if (slugs) {
            conditions.push(`p.slug IN (${slugs.map(() => "?").join(",")})`);
            params.push(...slugs);
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

        const where = conditions.length > 0 ? conditions.join(" AND ") : null;

        const [[[{ total }]], rows] = await Promise.all([
            db.query(`SELECT COUNT(*) AS total ${PRODUCT_CARD_FROM} WHERE ${productWhere(where)}`, params),
            queryProductCardRows({ where, params, orderBy: sortSql, limit, offset }),
        ]);
        const products = await buildProductCards(rows);

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
            `SELECT ${PRODUCT_CARD_COLUMNS},
                    p.brand_name
             ${PRODUCT_CARD_FROM}
             WHERE p.slug = ? AND ${LIVE_PRODUCT_WHERE}
             LIMIT 1`,
            [slug.trim()]
        );

        if (productRows.length === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }

        const product = productRows[0];

        const [[card], [nutrientRows], [lipidRows], [tipRows], [relatedRows], breakdown, similarRows] = await Promise.all([
            buildProductCards([product]),
            db.query(
                `SELECT label, value_per_100g, daily_value_percent
                 FROM product_nutrients WHERE product_id = ? ORDER BY sort_order ASC, id ASC`,
                [product.id]
            ),
            db.query(
                `SELECT label, percent, color
                 FROM product_lipid_profile WHERE product_id = ? ORDER BY sort_order ASC, id ASC`,
                [product.id]
            ),
            db.query("SELECT shelf_life_tip, storage_tip, usage_tip FROM product_storage_tips WHERE product_id = ?", [product.id]),
            db.query(
                "SELECT related_product_id FROM product_related WHERE product_id = ? ORDER BY sort_order ASC",
                [product.id]
            ),
            ratingBreakdown(product.id),
            // "You may also like": other products, those sharing the most health benefits first.
            queryProductCardRows({
                where: "p.id <> ?",
                params: [product.id, product.id],
                orderBy: `(SELECT COUNT(*) FROM product_health_benefits phb
                           WHERE phb.product_id = p.id
                             AND phb.benefit IN (SELECT benefit FROM product_health_benefits WHERE product_id = ?)) DESC,
                          p.sort_order ASC`,
                limit: SIMILAR_PRODUCT_LIMIT,
            }),
        ]);

        const relatedIds = relatedRows.map((row) => row.related_product_id);
        const companionRows = relatedIds.length
            ? await queryProductCardRows({
                  where: `p.id IN (${relatedIds.map(() => "?").join(",")})`,
                  params: relatedIds,
                  limit: relatedIds.length,
              })
            : [];

        const [companionCards, similarCards] = await Promise.all([
            buildProductCards(companionRows),
            buildProductCards(similarRows),
        ]);
        // Keep the admin-chosen order of "frequently bought with", not the catalog order.
        companionCards.sort((a, b) => relatedIds.indexOf(a.id) - relatedIds.indexOf(b.id));

        const tips = tipRows[0];

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Product details fetched successfully", {
            ...card,
            brand_name: product.brand_name,
            nutrients: nutrientRows,
            lipid_profile: lipidRows.map((row) => ({ ...row, percent: toNumber(row.percent) })),
            rating_breakdown: breakdown,
            storage_tips: tips
                ? { shelf_life: tips.shelf_life_tip, storage: tips.storage_tip, usage: tips.usage_tip }
                : null,
            frequently_bought_with: companionCards,
            similar_products: similarCards,
        });
    } catch (error) {
        console.error("Get product details error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

// Approved reviews for one product, newest first, plus its rating summary — all computed from `reviews`.
const getProductReviews = async (req, res) => {
    try {
        const { slug } = req.params;
        if (!isValidSlug(slug)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }
        const { page, limit, offset } = parseReviewQuery(req.query);

        const [productRows] = await db.query(
            `SELECT id FROM products WHERE slug = ? AND is_active = 1 AND is_delete = 0 LIMIT 1`,
            [slug.trim()]
        );
        if (productRows.length === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }
        const productId = productRows[0].id;

        const [breakdown, [[summary]], [reviewRows]] = await Promise.all([
            ratingBreakdown(productId),
            db.query(
                `SELECT ROUND(AVG(r.rating), 1) AS rating, COUNT(*) AS total
                 FROM reviews r WHERE r.product_id = ? AND ${APPROVED_REVIEWS}`,
                [productId]
            ),
            db.query(
                `SELECT r.id, u.name AS author, r.is_verified_purchase, r.rating, r.title, r.review_text, r.created_at
                 FROM reviews r
                 JOIN users u ON u.id = r.user_id
                 WHERE r.product_id = ? AND ${APPROVED_REVIEWS}
                 ORDER BY r.created_at DESC, r.id DESC
                 LIMIT ? OFFSET ?`,
                [productId, limit, offset]
            ),
        ]);
        const total = Number(summary.total);

        return middleware.sendResponse(
            res,
            Codes.SUCCESS,
            Codes.RESPONSE_SUCCESS,
            "Reviews fetched successfully",
            {
                rating: total > 0 ? toNumber(summary.rating) : 0,
                review_count: total,
                breakdown,
                reviews: reviewRows.map((r) => ({
                    id: r.id,
                    author: r.author,
                    is_verified_purchase: !!r.is_verified_purchase,
                    rating: r.rating,
                    title: r.title,
                    body: r.review_text,
                    created_at: r.created_at,
                })),
            },
            { current_page: page, per_page: limit, total, total_pages: total > 0 ? Math.ceil(total / limit) : 0 }
        );
    } catch (error) {
        console.error("Get product reviews error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

// A customer writes (or rewrites) their one review of a product. It goes to moderation: it
// counts towards the rating only once an admin approves it. "Verified purchase" is set when
// the customer has a paid, non-cancelled order containing the product.
const submitProductReview = async (req, res) => {
    try {
        const { slug } = req.params;
        if (!isValidSlug(slug)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }
        const error = validateReviewBody(req.body);
        if (error) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
        }

        const [productRows] = await db.query(
            "SELECT id FROM products WHERE slug = ? AND is_active = 1 AND is_delete = 0 LIMIT 1",
            [slug.trim()]
        );
        if (productRows.length === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }
        const productId = productRows[0].id;
        const user_id = req.user.id;

        const [[{ purchased }]] = await db.query(
            `SELECT EXISTS (
                SELECT 1 FROM order_items oi
                JOIN orders o ON o.id = oi.order_id
                WHERE o.user_id = ? AND oi.product_id = ? AND o.payment_status = 'paid'
                  AND o.order_status <> 'cancelled' AND o.is_delete = 0
             ) AS purchased`,
            [user_id, productId]
        );

        const rating = Number(req.body.rating);
        const title = req.body.title ? String(req.body.title).trim() : null;
        const text = req.body.review_text ? String(req.body.review_text).trim() : null;

        await db.query(
            `INSERT INTO reviews (user_id, product_id, rating, title, review_text, is_verified_purchase, is_approved)
             VALUES (?, ?, ?, ?, ?, ?, 0)
             ON DUPLICATE KEY UPDATE rating = VALUES(rating), title = VALUES(title), review_text = VALUES(review_text),
                is_verified_purchase = VALUES(is_verified_purchase), is_approved = 0, is_delete = 0`,
            [user_id, productId, rating, title, text, purchased ? 1 : 0]
        );

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Thanks! Your review will appear once it's approved.", {
            rating,
            is_verified_purchase: !!purchased,
            is_approved: false,
        });
    } catch (error) {
        console.error("Submit review error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

// The logged-in customer's saved products, most recently saved first, as full product cards.
const getWishlist = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT ${PRODUCT_CARD_COLUMNS}
             ${PRODUCT_CARD_FROM}
             JOIN wishlist w ON w.product_id = p.id AND w.user_id = ?
             WHERE ${LIVE_PRODUCT_WHERE}
             ORDER BY w.created_at DESC, w.id DESC`,
            [req.user.id]
        );
        const products = await buildProductCards(rows);
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Wishlist fetched successfully", products);
    } catch (error) {
        console.error("Get wishlist error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

// Idempotent: saving an already-saved product is a no-op success.
const addToWishlist = async (req, res) => {
    try {
        const { slug } = req.params;
        if (!isValidSlug(slug)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }

        const [productRows] = await db.query(
            `SELECT id FROM products WHERE slug = ? AND is_active = 1 AND is_delete = 0 LIMIT 1`,
            [slug.trim()]
        );
        if (productRows.length === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }

        // INSERT IGNORE + the (user_id, product_id) unique key also absorbs double-clicks racing each other.
        await db.query("INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)", [req.user.id, productRows[0].id]);

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Added to wishlist", {
            slug: slug.trim(),
            wishlisted: true,
        });
    } catch (error) {
        console.error("Add to wishlist error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

// Idempotent: removing a product that isn't saved is a no-op success. Works even if the
// product has since been deactivated, so stale entries can always be cleared.
const removeFromWishlist = async (req, res) => {
    try {
        const { slug } = req.params;
        if (!isValidSlug(slug)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product not found", null);
        }

        await db.query(
            `DELETE w FROM wishlist w
             JOIN products p ON p.id = w.product_id
             WHERE w.user_id = ? AND p.slug = ?`,
            [req.user.id, slug.trim()]
        );

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Removed from wishlist", {
            slug: slug.trim(),
            wishlisted: false,
        });
    } catch (error) {
        console.error("Remove from wishlist error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

export {
    getHome,
    getProducts,
    getProductDetails,
    getProductReviews,
    submitProductReview,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
};
