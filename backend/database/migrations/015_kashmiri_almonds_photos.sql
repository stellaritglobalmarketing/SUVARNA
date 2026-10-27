-- Kashmiri Almonds gets two product photos: loose almonds first (/images/products/kashmiri-almonds.webp),
-- then the Kashmiri Mamra Badam pack (/images/products/kashmiri-mamra-badam-pack.webp).
-- Its earlier photos are hidden (soft-deleted, so they can be restored from the table); videos are left alone.
-- Matches the product under any of its slugs (it was renamed).
-- Safe to re-run.

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
