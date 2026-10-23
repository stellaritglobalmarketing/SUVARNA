import db from "../../../config/db.js";
import cashfree from "../../../config/cashfree.js";
import { publicBaseUrl } from "../../../config/public-url.js";
import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";
import { isValidOrderNumber } from "../validators/order-validation.js";
import { sendInvoiceToStore } from "../services/whatsapp-invoice.js";
import { sendOrderEmailToStore } from "../services/order-email.js";

const MIN_AMOUNT_PAISE = 100; // Cashfree's minimum charge is ₹1
const NOT_CONFIRMED_MESSAGE =
    "We couldn't confirm your payment yet. If money was deducted, please don't pay again — wait a minute, then press Pay to re-check it.";

function toPaise(amount) {
    return Math.round(Number(amount) * 100);
}

async function getOwnOrder(conn, order_number, user_id) {
    const [rows] = await conn.query(
        `SELECT id, order_number, total_amount, order_status, payment_status, customer_name, customer_email, customer_phone
         FROM orders
         WHERE order_number = ? AND user_id = ? AND is_delete = 0
         LIMIT 1`,
        [order_number, user_id]
    );
    return rows[0] || null;
}

/**
 * Asks Cashfree whether the Cashfree order behind `payment` (our row) is paid, for the right amount.
 * Returns { id, method } of the successful payment, or null while it isn't paid. Throws on a mismatch.
 */
async function confirmCashfreePayment(payment) {
    const cfOrder = await cashfree.fetchOrder(payment.gateway_order_id);
    if (cfOrder.order_status !== "PAID") {
        return null;
    }
    if (toPaise(cfOrder.order_amount) !== toPaise(payment.amount)) {
        throw new Error("Payment details don't match this order");
    }
    const attempts = await cashfree.fetchOrderPayments(payment.gateway_order_id);
    const paid = (Array.isArray(attempts) ? attempts : []).find((p) => p.payment_status === "SUCCESS");
    return paid ? { id: String(paid.cf_payment_id), method: paid.payment_group || null } : null;
}

/**
 * Records a confirmed payment on our payment row and its order, in one transaction. Idempotent.
 * `gatewayPayment` is { id, method } as Cashfree reports it. The first time an order becomes
 * paid, its invoice is sent to the store's WhatsApp and email in the background.
 */
async function markPaid(payment, gatewayPayment) {
    let newlyPaid = false;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query(
            `UPDATE payments
             SET gateway_payment_id = ?, payment_method = ?, payment_status = 'paid', failure_reason = NULL, paid_at = NOW()
             WHERE id = ? AND payment_status <> 'paid'`,
            [gatewayPayment.id, gatewayPayment.method || null, payment.id]
        );
        // A pending order moves to confirmed. An order cancelled while the customer was paying
        // stays cancelled but is marked paid, so it shows up for a refund.
        const [[order]] = await conn.query("SELECT order_status, payment_status FROM orders WHERE id = ? FOR UPDATE", [payment.order_id]);
        newlyPaid = order.payment_status !== "paid";
        if (order.order_status === "cancelled") {
            console.warn(`Payment ${gatewayPayment.id} captured for cancelled order id ${payment.order_id} — needs a refund`);
        }
        await conn.query(
            `UPDATE orders
             SET payment_status = 'paid', order_status = IF(order_status = 'pending', 'confirmed', order_status)
             WHERE id = ?`,
            [payment.order_id]
        );
        await conn.commit();
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
    if (newlyPaid) {
        // Not awaited: the customer's response shouldn't wait on WhatsApp/email. Neither throws.
        sendInvoiceToStore(payment.order_id);
        sendOrderEmailToStore(payment.order_id);
    }
}

/**
 * Asks Cashfree whether any open attempt for this order was actually paid, and records it if so.
 * This catches payments whose browser callback never reached us — typically UPI on a phone, where
 * the customer pays in the GPay/PhonePe app and the checkout tab is reloaded or never returns.
 * Returns true when the order is (now) paid. Cashfree API errors propagate.
 */
