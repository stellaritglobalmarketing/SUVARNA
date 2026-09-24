// Seeds the catalog, home page and product page content from seeds/data/store-data.js.
// Idempotent: rows are matched on their natural keys (slug / sku / question / ...) and
// updated in place, so it's safe to re-run after editing the data file. Inventory is only
// created, never overwritten, so a re-run can't clobber real stock levels.
// Run `npm run db:migrate` first, then `npm run seed`.
import db from "../config/db.js";
import {
    CATEGORIES,
    PRODUCTS,
    BANNERS,
    HIGHLIGHTS,
    HAMPERS,
    TESTIMONIALS,
    FAQS,
} from "./data/store-data.js";

async function upsertCategories(conn) {
    const subCategoryIdBySlug = new Map();

    for (const [index, cat] of CATEGORIES.entries()) {
        await conn.query(
            `INSERT INTO categories (name, slug, description, is_featured, is_active, is_delete)
             VALUES (?, ?, ?, 1, 1, 0)
             ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), is_active = 1, is_delete = 0`,
            [cat.name, cat.slug, cat.description]
        );
        const [[{ id: categoryId }]] = await conn.query("SELECT id FROM categories WHERE slug = ?", [cat.slug]);

        await conn.query(
            `INSERT INTO sub_categories (category_id, name, slug, description, is_active, is_delete)
             VALUES (?, ?, ?, ?, 1, 0)
             ON DUPLICATE KEY UPDATE category_id = VALUES(category_id), name = VALUES(name), is_active = 1, is_delete = 0`,
            [categoryId, cat.name, cat.slug, cat.description]
        );
        const [[{ id: subId }]] = await conn.query("SELECT id FROM sub_categories WHERE slug = ?", [cat.slug]);
        subCategoryIdBySlug.set(cat.slug, subId);

        console.log(`  category ${index + 1}/${CATEGORIES.length}: ${cat.name}`);
    }

    return subCategoryIdBySlug;
}

// Replaces one product's rows in a child table with `rows` (arrays of column values, in order).
async function replaceProductRows(conn, table, productId, columns, rows) {
    await conn.query(`DELETE FROM ${table} WHERE product_id = ?`, [productId]);
    if (rows.length > 0) {
        await conn.query(`INSERT INTO ${table} (product_id, ${columns.join(", ")}) VALUES ?`, [
            rows.map((row) => [productId, ...row]),
        ]);
    }
}

async function upsertProducts(conn, subCategoryIdBySlug) {
    const productIdBySlug = new Map();
    const tipsByCategory = new Map(CATEGORIES.map((cat) => [cat.slug, cat.tips]));

    for (const [index, p] of PRODUCTS.entries()) {
        const subCategoryId = subCategoryIdBySlug.get(p.category);
        if (!subCategoryId) {
            throw new Error(`Unknown category "${p.category}" for product ${p.slug}`);
        }

        await conn.query(
            `INSERT INTO products
                (sub_category_id, name, slug, short_description, description, brand_name, origin, processing,
                 delivery_min_days, delivery_max_days, is_featured, is_bestseller, sort_order, is_active, is_delete)
             VALUES (?, ?, ?, ?, ?, 'Suvarna7', ?, ?, ?, ?, 1, ?, ?, 1, 0)
             ON DUPLICATE KEY UPDATE
                sub_category_id = VALUES(sub_category_id), name = VALUES(name),
                short_description = VALUES(short_description), description = VALUES(description),
                brand_name = VALUES(brand_name), origin = VALUES(origin), processing = VALUES(processing),
                delivery_min_days = VALUES(delivery_min_days), delivery_max_days = VALUES(delivery_max_days),
                is_featured = VALUES(is_featured), is_bestseller = VALUES(is_bestseller),
                sort_order = VALUES(sort_order), is_active = 1, is_delete = 0`,
            [
                subCategoryId, p.name, p.slug, p.short_description, p.description, p.origin, p.processing,
                p.delivery_days[0], p.delivery_days[1], p.is_bestseller ? 1 : 0, index + 1,
            ]
        );
        const [[{ id: productId }]] = await conn.query("SELECT id FROM products WHERE slug = ?", [p.slug]);
        productIdBySlug.set(p.slug, productId);

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

            await conn.query(
                "INSERT IGNORE INTO inventory (variant_id, stock_quantity, reserved_quantity) VALUES (?, ?, 0)",
                [variantId, v.stock]
            );
        }

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

        // Product-page content lives in its own tables, one row per item.
        await replaceProductRows(
            conn, "product_nutrients", productId, ["label", "value_per_100g", "daily_value_percent", "sort_order"],
            p.nutrients.map((n, i) => [n.label, n.value_per_100g, n.daily_value_percent ?? null, i + 1])
        );
        await replaceProductRows(
            conn, "product_lipid_profile", productId, ["label", "percent", "color", "sort_order"],
            p.lipid_profile.map((l, i) => [l.label, l.percent, l.color, i + 1])
        );
        await replaceProductRows(
            conn, "product_certifications", productId, ["label", "description", "sort_order"],
            p.certifications.map((c, i) => [c.label, c.description, i + 1])
        );
        await replaceProductRows(conn, "product_health_benefits", productId, ["benefit"], p.health_benefits.map((b) => [b]));

        const tips = tipsByCategory.get(p.category);
        await conn.query("DELETE FROM product_storage_tips WHERE product_id = ?", [productId]);
        if (tips) {
            await conn.query(
                "INSERT INTO product_storage_tips (product_id, shelf_life_tip, storage_tip, usage_tip) VALUES (?, ?, ?, ?)",
                [productId, tips.shelf_life, tips.storage, tips.usage]
            );
        }

        console.log(`  product ${index + 1}/${PRODUCTS.length}: ${p.name} (${p.variants.length} variants)`);
    }

    return productIdBySlug;
}

