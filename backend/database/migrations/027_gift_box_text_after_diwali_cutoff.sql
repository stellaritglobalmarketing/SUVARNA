-- The "Order by 1 Nov" cut-off has passed: the gift box FAQ and the Deepam Box SEO description no longer mention it,
-- and carry no date, so they won't go out of date again. Text an admin has since changed is left alone. Safe to re-run.

UPDATE `product_info_sections`
SET `items` = REPLACE(
    REPLACE(`items`, 'When should I order for Diwali delivery?', 'How long does delivery take?'),
    'Order by 1 November for delivery before Diwali.',
    'Delivery is free across India. The time depends on your location, so enter your pincode on this page to check delivery to your address.'
)
WHERE `items` LIKE '%Order by 1 November for delivery before Diwali.%';

UPDATE `products`
SET `meta_description` = REPLACE(`meta_description`, ' Order by 1 Nov.', ' Order online from Suvarna7.'),
    `short_description` = REPLACE(`short_description`, ' Order by 1 Nov.', ' Order online from Suvarna7.')
WHERE `slug` = 'deepam-diwali-gift-box';
