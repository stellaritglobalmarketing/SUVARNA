-- Product page content from the product catalogue: a one-line tagline under the product name, and
-- free-form information sections ("The Science Within", "How to Use", "Storage", "What's Inside", …).
-- Only adds a column and a table. Every step is safe to re-run.

ALTER TABLE `products`
  ADD COLUMN IF NOT EXISTS `tagline` varchar(160) DEFAULT NULL COMMENT 'Line under the product name, e.g. "The Crimson Gold of Kashmir"' AFTER `name`;

-- One row per section, in display order. A section has a paragraph (`body`), a list (`items`), or both.
-- `items` is a JSON array of { "label": string|null, "text": string }.
CREATE TABLE IF NOT EXISTS `product_info_sections` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int(10) unsigned NOT NULL,
  `title` varchar(64) NOT NULL,
  `body` text DEFAULT NULL,
  `items` text DEFAULT NULL,
  `sort_order` smallint(5) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_product_info_sections_product` (`product_id`, `sort_order`),
  CONSTRAINT `fk_product_info_sections_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
