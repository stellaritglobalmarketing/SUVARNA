// Brings an existing store's products in line with the catalogue in seeds/data/catalog.js:
//   - renames products whose slug changed (keeps their id, images, reviews and order history)
//   - creates new products, updates names, prices, sizes and product-page content
//   - retires pack sizes and products that are no longer in the catalogue (hidden, not deleted)
//   - sets the home page's hamper tiles to seeds/data/store-data.js HAMPERS (the Heritage Box gift)
//     and hides the others (re-enable one from Admin → Content if you want it back)
// Banners, FAQs, testimonials and other home content are left alone.
// Everything runs in one transaction. Run `npm run db:migrate` first, then `npm run catalog:import`.
//
// `npm run catalog:import -- --stock 45` also sets every catalogue size's stock to 45.
import db from "../config/db.js";
import { PRODUCTS } from "../seeds/data/catalog.js";
import { HAMPERS } from "../seeds/data/store-data.js";
import { renameReplacedProducts, syncHampers, upsertProducts, upsertRelatedProducts } from "../seeds/products.js";

function stockArgument() {
    const index = process.argv.indexOf("--stock");
    if (index === -1) return null;
    const stock = Number(process.argv[index + 1]);
    if (!Number.isInteger(stock) || stock < 0) {
        throw new Error("--stock needs a whole number, e.g. --stock 45");
    }
    return stock;
}

async function importCatalog() {
    const stock = stockArgument();
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        await renameReplacedProducts(conn, PRODUCTS);
        const productIdBySlug = await upsertProducts(conn, PRODUCTS);
        await upsertRelatedProducts(conn, PRODUCTS, productIdBySlug);

        const slugs = PRODUCTS.map((p) => p.slug);
        const placeholders = slugs.map(() => "?").join(",");
        const [retiredRows] = await conn.query(
            `SELECT id, name FROM products WHERE is_delete = 0 AND is_active = 1 AND slug NOT IN (${placeholders})`,
            slugs
        );
        if (retiredRows.length > 0) {
            const ids = retiredRows.map((row) => row.id);
            const idList = ids.map(() => "?").join(",");
            await conn.query(`UPDATE products SET is_active = 0 WHERE id IN (${idList})`, ids);
            // Hamper themes and "frequently bought with" shouldn't point at products that are no longer sold.
            await conn.query(`DELETE FROM hamper_products WHERE product_id IN (${idList})`, ids);
            await conn.query(`DELETE FROM product_related WHERE related_product_id IN (${idList})`, ids);
            for (const row of retiredRows) console.log(`  hidden (not in catalogue): ${row.name}`);
        }

        await syncHampers(conn, HAMPERS, productIdBySlug);

        if (stock !== null) {
            const skus = PRODUCTS.flatMap((p) => p.variants.map((v) => v.sku));
            const [stocked] = await conn.query(
                `UPDATE inventory i JOIN product_variants pv ON pv.id = i.variant_id
                 SET i.stock_quantity = GREATEST(?, i.reserved_quantity)
                 WHERE pv.sku IN (${skus.map(() => "?").join(",")})`,
                [stock, ...skus]
            );
            console.log(`  stock set to ${stock} for ${stocked.affectedRows} size(s)`);
        }

        await conn.commit();

        const [newStock] = await conn.query(
            `SELECT p.name, pv.variant_name
             FROM product_variants pv
             JOIN products p ON p.id = pv.product_id
             LEFT JOIN inventory i ON i.variant_id = pv.id
             WHERE pv.is_delete = 0 AND pv.is_active = 1 AND p.is_active = 1 AND p.is_delete = 0 AND COALESCE(i.stock_quantity, 0) = 0
             ORDER BY p.sort_order, pv.id`
        );
        console.log(`✓ Catalogue imported: ${PRODUCTS.length} products`);
        if (newStock.length > 0) {
            console.log(`! ${newStock.length} size(s) have 0 stock and show as Sold Out until you add stock in Admin → Inventory:`);
            for (const row of newStock) console.log(`    ${row.name} — ${row.variant_name}`);
        }
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

importCatalog()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("✗ Catalogue import failed:", error.message);
        process.exit(1);
    });
