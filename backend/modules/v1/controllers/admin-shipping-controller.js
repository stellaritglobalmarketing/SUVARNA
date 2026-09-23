import db from "../../../config/db.js";
import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";
import { isValidOrderNumber } from "../validators/admin-order-validation.js";
import { isPositiveInt, parseShipmentListingQuery, validateCreateShipmentBody, validateShipmentStatusBody } from "../validators/admin-shipping-validation.js";

function toNumber(value) {
    return value === null || value === undefined ? value : Number(value);
}

const STATUSES_IMPLYING_SHIPPED = ["picked_up", "in_transit", "out_for_delivery", "delivered"];

const createShipmentForOrder = async (req, res) => {
    try {
        const { orderNumber } = req.params;
        if (!isValidOrderNumber(orderNumber)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Order not found", null);
        }
        const error = validateCreateShipmentBody(req.body);
        if (error) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
        }

        const [orderRows] = await db.query("SELECT id FROM orders WHERE order_number = ? AND is_delete = 0 LIMIT 1", [orderNumber.trim()]);
        if (orderRows.length === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Order not found", null);
        }
        const order_id = orderRows[0].id;

        const awb_number = req.body.awb_number ? String(req.body.awb_number).trim() : null;
        if (awb_number) {
            const [dupRows] = await db.query("SELECT id FROM shipments WHERE awb_number = ? LIMIT 1", [awb_number]);
            if (dupRows.length > 0) {
                return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, "A shipment with this AWB number already exists", null);
            }
        }

        const [result] = await db.query(
            `INSERT INTO shipments (order_id, provider, awb_number, tracking_url, courier_name, package_weight, length_cm, width_cm, height_cm, shipping_charge, shipment_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'created')`,
            [
                order_id,
                String(req.body.provider).trim(),
                awb_number,
                req.body.tracking_url ? String(req.body.tracking_url).trim() : null,
                req.body.courier_name ? String(req.body.courier_name).trim() : null,
                req.body.package_weight !== undefined && req.body.package_weight !== "" ? Number(req.body.package_weight) : null,
                req.body.length_cm !== undefined && req.body.length_cm !== "" ? Number(req.body.length_cm) : null,
                req.body.width_cm !== undefined && req.body.width_cm !== "" ? Number(req.body.width_cm) : null,
                req.body.height_cm !== undefined && req.body.height_cm !== "" ? Number(req.body.height_cm) : null,
                req.body.shipping_charge !== undefined && req.body.shipping_charge !== "" ? Number(req.body.shipping_charge) : 0,
            ]
        );

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Shipment created successfully", { id: result.insertId, order_number: orderNumber.trim(), shipment_status: "created" });
    } catch (error) {
        console.error("Admin create shipment error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const getShipments = async (req, res) => {
    try {
        const { page, limit, offset, search, provider, shipment_status, order_id } = parseShipmentListingQuery(req.query);

        const conditions = ["s.is_delete = 0"];
        const params = [];
        if (search) {
            conditions.push("(s.awb_number LIKE ? OR o.order_number LIKE ?)");
            const like = `%${search}%`;
            params.push(like, like);
        }
        if (provider) {
            conditions.push("s.provider = ?");
            params.push(provider);
        }
        if (shipment_status) {
            conditions.push("s.shipment_status = ?");
            params.push(shipment_status);
        }
        if (order_id) {
            conditions.push("s.order_id = ?");
            params.push(order_id);
        }
        const whereClause = conditions.join(" AND ");

        const baseFrom = `FROM shipments s JOIN orders o ON o.id = s.order_id WHERE ${whereClause}`;

        const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total ${baseFrom}`, params);

        const [rows] = await db.query(
            `SELECT s.id, s.order_id, o.order_number, s.provider, s.awb_number, s.courier_name,
                    s.shipping_charge, s.shipment_status, s.shipped_at, s.delivered_at, s.created_at
             ${baseFrom}
             ORDER BY s.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Shipments fetched successfully",
            rows.map((s) => ({ ...s, shipping_charge: toNumber(s.shipping_charge) })),
            {
                current_page: page,
                per_page: limit,
                total,
                total_pages: total > 0 ? Math.ceil(total / limit) : 0,
            }
        );
    } catch (error) {
        console.error("Admin get shipments error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const getShipmentById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isPositiveInt(id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Shipment not found", null);
        }

        const [rows] = await db.query(
            `SELECT s.id, s.order_id, o.order_number, s.provider, s.provider_order_id, s.shipment_id AS provider_shipment_id,
                    s.awb_number, s.tracking_url, s.courier_name, s.package_weight, s.length_cm, s.width_cm, s.height_cm,
                    s.shipping_charge, s.shipment_status, s.shipped_at, s.delivered_at, s.created_at, s.updated_at
             FROM shipments s
             JOIN orders o ON o.id = s.order_id
             WHERE s.id = ? AND s.is_delete = 0
             LIMIT 1`,
            [id]
        );
        if (rows.length === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Shipment not found", null);
        }
        const shipment = rows[0];

        const [tracking] = await db.query(
            `SELECT status, status_code, location, message, event_time
             FROM shipment_tracking
             WHERE shipment_id = ?
             ORDER BY event_time DESC`,
            [id]
        );

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Shipment fetched successfully", {
            ...shipment,
            package_weight: toNumber(shipment.package_weight),
            length_cm: toNumber(shipment.length_cm),
            width_cm: toNumber(shipment.width_cm),
            height_cm: toNumber(shipment.height_cm),
            shipping_charge: toNumber(shipment.shipping_charge),
            tracking_history: tracking,
        });
    } catch (error) {
        console.error("Admin get shipment error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const updateShipmentStatus = async (req, res) => {
    const { id } = req.params;
    if (!isPositiveInt(id)) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Shipment not found", null);
    }
    const error = validateShipmentStatusBody(req.body);
    if (error) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
    }

    const { shipment_status } = req.body;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [rows] = await connection.query("SELECT id, shipped_at FROM shipments WHERE id = ? AND is_delete = 0 LIMIT 1 FOR UPDATE", [id]);
        if (rows.length === 0) {
            await connection.rollback();
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Shipment not found", null);
        }

        const setShippedAt = STATUSES_IMPLYING_SHIPPED.includes(shipment_status) && !rows[0].shipped_at;
        const setDeliveredAt = shipment_status === "delivered";

        await connection.query(
            `UPDATE shipments
             SET shipment_status = ?
                 ${setShippedAt ? ", shipped_at = NOW()" : ""}
                 ${setDeliveredAt ? ", delivered_at = NOW()" : ""}
             WHERE id = ?`,
            [shipment_status, id]
        );

        await connection.query(
            `INSERT INTO shipment_tracking (shipment_id, status, event_time, message)
             VALUES (?, ?, NOW(), 'Updated by admin')`,
            [id, shipment_status]
        );

        await connection.commit();

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Shipment status updated", { id: Number(id), shipment_status });
    } catch (error) {
        await connection.rollback();
        console.error("Admin update shipment status error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    } finally {
        connection.release();
    }
};

export { createShipmentForOrder, getShipments, getShipmentById, updateShipmentStatus };
