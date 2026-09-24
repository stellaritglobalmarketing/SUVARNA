-- Product detail page: rating breakdown, per-category storage tips, and the review fields
-- the review list design shows. Idempotent like 001.

-- `tagline` (added in 001) duplicated the existing `short_description`, which the admin API
-- and product search already use — drop it and use `short_description` everywhere.
ALTER TABLE `products`
  DROP COLUMN IF EXISTS `tagline`,
  -- Cached with rating_avg / rating_count: [{ "stars": 5, "percent": 68 }, ...] — recomputed
  -- from `reviews` once the reviews feature goes live.
  ADD COLUMN IF NOT EXISTS `rating_breakdown` JSON DEFAULT NULL AFTER `rating_count`;

-- Shown in the product page's "Storage & Usage Tips" box; NULL falls back to generic copy.
ALTER TABLE `categories`
  ADD COLUMN IF NOT EXISTS `shelf_life_tip` varchar(255) DEFAULT NULL AFTER `image_url`,
  ADD COLUMN IF NOT EXISTS `storage_tip` varchar(255) DEFAULT NULL AFTER `shelf_life_tip`,
  ADD COLUMN IF NOT EXISTS `usage_tip` varchar(255) DEFAULT NULL AFTER `storage_tip`;

-- Reviews imported from before the store existed (or left by guests) have no account, so
-- user_id becomes optional and the display name is stored on the review itself.
ALTER TABLE `reviews`
  MODIFY COLUMN `user_id` int(10) unsigned DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `author_name` varchar(64) DEFAULT NULL AFTER `user_id`,
  ADD COLUMN IF NOT EXISTS `photos` JSON DEFAULT NULL AFTER `review_text`,
  ADD COLUMN IF NOT EXISTS `helpful_count` int(10) unsigned NOT NULL DEFAULT 0 AFTER `photos`;
