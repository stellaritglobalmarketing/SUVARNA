import db from "../../../config/db.js";
import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";
import { isPositiveInt, parseListingQuery, validateSetInventoryBody, validateAdjustBody } from "../validators/admin-inventory-validation.js";

function toNumber(value) {
    return value === null || value === undefined ? value : Number(value);
}

function formatRow(r) {
    const stock_quantity = toNumber(r.stock_quantity) || 0;
    const reserved_quantity = toNumber(r.reserved_quantity) || 0;
    const low_stock_limit = toNumber(r.low_stock_limit) ?? 5;
    return {
        variant_id: r.variant_id,
        sku: r.sku,
        variant_name: r.variant_name,
        product: { id: r.product_id, name: r.product_name },
        stock_quantity,
        reserved_quantity,
        available_quantity: Math.max(stock_quantity - reserved_quantity, 0),
        low_stock_limit,
        is_low_stock: stock_quantity - reserved_quantity <= low_stock_limit,
    };
}

const getInventoryList = async (req, res) => {
    try {
        const { page, limit, offset, search, lowStockOnly } = parseListingQuery(req.query);

        const conditions = ["pv.is_delete = 0"];
        const params = [];
        if (search) {
            conditions.push("(pv.sku LIKE ? OR pv.variant_name LIKE ? OR p.name LIKE ?)");
            const like = `%${search}%`;
            params.push(like, like, like);
        }
        if (lowStockOnly) {
            conditions.push("(COALESCE(inv.stock_quantity, 0) - COALESCE(inv.reserved_quantity, 0)) <= COALESCE(inv.low_stock_limit, 5)");
        }
        const whereClause = conditions.join(" AND ");

        const baseFrom = `
            FROM product_variants pv
            JOIN products p ON p.id = pv.product_id
            LEFT JOIN inventory inv ON inv.variant_id = pv.id AND inv.is_delete = 0
            WHERE ${whereClause}
        `;

        const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total ${baseFrom}`, params);

        const [rows] = await db.query(
            `SELECT pv.id AS variant_id, pv.sku, pv.variant_name, p.id AS product_id, p.name AS product_name,
                    COALESCE(inv.stock_quantity, 0) AS stock_quantity,
                    COALESCE(inv.reserved_quantity, 0) AS reserved_quantity,
                    COALESCE(inv.low_stock_limit, 5) AS low_stock_limit
             ${baseFrom}
             ORDER BY (COALESCE(inv.stock_quantity, 0) - COALESCE(inv.reserved_quantity, 0)) ASC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Inventory fetched successfully", rows.map(formatRow), {
            current_page: page,
            per_page: limit,
            total,
            total_pages: total > 0 ? Math.ceil(total / limit) : 0,
        });
    } catch (error) {
        console.error("Admin get inventory list error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const getInventoryByVariant = async (req, res) => {
    try {
        const { variantId } = req.params;
        if (!isPositiveInt(variantId)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Variant not found", null);
        }

        const [rows] = await db.query(
            `SELECT pv.id AS variant_id, pv.sku, pv.variant_name, p.id AS product_id, p.name AS product_name,
                    COALESCE(inv.stock_quantity, 0) AS stock_quantity,
                    COALESCE(inv.reserved_quantity, 0) AS reserved_quantity,
                    COALESCE(inv.low_stock_limit, 5) AS low_stock_limit
             FROM product_variants pv
             JOIN products p ON p.id = pv.product_id
             LEFT JOIN inventory inv ON inv.variant_id = pv.id AND inv.is_delete = 0
             WHERE pv.id = ? AND pv.is_delete = 0
             LIMIT 1`,
            [variantId]
        );
        if (rows.length === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Variant not found", null);
        }

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Inventory fetched successfully", formatRow(rows[0]));
    } catch (error) {
        console.error("Admin get inventory error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const updateInventory = async (req, res) => {
    const { variantId } = req.params;
    if (!isPositiveInt(variantId)) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Variant not found", null);
    }
    const error = validateSetInventoryBody(req.body);
    if (error) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [variantRows] = await connection.query("SELECT id FROM product_variants WHERE id = ? AND is_delete = 0 LIMIT 1 FOR UPDATE", [variantId]);
        if (variantRows.length === 0) {
            await connection.rollback();
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Variant not found", null);
        }

        const [invRows] = await connection.query("SELECT reserved_quantity FROM inventory WHERE variant_id = ? LIMIT 1 FOR UPDATE", [variantId]);
        const reserved_quantity = invRows[0]?.reserved_quantity || 0;
        const stock_quantity = Number(req.body.stock_quantity);

        if (stock_quantity < reserved_quantity) {
            await connection.rollback();
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, `stock_quantity cannot be less than the currently reserved quantity (${reserved_quantity})`, null);
        }

        const low_stock_limit = req.body.low_stock_limit !== undefined && req.body.low_stock_limit !== "" ? Number(req.body.low_stock_limit) : 5;

        await connection.query(
            `INSERT INTO inventory (variant_id, stock_quantity, reserved_quantity, low_stock_limit)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE stock_quantity = VALUES(stock_quantity), low_stock_limit = VALUES(low_stock_limit)`,
            [variantId, stock_quantity, reserved_quantity, low_stock_limit]
        );

        await connection.commit();

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Inventory updated successfully", {
            variant_id: Number(variantId),
            stock_quantity,
            reserved_quantity,
            available_quantity: Math.max(stock_quantity - reserved_quantity, 0),
            low_stock_limit,
        });
    } catch (error) {
        await connection.rollback();
        console.error("Admin update inventory error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    } finally {
        connection.release();
    }
};

