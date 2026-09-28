// Initial products, home page and product page content, taken verbatim from the storefront's original
// design mock data (frontend/src/lib/data/*.mock.ts and the home section components).
// Consumed by seeds/seed.js.

// `variants[].weight` is [value, unit]; unit is one of g | kg | ml | l.
export const PRODUCTS = [
    {
        slug: "kashmiri-mongra-saffron",
        name: "Kashmiri Mongra Saffron",
        short_description: "Grade-1 mongra kesar, hand-picked from Pampore",
        description:
            "Hand-harvested from the saffron fields of Pampore, Kashmir, this Mongra-grade saffron is prized for its deep crimson threads, intense aroma and rich flavour — the finest grade of Indian kesar.",
        origin: "Kashmir",
        processing: "Traditional",
        health_benefits: ["Immunity Boost", "Heart Health"],
        image: "/images/products/kashmiri-mongra-saffron.webp",
        is_bestseller: false,
        certifications: [
            { label: "Direct Farmer Fair Trade", description: "Sourced directly from Pampore saffron growers." },
            { label: "100% Pure, No Additives", description: "Zero colouring, zero artificial fragrance." },
            { label: "Grade-1 Mongra", description: "Hand-picked for maximum crocin (colour) and safranal (aroma)." },
        ],
        variants: [{ label: "50g", weight: [50, "g"], price: 15999, mrp: 18999, stock: 6, sku: "SAF-MON-50" }],
        delivery_days: [2, 4],
        frequently_bought_with: ["pure-cow-ghee", "kashmir-mamra-almonds"],
    },
    {
        slug: "raw-forest-honey",
        name: "Raw Forest Honey",
        short_description: "Unheated, cold-extracted honey straight from the hive",
        description:
            "Naturally extracted and never heated above room temperature, this raw honey retains its live enzymes, pollen and natural aroma — a wholesome everyday sweetener straight from the hive.",
        origin: "India",
        processing: "Raw",
        health_benefits: ["Immunity Boost", "Heart Health"],
        image: "/images/products/raw-forest-honey.webp",
        is_bestseller: false,
        certifications: [
            { label: "Direct Farmer Fair Trade", description: "Sourced directly from apiary partners." },
            { label: "100% Pure, No Adulteration", description: "No added sugar syrup or glucose." },
            { label: "Raw & Unheated", description: "Cold-extracted to preserve natural enzymes." },
        ],
        variants: [
            { label: "250ml", weight: [250, "ml"], price: 249, mrp: 299, stock: 40, sku: "HNY-RAW-250" },
            { label: "1L", weight: [1, "l"], price: 799, mrp: 949, stock: 18, sku: "HNY-RAW-1000" },
        ],
        delivery_days: [2, 4],
        frequently_bought_with: ["kashmir-mamra-almonds", "pure-cow-ghee"],
    },
    {
        slug: "afghani-gurbandi-almonds",
        name: "Afghani Gurbandi Almonds",
        short_description: "Slim, sweet almonds from the Gurbandi valley",
        description:
            "Grown in the Gurbandi valley of Afghanistan, these slim-shelled almonds are prized for their delicate sweetness and soft bite — a traditional favourite across South Asian kitchens.",
        origin: "Afghanistan",
        processing: "Raw",
        health_benefits: ["Heart Health", "High Protein"],
        image: "/images/products/afghani-gurbandi-almonds.webp",
        is_bestseller: false,
        certifications: [
            { label: "Direct Farmer Fair Trade", description: "Sourced through certified Afghan orchard cooperatives." },
            { label: "100% Chemical-Free", description: "Sun-dried naturally, no fumigation." },
            { label: "Gurbandi Grade", description: "Hand-sorted for the thin-shell Gurbandi variety." },
        ],
        variants: [
            { label: "250g", weight: [250, "g"], price: 459, mrp: 549, stock: 24, sku: "ALM-AFG-250" },
            { label: "500g", weight: [500, "g"], price: 869, mrp: 1049, stock: 12, sku: "ALM-AFG-500" },
            { label: "1kg", weight: [1, "kg"], price: 1649, mrp: 1999, stock: 5, sku: "ALM-AFG-1000" },
        ],
        delivery_days: [3, 5],
        frequently_bought_with: ["kashmiri-walnut-kernels", "pure-cow-ghee"],
    },
    {
        slug: "kashmir-mamra-almonds",
        name: "Kashmir Mamra Almonds",
        short_description: "Wild-harvested, cold-pressed oil-rich almonds",
        description:
            "Hand-picked from the Mamra orchards of Kashmir, these almonds are prized for their dense, oil-rich kernel and distinct sweet aroma. Sun-dried naturally with zero chemical treatment.",
        origin: "Kashmir",
        processing: "Raw",
        health_benefits: ["Heart Health", "Keto Friendly", "High Protein"],
        image: "/images/products/kashmir-mamra-almonds.webp",
        is_bestseller: true,
        certifications: [
            { label: "Direct Farmer Fair Trade", description: "Sourced directly from Kashmiri orchard families." },
            { label: "100% Chemical-Free", description: "No fumigation, bleaching, or artificial preservatives." },
            { label: "42% Oil Content", description: "Lab-verified for premium Mamra-grade richness." },
        ],
        variants: [
            { label: "250g", weight: [250, "g"], price: 579, mrp: 699, stock: 27, sku: "ALM-MAM-250" },
            { label: "500g", weight: [500, "g"], price: 1099, mrp: 1349, stock: 14, sku: "ALM-MAM-500" },
            { label: "1kg", weight: [1, "kg"], price: 2099, mrp: 2599, stock: 6, sku: "ALM-MAM-1000" },
        ],
        delivery_days: [2, 4],
        frequently_bought_with: ["kashmiri-walnut-kernels", "kashmiri-mongra-saffron"],
    },
    {
        slug: "pure-cow-ghee",
        name: "Pure Cow Ghee",
        short_description: "A2 bilona-method cow ghee, slow-churned",
        description:
            "Made using the traditional bilona method from A2 cow milk, this ghee is slow-churned in small batches for a rich, nutty aroma and golden-grain texture — the way ghee was made generations ago.",
        origin: "India",
        processing: "Traditional",
        health_benefits: ["Keto Friendly", "Heart Health"],
        image: "/images/products/pure-cow-ghee.webp",
        is_bestseller: true,
        certifications: [
            { label: "Direct Farmer Fair Trade", description: "Sourced from small-scale A2 gaushalas." },
            { label: "100% Pure, No Adulteration", description: "No vanaspati, palm oil or added colour." },
            { label: "Bilona Method", description: "Traditionally hand-churned from cultured cream, not cream separators." },
        ],
        variants: [
            { label: "250ml", weight: [250, "ml"], price: 329, mrp: 379, stock: 30, sku: "GHE-COW-250" },
            { label: "1L", weight: [1, "l"], price: 1199, mrp: 1399, stock: 12, sku: "GHE-COW-1000" },
        ],
        delivery_days: [2, 4],
        frequently_bought_with: ["kashmiri-mongra-saffron", "raw-forest-honey"],
    },
    {
        slug: "pure-buffalo-ghee",
        name: "Pure Buffalo Ghee",
        short_description: "Rich, traditionally simmered buffalo-milk ghee",
        description:
            "Slow-simmered from full-cream buffalo milk, this ghee has a paler colour and a richer, more intense texture than cow ghee — a traditional favourite for its deep flavour in everyday cooking.",
        origin: "India",
        processing: "Traditional",
        health_benefits: ["Keto Friendly", "Heart Health"],
        image: "/images/products/pure-buffalo-ghee.webp",
        is_bestseller: false,
        certifications: [
            { label: "Direct Farmer Fair Trade", description: "Sourced from small-scale buffalo dairy farmers." },
            { label: "100% Pure, No Adulteration", description: "No vanaspati, palm oil or added colour." },
            { label: "Traditional Simmering", description: "Slow-simmered in small batches for authentic flavour." },
        ],
        variants: [
            { label: "250ml", weight: [250, "ml"], price: 349, mrp: 399, stock: 28, sku: "GHE-BUF-250" },
            { label: "1L", weight: [1, "l"], price: 1299, mrp: 1499, stock: 10, sku: "GHE-BUF-1000" },
        ],
        delivery_days: [2, 4],
        frequently_bought_with: ["pure-cow-ghee", "kashmiri-walnut-kernels"],
    },
    {
        slug: "kashmiri-walnut-kernels",
        name: "Kashmiri Walnut Kernels",
        short_description: "Light amber halves, cracked fresh to order",
        description:
            "Premium light-amber walnut kernels cracked fresh from Kashmiri orchards, prized for their thin skin, low bitterness, and high omega-3 content.",
        origin: "Kashmir",
        processing: "Raw",
        health_benefits: ["Heart Health", "Keto Friendly", "Diabetic Friendly"],
        image: "/images/products/kashmiri-walnut-kernels.webp",
        is_bestseller: true,
        certifications: [
            { label: "Direct Farmer Fair Trade", description: "Sourced from family-run Kashmiri orchards." },
            { label: "100% Chemical-Free", description: "Air-dried, no bleaching agents." },
            { label: "Light Amber Grade", description: "Premium color grade with low bitterness." },
        ],
        variants: [
            { label: "250g", weight: [250, "g"], price: 539, mrp: 639, stock: 25, sku: "WAL-KSH-250" },
            { label: "500g", weight: [500, "g"], price: 1029, mrp: 1229, stock: 13, sku: "WAL-KSH-500" },
            { label: "1kg", weight: [1, "kg"], price: 1949, mrp: 2349, stock: 7, sku: "WAL-KSH-1000" },
        ],
        delivery_days: [3, 5],
        frequently_bought_with: ["kashmir-mamra-almonds", "raw-forest-honey"],
    },
];

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

