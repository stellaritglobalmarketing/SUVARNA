// The store's product catalogue, from "Website Product List & Content" and "Final Product Price List"
// (prices are the final website prices, GST included). Used by seeds/seed.js and scripts/import-catalog.js.
//
// - `replaces`: the slug this product had before the catalogue update. The import renames that product
//   in place (same id, images, reviews and order history) instead of creating a duplicate.
// - `variants[].weight` is [value, unit]; unit is one of g | kg | ml | l.
// - `variants[].stock` is only used when a SKU is created; existing stock is never overwritten
//   (use `npm run catalog:import -- --stock N` to reset it).
// - MRP equals the website price: the price list gives no separate MRP, so no discount is shown.
// - `certifications` are the "Highlights" bullets, shown as badges on the product page.
// - `info_sections` items are { label, text }; `label` is the bold lead-in, or null.

const LAB_TESTED = { label: "Lab tested for quality", description: null };

const HONEY_STORAGE_NOTE = "Not recommended for infants below 1 year.";

const BILONA_DIFFERENCE =
    "Our ghee is never made from cream. Fresh milk is set into dahi overnight, and this curd is churned in a wooden bilona until pure makkhan (white butter) gently rises. The makkhan is then slow-cooked over a gentle flame, patiently and in small batches, until it turns into fragrant liquid gold. This slow, curd-based process takes far more milk and time than cream-based ghee, but it is the only way to achieve the depth of aroma, grainy texture and purity that true Bilona ghee is revered for.";

const GHEE_SCIENCE = {
    butyric: {
        label: "Butyric Acid",
        text: "A rare short-chain fatty acid and the preferred fuel of the cells lining the gut, known to nourish the intestine and support healthy digestion.",
    },
    vitamins: {
        label: "Fat-Soluble Vitamins A, D, E & K",
        text: "Essential nutrients for clear vision, strong bones and radiant skin. Ghee also helps the body absorb fat-soluble nutrients from the food it is cooked with.",
    },
    cla: {
        label: "CLA (Conjugated Linoleic Acid)",
        text: "A naturally occurring fatty acid in dairy fat, valued for its role in healthy metabolism.",
    },
    smokePoint: {
        label: "High Smoke Point (about 250°C)",
        text: "Remains stable at high heat, making it ideal for tadka, frying and roasting without breaking down.",
    },
    ayurveda: {
        label: "Ayurvedic Heritage",
        text: "Revered in Ayurveda for centuries as a nourishing food that supports digestion (agni), strength and vitality.",
    },
};

const GHEE_STORAGE =
    "Store at room temperature with the lid closed. Always use a clean, dry spoon. No refrigeration needed. Texture may vary with season - a natural sign of real Bilona ghee.";

