-- ============================================================================================
-- Live database updates for Suvarna7
-- ============================================================================================
-- How to use: open the live database in phpMyAdmin → SQL tab → paste ONE block below → Go.
-- Run each block only once, oldest first. Every block is also safe if it gets run twice.
-- Each block also records itself in `schema_migrations`, so `npm run db:migrate` on the
-- server won't apply the same change again.
-- ============================================================================================


-- --------------------------------------------------------------------------------------------
-- 2026-10-26 · Kashmir Saffron: new product photo (jar + red box), the only photo on the page
-- Needs the site deployed first, so /images/products/kashmir-saffron.webp exists.
-- Old photos are hidden (is_delete = 1), not removed. The product video stays.
-- --------------------------------------------------------------------------------------------

UPDATE `product_images` pi
JOIN `products` p ON p.`id` = pi.`product_id`
SET pi.`is_delete` = 1, pi.`is_primary` = 0
WHERE p.`slug` IN ('kashmir-saffron', 'kashmiri-mongra-saffron', 'kashmiri-kesar-saffron')
  AND pi.`media_type` = 'image'
  AND pi.`image_url` <> '/images/products/kashmir-saffron.webp';

INSERT INTO `product_images` (`product_id`, `cloudinary_public_id`, `image_url`, `alt_text`, `sort_order`, `is_primary`)
SELECT p.`id`, '', '/images/products/kashmir-saffron.webp', p.`name`, 0, 1
FROM `products` p
WHERE p.`slug` IN ('kashmir-saffron', 'kashmiri-mongra-saffron', 'kashmiri-kesar-saffron')
  AND NOT EXISTS (
    SELECT 1 FROM `product_images` pi
    WHERE pi.`product_id` = p.`id` AND pi.`image_url` = '/images/products/kashmir-saffron.webp' AND pi.`is_delete` = 0
  );

INSERT IGNORE INTO `schema_migrations` (`filename`) VALUES ('012_kashmir_saffron_photo.sql');


-- --------------------------------------------------------------------------------------------
-- 2026-10-26 · "Product Pages, Stories & SEO" PDF: new prices (free delivery), new product URLs,
-- page headings, hook lines, trust points, story, highlights, how to use, storage, FAQs,
-- Google titles/descriptions, image alt text, no health-claim tags, and the top banner text.
-- Run AFTER the saffron photo block above, and after the site is deployed (old URLs redirect).
-- Stock is not changed. Part 1 changes the table structure; paste parts 1 and 2 together.
-- --------------------------------------------------------------------------------------------

-- Part 1 of 2 — migration 013_product_seo_and_banner.sql
ALTER TABLE `products`
  ADD COLUMN IF NOT EXISTS `heading` varchar(160) DEFAULT NULL COMMENT 'H1 on the product page; falls back to name' AFTER `tagline`,
  ADD COLUMN IF NOT EXISTS `meta_title` varchar(160) DEFAULT NULL COMMENT 'Google result title' AFTER `heading`,
  ADD COLUMN IF NOT EXISTS `meta_description` varchar(320) DEFAULT NULL COMMENT 'Google result description' AFTER `meta_title`;

INSERT IGNORE INTO `store_settings` (`setting_key`, `setting_value`)
VALUES ('announcement_text', 'FREE Delivery Across India · Diwali orders: order by 1 Nov');

INSERT IGNORE INTO `schema_migrations` (`filename`) VALUES ('013_product_seo_and_banner.sql');

-- Part 2 of 2 — product catalogue (same as `npm run catalog:import`)
-- Catalogue import (backend/seeds/data/catalog.js), generated 2026-10-26 by npm run catalog:sql
START TRANSACTION;
UPDATE products SET slug = 'kashmiri-kesar-saffron' WHERE slug IN ('kashmir-saffron', 'kashmiri-mongra-saffron') AND NOT EXISTS (SELECT 1 FROM (SELECT slug FROM products) AS existing WHERE existing.slug = 'kashmiri-kesar-saffron') ORDER BY FIELD(slug, 'kashmir-saffron', 'kashmiri-mongra-saffron') LIMIT 1;
UPDATE products SET slug = 'kashmir-wild-forest-honey' WHERE slug IN ('kashmir-wild-dark-honey', 'raw-forest-honey') AND NOT EXISTS (SELECT 1 FROM (SELECT slug FROM products) AS existing WHERE existing.slug = 'kashmir-wild-forest-honey') ORDER BY FIELD(slug, 'kashmir-wild-dark-honey', 'raw-forest-honey') LIMIT 1;
UPDATE products SET slug = 'buffalo-bilona-ghee' WHERE slug IN ('pure-buffalo-ghee') AND NOT EXISTS (SELECT 1 FROM (SELECT slug FROM products) AS existing WHERE existing.slug = 'buffalo-bilona-ghee') ORDER BY FIELD(slug, 'pure-buffalo-ghee') LIMIT 1;
UPDATE products SET slug = 'gir-cow-bilona-ghee' WHERE slug IN ('pure-cow-ghee') AND NOT EXISTS (SELECT 1 FROM (SELECT slug FROM products) AS existing WHERE existing.slug = 'gir-cow-bilona-ghee') ORDER BY FIELD(slug, 'pure-cow-ghee') LIMIT 1;
UPDATE products SET slug = 'kashmiri-almonds-badam' WHERE slug IN ('kashmiri-almonds', 'kashmir-mamra-almonds') AND NOT EXISTS (SELECT 1 FROM (SELECT slug FROM products) AS existing WHERE existing.slug = 'kashmiri-almonds-badam') ORDER BY FIELD(slug, 'kashmiri-almonds', 'kashmir-mamra-almonds') LIMIT 1;
UPDATE products SET slug = 'kashmiri-walnut-kernels-akhrot' WHERE slug IN ('kashmiri-walnut-kernels') AND NOT EXISTS (SELECT 1 FROM (SELECT slug FROM products) AS existing WHERE existing.slug = 'kashmiri-walnut-kernels-akhrot') ORDER BY FIELD(slug, 'kashmiri-walnut-kernels') LIMIT 1;
UPDATE products SET slug = 'diwali-dry-fruit-gift-box-kashmir' WHERE slug IN ('heritage-box') AND NOT EXISTS (SELECT 1 FROM (SELECT slug FROM products) AS existing WHERE existing.slug = 'diwali-dry-fruit-gift-box-kashmir') ORDER BY FIELD(slug, 'heritage-box') LIMIT 1;

