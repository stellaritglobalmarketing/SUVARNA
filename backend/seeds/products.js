// Writes the product catalogue (seeds/data/catalog.js) to the database. Shared by seeds/seed.js
// (fresh database) and scripts/import-catalog.js (bringing an existing store up to date).
// Idempotent: products match on slug, variants on SKU. Inventory is only created, never
// overwritten, so a re-run can't clobber real stock levels.
import { replaceInfoSections } from "../modules/v1/services/product-info-sections.js";

// Replaces one product's rows in a child table with `rows` (arrays of column values, in order).
export async function replaceProductRows(conn, table, productId, columns, rows) {
    await conn.query(`DELETE FROM ${table} WHERE product_id = ?`, [productId]);
    if (rows.length > 0) {
        await conn.query(`INSERT INTO ${table} (product_id, ${columns.join(", ")}) VALUES ?`, [
            rows.map((row) => [productId, ...row]),
        ]);
    }
}

/**
 * A product whose slug changed in the catalogue (`replaces`) is renamed in place, so it keeps its
 * id — and with it its images, reviews, wishlists and past orders. Skipped once the new slug exists.
 */
export async function renameReplacedProducts(conn, products) {
    let renamed = 0;
    for (const p of products) {
        if (!p.replaces) continue;
        const [[existing]] = await conn.query("SELECT id FROM products WHERE slug = ? LIMIT 1", [p.slug]);
        if (existing) continue;
        const [result] = await conn.query("UPDATE products SET slug = ? WHERE slug = ?", [p.slug, p.replaces]);
        if (result.affectedRows > 0) {
            renamed += 1;
            console.log(`  renamed ${p.replaces} → ${p.slug}`);
        }
    }
    return renamed;
}

export async function upsertProducts(conn, products) {
    const productIdBySlug = new Map();

    for (const [index, p] of products.entries()) {
        await conn.query(
            `INSERT INTO products
                (name, tagline, slug, short_description, description, brand_name, origin, processing,
                 delivery_min_days, delivery_max_days, is_featured, is_bestseller, sort_order, is_active, is_delete)
             VALUES (?, ?, ?, ?, ?, 'Suvarna7', ?, ?, ?, ?, 1, ?, ?, 1, 0)
             ON DUPLICATE KEY UPDATE
                name = VALUES(name), tagline = VALUES(tagline),
                short_description = VALUES(short_description), description = VALUES(description),
                brand_name = VALUES(brand_name), origin = VALUES(origin), processing = VALUES(processing),
                delivery_min_days = VALUES(delivery_min_days), delivery_max_days = VALUES(delivery_max_days),
                is_featured = VALUES(is_featured), is_bestseller = VALUES(is_bestseller),
                sort_order = VALUES(sort_order), is_active = 1, is_delete = 0`,
            [
                p.name, p.tagline ?? null, p.slug, p.short_description, p.description, p.origin, p.processing,
                p.delivery_days[0], p.delivery_days[1], p.is_bestseller ? 1 : 0, index + 1,
            ]
        );
        const [[{ id: productId }]] = await conn.query("SELECT id FROM products WHERE slug = ?", [p.slug]);
        productIdBySlug.set(p.slug, productId);

        const skus = p.variants.map((v) => v.sku);
        for (const [vIndex, v] of p.variants.entries()) {
            await conn.query(
                `INSERT INTO product_variants
                    (product_id, variant_name, weight_value, weight_unit, sku, mrp, selling_price, is_default, is_active, is_delete)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
                 ON DUPLICATE KEY UPDATE
                    product_id = VALUES(product_id), variant_name = VALUES(variant_name),
                    weight_value = VALUES(weight_value), weight_unit = VALUES(weight_unit),
                    mrp = VALUES(mrp), selling_price = VALUES(selling_price),
                    is_default = VALUES(is_default), is_active = 1, is_delete = 0`,
                [productId, v.label, v.weight[0], v.weight[1], v.sku, v.mrp, v.price, vIndex === 0 ? 1 : 0]
            );
            const [[{ id: variantId }]] = await conn.query("SELECT id FROM product_variants WHERE sku = ?", [v.sku]);
            await conn.query("INSERT IGNORE INTO inventory (variant_id, stock_quantity, reserved_quantity) VALUES (?, ?, 0)", [
                variantId,
                v.stock,
            ]);
        }

        // Pack sizes no longer in the catalogue stop being sold. Soft-deleted, so past orders keep their line items.
        const [retired] = await conn.query(
            `UPDATE product_variants SET is_active = 0, is_delete = 1, is_default = 0
             WHERE product_id = ? AND is_delete = 0 AND sku NOT IN (${skus.map(() => "?").join(",")})`,
            [productId, ...skus]
        );

        if (p.image) {
            const [existingImage] = await conn.query(
                "SELECT id FROM product_images WHERE product_id = ? AND image_url = ? AND is_delete = 0 LIMIT 1",
                [productId, p.image]
            );
            if (existingImage.length === 0) {
                // Bundled static asset served by the frontend, not a Cloudinary upload — hence no public id.
                await conn.query(
                    `INSERT INTO product_images (product_id, cloudinary_public_id, image_url, alt_text, sort_order, is_primary)
                     VALUES (?, '', ?, ?, 0, 1)`,
                    [productId, p.image, p.name]
                );
            }
        }

        // Product-page content lives in its own tables, one row per item.
        await replaceProductRows(
            conn, "product_certifications", productId, ["label", "description", "sort_order"],
            p.certifications.map((c, i) => [c.label, c.description, i + 1])
        );
        await replaceProductRows(conn, "product_health_benefits", productId, ["benefit"], p.health_benefits.map((b) => [b]));
        await replaceInfoSections(
            conn,
            productId,
            (p.info_sections ?? []).map((section) => ({ title: section.title, body: section.body ?? null, items: section.items ?? [] }))
        );

        const retiredNote = retired.affectedRows ? `, ${retired.affectedRows} old size(s) retired` : "";
        console.log(`  product ${index + 1}/${products.length}: ${p.name} (${p.variants.length} variants${retiredNote})`);
    }

    return productIdBySlug;
}

