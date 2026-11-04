-- The "Order by 1 Nov" Diwali delivery cut-off has passed, so the top banner no longer promises it. Safe to re-run.

INSERT INTO `store_settings` (`setting_key`, `setting_value`)
VALUES ('announcement_text', 'FREE Delivery Across India · Diwali Hampers from ₹999')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);