-- Kashmir Saffron (/products/kashmiri-kesar-saffron)
INSERT INTO products (name, tagline, heading, meta_title, meta_description, slug, short_description, description, brand_name, origin, processing, delivery_min_days, delivery_max_days, is_featured, is_bestseller, sort_order, is_active, is_delete) VALUES ('Kashmir Saffron', 'Hand-picked at dawn from our own saffron fields in Pampore, Kashmir.', 'Kashmiri Kesar (Saffron) - Grown on Our Own Farm in Pampore', 'Kashmiri Kesar Original 1g | Pure Pampore Saffron - Suvarna7', 'Buy original Kashmiri kesar online. Grown on our own farm in Pampore, tested & packed by IIKSTC (Govt of J&K). Long Mongra threads. Free delivery across India.', 'kashmiri-kesar-saffron', 'Buy original Kashmiri kesar online. Grown on our own farm in Pampore, tested & packed by IIKSTC (Govt of J&K). Long Mongra threads. Free delivery across India.', 'Every October, our family walks into the purple saffron fields of Pampore before sunrise. Each flower is picked by hand, and only its three deep-red threads are kept. It takes about 1.5 lakh flowers to make one kilo. We dry the threads slowly, the traditional way, and send them for testing and packing at IIKSTC, Pampore, run by the Department of Agriculture, Govt of J&K. What reaches you is kesar from our own soil, not from a trader\'s warehouse.', 'Suvarna7', 'Kashmir', 'Traditional', 2, 4, 1, 0, 1, 1, 0) ON DUPLICATE KEY UPDATE name = VALUES(name), tagline = VALUES(tagline), heading = VALUES(heading), meta_title = VALUES(meta_title), meta_description = VALUES(meta_description), short_description = VALUES(short_description), description = VALUES(description), brand_name = VALUES(brand_name), origin = VALUES(origin), processing = VALUES(processing), delivery_min_days = VALUES(delivery_min_days), delivery_max_days = VALUES(delivery_max_days), is_featured = VALUES(is_featured), is_bestseller = VALUES(is_bestseller), sort_order = VALUES(sort_order), is_active = 1, is_delete = 0;
SET @pid = (SELECT id FROM products WHERE slug = 'kashmiri-kesar-saffron');
INSERT INTO product_variants (product_id, variant_name, weight_value, weight_unit, sku, mrp, selling_price, is_default, is_active, is_delete) VALUES (@pid, '1g', 1, 'g', 'SAF-KSH-1G', 699, 699, 1, 1, 0) ON DUPLICATE KEY UPDATE product_id = VALUES(product_id), variant_name = VALUES(variant_name), weight_value = VALUES(weight_value), weight_unit = VALUES(weight_unit), mrp = VALUES(mrp), selling_price = VALUES(selling_price), is_default = VALUES(is_default), is_active = 1, is_delete = 0;
INSERT IGNORE INTO inventory (variant_id, stock_quantity, reserved_quantity) SELECT id, 45, 0 FROM product_variants WHERE sku = 'SAF-KSH-1G';
INSERT INTO product_variants (product_id, variant_name, weight_value, weight_unit, sku, mrp, selling_price, is_default, is_active, is_delete) VALUES (@pid, '5g', 5, 'g', 'SAF-KSH-5G', 3299, 3299, 0, 1, 0) ON DUPLICATE KEY UPDATE product_id = VALUES(product_id), variant_name = VALUES(variant_name), weight_value = VALUES(weight_value), weight_unit = VALUES(weight_unit), mrp = VALUES(mrp), selling_price = VALUES(selling_price), is_default = VALUES(is_default), is_active = 1, is_delete = 0;
INSERT IGNORE INTO inventory (variant_id, stock_quantity, reserved_quantity) SELECT id, 45, 0 FROM product_variants WHERE sku = 'SAF-KSH-5G';
UPDATE product_variants SET is_active = 0, is_delete = 1, is_default = 0 WHERE product_id = @pid AND is_delete = 0 AND sku NOT IN ('SAF-KSH-1G', 'SAF-KSH-5G');
INSERT INTO product_images (product_id, cloudinary_public_id, image_url, alt_text, sort_order, is_primary) SELECT @pid, '', '/images/products/kashmir-saffron.webp', 'Original Kashmiri kesar Mongra saffron threads from Pampore farm', 0, 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = @pid AND image_url = '/images/products/kashmir-saffron.webp' AND is_delete = 0);
UPDATE product_images SET alt_text = 'Original Kashmiri kesar Mongra saffron threads from Pampore farm' WHERE product_id = @pid AND image_url = '/images/products/kashmir-saffron.webp' AND is_delete = 0;
DELETE FROM product_certifications WHERE product_id = @pid;
INSERT INTO product_certifications (product_id, label, description, sort_order) VALUES (@pid, 'Grown on our own farm', NULL, 1), (@pid, 'Tested & packed by IIKSTC, Pampore', NULL, 2), (@pid, 'Free delivery across India', NULL, 3);
DELETE FROM product_health_benefits WHERE product_id = @pid;
DELETE FROM product_info_sections WHERE product_id = @pid;
INSERT INTO product_info_sections (product_id, title, body, items, sort_order) VALUES (@pid, 'Highlights', NULL, '[{\"label\":null,\"text\":\"100% pure Mongra threads - long, deep red, no yellow style\"},{\"label\":null,\"text\":\"Crocin (colour strength) 200+\"},{\"label\":null,\"text\":\"No added colour, no mixing, no fillers\"},{\"label\":null,\"text\":\"Strong natural aroma and deep golden colour\"}]', 1), (@pid, 'How to Use', 'Soak 4-5 threads in 2 tbsp warm milk or water for 15 minutes. Add to kesar doodh, kheer, biryani, kahwa, halwa and festive sweets.', NULL, 2), (@pid, 'Storage', 'Airtight box, cool and dark place, away from moisture. Best within 24 months.', NULL, 3), (@pid, 'FAQs', NULL, '[{\"label\":\"How do I check if saffron is original?\",\"text\":\"Drop 2-3 threads in warm water. Original kesar slowly releases golden-yellow colour while the thread stays red. Fake saffron bleeds red colour instantly.\"},{\"label\":\"Why is Kashmiri saffron costlier?\",\"text\":\"Kashmir saffron grows only in a small area like Pampore, is hand-picked, and has longer, darker threads with stronger aroma.\"},{\"label\":\"How long will 1 gram last?\",\"text\":\"Using 4-5 threads a day, 1 gram lasts about 1-2 months.\"}]', 4);

-- Kashmir Acacia Honey (/products/kashmir-acacia-honey)
INSERT INTO products (name, tagline, heading, meta_title, meta_description, slug, short_description, description, brand_name, origin, processing, delivery_min_days, delivery_max_days, is_featured, is_bestseller, sort_order, is_active, is_delete) VALUES ('Kashmir Acacia Honey', 'Light, clear honey from the spring acacia blossoms of the Kashmir hills.', 'Pure Kashmir Acacia Honey - Raw, Light & Naturally Clear', 'Pure Acacia Honey from Kashmir | Raw & Unprocessed - Suvarna7', 'Pure Kashmir acacia honey - light, clear and naturally slow to crystallise. Single-flower, unprocessed, no added sugar. Free delivery across India.', 'kashmir-acacia-honey', 'Pure Kashmir acacia honey - light, clear and naturally slow to crystallise. Single-flower, unprocessed, no added sugar. Free delivery across India.', 'Each spring, the acacia trees on the hills of Kashmir burst into white blossom. Bees gather their nectar for only a few short weeks, and that is all the time we get. The honey is extracted gently, filtered only through cloth and packed without heating, so it keeps its natural taste. The result is a light, clear honey with a soft floral sweetness that does not overpower your tea.', 'Suvarna7', 'Kashmir', 'Raw', 2, 4, 1, 0, 2, 1, 0) ON DUPLICATE KEY UPDATE name = VALUES(name), tagline = VALUES(tagline), heading = VALUES(heading), meta_title = VALUES(meta_title), meta_description = VALUES(meta_description), short_description = VALUES(short_description), description = VALUES(description), brand_name = VALUES(brand_name), origin = VALUES(origin), processing = VALUES(processing), delivery_min_days = VALUES(delivery_min_days), delivery_max_days = VALUES(delivery_max_days), is_featured = VALUES(is_featured), is_bestseller = VALUES(is_bestseller), sort_order = VALUES(sort_order), is_active = 1, is_delete = 0;
SET @pid = (SELECT id FROM products WHERE slug = 'kashmir-acacia-honey');
INSERT INTO product_variants (product_id, variant_name, weight_value, weight_unit, sku, mrp, selling_price, is_default, is_active, is_delete) VALUES (@pid, '250g', 250, 'g', 'HNY-ACA-250', 419, 419, 1, 1, 0) ON DUPLICATE KEY UPDATE product_id = VALUES(product_id), variant_name = VALUES(variant_name), weight_value = VALUES(weight_value), weight_unit = VALUES(weight_unit), mrp = VALUES(mrp), selling_price = VALUES(selling_price), is_default = VALUES(is_default), is_active = 1, is_delete = 0;
INSERT IGNORE INTO inventory (variant_id, stock_quantity, reserved_quantity) SELECT id, 45, 0 FROM product_variants WHERE sku = 'HNY-ACA-250';
INSERT INTO product_variants (product_id, variant_name, weight_value, weight_unit, sku, mrp, selling_price, is_default, is_active, is_delete) VALUES (@pid, '500g', 500, 'g', 'HNY-ACA-500', 749, 749, 0, 1, 0) ON DUPLICATE KEY UPDATE product_id = VALUES(product_id), variant_name = VALUES(variant_name), weight_value = VALUES(weight_value), weight_unit = VALUES(weight_unit), mrp = VALUES(mrp), selling_price = VALUES(selling_price), is_default = VALUES(is_default), is_active = 1, is_delete = 0;
INSERT IGNORE INTO inventory (variant_id, stock_quantity, reserved_quantity) SELECT id, 45, 0 FROM product_variants WHERE sku = 'HNY-ACA-500';
INSERT INTO product_variants (product_id, variant_name, weight_value, weight_unit, sku, mrp, selling_price, is_default, is_active, is_delete) VALUES (@pid, '1kg', 1, 'kg', 'HNY-ACA-1000', 1399, 1399, 0, 1, 0) ON DUPLICATE KEY UPDATE product_id = VALUES(product_id), variant_name = VALUES(variant_name), weight_value = VALUES(weight_value), weight_unit = VALUES(weight_unit), mrp = VALUES(mrp), selling_price = VALUES(selling_price), is_default = VALUES(is_default), is_active = 1, is_delete = 0;
INSERT IGNORE INTO inventory (variant_id, stock_quantity, reserved_quantity) SELECT id, 45, 0 FROM product_variants WHERE sku = 'HNY-ACA-1000';
UPDATE product_variants SET is_active = 0, is_delete = 1, is_default = 0 WHERE product_id = @pid AND is_delete = 0 AND sku NOT IN ('HNY-ACA-250', 'HNY-ACA-500', 'HNY-ACA-1000');
INSERT INTO product_images (product_id, cloudinary_public_id, image_url, alt_text, sort_order, is_primary) SELECT @pid, '', '/images/products/kashmir-acacia-honey.png', 'Pure raw acacia honey from Kashmir in a glass jar', 0, 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = @pid AND image_url = '/images/products/kashmir-acacia-honey.png' AND is_delete = 0);
UPDATE product_images SET alt_text = 'Pure raw acacia honey from Kashmir in a glass jar' WHERE product_id = @pid AND image_url = '/images/products/kashmir-acacia-honey.png' AND is_delete = 0;
DELETE FROM product_certifications WHERE product_id = @pid;
INSERT INTO product_certifications (product_id, label, description, sort_order) VALUES (@pid, 'Single-flower acacia honey', NULL, 1), (@pid, 'No added sugar or syrup', NULL, 2), (@pid, 'Free delivery across India', NULL, 3);
DELETE FROM product_health_benefits WHERE product_id = @pid;
DELETE FROM product_info_sections WHERE product_id = @pid;
INSERT INTO product_info_sections (product_id, title, body, items, sort_order) VALUES (@pid, 'Highlights', NULL, '[{\"label\":null,\"text\":\"Single-flower acacia honey from Kashmir\"},{\"label\":null,\"text\":\"Raw - not heated, not processed\"},{\"label\":null,\"text\":\"No added sugar, syrup or preservatives\"},{\"label\":null,\"text\":\"Naturally slow to crystallise\"}]', 1), (@pid, 'How to Use', 'Stir into warm water, lemon water, green tea or milk. Drizzle on toast, fruit, yogurt and oats.', NULL, 2), (@pid, 'Storage', 'Room temperature, lid closed, dry spoon. Not for infants below 1 year.', NULL, 3), (@pid, 'FAQs', NULL, '[{\"label\":\"Why does acacia honey not freeze?\",\"text\":\"Acacia honey naturally has more fructose, so it stays liquid much longer than other honeys.\"},{\"label\":\"Is your honey raw?\",\"text\":\"Yes. It is not heated or processed. It is only filtered through cloth to remove wax.\"},{\"label\":\"Is acacia honey good for tea?\",\"text\":\"Yes. Its light, mild taste sweetens tea without changing the flavour.\"}]', 4);

