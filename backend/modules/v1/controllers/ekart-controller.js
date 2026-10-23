import crypto from "node:crypto";
import db from "../../../config/db.js";
import ekart from "../../../config/ekart.js";
import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";
import { isValidOrderNumber } from "../validators/admin-order-validation.js";
import { isPositiveInt } from "../validators/admin-shipping-validation.js";
import { isPincode, parseAddressBody, parseIdList, parseNdrBody, parsePackage, validatePreferredDispatchDate } from "../validators/ekart-validation.js";
import {
    FINAL_STATUSES,
    PROVIDER,
    applyTracking,
    checkServiceability,
    createShipmentForOrder,
    estimateCharge,
    getPickup,
    mapStatus,
    setPickup,
    suggestPackage,
    syncShipment,
} from "../services/ekart-shipping.js";
import { getEkartSettings, getWebhookSecret, getWebhookUrl, saveEkartSettings, validateEkartSettings } from "../services/ekart-settings.js";

const NOT_CONFIGURED = "Ekart isn't set up yet — add the EKART_* credentials to the backend .env";
const WEBHOOK_TOPICS = ["track_updated", "shipment_created", "shipment_recreated"];

function sendError(res, error, context) {
    if (error.userMessage) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, error.userMessage, null);
    }
    // Ekart rejected the request (bad address, pincode, …): its reason is what the admin needs to see.
    if (error.ekart !== undefined || /^Ekart:/.test(error.message)) {
        console.warn(`${context}: ${error.message}`, error.ekart ?? "");
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, error.message, null);
    }
    console.error(`${context}: `, error);
    return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
}

async function findEkartShipment(id) {
    const [rows] = await db.query(
        `SELECT s.id, s.order_id, s.awb_number, s.shipment_status, s.provider, o.order_number
         FROM shipments s JOIN orders o ON o.id = s.order_id
         WHERE s.id = ? AND s.is_delete = 0 LIMIT 1`,
        [id]
    );
    const shipment = rows[0];
    return shipment && shipment.provider === PROVIDER && shipment.awb_number ? shipment : null;
}

// ------------------------------------------------------------------ storefront

/** GET /shipping/serviceability/:pincode — delivery check on the product page and at checkout. */
const getServiceability = async (req, res) => {
    const pincode = String(req.params.pincode || "").trim();
    if (!isPincode(pincode)) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "Enter a valid 6-digit pincode", null);
    }
    if (!ekart.isConfigured()) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, "Delivery check isn't available right now", null);
    }
    try {
        const result = await checkServiceability(pincode);
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, result.serviceable ? "Delivery available" : "Not serviceable", result);
    } catch (error) {
        console.warn(`Ekart serviceability for ${pincode} failed: ${error.message}`);
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, "Couldn't check this pincode right now. Please try again.", null);
    }
};

// ------------------------------------------------------------------ admin: booking

/**
 * GET /admin/order/:orderNumber/ekart/quote — suggested package, serviceability of the delivery pincode
 * and Ekart's charge estimate. Pass weight_g/length_cm/width_cm/height_cm to quote a different package.
 */
const getEkartQuote = async (req, res) => {
    const { orderNumber } = req.params;
    if (!isValidOrderNumber(orderNumber)) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Order not found", null);
    }
    try {
        const [rows] = await db.query("SELECT id, shipping_pincode, total_amount FROM orders WHERE order_number = ? AND is_delete = 0 LIMIT 1", [
            orderNumber.trim(),
        ]);
        const order = rows[0];
        if (!order) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Order not found", null);
        }

        const suggested = await suggestPackage(order.id);
        const custom = req.query.weight_g !== undefined ? parsePackage(req.query) : null;
        if (custom?.error) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, custom.error, null);
        }
        const pkg = custom?.pkg ?? suggested;

        if (!ekart.isConfigured()) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, NOT_CONFIGURED, {
                configured: false,
                package: pkg,
                serviceability: null,
                estimate: null,
            });
        }

        const [serviceability, estimate] = await Promise.all([
            checkServiceability(String(order.shipping_pincode).trim()).catch((error) => ({ error: error.message })),
            estimateCharge({ dropPincode: order.shipping_pincode, pkg, invoiceAmount: order.total_amount }).catch((error) => ({ error: error.message })),
        ]);

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Quote fetched", {
            configured: true,
            package: pkg,
            serviceability,
            estimate,
        });
    } catch (error) {
        return sendError(res, error, "Ekart quote error");
    }
};

