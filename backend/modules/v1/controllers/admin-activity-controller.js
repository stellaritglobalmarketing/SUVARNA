import db from "../../../config/db.js";
import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const LIVE_MINUTES = 5;
const MAX_TIMELINE_EVENTS = 500;
const RANGE_HOURS = { "24h": 24, "7d": 7 * 24, "30d": 30 * 24, "90d": 90 * 24 };
const DEFAULT_RANGE = "7d";

function isPositiveInt(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0;
}

const rangeHours = (range) => RANGE_HOURS[range] ?? RANGE_HOURS[DEFAULT_RANGE];
const serverError = (res) => middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);

// Same rule as the admin dashboard's revenue.
const IS_PAID_ORDER = "o.payment_status = 'paid' AND o.order_status <> 'cancelled'";
const STARTED_IN_RANGE = "s.started_at >= NOW() - INTERVAL ? HOUR";
const TOP_PRODUCTS = 10;

/**
 * The most viewed products with what came of those views: how many visitors, how many of the visits that viewed
 * the product also added it to the cart, what the visits sold, and which source sent the most viewers.
 */
async function getTopProducts(hours) {
    const [rows] = await db.query(
        `SELECT t.slug, MAX(t.label) AS label, SUM(t.view_count) AS views, COUNT(DISTINCT IF(t.viewed, t.visitor_key, NULL)) AS visitors,
                SUM(t.add_count) AS added_to_cart, SUM(t.viewed) AS viewed_visits, SUM(t.viewed AND t.added) AS viewed_and_added_visits,
                MAX(t.last_viewed_at) AS last_viewed_at
         FROM (
             SELECT e.product_slug AS slug, e.session_id, s.visitor_key, MAX(e.label) AS label,
                    SUM(e.event_type = 'view_product') AS view_count, SUM(e.event_type = 'add_to_cart') AS add_count,
                    MAX(e.event_type = 'view_product') AS viewed, MAX(e.event_type = 'add_to_cart') AS added,
                    MAX(IF(e.event_type = 'view_product', e.created_at, NULL)) AS last_viewed_at
             FROM visitor_events e JOIN visitor_sessions s ON s.id = e.session_id
             WHERE ${STARTED_IN_RANGE} AND e.event_type IN ('view_product', 'add_to_cart') AND e.product_slug IS NOT NULL
             GROUP BY e.product_slug, e.session_id, s.visitor_key
         ) t
         GROUP BY t.slug
         ORDER BY views DESC, added_to_cart DESC
         LIMIT ?`,
        [hours, TOP_PRODUCTS]
    );
    if (rows.length === 0) return [];

    const slugs = rows.map((row) => row.slug);
    const [[catalog], [sales], [sources]] = await Promise.all([
        db.query(
            `SELECT p.slug, p.name,
                    (SELECT i.image_url FROM product_images i
                     WHERE i.product_id = p.id AND i.media_type = 'image' AND i.is_active = 1 AND i.is_delete = 0
                     ORDER BY i.is_primary DESC, i.sort_order ASC, i.id ASC LIMIT 1) AS image_url
             FROM products p WHERE p.slug IN (?)`,
            [slugs]
        ),
        db.query(
            `SELECT p.slug, SUM(oi.quantity) AS units_sold, SUM(oi.total_price) AS revenue
             FROM visitor_sessions s
             JOIN visitor_events e ON e.session_id = s.id AND e.event_type = 'order_placed'
             JOIN orders o ON o.order_number = e.order_number AND o.is_delete = 0 AND ${IS_PAID_ORDER}
             JOIN order_items oi ON oi.order_id = o.id
             JOIN products p ON p.id = oi.product_id
             WHERE ${STARTED_IN_RANGE} AND p.slug IN (?)
             GROUP BY p.slug`,
            [hours, slugs]
        ),
        db.query(
            `SELECT e.product_slug AS slug, s.source, COUNT(DISTINCT e.session_id) AS visits
             FROM visitor_events e JOIN visitor_sessions s ON s.id = e.session_id
             WHERE ${STARTED_IN_RANGE} AND e.event_type = 'view_product' AND e.product_slug IN (?)
             GROUP BY e.product_slug, s.source
             ORDER BY visits DESC`,
            [hours, slugs]
        ),
    ]);

    return rows.map((row) => {
        const product = catalog.find((item) => item.slug === row.slug);
        const sold = sales.find((item) => item.slug === row.slug);
        const viewedVisits = Number(row.viewed_visits);
        return {
            slug: row.slug,
            name: product?.name ?? row.label,
            image_url: product?.image_url ?? null,
            views: Number(row.views),
            visitors: Number(row.visitors),
            added_to_cart: Number(row.added_to_cart),
            add_to_cart_rate: viewedVisits > 0 ? Math.round((Number(row.viewed_and_added_visits) / viewedVisits) * 100) : null,
            units_sold: Number(sold?.units_sold ?? 0),
            revenue: Number(sold?.revenue ?? 0),
            top_source: sources.find((item) => item.slug === row.slug)?.source ?? null,
            last_viewed_at: row.last_viewed_at,
        };
    });
}