-- Kashmir Wild Dark Honey (/products/kashmir-wild-forest-honey)
INSERT INTO products (name, tagline, heading, meta_title, meta_description, slug, short_description, description, brand_name, origin, processing, delivery_min_days, delivery_max_days, is_featured, is_bestseller, sort_order, is_active, is_delete) VALUES ('Kashmir Wild Dark Honey', 'Dark, bold honey from the wild flowering forests of the Kashmir hills.', 'Kashmir Wild Dark Honey - Raw Forest Honey from the Hills', 'Wild Forest Honey from Kashmir | Raw Dark Honey - Suvarna7', 'Raw wild forest honey from the Kashmir hills. Dark, rich and multi-floral with notes of caramel and wood. Unprocessed, no added sugar. Free delivery.', 'kashmir-wild-forest-honey', 'Raw wild forest honey from the Kashmir hills. Dark, rich and multi-floral with notes of caramel and wood. Unprocessed, no added sugar. Free delivery.', 'High above the villages, wild bees feed on hundreds of mountain flowers that nobody plants and nobody sprays. Their honey is dark amber, thick and full of character, with notes of caramel, wood and wild flowers. Every season tastes a little different, because the forest decides the flavour, not us.', 'Suvarna7', 'Kashmir', 'Raw', 2, 4, 1, 0, 3, 1, 0) ON DUPLICATE KEY UPDATE name = VALUES(name), tagline = VALUES(tagline), heading = VALUES(heading), meta_title = VALUES(meta_title), meta_description = VALUES(meta_description), short_description = VALUES(short_description), description = VALUES(description), brand_name = VALUES(brand_name), origin = VALUES(origin), processing = VALUES(processing), delivery_min_days = VALUES(delivery_min_days), delivery_max_days = VALUES(delivery_max_days), is_featured = VALUES(is_featured), is_bestseller = VALUES(is_bestseller), sort_order = VALUES(sort_order), is_active = 1, is_delete = 0;
SET @pid = (SELECT id FROM products WHERE slug = 'kashmir-wild-forest-honey');
INSERT INTO product_variants (product_id, variant_name, weight_value, weight_unit, sku, mrp, selling_price, is_default, is_active, is_delete) VALUES (@pid, '500g', 500, 'g', 'HNY-WLD-500', 1099, 1099, 1, 1, 0) ON DUPLICATE KEY UPDATE product_id = VALUES(product_id), variant_name = VALUES(variant_name), weight_value = VALUES(weight_value), weight_unit = VALUES(weight_unit), mrp = VALUES(mrp), selling_price = VALUES(selling_price), is_default = VALUES(is_default), is_active = 1, is_delete = 0;
INSERT IGNORE INTO inventory (variant_id, stock_quantity, reserved_quantity) SELECT id, 45, 0 FROM product_variants WHERE sku = 'HNY-WLD-500';
INSERT INTO product_variants (product_id, variant_name, weight_value, weight_unit, sku, mrp, selling_price, is_default, is_active, is_delete) VALUES (@pid, '1kg', 1, 'kg', 'HNY-WLD-1000', 2049, 2049, 0, 1, 0) ON DUPLICATE KEY UPDATE product_id = VALUES(product_id), variant_name = VALUES(variant_name), weight_value = VALUES(weight_value), weight_unit = VALUES(weight_unit), mrp = VALUES(mrp), selling_price = VALUES(selling_price), is_default = VALUES(is_default), is_active = 1, is_delete = 0;
INSERT IGNORE INTO inventory (variant_id, stock_quantity, reserved_quantity) SELECT id, 45, 0 FROM product_variants WHERE sku = 'HNY-WLD-1000';
UPDATE product_variants SET is_active = 0, is_delete = 1, is_default = 0 WHERE product_id = @pid AND is_delete = 0 AND sku NOT IN ('HNY-WLD-500', 'HNY-WLD-1000');
INSERT INTO product_images (product_id, cloudinary_public_id, image_url, alt_text, sort_order, is_primary) SELECT @pid, '', '/images/products/raw-forest-honey.webp', 'Raw wild dark forest honey from Kashmir hills', 0, 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = @pid AND image_url = '/images/products/raw-forest-honey.webp' AND is_delete = 0);
UPDATE product_images SET alt_text = 'Raw wild dark forest honey from Kashmir hills' WHERE product_id = @pid AND image_url = '/images/products/raw-forest-honey.webp' AND is_delete = 0;
DELETE FROM product_certifications WHERE product_id = @pid;
INSERT INTO product_certifications (product_id, label, description, sort_order) VALUES (@pid, 'Wild multi-floral forest honey', NULL, 1), (@pid, 'Raw & unprocessed', NULL, 2), (@pid, 'Free delivery across India', NULL, 3);
DELETE FROM product_health_benefits WHERE product_id = @pid;
DELETE FROM product_info_sections WHERE product_id = @pid;
INSERT INTO product_info_sections (product_id, title, body, items, sort_order) VALUES (@pid, 'Highlights', NULL, '[{\"label\":null,\"text\":\"Wild multi-floral honey from Kashmir forests\"},{\"label\":null,\"text\":\"Raw - not heated, not processed\"},{\"label\":null,\"text\":\"Dark amber colour, rich layered taste\"},{\"label\":null,\"text\":\"No added sugar or syrup\"}]', 1), (@pid, 'How to Use', 'Have a spoon in warm water in the morning, with herbal tea, on toast, or as a glaze in cooking.', NULL, 2), (@pid, 'Storage', 'Room temperature, dry spoon. Natural crystallisation is a sign of real honey - warm the jar in water to melt. Not for infants below 1 year.', NULL, 3), (@pid, 'FAQs', NULL, '[{\"label\":\"Why is wild honey dark?\",\"text\":\"It comes from many forest flowers, which gives it a darker colour and stronger taste than single-flower honey.\"},{\"label\":\"My honey became thick. Is it fake?\",\"text\":\"No. Real raw honey can crystallise in cold weather. Keep the jar in warm water and it turns liquid again.\"},{\"label\":\"Is it processed?\",\"text\":\"No. It is only cloth-filtered and packed without heating.\"}]', 4);

