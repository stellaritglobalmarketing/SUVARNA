-- Schema cleanup.
--  * Product-page content moves out of JSON columns on `products` into proper child tables,
--    one row per item, so the admin panel can add/edit/remove them individually.
--  * Ratings are no longer cached on products — they're computed from `reviews` by product_id.
--  * Tables, columns and indexes that nothing reads are dropped.
-- Content that lived in the dropped JSON columns is re-created by `npm run seed`.
--
-- MariaDB 10.4 can crash on large combined ALTERs touching foreign keys, and on dropping a
-- table whose foreign keys point at a table altered earlier in the same session. So foreign
-- keys are dropped in their own statements first, and every step is safe to re-run.

-- ============================================================================
-- 1. Product content tables (all cascade-delete with their product)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `product_nutrients` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int(10) unsigned NOT NULL,
  `label` varchar(64) NOT NULL,
  `value_per_100g` varchar(32) NOT NULL,
  `daily_value_percent` smallint(5) unsigned DEFAULT NULL,
  `sort_order` smallint(5) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_product_nutrients_label` (`product_id`, `label`),
  CONSTRAINT `fk_product_nutrients_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fat composition shown as the "Lipid Profile" donut.
CREATE TABLE IF NOT EXISTS `product_lipid_profile` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int(10) unsigned NOT NULL,
  `label` varchar(32) NOT NULL,
  `percent` decimal(5,2) unsigned NOT NULL,
  `color` char(7) NOT NULL,
  `sort_order` smallint(5) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_product_lipid_profile_label` (`product_id`, `label`),
  CONSTRAINT `fk_product_lipid_profile_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_product_lipid_profile_percent` CHECK (`percent` <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_certifications` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int(10) unsigned NOT NULL,
  `label` varchar(64) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `sort_order` smallint(5) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_product_certifications_label` (`product_id`, `label`),
  CONSTRAINT `fk_product_certifications_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tags like "Heart Health"; `benefit` is indexed for filtering products by health goal.
