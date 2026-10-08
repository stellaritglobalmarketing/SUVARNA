import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";

// Order invoice as a PDF (A4). The seller block comes from INVOICE_SELLER_* env vars, falling
// back to the Ekart pickup address, so it matches where parcels ship from. GSTIN prints only when set.

const BRAND = "#3d2b1c";
const GOLD = "#c8922a";
const MUTED = "#6b6259";
const LINE = "#e6dccb";
const CREAM = "#fbf6ec";
const GREEN = "#2f7a3e";

// Brand logo (same file as the storefront's). The artwork sits inside white padding, so it is
// drawn through a clip of just the lettering: LOGO_CROP is that box in the PNG's own pixels.
const LOGO_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "assets", "invoice-logo.png");
const LOGO_SIZE = { w: 707, h: 353 };
const LOGO_CROP = { x: 60, y: 70, w: 605, h: 190 };

// pdfkit's built-in Helvetica has no ₹ glyph, so amounts print as "Rs. 1,999.00".
const money = (value) =>
    `Rs. ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })
        : "-";

function sellerDetails() {
    const env = process.env;
    const cityState = [env.INVOICE_SELLER_CITY || env.EKART_PICKUP_CITY, env.INVOICE_SELLER_STATE || env.EKART_PICKUP_STATE].filter(Boolean).join(", ");
    const pincode = env.INVOICE_SELLER_PINCODE || env.EKART_PICKUP_PINCODE;
    const address = [env.INVOICE_SELLER_ADDRESS || env.EKART_PICKUP_ADDRESS, [cityState, pincode].filter(Boolean).join(" - ")].filter(Boolean);
    return {
        name: env.INVOICE_SELLER_NAME || "Suvarna7",
        address,
        phone: env.INVOICE_SELLER_PHONE || env.EKART_PICKUP_PHONE || null,
        email: env.INVOICE_SELLER_EMAIL || null,
        gstin: env.INVOICE_SELLER_GSTIN || null,
    };
}

/**
 * Everything the invoice prints, for one order by id. `conn` is the pool or a connection.
 * Returns null when the order doesn't exist.
 */
async function loadInvoiceData(conn, orderId) {
    const [[order]] = await conn.query(
        `SELECT id, order_number, customer_name, customer_phone, customer_email,
                shipping_name, shipping_phone, shipping_address_line1, shipping_address_line2,
                shipping_landmark, shipping_city, shipping_state, shipping_country, shipping_pincode,
                subtotal, discount_amount, shipping_amount, tax_amount, total_amount,
                order_status, payment_status, notes, created_at
         FROM orders WHERE id = ? AND is_delete = 0 LIMIT 1`,
        [orderId]
    );
    if (!order) {
        return null;
    }
    const [items] = await conn.query(
        `SELECT product_name, variant_name, sku, quantity, unit_price, total_price
         FROM order_items WHERE order_id = ? ORDER BY id ASC`,
        [orderId]
    );
    const [[payment]] = await conn.query(
        `SELECT gateway, gateway_payment_id, payment_method, paid_at
         FROM payments WHERE order_id = ? AND payment_status = 'paid'
         ORDER BY paid_at DESC, id DESC LIMIT 1`,
        [orderId]
    );
    return { order, items, payment: payment || null };
}

/** Order id for an order number, or null. */
async function findOrderId(conn, orderNumber, { userId } = {}) {
    const [rows] = await conn.query(
        `SELECT id FROM orders WHERE order_number = ? AND is_delete = 0${userId ? " AND user_id = ?" : ""} LIMIT 1`,
        userId ? [orderNumber, userId] : [orderNumber]
    );
    return rows[0]?.id ?? null;
}

const invoiceFilename = (orderNumber) => `Suvarna7-Invoice-${orderNumber}.pdf`;

/** "ORD-20261008-0009" -> "INV-20261008-0009": one invoice per order, numbered alongside it. */
const invoiceNumber = (orderNumber) => String(orderNumber).replace(/^ORD-/, "INV-");

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
    "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowHundred(n) {
    return n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;
}

/** Whole number in Indian words (lakh / crore), e.g. 125000 -> "One Lakh Twenty Five Thousand". */
function indianWords(n) {
    if (n === 0) return "Zero";
    const parts = [];
    for (const [size, name] of [[10000000, "Crore"], [100000, "Lakh"], [1000, "Thousand"], [100, "Hundred"]]) {
        if (n >= size) {
            parts.push(`${indianWords(Math.floor(n / size))} ${name}`);
            n %= size;
        }
    }
    if (n > 0) parts.push(belowHundred(n));
    return parts.join(" ");
}

/** 1999.5 -> "Rupees One Thousand Nine Hundred Ninety Nine and Fifty Paise Only". */
function amountInWords(amount) {
    const paiseTotal = Math.round(Number(amount || 0) * 100);
    const rupees = Math.floor(paiseTotal / 100);
    const paise = paiseTotal % 100;
    return `Rupees ${indianWords(rupees)}${paise ? ` and ${belowHundred(paise)} Paise` : ""} Only`;
}

/** Renders the invoice and resolves with the PDF bytes. */
function renderInvoicePdf({ order, items, payment }) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: "A4", margin: 40, info: { Title: `Invoice ${invoiceNumber(order.order_number)}`, Author: "Suvarna7" } });
        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        const seller = sellerDetails();
        const pageW = doc.page.width;
        const pageH = doc.page.height;
        const left = 40;
        const right = pageW - 40;
        const width = right - left;
        const isPaid = order.payment_status === "paid";

        const label = (text, x, y, opts = {}) =>
            doc.font("Helvetica-Bold").fontSize(7.5).fillColor(GOLD).text(text.toUpperCase(), x, y, { characterSpacing: 1.2, ...opts });

        // ---------------------------------------------------------------- header band
        const sellerLines = [...seller.address];
        if (seller.phone) sellerLines.push(`Phone: ${seller.phone}`);
        if (seller.email) sellerLines.push(seller.email);
        if (seller.gstin) sellerLines.push(`GSTIN: ${seller.gstin}`);
        const headerH = Math.max(128, 104 + sellerLines.length * 11);

        doc.rect(0, 0, pageW, headerH).fill(CREAM);
        doc.rect(0, headerH, pageW, 3).fill(GOLD);

        const logoW = 165;
        const scale = logoW / LOGO_CROP.w;
        const logoH = LOGO_CROP.h * scale;
        const logoY = 30;
        doc.save();
        doc.rect(left, logoY, logoW, logoH).clip();
        doc.image(LOGO_PATH, left - LOGO_CROP.x * scale, logoY - LOGO_CROP.y * scale, { width: LOGO_SIZE.w * scale });
        doc.restore();

        doc.font("Helvetica").fontSize(8.5).fillColor(MUTED);
        let sy = logoY + logoH + 8;
        if (sellerLines.length === 0) {
            doc.font("Helvetica-Oblique").text("Pure Indian Goodness", left, sy);
        }
        sellerLines.forEach((line) => {
            doc.text(line, left, sy, { width: 260 });
            sy += 11;
        });

        doc.font("Helvetica-Bold").fontSize(30).fillColor(BRAND).text("INVOICE", left, 34, { width, align: "right", characterSpacing: 2 });
        doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(invoiceNumber(order.order_number), left, 70, { width, align: "right" });

        // Status pill
        const pillText = isPaid ? "PAID" : String(order.payment_status).toUpperCase();
        doc.font("Helvetica-Bold").fontSize(9);
        const pillW = doc.widthOfString(pillText, { characterSpacing: 1.5 }) + 24;
        const pillX = right - pillW;
        doc.roundedRect(pillX, 88, pillW, 20, 10).fill(isPaid ? GREEN : GOLD);
        doc.fillColor("#ffffff").text(pillText, pillX, 94, { width: pillW, align: "center", characterSpacing: 1.5 });

        // ---------------------------------------------------------------- info strip
        let y = headerH + 22;
        const infos = [
            ["Invoice No", invoiceNumber(order.order_number)],
            ["Order No", order.order_number],
            ["Order Date", formatDate(order.created_at)],
            [isPaid ? "Paid On" : "Status", isPaid && payment?.paid_at ? formatDate(payment.paid_at) : String(order.order_status)],
        ];
        const gap = 10;
        const boxW = (width - gap * (infos.length - 1)) / infos.length;
        infos.forEach(([name, value], i) => {
            const x = left + i * (boxW + gap);
            doc.roundedRect(x, y, boxW, 46, 6).lineWidth(0.8).fillAndStroke("#ffffff", LINE);
            doc.rect(x, y + 8, 2.5, 30).fill(GOLD);
            label(name, x + 12, y + 10, { width: boxW - 18 });
            doc.font("Helvetica-Bold").fontSize(9.5).fillColor(BRAND).text(value, x + 12, y + 24, { width: boxW - 18, lineBreak: false, ellipsis: true });
        });
        y += 46 + 20;

        // ---------------------------------------------------------------- bill to / ship to
        const colW = (width - 14) / 2;
        const billLines = [order.customer_phone && `Phone: ${order.customer_phone}`, order.customer_email].filter(Boolean);
        const shipLines = [
            [order.shipping_address_line1, order.shipping_address_line2].filter(Boolean).join(", "),
            order.shipping_landmark && `Landmark: ${order.shipping_landmark}`,
            `${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}`,
            order.shipping_phone && `Phone: ${order.shipping_phone}`,
        ].filter(Boolean);
        doc.font("Helvetica").fontSize(9);
        const linesHeight = (lines) => lines.reduce((h, line) => h + doc.heightOfString(line, { width: colW - 28 }) + 2, 0);
        const partyH = 46 + Math.max(linesHeight(billLines), linesHeight(shipLines));
        const party = (title, name, lines, x) => {
            doc.roundedRect(x, y, colW, partyH, 8).fill(CREAM);
            label(title, x + 14, y + 12);
            doc.font("Helvetica-Bold").fontSize(11).fillColor(BRAND).text(name || "-", x + 14, y + 25, { width: colW - 28 });
            let ly = doc.y + 3;
            doc.font("Helvetica").fontSize(9).fillColor(MUTED);
            lines.forEach((line) => {
                doc.text(line, x + 14, ly, { width: colW - 28 });
                ly = doc.y + 2;
            });
        };
        party("Billed To", order.customer_name, billLines, left);
        party("Shipped To", order.shipping_name, shipLines, left + colW + 14);
        y += partyH + 22;

        // ---------------------------------------------------------------- items
        const cols = [
            { title: "#", x: left, w: 28, align: "center" },
            { title: "Product", x: left + 28, w: width - 28 - 50 - 95 - 95, align: "left" },
            { title: "Qty", x: right - 240, w: 50, align: "center" },
            { title: "Unit Price", x: right - 190, w: 95, align: "right" },
            { title: "Amount", x: right - 95, w: 95, align: "right" },
        ];
        const pad = 10;
        const cellX = (c) => (c.align === "left" ? c.x + pad : c.x);
        const cellW = (c) => (c.align === "center" ? c.w : c.w - pad);

        doc.roundedRect(left, y, width, 26, 6).fill(BRAND);
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#ffffff");
        cols.forEach((c) => doc.text(c.title.toUpperCase(), cellX(c), y + 9, { width: cellW(c), align: c.align, characterSpacing: 0.8 }));
        y += 26;

        items.forEach((item, index) => {
            doc.font("Helvetica-Bold").fontSize(10);
            const nameH = doc.heightOfString(item.product_name, { width: cellW(cols[1]) });
            const rowH = nameH + 30;
            if (y + rowH > pageH - 260) {
                doc.addPage();
                y = 40;
            }
            if (index % 2 === 1) doc.rect(left, y, width, rowH).fill(CREAM);
            const midY = y + rowH / 2 - 5;
            doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(String(index + 1), cellX(cols[0]), midY, { width: cellW(cols[0]), align: "center" });
            doc.font("Helvetica-Bold").fontSize(10).fillColor(BRAND).text(item.product_name, cellX(cols[1]), y + 9, { width: cellW(cols[1]) });
            doc.font("Helvetica").fontSize(8).fillColor(MUTED)
                .text([item.variant_name, item.sku && `SKU ${item.sku}`].filter(Boolean).join("   |   "), cellX(cols[1]), doc.y + 3, { width: cellW(cols[1]) });
            doc.font("Helvetica").fontSize(10).fillColor(BRAND);
            doc.text(String(item.quantity), cellX(cols[2]), midY, { width: cellW(cols[2]), align: "center" });
            doc.text(money(item.unit_price), cellX(cols[3]), midY, { width: cellW(cols[3]), align: "right" });
            doc.font("Helvetica-Bold").text(money(item.total_price), cellX(cols[4]), midY, { width: cellW(cols[4]), align: "right" });
            y += rowH;
            doc.moveTo(left, y).lineTo(right, y).lineWidth(0.6).strokeColor(LINE).stroke();
        });
        y += 18;

        // ---------------------------------------------------------------- payment details + totals
        const totalsW = 220;
        const totalsX = right - totalsW;
        const detailsW = width - totalsW - 20;
        const blockTop = y;

        // Left: payment details and amount in words
        const details = [];
        if (payment?.payment_method) details.push(["Method", String(payment.payment_method).toUpperCase()]);
        if (payment?.gateway_payment_id) details.push(["Payment ID", payment.gateway_payment_id]);
        if (payment?.gateway) details.push(["Gateway", payment.gateway.charAt(0).toUpperCase() + payment.gateway.slice(1)]);
        let dy = blockTop;
        if (details.length) {
            label("Payment Details", left, dy);
            dy += 14;
            details.forEach(([name, value]) => {
                doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(name, left, dy, { width: 70 });
                doc.font("Helvetica-Bold").fillColor(BRAND).text(value, left + 70, dy, { width: detailsW - 70 });
                dy += 14;
            });
            dy += 8;
        }
        label("Amount in Words", left, dy);
        doc.font("Helvetica-Oblique").fontSize(9.5).fillColor(BRAND).text(amountInWords(order.total_amount), left, dy + 13, { width: detailsW });
        dy = doc.y;

        // Right: totals
        const totals = [["Subtotal", money(order.subtotal)]];
        if (Number(order.discount_amount) > 0) totals.push(["Discount", `- ${money(order.discount_amount)}`]);
        totals.push(["Delivery", Number(order.shipping_amount) > 0 ? money(order.shipping_amount) : "FREE"]);
        if (Number(order.tax_amount) > 0) totals.push(["Tax", money(order.tax_amount)]);
        let ty = blockTop;
        totals.forEach(([name, value]) => {
            doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(name, totalsX + 12, ty, { width: 100 });
            doc.font("Helvetica-Bold").fillColor(value === "FREE" ? GREEN : BRAND).text(value, totalsX, ty, { width: totalsW - 12, align: "right" });
            ty += 18;
        });
        ty += 4;
        doc.roundedRect(totalsX, ty, totalsW, 38, 8).fill(BRAND);
        doc.rect(totalsX, ty + 8, 3, 22).fill(GOLD);
        doc.font("Helvetica").fontSize(8).fillColor("#e8d9bf").text(isPaid ? "TOTAL PAID" : "TOTAL DUE", totalsX + 14, ty + 8, { characterSpacing: 1.2 });
        doc.font("Helvetica-Bold").fontSize(15).fillColor("#ffffff").text(money(order.total_amount), totalsX, ty + 13, { width: totalsW - 14, align: "right" });
        ty += 38;

        y = Math.max(dy, ty) + 28;

        if (order.notes) {
            label("Delivery Instructions", left, y);
            doc.font("Helvetica").fontSize(9).fillColor(BRAND).text(order.notes, left, y + 13, { width: detailsW });
            y = doc.y + 18;
        }

        // ---------------------------------------------------------------- thank you + signatory
        const footerTop = pageH - 74;
        const signY = Math.min(Math.max(y, pageH - 200), footerTop - 70);
        doc.font("Times-BoldItalic").fontSize(17).fillColor(BRAND).text("Thank you for your order!", left, signY);
        doc.font("Helvetica").fontSize(9).fillColor(MUTED)
            .text("Every pack is sourced directly from farmers and sealed fresh for you.", left, signY + 22, { width: 300 });
        doc.moveTo(right - 150, signY + 30).lineTo(right, signY + 30).lineWidth(0.8).strokeColor(BRAND).stroke();
        doc.font("Helvetica-Bold").fontSize(9).fillColor(BRAND).text(`For ${seller.name}`, right - 150, signY + 36, { width: 150, align: "center" });
        doc.font("Helvetica").fontSize(8).fillColor(MUTED).text("Authorised Signatory", right - 150, signY + 48, { width: 150, align: "center" });

        // ---------------------------------------------------------------- footer band
        // The band sits inside the bottom margin, where pdfkit would otherwise start a new page for text.
        doc.page.margins.bottom = 0;
        doc.rect(0, footerTop, pageW, 3).fill(GOLD);
        doc.rect(0, footerTop + 3, pageW, pageH - footerTop - 3).fill(BRAND);
        const contact = [seller.phone && `WhatsApp / Call: ${seller.phone}`, seller.email, "Pure Indian Goodness"].filter(Boolean).join("   |   ");
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#ffffff").text(contact, left, footerTop + 18, { width, align: "center", lineBreak: false });
        doc.font("Helvetica").fontSize(7.5).fillColor("#d9c7a8")
            .text("No returns. Damaged, wrong or defective items can be exchanged if reported within 36 hours of delivery.", left, footerTop + 34, { width, align: "center", lineBreak: false })
            .text("This is a computer-generated invoice and does not require a physical signature.", left, footerTop + 46, { width, align: "center", lineBreak: false });

        doc.end();
    });
}

export { loadInvoiceData, findOrderId, renderInvoicePdf, invoiceFilename, invoiceNumber };
