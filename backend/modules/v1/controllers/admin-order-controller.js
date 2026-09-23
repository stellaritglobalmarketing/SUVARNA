import db from "../../../config/db.js";
import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";
import { isValidOrderNumber, isValidTransition, parseOrderListingQuery, validateStatusUpdateBody } from "../validators/admin-order-validation.js";

function toNumber(value) {
    return value === null || value === undefined ? value : Number(value);
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

const getOrders = async (req, res) => {
    try {
        const { page, limit, offset, search, order_status, payment_status, fulfillment_status, date_from, date_to } = parseOrderListingQuery(req.query);

        const conditions = ["o.is_delete = 0"];
        const params = [];
        if (search) {
            conditions.push("(o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ? OR o.customer_email LIKE ?)");
            const like = `%${search}%`;
            params.push(like, like, like, like);
        }
        if (order_status) {
            conditions.push("o.order_status = ?");
            params.push(order_status);
        }
        if (payment_status) {
            conditions.push("o.payment_status = ?");
            params.push(payment_status);
        }
        if (fulfillment_status) {
            conditions.push("o.fulfillment_status = ?");
            params.push(fulfillment_status);
        }
        if (date_from) {
            conditions.push("o.created_at >= ?");
            params.push(`${date_from} 00:00:00`);
        }
        if (date_to) {
            conditions.push("o.created_at <= ?");
            params.push(`${date_to} 23:59:59`);
        }
        const whereClause = conditions.join(" AND ");

        const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM orders o WHERE ${whereClause}`, params);

        const [rows] = await db.query(
            `SELECT o.id, o.order_number, o.customer_name, o.customer_phone, o.customer_email, o.total_amount,
                    o.order_status, o.payment_status, o.fulfillment_status, o.created_at
             FROM orders o
             WHERE ${whereClause}
             ORDER BY o.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        const orders = rows.map((o) => ({
            id: o.id,
            order_number: o.order_number,
            customer: { name: o.customer_name, phone: o.customer_phone, email: o.customer_email },
            total_amount: toNumber(o.total_amount),
            order_status: o.order_status,
            payment_status: o.payment_status,
            fulfillment_status: o.fulfillment_status,
            created_at: o.created_at,
        }));

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Orders fetched successfully", orders, {
            current_page: page,
            per_page: limit,
            total,
            total_pages: total > 0 ? Math.ceil(total / limit) : 0,
        });
    } catch (error) {
        console.error("Admin get orders error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const getOrderByNumber = async (req, res) => {
    try {
        const { orderNumber } = req.params;
        if (!isValidOrderNumber(orderNumber)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Order not found", null);
        }

        const [orderRows] = await db.query(
            `SELECT id, order_number, user_id, customer_name, customer_phone, customer_email,
                    shipping_name, shipping_phone, shipping_address_line1, shipping_address_line2,
                    shipping_landmark, shipping_city, shipping_state, shipping_country, shipping_pincode,
                    subtotal, discount_amount, shipping_amount, tax_amount, total_amount,
                    coupon_code, order_status, payment_status, fulfillment_status, notes, created_at, updated_at
             FROM orders
             WHERE order_number = ? AND is_delete = 0
             LIMIT 1`,
            [orderNumber.trim()]
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

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Order fetched successfully", {
            order_number: order.order_number,
            customer: { id: order.user_id, name: order.customer_name, phone: order.customer_phone, email: order.customer_email },
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
            subtotal: toNumber(order.subtotal),
            discount_amount: toNumber(order.discount_amount),
            shipping_amount: toNumber(order.shipping_amount),
            tax_amount: toNumber(order.tax_amount),
            total_amount: toNumber(order.total_amount),
            coupon_code: order.coupon_code,
            order_status: order.order_status,
            payment_status: order.payment_status,
            fulfillment_status: order.fulfillment_status,
            notes: order.notes,
            created_at: order.created_at,
            updated_at: order.updated_at,
            items: itemRows.map((i) => ({
                product_id: i.product_id,
                product_variant_id: i.product_variant_id,
                product_name: i.product_name,
                variant_name: i.variant_name,
                sku: i.sku,
                quantity: i.quantity,
                unit_price: toNumber(i.unit_price),
                total_price: toNumber(i.total_price),
                image_url: imageMap.get(i.product_id) || null,
            })),
        });
    } catch (error) {
        console.error("Admin get order error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const updateOrderStatus = async (req, res) => {
    const { orderNumber } = req.params;
    if (!isValidOrderNumber(orderNumber)) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Order not found", null);
    }
    const error = validateStatusUpdateBody(req.body);
    if (error) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
    }

    const { order_status, payment_status, fulfillment_status } = req.body;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [orderRows] = await connection.query(
            "SELECT id, order_status FROM orders WHERE order_number = ? AND is_delete = 0 LIMIT 1 FOR UPDATE",
            [orderNumber.trim()]
        );
        if (orderRows.length === 0) {
            await connection.rollback();
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Order not found", null);
        }
        const order = orderRows[0];

        // order_status, payment_status and fulfillment_status are independent
        // concepts — only the fields present in the body are touched, and none
        // of them are inferred from another.
        if (order_status !== undefined && order_status !== order.order_status) {
            if (!isValidTransition(order.order_status, order_status)) {
                await connection.rollback();
                return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, `Order cannot move from "${order.order_status}" to "${order_status}"`, null);
            }

            if (order_status === "cancelled") {
                const [itemRows] = await connection.query(
                    "SELECT product_variant_id, quantity FROM order_items WHERE order_id = ?",
                    [order.id]
                );
                for (const item of itemRows) {
                    await connection.query(
                        "UPDATE inventory SET reserved_quantity = GREATEST(reserved_quantity - ?, 0) WHERE variant_id = ?",
                        [item.quantity, item.product_variant_id]
                    );
                }
            }

            await connection.query("UPDATE orders SET order_status = ? WHERE id = ?", [order_status, order.id]);
        }

        if (payment_status !== undefined) {
            await connection.query("UPDATE orders SET payment_status = ? WHERE id = ?", [payment_status, order.id]);
        }

        if (fulfillment_status !== undefined) {
            await connection.query("UPDATE orders SET fulfillment_status = ? WHERE id = ?", [fulfillment_status, order.id]);
        }

        await connection.commit();

        const [updatedRows] = await db.query(
            "SELECT order_status, payment_status, fulfillment_status FROM orders WHERE id = ? LIMIT 1",
            [order.id]
        );

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Order status updated", {
            order_number: orderNumber.trim(),
            ...updatedRows[0],
        });
    } catch (error) {
        await connection.rollback();
        console.error("Admin update order status error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    } finally {
        connection.release();
    }
};

export { getOrders, getOrderByNumber, updateOrderStatus };
