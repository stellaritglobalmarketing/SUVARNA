// Clears test data before going live, keeping only the catalogue in seeds/data/catalog.js.
// Run `npm run catalog:import` first (it creates/updates the catalogue products and hampers), then:
//
//   npm run store:reset -- --yes
//
// Deletes, permanently and in one transaction:
//   - every order, order item, payment, shipment, tracking scan and shipping webhook event
//     (order numbers start again from 0001)
//   - every customer account with its addresses, cart, wishlist, reviews and sessions
//   - every admin except those listed with --keep-admin (default: admin@suvarna.com)
//   - products and pack sizes that aren't in the catalogue, and soft-deleted product photos
//   - the retired nutrient / lipid profile / storage tip tables' rows (no longer shown on the site)
//   - every gift hamper except the catalogue's (heritage-box)
// Banners, highlights, FAQs and testimonials are left alone. Take a database backup first.
import db from "../config/db.js";
import { PRODUCTS } from "../seeds/data/catalog.js";
import { HAMPERS } from "../seeds/data/store-data.js";

function parseArgs(argv) {
    const keepAdmins = [];
    let confirmed = false;
    for (let i = 0; i < argv.length; i += 1) {
        if (argv[i] === "--yes") confirmed = true;
        if (argv[i] === "--keep-admin" && argv[i + 1]) keepAdmins.push(argv[(i += 1)].trim().toLowerCase());
    }
    return { confirmed, keepAdmins: keepAdmins.length ? keepAdmins : ["admin@suvarna.com"] };
}

const inList = (values) => values.map(() => "?").join(",");

async function main() {
    const { confirmed, keepAdmins } = parseArgs(process.argv.slice(2));
    if (!confirmed) {
        throw new Error("This permanently deletes orders, customers and non-catalogue products. Re-run with --yes to continue.");
    }

    const slugs = PRODUCTS.map((p) => p.slug);
    const skus = PRODUCTS.flatMap((p) => p.variants.map((v) => v.sku));
    const hamperSlugs = HAMPERS.map((h) => h.slug);

    const conn = await db.getConnection();
    try {
        // Every catalogue product must already exist, or this would delete a product the import should have made.
        const [present] = await conn.query(`SELECT slug FROM products WHERE slug IN (${inList(slugs)}) AND is_delete = 0`, slugs);
        const missing = slugs.filter((slug) => !present.some((row) => row.slug === slug));
        if (missing.length) {
            throw new Error(`Run \`npm run catalog:import\` first — missing catalogue products: ${missing.join(", ")}`);
        }
        const [admins] = await conn.query(`SELECT id FROM admins WHERE email IN (${inList(keepAdmins)})`, keepAdmins);
        if (admins.length === 0) {
            throw new Error(`None of the admins to keep exist (${keepAdmins.join(", ")}). Create one with \`npm run admin:create\` first.`);
        }

        await conn.beginTransaction();
        const report = {};
        const run = async (name, sql, params = []) => {
            const [result] = await conn.query(sql, params);
            report[name] = (report[name] || 0) + result.affectedRows;
        };

        // Orders and everything hanging off them
        await run("shipment scans", "DELETE FROM shipment_tracking");
        await run("shipping webhook events", "DELETE FROM shipping_webhook_events");
        await run("shipments", "DELETE FROM shipments");
        await run("payments", "DELETE FROM payments");
        await run("reviews", "DELETE FROM reviews");
        await run("order items", "DELETE FROM order_items");
        await run("orders", "DELETE FROM orders");
        // With no orders left, nothing is holding stock.
        await conn.query("UPDATE inventory SET reserved_quantity = 0");

        // Customers
        await run("carts", "DELETE FROM cart");
        await run("wishlist entries", "DELETE FROM wishlist");
        await run("addresses", "DELETE FROM addresses");
        await run("customer sessions", "DELETE FROM user_devices WHERE role <> 'admin'");
        await run("customers", "DELETE FROM users");

        // Admins
        const keepIds = admins.map((a) => a.id);
        await run("admin sessions", `DELETE FROM user_devices WHERE role = 'admin' AND user_id NOT IN (${inList(keepIds)})`, keepIds);
        await run("admins", `DELETE FROM admins WHERE id NOT IN (${inList(keepIds)})`, keepIds);

        // Products and pack sizes outside the catalogue
        const [oldProducts] = await conn.query(`SELECT id FROM products WHERE slug NOT IN (${inList(slugs)})`, slugs);
        const oldIds = oldProducts.map((p) => p.id);
        const [oldVariants] = await conn.query(
            `SELECT id FROM product_variants WHERE sku NOT IN (${inList(skus)})${oldIds.length ? ` OR product_id IN (${inList(oldIds)})` : ""}`,
            [...skus, ...oldIds]
        );
        const oldVariantIds = oldVariants.map((v) => v.id);
        if (oldVariantIds.length) {
            await run("inventory rows", `DELETE FROM inventory WHERE variant_id IN (${inList(oldVariantIds)})`, oldVariantIds);
            await run("pack sizes", `DELETE FROM product_variants WHERE id IN (${inList(oldVariantIds)})`, oldVariantIds);
        }
        if (oldIds.length) {
            await run("product photos", `DELETE FROM product_images WHERE product_id IN (${inList(oldIds)})`, oldIds);
            // Child content tables cascade from products.
            await run("products", `DELETE FROM products WHERE id IN (${inList(oldIds)})`, oldIds);
        }
        await run("product photos", "DELETE FROM product_images WHERE is_delete = 1");
        await run("retired nutrient rows", "DELETE FROM product_nutrients");
        await run("retired lipid profile rows", "DELETE FROM product_lipid_profile");
        await run("retired storage tips", "DELETE FROM product_storage_tips");

        // Hampers
        await run("hampers", `DELETE FROM hampers WHERE slug NOT IN (${inList(hamperSlugs)})`, hamperSlugs);

        await conn.commit();
        // Order numbers come from the order id. ALTER TABLE commits implicitly, so it runs after the transaction.
        await conn.query("ALTER TABLE orders AUTO_INCREMENT = 1");

        console.log("✓ Store reset. Removed:");
        Object.entries(report).forEach(([name, count]) => console.log(`  ${String(count).padStart(5)}  ${name}`));
        const [[counts]] = await conn.query(
            `SELECT (SELECT COUNT(*) FROM products) AS products, (SELECT COUNT(*) FROM product_variants) AS pack_sizes,
                    (SELECT COUNT(*) FROM hampers) AS hampers, (SELECT COUNT(*) FROM admins) AS admins`
        );
        console.log(`  Left: ${counts.products} products, ${counts.pack_sizes} pack sizes, ${counts.hampers} hamper(s), ${counts.admins} admin(s).`);
    } catch (error) {
        await conn.rollback().catch(() => {});
        throw error;
    } finally {
        conn.release();
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(`✗ ${error.message}`);
        process.exit(1);
    });
