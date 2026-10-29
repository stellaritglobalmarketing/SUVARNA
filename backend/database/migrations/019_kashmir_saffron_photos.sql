-- Kashmir Saffron gets three product photos, in this order: the jar with its tag (main photo),
-- a close-up of the tag, then the back of the tag (GI No. 635, FSSAI licence).
-- Its earlier photos are hidden (soft-deleted, so they can be restored from the table); videos are left alone.
-- Matches the product under any of its slugs (it was renamed).
-- Safe to re-run.

UPDATE `product_images` pi
JOIN `products` p ON p.`id` = pi.`product_id`
SET pi.`is_delete` = 1, pi.`is_primary` = 0
WHERE p.`slug` IN ('kashmir-saffron', 'kashmiri-mongra-saffron', 'kashmiri-kesar-saffron')
  AND pi.`media_type` = 'image'
  AND pi.`image_url` NOT IN ('/images/products/kashmiri-saffron-jar.webp', '/images/products/kashmiri-saffron-tag.webp', '/images/products/kashmiri-saffron-gi-label.webp');

INSERT INTO `product_images` (`product_id`, `cloudinary_public_id`, `image_url`, `alt_text`, `sort_order`, `is_primary`)
SELECT p.`id`, '', '/images/products/kashmiri-saffron-jar.webp', 'Kashmir Saffron jar of pure Pampore kesar threads, packed by IIKSTC', 0, 1
FROM `products` p
WHERE p.`slug` IN ('kashmir-saffron', 'kashmiri-mongra-saffron', 'kashmiri-kesar-saffron')
  AND NOT EXISTS (
    SELECT 1 FROM `product_images` pi
    WHERE pi.`product_id` = p.`id` AND pi.`image_url` = '/images/products/kashmiri-saffron-jar.webp' AND pi.`is_delete` = 0
  );

INSERT INTO `product_images` (`product_id`, `cloudinary_public_id`, `image_url`, `alt_text`, `sort_order`, `is_primary`)
SELECT p.`id`, '', '/images/products/kashmiri-saffron-tag.webp', 'Kashmir Saffron tag: 100% pure, certified and packed by IIKSTC, Dussu Pampore', 1, 0
FROM `products` p
WHERE p.`slug` IN ('kashmir-saffron', 'kashmiri-mongra-saffron', 'kashmiri-kesar-saffron')
  AND NOT EXISTS (
    SELECT 1 FROM `product_images` pi
    WHERE pi.`product_id` = p.`id` AND pi.`image_url` = '/images/products/kashmiri-saffron-tag.webp' AND pi.`is_delete` = 0
  );

INSERT INTO `product_images` (`product_id`, `cloudinary_public_id`, `image_url`, `alt_text`, `sort_order`, `is_primary`)
SELECT p.`id`, '', '/images/products/kashmiri-saffron-gi-label.webp', 'Kashmir Saffron GI No. 635 tag with FSSAI licence number', 2, 0
FROM `products` p
WHERE p.`slug` IN ('kashmir-saffron', 'kashmiri-mongra-saffron', 'kashmiri-kesar-saffron')
  AND NOT EXISTS (
    SELECT 1 FROM `product_images` pi
    WHERE pi.`product_id` = p.`id` AND pi.`image_url` = '/images/products/kashmiri-saffron-gi-label.webp' AND pi.`is_delete` = 0
  );
