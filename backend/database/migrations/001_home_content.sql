-- Home page content: the fields the storefront design shows on a product card, plus the
-- admin-managed content blocks around it (hero/promo banners, value props & trust points,
-- themed hampers, testimonials, FAQs). Every statement is idempotent (MariaDB's
-- IF NOT EXISTS), so `npm run db:migrate` is safe to re-run.

-- ---- products: storefront display fields ----
-- The JSON columns hold display-only lists that are never filtered or joined on in SQL.
ALTER TABLE `products`
  ADD COLUMN IF NOT EXISTS `tagline` varchar(255) DEFAULT NULL AFTER `short_description`,
  ADD COLUMN IF NOT EXISTS `origin` varchar(64) DEFAULT NULL AFTER `brand_name`,
  ADD COLUMN IF NOT EXISTS `processing` varchar(64) DEFAULT NULL AFTER `origin`,
  ADD COLUMN IF NOT EXISTS `health_benefits` JSON DEFAULT NULL AFTER `processing`,
  ADD COLUMN IF NOT EXISTS `certifications` JSON DEFAULT NULL AFTER `health_benefits`,
  ADD COLUMN IF NOT EXISTS `nutrients` JSON DEFAULT NULL AFTER `certifications`,
  ADD COLUMN IF NOT EXISTS `lipid_breakdown` JSON DEFAULT NULL AFTER `nutrients`,
  ADD COLUMN IF NOT EXISTS `frequently_bought_with` JSON DEFAULT NULL AFTER `lipid_breakdown`,
  ADD COLUMN IF NOT EXISTS `gradient_from` char(7) DEFAULT NULL AFTER `frequently_bought_with`,
  ADD COLUMN IF NOT EXISTS `gradient_to` char(7) DEFAULT NULL AFTER `gradient_from`,
  -- Cached rating aggregate; the reviews feature isn't live yet, so it's seeded/admin-set for now.
  ADD COLUMN IF NOT EXISTS `rating_avg` decimal(2,1) NOT NULL DEFAULT 0.0 AFTER `gradient_to`,
  ADD COLUMN IF NOT EXISTS `rating_count` int(10) unsigned NOT NULL DEFAULT 0 AFTER `rating_avg`,
  ADD COLUMN IF NOT EXISTS `delivery_min_days` tinyint(3) unsigned NOT NULL DEFAULT 2 AFTER `rating_count`,
  ADD COLUMN IF NOT EXISTS `delivery_max_days` tinyint(3) unsigned NOT NULL DEFAULT 5 AFTER `delivery_min_days`,
  ADD COLUMN IF NOT EXISTS `is_bestseller` tinyint(1) NOT NULL DEFAULT 0 AFTER `is_featured`,
  ADD COLUMN IF NOT EXISTS `sort_order` smallint(5) unsigned NOT NULL DEFAULT 0 AFTER `is_bestseller`;

CREATE INDEX IF NOT EXISTS `idx_products_sort` ON `products` (`is_active`, `is_delete`, `sort_order`);

-- ---- hero / promo banners ----
-- `placement` picks the slot: 'hero' (desktop hero) or 'promo' (mobile banner).
CREATE TABLE IF NOT EXISTS `home_banners` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `placement` varchar(32) NOT NULL,
  `eyebrow` varchar(64) DEFAULT NULL,
  `title` varchar(160) NOT NULL,
  `subtitle` varchar(512) DEFAULT NULL,
  `image_url` varchar(512) NOT NULL,
  `image_alt` varchar(160) DEFAULT NULL,
  `cta_label` varchar(64) DEFAULT NULL,
  `cta_href` varchar(255) DEFAULT NULL,
  `secondary_cta_label` varchar(64) DEFAULT NULL,
  `secondary_cta_href` varchar(255) DEFAULT NULL,
  `sort_order` smallint(5) unsigned NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_delete` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_home_banners_placement` (`placement`, `is_active`, `is_delete`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---- icon + text highlight rows ----
-- `placement`: 'hero' (hero value props), 'trust_badge' (mobile strip), 'trust_point' (trust section).
-- `icon` is a frontend icon key (e.g. 'leaf', 'shield-check'), not an image.
CREATE TABLE IF NOT EXISTS `home_highlights` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `placement` varchar(32) NOT NULL,
  `icon` varchar(32) NOT NULL,
  `title` varchar(128) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `sort_order` smallint(5) unsigned NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_delete` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_home_highlights_placement_title` (`placement`, `title`),
  KEY `idx_home_highlights_placement` (`placement`, `is_active`, `is_delete`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---- themed gift hampers ----
CREATE TABLE IF NOT EXISTS `hampers` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL,
  `slug` varchar(160) NOT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `image_url` varchar(512) DEFAULT NULL,
  `sort_order` smallint(5) unsigned NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_delete` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_hampers_slug` (`slug`),
  KEY `idx_hampers_listing` (`is_active`, `is_delete`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products pre-selected when a hamper theme is opened in the builder.
CREATE TABLE IF NOT EXISTS `hamper_products` (
  `hamper_id` smallint(5) unsigned NOT NULL,
  `product_id` int(10) unsigned NOT NULL,
  `sort_order` smallint(5) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`hamper_id`, `product_id`),
  KEY `idx_hamper_products_product` (`product_id`),
  CONSTRAINT `fk_hamper_products_hamper` FOREIGN KEY (`hamper_id`) REFERENCES `hampers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_hamper_products_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---- curated homepage testimonials (not tied to a product, unlike `reviews`) ----
CREATE TABLE IF NOT EXISTS `testimonials` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(64) NOT NULL,
  `location` varchar(128) DEFAULT NULL,
  `rating` tinyint(3) unsigned NOT NULL DEFAULT 5,
  `quote` varchar(1000) NOT NULL,
  `sort_order` smallint(5) unsigned NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_delete` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_testimonials_name` (`customer_name`),
  KEY `idx_testimonials_listing` (`is_active`, `is_delete`, `sort_order`),
  CONSTRAINT `chk_testimonials_rating` CHECK (`rating` between 1 and 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---- FAQs ----
CREATE TABLE IF NOT EXISTS `faqs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `question` varchar(255) NOT NULL,
  `answer` varchar(1000) NOT NULL,
  `sort_order` smallint(5) unsigned NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_delete` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_faqs_question` (`question`),
  KEY `idx_faqs_listing` (`is_active`, `is_delete`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
