// Prints `npm run catalog:import` as plain SQL, for a live database that is updated by pasting into
// phpMyAdmin (SQL tab) rather than by running the import on the server:
//
//     npm run -s catalog:sql > catalog.sql
//
// Mirrors seeds/products.js (renameReplacedProducts, upsertProducts, upsertRelatedProducts, syncHampers) and
// the retire step of scripts/import-catalog.js — keep them in step. Stock is never overwritten. Runs as one
// transaction; run `npm run db:migrate` (or paste the matching migration) first.
import mysql from "mysql2";
import { PRODUCTS } from "../seeds/data/catalog.js";
import { HAMPERS } from "../seeds/data/store-data.js";

const sql = (text, values = []) => `${mysql.format(text.replace(/\s+/g, " ").trim(), values)};`;
const list = (values) => values.map((v) => mysql.escape(v)).join(", ");
const productId = (slug) => `(SELECT id FROM products WHERE slug = ${mysql.escape(slug)})`;

const out = [
    `-- Catalogue import (backend/seeds/data/catalog.js), generated ${new Date().toISOString().slice(0, 10)} by npm run catalog:sql`,
    "START TRANSACTION;",
];

for (const p of PRODUCTS) {
    // Renamed products keep their id; skipped once the new slug exists.
    if (p.replaces?.length) {
        out.push(
            sql(
                `UPDATE products SET slug = ? WHERE slug IN (${list(p.replaces)})
                 AND NOT EXISTS (SELECT 1 FROM (SELECT slug FROM products) AS existing WHERE existing.slug = ?)
                 ORDER BY FIELD(slug, ${list(p.replaces)}) LIMIT 1`,
                [p.slug, p.slug]
            )
        );
    }
}

for (const [index, p] of PRODUCTS.entries()) {
    out.push("", `-- ${p.name} (/products/${p.slug})`);
    out.push(
        sql(
            `INSERT INTO products
                (name, tagline, heading, meta_title, meta_description, slug, short_description, description, brand_name,
                 origin, processing, delivery_min_days, delivery_max_days, is_featured, is_bestseller, sort_order, is_active, is_delete)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Suvarna7', ?, ?, ?, ?, 1, ?, ?, 1, 0)
             ON DUPLICATE KEY UPDATE
                name = VALUES(name), tagline = VALUES(tagline), heading = VALUES(heading),
                meta_title = VALUES(meta_title), meta_description = VALUES(meta_description),
                short_description = VALUES(short_description), description = VALUES(description),
                brand_name = VALUES(brand_name), origin = VALUES(origin), processing = VALUES(processing),
                delivery_min_days = VALUES(delivery_min_days), delivery_max_days = VALUES(delivery_max_days),
                is_featured = VALUES(is_featured), is_bestseller = VALUES(is_bestseller),
                sort_order = VALUES(sort_order), is_active = 1, is_delete = 0`,
            [
                p.name, p.tagline ?? null, p.heading ?? null, p.meta_title ?? null, p.meta_description ?? null, p.slug,
                p.short_description ?? p.meta_description ?? null, p.description, p.origin, p.processing,
                p.delivery_days[0], p.delivery_days[1], p.is_bestseller ? 1 : 0, index + 1,
            ]
        )
    );
    out.push(sql("SET @pid = ?", [{ toSqlString: () => productId(p.slug) }]));

    for (const [vIndex, v] of p.variants.entries()) {
        out.push(
            sql(
                `INSERT INTO product_variants
                    (product_id, variant_name, weight_value, weight_unit, sku, mrp, selling_price, is_default, is_active, is_delete)
                 VALUES (@pid, ?, ?, ?, ?, ?, ?, ?, 1, 0)
                 ON DUPLICATE KEY UPDATE
                    product_id = VALUES(product_id), variant_name = VALUES(variant_name),
                    weight_value = VALUES(weight_value), weight_unit = VALUES(weight_unit),
                    mrp = VALUES(mrp), selling_price = VALUES(selling_price),
                    is_default = VALUES(is_default), is_active = 1, is_delete = 0`,
                [v.label, v.weight[0], v.weight[1], v.sku, v.mrp, v.price, vIndex === 0 ? 1 : 0]
            )
        );
        out.push(
            sql(
                `INSERT IGNORE INTO inventory (variant_id, stock_quantity, reserved_quantity)
                 SELECT id, ?, 0 FROM product_variants WHERE sku = ?`,
                [v.stock, v.sku]
            )
        );
    }
    out.push(
        sql(
            `UPDATE product_variants SET is_active = 0, is_delete = 1, is_default = 0
             WHERE product_id = @pid AND is_delete = 0 AND sku NOT IN (${list(p.variants.map((v) => v.sku))})`
        )
    );

    const photos = p.image ? [{ url: p.image, alt: p.image_alt ?? p.name }, ...(p.more_images ?? [])] : [];
    for (const [index, photo] of photos.entries()) {
        out.push(
            sql(
                `INSERT INTO product_images (product_id, cloudinary_public_id, image_url, alt_text, sort_order, is_primary)
                 SELECT @pid, '', ?, ?, ?, ? FROM DUAL
                 WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = @pid AND image_url = ? AND is_delete = 0)`,
                [photo.url, photo.alt, index, index === 0 ? 1 : 0, photo.url]
            )
        );
        out.push(
            sql("UPDATE product_images SET alt_text = ? WHERE product_id = @pid AND image_url = ? AND is_delete = 0", [photo.alt, photo.url])
        );
    }

    out.push(sql("DELETE FROM product_certifications WHERE product_id = @pid"));
    if (p.certifications.length > 0) {
        out.push(
            sql("INSERT INTO product_certifications (product_id, label, description, sort_order) VALUES ?", [
                p.certifications.map((c, i) => [{ toSqlString: () => "@pid" }, c.label, c.description, i + 1]),
            ])
        );
    }

    out.push(sql("DELETE FROM product_health_benefits WHERE product_id = @pid"));
    if (p.health_benefits.length > 0) {
        out.push(
            sql("INSERT INTO product_health_benefits (product_id, benefit) VALUES ?", [
                p.health_benefits.map((b) => [{ toSqlString: () => "@pid" }, b]),
            ])
        );
    }

    out.push(sql("DELETE FROM product_info_sections WHERE product_id = @pid"));
    const sections = p.info_sections ?? [];
    if (sections.length > 0) {
        out.push(
            sql("INSERT INTO product_info_sections (product_id, title, body, items, sort_order) VALUES ?", [
                sections.map((s, i) => [
                    { toSqlString: () => "@pid" },
                    s.title,
                    s.body || null,
                    s.items?.length ? JSON.stringify(s.items) : null,
                    i + 1,
                ]),
            ])
        );
    }
}

