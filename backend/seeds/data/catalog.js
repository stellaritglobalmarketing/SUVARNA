// The store's product catalogue, from "Product Pages, Stories & SEO" (Oct 2026): final website prices with
// free delivery (GST included) and each product page's copy. Used by seeds/seed.js and scripts/import-catalog.js.
//
// - `replaces`: slugs this product had before. The import renames that product in place (same id, images,
//   reviews and order history) instead of creating a duplicate. Old URLs redirect in frontend/next.config.ts.
// - `heading` is the product page's H1; `name` stays short for cards, cart and invoices.
// - `tagline` is the hook line under the price; `meta_title` / `meta_description` are for Google.
// - `description` is "The Story".
// - `image` is the main photo; `more_images` ([{ url, alt }]) follow it in the product page gallery.
// - `certifications` are the trust points under Add to Cart (a label starting with "100%" also shows on cards).
// - `info_sections` follow the story in order. A section titled "FAQs" is shown as questions and answers
//   (items' `label` is the question) and also feeds the page's FAQ schema for Google.
// - `variants[].weight` is [value, unit]; unit is one of g | kg | ml | l.
// - `variants[].stock` is only used when a SKU is created; existing stock is never overwritten
//   (use `npm run catalog:import -- --stock N` to reset it).
// - MRP equals the website price, so no crossed-out price or discount is shown.
// - No health claims (FSSAI): `health_benefits` stays empty.

const FREE_DELIVERY = { label: "Free delivery across India", description: null };

const HONEY_INFANT_NOTE = "Not for infants below 1 year.";

const highlights = (...points) => ({ title: "Highlights", items: points.map((text) => ({ label: null, text })) });

const faqs = (...pairs) => ({ title: "FAQs", items: pairs.map(([label, text]) => ({ label, text })) });

const trustPoints = (...labels) => [...labels.map((label) => ({ label, description: null })), FREE_DELIVERY];