async function recoverPaidAttempt(orderId) {
    const [openRows] = await db.query(
        `SELECT id, order_id, gateway_order_id, amount
         FROM payments
         WHERE order_id = ? AND gateway = 'cashfree' AND payment_status = 'created'
         ORDER BY id DESC`,
        [orderId]
    );
    for (const payment of openRows) {
        const cfPayment = await confirmCashfreePayment(payment);
        if (cfPayment) {
            await markPaid(payment, cfPayment);
            return true;
        }
    }
    return false;
}

/** The storefront origin this request came from, if it's one of CORS_ORIGIN — else the first of them. */
function storefrontOrigin(req) {
    const allowed = (process.env.CORS_ORIGIN || "http://localhost:3000")
        .split(",")
        .map((value) => {
            try {
                return new URL(value.trim()).origin;
            } catch {
                return null;
            }
        })
        .filter(Boolean);
    const origin = req.get("origin");
    return allowed.includes(origin) ? origin : allowed[0];
}

/**
 * Reuses this order's open Cashfree order (same amount, still ACTIVE) or creates one; returns the
 * payment session the Cashfree JS SDK opens. Each Cashfree order id must be unique, so a retry after
 * an attempt expires gets a new one: "<order_number>-<base36 time>".
 */
async function startCashfreeAttempt(order, userId, req) {
    const [openRows] = await db.query(
        `SELECT id, gateway_order_id, amount
         FROM payments
         WHERE order_id = ? AND gateway = 'cashfree' AND payment_status = 'created'
         ORDER BY id DESC LIMIT 1`,
        [order.id]
    );
    const open = openRows[0];
    const session = (cfOrder) => ({
        cashfree_mode: cashfree.mode(),
        cashfree_order_id: cfOrder.order_id,
        payment_session_id: cfOrder.payment_session_id,
    });

    if (open && toPaise(open.amount) === toPaise(order.total_amount)) {
        const cfOrder = await cashfree.fetchOrder(open.gateway_order_id);
        if (cfOrder.order_status === "ACTIVE" && cfOrder.payment_session_id) {
            return session(cfOrder);
        }
        if (cfOrder.order_status !== "PAID") {
            await db.query("UPDATE payments SET payment_status = 'failed', failure_reason = ? WHERE id = ?", [
                `Cashfree order ${String(cfOrder.order_status).toLowerCase()}`,
                open.id,
            ]);
        }
    }

    const phone = String(order.customer_phone || "").replace(/\D/g, "").slice(-10);
    const name = String(order.customer_name || "").trim();
    const email = String(order.customer_email || "").trim();
    const notifyUrl = `${publicBaseUrl(req)}/api/v1/webhooks/cashfree`;
    const cfOrder = await cashfree.createOrder({
        order_id: `${order.order_number}-${Date.now().toString(36)}`,
        order_amount: Number(order.total_amount),
        order_currency: "INR",
        customer_details: {
            customer_id: `user${userId}`,
            customer_phone: phone,
            ...(name.length >= 3 ? { customer_name: name.slice(0, 100) } : {}),
            ...(email.includes("@") ? { customer_email: email.slice(0, 100) } : {}),
        },
        order_meta: {
            // Used only when the popup can't open (e.g. in-app browsers): Cashfree redirects back here.
            return_url: `${storefrontOrigin(req)}/checkout/success?order=${encodeURIComponent(order.order_number)}`,
            // Cashfree only calls an https URL, so this is left out locally.
            ...(notifyUrl.startsWith("https://") ? { notify_url: notifyUrl } : {}),
        },
        order_note: `Order ${order.order_number}`,
        order_tags: { order_number: order.order_number },
    });
    await db.query(
        `INSERT INTO payments (order_id, gateway, gateway_order_id, amount, payment_status)
         VALUES (?, 'cashfree', ?, ?, 'created')`,
        [order.id, cfOrder.order_id, order.total_amount]
    );
    return session(cfOrder);
}

