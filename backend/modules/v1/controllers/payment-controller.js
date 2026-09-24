import db from "../../../config/db.js";
import razorpay from "../../../config/razorpay.js";
import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";
import { isValidOrderNumber } from "../validators/order-validation.js";

const STORE_NAME = "Suvarna7";
const MIN_AMOUNT_PAISE = 100; // Razorpay's minimum charge is ₹1

function toPaise(amount) {
    return Math.round(Number(amount) * 100);
}

async function getOwnOrder(conn, order_number, user_id, { forUpdate = false } = {}) {
    const [rows] = await conn.query(
        `SELECT id, order_number, total_amount, order_status, payment_status, customer_name, customer_email, customer_phone
         FROM orders
         WHERE order_number = ? AND user_id = ? AND is_delete = 0
         LIMIT 1${forUpdate ? " FOR UPDATE" : ""}`,
        [order_number, user_id]
    );
    return rows[0] || null;
}

/**
 * Confirms with Razorpay that `paymentId` really paid for `payment` (our row): right Razorpay
 * order, right amount, and captured — capturing it first if the account only authorizes.
 * Returns the Razorpay payment, or throws an Error whose message is safe to show the customer.
 */
async function confirmCapturedPayment(payment, paymentId) {
    let rzpPayment = await razorpay.fetchPayment(paymentId);

    if (rzpPayment.order_id !== payment.gateway_order_id || rzpPayment.amount !== toPaise(payment.amount)) {
        throw new Error("Payment details don't match this order");
    }
    if (rzpPayment.status === "authorized") {
        rzpPayment = await razorpay.capturePayment(paymentId, rzpPayment.amount);
    }
    if (rzpPayment.status !== "captured") {
        throw new Error(
            rzpPayment.status === "failed"
                ? rzpPayment.error_description || "Payment failed"
                : `Payment is ${rzpPayment.status}, not completed`
        );
    }
    return rzpPayment;
}

/** Records a confirmed payment on our payment row and its order, in one transaction. Idempotent. */
async function markPaid(payment, rzpPayment, signature) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query(
            `UPDATE payments
             SET gateway_payment_id = ?, gateway_signature = ?, payment_method = ?, payment_status = 'paid',
                 failure_reason = NULL, paid_at = NOW()
             WHERE id = ? AND payment_status <> 'paid'`,
            [rzpPayment.id, signature, rzpPayment.method || null, payment.id]
        );
        // A pending order moves to confirmed. An order cancelled while the customer was paying
        // stays cancelled but is marked paid, so it shows up for a refund.
        const [[order]] = await conn.query("SELECT order_status FROM orders WHERE id = ? FOR UPDATE", [payment.order_id]);
        if (order.order_status === "cancelled") {
            console.warn(`Payment ${rzpPayment.id} captured for cancelled order id ${payment.order_id} — needs a refund`);
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
}

/**
 * Checkout step 2 (after POST /order): creates — or reuses — the Razorpay order for one of the
 * customer's pending orders and returns what Razorpay Checkout needs to open. The amount always
 * comes from our order row, never from the client.
 *
 * If an earlier attempt for this order was actually paid (e.g. the customer paid, then closed the
 * tab before we heard back), that payment is found and recorded here instead of charging again.
 */