export const PRODUCTS = [
    {
        slug: "kashmir-saffron",
        replaces: "kashmiri-mongra-saffron",
        name: "Kashmir Saffron",
        tagline: "The Crimson Gold of Kashmir | GI Tagged",
        short_description:
            "Pure GI-tagged saffron stigmas, hand-harvested from the Karewa highlands of Kashmir. Deep crimson threads with an intense, honeyed aroma.",
        description:
            "Every autumn, the Crocus sativus blooms across the ancient Karewa highlands of Kashmir. Each violet flower is hand-picked at dawn, and only its three crimson stigmas are drawn by hand and gently dried to seal in their colour, aroma and flavour. Nearly 1.5 lakh flowers are needed for a single kilogram. Protected by its Geographical Indication, Kashmir Saffron is prized across the world for its long, deep-crimson threads and its rich, lingering fragrance - a true luxury of the valley.",
        origin: "Kashmir",
        processing: "Traditional",
        health_benefits: ["Immunity Boost", "Heart Health"],
        image: "/images/products/kashmiri-mongra-saffron.webp",
        is_bestseller: false,
        certifications: [
            { label: "GI-tagged Kashmir Saffron", description: null },
            { label: "100% saffron stigmas, no fillers", description: null },
            { label: "Hand-harvested and gently dried", description: null },
            LAB_TESTED,
        ],
        info_sections: [
            {
                title: "The Science Within",
                items: [
                    { label: "Crocin", text: "The natural carotenoid behind saffron's rich golden-crimson colour." },
                    { label: "Picrocrocin", text: "Gives saffron its distinctive bitter-sweet taste." },
                    { label: "Safranal", text: "The aromatic compound that creates its signature fragrance." },
                ],
            },
            {
                title: "How to Use",
                body: "Soak 4-5 strands in 2 tablespoons of warm milk or water for 15-20 minutes. Add to kheer, biryani, kahwa, desserts and festive dishes.",
            },
            { title: "Storage", body: "Keep in an airtight container in a cool, dark and dry place, away from light and moisture." },
        ],
        variants: [
            { label: "1g", weight: [1, "g"], price: 699, mrp: 699, stock: 45, sku: "SAF-KSH-1G" },
            { label: "5g", weight: [5, "g"], price: 3299, mrp: 3299, stock: 45, sku: "SAF-KSH-5G" },
        ],
        delivery_days: [2, 4],
        frequently_bought_with: ["gir-cow-bilona-ghee", "kashmiri-almonds"],
    },
    {
        slug: "kashmir-acacia-honey",
        name: "Kashmir Acacia Honey",
        tagline: "Liquid Gold from the Kashmir Hills",
        short_description:
            "A rare, crystal-clear honey from the acacia blossoms of the Kashmir hills, with a delicate floral sweetness and silky texture.",
        description:
            "High in the hills of Kashmir, honeybees gather nectar from flowering acacia trees each spring. The result is a light, crystal-clear honey with a gentle floral sweetness and a smooth, silky body. Collected with care and packed with minimal handling, every jar captures the clean, pristine character of the Kashmir hills.",
        origin: "Kashmir",
        processing: "Raw",
        health_benefits: ["Immunity Boost"],
        image: "/images/products/kashmir-acacia-honey.png",
        is_bestseller: false,
        certifications: [
            { label: "Single-flower acacia honey", description: null },
            { label: "Sourced from the Kashmir hills", description: null },
            { label: "Light, clear and naturally slow to crystallise", description: null },
            LAB_TESTED,
        ],
        info_sections: [
            {
                title: "The Science Within",
                items: [
                    { label: "High fructose-to-glucose ratio", text: "Naturally keeps acacia honey light, clear and slow to crystallise." },
                    { label: "Natural enzymes", text: "Diastase and invertase, contributed by the honeybee." },
                    { label: "Natural antioxidants", text: "Flavonoids and phenolic acids from the acacia nectar." },
                ],
            },
            { title: "How to Use", body: "Stir into warm water, tea or lemon water. Drizzle over breakfast, fruit, yogurt and desserts." },
            {
                title: "Storage",
                body: `Store at room temperature with the lid tightly closed. Always use a dry spoon. ${HONEY_STORAGE_NOTE}`,
            },
        ],
        variants: [
            { label: "250g", weight: [250, "g"], price: 369, mrp: 369, stock: 45, sku: "HNY-ACA-250" },
            { label: "500g", weight: [500, "g"], price: 699, mrp: 699, stock: 45, sku: "HNY-ACA-500" },
            { label: "1kg", weight: [1, "kg"], price: 1349, mrp: 1349, stock: 45, sku: "HNY-ACA-1000" },
        ],
        delivery_days: [2, 4],
        frequently_bought_with: ["kashmiri-walnut-kernels", "kashmiri-almonds"],
    },
    {
        slug: "kashmir-wild-dark-honey",
        replaces: "raw-forest-honey",
        name: "Kashmir Wild Dark Honey",
        tagline: "Untamed. Rich. Wild from the Kashmir Hills.",
        short_description:
            "A bold, deep-amber honey gathered from the wild flowering forests of the Kashmir hills, with notes of caramel, wood and wild flowers.",
        description:
            "Gathered from the wild flowering forests of the Kashmir hills, this dark honey is made by bees feeding on countless mountain blossoms. Deep amber in colour and bold in character, it carries layered notes of caramel, wood and wild flowers - an authentic taste of the untouched highlands.",
        origin: "Kashmir",
        processing: "Raw",
        health_benefits: ["Immunity Boost", "Heart Health"],
        image: "/images/products/raw-forest-honey.webp",
        is_bestseller: false,
        certifications: [
            { label: "Wild multi-floral forest honey", description: null },
            { label: "Sourced from the Kashmir hills", description: null },
            { label: "Deep amber colour, rich complex flavour", description: null },
            LAB_TESTED,
        ],
        info_sections: [
            {
                title: "The Science Within",
                items: [
                    { label: "Polyphenols and flavonoids", text: "Darker honeys are naturally richer in these antioxidant compounds." },
                    { label: "Natural minerals", text: "Including potassium, magnesium and iron." },
                    { label: "Natural enzymes", text: "Diastase and invertase." },
                ],
            },
            { title: "How to Use", body: "Enjoy by the spoon, in warm water or herbal tea, on toast, or as a glaze in cooking." },
            {
                title: "Storage",
                body: `Store at room temperature with a dry spoon. Natural crystallisation is normal; warm the jar gently in water to liquefy. ${HONEY_STORAGE_NOTE}`,
            },
        ],
        variants: [
            { label: "500g", weight: [500, "g"], price: 1049, mrp: 1049, stock: 45, sku: "HNY-WLD-500" },
            { label: "1kg", weight: [1, "kg"], price: 1999, mrp: 1999, stock: 45, sku: "HNY-WLD-1000" },
        ],
        delivery_days: [2, 4],
        frequently_bought_with: ["kashmiri-almonds", "kashmiri-walnut-kernels"],
    },
    {
        slug: "buffalo-bilona-ghee",
        replaces: "pure-buffalo-ghee",
        name: "Buffalo Bilona Ghee",
        tagline: "Hand-Churned from Dahi. Slow-Cooked. Danedar.",
        short_description:
            "Pure Bilona ghee hand-churned from buffalo milk dahi - never cream - and slow-cooked over a gentle flame for a rich danedar texture and deep, nutty aroma.",
        description:
            "Crafted exactly as it has been for centuries. Fresh buffalo milk is set into dahi, and only this curd - never cream - is churned in a wooden bilona until golden makkhan rises to the surface. This hand-churned butter is then slow-cooked over a gentle flame, in small batches, until it transforms into liquid gold and forms its signature danedar grain. The result is a ghee of rare richness - deep, nutty, aromatic and profoundly wholesome, just as our ancestors knew it.",
        origin: "India",
        processing: "Traditional",
        health_benefits: ["Heart Health", "Keto Friendly"],
        image: "/images/products/pure-buffalo-ghee.webp",
        is_bestseller: false,
        certifications: [
            { label: "100% Bilona method - made from dahi, never cream", description: null },
            { label: "Hand-churned in a wooden bilona", description: null },
            { label: "Slow-cooked over a gentle flame in small batches", description: null },
            { label: "Rich danedar (granular) texture and deep nutty aroma", description: null },
            { label: "Naturally rich, creamy buffalo milk fat for lasting energy", description: null },
        ],
        info_sections: [
            { title: "The Bilona Difference", body: BILONA_DIFFERENCE },
            {
                title: "The Science Within & Its Benefits",
                items: [
                    GHEE_SCIENCE.butyric,
                    GHEE_SCIENCE.vitamins,
                    GHEE_SCIENCE.cla,
                    GHEE_SCIENCE.smokePoint,
                    GHEE_SCIENCE.ayurveda,
                    {
                        label: "Rich Buffalo Milk Fat",
                        text: "Naturally denser and creamier, giving this ghee its luxurious grain and long-lasting, satisfying energy.",
                    },
                ],
            },
            {
                title: "How to Use",
                body: "A spoonful elevates every meal - drizzle over hot rotis, rice and dal, use for tadka and frying, or in festive sweets and halwa.",
            },
            { title: "Storage", body: GHEE_STORAGE },
        ],
        variants: [
            { label: "500g", weight: [500, "g"], price: 899, mrp: 899, stock: 45, sku: "GHE-BUF-500" },
            { label: "1kg", weight: [1, "kg"], price: 1749, mrp: 1749, stock: 45, sku: "GHE-BUF-1000G" },
        ],
        delivery_days: [2, 4],
        frequently_bought_with: ["kashmir-saffron", "kashmiri-walnut-kernels"],
    },
    {
        slug: "gir-cow-bilona-ghee",
        replaces: "pure-cow-ghee",
        name: "Gir Cow Bilona Ghee",
        tagline: "Hand-Churned from Gir Cow Dahi. Pure Golden Goodness.",
        short_description:
            "Pure Bilona ghee from the milk of indigenous Gir cows - hand-churned from dahi, never cream - and slow-cooked over a gentle flame to golden perfection.",
        description:
            "Born from the milk of indigenous Gir cows, one of India's most treasured native breeds. The milk is set into dahi, and only this curd - never cream - is churned in a wooden bilona until pure makkhan rises. This butter is then slow-cooked over a gentle flame, in small batches, until it glows with a natural golden hue and releases its rich, sweet aroma. Every jar is a tribute to India's timeless kitchen wisdom - pure, nourishing and deeply golden.",
        origin: "India",
        processing: "Traditional",
        health_benefits: ["Heart Health", "Keto Friendly"],
        image: "/images/products/pure-cow-ghee.webp",
        is_bestseller: true,
        certifications: [
            { label: "From the milk of indigenous Gir cows", description: null },
            { label: "100% Bilona method - made from dahi, never cream", description: null },
            { label: "Hand-churned in a wooden bilona", description: null },
            { label: "Slow-cooked over a gentle flame in small batches", description: null },
            { label: "Naturally golden colour and rich, sweet aroma", description: null },
        ],
        info_sections: [
            { title: "The Bilona Difference", body: BILONA_DIFFERENCE },
            {
                title: "The Science Within & Its Benefits",
                items: [
                    GHEE_SCIENCE.butyric,
                    GHEE_SCIENCE.vitamins,
                    {
                        label: "Beta-Carotene",
                        text: "The natural pigment behind its golden glow, which the body converts into Vitamin A.",
                    },
                    GHEE_SCIENCE.cla,
                    GHEE_SCIENCE.smokePoint,
                    GHEE_SCIENCE.ayurveda,
                ],
            },
            {
                title: "How to Use",
                body: "Enjoy a spoonful with warm milk, drizzle over rotis, rice and dal, or use for everyday cooking, tadka and traditional sweets.",
            },
            { title: "Storage", body: GHEE_STORAGE },
        ],
        variants: [
            { label: "500g", weight: [500, "g"], price: 1449, mrp: 1449, stock: 45, sku: "GHE-GIR-500" },
            { label: "1kg", weight: [1, "kg"], price: 2799, mrp: 2799, stock: 45, sku: "GHE-GIR-1000" },
        ],
        delivery_days: [2, 4],
        frequently_bought_with: ["kashmir-saffron", "kashmir-wild-dark-honey"],
    },
    {
        slug: "kashmiri-almonds",
        replaces: "kashmir-mamra-almonds",
        name: "Kashmiri Almonds",
        tagline: "From the Blossoming Orchards of Kashmir",
        short_description:
            "Wholesome almonds sourced directly from Kashmir's farmers, known for their natural oil, rich flavour and satisfying crunch.",
        description:
            "Each spring, the almond orchards of Kashmir burst into soft pink blossom. Months later, the nuts are harvested by local farming families and carefully dried. Sourced directly from Kashmir's farmers, our almonds are cherished for their natural oil, rich flavour and wholesome crunch.",
        origin: "Kashmir",
        processing: "Raw",
        health_benefits: ["Heart Health", "High Protein", "Keto Friendly"],
        image: "/images/products/kashmir-mamra-almonds.webp",
        is_bestseller: true,
        certifications: [
            { label: "Sourced directly from Kashmir farmers", description: null },
            { label: "Rich natural oil and flavour", description: null },
            { label: "Premium selection", description: null },
            LAB_TESTED,
        ],
        info_sections: [
            {
                title: "The Science Within",
                items: [
                    { label: "Vitamin E (alpha-tocopherol)", text: "Almonds are among its richest natural sources." },
                    { label: "Monounsaturated fats", text: "The good fats that make up most of the almond's oil." },
                    { label: "Plant protein and dietary fibre", text: "For lasting energy." },
                    { label: "Magnesium", text: "An essential mineral naturally present in almonds." },
                ],
            },
            { title: "How to Use", body: "Soak overnight and peel in the morning, snack on them raw, or add to milk, desserts and kheer." },
            { title: "Storage", body: "Keep in an airtight container in a cool, dry place. Refrigerate after opening for longer freshness." },
        ],
        variants: [
            { label: "500g", weight: [500, "g"], price: 699, mrp: 699, stock: 45, sku: "ALM-MAM-500" },
            { label: "1kg", weight: [1, "kg"], price: 1349, mrp: 1349, stock: 45, sku: "ALM-MAM-1000" },
        ],
        delivery_days: [2, 4],
        frequently_bought_with: ["kashmiri-walnut-kernels", "kashmir-saffron"],
    },
    {
        slug: "kashmiri-walnut-kernels",
        name: "Kashmiri Walnut Kernels",
        tagline: "The Mountain's Finest Kernel",
        short_description: "Walnut kernels sourced directly from Kashmir's farmers, with a mild, buttery taste - a true treasure of the mountains.",
        description:
            "Walnut trees have grown in the valleys of Kashmir for generations. Our walnuts are harvested by local farmers, carefully shelled and sorted to bring you whole, wholesome kernels with a mild, buttery taste - a true treasure of the mountains.",
        origin: "Kashmir",
        processing: "Raw",
        health_benefits: ["Heart Health", "Keto Friendly", "Diabetic Friendly"],
        image: "/images/products/kashmiri-walnut-kernels.webp",
        is_bestseller: true,
        certifications: [
            { label: "Sourced directly from Kashmir farmers", description: null },
            { label: "Mild, buttery taste", description: null },
            { label: "Premium selection", description: null },
            LAB_TESTED,
        ],
        info_sections: [
            {
                title: "The Science Within",
                items: [
                    { label: "Plant Omega-3 (ALA)", text: "Walnuts are the richest tree-nut source of alpha-linolenic acid." },
                    { label: "Polyphenols", text: "Natural antioxidant compounds found in the kernel skin." },
                    { label: "Plant protein and dietary fibre", text: "For wholesome nourishment." },
                ],
            },
            { title: "How to Use", body: "Enjoy as a snack, soak overnight, or add to breakfast, salads, cakes and desserts." },
            { title: "Storage", body: "Keep in an airtight container. Refrigerate after opening, as walnut oils stay fresh longer in the cold." },
        ],
        variants: [
            { label: "500g", weight: [500, "g"], price: 849, mrp: 849, stock: 45, sku: "WAL-KSH-500" },
            { label: "1kg", weight: [1, "kg"], price: 1649, mrp: 1649, stock: 45, sku: "WAL-KSH-1000" },
        ],
        delivery_days: [3, 5],
        frequently_bought_with: ["kashmiri-almonds", "kashmir-wild-dark-honey"],
    },
    {
        slug: "heritage-box",
        name: "Heritage Box",
        tagline: "A Treasured Gift from the Valley",
        short_description:
            "A curated collection of the valley's finest treasures - GI-tagged saffron, wild forest honey, almonds and walnuts - presented in an elegant keepsake box.",
        description:
            "Some gifts are given; others are remembered. The Heritage Box brings together four of the valley's most treasured offerings in one elegant keepsake. At its heart sits GI-tagged Kashmir Saffron, the crimson gold of the Karewa highlands, joined by bold wild dark honey from the Kashmir hills and wholesome almonds and walnut kernels sourced directly from Kashmir's farmers. Thoughtfully curated and beautifully presented, it is a gift of heritage, purity and warmth - made for the people who matter most.",
        origin: "Kashmir",
        processing: "Traditional",
        health_benefits: [],
        image: "/images/hampers/heritage-box.png",
        is_bestseller: false,
        certifications: [
            { label: "Four premium products in one elegant gift box", description: null },
            { label: "Centred around GI-tagged Kashmir Saffron", description: null },
            { label: "Sourced from the Kashmir hills and Kashmir's farmers", description: null },
            { label: "Ready to gift - no extra wrapping needed", description: null },
        ],
        info_sections: [
            {
                title: "What's Inside",
                items: [
                    { label: "Kashmir Saffron", text: "1 g, GI tagged" },
                    { label: "Kashmir Wild Dark Honey", text: "250 g" },
                    { label: "Kashmiri Almonds", text: "250 g" },
                    { label: "Kashmiri Walnut Kernels", text: "250 g" },
                ],
            },
            {
                title: "Perfect For",
                body: "Diwali and festive gifting, corporate gifts for clients and teams, weddings, housewarmings, and thank-you gifts.",
            },
            { title: "Corporate & Bulk Orders", body: "Gifting for your team or clients? Contact us for bulk orders and corporate pricing." },
        ],
        // Contents weigh about 750 g; 1 kg is the packed box's upper bound, used for shipping estimates.
        variants: [{ label: "1 Box", weight: [1, "kg"], price: 1999, mrp: 1999, stock: 45, sku: "GFT-HERITAGE" }],
        delivery_days: [3, 5],
        frequently_bought_with: ["kashmir-saffron", "kashmir-wild-dark-honey"],
    },
];
