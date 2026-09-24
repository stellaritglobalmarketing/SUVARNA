import db from "../../../config/db.js";
import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";
import { isPositiveInt, parseCustomerListingQuery, validateStatusBody } from "../validators/admin-validation.js";

function toNumber(value) {
    return value === null || value === undefined ? value : Number(value);
}

const ORDER_STATUS_KEYS = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

const getDashboard = async (req, res) => {
    try {
        const [[{ total_users }]] = await db.query("SELECT COUNT(*) AS total_users FROM users WHERE is_delete = 0");
        const [[{ total_active_products }]] = await db.query("SELECT COUNT(*) AS total_active_products FROM products WHERE is_active = 1 AND is_delete = 0");
        const [[{ total_categories }]] = await db.query("SELECT COUNT(*) AS total_categories FROM categories WHERE is_delete = 0");
        const [[{ total_orders }]] = await db.query("SELECT COUNT(*) AS total_orders FROM orders WHERE is_delete = 0");
        const [[{ low_stock_variants }]] = await db.query(
            `SELECT COUNT(*) AS low_stock_variants
             FROM inventory
             WHERE is_active = 1 AND is_delete = 0 AND (stock_quantity - reserved_quantity) <= low_stock_limit`
        );

        const [statusRows] = await db.query(
            "SELECT order_status, COUNT(*) AS total FROM orders WHERE is_delete = 0 GROUP BY order_status"
        );

        // Revenue counts paid orders only; a paid order that was later cancelled is money to refund, not revenue.
        const [[revenue]] = await db.query(
            `SELECT COALESCE(SUM(total_amount), 0) AS total_revenue,
                    COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL 30 DAY THEN total_amount END), 0) AS revenue_last_30_days,
                    COUNT(*) AS paid_orders
             FROM orders
             WHERE is_delete = 0 AND payment_status = 'paid' AND order_status <> 'cancelled'`
        );
        const [[today]] = await db.query(
            "SELECT COUNT(*) AS orders_today FROM orders WHERE is_delete = 0 AND created_at >= CURDATE()"
        );
        const [[{ awaiting_payment }]] = await db.query(
            "SELECT COUNT(*) AS awaiting_payment FROM orders WHERE is_delete = 0 AND order_status = 'pending' AND payment_status <> 'paid'"
        );
        const [[{ pending_reviews }]] = await db.query(
            "SELECT COUNT(*) AS pending_reviews FROM reviews WHERE is_delete = 0 AND is_approved = 0"
        );
        const orderStatusCounts = ORDER_STATUS_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
        for (const row of statusRows) {
            if (Object.prototype.hasOwnProperty.call(orderStatusCounts, row.order_status)) {
                orderStatusCounts[row.order_status] = row.total;
            }
        }

        const [recentOrders] = await db.query(
            `SELECT order_number, customer_name, total_amount, order_status, payment_status, created_at
             FROM orders
             WHERE is_delete = 0
             ORDER BY created_at DESC
             LIMIT 5`
        );

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Dashboard data fetched successfully", {
            total_users,
            total_active_products,
            total_categories,
            total_orders,
            total_revenue: toNumber(revenue.total_revenue),
            revenue_last_30_days: toNumber(revenue.revenue_last_30_days),
            paid_orders: Number(revenue.paid_orders),
            orders_today: Number(today.orders_today),
            awaiting_payment: Number(awaiting_payment),
            pending_reviews: Number(pending_reviews),
            pending_orders: orderStatusCounts.pending,
            confirmed_orders: orderStatusCounts.confirmed,
            processing_orders: orderStatusCounts.processing,
            shipped_orders: orderStatusCounts.shipped,
            delivered_orders: orderStatusCounts.delivered,
            cancelled_orders: orderStatusCounts.cancelled,
            low_stock_variants,
            recent_orders: recentOrders.map((o) => ({
                order_number: o.order_number,
                customer_name: o.customer_name,
                total_amount: toNumber(o.total_amount),
                order_status: o.order_status,
                payment_status: o.payment_status,
                created_at: o.created_at,
            })),
        });
    } catch (error) {
        console.error("Admin get dashboard error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const getCustomers = async (req, res) => {
    try {
        const { page, limit, offset, search, status } = parseCustomerListingQuery(req.query);

        const conditions = ["is_delete = 0"];
        const params = [];
        if (search) {
            conditions.push("(name LIKE ? OR email LIKE ? OR phone LIKE ?)");
            const like = `%${search}%`;
            params.push(like, like, like);
        }
        if (status !== null) {
            conditions.push("is_active = ?");
            params.push(status);
        }
        const whereClause = conditions.join(" AND ");

        const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM users WHERE ${whereClause}`, params);

        const [rows] = await db.query(
            `SELECT id, name, email, phone, is_verified, is_active, created_at
             FROM users WHERE ${whereClause}
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Customers fetched successfully",
            rows.map((r) => ({ ...r, is_verified: !!r.is_verified, is_active: !!r.is_active })),
            {
                current_page: page,
                per_page: limit,
                total,
                total_pages: total > 0 ? Math.ceil(total / limit) : 0,
            }
        );
    } catch (error) {
        console.error("Admin get customers error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isPositiveInt(id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Customer not found", null);
        }

        const [rows] = await db.query(
            `SELECT id, name, email, phone, is_verified, is_active, created_at
             FROM users WHERE id = ? AND is_delete = 0 LIMIT 1`,
            [id]
        );
        if (rows.length === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Customer not found", null);
        }
        const customer = rows[0];

        const [orderRows] = await db.query(
            `SELECT order_number, total_amount, order_status, payment_status, fulfillment_status, created_at
             FROM orders
             WHERE user_id = ? AND is_delete = 0
             ORDER BY created_at DESC
             LIMIT 20`,
            [id]
        );

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Customer fetched successfully", {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            is_verified: !!customer.is_verified,
            is_active: !!customer.is_active,
            created_at: customer.created_at,
            orders: orderRows.map((o) => ({
                order_number: o.order_number,
                total_amount: toNumber(o.total_amount),
                order_status: o.order_status,
                payment_status: o.payment_status,
                fulfillment_status: o.fulfillment_status,
                created_at: o.created_at,
            })),
        });
    } catch (error) {
        console.error("Admin get customer error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const updateCustomerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isPositiveInt(id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Customer not found", null);
        }
        const error = validateStatusBody(req.body);
        if (error) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
        }

        const is_active = Number(req.body.is_active) ? 1 : 0;
        const [result] = await db.query("UPDATE users SET is_active = ? WHERE id = ? AND is_delete = 0", [is_active, id]);
        if (result.affectedRows === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Customer not found", null);
        }

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Customer status updated", { id: Number(id), is_active: !!is_active });
    } catch (error) {
        console.error("Admin update customer status error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

export { getDashboard, getCustomers, getCustomerById, updateCustomerStatus };