// Second pass: "frequently bought with" can point at any product, so all ids must exist first.
export async function upsertRelatedProducts(conn, products, productIdBySlug) {
    for (const p of products) {
        const rows = p.frequently_bought_with.map((slug, i) => {
            const relatedId = productIdBySlug.get(slug);
            if (!relatedId) {
                throw new Error(`${p.slug} lists unknown frequently-bought product ${slug}`);
            }
            return [relatedId, i + 1];
        });
        await replaceProductRows(conn, "product_related", productIdBySlug.get(p.slug), ["related_product_id", "sort_order"], rows);
    }
    console.log(`  related products for ${products.length} products`);
}

/**
 * Makes the home page's hamper tiles exactly `hampers`: upserts each one with its products and
 * hides every other hamper (re-enable one from Admin → Content to show it again).
 */
export async function syncHampers(conn, hampers, productIdBySlug) {
    for (const [index, h] of hampers.entries()) {
        await conn.query(
            `INSERT INTO hampers (name, slug, subtitle, image_url, sort_order)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE name = VALUES(name), subtitle = VALUES(subtitle), image_url = VALUES(image_url),
                sort_order = VALUES(sort_order), is_active = 1, is_delete = 0`,
            [h.name, h.slug, h.subtitle, h.image_url, index + 1]
        );
        const [[{ id: hamperId }]] = await conn.query("SELECT id FROM hampers WHERE slug = ?", [h.slug]);

        await conn.query("DELETE FROM hamper_products WHERE hamper_id = ?", [hamperId]);
        for (const [pIndex, slug] of h.product_slugs.entries()) {
            const productId = productIdBySlug.get(slug);
            if (!productId) {
                throw new Error(`Hamper ${h.slug} references unknown product ${slug}`);
            }
            await conn.query("INSERT INTO hamper_products (hamper_id, product_id, sort_order) VALUES (?, ?, ?)", [hamperId, productId, pIndex + 1]);
        }
    }

    const slugs = hampers.map((h) => h.slug);
    const [hidden] = await conn.query(
        `UPDATE hampers SET is_active = 0 WHERE is_active = 1 AND is_delete = 0${slugs.length ? ` AND slug NOT IN (${slugs.map(() => "?").join(",")})` : ""}`,
        slugs
    );
    console.log(`  ${hampers.length} hamper(s)${hidden.affectedRows ? `, ${hidden.affectedRows} other(s) hidden` : ""}`);
}
