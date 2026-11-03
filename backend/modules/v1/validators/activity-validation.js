// What the storefront may send to POST /activity/event. Anyone holding the public API key can call it,
// so everything is limited to known event types and clipped to the column sizes.

export const EVENT_TYPES = [
    "page_view",
    "view_product",
    "search",
    "add_to_cart",
    "remove_from_cart",
    "add_to_wishlist",
    "begin_checkout",
    "order_placed",
    "payment_started",
    "payment_cancelled",
    "purchase",
    "login",
    "signup",
];

/** These carry an order number, and only count once it's checked against the signed-in customer's orders. */
export const ORDER_EVENT_TYPES = ["order_placed", "payment_started", "payment_cancelled", "purchase"];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(value, max) {
    if (value === undefined || value === null) return null;
    const clean = String(value).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
    return clean ? clean.slice(0, max) : null;
}

function amount(value, max) {
    if (value === undefined || value === null || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 && number <= max ? number : null;
}

/** Returns { error } or { value: { session_key, visitor_key, context, event } } with every field cleaned. */
export function validateActivityEvent(body = {}) {
    const { session_key, visitor_key } = body;
    const context = body.context ?? {};
    const event = body.event ?? {};
    if (!UUID.test(String(session_key)) || !UUID.test(String(visitor_key))) return { error: "Invalid visitor" };
    if (!EVENT_TYPES.includes(event.type)) return { error: "Unknown event type" };

    const path = text(event.path, 255);
    const landingPath = text(context.landing_path, 255);
    const orderNumber = text(event.order_number, 32);
    if (ORDER_EVENT_TYPES.includes(event.type) && !orderNumber) return { error: "Order number is required" };

    return {
        value: {
            session_key: String(session_key).toLowerCase(),
            visitor_key: String(visitor_key).toLowerCase(),
            context: {
                referrer: text(context.referrer, 255),
                landing_path: landingPath?.startsWith("/") ? landingPath : null,
                utm_source: text(context.utm_source, 64),
                utm_medium: text(context.utm_medium, 64),
                utm_campaign: text(context.utm_campaign, 128),
                utm_content: text(context.utm_content, 128),
                utm_term: text(context.utm_term, 128),
                click_id: ["gclid", "fbclid", "msclkid"].includes(context.click_id) ? context.click_id : null,
            },
            event: {
                type: event.type,
                path: path?.startsWith("/") ? path : null,
                label: text(event.label, 191),
                product_slug: text(event.product_slug, 191),
                variant: text(event.variant, 64),
                quantity: amount(event.quantity, 100000),
                value: amount(event.value, 100000000),
                order_number: orderNumber,
            },
        },
    };
}