const createRazorpayOrder = async (req, res) => {
    try {
        const order_number = String(req.body?.order_number || "").trim();
        if (!isValidOrderNumber(order_number)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "A valid order_number is required", null);
        }

        const order = await getOwnOrder(db, order_number, req.user.id);
        if (!order) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Order not found", null);
        }
        if (order.payment_status === "paid") {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Order is already paid", {
                order_number,
                already_paid: true,
            });
        }
        if (order.order_status !== "pending") {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, `This order is ${order.order_status} and can't be paid`, null);
        }

        const amount = toPaise(order.total_amount);
        if (amount < MIN_AMOUNT_PAISE) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, "Order amount is too low to pay online", null);
        }

        // Reuse the open Razorpay order from an earlier attempt (same amount) rather than creating a
        // new one per click — and check whether that attempt was in fact paid.
        const [openRows] = await db.query(
            `SELECT id, order_id, gateway_order_id, amount
             FROM payments
             WHERE order_id = ? AND gateway = 'razorpay' AND payment_status = 'created'
             ORDER BY id DESC LIMIT 1`,
            [order.id]
        );
        let payment = openRows[0] && toPaise(openRows[0].amount) === amount ? openRows[0] : null;

        if (payment) {
            const { items = [] } = await razorpay.fetchOrderPayments(payment.gateway_order_id);
            const paid = items.find((p) => p.status === "captured" || p.status === "authorized");
            if (paid) {
                const rzpPayment = await confirmCapturedPayment(payment, paid.id);
                await markPaid(payment, rzpPayment, null);
                return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Order is already paid", {
                    order_number,
                    already_paid: true,
                });
            }
        } else {
            const rzpOrder = await razorpay.createOrder({
                amount,
                receipt: order_number,
                notes: { order_number },
            });
            const [result] = await db.query(
                `INSERT INTO payments (order_id, gateway, gateway_order_id, amount, payment_status)
                 VALUES (?, 'razorpay', ?, ?, 'created')`,
                [order.id, rzpOrder.id, order.total_amount]
            );
            payment = { id: result.insertId, order_id: order.id, gateway_order_id: rzpOrder.id, amount: order.total_amount };
        }

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Payment order created", {
            order_number,
            already_paid: false,
            key_id: razorpay.keyId(),
            razorpay_order_id: payment.gateway_order_id,
            amount,
            currency: "INR",
            name: STORE_NAME,
            description: `Order ${order_number}`,
            prefill: {
                name: order.customer_name,
                email: order.customer_email || "",
                contact: order.customer_phone,
            },
        });
    } catch (error) {
        console.error("Create Razorpay order error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Couldn't start the payment. Please try again.", null);
    }
};

/**
 * Checkout step 3: Razorpay Checkout's success handler posts its three ids here. The signature
 * proves they came from Razorpay; the payment is then re-fetched from Razorpay to confirm it is
 * captured for the right order and amount before the order is marked paid. Safe to call twice.
 */
const verifyRazorpayPayment = async (req, res) => {
    try {
        const order_number = String(req.body?.order_number || "").trim();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

        if (
            !isValidOrderNumber(order_number) ||
            !razorpay.isValidOrderId(razorpay_order_id) ||
            !razorpay.isValidPaymentId(razorpay_payment_id) ||
            typeof razorpay_signature !== "string"
        ) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "Missing or invalid payment details", null);
        }

        const order = await getOwnOrder(db, order_number, req.user.id);
        if (!order) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Order not found", null);
        }

        const [paymentRows] = await db.query(
            `SELECT id, order_id, gateway_order_id, amount, payment_status
             FROM payments
             WHERE order_id = ? AND gateway = 'razorpay' AND gateway_order_id = ?
             LIMIT 1`,
            [order.id, razorpay_order_id]
        );
        const payment = paymentRows[0];
        if (!payment) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Payment not found for this order", null);
        }

        if (payment.payment_status !== "paid") {
            if (!razorpay.isValidSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
                return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, "Payment verification failed", null);
            }

            let rzpPayment;
            try {
                rzpPayment = await confirmCapturedPayment(payment, razorpay_payment_id);
            } catch (error) {
                if (error.status) {
                    throw error; // Razorpay API/network error, not a verdict on the payment
                }
                await db.query("UPDATE payments SET failure_reason = ? WHERE id = ?", [error.message.slice(0, 255), payment.id]);
                return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, error.message, null);
            }
            await markPaid(payment, rzpPayment, razorpay_signature);
        }

        const updated = await getOwnOrder(db, order_number, req.user.id);
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Payment successful", {
            order_number,
            order_status: updated.order_status,
            payment_status: updated.payment_status,
        });
    } catch (error) {
        console.error("Verify Razorpay payment error: ", error);
        return middleware.sendResponse(
            res,
            Codes.INTERNAL_ERROR,
            Codes.RESPONSE_ERROR,
            // Pressing Pay again re-checks this order's Razorpay payments before opening a new window
            // (see createRazorpayOrder), so a completed payment is picked up rather than charged twice.
            "We couldn't confirm your payment yet. If money was deducted, please don't pay again — wait a minute, then press Pay to re-check it with Razorpay.",
            null
        );
    }
};

export { createRazorpayOrder, verifyRazorpayPayment };
