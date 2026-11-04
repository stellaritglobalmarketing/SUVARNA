import crypto from "node:crypto";
import db from "../../../config/db.js";

/**
 * Guest checkout. A guest order has no account until it's paid. Until then the browser that placed it proves
 * so with a random token (only its hash is stored). Once paid, the order joins the account for its phone or
 * email, or a new one is made. Phones aren't verified, so the buyer is logged in only to an account this very
 * order created, and only once. An order for an existing account's number never logs anyone into it.
 */

const newGuestToken = () => crypto.randomBytes(32).toString("hex");

const hashGuestToken = (token) => crypto.createHash("sha256").update(String(token)).digest("hex");

/** SQL condition for "this request may see this order": its customer session and/or its guest token. */
function orderOwnerClause(req) {
    const conditions = [];
    const params = [];
    if (req.user) {
        conditions.push("user_id = ?");
        params.push(req.user.id);
    }
    if (req.headers["guest-token"]) {
        conditions.push("guest_token_hash = ?");
        params.push(hashGuestToken(req.headers["guest-token"]));
    }
    return { sql: `(${conditions.join(" OR ")})`, params };
}

// No is_delete filter: the unique keys on users.phone / users.email cover soft-deleted accounts too.
async function findAccount(conn, phone, email) {
    const [byPhone] = await conn.query("SELECT id, is_active, is_delete FROM users WHERE phone = ? LIMIT 1", [phone]);
    if (byPhone[0] || !email) return byPhone[0] ?? null;
    const [byEmail] = await conn.query("SELECT id, is_active, is_delete FROM users WHERE email = ? LIMIT 1", [email]);
    return byEmail[0] ?? null;
}

async function createAccountFromOrder(conn, order) {
    // Stays passwordless until the customer sets one (POST /user/set-password), so it can't be logged into yet.
    const [result] = await conn.query("INSERT INTO users (name, email, phone) VALUES (?, ?, ?)", [
        order.customer_name,
        order.customer_email,
        order.customer_phone,
    ]);
    await conn.query("INSERT INTO addresses SET ?", [{
        user_id: result.insertId,
        full_name: order.shipping_name,
        phone: order.shipping_phone,
        address_line1: order.shipping_address_line1,
        address_line2: order.shipping_address_line2,
        landmark: order.shipping_landmark,
        city: order.shipping_city,
        state: order.shipping_state,
        country: order.shipping_country,
        pincode: order.shipping_pincode,
        is_default: 1,
    }]);
    return result.insertId;
}

/**
 * Gives a paid guest order an account. Idempotent, so every path that sees a payment (browser, webhook,
 * re-check) can call it. A disabled or deleted account isn't revived: that order stays a guest order.
 */
async function attachGuestOrderToAccount(orderId) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [[order]] = await conn.query("SELECT * FROM orders WHERE id = ? FOR UPDATE", [orderId]);
        if (!order || order.user_id || !order.guest_token_hash || order.payment_status !== "paid") {
            await conn.commit();
            return;
        }

        let account = await findAccount(conn, order.customer_phone, order.customer_email);
        let created = false;
        if (!account) {
            try {
                account = { id: await createAccountFromOrder(conn, order), is_active: 1, is_delete: 0 };
                created = true;
            } catch (error) {
                if (error.code !== "ER_DUP_ENTRY") throw error;
                // A second paid order for the same number got there first.
                account = await findAccount(conn, order.customer_phone, order.customer_email);
            }
        }

        if (account?.is_active && !account.is_delete) {
            await conn.query("UPDATE orders SET user_id = ?, guest_login_pending = ? WHERE id = ?", [account.id, created ? 1 : 0, orderId]);
        }
        await conn.commit();
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

/** The account id to log the buyer into, once ever: only when this order created that account. */
async function claimGuestLogin(orderId) {
    const [result] = await db.query("UPDATE orders SET guest_login_pending = 0 WHERE id = ? AND guest_login_pending = 1", [orderId]);
    if (result.affectedRows === 0) return null;
    const [[order]] = await db.query("SELECT user_id FROM orders WHERE id = ?", [orderId]);
    return order.user_id;
}

export { newGuestToken, hashGuestToken, orderOwnerClause, attachGuestOrderToAccount, claimGuestLogin };