-- Buffalo Bilona Ghee (/products/buffalo-bilona-ghee)
INSERT INTO products (name, tagline, heading, meta_title, meta_description, slug, short_description, description, brand_name, origin, processing, delivery_min_days, delivery_max_days, is_featured, is_bestseller, sort_order, is_active, is_delete) VALUES ('Buffalo Bilona Ghee', 'Made from dahi, not cream - churned by hand and slow-cooked for a danedar grain.', 'Buffalo Bilona Ghee - Hand-Churned from Dahi, Never Cream', 'Buffalo Bilona Ghee | Hand-Churned Danedar Desi Ghee - Suvarna7', 'Pure buffalo bilona ghee made from dahi, never cream. Hand-churned, slow-cooked, danedar texture and rich aroma. No preservatives. Free delivery.', 'buffalo-bilona-ghee', 'Pure buffalo bilona ghee made from dahi, never cream. Hand-churned, slow-cooked, danedar texture and rich aroma. No preservatives. Free delivery.', 'Fresh buffalo milk is boiled and set into dahi overnight. In the morning, the dahi is churned in a wooden bilona until white makkhan rises to the top. This makkhan is slow-cooked over a gentle flame in small batches until it turns golden and forms its danedar grain. It takes far more milk and time than cream ghee, and you can taste the difference in the very first spoon.', 'Suvarna7', 'India', 'Traditional', 2, 4, 1, 0, 4, 1, 0) ON DUPLICATE KEY UPDATE name = VALUES(name), tagline = VALUES(tagline), heading = VALUES(heading), meta_title = VALUES(meta_title), meta_description = VALUES(meta_description), short_description = VALUES(short_description), description = VALUES(description), brand_name = VALUES(brand_name), origin = VALUES(origin), processing = VALUES(processing), delivery_min_days = VALUES(delivery_min_days), delivery_max_days = VALUES(delivery_max_days), is_featured = VALUES(is_featured), is_bestseller = VALUES(is_bestseller), sort_order = VALUES(sort_order), is_active = 1, is_delete = 0;
SET @pid = (SELECT id FROM products WHERE slug = 'buffalo-bilona-ghee');
INSERT INTO product_variants (product_id, variant_name, weight_value, weight_unit, sku, mrp, selling_price, is_default, is_active, is_delete) VALUES (@pid, '500g', 500, 'g', 'GHE-BUF-500', 949, 949, 1, 1, 0) ON DUPLICATE KEY UPDATE product_id = VALUES(product_id), variant_name = VALUES(variant_name), weight_value = VALUES(weight_value), weight_unit = VALUES(weight_unit), mrp = VALUES(mrp), selling_price = VALUES(selling_price), is_default = VALUES(is_default), is_active = 1, is_delete = 0;
INSERT IGNORE INTO inventory (variant_id, stock_quantity, reserved_quantity) SELECT id, 45, 0 FROM product_variants WHERE sku = 'GHE-BUF-500';
INSERT INTO product_variants (product_id, variant_name, weight_value, weight_unit, sku, mrp, selling_price, is_default, is_active, is_delete) VALUES (@pid, '1kg', 1, 'kg', 'GHE-BUF-1000G', 1799, 1799, 0, 1, 0) ON DUPLICATE KEY UPDATE product_id = VALUES(product_id), variant_name = VALUES(variant_name), weight_value = VALUES(weight_value), weight_unit = VALUES(weight_unit), mrp = VALUES(mrp), selling_price = VALUES(selling_price), is_default = VALUES(is_default), is_active = 1, is_delete = 0;
INSERT IGNORE INTO inventory (variant_id, stock_quantity, reserved_quantity) SELECT id, 45, 0 FROM product_variants WHERE sku = 'GHE-BUF-1000G';
UPDATE product_variants SET is_active = 0, is_delete = 1, is_default = 0 WHERE product_id = @pid AND is_delete = 0 AND sku NOT IN ('GHE-BUF-500', 'GHE-BUF-1000G');
INSERT INTO product_images (product_id, cloudinary_public_id, image_url, alt_text, sort_order, is_primary) SELECT @pid, '', '/images/products/pure-buffalo-ghee.webp', 'Danedar buffalo bilona desi ghee in a glass jar', 0, 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = @pid AND image_url = '/images/products/pure-buffalo-ghee.webp' AND is_delete = 0);
UPDATE product_images SET alt_text = 'Danedar buffalo bilona desi ghee in a glass jar' WHERE product_id = @pid AND image_url = '/images/products/pure-buffalo-ghee.webp' AND is_delete = 0;
DELETE FROM product_certifications WHERE product_id = @pid;
INSERT INTO product_certifications (product_id, label, description, sort_order) VALUES (@pid, '100% bilona method from dahi', NULL, 1), (@pid, 'Slow-cooked in small batches', NULL, 2), (@pid, 'Free delivery across India', NULL, 3);
DELETE FROM product_health_benefits WHERE product_id = @pid;
DELETE FROM product_info_sections WHERE product_id = @pid;
INSERT INTO product_info_sections (product_id, title, body, items, sort_order) VALUES (@pid, 'Highlights', NULL, '[{\"label\":null,\"text\":\"Made from dahi, never cream\"},{\"label\":null,\"text\":\"Hand-churned in a wooden bilona\"},{\"label\":null,\"text\":\"Danedar (grainy) texture, deep nutty aroma\"},{\"label\":null,\"text\":\"No preservatives, no added colour\"}]', 1), (@pid, 'How to Use', 'On hot roti, rice and dal, for tadka, parathas, halwa, laddoo and festive sweets.', NULL, 2), (@pid, 'Storage', 'Room temperature, lid closed, clean dry spoon. No fridge needed. Texture changes with season - a sign of real bilona ghee.', NULL, 3), (@pid, 'FAQs', NULL, '[{\"label\":\"What is bilona ghee?\",\"text\":\"Ghee made by churning dahi in a bilona to get makkhan, then slow-cooking it. Normal ghee is made directly from cream.\"},{\"label\":\"Buffalo ghee or cow ghee?\",\"text\":\"Buffalo ghee is whiter, thicker and richer - great for sweets and cooking. Gir cow ghee is golden with a lighter taste.\"},{\"label\":\"Why is it danedar?\",\"text\":\"Slow cooking of bilona makkhan forms natural grains. It is a sign of traditional ghee.\"}]', 4);