/**
 * Checkout step 2 (after POST /order): starts — or reuses — a Cashfree payment for one of the
 * customer's pending orders and returns the session the Cashfree popup opens with. The amount always
 * comes from our order row, never from the client.
 *
 * If an earlier attempt for this order was actually paid (e.g. the customer paid, then closed the
 * tab before we heard back), that payment is found and recorded here instead of charging again.
 */
const createPaymentOrder = async (req, res) => {
    try {
        const order_number = String(req.body?.order_number || "").trim();
        if (!isValidOrderNumber(order_number)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "A valid order_number is required", null);
        }

        const order = await getOwnOrder(db, order_number, req.user.id);
        if (!order) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Order not found", null);
        }
        const alreadyPaid = () =>
            middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Order is already paid", { order_number, already_paid: true });
        if (order.payment_status === "paid") {
            return alreadyPaid();
        }
        if (order.order_status !== "pending") {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, `This order is ${order.order_status} and can't be paid`, null);
        }
        if (toPaise(order.total_amount) < MIN_AMOUNT_PAISE) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, "Order amount is too low to pay online", null);
        }

        // Any earlier attempt that was in fact paid is recorded instead of charging again.
        if (await recoverPaidAttempt(order.id)) {
            return alreadyPaid();
        }

        const checkout = await startCashfreeAttempt(order, req.user.id, req);
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Payment order created", {
            order_number,
            already_paid: false,
            ...checkout,
        });
    } catch (error) {
        console.error("Create Cashfree order error: ", error.cashfree ?? "", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Couldn't start the payment. Please try again.", null);
    }
};

/**
 * Checkout step 3: called when the Cashfree popup closes. Cashfree's SDK returns no signature, so
 * the order is asked from Cashfree directly. Answers with `gateway_status`: "PAID" (order marked
 * paid), "PENDING" (bank hasn't confirmed yet — keep checking) or the latest attempt's status
 * ("FAILED", "USER_DROPPED", …) with Cashfree's reason in `message`.
 */
const verifyPayment = async (req, res) => {
    try {
        const order_number = String(req.body?.order_number || "").trim();
        if (!isValidOrderNumber(order_number)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "A valid order_number is required", null);
        }
        const order = await getOwnOrder(db, order_number, req.user.id);
        if (!order) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Order not found", null);
        }
        if (order.payment_status !== "paid") {
            await recoverPaidAttempt(order.id);
        }
        const updated = await getOwnOrder(db, order_number, req.user.id);
        const result = { order_number, order_status: updated.order_status, payment_status: updated.payment_status };
        if (updated.payment_status === "paid") {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Payment successful", {
                ...result,
                gateway_status: "PAID",
                message: "Payment successful",
            });
        }

        const [[latest]] = await db.query(
            `SELECT id, gateway_order_id FROM payments
             WHERE order_id = ? AND gateway = 'cashfree' AND payment_status = 'created'
             ORDER BY id DESC LIMIT 1`,
            [order.id]
        );
        const attempts = latest ? await cashfree.fetchOrderPayments(latest.gateway_order_id) : [];
        const list = Array.isArray(attempts) ? attempts : [];
        if (list.some((p) => p.payment_status === "PENDING")) {
            const message = "Payment is being confirmed by your bank";
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, message, { ...result, gateway_status: "PENDING", message });
        }
        // Newest attempt first: the customer cares about the one they just made.
        const last = [...list].sort((a, b) => String(b.payment_time || "").localeCompare(String(a.payment_time || "")))[0];
        const message = last?.payment_message?.trim() || "Payment wasn't completed. Your order is saved — you can pay whenever you're ready.";
        if (last && latest) {
            await db.query("UPDATE payments SET failure_reason = ? WHERE id = ?", [message.slice(0, 255), latest.id]);
        }
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, message, {
            ...result,
            gateway_status: last?.payment_status || "NOT_ATTEMPTED",
            message,
        });
    } catch (error) {
        console.error("Verify Cashfree payment error: ", error.cashfree ?? "", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, NOT_CONFIRMED_MESSAGE, null);
    }
};

