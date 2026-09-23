import db from "../../../config/db.js";
import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";
import { validateCreateOrder, isValidOrderNumber, parseMyOrdersQuery } from "../validators/order-validation.js";

// order_number has to satisfy a UNIQUE constraint and be known only after the
// row's auto-increment id exists, so we insert with a throwaway placeholder
// first, then rewrite it from the guaranteed-unique id inside the same
// transaction — no retry/collision loop needed.
function tempOrderNumber() {
    return `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatOrderNumber(id) {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `ORD-${datePart}-${String(id).padStart(4, "0")}`;
}

async function batchImagesByProduct(productIds) {
    const uniqueIds = [...new Set(productIds.filter(Boolean))];
    if (uniqueIds.length === 0) {
        return new Map();
    }
    const placeholders = uniqueIds.map(() => "?").join(",");
    const [imageRows] = await db.query(
        `SELECT product_id, image_url FROM (
            SELECT product_id, image_url,
                   ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY is_primary DESC, sort_order ASC) AS rn
            FROM product_images
            WHERE product_id IN (${placeholders}) AND is_active = 1 AND is_delete = 0
        ) ranked
        WHERE rn = 1`,
        uniqueIds
    );
    return new Map(imageRows.map((r) => [r.product_id, r.image_url]));
}

const createOrder = async (req, res) => {
    const error = validateCreateOrder(req.body);
    if (error) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
    }

    const user_id = req.user.id;
    const address_id = Number(req.body.address_id);
    const notes = req.body.notes ? String(req.body.notes).trim().slice(0, 255) : null;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [userRows] = await connection.query(
            "SELECT id, name, email, phone FROM users WHERE id = ? AND is_active = 1 AND is_delete = 0 LIMIT 1",
            [user_id]
        );
        if (userRows.length === 0) {
            await connection.rollback();
            return middleware.sendResponse(res, Codes.UNAUTHORIZED, Codes.INVALID_TOKEN, "Account not found or inactive", null);
        }
        const user = userRows[0];

        const [addressRows] = await connection.query(
            `SELECT id, full_name, phone, address_line1, address_line2, landmark, city, state, country, pincode
             FROM addresses
             WHERE id = ? AND user_id = ? AND is_active = 1 AND is_delete = 0
             LIMIT 1`,
            [address_id, user_id]
        );
        if (addressRows.length === 0) {
            await connection.rollback();
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Address not found", null);
        }
        const address = addressRows[0];

        // FOR UPDATE locks the matched product_variants/inventory rows so a
        // second, concurrent checkout on the same variant can't also read
        // stock as available before either transaction commits.
        const [cartRows] = await connection.query(
            `SELECT cart.id AS cart_id, cart.product_variant_id, cart.quantity,
                    p.id AS product_id, p.name AS product_name, p.is_active AS product_is_active, p.is_delete AS product_is_delete,
                    pv.variant_name, pv.sku, pv.selling_price, pv.is_active AS variant_is_active, pv.is_delete AS variant_is_delete,
                    COALESCE(inv.stock_quantity, 0) AS stock_quantity,
                    COALESCE(inv.reserved_quantity, 0) AS reserved_quantity
             FROM cart
             JOIN product_variants pv ON pv.id = cart.product_variant_id
             JOIN products p ON p.id = pv.product_id
             LEFT JOIN inventory inv ON inv.variant_id = pv.id
             WHERE cart.user_id = ?
             FOR UPDATE`,
            [user_id]
        );

        if (cartRows.length === 0) {
            await connection.rollback();
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Your cart is empty", null);
        }

        for (const item of cartRows) {
            if (!item.product_is_active || item.product_is_delete || !item.variant_is_active || item.variant_is_delete) {
                await connection.rollback();
                return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, `"${item.product_name}" is no longer available. Please update your cart.`, null);
            }
            const available = Math.max(item.stock_quantity - item.reserved_quantity, 0);
            if (item.quantity > available) {
                await connection.rollback();
                return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, `Only ${available} unit(s) of "${item.product_name} - ${item.variant_name}" available in stock`, null);
            }
        }

        const subtotal = cartRows.reduce((sum, item) => sum + Number(item.selling_price) * item.quantity, 0);
        const discount_amount = 0;
        const shipping_amount = 0;
        const tax_amount = 0;
        const total_amount = subtotal - discount_amount + shipping_amount + tax_amount;

        const [orderResult] = await connection.query(
            `INSERT INTO orders (
                order_number, user_id, customer_name, customer_phone, customer_email,
                shipping_name, shipping_phone, shipping_address_line1, shipping_address_line2,
                shipping_landmark, shipping_city, shipping_state, shipping_country, shipping_pincode,
                subtotal, discount_amount, shipping_amount, tax_amount, total_amount,
                order_status, payment_status, fulfillment_status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', 'unfulfilled', ?)`,
            [
                tempOrderNumber(), user_id, user.name, user.phone, user.email,
                address.full_name, address.phone, address.address_line1, address.address_line2,
                address.landmark, address.city, address.state, address.country, address.pincode,
                subtotal, discount_amount, shipping_amount, tax_amount, total_amount,
                notes,
            ]
        );

        const orderId = orderResult.insertId;
        const order_number = formatOrderNumber(orderId);
        await connection.query("UPDATE orders SET order_number = ? WHERE id = ?", [order_number, orderId]);

        const orderItemsValues = cartRows.map((item) => [
            orderId,
            item.product_id,
            item.product_variant_id,
            item.product_name,
            item.variant_name,
            item.sku,
            item.quantity,
            item.selling_price,
            Number(item.selling_price) * item.quantity,
        ]);
        await connection.query(
            `INSERT INTO order_items (order_id, product_id, product_variant_id, product_name, variant_name, sku, quantity, unit_price, total_price)
             VALUES ?`,
            [orderItemsValues]
        );

        // Hold the stock against this pending order so a second checkout can't
        // also claim it before payment/fulfillment (future phase) resolves it.
        for (const item of cartRows) {
            await connection.query(
                "UPDATE inventory SET reserved_quantity = reserved_quantity + ? WHERE variant_id = ?",
                [item.quantity, item.product_variant_id]
            );
        }

        await connection.query("DELETE FROM cart WHERE user_id = ?", [user_id]);

        await connection.commit();

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Order placed successfully", {
            order_number,
            subtotal,
            discount_amount,
            shipping_amount,
            tax_amount,
            total_amount,
            order_status: "pending",
            payment_status: "pending",
            fulfillment_status: "unfulfilled",
        });
    } catch (error) {
        await connection.rollback();
        console.error("Create order error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    } finally {
        connection.release();
    }
};

