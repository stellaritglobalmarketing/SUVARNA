-- Product-page SEO from "Product Pages, Stories & SEO": the page's own H1 heading (the product name stays
-- short for cards, cart and invoices), and the Google title and meta description.
-- Also the site-wide top banner text (Admin → Settings; empty hides it). Safe to re-run.

ALTER TABLE `products`
  ADD COLUMN IF NOT EXISTS `heading` varchar(160) DEFAULT NULL COMMENT 'H1 on the product page; falls back to name' AFTER `tagline`,
  ADD COLUMN IF NOT EXISTS `meta_title` varchar(160) DEFAULT NULL COMMENT 'Google result title' AFTER `heading`,
  ADD COLUMN IF NOT EXISTS `meta_description` varchar(320) DEFAULT NULL COMMENT 'Google result description' AFTER `meta_title`;

INSERT IGNORE INTO `store_settings` (`setting_key`, `setting_value`)
VALUES ('announcement_text', 'FREE Delivery Across India · Diwali orders: order by 1 Nov');
