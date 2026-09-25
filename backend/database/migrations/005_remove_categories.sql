-- The store doesn't use categories: products are listed, searched and related to each other
-- without them. Drop the category tables and the product → sub-category link.
--
-- As in 004, foreign keys are dropped in their own statements before the tables/columns they
-- touch (MariaDB 10.4 can crash otherwise), and every step is safe to re-run.

ALTER TABLE `products` DROP FOREIGN KEY IF EXISTS `fk_products_sub_category`;
ALTER TABLE `products` DROP INDEX IF EXISTS `idx_products_category`;
ALTER TABLE `products` DROP COLUMN IF EXISTS `sub_category_id`;

ALTER TABLE `sub_categories` DROP FOREIGN KEY IF EXISTS `fk_sub_categories_category`;
DROP TABLE IF EXISTS `sub_categories`;
DROP TABLE IF EXISTS `categories`;