-- Gir Cow Bilona Ghee (/products/gir-cow-bilona-ghee)
INSERT INTO products (name, tagline, heading, meta_title, meta_description, slug, short_description, description, brand_name, origin, processing, delivery_min_days, delivery_max_days, is_featured, is_bestseller, sort_order, is_active, is_delete) VALUES ('Gir Cow Bilona Ghee', 'Golden ghee from the milk of desi Gir cows, churned from dahi the old way.', 'Gir Cow Bilona Ghee - From Desi Gir Cow Milk, Hand-Churned', 'Gir Cow Bilona Ghee | Pure Desi Cow Ghee, Hand-Churned - Suvarna7', 'Pure Gir cow bilona ghee from desi Gir cow milk. Made from dahi, never cream. Hand-churned, slow-cooked, golden and aromatic. Free delivery.', 'gir-cow-bilona-ghee', 'Pure Gir cow bilona ghee from desi Gir cow milk. Made from dahi, never cream. Hand-churned, slow-cooked, golden and aromatic. Free delivery.', 'The Gir is one of India\'s most loved native cow breeds, from the land of Saurashtra in Gujarat. Their milk is set into dahi, and only this dahi is churned in a wooden bilona until pure makkhan rises. The makkhan is slow-cooked over a gentle flame until it glows a natural golden colour and fills the kitchen with its sweet aroma. This is ghee the way our grandmothers made it.', 'Suvarna7', 'India', 'Traditional', 2, 4, 1, 1, 5, 1, 0) ON DUPLICATE KEY UPDATE name = VALUES(name), tagline = VALUES(tagline), heading = VALUES(heading), meta_title = VALUES(meta_title), meta_description = VALUES(meta_description), short_description = VALUES(short_description), description = VALUES(description), brand_name = VALUES(brand_name), origin = VALUES(origin), processing = VALUES(processing), delivery_min_days = VALUES(delivery_min_days), delivery_max_days = VALUES(delivery_max_days), is_featured = VALUES(is_featured), is_bestseller = VALUES(is_bestseller), sort_order = VALUES(sort_order), is_active = 1, is_delete = 0;
SET @pid = (SELECT id FROM products WHERE slug = 'gir-cow-bilona-ghee');
INSERT INTO product_variants (product_id, variant_name, weight_value, weight_unit, sku, mrp, selling_price, is_default, is_active, is_delete) VALUES (@pid, '500g', 500, 'g', 'GHE-GIR-500', 1499, 1499, 1, 1, 0) ON DUPLICATE KEY UPDATE product_id = VALUES(product_id), variant_name = VALUES(variant_name), weight_value = VALUES(weight_value), weight_unit = VALUES(weight_unit), mrp = VALUES(mrp), selling_price = VALUES(selling_price), is_default = VALUES(is_default), is_active = 1, is_delete = 0;
INSERT IGNORE INTO inventory (variant_id, stock_quantity, reserved_quantity) SELECT id, 45, 0 FROM product_variants WHERE sku = 'GHE-GIR-500';
INSERT INTO product_variants (product_id, variant_name, weight_value, weight_unit, sku, mrp, selling_price, is_default, is_active, is_delete) VALUES (@pid, '1kg', 1, 'kg', 'GHE-GIR-1000', 2849, 2849, 0, 1, 0) ON DUPLICATE KEY UPDATE product_id = VALUES(product_id), variant_name = VALUES(variant_name), weight_value = VALUES(weight_value), weight_unit = VALUES(weight_unit), mrp = VALUES(mrp), selling_price = VALUES(selling_price), is_default = VALUES(is_default), is_active = 1, is_delete = 0;
INSERT IGNORE INTO inventory (variant_id, stock_quantity, reserved_quantity) SELECT id, 45, 0 FROM product_variants WHERE sku = 'GHE-GIR-1000';
UPDATE product_variants SET is_active = 0, is_delete = 1, is_default = 0 WHERE product_id = @pid AND is_delete = 0 AND sku NOT IN ('GHE-GIR-500', 'GHE-GIR-1000');
INSERT INTO product_images (product_id, cloudinary_public_id, image_url, alt_text, sort_order, is_primary) SELECT @pid, '', '/images/products/pure-cow-ghee.webp', 'Golden Gir cow bilona ghee hand-churned from dahi', 0, 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = @pid AND image_url = '/images/products/pure-cow-ghee.webp' AND is_delete = 0);
UPDATE product_images SET alt_text = 'Golden Gir cow bilona ghee hand-churned from dahi' WHERE product_id = @pid AND image_url = '/images/products/pure-cow-ghee.webp' AND is_delete = 0;
DELETE FROM product_certifications WHERE product_id = @pid;
INSERT INTO product_certifications (product_id, label, description, sort_order) VALUES (@pid, 'Milk of desi Gir cows', NULL, 1), (@pid, '100% bilona method from dahi', NULL, 2), (@pid, 'Free delivery across India', NULL, 3);
DELETE FROM product_health_benefits WHERE product_id = @pid;
DELETE FROM product_info_sections WHERE product_id = @pid;
INSERT INTO product_info_sections (product_id, title, body, items, sort_order) VALUES (@pid, 'Highlights', NULL, '[{\"label\":null,\"text\":\"From the milk of desi Gir cows\"},{\"label\":null,\"text\":\"Made from dahi, never cream\"},{\"label\":null,\"text\":\"Hand-churned, slow-cooked in small batches\"},{\"label\":null,\"text\":\"Natural golden colour, no added colour\"}]', 1), (@pid, 'How to Use', 'A spoon on roti and dal, in warm milk, for tadka, khichdi, and traditional sweets.', NULL, 2), (@pid, 'Storage', 'Room temperature, lid closed, clean dry spoon. No fridge needed.', NULL, 3), (@pid, 'FAQs', NULL, '[{\"label\":\"Why is Gir cow ghee costly?\",\"text\":\"A Gir cow gives little milk, and bilona needs about 25-30 litres of milk for 1 kg of ghee.\"},{\"label\":\"Why is it golden yellow?\",\"text\":\"The natural golden colour comes from the cow\'s milk itself. Nothing is added.\"},{\"label\":\"Is this made from cream?\",\"text\":\"No. It is made only from dahi using the traditional bilona method.\"}]', 4);

-- Kashmiri Almonds (/products/kashmiri-almonds-badam)
INSERT INTO products (name, tagline, heading, meta_title, meta_description, slug, short_description, description, brand_name, origin, processing, delivery_min_days, delivery_max_days, is_featured, is_bestseller, sort_order, is_active, is_delete) VALUES ('Kashmiri Almonds', 'From the pink-blossom almond orchards of Kashmir, straight to your home.', 'Kashmiri Almonds (Badam) - Direct from Kashmir Orchards', 'Kashmiri Almonds (Badam) Online | Fresh from Kashmir - Suvarna7', 'Buy Kashmiri badam online, sourced directly from Kashmir farmers. Naturally rich in oil, fresh, crunchy. Perfect for soaking and Diwali gifting. Free delivery.', 'kashmiri-almonds-badam', 'Buy Kashmiri badam online, sourced directly from Kashmir farmers. Naturally rich in oil, fresh, crunchy. Perfect for soaking and Diwali gifting. Free delivery.', 'Every spring, the almond orchards of Kashmir turn soft pink with blossom. By late summer, local farming families harvest, dry and sort the nuts by hand. We buy directly from these families, so the almonds reach you fresh, without sitting for months in a big warehouse. Kashmiri badam is naturally oily and full of flavour - the kind you soak at night and peel in the morning.', 'Suvarna7', 'Kashmir', 'Raw', 2, 4, 1, 1, 6, 1, 0) ON DUPLICATE KEY UPDATE name = VALUES(name), tagline = VALUES(tagline), heading = VALUES(heading), meta_title = VALUES(meta_title), meta_description = VALUES(meta_description), short_description = VALUES(short_description), description = VALUES(description), brand_name = VALUES(brand_name), origin = VALUES(origin), processing = VALUES(processing), delivery_min_days = VALUES(delivery_min_days), delivery_max_days = VALUES(delivery_max_days), is_featured = VALUES(is_featured), is_bestseller = VALUES(is_bestseller), sort_order = VALUES(sort_order), is_active = 1, is_delete = 0;
SET @pid = (SELECT id FROM products WHERE slug = 'kashmiri-almonds-badam');
INSERT INTO product_variants (product_id, variant_name, weight_value, weight_unit, sku, mrp, selling_price, is_default, is_active, is_delete) VALUES (@pid, '500g', 500, 'g', 'ALM-MAM-500', 749, 749, 1, 1, 0) ON DUPLICATE KEY UPDATE product_id = VALUES(product_id), variant_name = VALUES(variant_name), weight_value = VALUES(weight_value), weight_unit = VALUES(weight_unit), mrp = VALUES(mrp), selling_price = VALUES(selling_price), is_default = VALUES(is_default), is_active = 1, is_delete = 0;
INSERT IGNORE INTO inventory (variant_id, stock_quantity, reserved_quantity) SELECT id, 45, 0 FROM product_variants WHERE sku = 'ALM-MAM-500';
INSERT INTO product_variants (product_id, variant_name, weight_value, weight_unit, sku, mrp, selling_price, is_default, is_active, is_delete) VALUES (@pid, '1kg', 1, 'kg', 'ALM-MAM-1000', 1399, 1399, 0, 1, 0) ON DUPLICATE KEY UPDATE product_id = VALUES(product_id), variant_name = VALUES(variant_name), weight_value = VALUES(weight_value), weight_unit = VALUES(weight_unit), mrp = VALUES(mrp), selling_price = VALUES(selling_price), is_default = VALUES(is_default), is_active = 1, is_delete = 0;
INSERT IGNORE INTO inventory (variant_id, stock_quantity, reserved_quantity) SELECT id, 45, 0 FROM product_variants WHERE sku = 'ALM-MAM-1000';
UPDATE product_variants SET is_active = 0, is_delete = 1, is_default = 0 WHERE product_id = @pid AND is_delete = 0 AND sku NOT IN ('ALM-MAM-500', 'ALM-MAM-1000');
INSERT INTO product_images (product_id, cloudinary_public_id, image_url, alt_text, sort_order, is_primary) SELECT @pid, '', '/images/products/kashmir-mamra-almonds.webp', 'Fresh Kashmiri almonds badam from Kashmir orchards', 0, 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = @pid AND image_url = '/images/products/kashmir-mamra-almonds.webp' AND is_delete = 0);
UPDATE product_images SET alt_text = 'Fresh Kashmiri almonds badam from Kashmir orchards' WHERE product_id = @pid AND image_url = '/images/products/kashmir-mamra-almonds.webp' AND is_delete = 0;
DELETE FROM product_certifications WHERE product_id = @pid;
INSERT INTO product_certifications (product_id, label, description, sort_order) VALUES (@pid, 'Direct from Kashmir farmers', NULL, 1), (@pid, 'Fresh this-season stock', NULL, 2), (@pid, 'Free delivery across India', NULL, 3);
DELETE FROM product_health_benefits WHERE product_id = @pid;
DELETE FROM product_info_sections WHERE product_id = @pid;
INSERT INTO product_info_sections (product_id, title, body, items, sort_order) VALUES (@pid, 'Highlights', NULL, '[{\"label\":null,\"text\":\"Sourced directly from Kashmir farmers\"},{\"label\":null,\"text\":\"Naturally rich in oil and flavour\"},{\"label\":null,\"text\":\"Hand-sorted, fresh crunch\"},{\"label\":null,\"text\":\"No polish, no added colour\"}]', 1), (@pid, 'How to Use', 'Soak 5-6 overnight and peel in the morning. Snack raw, add to milk, kheer, halwa and sweets.', NULL, 2), (@pid, 'Storage', 'Airtight jar in a cool, dry place. Keep in the fridge after opening for longer freshness.', NULL, 3), (@pid, 'FAQs', NULL, '[{\"label\":\"Why soak almonds?\",\"text\":\"Soaking softens them and makes them easier to eat and peel - a traditional Indian habit.\"},{\"label\":\"How are Kashmiri almonds different?\",\"text\":\"They are smaller, naturally oilier and have a richer taste than common imported almonds.\"},{\"label\":\"Is this good for gifting?\",\"text\":\"Yes. Almonds are the most popular Diwali dry fruit gift.\"}]', 4);

