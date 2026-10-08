// Seeds the products, home page and product page content from seeds/data/store-data.js.
// Idempotent: rows are matched on their natural keys (slug / sku / question / ...) and
// updated in place, so it's safe to re-run after editing the data file. Inventory is only
// created, never overwritten, so a re-run can't clobber real stock levels.
// Run `npm run db:migrate` first, then `npm run seed`.
import db from "../config/db.js";
import {
    PRODUCTS,
    BANNERS,
    HIGHLIGHTS,
    HAMPERS,
    TESTIMONIALS,
    FAQS,
} from "./data/store-data.js";
import { syncHampers, upsertProducts, upsertRelatedProducts } from "./products.js";

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

        const productIdBySlug = await upsertProducts(conn, PRODUCTS);
        await upsertRelatedProducts(conn, PRODUCTS, productIdBySlug);
        await upsertBanners(conn);
        await upsertHighlights(conn);
        await syncHampers(conn, HAMPERS, productIdBySlug);
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