/** POST /admin/order/:orderNumber/ekart/shipment — books the parcel with Ekart (AWB, label, tracking). */
const createEkartShipment = async (req, res) => {
    const { orderNumber } = req.params;
    if (!isValidOrderNumber(orderNumber)) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Order not found", null);
    }
    if (!ekart.isConfigured()) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, NOT_CONFIGURED, null);
    }
    const { error, pkg } = parsePackage(req.body);
    const dateError = validatePreferredDispatchDate(req.body?.preferred_dispatch_date);
    if (error || dateError) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error || dateError, null);
    }
    try {
        const shipment = await createShipmentForOrder(orderNumber.trim(), pkg, {
            preferredDispatchDate: req.body?.preferred_dispatch_date || undefined,
        });
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, `Shipment booked with Ekart — AWB ${shipment.tracking_id}`, shipment);
    } catch (err) {
        return sendError(res, err, "Ekart create shipment error");
    }
};

// ------------------------------------------------------------------ admin: shipment actions

/** POST /admin/shipment/:id/sync — pulls the latest tracking from Ekart now. */
const syncEkartShipment = async (req, res) => {
    if (!isPositiveInt(req.params.id)) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Shipment not found", null);
    }
    try {
        const shipment = await findEkartShipment(req.params.id);
        if (!shipment) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Ekart shipment not found", null);
        }
        const result = await syncShipment(shipment);
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Tracking updated", result ?? { status: shipment.shipment_status });
    } catch (error) {
        return sendError(res, error, "Ekart sync error");
    }
};

/** POST /admin/shipment/:id/cancel — cancels the booking at Ekart (only before pickup). */
const cancelEkartShipment = async (req, res) => {
    if (!isPositiveInt(req.params.id)) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Shipment not found", null);
    }
    try {
        const shipment = await findEkartShipment(req.params.id);
        if (!shipment) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Ekart shipment not found", null);
        }
        if (!["created", "pickup_scheduled"].includes(shipment.shipment_status)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, "Only shipments that haven't been picked up yet can be cancelled", null);
        }
        await ekart.cancelShipment(shipment.awb_number);
        await applyTracking(shipment.id, {
            track: { status: "Seller Cancelled", ctime: Date.now(), desc: "Cancelled by admin" },
        });
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Shipment cancelled", { id: shipment.id, shipment_status: "cancelled" });
    } catch (error) {
        return sendError(res, error, "Ekart cancel error");
    }
};

/** GET /admin/shipment/:id/label — the Ekart shipping label PDF, to print and stick on the box. */
const downloadEkartLabel = async (req, res) => {
    if (!isPositiveInt(req.params.id)) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Shipment not found", null);
    }
    try {
        const shipment = await findEkartShipment(req.params.id);
        if (!shipment) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Ekart shipment not found", null);
        }
        const label = await ekart.downloadLabels([shipment.awb_number]);
        if (!label?.buffer) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, "Ekart didn't return a label for this shipment", null);
        }
        res.setHeader("Content-Type", label.contentType.includes("pdf") ? label.contentType : "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="label-${shipment.order_number}.pdf"`);
        return res.status(200).send(label.buffer);
    } catch (error) {
        return sendError(res, error, "Ekart label error");
    }
};