/**
 * Customer: "did my payment go through?" — used when the checkout or success page is opened again
 * for an unpaid order. Checks Cashfree and records a payment that was made but never confirmed.
 */
const syncPayment = async (req, res) => {
    try {
        const order_number = String(req.body?.order_number || "").trim();
        if (!isValidOrderNumber(order_number)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "A valid order_number is required", null);
        }
        const order = await getOwnOrder(db, order_number, req.user.id);
        if (!order) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Order not found", null);
        }
        if (order.payment_status !== "paid") {
            await recoverPaidAttempt(order.id);
        }
        const updated = await getOwnOrder(db, order_number, req.user.id);
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Payment status checked", {
            order_number,
            order_status: updated.order_status,
            payment_status: updated.payment_status,
        });
    } catch (error) {
        console.error("Sync payment error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Couldn't check the payment right now. Please try again in a minute.", null);
    }
};

/** Admin: same check for any order (Admin → order page → "Check payment with Cashfree"). */
const adminSyncPayment = async (req, res) => {
    try {
        const orderNumber = String(req.params.orderNumber || "").trim();
        const [[order]] = await db.query("SELECT id, payment_status FROM orders WHERE order_number = ? AND is_delete = 0 LIMIT 1", [orderNumber]);
        if (!order) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Order not found", null);
        }
        const found = order.payment_status === "paid" ? true : await recoverPaidAttempt(order.id);
        return middleware.sendResponse(
            res,
            Codes.SUCCESS,
            Codes.RESPONSE_SUCCESS,
            found ? "Payment found — the order is marked paid" : "Cashfree has no completed payment for this order",
            { paid: found }
        );
    } catch (error) {
        console.error("Admin sync payment error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Couldn't reach Cashfree. Please try again.", null);
    }
};

/**
 * Cashfree webhook (https://api.suvarna7.com/api/v1/webhooks/cashfree). Sent to each order's
 * notify_url automatically, and also to any URL added in Cashfree Dashboard → Developers → Webhooks.
 * Signed with the secret key (x-webhook-signature / x-webhook-timestamp). The order is re-fetched
 * from Cashfree before anything is marked paid.
 */
const handleCashfreeWebhook = async (req, res) => {
    if (!cashfree.isValidWebhookSignature(req.rawBody, req.headers["x-webhook-signature"], req.headers["x-webhook-timestamp"])) {
        return res.status(400).json({ ok: false });
    }
    try {
        const type = req.body?.type;
        const cfOrderId = req.body?.data?.order?.order_id;
        if (type === "PAYMENT_SUCCESS_WEBHOOK" && cfOrderId) {
            const [[payment]] = await db.query(
                `SELECT id, order_id, gateway_order_id, amount, payment_status
                 FROM payments WHERE gateway = 'cashfree' AND gateway_order_id = ? LIMIT 1`,
                [String(cfOrderId)]
            );
            if (payment && payment.payment_status !== "paid") {
                const cfPayment = await confirmCashfreePayment(payment);
                if (cfPayment) {
                    await markPaid(payment, cfPayment);
                    console.log(`Cashfree webhook: recorded payment ${cfPayment.id} for ${cfOrderId}`);
                }
            }
        }
        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error("Cashfree webhook error: ", error);
        // 500 makes Cashfree retry later, which is what we want for a transient failure.
        return res.status(500).json({ ok: false });
    }
};

export { createPaymentOrder, verifyPayment, syncPayment, adminSyncPayment, handleCashfreeWebhook };
