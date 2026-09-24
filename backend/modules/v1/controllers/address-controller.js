import db from "../../../config/db.js";
import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";
import { parseAddress, isPositiveInt } from "../validators/address-validation.js";

const ADDRESS_COLUMNS = `id, full_name, phone, address_line1, address_line2, landmark, city, state, country, pincode,
    address_type, is_default`;

function formatAddress(row) {
    return { ...row, is_default: !!row.is_default };
}

async function getOwnAddress(conn, id, user_id) {
    const [rows] = await conn.query(
        `SELECT ${ADDRESS_COLUMNS} FROM addresses WHERE id = ? AND user_id = ? AND is_active = 1 AND is_delete = 0 LIMIT 1`,
        [id, user_id]
    );
    return rows[0] ? formatAddress(rows[0]) : null;
}

// Default first, then most recently added.
const getAddresses = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT ${ADDRESS_COLUMNS}
             FROM addresses
             WHERE user_id = ? AND is_active = 1 AND is_delete = 0
             ORDER BY is_default DESC, id DESC`,
            [req.user.id]
        );
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Addresses fetched successfully", rows.map(formatAddress));
    } catch (error) {
        console.error("Get addresses error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

// A customer's first address becomes their default automatically; marking any address as
// default clears the flag on their others, so there's never more than one.
const createAddress = async (req, res) => {
    const { error, address } = parseAddress(req.body);
    if (error) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
    }

    const user_id = req.user.id;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [[{ count }]] = await conn.query(
            "SELECT COUNT(*) AS count FROM addresses WHERE user_id = ? AND is_active = 1 AND is_delete = 0",
            [user_id]
        );
        const isDefault = address.is_default || count === 0 ? 1 : 0;
        if (isDefault) {
            await conn.query("UPDATE addresses SET is_default = 0 WHERE user_id = ?", [user_id]);
        }

        const [result] = await conn.query("INSERT INTO addresses SET ?", [{ ...address, user_id, is_default: isDefault }]);
        const created = await getOwnAddress(conn, result.insertId, user_id);
        await conn.commit();

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Address added", created);
    } catch (err) {
        await conn.rollback();
        console.error("Create address error: ", err);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    } finally {
        conn.release();
    }
};

// Full update. Orders keep their own copy of the shipping address, so editing never changes past orders.
const updateAddress = async (req, res) => {
    if (!isPositiveInt(req.params.id)) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Address not found", null);
    }
    const { error, address } = parseAddress(req.body);
    if (error) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
    }

    const user_id = req.user.id;
    const id = Number(req.params.id);
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const existing = await getOwnAddress(conn, id, user_id);
        if (!existing) {
            await conn.rollback();
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Address not found", null);
        }

        // Unticking "default" on the current default would leave the customer with none — keep it.
        const isDefault = address.is_default || existing.is_default ? 1 : 0;
        if (isDefault) {
            await conn.query("UPDATE addresses SET is_default = 0 WHERE user_id = ? AND id <> ?", [user_id, id]);
        }
        await conn.query("UPDATE addresses SET ? WHERE id = ? AND user_id = ?", [{ ...address, is_default: isDefault }, id, user_id]);

        const updated = await getOwnAddress(conn, id, user_id);
        await conn.commit();
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Address updated", updated);
    } catch (err) {
        await conn.rollback();
        console.error("Update address error: ", err);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    } finally {
        conn.release();
    }
};

// Soft delete. If the default is removed, the most recent remaining address becomes the default.
const deleteAddress = async (req, res) => {
    if (!isPositiveInt(req.params.id)) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Address not found", null);
    }

    const user_id = req.user.id;
    const id = Number(req.params.id);
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const existing = await getOwnAddress(conn, id, user_id);
        if (!existing) {
            await conn.rollback();
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Address not found", null);
        }

        await conn.query("UPDATE addresses SET is_delete = 1, is_default = 0 WHERE id = ? AND user_id = ?", [id, user_id]);
        if (existing.is_default) {
            await conn.query(
                `UPDATE addresses SET is_default = 1
                 WHERE user_id = ? AND is_active = 1 AND is_delete = 0
                 ORDER BY id DESC LIMIT 1`,
                [user_id]
            );
        }

        await conn.commit();
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Address removed", null);
    } catch (err) {
        await conn.rollback();
        console.error("Delete address error: ", err);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    } finally {
        conn.release();
    }
};

export { getAddresses, createAddress, updateAddress, deleteAddress };
