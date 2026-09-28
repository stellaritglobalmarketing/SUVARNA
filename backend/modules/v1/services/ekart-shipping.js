import db from "../../../config/db.js";
import ekart from "../../../config/ekart.js";

// Everything Ekart-specific that isn't a raw HTTP call: building the create-shipment payload from
// our order, turning Ekart's tracking into our shipment/order statuses, and keeping them in sync
// (from webhooks, the periodic sync, or an admin's "Sync" click — all go through syncShipment).

export const PROVIDER = "ekart";

// Ekart's tracking statuses (`swift_status` in their API spec) → our shipments.shipment_status.
const STATUS_MAP = {
    "Order Placed": "created",
    "Pickup Scheduled": "pickup_scheduled",
    "Pickup Pending": "pickup_scheduled",
    "Out for Pickup": "pickup_scheduled",
    "Picked Up": "picked_up",
    "In Transit": "in_transit",
    "Shipment Delayed": "in_transit",
    "Out for Delivery": "out_for_delivery",
    Delivered: "delivered",
    Undelivered: "ndr",
    "RTO Requested": "rto",
    "Seller RTO Requested": "rto",
    "RTO In Transit": "rto",
    "RTO Out for Delivery": "rto",
    "RTO Shipment Delayed": "rto",
    "RTO Delivered": "rto_delivered",
    Cancelled: "cancelled",
    "Seller Cancelled": "cancelled",
    "Pickup Cancelled": "cancelled",
    Lost: "lost",
    Damaged: "lost",
    "Not Serviceable": "failed",
    "Not Picked": "failed",
    "RTO Failed": "failed",
};

/** No further tracking updates are expected once a shipment reaches one of these. */
export const FINAL_STATUSES = ["delivered", "rto_delivered", "cancelled", "lost", "failed"];
/** A shipment in one of these no longer counts as "the" shipment of its order, so a new one may be booked. */
const REPLACEABLE_STATUSES = ["cancelled", "failed", "lost"];
const HANDED_TO_COURIER = ["picked_up", "in_transit", "out_for_delivery", "ndr", "delivered", "rto", "rto_delivered"];

export function mapStatus(ekartStatus) {
    return STATUS_MAP[ekartStatus] ?? null;
}

// ------------------------------------------------------------------ settings from .env

function env(name, fallback = "") {
    const value = process.env[name];
    return value === undefined || value === null || String(value).trim() === "" ? fallback : String(value).trim();
}

function envInt(name, fallback) {
    const value = parseInt(env(name), 10);
    return Number.isInteger(value) && value > 0 ? value : fallback;
}

export function defaultPackage() {
    return {
        length_cm: envInt("EKART_DEFAULT_LENGTH_CM", 20),
        width_cm: envInt("EKART_DEFAULT_WIDTH_CM", 15),
        height_cm: envInt("EKART_DEFAULT_HEIGHT_CM", 10),
        packaging_weight_g: envInt("EKART_PACKAGING_WEIGHT_G", 150),
    };
}

function serviceType() {
    return env("EKART_SERVICE_TYPE", "SURFACE").toUpperCase() === "EXPRESS" ? "EXPRESS" : "SURFACE";
}

/** "+91 98765-43210" → 9876543210; returns null unless exactly 10 digits remain. */
export function normalizePhone(value) {
    let digits = String(value ?? "").replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
    return /^\d{10}$/.test(digits) ? digits : null;
}

function round2(value) {
    return Math.round(Number(value) * 100) / 100;
}

function sameState(a, b) {
    const clean = (s) => String(s ?? "").toLowerCase().replace(/[^a-z]/g, "");
    return clean(a) !== "" && clean(a) === clean(b);
}

function pickupLocation() {
    const address = env("EKART_PICKUP_ADDRESS");
    if (address) {
        const phone = normalizePhone(env("EKART_PICKUP_PHONE"));
        return {
            location_type: "Office",
            name: env("EKART_PICKUP_NAME", env("EKART_SELLER_NAME")),
            address,
            city: env("EKART_PICKUP_CITY") || null,
            state: env("EKART_PICKUP_STATE"),
            country: "India",
            phone: phone ? Number(phone) : undefined,
            pin: Number(env("EKART_PICKUP_PINCODE")) || undefined,
        };
    }
    const alias = env("EKART_PICKUP_ALIAS");
    // With a single pickup address registered on the Ekart account, Ekart fills it in itself.
    return alias ? { name: alias } : undefined;
}

