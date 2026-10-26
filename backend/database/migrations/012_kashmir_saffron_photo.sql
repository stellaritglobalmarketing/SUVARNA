-- Kashmir Saffron gets one product photo: the jar-and-box packshot at /images/products/kashmir-saffron.webp.
-- Its earlier photos are hidden (soft-deleted, so they can be restored from the table); videos are left alone.
-- Matches the product under any of its slugs (it was renamed twice).
-- Safe to re-run.

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
