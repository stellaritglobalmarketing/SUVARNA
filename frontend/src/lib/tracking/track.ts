import { API_BASE_URL, API_KEY, USE_MOCK_API } from "@/lib/api/config";
import { guestOrderHeaders } from "@/lib/auth/guestOrders";
import { getStoredUser, getToken } from "@/lib/auth/token";

/**
 * One call for everything a visitor does on the store: track() records it for Admin → User Activity
 * and, when a Pixel ID is set in Admin → Settings, sends the matching event to Meta. Tracking must never
 * get in a shopper's way, so failures here are silent. Admins browsing the store aren't tracked.
 */

export type ActivityEventType =
  | "page_view"
  | "view_product"
  | "search"
  | "add_to_cart"
  | "remove_from_cart"
  | "add_to_wishlist"
  | "begin_checkout"
  | "order_placed"
  | "payment_started"
  | "payment_cancelled"
  | "purchase"
  | "login"
  | "signup";

export interface ActivityEventData {
  /** Product name, search text… whatever the admin should read for this event. */
  label?: string;
  product_slug?: string;
  variant?: string;
  quantity?: number;
  value?: number;
  order_number?: string;
}

/** Standard Meta events; the rest of the types are only for User Activity. */
const META_EVENTS: Partial<Record<ActivityEventType, string>> = {
  page_view: "PageView",
  view_product: "ViewContent",
  search: "Search",
  add_to_cart: "AddToCart",
  add_to_wishlist: "AddToWishlist",
  begin_checkout: "InitiateCheckout",
  payment_started: "AddPaymentInfo",
  purchase: "Purchase",
  signup: "CompleteRegistration",
};

const VISITOR_KEY = "suvarna_visitor";
const SESSION_KEY = "suvarna_session";
const PURCHASES_KEY = "suvarna_tracked_purchases";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const REPEAT_WINDOW_MS = 1000;
const MAX_RECENT_EVENTS = 50;
const MAX_REMEMBERED_PURCHASES = 20;

interface VisitContext {
  referrer: string;
  landing_path: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  click_id: string;
}

interface StoredSession {
  key: string;
  lastSeen: number;
  context: VisitContext;
}

function newId(): string {
  // randomUUID only exists on https and localhost; a phone testing over the LAN gets this instead.
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx".replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
}

/** localStorage can throw (blocked site data, private windows); a visit then just isn't remembered across pages. */
function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Nothing to do.
  }
}

function readContext(): VisitContext {
  const params = new URLSearchParams(window.location.search);
  let referrer = document.referrer;
  try {
    if (referrer && new URL(referrer).host === window.location.host) referrer = "";
  } catch {
    referrer = "";
  }
  return {
    referrer,
    landing_path: window.location.pathname,
    utm_source: params.get("utm_source") ?? "",
    utm_medium: params.get("utm_medium") ?? "",
    utm_campaign: params.get("utm_campaign") ?? "",
    utm_content: params.get("utm_content") ?? "",
    utm_term: params.get("utm_term") ?? "",
    click_id: ["gclid", "fbclid", "msclkid"].find((name) => params.has(name)) ?? "",
  };
}

/** Coming back through a new ad or link starts a new visit, so the new source gets the credit. */
function isNewCampaign(context: VisitContext, stored: VisitContext): boolean {
  const tagged = context.utm_source || context.click_id;
  return (
    Boolean(tagged) &&
    (context.utm_source !== stored.utm_source || context.utm_campaign !== stored.utm_campaign || context.click_id !== stored.click_id)
  );
}

/** This browser's id and current visit. A visit ends after 30 minutes without activity. */
function currentVisit(): { visitorKey: string; session: StoredSession } {
  let visitorKey = readStorage(VISITOR_KEY);
  if (!visitorKey) {
    visitorKey = newId();
    writeStorage(VISITOR_KEY, visitorKey);
  }

  const now = Date.now();
  const context = readContext();
  let stored: StoredSession | null = null;
  try {
    stored = JSON.parse(readStorage(SESSION_KEY) ?? "null") as StoredSession | null;
  } catch {
    stored = null;
  }

  const isCurrent = stored && now - stored.lastSeen < SESSION_TIMEOUT_MS && !isNewCampaign(context, stored.context);
  const session: StoredSession = isCurrent && stored ? { ...stored, lastSeen: now } : { key: newId(), lastSeen: now, context };
  writeStorage(SESSION_KEY, JSON.stringify(session));
  return { visitorKey, session };
}

// ---------------------------------------------------------------- Meta Pixel

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue: unknown[]; push: unknown; loaded: boolean; version: string };

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

type MetaCall = [name: string, params: Record<string, unknown>, options?: { eventID: string }];

