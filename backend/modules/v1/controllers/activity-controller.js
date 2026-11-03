import jwt from "jsonwebtoken";
import db from "../../../config/db.js";
import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";
import { ORDER_EVENT_TYPES, validateActivityEvent } from "../validators/activity-validation.js";
import { isBot, recordEvent } from "../services/visitor-activity.js";

const RATE_LIMIT_PER_MINUTE = 300;
const RATE_LIMIT_MAX_IPS = 5000;
const ONCE_PER_ORDER = ["order_placed", "purchase"];

let rateWindowStart = 0;
const requestsByIp = new Map();

/** Anyone holding the public API key can post here, so one address can't fill the table. */
function isRateLimited(ip) {
    const now = Date.now();
    if (now - rateWindowStart >= 60 * 1000 || requestsByIp.size >= RATE_LIMIT_MAX_IPS) {
        rateWindowStart = now;
        requestsByIp.clear();
    }
    const count = (requestsByIp.get(ip) ?? 0) + 1;
    requestsByIp.set(ip, count);
    return count > RATE_LIMIT_PER_MINUTE;
}

/** The signed-in account, if the request carries a valid token. Never rejects: guests are tracked too. */
function optionalUser(req) {
    const token = req.headers.authorization || req.headers.token;
    if (!token) return null;
    try {
        return jwt.verify(String(token).replace("Bearer ", "").trim(), process.env.JWT_WEB_TOKEN);
    } catch {
        return null;
    }
}

const ignored = (res) => middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Ignored", null);

/**
 * POST /activity/event — one thing a visitor did on the store. API key only, so guests can be recorded;
 * an optional token ties the visit to the customer. Admins and bots aren't recorded. Order events must
 * match one of the signed-in customer's own orders, and take their amount from it, not from the browser.
 */
const trackEvent = async (req, res) => {
    try {
        if (isRateLimited(req.ip)) return ignored(res);

        const { error, value } = validateActivityEvent(req.body);
        if (error) return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);

        const userAgent = req.headers["user-agent"];
        const user = optionalUser(req);
        if (isBot(userAgent) || user?.role === "admin") return ignored(res);
        const userId = user?.role === "user" ? user.id : null;

        const { event } = value;
        if (ORDER_EVENT_TYPES.includes(event.type)) {
            if (!userId) return ignored(res);
            const [orders] = await db.query(
                "SELECT total_amount, payment_status FROM orders WHERE order_number = ? AND user_id = ? AND is_delete = 0 LIMIT 1",
                [event.order_number, userId]
            );
            if (orders.length === 0) return ignored(res);
            if (event.type === "purchase" && orders[0].payment_status !== "paid") return ignored(res);
            event.value = Number(orders[0].total_amount);

            if (ONCE_PER_ORDER.includes(event.type)) {
                const [seen] = await db.query("SELECT 1 FROM visitor_events WHERE order_number = ? AND event_type = ? LIMIT 1", [event.order_number, event.type]);
                if (seen.length > 0) return ignored(res);
            }
        }

        await recordEvent({ ...value, userId, userAgent });
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Recorded", null);
    } catch (error) {
        console.error("Track activity error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

export { trackEvent };
