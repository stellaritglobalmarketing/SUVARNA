import db from "../../../config/db.js";
import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";
import { isValidOrderNumber } from "../validators/order-validation.js";
import { findOrderId, invoiceFilename, loadInvoiceData, renderInvoicePdf } from "../services/invoice.js";

/** Streams the PDF invoice for an order. Customers get only their own paid orders; admins any order. */
async function sendInvoice(req, res, { orderNumber, userId, paidOnly }) {
    try {
        if (!isValidOrderNumber(orderNumber)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Order not found", null);
        }
        const orderId = await findOrderId(db, orderNumber, { userId });
        const data = orderId ? await loadInvoiceData(db, orderId) : null;
        if (!data) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Order not found", null);
        }
        if (paidOnly && data.order.payment_status !== "paid") {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, "The invoice is available once the order is paid", null);
        }

        const pdf = await renderInvoicePdf(data);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${invoiceFilename(data.order.order_number)}"`);
        res.setHeader("Cache-Control", "private, no-store");
        return res.send(pdf);
    } catch (error) {
        console.error("Invoice error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Couldn't create the invoice. Please try again.", null);
    }
}

const getMyInvoice = (req, res) => sendInvoice(req, res, { orderNumber: String(req.params.order_number || "").trim(), userId: req.user.id, paidOnly: true });

const getAdminInvoice = (req, res) => sendInvoice(req, res, { orderNumber: String(req.params.orderNumber || "").trim(), paidOnly: false });

export { getMyInvoice, getAdminInvoice };