function returnLocation() {
    const alias = env("EKART_RETURN_ALIAS");
    // Left out, Ekart returns RTO parcels to the pickup address.
    return alias ? { name: alias } : undefined;
}

// ------------------------------------------------------------------ package weight

function variantGrams(value, unit) {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) return 0;
    switch (String(unit || "").toLowerCase()) {
        case "kg":
        case "l":
            return amount * 1000;
        case "g":
        case "ml":
            return amount;
        default:
            return 0;
    }
}

/** Suggested package for an order: product weights (from variants) + packaging, and the default box. */
export async function suggestPackage(orderId) {
    const [rows] = await db.query(
        `SELECT oi.quantity, pv.weight_value, pv.weight_unit
         FROM order_items oi
         LEFT JOIN product_variants pv ON pv.id = oi.product_variant_id
         WHERE oi.order_id = ?`,
        [orderId]
    );
    const box = defaultPackage();
    const productGrams = rows.reduce((sum, row) => sum + variantGrams(row.weight_value, row.weight_unit) * row.quantity, 0);
    return {
        weight_g: Math.max(Math.ceil(productGrams + box.packaging_weight_g), 100),
        length_cm: box.length_cm,
        width_cm: box.width_cm,
        height_cm: box.height_cm,
    };
}

// ------------------------------------------------------------------ serviceability

const SERVICEABILITY_TTL_MS = 6 * 60 * 60 * 1000;
const SERVICEABILITY_CACHE_LIMIT = 5000;
const serviceabilityCache = new Map();

/**
 * Whether Ekart delivers to `pincode`, whether COD is possible there, and (when a pickup pincode is
 * configured) the delivery time in days. Cached for a few hours per pincode.
 */
export async function checkServiceability(pincode) {
    const cached = serviceabilityCache.get(pincode);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const result = await ekart.serviceability(pincode);
    const details = result?.details ?? {};
    const value = {
        pincode,
        serviceable: Boolean(result?.status) && details.forward_drop !== false,
        cod_available: Boolean(details.cod),
        max_cod_amount: Number(details.max_cod_amount) || 0,
        city: details.city || null,
        state: details.state || null,
        estimated_days: null,
    };

    const pickupPincode = env("EKART_PICKUP_PINCODE");
    if (value.serviceable && pickupPincode) {
        try {
            const box = defaultPackage();
            const lanes = await ekart.laneServiceability({
                pickupPincode,
                dropPincode: pincode,
                length: String(box.length_cm),
                width: String(box.width_cm),
                height: String(box.height_cm),
                weight: "500",
                paymentType: "Prepaid",
                serviceType: serviceType(),
                invoiceAmount: "1000",
            });
            const tat = Array.isArray(lanes) ? lanes.find((lane) => lane?.tat)?.tat : null;
            if (tat && Number.isFinite(Number(tat.min)) && Number.isFinite(Number(tat.max))) {
                value.estimated_days = [Number(tat.min), Number(tat.max)];
            }
        } catch (error) {
            console.warn(`Ekart lane serviceability for ${pickupPincode} → ${pincode} failed: ${error.message}`);
        }
    }

    if (serviceabilityCache.size >= SERVICEABILITY_CACHE_LIMIT) {
        serviceabilityCache.delete(serviceabilityCache.keys().next().value);
    }
    serviceabilityCache.set(pincode, { value, expiresAt: Date.now() + SERVICEABILITY_TTL_MS });
    return value;
}

// ------------------------------------------------------------------ rate estimate

/** Ekart's estimated charge to ship this order's package (what Ekart bills us, not the customer). */
export async function estimateCharge({ dropPincode, pkg, invoiceAmount }) {
    const pickupPincode = Number(env("EKART_PICKUP_PINCODE"));
    if (!pickupPincode) return null;
    const estimate = await ekart.estimate({
        pickupPincode,
        dropPincode: Number(dropPincode),
        invoiceAmount: Number(invoiceAmount),
        weight: pkg.weight_g,
        length: pkg.length_cm,
        width: pkg.width_cm,
        height: pkg.height_cm,
        serviceType: serviceType(),
        codAmount: 0,
    });
    const num = (v) => (v === undefined || v === null || v === "" ? null : round2(v));
    return {
        zone: estimate?.zone ?? null,
        billing_weight: estimate?.billingWeight ?? null,
        volumetric_weight: estimate?.volumetricWeight ?? null,
        shipping_charge: num(estimate?.shippingCharge),
        fuel_surcharge: num(estimate?.fuelSurcharge),
        rto_charge: num(estimate?.rtoCharge),
        taxes: num(estimate?.taxes),
        total: num(estimate?.total),
    };
}