CREATE TABLE IF NOT EXISTS `product_health_benefits` (
  `product_id` int(10) unsigned NOT NULL,
  `benefit` varchar(64) NOT NULL,
  PRIMARY KEY (`product_id`, `benefit`),
  KEY `idx_product_health_benefits_benefit` (`benefit`),
  CONSTRAINT `fk_product_health_benefits_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per product: the three boxes in "Storage & Usage Tips". Missing row = generic copy.
CREATE TABLE IF NOT EXISTS `product_storage_tips` (
  `product_id` int(10) unsigned NOT NULL,
  `shelf_life_tip` varchar(255) DEFAULT NULL,
  `storage_tip` varchar(255) DEFAULT NULL,
  `usage_tip` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`product_id`),
  CONSTRAINT `fk_product_storage_tips_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- "Frequently Bought Together": products shown alongside `product_id`, in `sort_order`.
CREATE TABLE IF NOT EXISTS `product_related` (
  `product_id` int(10) unsigned NOT NULL,
  `related_product_id` int(10) unsigned NOT NULL,
  `sort_order` smallint(5) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`product_id`, `related_product_id`),
  KEY `idx_product_related_related` (`related_product_id`),
  CONSTRAINT `fk_product_related_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_product_related_related` FOREIGN KEY (`related_product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_product_related_self` CHECK (`product_id` <> `related_product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. products / categories: drop the JSON, cached-rating and UI-only columns
-- ============================================================================

ALTER TABLE `products`
  DROP COLUMN IF EXISTS `health_benefits`,
  DROP COLUMN IF EXISTS `certifications`,
  DROP COLUMN IF EXISTS `nutrients`,
  DROP COLUMN IF EXISTS `lipid_breakdown`,
  DROP COLUMN IF EXISTS `frequently_bought_with`,
  DROP COLUMN IF EXISTS `gradient_from`,
  DROP COLUMN IF EXISTS `gradient_to`,
  DROP COLUMN IF EXISTS `rating_avg`,
  DROP COLUMN IF EXISTS `rating_count`,
  DROP COLUMN IF EXISTS `rating_breakdown`;

-- Storage tips are per product now (product_storage_tips).
ALTER TABLE `categories`
  DROP COLUMN IF EXISTS `shelf_life_tip`,
  DROP COLUMN IF EXISTS `storage_tip`,
  DROP COLUMN IF EXISTS `usage_tip`;

-- ============================================================================
-- 3. reviews: written by customers only, one per customer per product
-- ============================================================================

-- Rows without an account were seeded placeholder reviews, not real customer reviews.
DELETE FROM `reviews` WHERE `user_id` IS NULL;

ALTER TABLE `reviews`
  DROP COLUMN IF EXISTS `author_name`,
  DROP COLUMN IF EXISTS `photos`,
  DROP COLUMN IF EXISTS `helpful_count`,
  DROP COLUMN IF EXISTS `is_active`,
  MODIFY COLUMN `user_id` int(10) unsigned NOT NULL,
  DROP INDEX IF EXISTS `idx_reviews_rating`,
  DROP INDEX IF EXISTS `idx_reviews_product`,
  DROP INDEX IF EXISTS `idx_reviews_user`,
  -- Covers the rating aggregate (AVG/COUNT per product over approved, non-deleted reviews).
  ADD KEY `idx_reviews_product` (`product_id`, `is_approved`, `is_delete`, `rating`),
  ADD UNIQUE KEY IF NOT EXISTS `uq_reviews_user_product` (`user_id`, `product_id`);

-- ============================================================================
-- 4. Unused tables and columns
-- ============================================================================

ALTER TABLE `orders`
  DROP FOREIGN KEY IF EXISTS `fk_orders_coupon`,
  DROP INDEX IF EXISTS `fk_orders_coupon`,
  DROP COLUMN IF EXISTS `coupon_id`,
  DROP COLUMN IF EXISTS `coupon_code`,
  -- Nothing searches orders or addresses by pincode.
  DROP INDEX IF EXISTS `idx_orders_pincode`;

ALTER TABLE `addresses` DROP INDEX IF EXISTS `idx_addresses_pincode`;

ALTER TABLE `coupon_usages`
  DROP FOREIGN KEY IF EXISTS `fk_coupon_usages_coupon`,
  DROP FOREIGN KEY IF EXISTS `fk_coupon_usages_order`,
  DROP FOREIGN KEY IF EXISTS `fk_coupon_usages_user`;
DROP TABLE IF EXISTS `coupon_usages`;
DROP TABLE IF EXISTS `coupons`;
DROP TABLE IF EXISTS `settings`;

-- Courier webhooks aren't integrated, so there's no provider event id to de-duplicate on.
ALTER TABLE `shipment_tracking`
  DROP INDEX IF EXISTS `uq_tracking_provider_event`,
  DROP COLUMN IF EXISTS `provider_event_id`;

-- ============================================================================
-- 5. cart: customer carts only (guest carts live in the browser)
-- ============================================================================

DELETE FROM `cart` WHERE `user_id` IS NULL;

ALTER TABLE `cart` DROP FOREIGN KEY IF EXISTS `fk_cart_user`;
ALTER TABLE `cart`
  DROP INDEX IF EXISTS `uq_cart_session_variant`,
  DROP COLUMN IF EXISTS `session_token`;
ALTER TABLE `cart`
  MODIFY COLUMN `user_id` int(10) unsigned NOT NULL,
  ADD UNIQUE KEY IF NOT EXISTS `uq_cart_user_variant` (`user_id`, `product_variant_id`);
ALTER TABLE `cart` DROP INDEX IF EXISTS `idx_cart_user`;
-- Was ON DELETE SET NULL, which a NOT NULL column can't honour.
ALTER TABLE `cart`
  ADD CONSTRAINT `fk_cart_user` FOREIGN KEY IF NOT EXISTS (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- 6. Redundant indexes / consistency
-- ============================================================================

-- uq_wishlist_user_product already starts with user_id.
ALTER TABLE `wishlist` DROP INDEX IF EXISTS `idx_wishlist_user`;

-- Every other table uses utf8mb4_unicode_ci.
ALTER TABLE `user_devices` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