/**
 * GET /admin/activity/summary — totals for the User Activity page. Query: range (24h | 7d | 30d | 90d).
 * Orders count towards the visit they were placed in, and paid/revenue come from the orders table, so a
 * payment confirmed later (by the Razorpay webhook, or with the customer gone) still counts.
 */
const getActivitySummary = async (req, res) => {
    try {
        const hours = rangeHours(req.query.range);
        const since = STARTED_IN_RANGE;

        const [[[totals]], [[{ live_now }]], [sources], [orderRows], [steps], top_products] = await Promise.all([
            db.query(`SELECT COUNT(*) AS visits, COUNT(DISTINCT s.visitor_key) AS visitors FROM visitor_sessions s WHERE ${since}`, [hours]),
            db.query("SELECT COUNT(*) AS live_now FROM visitor_sessions WHERE last_seen_at >= NOW() - INTERVAL ? MINUTE", [LIVE_MINUTES]),
            db.query(
                `SELECT s.source, s.medium, COUNT(*) AS visits, COUNT(DISTINCT s.visitor_key) AS visitors
                 FROM visitor_sessions s WHERE ${since}
                 GROUP BY s.source, s.medium ORDER BY visits DESC`,
                [hours]
            ),
            db.query(
                `SELECT s.source, s.medium, COUNT(*) AS orders, SUM(${IS_PAID_ORDER}) AS paid_orders,
                        SUM(IF(${IS_PAID_ORDER}, o.total_amount, 0)) AS revenue
                 FROM visitor_sessions s
                 JOIN visitor_events e ON e.session_id = s.id AND e.event_type = 'order_placed'
                 JOIN orders o ON o.order_number = e.order_number AND o.is_delete = 0
                 WHERE ${since}
                 GROUP BY s.source, s.medium`,
                [hours]
            ),
            db.query(
                `SELECT e.event_type, COUNT(DISTINCT e.session_id) AS visits
                 FROM visitor_events e JOIN visitor_sessions s ON s.id = e.session_id
                 WHERE ${since} AND e.event_type IN ('view_product', 'add_to_cart', 'begin_checkout', 'order_placed')
                 GROUP BY e.event_type`,
                [hours]
            ),
            getTopProducts(hours),
        ]);

        const ordersFor = (source, medium) => orderRows.find((row) => row.source === source && row.medium === medium);
        const stepVisits = (type) => Number(steps.find((row) => row.event_type === type)?.visits ?? 0);
        const paidOrders = orderRows.reduce((sum, row) => sum + Number(row.paid_orders), 0);

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Activity summary fetched successfully", {
            live_now: Number(live_now),
            visits: Number(totals.visits),
            visitors: Number(totals.visitors),
            orders: orderRows.reduce((sum, row) => sum + Number(row.orders), 0),
            paid_orders: paidOrders,
            revenue: orderRows.reduce((sum, row) => sum + Number(row.revenue), 0),
            funnel: [
                { step: "Visited the store", visits: Number(totals.visits) },
                { step: "Viewed a product", visits: stepVisits("view_product") },
                { step: "Added to cart", visits: stepVisits("add_to_cart") },
                { step: "Started checkout", visits: stepVisits("begin_checkout") },
                { step: "Placed an order", visits: stepVisits("order_placed") },
                { step: "Paid", visits: paidOrders },
            ],
            sources: sources.map((row) => {
                const orders = ordersFor(row.source, row.medium);
                return {
                    source: row.source,
                    medium: row.medium,
                    visits: Number(row.visits),
                    visitors: Number(row.visitors),
                    orders: Number(orders?.orders ?? 0),
                    paid_orders: Number(orders?.paid_orders ?? 0),
                    revenue: Number(orders?.revenue ?? 0),
                };
            }),
            top_products,
        });
    } catch (error) {
        console.error("Admin activity summary error: ", error);
        return serverError(res);
    }
};

/**
 * GET /admin/activity/session — visits, latest activity first. Query: range, source, search (customer
 * name/phone, campaign or order number), status (live | ordered), page, limit.
 */
