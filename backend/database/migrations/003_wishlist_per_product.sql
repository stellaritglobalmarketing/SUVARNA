-- The storefront's heart icon saves a *product*, not one pack size, so the wishlist moves
-- from product_variant_id to product_id. Existing rows are converted (variant → its
-- product) and collapsed if a user had saved several packs of the same product.

ALTER TABLE `wishlist` ADD COLUMN IF NOT EXISTS `product_id` int(10) unsigned DEFAULT NULL AFTER `user_id`;

UPDATE `wishlist` w
JOIN `product_variants` pv ON pv.id = w.product_variant_id
SET w.product_id = pv.product_id
WHERE w.product_id IS NULL;

DELETE FROM `wishlist` WHERE `product_id` IS NULL;

DELETE w1 FROM `wishlist` w1
JOIN `wishlist` w2 ON w2.user_id = w1.user_id AND w2.product_id = w1.product_id AND w2.id < w1.id;

ALTER TABLE `wishlist`
  DROP FOREIGN KEY IF EXISTS `fk_wishlist_variant`,
  DROP INDEX IF EXISTS `uq_wishlist_user_variant`,
  DROP INDEX IF EXISTS `fk_wishlist_variant`,
  DROP COLUMN IF EXISTS `product_variant_id`,
  MODIFY COLUMN `product_id` int(10) unsigned NOT NULL,
  ADD UNIQUE KEY IF NOT EXISTS `uq_wishlist_user_product` (`user_id`, `product_id`),
  ADD KEY IF NOT EXISTS `idx_wishlist_product` (`product_id`),
  ADD CONSTRAINT `fk_wishlist_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