/** POST /admin/shipment/manifest { ids: [shipment ids] } — Ekart pickup manifest for a batch of parcels. */
const generateEkartManifest = async (req, res) => {
    const { error, ids } = parseIdList(req.body?.ids);
    if (error) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
    }
    try {
        const [rows] = await db.query(
            `SELECT id, awb_number FROM shipments
             WHERE id IN (${ids.map(() => "?").join(",")}) AND provider = ? AND is_delete = 0 AND awb_number IS NOT NULL
               AND shipment_status NOT IN (${FINAL_STATUSES.map(() => "?").join(",")})`,
            [...ids, PROVIDER, ...FINAL_STATUSES]
        );
        if (rows.length === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "No open Ekart shipments among these", null);
        }
        const manifest = await ekart.generateManifest(rows.map((row) => row.awb_number));
        await db.query(
            `UPDATE shipments SET manifest_number = ?, manifest_url = ? WHERE id IN (${rows.map(() => "?").join(",")})`,
            [String(manifest?.manifestNumber ?? ""), manifest?.manifestDownloadUrl ?? null, ...rows.map((row) => row.id)]
        );
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Manifest generated", {
            manifest_number: manifest?.manifestNumber ?? null,
            manifest_url: manifest?.manifestDownloadUrl ?? null,
            shipment_ids: rows.map((row) => row.id),
        });
    } catch (err) {
        return sendError(res, err, "Ekart manifest error");
    }
};

/** POST /admin/shipment/:id/ndr — after a failed delivery: re-attempt on a date, or return to origin. */
const ekartNdrAction = async (req, res) => {
    if (!isPositiveInt(req.params.id)) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Shipment not found", null);
    }
    const { error, ndr } = parseNdrBody(req.body);
    if (error) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
    }
    try {
        const shipment = await findEkartShipment(req.params.id);
        if (!shipment) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Ekart shipment not found", null);
        }
        if (shipment.shipment_status !== "ndr") {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, "This shipment has no failed delivery to act on", null);
        }
        await ekart.ndrAction({ ...ndr, wbn: shipment.awb_number });
        await db.query(
            "INSERT INTO shipment_tracking (shipment_id, status, status_code, message, event_time) VALUES (?, 'ndr', 'NDR Action', ?, NOW())",
            [shipment.id, `Admin requested ${ndr.action === "RTO" ? "return to origin" : `re-attempt on ${req.body.date}`}`]
        );
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, ndr.action === "RTO" ? "Return to origin requested" : "Re-attempt requested", {
            id: shipment.id,
            action: ndr.action,
        });
    } catch (err) {
        return sendError(res, err, "Ekart NDR error");
    }
};

// ------------------------------------------------------------------ admin: account setup

function maskUrl(url) {
    return url ? url.replace(/\/webhooks\/ekart\/.+$/, "/webhooks/ekart/••••••") : null;
}

/** GET /admin/shipping/ekart/status — is Ekart configured, and is our webhook registered with it? */
const getEkartStatus = async (_req, res) => {
    const [settings, url, pickup] = await Promise.all([getEkartSettings(), getWebhookUrl(), getPickup()]);
    const status = {
        configured: ekart.isConfigured(),
        mock: ekart.isMock(),
        pickup_pincode: pickup.pincode,
        pickup_alias: pickup.alias,
        seller_details: Boolean(settings.seller_name && settings.seller_address),
        webhook_url: maskUrl(url),
        webhook_registered: false,
        error: null,
    };
    if (status.configured) {
        try {
            const hooks = await ekart.listWebhooks();
            status.webhook_registered = Boolean(url) && Array.isArray(hooks) && hooks.some((hook) => hook.url === url && hook.active !== false);
        } catch (error) {
            status.error = error.message;
        }
    }
    return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Ekart status", status);
};

// ------------------------------------------------------------------ admin: pickup addresses

/** GET /admin/shipping/ekart/addresses — the Ekart account's addresses, and which one is our pickup. */
const listEkartAddresses = async (_req, res) => {
    if (!ekart.isConfigured()) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, NOT_CONFIGURED, null);
    }
    try {
        const [addresses, pickup] = await Promise.all([ekart.listAddresses(), getPickup()]);
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Ekart addresses", {
            addresses: Array.isArray(addresses) ? addresses : [],
            pickup,
        });
    } catch (error) {
        return sendError(res, error, "Ekart address list error");
    }
};

