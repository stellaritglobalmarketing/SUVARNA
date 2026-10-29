-- Diwali gift hampers (Deepam, Utsav, Heritage): the top banner on every page announces them, and the
-- home page's gift banner button opens the hamper section. The boxes themselves come from the catalogue
-- (`npm run catalog:import`). Safe to re-run.

INSERT INTO `store_settings` (`setting_key`, `setting_value`)
VALUES ('announcement_text', 'FREE Delivery Across India · Diwali Hampers from ₹999 · Order by 1 Nov for Diwali delivery')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

UPDATE `home_banners`
SET `cta_label` = 'Shop Diwali Hampers', `cta_href` = '/#hampers'
WHERE `placement` = 'promo' AND `is_delete` = 0;
