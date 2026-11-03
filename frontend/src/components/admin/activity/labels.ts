import { humanize } from "@/components/admin/ui";

// Turns the stored source, medium and event types into the words shown on the User Activity pages.

const SOURCE_LABELS: Record<string, string> = {
  google: "Google",
  bing: "Bing",
  yahoo: "Yahoo",
  duckduckgo: "DuckDuckGo",
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  youtube: "YouTube",
  twitter: "X (Twitter)",
  pinterest: "Pinterest",
  linkedin: "LinkedIn",
  direct: "Direct",
};

const MEDIUM_LABELS: Record<string, string> = {
  paid: "Paid ad",
  organic: "Search",
  social: "Social post or link",
  referral: "Link from another site",
  email: "Email",
};

const PAGE_LABELS: Record<string, string> = {
  "/": "Home page",
  "/cart": "Cart",
  "/checkout": "Checkout",
  "/checkout/success": "Order confirmation",
  "/login": "Sign in",
  "/signup": "Sign up",
  "/wishlist": "Wishlist",
  "/orders": "My orders",
  "/profile": "Profile",
  "/addresses": "Addresses",
  "/track-order": "Track order",
  "/help": "Help",
  "/contact": "Contact",
  "/our-story": "Our story",
  "/privacy": "Privacy policy",
  "/terms": "Terms",
  "/refund-policy": "Refund policy",
};

export function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

/** Empty for direct visits, where the source already says it all. */
export function mediumLabel(medium: string): string {
  return MEDIUM_LABELS[medium] ?? "";
}

export function pageLabel(path: string | null): string {
  if (!path) return "a page";
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  if (path.startsWith("/products/")) return humanize(path.slice("/products/".length).replace(/-/g, " "));
  return path;
}

/** Wishlist events only know the product's URL name. */
function productName(label: string | null, slug: string | null): string {
  return label ?? (slug ? humanize(slug.replace(/-/g, " ")) : "a product");
}

/** One plain sentence for what the visitor did. */
export function describeEvent(type: string | null, label: string | null, slug: string | null = null, path: string | null = null): string {
  switch (type) {
    case "page_view":
      return `Opened ${pageLabel(path ?? label)}`;
    case "view_product":
      return `Viewed ${productName(label, slug)}`;
    case "search":
      return `Searched for “${label ?? ""}”`;
    case "add_to_cart":
      return `Added ${productName(label, slug)} to cart`;
    case "remove_from_cart":
      return `Removed ${productName(label, slug)} from cart`;
    case "add_to_wishlist":
      return `Saved ${productName(label, slug)} to wishlist`;
    case "begin_checkout":
      return "Started checkout";
    case "order_placed":
      return "Placed an order";
    case "payment_started":
      return "Opened the payment window";
    case "payment_cancelled":
      return "Closed the payment window without paying";
    case "purchase":
      return "Paid for the order";
    case "login":
      return "Signed in";
    case "signup":
      return "Created an account";
    default:
      return type ? humanize(type) : "—";
  }
}