const getActivitySessions = async (req, res) => {
    try {
        const page = isPositiveInt(req.query.page) ? Number(req.query.page) : 1;
        const limit = isPositiveInt(req.query.limit) ? Math.min(Number(req.query.limit), MAX_LIMIT) : DEFAULT_LIMIT;

        const conditions = [];
        const params = [];
        if (req.query.status === "live") {
            conditions.push("s.last_seen_at >= NOW() - INTERVAL ? MINUTE");
            params.push(LIVE_MINUTES);
        } else {
            conditions.push("s.started_at >= NOW() - INTERVAL ? HOUR");
            params.push(rangeHours(req.query.range));
        }
        if (req.query.status === "ordered") {
            conditions.push("EXISTS (SELECT 1 FROM visitor_events e WHERE e.session_id = s.id AND e.event_type = 'order_placed')");
        }
        if (req.query.source) {
            conditions.push("s.source = ?");
            params.push(String(req.query.source));
        }
        if (req.query.search) {
            const like = `%${String(req.query.search).trim()}%`;
            conditions.push("(u.name LIKE ? OR u.phone LIKE ? OR s.campaign LIKE ? OR EXISTS (SELECT 1 FROM visitor_events e WHERE e.session_id = s.id AND e.order_number LIKE ?))");
            params.push(like, like, like, like);
        }
        const where = conditions.join(" AND ");
        const from = "FROM visitor_sessions s LEFT JOIN users u ON u.id = s.user_id";

        const [[[{ total }]], [rows]] = await Promise.all([
            db.query(`SELECT COUNT(*) AS total ${from} WHERE ${where}`, params),
            db.query(
                `SELECT s.id, s.source, s.medium, s.campaign, s.landing_path, s.device_type, s.browser, s.os, s.page_views, s.event_count,
                        s.last_event_type, s.last_event_label, s.started_at, s.last_seen_at,
                        s.last_seen_at >= NOW() - INTERVAL ? MINUTE AS is_live,
                        u.id AS user_id, u.name AS user_name, u.phone AS user_phone
                 ${from}
                 WHERE ${where}
                 ORDER BY s.last_seen_at DESC, s.id DESC
                 LIMIT ? OFFSET ?`,
                [LIVE_MINUTES, ...params, limit, (page - 1) * limit]
            ),
        ]);

        const ids = rows.map((row) => row.id);
        const [orderRows] = ids.length
            ? await db.query(
                  `SELECT e.session_id, o.order_number, o.payment_status
                   FROM visitor_events e JOIN orders o ON o.order_number = e.order_number AND o.is_delete = 0
                   WHERE e.event_type = 'order_placed' AND e.session_id IN (?)`,
                  [ids]
              )
            : [[]];

        return middleware.sendResponse(
            res,
            Codes.SUCCESS,
            Codes.RESPONSE_SUCCESS,
            "Activity fetched successfully",
            rows.map(({ user_id, user_name, user_phone, is_live, ...row }) => ({
                ...row,
                is_live: Boolean(is_live),
                customer: user_id ? { id: user_id, name: user_name, phone: user_phone } : null,
                orders: orderRows
                    .filter((order) => order.session_id === row.id)
                    .map(({ order_number, payment_status }) => ({ order_number, payment_status })),
            })),
            { current_page: page, per_page: limit, total, total_pages: total > 0 ? Math.ceil(total / limit) : 0 }
        );
    } catch (error) {
        console.error("Admin activity sessions error: ", error);
        return serverError(res);
    }
};

/** GET /admin/activity/session/:id — one visit with everything the visitor did, oldest first, and their other visits. */
const getActivitySessionById = async (req, res) => {
    try {
        const { id } = req.params;
        const notFound = () => middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Visit not found", null);
        if (!isPositiveInt(id)) return notFound();

        const [sessions] = await db.query(
            `SELECT s.*, s.last_seen_at >= NOW() - INTERVAL ? MINUTE AS is_live, u.name AS user_name, u.phone AS user_phone
             FROM visitor_sessions s LEFT JOIN users u ON u.id = s.user_id
             WHERE s.id = ? LIMIT 1`,
            [LIVE_MINUTES, id]
        );
        const session = sessions[0];
        if (!session) return notFound();

        const [[events], [otherVisits]] = await Promise.all([
            db.query(
                `SELECT e.id, e.event_type, e.path, e.label, e.product_slug, e.variant, e.quantity, e.value, e.order_number, e.created_at,
                        o.payment_status, o.order_status
                 FROM visitor_events e LEFT JOIN orders o ON o.order_number = e.order_number AND o.is_delete = 0
                 WHERE e.session_id = ?
                 ORDER BY e.id ASC
                 LIMIT ?`,
                [id, MAX_TIMELINE_EVENTS]
            ),
            db.query(
                `SELECT id, source, medium, page_views, started_at FROM visitor_sessions
                 WHERE visitor_key = ? AND id <> ? ORDER BY started_at DESC LIMIT 10`,
                [session.visitor_key, id]
            ),
        ]);

        const { session_key: _sessionKey, visitor_key: _visitorKey, user_id, user_name, user_phone, is_live, ...details } = session;
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Visit fetched successfully", {
            ...details,
            is_live: Boolean(is_live),
            customer: user_id ? { id: user_id, name: user_name, phone: user_phone } : null,
            events: events.map((event) => ({ ...event, value: event.value === null ? null : Number(event.value) })),
            other_visits: otherVisits,
        });
    } catch (error) {
        console.error("Admin activity session error: ", error);
        return serverError(res);
    }
};

export { getActivitySummary, getActivitySessions, getActivitySessionById };