// ------------------------------------------------------------------ create shipment

/**
 * Books an Ekart shipment for a paid order with the given package, and records it.
 * Throws an Error with `.userMessage` for problems the admin can fix (bad phone, not paid, …).
 */
export async function createShipmentForOrder(orderNumber, pkg, { preferredDispatchDate } = {}) {
    const fail = (message) => Object.assign(new Error(message), { userMessage: message });

    const [orderRows] = await db.query(
        `SELECT id, order_number, customer_phone, shipping_name, shipping_phone, shipping_address_line1, shipping_address_line2,
                shipping_landmark, shipping_city, shipping_state, shipping_country, shipping_pincode,
                total_amount, order_status, payment_status, created_at
         FROM orders WHERE order_number = ? AND is_delete = 0 LIMIT 1`,
        [orderNumber]
    );
    const order = orderRows[0];
    if (!order) throw fail("Order not found");
    if (order.payment_status !== "paid") {
        throw fail("Only paid (prepaid) orders can be shipped with Ekart. This order isn't paid yet.");
    }
    if (!["confirmed", "processing"].includes(order.order_status)) {
        throw fail(`An order that is ${order.order_status} can't be shipped`);
    }

    const [activeRows] = await db.query(
        `SELECT awb_number FROM shipments
         WHERE order_id = ? AND is_delete = 0 AND shipment_status NOT IN (${REPLACEABLE_STATUSES.map(() => "?").join(",")})
         LIMIT 1`,
        [order.id, ...REPLACEABLE_STATUSES]
    );
    if (activeRows.length > 0) {
        throw fail(`This order already has a shipment${activeRows[0].awb_number ? ` (${activeRows[0].awb_number})` : ""}. Cancel it first to book a new one.`);
    }

    const phone = normalizePhone(order.shipping_phone) || normalizePhone(order.customer_phone);
    if (!phone) throw fail("The delivery phone number isn't a valid 10-digit mobile number");
    if (!/^\d{6}$/.test(String(order.shipping_pincode).trim())) throw fail("The delivery pincode isn't a valid 6-digit pincode");

    const sellerName = env("EKART_SELLER_NAME");
    const sellerAddress = env("EKART_SELLER_ADDRESS");
    const sellerGstin = env("EKART_SELLER_GSTIN");
    if (!sellerName || !sellerAddress) throw fail("Set EKART_SELLER_NAME and EKART_SELLER_ADDRESS in the backend .env");

    const [items] = await db.query("SELECT product_name, variant_name, quantity FROM order_items WHERE order_id = ?", [order.id]);
    const quantity = items.reduce((sum, item) => sum + item.quantity, 0) || 1;
    const productsDesc = items.map((item) => `${item.product_name} (${item.variant_name}) x${item.quantity}`).join(", ").slice(0, 250);

    // Our prices include GST, so split the order total into taxable value + tax at the configured rate.
    const total = round2(order.total_amount);
    const gstRate = Math.max(Number(env("EKART_GST_RATE", "0")) || 0, 0);
    const taxable = round2(total / (1 + gstRate / 100));
    const tax = round2(total - taxable);
    const intraState = sameState(env("EKART_PICKUP_STATE"), order.shipping_state);

    const payload = {
        seller_name: sellerName,
        seller_address: sellerAddress,
        seller_gst_tin: sellerGstin,
        seller_gst_amount: intraState ? round2(tax / 2) : 0,
        consignee_gst_amount: intraState ? round2(tax - round2(tax / 2)) : 0,
        integrated_gst_amount: intraState ? 0 : tax,
        order_number: order.order_number,
        invoice_number: order.order_number,
        invoice_date: new Date(order.created_at).toISOString().slice(0, 10),
        consignee_name: order.shipping_name,
        consignee_alternate_phone: phone,
        products_desc: productsDesc,
        payment_mode: "Prepaid",
        category_of_goods: env("EKART_CATEGORY_OF_GOODS", "Food Products"),
        ...(env("EKART_HSN_CODE") ? { hsn_code: env("EKART_HSN_CODE") } : {}),
        total_amount: total,
        tax_value: tax,
        taxable_amount: taxable,
        commodity_value: String(taxable),
        cod_amount: 0,
        quantity,
        weight: pkg.weight_g,
        length: pkg.length_cm,
        width: pkg.width_cm,
        height: pkg.height_cm,
        drop_location: {
            location_type: "Home",
            name: order.shipping_name,
            address: [order.shipping_address_line1, order.shipping_address_line2, order.shipping_landmark].filter(Boolean).join(", "),
            city: order.shipping_city,
            state: order.shipping_state,
            country: "India",
            phone: Number(phone),
            pin: Number(order.shipping_pincode),
        },
        ...(pickupLocation() ? { pickup_location: pickupLocation() } : {}),
        ...(returnLocation() ? { return_location: returnLocation() } : {}),
        ...(preferredDispatchDate ? { preferred_dispatch_date: preferredDispatchDate } : {}),
    };

    // What Ekart will bill for it — shown to the admin, never blocks booking.
    let charge = 0;
    try {
        const estimate = await estimateCharge({ dropPincode: order.shipping_pincode, pkg, invoiceAmount: total });
        charge = estimate?.total ?? 0;
    } catch (error) {
        console.warn(`Ekart estimate for ${order.order_number} failed: ${error.message}`);
    }

    const created = await ekart.createShipment(payload);
    const trackingId = created.tracking_id;

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [result] = await conn.query(
            `INSERT INTO shipments (order_id, provider, provider_order_id, shipment_id, awb_number, tracking_url, courier_name,
                                    package_weight, length_cm, width_cm, height_cm, shipping_charge, shipment_status, provider_status, last_synced_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'created', 'Order Placed', NOW())`,
            [
                order.id,
                PROVIDER,
                created.barcodes?.order || order.order_number,
                created.barcodes?.wbn || null,
                trackingId,
                ekart.trackingUrl(trackingId),
                created.vendor || "Ekart",
                pkg.weight_g / 1000,
                pkg.length_cm,
                pkg.width_cm,
                pkg.height_cm,
                charge,
            ]
        );
        await conn.query(
            "INSERT INTO shipment_tracking (shipment_id, status, status_code, message, event_time) VALUES (?, 'created', 'Order Placed', ?, NOW())",
            [result.insertId, `Shipment booked with Ekart (${trackingId})`]
        );
        await conn.query(
            `UPDATE orders
             SET order_status = IF(order_status = 'confirmed', 'processing', order_status),
                 fulfillment_status = IF(fulfillment_status = 'unfulfilled', 'processing', fulfillment_status)
             WHERE id = ?`,
            [order.id]
        );
        await conn.commit();
        return { id: result.insertId, tracking_id: trackingId, courier_name: created.vendor || "Ekart", shipping_charge: charge };
    } catch (error) {
        await conn.rollback();
        // The parcel exists at Ekart but not here — log everything needed to fix it by hand.
        console.error(`Ekart shipment ${trackingId} created for ${order.order_number} but saving it failed:`, error);
        throw error;
    } finally {
        conn.release();
    }
}