const getMyOrders = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { page, limit, offset } = parseMyOrdersQuery(req.query);

        const [[{ total }]] = await db.query(
            "SELECT COUNT(*) AS total FROM orders WHERE user_id = ? AND is_delete = 0",
            [user_id]
        );

        const [orderRows] = await db.query(
            `SELECT id, order_number, total_amount, order_status, payment_status, fulfillment_status, created_at
             FROM orders
             WHERE user_id = ? AND is_delete = 0
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [user_id, limit, offset]
        );

        let orders = [];
        if (orderRows.length > 0) {
            const orderIds = orderRows.map((o) => o.id);
            const placeholders = orderIds.map(() => "?").join(",");
            const [itemRows] = await db.query(
                `SELECT order_id, product_id, product_name, variant_name, quantity, unit_price, total_price
                 FROM order_items
                 WHERE order_id IN (${placeholders})`,
                orderIds
            );

            const imageMap = await batchImagesByProduct(itemRows.map((i) => i.product_id));

            const itemsByOrder = new Map();
            for (const item of itemRows) {
                if (!itemsByOrder.has(item.order_id)) {
                    itemsByOrder.set(item.order_id, []);
                }
                itemsByOrder.get(item.order_id).push({
                    product_name: item.product_name,
                    variant_name: item.variant_name,
                    quantity: item.quantity,
                    unit_price: Number(item.unit_price),
                    total_price: Number(item.total_price),
                    image_url: imageMap.get(item.product_id) || null,
                });
            }

            orders = orderRows.map((o) => ({
                id: o.id,
                order_number: o.order_number,
                total_amount: Number(o.total_amount),
                order_status: o.order_status,
                payment_status: o.payment_status,
                fulfillment_status: o.fulfillment_status,
                created_at: o.created_at,
                items: itemsByOrder.get(o.id) || [],
            }));
        }

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Orders fetched successfully", orders, {
            current_page: page,
            per_page: limit,
            total,
            total_pages: total > 0 ? Math.ceil(total / limit) : 0,
        });
    } catch (error) {
        console.error("Get my orders error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const getOrderDetails = async (req, res) => {
    try {
        const { order_number } = req.params;
        if (!isValidOrderNumber(order_number)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Order not found", null);
        }

        const user_id = req.user.id;

        const [orderRows] = await db.query(
            `SELECT id, order_number, customer_name, customer_phone, customer_email,
                    shipping_name, shipping_phone, shipping_address_line1, shipping_address_line2,
                    shipping_landmark, shipping_city, shipping_state, shipping_country, shipping_pincode,
                    subtotal, discount_amount, shipping_amount, tax_amount, total_amount,
                    order_status, payment_status, fulfillment_status, notes, created_at
             FROM orders
             WHERE order_number = ? AND user_id = ? AND is_delete = 0
             LIMIT 1`,
            [order_number.trim(), user_id]
        );

        if (orderRows.length === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Order not found", null);
        }
        const order = orderRows[0];

        const [itemRows] = await db.query(
            `SELECT product_id, product_variant_id, product_name, variant_name, sku, quantity, unit_price, total_price
             FROM order_items
             WHERE order_id = ?`,
            [order.id]
        );

        const imageMap = await batchImagesByProduct(itemRows.map((i) => i.product_id));

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Order details fetched successfully", {
            order_number: order.order_number,
            order_status: order.order_status,
            payment_status: order.payment_status,
            fulfillment_status: order.fulfillment_status,
            created_at: order.created_at,
            customer: { name: order.customer_name, phone: order.customer_phone, email: order.customer_email },
            shipping_address: {
                name: order.shipping_name,
                phone: order.shipping_phone,
                address_line1: order.shipping_address_line1,
                address_line2: order.shipping_address_line2,
                landmark: order.shipping_landmark,
                city: order.shipping_city,
                state: order.shipping_state,
                country: order.shipping_country,
                pincode: order.shipping_pincode,
            },
            subtotal: Number(order.subtotal),
            discount_amount: Number(order.discount_amount),
            shipping_amount: Number(order.shipping_amount),
            tax_amount: Number(order.tax_amount),
            total_amount: Number(order.total_amount),
            notes: order.notes,
            items: itemRows.map((i) => ({
                product_name: i.product_name,
                variant_name: i.variant_name,
                sku: i.sku,
                quantity: i.quantity,
                unit_price: Number(i.unit_price),
                total_price: Number(i.total_price),
                image_url: imageMap.get(i.product_id) || null,
            })),
        });
    } catch (error) {
        console.error("Get order details error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const cancelOrder = async (req, res) => {
    const { order_number } = req.params;
    if (!isValidOrderNumber(order_number)) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Order not found", null);
    }

    const user_id = req.user.id;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [orderRows] = await connection.query(
            "SELECT id, order_status FROM orders WHERE order_number = ? AND user_id = ? AND is_delete = 0 LIMIT 1 FOR UPDATE",
            [order_number.trim(), user_id]
        );

        if (orderRows.length === 0) {
            await connection.rollback();
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Order not found", null);
        }

        const order = orderRows[0];
        if (order.order_status !== "pending") {
            await connection.rollback();
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, `Order cannot be cancelled once it is ${order.order_status}`, null);
        }

        const [itemRows] = await connection.query(
            "SELECT product_variant_id, quantity FROM order_items WHERE order_id = ?",
            [order.id]
        );

        // Release the stock this order was holding.
        for (const item of itemRows) {
            await connection.query(
                "UPDATE inventory SET reserved_quantity = GREATEST(reserved_quantity - ?, 0) WHERE variant_id = ?",
                [item.quantity, item.product_variant_id]
            );
        }

        await connection.query("UPDATE orders SET order_status = 'cancelled' WHERE id = ?", [order.id]);

        await connection.commit();

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Order cancelled successfully", {
            order_number: order_number.trim(),
            order_status: "cancelled",
        });
    } catch (error) {
        await connection.rollback();
        console.error("Cancel order error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    } finally {
        connection.release();
    }
};

export { createOrder, getMyOrders, getOrderDetails, cancelOrder };