// Second pass: "frequently bought with" can point at any product, so all ids must exist first.
async function upsertRelatedProducts(conn, productIdBySlug) {
    for (const p of PRODUCTS) {
        const rows = p.frequently_bought_with.map((slug, i) => {
            const relatedId = productIdBySlug.get(slug);
            if (!relatedId) {
                throw new Error(`${p.slug} lists unknown frequently-bought product ${slug}`);
            }
            return [relatedId, i + 1];
        });
        await replaceProductRows(conn, "product_related", productIdBySlug.get(p.slug), ["related_product_id", "sort_order"], rows);
    }
    console.log(`  related products for ${PRODUCTS.length} products`);
}

async function upsertBanners(conn) {
    for (const [index, b] of BANNERS.entries()) {
        const values = [
            b.eyebrow, b.subtitle, b.image_url, b.image_alt, b.cta_label, b.cta_href,
            b.secondary_cta_label, b.secondary_cta_href, index + 1,
        ];
        const [existing] = await conn.query(
            "SELECT id FROM home_banners WHERE placement = ? AND title = ? AND is_delete = 0 LIMIT 1",
            [b.placement, b.title]
        );
        if (existing.length > 0) {
            await conn.query(
                `UPDATE home_banners SET eyebrow = ?, subtitle = ?, image_url = ?, image_alt = ?, cta_label = ?, cta_href = ?,
                    secondary_cta_label = ?, secondary_cta_href = ?, sort_order = ?, is_active = 1
                 WHERE id = ?`,
                [...values, existing[0].id]
            );
        } else {
            await conn.query(
                `INSERT INTO home_banners (placement, title, eyebrow, subtitle, image_url, image_alt, cta_label, cta_href,
                    secondary_cta_label, secondary_cta_href, sort_order)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [b.placement, b.title, ...values]
            );
        }
    }
    console.log(`  ${BANNERS.length} banners`);
}

async function upsertHighlights(conn) {
    for (const [index, h] of HIGHLIGHTS.entries()) {
        await conn.query(
            `INSERT INTO home_highlights (placement, icon, title, description, sort_order)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE icon = VALUES(icon), description = VALUES(description),
                sort_order = VALUES(sort_order), is_active = 1, is_delete = 0`,
            [h.placement, h.icon, h.title, h.description, index + 1]
        );
    }
    console.log(`  ${HIGHLIGHTS.length} highlights`);
}

async function upsertHampers(conn, productIdBySlug) {
    for (const [index, h] of HAMPERS.entries()) {
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
            await conn.query(
                "INSERT INTO hamper_products (hamper_id, product_id, sort_order) VALUES (?, ?, ?)",
                [hamperId, productId, pIndex + 1]
            );
        }
    }
    console.log(`  ${HAMPERS.length} hampers`);
}

async function upsertTestimonials(conn) {
    for (const [index, t] of TESTIMONIALS.entries()) {
        await conn.query(
            `INSERT INTO testimonials (customer_name, location, rating, quote, sort_order)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE location = VALUES(location), rating = VALUES(rating), quote = VALUES(quote),
                sort_order = VALUES(sort_order), is_active = 1, is_delete = 0`,
            [t.customer_name, t.location, t.rating, t.quote, index + 1]
        );
    }
    console.log(`  ${TESTIMONIALS.length} testimonials`);
}

async function upsertFaqs(conn) {
    for (const [index, f] of FAQS.entries()) {
        await conn.query(
            `INSERT INTO faqs (question, answer, sort_order)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE answer = VALUES(answer), sort_order = VALUES(sort_order), is_active = 1, is_delete = 0`,
            [f.question, f.answer, index + 1]
        );
    }
    console.log(`  ${FAQS.length} FAQs`);
}

async function seed() {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const subCategoryIdBySlug = await upsertCategories(conn);
        const productIdBySlug = await upsertProducts(conn, subCategoryIdBySlug);
        await upsertRelatedProducts(conn, productIdBySlug);
        await upsertBanners(conn);
        await upsertHighlights(conn);
        await upsertHampers(conn, productIdBySlug);
        await upsertTestimonials(conn);
        await upsertFaqs(conn);

        await conn.commit();
        console.log("✓ Store data seeded");
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

seed()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("✗ Seed failed:", error.message);
        process.exit(1);
    });