out.push("", "-- Frequently bought together");
for (const p of PRODUCTS) {
    out.push(sql(`DELETE FROM product_related WHERE product_id = ${productId(p.slug)}`));
    for (const [i, slug] of p.frequently_bought_with.entries()) {
        out.push(
            sql(
                `INSERT INTO product_related (product_id, related_product_id, sort_order)
                 SELECT owner.id, related.id, ? FROM products owner JOIN products related ON related.slug = ? WHERE owner.slug = ?`,
                [i + 1, slug, p.slug]
            )
        );
    }
}

out.push("", "-- Products no longer in the catalogue are hidden, and dropped from hampers and \"frequently bought with\"");
// The links go first: once hidden, those products no longer match "is_active = 1".
const retired = `SELECT id FROM products WHERE is_delete = 0 AND is_active = 1 AND slug NOT IN (${list(PRODUCTS.map((p) => p.slug))})`;
out.push(sql(`DELETE FROM hamper_products WHERE product_id IN (${retired})`));
out.push(sql(`DELETE FROM product_related WHERE related_product_id IN (${retired})`));
out.push(sql(`UPDATE products SET is_active = 0 WHERE id IN (SELECT id FROM (${retired}) AS retired)`));

out.push("", "-- Home page hamper tiles");
for (const [index, h] of HAMPERS.entries()) {
    out.push(
        sql(
            `INSERT INTO hampers (name, slug, subtitle, image_url, sort_order) VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE name = VALUES(name), subtitle = VALUES(subtitle), image_url = VALUES(image_url),
                sort_order = VALUES(sort_order), is_active = 1, is_delete = 0`,
            [h.name, h.slug, h.subtitle, h.image_url, index + 1]
        )
    );
    out.push(sql("DELETE FROM hamper_products WHERE hamper_id = (SELECT id FROM hampers WHERE slug = ?)", [h.slug]));
    for (const [pIndex, slug] of h.product_slugs.entries()) {
        out.push(
            sql(
                `INSERT INTO hamper_products (hamper_id, product_id, sort_order)
                 SELECT h.id, p.id, ? FROM hampers h JOIN products p ON p.slug = ? WHERE h.slug = ?`,
                [pIndex + 1, slug, h.slug]
            )
        );
    }
}
out.push(
    sql(
        `UPDATE hampers SET is_active = 0 WHERE is_active = 1 AND is_delete = 0${HAMPERS.length ? ` AND slug NOT IN (${list(HAMPERS.map((h) => h.slug))})` : ""}`
    )
);

out.push("", "COMMIT;");
console.log(out.join("\n"));