export const PRODUCTS = [
    {
        slug: "kashmiri-kesar-saffron",
        replaces: ["kashmir-saffron", "kashmiri-mongra-saffron"],
        name: "Kashmir Saffron",
        heading: "Kashmiri Kesar (Saffron) - Grown on Our Own Farm in Pampore",
        tagline: "Hand-picked at dawn from our own saffron fields in Pampore, Kashmir.",
        meta_title: "Kashmiri Kesar Original 1g | Pure Pampore Saffron - Suvarna7",
        meta_description:
            "Buy original Kashmiri kesar online. Grown on our own farm in Pampore, tested & packed by IIKSTC (Govt of J&K). Long Mongra threads. Free delivery across India.",
        description:
            "Every October, our family walks into the purple saffron fields of Pampore before sunrise. Each flower is picked by hand, and only its three deep-red threads are kept. It takes about 1.5 lakh flowers to make one kilo. We dry the threads slowly, the traditional way, and send them for testing and packing at IIKSTC, Pampore, run by the Department of Agriculture, Govt of J&K. What reaches you is kesar from our own soil, not from a trader's warehouse.",
        origin: "Kashmir",
        processing: "Traditional",
        health_benefits: [],
        image: "/images/products/kashmir-saffron.webp",
        image_alt: "Original Kashmiri kesar Mongra saffron threads from Pampore farm",
        is_bestseller: false,
        certifications: trustPoints("Grown on our own farm", "Tested & packed by IIKSTC, Pampore"),
        info_sections: [
            highlights(
                "100% pure Mongra threads - long, deep red, no yellow style",
                "Crocin (colour strength) 200+",
                "No added colour, no mixing, no fillers",
                "Strong natural aroma and deep golden colour"
            ),
            {
                title: "How to Use",
                body: "Soak 4-5 threads in 2 tbsp warm milk or water for 15 minutes. Add to kesar doodh, kheer, biryani, kahwa, halwa and festive sweets.",
            },
            { title: "Storage", body: "Airtight box, cool and dark place, away from moisture. Best within 24 months." },
            faqs(
                [
                    "How do I check if saffron is original?",
                    "Drop 2-3 threads in warm water. Original kesar slowly releases golden-yellow colour while the thread stays red. Fake saffron bleeds red colour instantly.",
                ],
                [
                    "Why is Kashmiri saffron costlier?",
                    "Kashmir saffron grows only in a small area like Pampore, is hand-picked, and has longer, darker threads with stronger aroma.",
                ],
                ["How long will 1 gram last?", "Using 4-5 threads a day, 1 gram lasts about 1-2 months."]
            ),
        ],
        variants: [
            { label: "1g", weight: [1, "g"], price: 699, mrp: 699, stock: 45, sku: "SAF-KSH-1G" },
            { label: "5g", weight: [5, "g"], price: 3299, mrp: 3299, stock: 45, sku: "SAF-KSH-5G" },
        ],
        delivery_days: [2, 4],
        frequently_bought_with: ["gir-cow-bilona-ghee", "kashmiri-almonds-badam"],
    },
    {
        slug: "kashmir-acacia-honey",
        name: "Kashmir Acacia Honey",
        heading: "Pure Kashmir Acacia Honey - Raw, Light & Naturally Clear",
        tagline: "Light, clear honey from the spring acacia blossoms of the Kashmir hills.",
        meta_title: "Pure Acacia Honey from Kashmir | Raw & Unprocessed - Suvarna7",
        meta_description:
            "Pure Kashmir acacia honey - light, clear and naturally slow to crystallise. Single-flower, unprocessed, no added sugar. Free delivery across India.",
        description:
            "Each spring, the acacia trees on the hills of Kashmir burst into white blossom. Bees gather their nectar for only a few short weeks, and that is all the time we get. The honey is extracted gently, filtered only through cloth and packed without heating, so it keeps its natural taste. The result is a light, clear honey with a soft floral sweetness that does not overpower your tea.",
        origin: "Kashmir",
        processing: "Raw",
        health_benefits: [],
        image: "/images/products/kashmir-acacia-honey.png",
        image_alt: "Pure raw acacia honey from Kashmir in a glass jar",
        is_bestseller: false,
        certifications: trustPoints("Single-flower acacia honey", "No added sugar or syrup"),
        info_sections: [
            highlights(
                "Single-flower acacia honey from Kashmir",
                "Raw - not heated, not processed",
                "No added sugar, syrup or preservatives",
                "Naturally slow to crystallise"
            ),
            { title: "How to Use", body: "Stir into warm water, lemon water, green tea or milk. Drizzle on toast, fruit, yogurt and oats." },
            { title: "Storage", body: `Room temperature, lid closed, dry spoon. ${HONEY_INFANT_NOTE}` },
            faqs(
                [
                    "Why does acacia honey not freeze?",
                    "Acacia honey naturally has more fructose, so it stays liquid much longer than other honeys.",
                ],
                ["Is your honey raw?", "Yes. It is not heated or processed. It is only filtered through cloth to remove wax."],
                ["Is acacia honey good for tea?", "Yes. Its light, mild taste sweetens tea without changing the flavour."]
            ),
        ],
        variants: [
            { label: "250g", weight: [250, "g"], price: 419, mrp: 419, stock: 45, sku: "HNY-ACA-250" },
            { label: "500g", weight: [500, "g"], price: 749, mrp: 749, stock: 45, sku: "HNY-ACA-500" },
            { label: "1kg", weight: [1, "kg"], price: 1399, mrp: 1399, stock: 45, sku: "HNY-ACA-1000" },
        ],
        delivery_days: [2, 4],
        frequently_bought_with: ["kashmiri-walnut-kernels-akhrot", "kashmiri-almonds-badam"],
    },
    {
        slug: "kashmir-wild-forest-honey",
        replaces: ["kashmir-wild-dark-honey", "raw-forest-honey"],
        name: "Kashmir Wild Dark Honey",
        heading: "Kashmir Wild Dark Honey - Raw Forest Honey from the Hills",
        tagline: "Dark, bold honey from the wild flowering forests of the Kashmir hills.",
        meta_title: "Wild Forest Honey from Kashmir | Raw Dark Honey - Suvarna7",
        meta_description:
            "Raw wild forest honey from the Kashmir hills. Dark, rich and multi-floral with notes of caramel and wood. Unprocessed, no added sugar. Free delivery.",
        description:
            "High above the villages, wild bees feed on hundreds of mountain flowers that nobody plants and nobody sprays. Their honey is dark amber, thick and full of character, with notes of caramel, wood and wild flowers. Every season tastes a little different, because the forest decides the flavour, not us.",
        origin: "Kashmir",
        processing: "Raw",
        health_benefits: [],
        image: "/images/products/raw-forest-honey.webp",
        image_alt: "Raw wild dark forest honey from Kashmir hills",
        is_bestseller: false,
        certifications: trustPoints("Wild multi-floral forest honey", "Raw & unprocessed"),
        info_sections: [
            highlights(
                "Wild multi-floral honey from Kashmir forests",
                "Raw - not heated, not processed",
                "Dark amber colour, rich layered taste",
                "No added sugar or syrup"
            ),
            { title: "How to Use", body: "Have a spoon in warm water in the morning, with herbal tea, on toast, or as a glaze in cooking." },
            {
                title: "Storage",
                body: `Room temperature, dry spoon. Natural crystallisation is a sign of real honey - warm the jar in water to melt. ${HONEY_INFANT_NOTE}`,
            },
            faqs(
                [
                    "Why is wild honey dark?",
                    "It comes from many forest flowers, which gives it a darker colour and stronger taste than single-flower honey.",
                ],
                [
                    "My honey became thick. Is it fake?",
                    "No. Real raw honey can crystallise in cold weather. Keep the jar in warm water and it turns liquid again.",
                ],
                ["Is it processed?", "No. It is only cloth-filtered and packed without heating."]
            ),
        ],
        variants: [
            { label: "500g", weight: [500, "g"], price: 1099, mrp: 1099, stock: 45, sku: "HNY-WLD-500" },
            { label: "1kg", weight: [1, "kg"], price: 2049, mrp: 2049, stock: 45, sku: "HNY-WLD-1000" },
        ],
        delivery_days: [2, 4],
        frequently_bought_with: ["kashmiri-almonds-badam", "kashmiri-walnut-kernels-akhrot"],
    },
    {
        slug: "buffalo-bilona-ghee",
        replaces: ["pure-buffalo-ghee"],
        name: "Buffalo Bilona Ghee",
        heading: "Buffalo Bilona Ghee - Hand-Churned from Dahi, Never Cream",
        tagline: "Made from dahi, not cream - churned by hand and slow-cooked for a danedar grain.",
        meta_title: "Buffalo Bilona Ghee | Hand-Churned Danedar Desi Ghee - Suvarna7",
        meta_description:
            "Pure buffalo bilona ghee made from dahi, never cream. Hand-churned, slow-cooked, danedar texture and rich aroma. No preservatives. Free delivery.",
        description:
            "Fresh buffalo milk is boiled and set into dahi overnight. In the morning, the dahi is churned in a wooden bilona until white makkhan rises to the top. This makkhan is slow-cooked over a gentle flame in small batches until it turns golden and forms its danedar grain. It takes far more milk and time than cream ghee, and you can taste the difference in the very first spoon.",
        origin: "India",
        processing: "Traditional",
        health_benefits: [],
        image: "/images/products/pure-buffalo-ghee.webp",
        image_alt: "Danedar buffalo bilona desi ghee in a glass jar",
        is_bestseller: false,
        certifications: trustPoints("100% bilona method from dahi", "Slow-cooked in small batches"),
        info_sections: [
            highlights(
                "Made from dahi, never cream",
                "Hand-churned in a wooden bilona",
                "Danedar (grainy) texture, deep nutty aroma",
                "No preservatives, no added colour"
            ),
            { title: "How to Use", body: "On hot roti, rice and dal, for tadka, parathas, halwa, laddoo and festive sweets." },
            {
                title: "Storage",
                body: "Room temperature, lid closed, clean dry spoon. No fridge needed. Texture changes with season - a sign of real bilona ghee.",
            },
            faqs(
                [
                    "What is bilona ghee?",
                    "Ghee made by churning dahi in a bilona to get makkhan, then slow-cooking it. Normal ghee is made directly from cream.",
                ],
                [
                    "Buffalo ghee or cow ghee?",
                    "Buffalo ghee is whiter, thicker and richer - great for sweets and cooking. Gir cow ghee is golden with a lighter taste.",
                ],
                ["Why is it danedar?", "Slow cooking of bilona makkhan forms natural grains. It is a sign of traditional ghee."]
            ),
        ],
        variants: [
            { label: "500g", weight: [500, "g"], price: 949, mrp: 949, stock: 45, sku: "GHE-BUF-500" },
            { label: "1kg", weight: [1, "kg"], price: 1799, mrp: 1799, stock: 45, sku: "GHE-BUF-1000G" },
        ],
        delivery_days: [2, 4],
        frequently_bought_with: ["kashmiri-kesar-saffron", "kashmiri-walnut-kernels-akhrot"],
    },
    {
        slug: "gir-cow-bilona-ghee",
        replaces: ["pure-cow-ghee"],
        name: "Gir Cow Bilona Ghee",
        heading: "Gir Cow Bilona Ghee - From Desi Gir Cow Milk, Hand-Churned",
        tagline: "Golden ghee from the milk of desi Gir cows, churned from dahi the old way.",
        meta_title: "Gir Cow Bilona Ghee | Pure Desi Cow Ghee, Hand-Churned - Suvarna7",
        meta_description:
            "Pure Gir cow bilona ghee from desi Gir cow milk. Made from dahi, never cream. Hand-churned, slow-cooked, golden and aromatic. Free delivery.",
        description:
            "The Gir is one of India's most loved native cow breeds, from the land of Saurashtra in Gujarat. Their milk is set into dahi, and only this dahi is churned in a wooden bilona until pure makkhan rises. The makkhan is slow-cooked over a gentle flame until it glows a natural golden colour and fills the kitchen with its sweet aroma. This is ghee the way our grandmothers made it.",
        origin: "India",
        processing: "Traditional",
        health_benefits: [],
        image: "/images/products/pure-cow-ghee.webp",
        image_alt: "Golden Gir cow bilona ghee hand-churned from dahi",
        is_bestseller: true,
        certifications: trustPoints("Milk of desi Gir cows", "100% bilona method from dahi"),
        info_sections: [
            highlights(
                "From the milk of desi Gir cows",
                "Made from dahi, never cream",
                "Hand-churned, slow-cooked in small batches",
                "Natural golden colour, no added colour"
            ),
            { title: "How to Use", body: "A spoon on roti and dal, in warm milk, for tadka, khichdi, and traditional sweets." },
            { title: "Storage", body: "Room temperature, lid closed, clean dry spoon. No fridge needed." },
            faqs(
                ["Why is Gir cow ghee costly?", "A Gir cow gives little milk, and bilona needs about 25-30 litres of milk for 1 kg of ghee."],
                ["Why is it golden yellow?", "The natural golden colour comes from the cow's milk itself. Nothing is added."],
                ["Is this made from cream?", "No. It is made only from dahi using the traditional bilona method."]
            ),
        ],
        variants: [
            { label: "500g", weight: [500, "g"], price: 1499, mrp: 1499, stock: 45, sku: "GHE-GIR-500" },
            { label: "1kg", weight: [1, "kg"], price: 2849, mrp: 2849, stock: 45, sku: "GHE-GIR-1000" },
        ],
        delivery_days: [2, 4],
        frequently_bought_with: ["kashmiri-kesar-saffron", "kashmir-wild-forest-honey"],
    },
    {
        slug: "kashmiri-almonds-badam",
        replaces: ["kashmiri-almonds", "kashmir-mamra-almonds"],
        name: "Kashmiri Almonds",
        heading: "Kashmiri Almonds (Badam) - Direct from Kashmir Orchards",
        tagline: "From the pink-blossom almond orchards of Kashmir, straight to your home.",
        meta_title: "Kashmiri Almonds (Badam) Online | Fresh from Kashmir - Suvarna7",
        meta_description:
            "Buy Kashmiri badam online, sourced directly from Kashmir farmers. Naturally rich in oil, fresh, crunchy. Perfect for soaking and Diwali gifting. Free delivery.",
        description:
            "Every spring, the almond orchards of Kashmir turn soft pink with blossom. By late summer, local farming families harvest, dry and sort the nuts by hand. We buy directly from these families, so the almonds reach you fresh, without sitting for months in a big warehouse. Kashmiri badam is naturally oily and full of flavour - the kind you soak at night and peel in the morning.",
        origin: "Kashmir",
        processing: "Raw",
        health_benefits: [],
        image: "/images/products/kashmiri-mamra-badam.webp",
        image_alt: "Suvarna7 Kashmiri Mamra Badam 1kg pack",
        more_images: [{ url: "/images/products/kashmiri-almonds.webp", alt: "Fresh Kashmiri almonds badam from Kashmir orchards" }],
        is_bestseller: true,
        certifications: trustPoints("Direct from Kashmir farmers", "Fresh this-season stock"),
        info_sections: [
            highlights(
                "Sourced directly from Kashmir farmers",
                "Naturally rich in oil and flavour",
                "Hand-sorted, fresh crunch",
                "No polish, no added colour"
            ),
            { title: "How to Use", body: "Soak 5-6 overnight and peel in the morning. Snack raw, add to milk, kheer, halwa and sweets." },
            { title: "Storage", body: "Airtight jar in a cool, dry place. Keep in the fridge after opening for longer freshness." },
            faqs(
                ["Why soak almonds?", "Soaking softens them and makes them easier to eat and peel - a traditional Indian habit."],
                [
                    "How are Kashmiri almonds different?",
                    "They are smaller, naturally oilier and have a richer taste than common imported almonds.",
                ],
                ["Is this good for gifting?", "Yes. Almonds are the most popular Diwali dry fruit gift."]
            ),
        ],
        variants: [
            { label: "500g", weight: [500, "g"], price: 749, mrp: 749, stock: 45, sku: "ALM-MAM-500" },
            { label: "1kg", weight: [1, "kg"], price: 1399, mrp: 1399, stock: 45, sku: "ALM-MAM-1000" },
        ],
        delivery_days: [2, 4],
        frequently_bought_with: ["kashmiri-walnut-kernels-akhrot", "kashmiri-kesar-saffron"],
    },
    {
        slug: "kashmiri-walnut-kernels-akhrot",
        replaces: ["kashmiri-walnut-kernels"],
        name: "Kashmiri Walnut Kernels",
        heading: "Kashmiri Walnut Kernels (Akhrot Giri) - Fresh from the Valley",
        tagline: "Light, buttery walnut kernels from the old walnut trees of Kashmir.",
        meta_title: "Kashmiri Walnut Kernels (Akhrot Giri) | Light Halves - Suvarna7",
        meta_description:
            "Fresh Kashmiri akhrot giri, direct from Kashmir farmers. Light-coloured kernels with a mild, buttery taste, not bitter. Free delivery across India.",
        description:
            "Walnut trees in Kashmir are often older than the families who care for them. Every autumn the nuts are shaken down, dried in the sun, cracked by hand and sorted kernel by kernel. We pick light-coloured kernels with a mild, buttery taste, because fresh walnuts should never taste bitter. Kashmir grows most of India's walnuts, and these come straight from the valley to you.",
        origin: "Kashmir",
        processing: "Raw",
        health_benefits: [],
        image: "/images/products/kashmiri-walnut-kernels.webp",
        image_alt: "Light Kashmiri walnut kernels akhrot giri",
        is_bestseller: true,
        certifications: trustPoints("Direct from Kashmir farmers", "This season's fresh crop"),
        info_sections: [
            highlights(
                "Sourced directly from Kashmir farmers",
                "Light-coloured kernels, mild buttery taste",
                "Hand-cracked and hand-sorted",
                "No polish, no preservatives"
            ),
            { title: "How to Use", body: "Eat 2-3 kernels as a snack, soak overnight, or add to breakfast, salads, cakes and desserts." },
            { title: "Storage", body: "Airtight jar. Keep in the fridge after opening - walnuts stay fresh much longer in the cold." },
            faqs(
                ["Why are some walnuts bitter?", "Old or badly stored walnuts turn bitter. Fresh, light kernels taste mild and buttery."],
                ["Light or dark kernels - which is better?", "Light kernels are fresher and milder. They are the premium grade."],
                ["Where do India's walnuts come from?", "Kashmir produces most of India's walnuts."]
            ),
        ],
        variants: [
            { label: "500g", weight: [500, "g"], price: 899, mrp: 899, stock: 45, sku: "WAL-KSH-500" },
            { label: "1kg", weight: [1, "kg"], price: 1699, mrp: 1699, stock: 45, sku: "WAL-KSH-1000" },
        ],
        delivery_days: [3, 5],
        frequently_bought_with: ["kashmiri-almonds-badam", "kashmir-wild-forest-honey"],
    },
    {
        slug: "diwali-dry-fruit-gift-box-kashmir",
        replaces: ["heritage-box"],
        name: "Heritage Box",
        heading: "Heritage Box - Kashmiri Kesar, Wild Honey & Dry Fruit Gift Box",
        tagline: "Four treasures of Kashmir, in one gift they will remember.",
        meta_title: "Diwali Dry Fruit Gift Box with Kashmiri Kesar | Heritage Box - Suvarna7",
        meta_description:
            "Premium Diwali gift box with Kashmiri kesar 1g, wild honey, almonds and walnuts in an elegant box. Corporate & bulk gifting available. Free delivery.",
        description:
            "Some gifts are opened and forgotten. Others are remembered. The Heritage Box brings together four treasures of Kashmir: kesar from our own fields in Pampore, dark wild honey from the hills, and fresh almonds and walnuts from the valley's orchards. Packed in an elegant keepsake box, it is a gift of heritage and care for the people who matter most.",
        origin: "Kashmir",
        processing: "Traditional",
        health_benefits: [],
        image: "/images/hampers/heritage-box.png",
        image_alt: "Heritage Diwali gift box with Kashmiri kesar honey almonds walnuts",
        is_bestseller: false,
        certifications: trustPoints("Kesar from our own farm", "Ready to gift - no wrapping needed"),
        info_sections: [
            {
                title: "What's Inside",
                items: [
                    { label: null, text: "Kashmiri Kesar - 1 g" },
                    { label: null, text: "Wild Dark Honey - 250 g" },
                    { label: null, text: "Kashmiri Almonds - 250 g" },
                    { label: null, text: "Kashmiri Walnut Kernels - 250 g" },
                ],
            },
            {
                title: "Perfect For",
                body: "Perfect for Diwali, weddings, housewarmings, thank-you gifts, and corporate gifts for clients and teams.",
            },
            { title: "Bulk Orders", body: "Bulk orders from 10 boxes. Free name card. Order on WhatsApp: +91 78893 17203." },
            faqs(
                [
                    "Can I order in bulk for my office?",
                    "Yes. We take orders from 10 boxes, with special corporate prices. WhatsApp us for a quote.",
                ],
                ["Can you add our company name card?", "Yes, a printed name card is free with bulk orders."],
                ["When should I order for Diwali?", "Order by 1 November for delivery before Diwali."]
            ),
        ],
        // Contents weigh about 750 g; 1 kg is the packed box's upper bound, used for shipping estimates.
        variants: [{ label: "1 Box", weight: [1, "kg"], price: 2049, mrp: 2049, stock: 45, sku: "GFT-HERITAGE" }],
        delivery_days: [3, 5],
        frequently_bought_with: ["kashmiri-kesar-saffron", "kashmir-wild-forest-honey"],
    },
];