/** POST /admin/shipping/ekart/addresses — registers a new address with Ekart; `make_pickup: true` also selects it. */
const addEkartAddress = async (req, res) => {
    if (!ekart.isConfigured()) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, NOT_CONFIGURED, null);
    }
    const { error, address } = parseAddressBody(req.body);
    if (error) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
    }
    try {
        const created = await ekart.addAddress(address);
        const pickup = req.body?.make_pickup === true ? await setPickup(address) : null;
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Address added to Ekart", { address: created ?? address, pickup });
    } catch (err) {
        return sendError(res, err, "Ekart add address error");
    }
};

/** PUT /admin/shipping/ekart/pickup { alias } — uses that Ekart address for pickups, rates and delivery days. */
const setEkartPickup = async (req, res) => {
    const alias = String(req.body?.alias ?? "").trim();
    if (!alias) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "alias is required", null);
    }
    if (!ekart.isConfigured()) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, NOT_CONFIGURED, null);
    }
    try {
        const addresses = await ekart.listAddresses();
        const address = Array.isArray(addresses) ? addresses.find((a) => a?.alias === alias) : null;
        if (!address) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, `No Ekart address named "${alias}"`, null);
        }
        const pickup = await setPickup(address);
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Pickup address updated", pickup);
    } catch (error) {
        return sendError(res, error, "Ekart set pickup error");
    }
};

// ------------------------------------------------------------------ admin: Ekart settings

/** GET /admin/shipping/ekart/settings — seller, GST, default box, return address and public URL. */
const getEkartSettingsHandler = async (_req, res) => {
    try {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Ekart settings", await getEkartSettings());
    } catch (error) {
        return sendError(res, error, "Ekart settings read error");
    }
};

/** PUT /admin/shipping/ekart/settings — saves the fields sent (partial update). */
const updateEkartSettingsHandler = async (req, res) => {
    const { error, values } = validateEkartSettings(req.body);
    if (error) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
    }
    try {
        const settings = await saveEkartSettings(values);
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Ekart settings saved", settings);
    } catch (err) {
        return sendError(res, err, "Ekart settings save error");
    }
};

/** POST /admin/shipping/ekart/webhook — registers (or re-activates) our tracking webhook with Ekart. */
const registerEkartWebhook = async (_req, res) => {
    if (!ekart.isConfigured()) {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, NOT_CONFIGURED, null);
    }
    try {
        const url = await getWebhookUrl();
        if (!url) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, "Add the backend public URL in Admin → Settings → Ekart shipping first", null);
        }
        const secret = await getWebhookSecret();
        const hooks = await ekart.listWebhooks();
        const existing = Array.isArray(hooks) ? hooks.find((hook) => hook.url === url) : null;
        const body = { url, secret, topics: WEBHOOK_TOPICS, active: true };
        const hook = existing ? await ekart.updateWebhook(existing.id, body) : await ekart.addWebhook(body);
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, existing ? "Webhook updated" : "Webhook registered", {
            id: hook?.id ?? existing?.id ?? null,
            url: maskUrl(url),
            topics: WEBHOOK_TOPICS,
        });
    } catch (error) {
        return sendError(res, error, "Ekart webhook register error");
    }
};

// ------------------------------------------------------------------ webhook (called by Ekart)

