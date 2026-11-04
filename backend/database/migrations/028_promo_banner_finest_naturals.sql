-- Home page promo banner: the "Kashmir's Finest Naturals" poster replaces the old product photo. The poster
-- ships with the frontend (public/images/hero), so deploy before running this on live. Safe to re-run.

UPDATE `home_banners`
SET `image_url` = '/images/hero/kashmirs-finest-naturals.webp',
    `image_alt` = 'Suvarna7, Kashmir''s Finest Naturals: Kashmiri mamra badam, walnut kernels, acacia honey, wild honey, saffron, buffalo ghee and Gir cow ghee'
WHERE `placement` = 'promo' AND `is_delete` = 0;
