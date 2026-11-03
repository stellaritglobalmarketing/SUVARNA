import db from "../../../config/db.js";

// Where a visit came from, what device it's on, and storing what the visitor does. The admin reports are
// in controllers/admin-activity-controller.js.

const SOURCE_ALIASES = {
    fb: "facebook",
    facebook: "facebook",
    meta: "facebook",
    msg: "facebook", // Meta's {{site_source_name}} for Messenger placements
    an: "facebook", // ...and for Audience Network
    ig: "instagram",
    instagram: "instagram",
    google: "google",
    adwords: "google",
    gads: "google",
    wa: "whatsapp",
    whatsapp: "whatsapp",
    yt: "youtube",
    youtube: "youtube",
};

// Checked against the referrer's host; the first match wins.
const REFERRER_SOURCES = [
    { pattern: /(^|\.)google\.[a-z.]+$/, source: "google", medium: "organic" },
    { pattern: /(^|\.)bing\.com$/, source: "bing", medium: "organic" },
    { pattern: /(^|\.)yahoo\.[a-z.]+$/, source: "yahoo", medium: "organic" },
    { pattern: /(^|\.)duckduckgo\.com$/, source: "duckduckgo", medium: "organic" },
    { pattern: /(^|\.)instagram\.com$/, source: "instagram", medium: "social" },
    { pattern: /(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, source: "facebook", medium: "social" },
    { pattern: /(^|\.)(whatsapp\.com|wa\.me)$/, source: "whatsapp", medium: "social" },
    { pattern: /(^|\.)(youtube\.com|youtu\.be)$/, source: "youtube", medium: "social" },
    { pattern: /(^|\.)(twitter\.com|x\.com|t\.co)$/, source: "twitter", medium: "social" },
    { pattern: /(^|\.)(pinterest\.[a-z.]+|pin\.it)$/, source: "pinterest", medium: "social" },
    { pattern: /(^|\.)linkedin\.com$/, source: "linkedin", medium: "social" },
];

// Coming back from these isn't a new way of finding the store.
const IGNORED_REFERRERS = /(^|\.)(razorpay\.com|ekartlogistics\.in)$/;

const IN_APP_INSTAGRAM = /\bInstagram\b/i;
const IN_APP_FACEBOOK = /\bFB(AN|AV|_IAB|IOS)\b/i;

function referrerHost(referrer) {
    if (!referrer) return null;
    try {
        return new URL(/^https?:\/\//i.test(referrer) ? referrer : `https://${referrer}`).hostname.toLowerCase().replace(/^www\./, "");
    } catch {
        return null;
    }
}

function mediumFromUtm(utmMedium) {
    const medium = String(utmMedium ?? "").toLowerCase();
    if (/(cpc|ppc|cpm|paid|^ads?$|display|retarget|sponsored)/.test(medium)) return "paid";
    if (medium.includes("email") || medium.includes("newsletter")) return "email";
    if (/(social|bio|story|reel|post)/.test(medium)) return "social";
    if (medium.includes("organic")) return "organic";
    if (medium.includes("referral")) return "referral";
    return null;
}

/**
 * Turns campaign tags, click ids, the referrer and the browser into one { source, medium }, most reliable first:
 * tags we wrote ourselves, then ad click ids, then the referrer, then Instagram's/Facebook's in-app browsers
 * (which often send no referrer). fbclid is added to every outbound Facebook/Instagram link, ads or not, so on
 * its own it doesn't mean paid; Meta ads need utm_medium=paid to show as paid.
 */
export function classifySource({ utm_source, utm_medium, click_id, referrer, user_agent } = {}) {
    const ua = String(user_agent ?? "");
    const inAppSource = IN_APP_INSTAGRAM.test(ua) ? "instagram" : IN_APP_FACEBOOK.test(ua) ? "facebook" : null;
    const host = referrerHost(referrer);
    const fromReferrer = host ? REFERRER_SOURCES.find(({ pattern }) => pattern.test(host)) : null;

    if (utm_source) {
        const key = String(utm_source).trim().toLowerCase();
        const source = SOURCE_ALIASES[key] ?? (key.replace(/[^a-z0-9._-]+/g, "_").slice(0, 32) || "other");
        const medium = mediumFromUtm(utm_medium) ?? (click_id === "gclid" ? "paid" : fromReferrer?.medium) ?? (inAppSource ? "social" : "referral");
        return { source, medium };
    }
    if (click_id === "gclid") return { source: "google", medium: "paid" };
    if (click_id === "msclkid") return { source: "bing", medium: "paid" };
    if (click_id === "fbclid") {
        return { source: inAppSource ?? (fromReferrer?.source === "instagram" ? "instagram" : "facebook"), medium: "social" };
    }
    if (fromReferrer) return { source: fromReferrer.source, medium: fromReferrer.medium };
    if (inAppSource) return { source: inAppSource, medium: "social" };
    if (host && !IGNORED_REFERRERS.test(host)) return { source: host.slice(0, 32), medium: "referral" };
    return { source: "direct", medium: "direct" };
}

/** Rough device/browser/OS for the admin list, from the User-Agent. */
export function parseDevice(userAgent) {
    const ua = String(userAgent ?? "");
    const isTablet = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
    const device_type = isTablet ? "tablet" : /Mobi|iPhone|iPod|Android/i.test(ua) ? "mobile" : "desktop";

    let browser = "Other";
    if (IN_APP_INSTAGRAM.test(ua)) browser = "Instagram app";
    else if (IN_APP_FACEBOOK.test(ua)) browser = "Facebook app";
    else if (/SamsungBrowser/i.test(ua)) browser = "Samsung Internet";
    else if (/Edg(e|A|iOS)?\//i.test(ua)) browser = "Edge";
    else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
    else if (/Firefox|FxiOS/i.test(ua)) browser = "Firefox";
    else if (/Chrome|CriOS/i.test(ua)) browser = "Chrome";
    else if (/Safari/i.test(ua)) browser = "Safari";

    let os = "Other";
    if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
    else if (/Android/i.test(ua)) os = "Android";
    else if (/Windows/i.test(ua)) os = "Windows";
    else if (/Mac OS X|Macintosh/i.test(ua)) os = "macOS";
    else if (/Linux/i.test(ua)) os = "Linux";

    return { device_type, browser, os };
}

const BOTS = /bot\b|bot\/|crawl|spider|slurp|headless|lighthouse|pagespeed|facebookexternalhit|preview|monitor|curl|wget|python-requests/i;

export function isBot(userAgent) {
    return !userAgent || BOTS.test(userAgent);
}

/**
 * Stores one event: creates the visit on its first event (source and device are only set then), and keeps
 * the visit's counters and "last action" current. Everything passed in is already validated.
 */
export async function recordEvent({ session_key, visitor_key, context, event, userId, userAgent }) {
    const { source, medium } = classifySource({ ...context, user_agent: userAgent });
    const { device_type, browser, os } = parseDevice(userAgent);
    const isPage = event.type === "page_view" || event.type === "view_product" ? 1 : 0;

    const [session] = await db.query(
        `INSERT INTO visitor_sessions (session_key, visitor_key, user_id, source, medium, campaign, utm_source, utm_medium, utm_content, utm_term,
                                       referrer, landing_path, device_type, browser, os, page_views, event_count, last_event_type, last_event_label)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
         ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), user_id = COALESCE(VALUES(user_id), user_id), last_seen_at = NOW(),
                                 page_views = page_views + VALUES(page_views), event_count = event_count + 1,
                                 last_event_type = VALUES(last_event_type), last_event_label = VALUES(last_event_label)`,
        [
            session_key,
            visitor_key,
            userId,
            source,
            medium,
            context.utm_campaign,
            context.utm_source,
            context.utm_medium,
            context.utm_content,
            context.utm_term,
            context.referrer,
            context.landing_path ?? event.path,
            device_type,
            browser,
            os,
            isPage,
            event.type,
            event.label ?? event.order_number ?? event.path,
        ]
    );

    await db.query(
        `INSERT INTO visitor_events (session_id, event_type, path, label, product_slug, variant, quantity, value, order_number)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [session.insertId, event.type, event.path, event.label, event.product_slug, event.variant, event.quantity, event.value, event.order_number]
    );
}

/** Deletes visits (and, by cascade, their events) older than `days`. Returns how many went. */
export async function purgeOldActivity(days) {
    const [result] = await db.query("DELETE FROM visitor_sessions WHERE started_at < NOW() - INTERVAL ? DAY LIMIT 5000", [days]);
    return result.affectedRows;
}