-- Kashmiri Walnut Kernels (/products/kashmiri-walnut-kernels-akhrot)
INSERT INTO products (name, tagline, heading, meta_title, meta_description, slug, short_description, description, brand_name, origin, processing, delivery_min_days, delivery_max_days, is_featured, is_bestseller, sort_order, is_active, is_delete) VALUES ('Kashmiri Walnut Kernels', 'Light, buttery walnut kernels from the old walnut trees of Kashmir.', 'Kashmiri Walnut Kernels (Akhrot Giri) - Fresh from the Valley', 'Kashmiri Walnut Kernels (Akhrot Giri) | Light Halves - Suvarna7', 'Fresh Kashmiri akhrot giri, direct from Kashmir farmers. Light-coloured kernels with a mild, buttery taste, not bitter. Free delivery across India.', 'kashmiri-walnut-kernels-akhrot', 'Fresh Kashmiri akhrot giri, direct from Kashmir farmers. Light-coloured kernels with a mild, buttery taste, not bitter. Free delivery across India.', 'Walnut trees in Kashmir are often older than the families who care for them. Every autumn the nuts are shaken down, dried in the sun, cracked by hand and sorted kernel by kernel. We pick light-coloured kernels with a mild, buttery taste, because fresh walnuts should never taste bitter. Kashmir grows most of India\'s walnuts, and these come straight from the valley to you.', 'Suvarna7', 'Kashmir', 'Raw', 3, 5, 1, 1, 7, 1, 0) ON DUPLICATE KEY UPDATE name = VALUES(name), tagline = VALUES(tagline), heading = VALUES(heading), meta_title = VALUES(meta_title), meta_description = VALUES(meta_description), short_description = VALUES(short_description), description = VALUES(description), brand_name = VALUES(brand_name), origin = VALUES(origin), processing = VALUES(processing), delivery_min_days = VALUES(delivery_min_days), delivery_max_days = VALUES(delivery_max_days), is_featured = VALUES(is_featured), is_bestseller = VALUES(is_bestseller), sort_order = VALUES(sort_order), is_active = 1, is_delete = 0;
SET @pid = (SELECT id FROM products WHERE slug = 'kashmiri-walnut-kernels-akhrot');
INSERT INTO product_variants (product_id, variant_name, weight_value, weight_unit, sku, mrp, selling_price, is_default, is_active, is_delete) VALUES (@pid, '500g', 500, 'g', 'WAL-KSH-500', 899, 899, 1, 1, 0) ON DUPLICATE KEY UPDATE product_id = VALUES(product_id), variant_name = VALUES(variant_name), weight_value = VALUES(weight_value), weight_unit = VALUES(weight_unit), mrp = VALUES(mrp), selling_price = VALUES(selling_price), is_default = VALUES(is_default), is_active = 1, is_delete = 0;
INSERT IGNORE INTO inventory (variant_id, stock_quantity, reserved_quantity) SELECT id, 45, 0 FROM product_variants WHERE sku = 'WAL-KSH-500';
INSERT INTO product_variants (product_id, variant_name, weight_value, weight_unit, sku, mrp, selling_price, is_default, is_active, is_delete) VALUES (@pid, '1kg', 1, 'kg', 'WAL-KSH-1000', 1699, 1699, 0, 1, 0) ON DUPLICATE KEY UPDATE product_id = VALUES(product_id), variant_name = VALUES(variant_name), weight_value = VALUES(weight_value), weight_unit = VALUES(weight_unit), mrp = VALUES(mrp), selling_price = VALUES(selling_price), is_default = VALUES(is_default), is_active = 1, is_delete = 0;
INSERT IGNORE INTO inventory (variant_id, stock_quantity, reserved_quantity) SELECT id, 45, 0 FROM product_variants WHERE sku = 'WAL-KSH-1000';
UPDATE product_variants SET is_active = 0, is_delete = 1, is_default = 0 WHERE product_id = @pid AND is_delete = 0 AND sku NOT IN ('WAL-KSH-500', 'WAL-KSH-1000');
INSERT INTO product_images (product_id, cloudinary_public_id, image_url, alt_text, sort_order, is_primary) SELECT @pid, '', '/images/products/kashmiri-walnut-kernels.webp', 'Light Kashmiri walnut kernels akhrot giri', 0, 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = @pid AND image_url = '/images/products/kashmiri-walnut-kernels.webp' AND is_delete = 0);
UPDATE product_images SET alt_text = 'Light Kashmiri walnut kernels akhrot giri' WHERE product_id = @pid AND image_url = '/images/products/kashmiri-walnut-kernels.webp' AND is_delete = 0;
DELETE FROM product_certifications WHERE product_id = @pid;
INSERT INTO product_certifications (product_id, label, description, sort_order) VALUES (@pid, 'Direct from Kashmir farmers', NULL, 1), (@pid, 'This season\'s fresh crop', NULL, 2), (@pid, 'Free delivery across India', NULL, 3);
DELETE FROM product_health_benefits WHERE product_id = @pid;
DELETE FROM product_info_sections WHERE product_id = @pid;
INSERT INTO product_info_sections (product_id, title, body, items, sort_order) VALUES (@pid, 'Highlights', NULL, '[{\"label\":null,\"text\":\"Sourced directly from Kashmir farmers\"},{\"label\":null,\"text\":\"Light-coloured kernels, mild buttery taste\"},{\"label\":null,\"text\":\"Hand-cracked and hand-sorted\"},{\"label\":null,\"text\":\"No polish, no preservatives\"}]', 1), (@pid, 'How to Use', 'Eat 2-3 kernels as a snack, soak overnight, or add to breakfast, salads, cakes and desserts.', NULL, 2), (@pid, 'Storage', 'Airtight jar. Keep in the fridge after opening - walnuts stay fresh much longer in the cold.', NULL, 3), (@pid, 'FAQs', NULL, '[{\"label\":\"Why are some walnuts bitter?\",\"text\":\"Old or badly stored walnuts turn bitter. Fresh, light kernels taste mild and buttery.\"},{\"label\":\"Light or dark kernels - which is better?\",\"text\":\"Light kernels are fresher and milder. They are the premium grade.\"},{\"label\":\"Where do India\'s walnuts come from?\",\"text\":\"Kashmir produces most of India\'s walnuts.\"}]', 4);