const adjustInventory = async (req, res) => {
    const { variantId } = req.params;
    if (!isPositiveInt(variantId)) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Variant not found", null);
    }
    const error = validateAdjustBody(req.body);
    if (error) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
    }

    const quantity = Number(req.body.quantity);
    const { type } = req.body;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [variantRows] = await connection.query("SELECT id FROM product_variants WHERE id = ? AND is_delete = 0 LIMIT 1 FOR UPDATE", [variantId]);
        if (variantRows.length === 0) {
            await connection.rollback();
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Variant not found", null);
        }

        // Ensure an inventory row exists before locking it (handles variants created before this phase).
        await connection.query(
            "INSERT INTO inventory (variant_id, stock_quantity, reserved_quantity) VALUES (?, 0, 0) ON DUPLICATE KEY UPDATE variant_id = variant_id",
            [variantId]
        );

        const [invRows] = await connection.query(
            "SELECT stock_quantity, reserved_quantity, low_stock_limit FROM inventory WHERE variant_id = ? LIMIT 1 FOR UPDATE",
            [variantId]
        );
        const current = invRows[0];

        let newStock;
        if (type === "add") {
            newStock = current.stock_quantity + quantity;
        } else {
            newStock = current.stock_quantity - quantity;
            if (newStock < current.reserved_quantity) {
                await connection.rollback();
                return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, `Cannot remove ${quantity} unit(s) — only ${current.stock_quantity - current.reserved_quantity} unit(s) are available (unreserved) in stock`, null);
            }
        }

        await connection.query("UPDATE inventory SET stock_quantity = ? WHERE variant_id = ?", [newStock, variantId]);

        await connection.commit();

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Inventory adjusted successfully", {
            variant_id: Number(variantId),
            stock_quantity: newStock,
            reserved_quantity: current.reserved_quantity,
            available_quantity: Math.max(newStock - current.reserved_quantity, 0),
            low_stock_limit: current.low_stock_limit,
        });
    } catch (error) {
        await connection.rollback();
        console.error("Admin adjust inventory error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    } finally {
        connection.release();
    }
};

export { getInventoryList, getInventoryByVariant, updateInventory, adjustInventory };