// ------------------------------------------------------------------ tracking → our statuses

function toDate(ms) {
    const value = Number(ms);
    return Number.isFinite(value) && value > 0 ? new Date(value) : null;
}

function clip(value, max) {
    return value === undefined || value === null || value === "" ? null : String(value).slice(0, max);
}

/**
 * Applies an Ekart track object ({ track: {...}, edd }) to one of our shipments: stores new
 * scan events, updates the shipment's status/NDR/EDD, and moves the order along (shipped / delivered).
 * Runs in one transaction with the shipment row locked, so a webhook and a sync can't interleave.
 */
export async function applyTracking(shipmentId, trackObj) {
    const track = trackObj?.track;
    if (!track?.status) return null;

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [rows] = await conn.query(
            "SELECT id, order_id, shipment_status, shipped_at, delivered_at FROM shipments WHERE id = ? FOR UPDATE",
            [shipmentId]
        );
        const shipment = rows[0];
        if (!shipment) {
            await conn.rollback();
            return null;
        }

        const events = (Array.isArray(track.details) && track.details.length > 0 ? track.details : [track])
            .map((event) => ({
                status: mapStatus(event.status) ?? shipment.shipment_status,
                code: clip(event.status, 32),
                location: clip(event.location, 128),
                message: clip(event.desc || event.ndrStatus, 255),
                time: toDate(event.ctime),
            }))
            .filter((event) => event.time && event.code);

        if (events.length > 0) {
            const [existing] = await conn.query("SELECT status_code, event_time FROM shipment_tracking WHERE shipment_id = ?", [shipment.id]);
            const seen = new Set(existing.map((row) => `${row.status_code}|${Math.floor(new Date(row.event_time).getTime() / 1000)}`));
            const fresh = events.filter((event) => !seen.has(`${event.code}|${Math.floor(event.time.getTime() / 1000)}`));
            if (fresh.length > 0) {
                await conn.query(
                    "INSERT INTO shipment_tracking (shipment_id, status, status_code, location, message, event_time) VALUES ?",
                    [fresh.map((event) => [shipment.id, event.status, event.code, event.location, event.message, event.time])]
                );
            }
        }

        const status = mapStatus(track.status) ?? shipment.shipment_status;
        const lastEventTime = toDate(track.ctime) ?? new Date();
        const shippedAt = HANDED_TO_COURIER.includes(status) && !shipment.shipped_at ? toDate(track.pickupTime) ?? lastEventTime : null;
        const deliveredAt = status === "delivered" && !shipment.delivered_at ? lastEventTime : null;

        await conn.query(
            `UPDATE shipments
             SET shipment_status = ?, provider_status = ?, ndr_status = ?, ndr_actions = ?,
                 expected_delivery_at = COALESCE(?, expected_delivery_at),
                 shipped_at = COALESCE(shipped_at, ?), delivered_at = COALESCE(delivered_at, ?),
                 cancelled_at = IF(? = 'cancelled', COALESCE(cancelled_at, NOW()), cancelled_at),
                 last_synced_at = NOW()
             WHERE id = ?`,
            [
                status,
                clip(track.status, 64),
                status === "ndr" ? clip(track.ndrStatus, 64) : null,
                status === "ndr" && Array.isArray(track.ndrActions) ? clip(track.ndrActions.join(","), 64) : null,
                toDate(trackObj.edd),
                shippedAt,
                deliveredAt,
                status,
                shipment.id,
            ]
        );

        if (HANDED_TO_COURIER.includes(status) && status !== "delivered") {
            await conn.query(
                `UPDATE orders SET order_status = 'shipped', fulfillment_status = 'fulfilled'
                 WHERE id = ? AND order_status IN ('confirmed', 'processing')`,
                [shipment.order_id]
            );
        } else if (status === "delivered") {
            await conn.query(
                `UPDATE orders SET order_status = 'delivered', fulfillment_status = 'fulfilled'
                 WHERE id = ? AND order_status IN ('confirmed', 'processing', 'shipped')`,
                [shipment.order_id]
            );
        } else if (status === "cancelled") {
            // The booking is gone; the order goes back to waiting for a (new) shipment.
            await conn.query(
                "UPDATE orders SET fulfillment_status = 'unfulfilled' WHERE id = ? AND order_status IN ('confirmed', 'processing')",
                [shipment.order_id]
            );
        }

        await conn.commit();
        return { status, provider_status: track.status };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

/** Fetches the latest tracking from Ekart for one of our shipments and applies it. */
export async function syncShipment(shipment) {
    const trackObj = await ekart.track(shipment.awb_number);
    return applyTracking(shipment.id, trackObj);
}

let syncRunning = false;

/** Periodic safety net for missed webhooks: re-syncs every open Ekart shipment not synced recently. */
export async function syncOpenShipments({ staleMinutes = 60, limit = 200 } = {}) {
    if (syncRunning || !ekart.isConfigured()) return { synced: 0, failed: 0 };
    syncRunning = true;
    let synced = 0;
    let failed = 0;
    try {
        const [rows] = await db.query(
            `SELECT id, awb_number FROM shipments
             WHERE provider = ? AND is_delete = 0 AND awb_number IS NOT NULL
               AND shipment_status NOT IN (${FINAL_STATUSES.map(() => "?").join(",")})
               AND (last_synced_at IS NULL OR last_synced_at < NOW() - INTERVAL ? MINUTE)
             ORDER BY last_synced_at IS NULL DESC, last_synced_at ASC
             LIMIT ?`,
            [PROVIDER, ...FINAL_STATUSES, staleMinutes, limit]
        );
        for (const shipment of rows) {
            try {
                await syncShipment(shipment);
                synced += 1;
            } catch (error) {
                failed += 1;
                console.warn(`Ekart sync for shipment ${shipment.id} (${shipment.awb_number}) failed: ${error.message}`);
            }
        }
    } finally {
        syncRunning = false;
    }
    return { synced, failed };
}