-- Heritage Box (/products/diwali-dry-fruit-gift-box-kashmir)
INSERT INTO products (name, tagline, heading, meta_title, meta_description, slug, short_description, description, brand_name, origin, processing, delivery_min_days, delivery_max_days, is_featured, is_bestseller, sort_order, is_active, is_delete) VALUES ('Heritage Box', 'Four treasures of Kashmir, in one gift they will remember.', 'Heritage Box - Kashmiri Kesar, Wild Honey & Dry Fruit Gift Box', 'Diwali Dry Fruit Gift Box with Kashmiri Kesar | Heritage Box - Suvarna7', 'Premium Diwali gift box with Kashmiri kesar 1g, wild honey, almonds and walnuts in an elegant box. Corporate & bulk gifting available. Free delivery.', 'diwali-dry-fruit-gift-box-kashmir', 'Premium Diwali gift box with Kashmiri kesar 1g, wild honey, almonds and walnuts in an elegant box. Corporate & bulk gifting available. Free delivery.', 'Some gifts are opened and forgotten. Others are remembered. The Heritage Box brings together four treasures of Kashmir: kesar from our own fields in Pampore, dark wild honey from the hills, and fresh almonds and walnuts from the valley\'s orchards. Packed in an elegant keepsake box, it is a gift of heritage and care for the people who matter most.', 'Suvarna7', 'Kashmir', 'Traditional', 3, 5, 1, 0, 8, 1, 0) ON DUPLICATE KEY UPDATE name = VALUES(name), tagline = VALUES(tagline), heading = VALUES(heading), meta_title = VALUES(meta_title), meta_description = VALUES(meta_description), short_description = VALUES(short_description), description = VALUES(description), brand_name = VALUES(brand_name), origin = VALUES(origin), processing = VALUES(processing), delivery_min_days = VALUES(delivery_min_days), delivery_max_days = VALUES(delivery_max_days), is_featured = VALUES(is_featured), is_bestseller = VALUES(is_bestseller), sort_order = VALUES(sort_order), is_active = 1, is_delete = 0;
SET @pid = (SELECT id FROM products WHERE slug = 'diwali-dry-fruit-gift-box-kashmir');
INSERT INTO product_variants (product_id, variant_name, weight_value, weight_unit, sku, mrp, selling_price, is_default, is_active, is_delete) VALUES (@pid, '1 Box', 1, 'kg', 'GFT-HERITAGE', 2049, 2049, 1, 1, 0) ON DUPLICATE KEY UPDATE product_id = VALUES(product_id), variant_name = VALUES(variant_name), weight_value = VALUES(weight_value), weight_unit = VALUES(weight_unit), mrp = VALUES(mrp), selling_price = VALUES(selling_price), is_default = VALUES(is_default), is_active = 1, is_delete = 0;
INSERT IGNORE INTO inventory (variant_id, stock_quantity, reserved_quantity) SELECT id, 45, 0 FROM product_variants WHERE sku = 'GFT-HERITAGE';
UPDATE product_variants SET is_active = 0, is_delete = 1, is_default = 0 WHERE product_id = @pid AND is_delete = 0 AND sku NOT IN ('GFT-HERITAGE');
INSERT INTO product_images (product_id, cloudinary_public_id, image_url, alt_text, sort_order, is_primary) SELECT @pid, '', '/images/hampers/heritage-box.png', 'Heritage Diwali gift box with Kashmiri kesar honey almonds walnuts', 0, 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = @pid AND image_url = '/images/hampers/heritage-box.png' AND is_delete = 0);
UPDATE product_images SET alt_text = 'Heritage Diwali gift box with Kashmiri kesar honey almonds walnuts' WHERE product_id = @pid AND image_url = '/images/hampers/heritage-box.png' AND is_delete = 0;
DELETE FROM product_certifications WHERE product_id = @pid;
INSERT INTO product_certifications (product_id, label, description, sort_order) VALUES (@pid, 'Kesar from our own farm', NULL, 1), (@pid, 'Ready to gift - no wrapping needed', NULL, 2), (@pid, 'Free delivery across India', NULL, 3);
DELETE FROM product_health_benefits WHERE product_id = @pid;
DELETE FROM product_info_sections WHERE product_id = @pid;
INSERT INTO product_info_sections (product_id, title, body, items, sort_order) VALUES (@pid, 'What\'s Inside', NULL, '[{\"label\":null,\"text\":\"Kashmiri Kesar - 1 g\"},{\"label\":null,\"text\":\"Wild Dark Honey - 250 g\"},{\"label\":null,\"text\":\"Kashmiri Almonds - 250 g\"},{\"label\":null,\"text\":\"Kashmiri Walnut Kernels - 250 g\"}]', 1), (@pid, 'Perfect For', 'Perfect for Diwali, weddings, housewarmings, thank-you gifts, and corporate gifts for clients and teams.', NULL, 2), (@pid, 'Bulk Orders', 'Bulk orders from 10 boxes. Free name card. Order on WhatsApp: +91 78893 17203.', NULL, 3), (@pid, 'FAQs', NULL, '[{\"label\":\"Can I order in bulk for my office?\",\"text\":\"Yes. We take orders from 10 boxes, with special corporate prices. WhatsApp us for a quote.\"},{\"label\":\"Can you add our company name card?\",\"text\":\"Yes, a printed name card is free with bulk orders.\"},{\"label\":\"When should I order for Diwali?\",\"text\":\"Order by 1 November for delivery before Diwali.\"}]', 4);

-- Frequently bought together
DELETE FROM product_related WHERE product_id = (SELECT id FROM products WHERE slug = 'kashmiri-kesar-saffron');
INSERT INTO product_related (product_id, related_product_id, sort_order) SELECT owner.id, related.id, 1 FROM products owner JOIN products related ON related.slug = 'gir-cow-bilona-ghee' WHERE owner.slug = 'kashmiri-kesar-saffron';
INSERT INTO product_related (product_id, related_product_id, sort_order) SELECT owner.id, related.id, 2 FROM products owner JOIN products related ON related.slug = 'kashmiri-almonds-badam' WHERE owner.slug = 'kashmiri-kesar-saffron';
DELETE FROM product_related WHERE product_id = (SELECT id FROM products WHERE slug = 'kashmir-acacia-honey');
INSERT INTO product_related (product_id, related_product_id, sort_order) SELECT owner.id, related.id, 1 FROM products owner JOIN products related ON related.slug = 'kashmiri-walnut-kernels-akhrot' WHERE owner.slug = 'kashmir-acacia-honey';
INSERT INTO product_related (product_id, related_product_id, sort_order) SELECT owner.id, related.id, 2 FROM products owner JOIN products related ON related.slug = 'kashmiri-almonds-badam' WHERE owner.slug = 'kashmir-acacia-honey';
DELETE FROM product_related WHERE product_id = (SELECT id FROM products WHERE slug = 'kashmir-wild-forest-honey');
INSERT INTO product_related (product_id, related_product_id, sort_order) SELECT owner.id, related.id, 1 FROM products owner JOIN products related ON related.slug = 'kashmiri-almonds-badam' WHERE owner.slug = 'kashmir-wild-forest-honey';
INSERT INTO product_related (product_id, related_product_id, sort_order) SELECT owner.id, related.id, 2 FROM products owner JOIN products related ON related.slug = 'kashmiri-walnut-kernels-akhrot' WHERE owner.slug = 'kashmir-wild-forest-honey';
DELETE FROM product_related WHERE product_id = (SELECT id FROM products WHERE slug = 'buffalo-bilona-ghee');
INSERT INTO product_related (product_id, related_product_id, sort_order) SELECT owner.id, related.id, 1 FROM products owner JOIN products related ON related.slug = 'kashmiri-kesar-saffron' WHERE owner.slug = 'buffalo-bilona-ghee';
INSERT INTO product_related (product_id, related_product_id, sort_order) SELECT owner.id, related.id, 2 FROM products owner JOIN products related ON related.slug = 'kashmiri-walnut-kernels-akhrot' WHERE owner.slug = 'buffalo-bilona-ghee';
DELETE FROM product_related WHERE product_id = (SELECT id FROM products WHERE slug = 'gir-cow-bilona-ghee');
INSERT INTO product_related (product_id, related_product_id, sort_order) SELECT owner.id, related.id, 1 FROM products owner JOIN products related ON related.slug = 'kashmiri-kesar-saffron' WHERE owner.slug = 'gir-cow-bilona-ghee';
INSERT INTO product_related (product_id, related_product_id, sort_order) SELECT owner.id, related.id, 2 FROM products owner JOIN products related ON related.slug = 'kashmir-wild-forest-honey' WHERE owner.slug = 'gir-cow-bilona-ghee';
DELETE FROM product_related WHERE product_id = (SELECT id FROM products WHERE slug = 'kashmiri-almonds-badam');
INSERT INTO product_related (product_id, related_product_id, sort_order) SELECT owner.id, related.id, 1 FROM products owner JOIN products related ON related.slug = 'kashmiri-walnut-kernels-akhrot' WHERE owner.slug = 'kashmiri-almonds-badam';
INSERT INTO product_related (product_id, related_product_id, sort_order) SELECT owner.id, related.id, 2 FROM products owner JOIN products related ON related.slug = 'kashmiri-kesar-saffron' WHERE owner.slug = 'kashmiri-almonds-badam';
DELETE FROM product_related WHERE product_id = (SELECT id FROM products WHERE slug = 'kashmiri-walnut-kernels-akhrot');
INSERT INTO product_related (product_id, related_product_id, sort_order) SELECT owner.id, related.id, 1 FROM products owner JOIN products related ON related.slug = 'kashmiri-almonds-badam' WHERE owner.slug = 'kashmiri-walnut-kernels-akhrot';
INSERT INTO product_related (product_id, related_product_id, sort_order) SELECT owner.id, related.id, 2 FROM products owner JOIN products related ON related.slug = 'kashmir-wild-forest-honey' WHERE owner.slug = 'kashmiri-walnut-kernels-akhrot';
DELETE FROM product_related WHERE product_id = (SELECT id FROM products WHERE slug = 'diwali-dry-fruit-gift-box-kashmir');
INSERT INTO product_related (product_id, related_product_id, sort_order) SELECT owner.id, related.id, 1 FROM products owner JOIN products related ON related.slug = 'kashmiri-kesar-saffron' WHERE owner.slug = 'diwali-dry-fruit-gift-box-kashmir';
INSERT INTO product_related (product_id, related_product_id, sort_order) SELECT owner.id, related.id, 2 FROM products owner JOIN products related ON related.slug = 'kashmir-wild-forest-honey' WHERE owner.slug = 'diwali-dry-fruit-gift-box-kashmir';

