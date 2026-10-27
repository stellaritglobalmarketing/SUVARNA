-- Kashmiri Almonds: the Kashmiri Mamra Badam pack photo becomes the main photo, the loose almonds photo comes second.
-- Matches the product under any of its slugs (it was renamed).
-- Safe to re-run.

UPDATE `product_images` pi
JOIN `products` p ON p.`id` = pi.`product_id`
SET pi.`is_primary` = IF(pi.`image_url` = '/images/products/kashmiri-mamra-badam-pack.webp', 1, 0),
    pi.`sort_order` = IF(pi.`image_url` = '/images/products/kashmiri-mamra-badam-pack.webp', 0, 1)
WHERE p.`slug` IN ('kashmiri-almonds-badam', 'kashmiri-almonds', 'kashmir-mamra-almonds')
  AND pi.`image_url` IN ('/images/products/kashmiri-mamra-badam-pack.webp', '/images/products/kashmiri-almonds.webp')
  AND pi.`is_delete` = 0;
