-- Newer MariaDB rejects a CHECK on a column that a cascading foreign key also uses (#1901), so
-- `product_related` can't keep `chk_product_related_self`. The admin API already refuses to relate
-- a product to itself (admin-product-content-controller.js). Safe to re-run.

ALTER TABLE `product_related` DROP CONSTRAINT IF EXISTS `chk_product_related_self`;
