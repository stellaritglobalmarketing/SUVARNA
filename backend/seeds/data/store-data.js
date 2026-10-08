// Initial products, home page and product page content, taken verbatim from the storefront's original
// design mock data (frontend/src/lib/data/*.mock.ts and the home section components).
// Consumed by seeds/seed.js.

// Products live in catalog.js (the current product catalogue with prices).
export { PRODUCTS } from "./catalog.js";

const HERO_IMAGE = "https://images.unsplash.com/photo-1769255484646-16988ad5552d?auto=format&fit=crop&w=1800&q=80";

export const BANNERS = [
    {
        placement: "hero",
        eyebrow: "Premium By Nature",
        title: "Saffron, Almonds, Ghee and Honey, Sourced Directly From Farmers",
        subtitle:
            "Suvarna7 sources Mamra almonds, Mongra saffron, ghee, honey and walnuts directly from farmers, and delivers them nitrogen-sealed for freshness across India.",
        image_url: HERO_IMAGE,
        image_alt: "Bowls of almonds, walnuts, saffron and ghee on a wooden table",
        cta_label: "Shop Now",
        cta_href: "/#products",
        secondary_cta_label: "Our Story",
        secondary_cta_href: "/our-story",
    },
    {
        placement: "promo",
        eyebrow: "Festive Collection",
        title: "Royal Gift Boxes, Ready to Ship",
        subtitle: null,
        image_url: "https://images.unsplash.com/photo-1769255484646-16988ad5552d?auto=format&fit=crop&w=1000&q=80",
        image_alt: "Royal festive gift collection of dry fruits",
        cta_label: "Shop Now",
        cta_href: "/#products",
        secondary_cta_label: null,
        secondary_cta_href: null,
    },
];

// `icon` keys map to lucide icons in the frontend (src/lib/utils/homeIcons.ts).
export const HIGHLIGHTS = [
    { placement: "hero", icon: "sprout", title: "100% Grade-A", description: "Kashmiri & Afghani Harvest" },
    { placement: "hero", icon: "shield-check", title: "Chemical-Free", description: "Farm-to-Pouch Sourcing" },
    { placement: "hero", icon: "truck", title: "Nitrogen-Sealed Freshness", description: "Pan-India Delivery" },

    { placement: "trust_badge", icon: "leaf", title: "100% Natural", description: null },
    { placement: "trust_badge", icon: "shield-check", title: "Premium Quality", description: null },
    { placement: "trust_badge", icon: "truck", title: "Doorstep Delivery", description: null },
    { placement: "trust_badge", icon: "heart-pulse", title: "Healthy Lifestyle", description: null },

    {
        placement: "trust_point",
        icon: "leaf",
        title: "Direct Farmer Sourcing",
        description: "We buy directly from orchard families in Kashmir, Afghanistan, Iran and California — no middlemen.",
    },
    {
        placement: "trust_point",
        icon: "badge-check",
        title: "Lab-Tested Quality",
        description: "Every batch is graded for oil content, moisture and purity before it reaches your pouch.",
    },
    {
        placement: "trust_point",
        icon: "package-check",
        title: "Nitrogen-Sealed Freshness",
        description: "Nitrogen-flushed packaging locks in freshness for up to 6 months after opening.",
    },
    {
        placement: "trust_point",
        icon: "users",
        title: "40,000+ Happy Households",
        description: "Verified reviews from customers across 200+ Indian cities keep us accountable.",
    },
];

// Tiles in the home page's hamper section. A hamper whose slug matches a product (the Heritage Box)
// is a ready-made gift: its tile links to that product. Any other hamper is a theme that opens the
// "build your own" picker with `product_slugs` pre-selected.
export const HAMPERS = [
    {
        slug: "heritage-box",
        name: "Heritage Box",
        subtitle: "Saffron, wild dark honey, almonds & walnuts",
        image_url: "/images/hampers/heritage-box.png",
        product_slugs: ["kashmir-saffron", "kashmir-wild-dark-honey", "kashmiri-almonds", "kashmiri-walnut-kernels"],
    },
];

export const TESTIMONIALS = [
    {
        customer_name: "Ritika Sharma",
        location: "Pune, Maharashtra",
        rating: 5,
        quote:
            "The Mamra almonds taste nothing like what I used to buy from the supermarket — soft, sweet, and clearly fresh. Suvarna7 is now my only source for dry fruits.",
    },
    {
        customer_name: "Arjun Mehta",
        location: "Bengaluru, Karnataka",
        rating: 5,
        quote:
            "Ordered the festive gift box for Diwali and everyone asked where it was from. Packaging felt premium and the cashews were genuinely the best I've had.",
    },
    {
        customer_name: "Fatima Khan",
        location: "Ghaziabad, Uttar Pradesh",
        rating: 4,
        quote: "Love that I can see the origin and processing details before buying. The pincode delivery estimate was spot on too.",
    },
    {
        customer_name: "Suresh Nair",
        location: "Kochi, Kerala",
        rating: 5,
        quote:
            "Been buying dates and walnuts monthly for my parents. Consistent quality every single time, and the nitrogen-sealed pouches actually keep things fresh.",
    },
];

export const FAQS = [
    {
        question: "Is Cash on Delivery (COD) available?",
        answer: "Yes, COD is available on most pincodes across India. You'll see the option at checkout once your pincode is verified.",
    },
    {
        question: "What is your return & exchange policy?",
        answer: "We don't accept returns or offer refunds, as our products are food items. If your order arrives damaged, wrong or defective, message us on WhatsApp with photos within 36 hours of delivery and we'll send a free replacement. Requests after 36 hours can't be accepted.",
    },
    {
        question: "How do you ensure freshness?",
        answer: "Every pouch is nitrogen-flushed at the time of packing and shipped within 48 hours of your order to lock in freshness.",
    },
    {
        question: "Do you deliver across India?",
        answer: "Yes, we ship pan-India via Ekart, Delhivery, BlueDart, DTDC and Shiprocket, with delivery in 2–5 days depending on your pincode.",
    },
    {
        question: "Are your products lab tested?",
        answer: "Every batch is graded and lab-tested for oil content, moisture and purity before it's approved for packing.",
    },
];
