-- Diwali gift boxes get their own photos: one wide photo each, shown whole on the product page, the shop cards
-- and the home page hamper tiles.
-- The Heritage Box's earlier photo (the old box) is hidden (soft-deleted, so it can be restored); videos are left alone.
-- Safe to re-run.

UPDATE `product_images` pi
JOIN `products` p ON p.`id` = pi.`product_id`
SET pi.`is_delete` = 1, pi.`is_primary` = 0
WHERE p.`slug` IN ('deepam-diwali-gift-box', 'utsav-diwali-dry-fruit-hamper', 'heritage-diwali-gift-hamper')
  AND pi.`media_type` = 'image'
  AND pi.`image_url` <> CONCAT('/images/hampers/', p.`slug`, '.webp');

INSERT INTO `product_images` (`product_id`, `cloudinary_public_id`, `image_url`, `alt_text`, `sort_order`, `is_primary`)
SELECT p.`id`, '', CONCAT('/images/hampers/', p.`slug`, '.webp'),
       CASE p.`slug`
         WHEN 'deepam-diwali-gift-box' THEN 'Deepam Diwali gift box with Kashmiri kesar walnuts almonds and honey'
         WHEN 'utsav-diwali-dry-fruit-hamper' THEN 'Utsav Diwali dry fruit hamper with 1g Kashmiri kesar walnuts almonds wild honey'
         ELSE 'Heritage premium Diwali gift hamper with Kashmiri kesar Gir cow ghee honey walnuts almonds'
       END,
       0, 1
FROM `products` p
WHERE p.`slug` IN ('deepam-diwali-gift-box', 'utsav-diwali-dry-fruit-hamper', 'heritage-diwali-gift-hamper')
  AND NOT EXISTS (
    SELECT 1 FROM `product_images` pi
    WHERE pi.`product_id` = p.`id` AND pi.`image_url` = CONCAT('/images/hampers/', p.`slug`, '.webp') AND pi.`is_delete` = 0
  );

UPDATE `hampers`
SET `image_url` = CONCAT('/images/hampers/', `slug`, '.webp')
WHERE `slug` IN ('deepam-diwali-gift-box', 'utsav-diwali-dry-fruit-hamper', 'heritage-diwali-gift-hamper');
