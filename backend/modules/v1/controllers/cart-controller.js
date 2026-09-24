import db from "../../../config/db.js";
import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";
import { validateAddToCart, validateUpdateQuantity, isPositiveInt } from "../validators/cart-validation.js";

async function attachImages(rows) {
    if (rows.length === 0) {
        return rows;
    }
    const productIds = [...new Set(rows.map((r) => r.product_id))];
    const placeholders = productIds.map(() => "?").join(",");
    const [imageRows] = await db.query(
        `SELECT product_id, image_url FROM (
            SELECT product_id, image_url,
                   ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY is_primary DESC, sort_order ASC) AS rn
            FROM product_images
            WHERE product_id IN (${placeholders}) AND is_active = 1 AND is_delete = 0
        ) ranked
        WHERE rn = 1`,
        productIds
    );
    const imageMap = new Map(imageRows.map((r) => [r.product_id, r.image_url]));
    return rows.map((r) => ({ ...r, image_url: imageMap.get(r.product_id) || null }));
}

function formatCartItem(r) {
    const available_stock = Math.max(r.stock_quantity - r.reserved_quantity, 0);
    const selling_price = Number(r.selling_price);
    const quantity = r.quantity;
    return {
        id: r.id,
        product_variant_id: r.product_variant_id,
        product: { id: r.product_id, name: r.product_name, slug: r.product_slug },
        variant: {
            id: r.product_variant_id,
            variant_name: r.variant_name,
            weight_value: Number(r.weight_value),
            weight_unit: r.weight_unit,
            sku: r.sku,
        },
        image_url: r.image_url,
        mrp: Number(r.mrp),
        selling_price,
        quantity,
        available_stock,
        item_total: selling_price * quantity,
    };
}

async function fetchCartItemsQuery(whereClause, params) {
    const [rows] = await db.query(
        `SELECT cart.id, cart.product_variant_id, cart.quantity,
                p.id AS product_id, p.name AS product_name, p.slug AS product_slug,
                pv.variant_name, pv.weight_value, pv.weight_unit, pv.sku, pv.mrp, pv.selling_price,
                COALESCE(inv.stock_quantity, 0) AS stock_quantity,
                COALESCE(inv.reserved_quantity, 0) AS reserved_quantity
         FROM cart
         JOIN product_variants pv ON pv.id = cart.product_variant_id
         JOIN products p ON p.id = pv.product_id
         LEFT JOIN inventory inv ON inv.variant_id = pv.id AND inv.is_active = 1 AND inv.is_delete = 0
         WHERE ${whereClause}
         ORDER BY cart.created_at ASC, cart.id ASC`,
        params
    );
    return rows;
}

async function getSingleCartItem(cartId, user_id) {
    const rows = await fetchCartItemsQuery("cart.id = ? AND cart.user_id = ?", [cartId, user_id]);
    if (rows.length === 0) {
        return null;
    }
    const [withImage] = await attachImages(rows);
    return formatCartItem(withImage);
}

async function getVariantForCart(product_variant_id) {
    const [rows] = await db.query(
        `SELECT pv.id, pv.product_id,
                COALESCE(inv.stock_quantity, 0) AS stock_quantity,
                COALESCE(inv.reserved_quantity, 0) AS reserved_quantity
         FROM product_variants pv
         JOIN products p ON p.id = pv.product_id AND p.is_active = 1 AND p.is_delete = 0
         LEFT JOIN inventory inv ON inv.variant_id = pv.id AND inv.is_active = 1 AND inv.is_delete = 0
         WHERE pv.id = ? AND pv.is_active = 1 AND pv.is_delete = 0
         LIMIT 1`,
        [product_variant_id]
    );
    return rows[0] || null;
}

const addToCart = async (req, res) => {
    try {
        const error = validateAddToCart(req.body);
        if (error) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
        }

        const user_id = req.user.id;
        const product_variant_id = Number(req.body.product_variant_id);
        const requestedQty = Number(req.body.quantity);

        const variant = await getVariantForCart(product_variant_id);
        if (!variant) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product variant not found", null);
        }

        const [existingRows] = await db.query(
            "SELECT quantity FROM cart WHERE user_id = ? AND product_variant_id = ? LIMIT 1",
            [user_id, product_variant_id]
        );
        const existingQty = existingRows[0]?.quantity || 0;
        const newQuantity = existingQty + requestedQty;

        const availableStock = Math.max(variant.stock_quantity - variant.reserved_quantity, 0);
        if (newQuantity > availableStock) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, `Only ${availableStock} unit(s) available in stock`, null);
        }

        // uq_cart_user_variant makes a re-add (or two racing adds) land on the same line.
        await db.query(
            `INSERT INTO cart (user_id, product_variant_id, quantity)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), updated_at = CURRENT_TIMESTAMP`,
            [user_id, product_variant_id, requestedQty]
        );

        const [cartRow] = await db.query(
            "SELECT id FROM cart WHERE user_id = ? AND product_variant_id = ? LIMIT 1",
            [user_id, product_variant_id]
        );
        const cartItem = await getSingleCartItem(cartRow[0].id, user_id);

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Added to cart", cartItem);
    } catch (error) {
        console.error("Add to cart error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const getCart = async (req, res) => {
    try {
        const user_id = req.user.id;
        const rows = await fetchCartItemsQuery("cart.user_id = ?", [user_id]);
        const withImages = await attachImages(rows);
        const items = withImages.map(formatCartItem);

        const summary = {
            subtotal: items.reduce((sum, item) => sum + item.item_total, 0),
            total_items: items.reduce((sum, item) => sum + item.quantity, 0),
            item_count: items.length,
        };

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Cart fetched successfully", { items, summary });
    } catch (error) {
        console.error("Get cart error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const updateCartItem = async (req, res) => {
    try {
        const cartId = req.params.id;
        if (!isPositiveInt(cartId)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "Invalid cart item id", null);
        }
        const error = validateUpdateQuantity(req.body);
        if (error) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
        }

        const user_id = req.user.id;
        const quantity = Number(req.body.quantity);

        const [ownRows] = await db.query(
            "SELECT id, product_variant_id FROM cart WHERE id = ? AND user_id = ? LIMIT 1",
            [cartId, user_id]
        );
        if (ownRows.length === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Cart item not found", null);
        }

        const variant = await getVariantForCart(ownRows[0].product_variant_id);
        if (!variant) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Product variant is no longer available", null);
        }

        const availableStock = Math.max(variant.stock_quantity - variant.reserved_quantity, 0);
        if (quantity > availableStock) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, `Only ${availableStock} unit(s) available in stock`, null);
        }

        await db.query("UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?", [quantity, cartId, user_id]);

        const cartItem = await getSingleCartItem(cartId, user_id);
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Cart updated", cartItem);
    } catch (error) {
        console.error("Update cart error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const removeCartItem = async (req, res) => {
    try {
        const cartId = req.params.id;
        if (!isPositiveInt(cartId)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "Invalid cart item id", null);
        }

        const user_id = req.user.id;
        const [result] = await db.query("DELETE FROM cart WHERE id = ? AND user_id = ?", [cartId, user_id]);
        if (result.affectedRows === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Cart item not found", null);
        }

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Cart item removed", null);
    } catch (error) {
        console.error("Remove cart item error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const clearCart = async (req, res) => {
    try {
        const user_id = req.user.id;
        await db.query("DELETE FROM cart WHERE user_id = ?", [user_id]);
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Cart cleared", null);
    } catch (error) {
        console.error("Clear cart error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

export { addToCart, getCart, updateCartItem, removeCartItem, clearCart };