-- Products no longer in the catalogue are hidden, and dropped from hampers and "frequently bought with"
DELETE FROM hamper_products WHERE product_id IN (SELECT id FROM products WHERE is_delete = 0 AND is_active = 1 AND slug NOT IN ('kashmiri-kesar-saffron', 'kashmir-acacia-honey', 'kashmir-wild-forest-honey', 'buffalo-bilona-ghee', 'gir-cow-bilona-ghee', 'kashmiri-almonds-badam', 'kashmiri-walnut-kernels-akhrot', 'diwali-dry-fruit-gift-box-kashmir'));
DELETE FROM product_related WHERE related_product_id IN (SELECT id FROM products WHERE is_delete = 0 AND is_active = 1 AND slug NOT IN ('kashmiri-kesar-saffron', 'kashmir-acacia-honey', 'kashmir-wild-forest-honey', 'buffalo-bilona-ghee', 'gir-cow-bilona-ghee', 'kashmiri-almonds-badam', 'kashmiri-walnut-kernels-akhrot', 'diwali-dry-fruit-gift-box-kashmir'));
UPDATE products SET is_active = 0 WHERE id IN (SELECT id FROM (SELECT id FROM products WHERE is_delete = 0 AND is_active = 1 AND slug NOT IN ('kashmiri-kesar-saffron', 'kashmir-acacia-honey', 'kashmir-wild-forest-honey', 'buffalo-bilona-ghee', 'gir-cow-bilona-ghee', 'kashmiri-almonds-badam', 'kashmiri-walnut-kernels-akhrot', 'diwali-dry-fruit-gift-box-kashmir')) AS retired);

-- Home page hamper tiles
INSERT INTO hampers (name, slug, subtitle, image_url, sort_order) VALUES ('Heritage Box', 'heritage-box', 'Saffron, wild dark honey, almonds & walnuts', '/images/hampers/heritage-box.png', 1) ON DUPLICATE KEY UPDATE name = VALUES(name), subtitle = VALUES(subtitle), image_url = VALUES(image_url), sort_order = VALUES(sort_order), is_active = 1, is_delete = 0;
DELETE FROM hamper_products WHERE hamper_id = (SELECT id FROM hampers WHERE slug = 'heritage-box');
INSERT INTO hamper_products (hamper_id, product_id, sort_order) SELECT h.id, p.id, 1 FROM hampers h JOIN products p ON p.slug = 'kashmiri-kesar-saffron' WHERE h.slug = 'heritage-box';
INSERT INTO hamper_products (hamper_id, product_id, sort_order) SELECT h.id, p.id, 2 FROM hampers h JOIN products p ON p.slug = 'kashmir-wild-forest-honey' WHERE h.slug = 'heritage-box';
INSERT INTO hamper_products (hamper_id, product_id, sort_order) SELECT h.id, p.id, 3 FROM hampers h JOIN products p ON p.slug = 'kashmiri-almonds-badam' WHERE h.slug = 'heritage-box';
INSERT INTO hamper_products (hamper_id, product_id, sort_order) SELECT h.id, p.id, 4 FROM hampers h JOIN products p ON p.slug = 'kashmiri-walnut-kernels-akhrot' WHERE h.slug = 'heritage-box';
UPDATE hampers SET is_active = 0 WHERE is_active = 1 AND is_delete = 0 AND slug NOT IN ('heritage-box');

COMMIT;


-- --------------------------------------------------------------------------------------------
-- 2026-10-26 · Home page "What Our Customers Say": hide the sample testimonials.
-- The section stays and shows "No reviews yet". Hidden (is_delete = 1), not removed.
-- --------------------------------------------------------------------------------------------

UPDATE `testimonials` SET `is_active` = 0, `is_delete` = 1 WHERE `is_delete` = 0;

INSERT IGNORE INTO `schema_migrations` (`filename`) VALUES ('014_hide_sample_testimonials.sql');


-- --------------------------------------------------------------------------------------------
-- 2026-10-27 · Kashmiri Almonds: two new product photos — loose almonds (main), then the
-- Kashmiri Mamra Badam 1kg pack. Needs the site deployed first, so both photos exist.
-- Old photos are hidden (is_delete = 1), not removed. Videos stay.
-- --------------------------------------------------------------------------------------------

UPDATE `product_images` pi
JOIN `products` p ON p.`id` = pi.`product_id`
SET pi.`is_delete` = 1, pi.`is_primary` = 0
WHERE p.`slug` IN ('kashmiri-almonds-badam', 'kashmiri-almonds', 'kashmir-mamra-almonds')
  AND pi.`media_type` = 'image'
  AND pi.`image_url` NOT IN ('/images/products/kashmiri-almonds.webp', '/images/products/kashmiri-mamra-badam-pack.webp');

INSERT INTO `product_images` (`product_id`, `cloudinary_public_id`, `image_url`, `alt_text`, `sort_order`, `is_primary`)
SELECT p.`id`, '', '/images/products/kashmiri-almonds.webp', 'Fresh Kashmiri almonds badam from Kashmir orchards', 0, 1
FROM `products` p
WHERE p.`slug` IN ('kashmiri-almonds-badam', 'kashmiri-almonds', 'kashmir-mamra-almonds')
  AND NOT EXISTS (
    SELECT 1 FROM `product_images` pi
    WHERE pi.`product_id` = p.`id` AND pi.`image_url` = '/images/products/kashmiri-almonds.webp' AND pi.`is_delete` = 0
  );

INSERT INTO `product_images` (`product_id`, `cloudinary_public_id`, `image_url`, `alt_text`, `sort_order`, `is_primary`)
SELECT p.`id`, '', '/images/products/kashmiri-mamra-badam-pack.webp', 'Suvarna7 Kashmiri Mamra Badam 1kg pack', 1, 0
FROM `products` p
WHERE p.`slug` IN ('kashmiri-almonds-badam', 'kashmiri-almonds', 'kashmir-mamra-almonds')
  AND NOT EXISTS (
    SELECT 1 FROM `product_images` pi
    WHERE pi.`product_id` = p.`id` AND pi.`image_url` = '/images/products/kashmiri-mamra-badam-pack.webp' AND pi.`is_delete` = 0
  );

INSERT IGNORE INTO `schema_migrations` (`filename`) VALUES ('015_kashmiri_almonds_photos.sql');


-- --------------------------------------------------------------------------------------------
-- 2026-10-27 · Kashmiri Almonds: the Mamra Badam pack photo goes first (main photo),
-- the loose almonds photo second. Run AFTER the "two new product photos" block above.
-- --------------------------------------------------------------------------------------------

UPDATE `product_images` pi
JOIN `products` p ON p.`id` = pi.`product_id`
SET pi.`is_primary` = IF(pi.`image_url` = '/images/products/kashmiri-mamra-badam-pack.webp', 1, 0),
    pi.`sort_order` = IF(pi.`image_url` = '/images/products/kashmiri-mamra-badam-pack.webp', 0, 1)
WHERE p.`slug` IN ('kashmiri-almonds-badam', 'kashmiri-almonds', 'kashmir-mamra-almonds')
  AND pi.`image_url` IN ('/images/products/kashmiri-mamra-badam-pack.webp', '/images/products/kashmiri-almonds.webp')
  AND pi.`is_delete` = 0;

INSERT IGNORE INTO `schema_migrations` (`filename`) VALUES ('016_kashmiri_almonds_pack_photo_first.sql');


-- --------------------------------------------------------------------------------------------
-- 2026-10-27 · Kashmiri Almonds: square pack photo with space around it, under a new file name
-- (kashmiri-mamra-badam.webp) so the whole pack shows on cards. Needs the site deployed first.
-- Run AFTER the "pack photo goes first" block above.
-- --------------------------------------------------------------------------------------------

UPDATE `product_images` pi
JOIN `products` p ON p.`id` = pi.`product_id`
SET pi.`image_url` = '/images/products/kashmiri-mamra-badam.webp'
WHERE p.`slug` IN ('kashmiri-almonds-badam', 'kashmiri-almonds', 'kashmir-mamra-almonds')
  AND pi.`image_url` = '/images/products/kashmiri-mamra-badam-pack.webp';

UPDATE `product_images` pi
JOIN `products` p ON p.`id` = pi.`product_id`
SET pi.`is_primary` = IF(pi.`image_url` = '/images/products/kashmiri-mamra-badam.webp', 1, 0),
    pi.`sort_order` = IF(pi.`image_url` = '/images/products/kashmiri-mamra-badam.webp', 0, 1)
WHERE p.`slug` IN ('kashmiri-almonds-badam', 'kashmiri-almonds', 'kashmir-mamra-almonds')
  AND pi.`image_url` IN ('/images/products/kashmiri-mamra-badam.webp', '/images/products/kashmiri-almonds.webp')
  AND pi.`is_delete` = 0;

INSERT IGNORE INTO `schema_migrations` (`filename`) VALUES ('017_kashmiri_almonds_square_pack_photo.sql');
