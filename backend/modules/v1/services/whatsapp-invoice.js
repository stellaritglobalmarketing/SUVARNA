import db from "../../../config/db.js";
import { invoiceFilename, loadInvoiceData, renderInvoicePdf } from "./invoice.js";

// Sends a paid order's invoice PDF to the store's WhatsApp number through the Meta WhatsApp
// Cloud API. Off until all WHATSAPP_* vars below are set; until then it only logs.
//
//   WHATSAPP_ACCESS_TOKEN      permanent system-user token with whatsapp_business_messaging
//   WHATSAPP_PHONE_NUMBER_ID   the sending number's id (WhatsApp Manager → API Setup)
//   WHATSAPP_STORE_NUMBER      who receives it, digits with country code, e.g. 919377716183
//   WHATSAPP_INVOICE_TEMPLATE  approved template name (see README: document header + 6 body params)
//   WHATSAPP_TEMPLATE_LANG     template language code, default "en"
//
// A message the store didn't start must use an approved template, which is why this isn't free text.

const GRAPH_URL = "https://graph.facebook.com/v21.0";

function config() {
    const env = process.env;
    const cfg = {
        token: env.WHATSAPP_ACCESS_TOKEN?.trim(),
        phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID?.trim(),
        to: env.WHATSAPP_STORE_NUMBER?.replace(/\D/g, ""),
        template: env.WHATSAPP_INVOICE_TEMPLATE?.trim(),
        lang: env.WHATSAPP_TEMPLATE_LANG?.trim() || "en",
    };
    return cfg.token && cfg.phoneNumberId && cfg.to && cfg.template ? cfg : null;
}

// Template parameters may not contain newlines, tabs or 4+ spaces in a row, and are capped in length.
const param = (text, max = 500) => {
    const clean = String(text ?? "-").replace(/[\r\n\t]+/g, " | ").replace(/ {2,}/g, " ").trim() || "-";
    return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};

const rupees = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

async function graph(cfg, path, init) {
    const res = await fetch(`${GRAPH_URL}/${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${cfg.token}`, ...(init.headers || {}) },
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
        throw new Error(`WhatsApp API ${res.status}: ${body?.error?.message || "request failed"}`);
    }
    return body;
}

async function uploadPdf(cfg, pdf, filename) {
    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append("type", "application/pdf");
    form.append("file", new Blob([pdf], { type: "application/pdf" }), filename);
    const body = await graph(cfg, `${cfg.phoneNumberId}/media`, { method: "POST", body: form });
    return body.id;
}

async function sendTemplate(cfg, mediaId, filename, data) {
    const { order, items, payment } = data;
    const itemsText = items.map((i) => `${i.product_name} (${i.variant_name}) x${i.quantity} = ${rupees(i.total_price)}`).join(" | ");
    const address = [
        order.shipping_name,
        order.shipping_phone,
        order.shipping_address_line1,
        order.shipping_address_line2,
        order.shipping_landmark,
        `${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}`,
    ]
        .filter(Boolean)
        .join(", ");

    // Body params, in order — the approved template must use {{1}}..{{6}} the same way.
    const params = [
        order.order_number,
        rupees(order.total_amount),
        [order.customer_name, order.customer_phone, order.customer_email].filter(Boolean).join(", "),
        itemsText,
        address,
        payment?.gateway_payment_id || "-",
    ];

    return graph(cfg, `${cfg.phoneNumberId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to: cfg.to,
            type: "template",
            template: {
                name: cfg.template,
                language: { code: cfg.lang },
                components: [
                    { type: "header", parameters: [{ type: "document", document: { id: mediaId, filename } }] },
                    { type: "body", parameters: params.map((text) => ({ type: "text", text: param(text) })) },
                ],
            },
        }),
    });
}

/**
 * Sends the invoice for `orderId` to the store's WhatsApp. Never throws: a failure here must not
 * affect the customer's payment, so it is logged and the admin can still download the invoice.
 */
async function sendInvoiceToStore(orderId) {
    try {
        const cfg = config();
        if (!cfg) {
            console.log(`WhatsApp invoice skipped for order id ${orderId}: WHATSAPP_* env vars not set`);
            return;
        }
        const data = await loadInvoiceData(db, orderId);
        if (!data) {
            return;
        }
        const filename = invoiceFilename(data.order.order_number);
        const pdf = await renderInvoicePdf(data);
        const mediaId = await uploadPdf(cfg, pdf, filename);
        await sendTemplate(cfg, mediaId, filename, data);
        console.log(`WhatsApp invoice sent for ${data.order.order_number}`);
    } catch (error) {
        console.error(`WhatsApp invoice failed for order id ${orderId}:`, error.message);
    }
}

export { sendInvoiceToStore };
