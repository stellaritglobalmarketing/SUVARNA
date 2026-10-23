import nodemailer from "nodemailer";
import db from "../../../config/db.js";
import { invoiceFilename, loadInvoiceData, renderInvoicePdf } from "./invoice.js";

// Emails the store a "new paid order" notice (customer + order details, invoice PDF attached).
// Off until the SMTP_* vars below are set; until then it only logs.
//
//   SMTP_HOST / SMTP_PORT   default smtp.gmail.com / 465
//   SMTP_USER               sender mailbox
//   SMTP_PASS               for Gmail: a 16-char App Password (Google Account → Security →
//                           2-Step Verification → App passwords), not the normal password
//   ORDER_NOTIFY_EMAIL      who receives it (comma-separate several); defaults to SMTP_USER

let transporter = null;

function config() {
    const env = process.env;
    const user = env.SMTP_USER?.trim();
    const pass = env.SMTP_PASS?.replace(/\s+/g, ""); // App Passwords are shown with spaces
    if (!(user && pass)) return null;
    return {
        host: env.SMTP_HOST?.trim() || "smtp.gmail.com",
        port: Number(env.SMTP_PORT) || 465,
        user,
        pass,
        to: env.ORDER_NOTIFY_EMAIL?.trim() || user,
    };
}

function getTransporter(cfg) {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: cfg.host,
            port: cfg.port,
            secure: cfg.port === 465,
            auth: { user: cfg.user, pass: cfg.pass },
        });
    }
    return transporter;
}

const escape = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const rupees = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })
        : "-";

function shippingAddress(order) {
    return [
        order.shipping_address_line1,
        order.shipping_address_line2,
        order.shipping_landmark,
        `${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}`,
        order.shipping_country,
    ].filter(Boolean);
}

function renderHtml({ order, items, payment }) {
    const row = (label, value) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#6b6259;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:4px 0">${value}</td></tr>`;
    const cell = "padding:8px;border-bottom:1px solid #e6dccb";

    const itemRows = items
        .map(
            (i) => `<tr>
                <td style="${cell}">${escape(i.product_name)}${i.variant_name ? `<br><span style="color:#6b6259;font-size:12px">${escape(i.variant_name)}</span>` : ""}</td>
                <td style="${cell};text-align:center">${i.quantity}</td>
                <td style="${cell};text-align:right">${rupees(i.unit_price)}</td>
                <td style="${cell};text-align:right">${rupees(i.total_price)}</td>
            </tr>`
        )
        .join("");

    const totals = [
        ["Subtotal", order.subtotal],
        Number(order.discount_amount) ? ["Discount", -order.discount_amount] : null,
        ["Shipping", order.shipping_amount],
        Number(order.tax_amount) ? ["Tax", order.tax_amount] : null,
    ]
        .filter(Boolean)
        .map(([label, value]) => `<tr><td colspan="3" style="padding:4px 8px;text-align:right;color:#6b6259">${label}</td><td style="padding:4px 8px;text-align:right">${rupees(value)}</td></tr>`)
        .join("");

    return `<div style="font-family:Arial,Helvetica,sans-serif;color:#3d2b1c;max-width:640px;margin:0 auto">
        <h2 style="margin:0 0 4px">New paid order ${escape(order.order_number)}</h2>
        <p style="margin:0 0 20px;color:#6b6259">${formatDate(order.created_at)} · ${rupees(order.total_amount)} paid</p>

        <h3 style="margin:0 0 8px;color:#c8922a">Customer</h3>
        <table style="border-collapse:collapse;font-size:14px;margin-bottom:20px">
            ${row("Name", escape(order.customer_name))}
            ${row("Phone", escape(order.customer_phone))}
            ${row("Email", escape(order.customer_email || "-"))}
        </table>

        <h3 style="margin:0 0 8px;color:#c8922a">Ship to</h3>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.5">
            <strong>${escape(order.shipping_name)}</strong> · ${escape(order.shipping_phone)}<br>
            ${shippingAddress(order).map(escape).join("<br>")}
        </p>

        <h3 style="margin:0 0 8px;color:#c8922a">Items</h3>
        <table style="border-collapse:collapse;width:100%;font-size:14px">
            <thead><tr style="background:#fbf6ec">
                <th style="${cell};text-align:left">Product</th>
                <th style="${cell}">Qty</th>
                <th style="${cell};text-align:right">Price</th>
                <th style="${cell};text-align:right">Total</th>
            </tr></thead>
            <tbody>${itemRows}</tbody>
            <tfoot>
                ${totals}
                <tr><td colspan="3" style="padding:8px;text-align:right;font-weight:bold">Total paid</td><td style="padding:8px;text-align:right;font-weight:bold">${rupees(order.total_amount)}</td></tr>
            </tfoot>
        </table>

        <h3 style="margin:20px 0 8px;color:#c8922a">Payment</h3>
        <table style="border-collapse:collapse;font-size:14px">
            ${row("Payment ID", escape(payment?.gateway_payment_id || "-"))}
            ${row("Method", escape(payment?.payment_method || "-"))}
            ${row("Paid at", formatDate(payment?.paid_at))}
        </table>
        ${order.notes ? `<h3 style="margin:20px 0 8px;color:#c8922a">Customer note</h3><p style="font-size:14px">${escape(order.notes)}</p>` : ""}
    </div>`;
}

/**
 * Emails the store about a newly paid order. Never throws: a failure here must not affect the
 * customer's payment, so it is logged and the order is still in the admin panel.
 */
async function sendOrderEmailToStore(orderId) {
    try {
        const cfg = config();
        if (!cfg) {
            console.log(`Order email skipped for order id ${orderId}: SMTP_USER / SMTP_PASS not set`);
            return;
        }
        const data = await loadInvoiceData(db, orderId);
        if (!data) {
            return;
        }
        const { order } = data;
        const attachments = [];
        try {
            attachments.push({ filename: invoiceFilename(order.order_number), content: await renderInvoicePdf(data), contentType: "application/pdf" });
        } catch (error) {
            console.error(`Invoice PDF for order email ${order.order_number} failed:`, error.message);
        }
        await getTransporter(cfg).sendMail({
            from: `"Suvarna7 Orders" <${cfg.user}>`,
            to: cfg.to,
            replyTo: order.customer_email || undefined,
            subject: `New order ${order.order_number} — ${rupees(order.total_amount)} paid by ${order.customer_name}`,
            html: renderHtml(data),
            attachments,
        });
        console.log(`Order email sent for ${order.order_number}`);
    } catch (error) {
        console.error(`Order email failed for order id ${orderId}:`, error.message);
    }
}

export { sendOrderEmailToStore };
