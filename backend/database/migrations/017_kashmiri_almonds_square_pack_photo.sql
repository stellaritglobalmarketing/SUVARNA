-- Kashmiri Almonds: the pack photo moves to /images/products/kashmiri-mamra-badam.webp, a square version with
-- space around the pack so product cards and the gallery show all of it. New file name, so no old cached copy shows.
-- Keeps the pack photo first and the loose almonds photo second.
-- Safe to re-run.

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