// Pages can track before ActivityTracker has passed in the Pixel ID; those events wait here.
let pixelState: "waiting" | "on" | "off" = "waiting";
let waitingForPixel: MetaCall[] = [];

function sendToMeta([name, params, options]: MetaCall) {
  window.fbq?.("track", name, params, options);
}

/** Meta's standard base code, so its script loads once and queues calls until it's ready. */
function loadPixel(pixelId: string) {
  if (!window.fbq) {
    const fbq = function (this: unknown) {
      // eslint-disable-next-line prefer-rest-params, prefer-spread -- Meta's script reads the queued `arguments` objects as they are.
      if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments as unknown as unknown[]);
      // eslint-disable-next-line prefer-rest-params
      else fbq.queue.push(arguments);
    } as Fbq;
    fbq.queue = [];
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    window.fbq = fbq;
    window._fbq = fbq;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }
  window.fbq?.("init", pixelId);
}

/** Called once by ActivityTracker. An empty id means the pixel is off. */
export function configurePixel(pixelId: string) {
  if (pixelState !== "waiting") return;
  if (!/^\d{8,20}$/.test(pixelId)) {
    pixelState = "off";
    waitingForPixel = [];
    return;
  }
  loadPixel(pixelId);
  pixelState = "on";
  waitingForPixel.forEach(sendToMeta);
  waitingForPixel = [];
}

function trackMeta(type: ActivityEventType, data: ActivityEventData) {
  const name = META_EVENTS[type];
  if (!name || pixelState === "off") return;

  const params: Record<string, unknown> = {};
  if (data.product_slug) {
    params.content_ids = [data.product_slug];
    params.content_type = "product";
  }
  if (data.label) params[type === "search" ? "search_string" : "content_name"] = data.label;
  if (data.value != null) {
    params.value = data.value;
    params.currency = "INR";
  }
  if (data.quantity != null) params.num_items = data.quantity;
  if (data.order_number) params.order_id = data.order_number;

  const call: MetaCall = type === "purchase" && data.order_number ? [name, params, { eventID: `purchase-${data.order_number}` }] : [name, params];
  if (pixelState === "on") sendToMeta(call);
  else waitingForPixel.push(call);
}

// ---------------------------------------------------------------- tracking

function isAdmin(): boolean {
  return getStoredUser()?.role === "admin";
}

/** Reloading the success page must not report the same sale to Meta twice. */
function isRepeatPurchase(orderNumber: string): boolean {
  let seen: string[] = [];
  try {
    seen = JSON.parse(readStorage(PURCHASES_KEY) ?? "[]") as string[];
  } catch {
    seen = [];
  }
  if (seen.includes(orderNumber)) return true;
  writeStorage(PURCHASES_KEY, JSON.stringify([...seen, orderNumber].slice(-MAX_REMEMBERED_PURCHASES)));
  return false;
}

// React runs every effect on a page twice in development, so the same event again within a second isn't a
// second action. Kept per event because other events run in between (view_product, page_view, view_product…).
const recentEvents = new Map<string, number>();

function isImmediateRepeat(key: string): boolean {
  const now = Date.now();
  const repeat = now - (recentEvents.get(key) ?? 0) < REPEAT_WINDOW_MS;
  if (recentEvents.size >= MAX_RECENT_EVENTS) recentEvents.clear();
  recentEvents.set(key, now);
  return repeat;
}

function sendToServer(type: ActivityEventType, data: ActivityEventData) {
  const { visitorKey, session } = currentVisit();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (API_KEY) headers["api-key"] = API_KEY;
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (data?.order_number) Object.assign(headers, guestOrderHeaders(data.order_number));

  // keepalive lets an event finish sending when the page is being left.
  fetch(`${API_BASE_URL.replace(/\/$/, "")}/activity/event`, {
    method: "POST",
    keepalive: true,
    headers,
    body: JSON.stringify({
      session_key: session.key,
      visitor_key: visitorKey,
      context: session.context,
      event: { type, path: window.location.pathname, ...data },
    }),
  }).catch(() => undefined);
}

export function track(type: ActivityEventType, data: ActivityEventData = {}) {
  if (typeof window === "undefined" || isAdmin()) return;
  if (isImmediateRepeat(`${type}|${window.location.pathname}|${data.product_slug ?? data.label ?? data.order_number ?? ""}`)) return;
  if (type === "purchase" && data.order_number && isRepeatPurchase(data.order_number)) return;

  trackMeta(type, data);
  // A product page's visit is already recorded by its view_product, with the product's name.
  if (USE_MOCK_API || (type === "page_view" && window.location.pathname.startsWith("/products/"))) return;
  sendToServer(type, data);
}
