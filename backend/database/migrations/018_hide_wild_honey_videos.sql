-- Kashmir Wild Dark Honey: its product videos are hidden; the product page shows only its photo.
-- Soft-deleted, so they can be restored from the table. Matches the product under any of its slugs.
-- Safe to re-run.

UPDATE `product_images` pi
JOIN `products` p ON p.`id` = pi.`product_id`
SET pi.`is_delete` = 1, pi.`is_primary` = 0
WHERE p.`slug` IN ('kashmir-wild-forest-honey', 'kashmir-wild-dark-honey', 'raw-forest-honey')
  AND pi.`media_type` = 'video'
  AND pi.`is_delete` = 0;