export const HAMPERS = [
    {
        slug: "festive-nut-box",
        name: "Festive Nut Box",
        subtitle: "Almonds & walnuts",
        image_url: "/images/hampers/festive-nut-box.webp",
        product_slugs: ["afghani-gurbandi-almonds", "kashmir-mamra-almonds", "kashmiri-walnut-kernels"],
    },
    {
        slug: "kesar-ghee-gift-set",
        name: "Kesar & Ghee Gift Set",
        subtitle: "Saffron & pure ghee",
        image_url: "/images/hampers/kesar-ghee-gift-set.webp",
        product_slugs: ["kashmiri-mongra-saffron", "pure-cow-ghee", "pure-buffalo-ghee"],
    },
    {
        slug: "wellness-basket",
        name: "Wellness Basket",
        subtitle: "Honey, nuts & more",
        image_url: "/images/hampers/wellness-basket.webp",
        product_slugs: ["raw-forest-honey", "kashmiri-walnut-kernels", "kashmir-mamra-almonds"],
    },
    {
        slug: "the-everything-hamper",
        name: "The Everything Hamper",
        subtitle: "One of each product",
        image_url: "/images/hampers/everything-hamper.webp",
        product_slugs: [
            "kashmiri-mongra-saffron",
            "raw-forest-honey",
            "afghani-gurbandi-almonds",
            "kashmir-mamra-almonds",
            "pure-cow-ghee",
            "pure-buffalo-ghee",
            "kashmiri-walnut-kernels",
        ],
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
        question: "What is your return & refund policy?",
        answer: "If a pouch arrives damaged or doesn't match the listing, we offer a free replacement or full refund within 7 days of delivery.",
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