async function secretMatches(given) {
    let expected = "";
    try {
        expected = await getWebhookSecret();
    } catch (error) {
        console.error(`Ekart webhook secret unavailable: ${error.message}`);
    }
    if (!expected || typeof given !== "string") return false;
    const a = Buffer.from(given);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function logWebhook(topic, reference, payload) {
    try {
        const [result] = await db.query("INSERT INTO shipping_webhook_events (provider, topic, reference, payload) VALUES (?, ?, ?, ?)", [
            PROVIDER,
            topic,
            reference ? String(reference).slice(0, 128) : null,
            JSON.stringify(payload).slice(0, 60000),
        ]);
        return result.insertId;
    } catch (error) {
        console.warn(`Couldn't log Ekart webhook: ${error.message}`);
        return null;
    }
}

async function markWebhook(eventId, error) {
    if (!eventId) return;
    await db
        .query("UPDATE shipping_webhook_events SET processed = ?, error = ? WHERE id = ?", [error ? 0 : 1, error ? String(error).slice(0, 255) : null, eventId])
        .catch(() => {});
}

async function processWebhook(body) {
    const trackingId = body.id ? String(body.id) : null;

    // shipment_created / shipment_recreated: Ekart (re)assigned the parcel — pick up its new ids.
    if (!body.status && body.channelId !== undefined) {
        const orderNumber = String(body.orderNumber || "");
        const [rows] = await db.query(
            `SELECT id FROM shipments
             WHERE provider = ? AND is_delete = 0 AND shipment_status NOT IN ('cancelled')
               AND (awb_number = ? OR provider_order_id = ? OR ? LIKE CONCAT('%', provider_order_id))
             ORDER BY id DESC LIMIT 1`,
            [PROVIDER, trackingId, orderNumber, orderNumber]
        );
        if (!rows[0] || !trackingId) return "no matching shipment";
        await db.query("UPDATE shipments SET awb_number = ?, shipment_id = COALESCE(?, shipment_id), courier_name = COALESCE(?, courier_name), tracking_url = ? WHERE id = ?", [
            trackingId,
            body.wbn || null,
            body.vendor || null,
            ekart.trackingUrl(trackingId),
            rows[0].id,
        ]);
        await syncShipment({ id: rows[0].id, awb_number: trackingId }).catch(() => {});
        return null;
    }

    // track_updated
    const [rows] = await db.query(
        "SELECT id, awb_number FROM shipments WHERE provider = ? AND is_delete = 0 AND (awb_number = ? OR shipment_id = ?) ORDER BY id DESC LIMIT 1",
        [PROVIDER, trackingId, body.wbn ? String(body.wbn) : null]
    );
    const shipment = rows[0];
    if (!shipment) return "no matching shipment";

    try {
        // Prefer Ekart's full tracking (all scans); fall back to the webhook's own event.
        await syncShipment(shipment);
    } catch {
        await applyTracking(shipment.id, {
            edd: body.edd,
            track: {
                status: body.status,
                ctime: body.ctime,
                desc: body.desc,
                location: body.location,
                pickupTime: body.pickupTime,
                ndrStatus: body.ndrStatus,
                details: [{ status: body.status, ctime: body.ctime, desc: body.desc, location: body.location }],
            },
        });
    }
    return mapStatus(body.status) ? null : `unknown Ekart status "${body.status}"`;
}

/**
 * POST /webhooks/ekart/:secret — Ekart's tracking webhook. The secret in the URL (generated, in store_settings)
 * proves the call comes from the URL we registered. Answers 200 at once so Ekart doesn't retry, then
 * processes the event.
 */
const handleEkartWebhook = async (req, res) => {
    if (!(await secretMatches(req.params.secret))) {
        return res.status(401).json({ ok: false });
    }
    const body = req.body && typeof req.body === "object" ? req.body : {};
    res.status(200).json({ ok: true });

    const topic = body.status ? "track_updated" : body.channelId !== undefined ? "shipment_created" : "unknown";
    const eventId = await logWebhook(topic, body.id, body);
    try {
        const problem = await processWebhook(body);
        await markWebhook(eventId, problem);
    } catch (error) {
        console.error("Ekart webhook processing error: ", error);
        await markWebhook(eventId, error.message);
    }
};

export {
    getServiceability,
    getEkartQuote,
    createEkartShipment,
    syncEkartShipment,
    cancelEkartShipment,
    downloadEkartLabel,
    generateEkartManifest,
    ekartNdrAction,
    getEkartStatus,
    registerEkartWebhook,
    listEkartAddresses,
    addEkartAddress,
    setEkartPickup,
    handleEkartWebhook,
    getEkartSettingsHandler,
    updateEkartSettingsHandler,
};
