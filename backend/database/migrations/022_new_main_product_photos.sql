-- New main photos: Acacia Honey and Wild Honey jars, Buffalo and Gir Cow Ghee jars, the Walnut Kernels pouch,
-- and the Deepam, Utsav and Heritage gift bags. Each becomes the product's main photo (first in the gallery,
-- on cards and in the home page hampers); the product's earlier photos stay, moved one place back.
-- Safe to re-run: a product that already has its new photo is left alone.

-- kashmir-acacia-honey
SET @pid = (SELECT `id` FROM `products` WHERE `slug` = 'kashmir-acacia-honey');
SET @done = (SELECT COUNT(*) FROM `product_images` WHERE `product_id` = @pid AND `image_url` = '/images/products/kashmir-acacia-honey-jar.webp' AND `is_delete` = 0);
UPDATE `product_images` SET `is_primary` = 0, `sort_order` = `sort_order` + 1
WHERE `product_id` = @pid AND `media_type` = 'image' AND `is_delete` = 0 AND @done = 0;
INSERT INTO `product_images` (`product_id`, `cloudinary_public_id`, `image_url`, `alt_text`, `sort_order`, `is_primary`)
SELECT @pid, '', '/images/products/kashmir-acacia-honey-jar.webp', 'Suvarna7 Kashmiri Acacia Honey jar with a jute-covered lid', 0, 1 FROM DUAL WHERE @pid IS NOT NULL AND @done = 0;

-- kashmir-wild-forest-honey
SET @pid = (SELECT `id` FROM `products` WHERE `slug` = 'kashmir-wild-forest-honey');
SET @done = (SELECT COUNT(*) FROM `product_images` WHERE `product_id` = @pid AND `image_url` = '/images/products/kashmir-wild-honey-jar.webp' AND `is_delete` = 0);
UPDATE `product_images` SET `is_primary` = 0, `sort_order` = `sort_order` + 1
WHERE `product_id` = @pid AND `media_type` = 'image' AND `is_delete` = 0 AND @done = 0;
INSERT INTO `product_images` (`product_id`, `cloudinary_public_id`, `image_url`, `alt_text`, `sort_order`, `is_primary`)
SELECT @pid, '', '/images/products/kashmir-wild-honey-jar.webp', 'Suvarna7 Kashmiri Wild Honey jar with a jute-covered lid', 0, 1 FROM DUAL WHERE @pid IS NOT NULL AND @done = 0;

-- buffalo-bilona-ghee
SET @pid = (SELECT `id` FROM `products` WHERE `slug` = 'buffalo-bilona-ghee');
SET @done = (SELECT COUNT(*) FROM `product_images` WHERE `product_id` = @pid AND `image_url` = '/images/products/buffalo-bilona-ghee-jar.webp' AND `is_delete` = 0);
UPDATE `product_images` SET `is_primary` = 0, `sort_order` = `sort_order` + 1
WHERE `product_id` = @pid AND `media_type` = 'image' AND `is_delete` = 0 AND @done = 0;
INSERT INTO `product_images` (`product_id`, `cloudinary_public_id`, `image_url`, `alt_text`, `sort_order`, `is_primary`)
SELECT @pid, '', '/images/products/buffalo-bilona-ghee-jar.webp', 'Suvarna7 Buffalo Ghee jar, made by the traditional bilona method', 0, 1 FROM DUAL WHERE @pid IS NOT NULL AND @done = 0;

-- gir-cow-bilona-ghee
SET @pid = (SELECT `id` FROM `products` WHERE `slug` = 'gir-cow-bilona-ghee');
SET @done = (SELECT COUNT(*) FROM `product_images` WHERE `product_id` = @pid AND `image_url` = '/images/products/gir-cow-bilona-ghee-jar.webp' AND `is_delete` = 0);
UPDATE `product_images` SET `is_primary` = 0, `sort_order` = `sort_order` + 1
WHERE `product_id` = @pid AND `media_type` = 'image' AND `is_delete` = 0 AND @done = 0;
INSERT INTO `product_images` (`product_id`, `cloudinary_public_id`, `image_url`, `alt_text`, `sort_order`, `is_primary`)
SELECT @pid, '', '/images/products/gir-cow-bilona-ghee-jar.webp', 'Suvarna7 Gir Cow Ghee jar, made by the traditional bilona method', 0, 1 FROM DUAL WHERE @pid IS NOT NULL AND @done = 0;

-- kashmiri-walnut-kernels-akhrot
SET @pid = (SELECT `id` FROM `products` WHERE `slug` = 'kashmiri-walnut-kernels-akhrot');
SET @done = (SELECT COUNT(*) FROM `product_images` WHERE `product_id` = @pid AND `image_url` = '/images/products/kashmiri-walnut-kernels-pouch.webp' AND `is_delete` = 0);
UPDATE `product_images` SET `is_primary` = 0, `sort_order` = `sort_order` + 1
WHERE `product_id` = @pid AND `media_type` = 'image' AND `is_delete` = 0 AND @done = 0;
INSERT INTO `product_images` (`product_id`, `cloudinary_public_id`, `image_url`, `alt_text`, `sort_order`, `is_primary`)
SELECT @pid, '', '/images/products/kashmiri-walnut-kernels-pouch.webp', 'Suvarna7 Premium Kashmiri Walnut Kernels pouch', 0, 1 FROM DUAL WHERE @pid IS NOT NULL AND @done = 0;

-- deepam-diwali-gift-box
SET @pid = (SELECT `id` FROM `products` WHERE `slug` = 'deepam-diwali-gift-box');
SET @done = (SELECT COUNT(*) FROM `product_images` WHERE `product_id` = @pid AND `image_url` = '/images/hampers/deepam-diwali-gift-bag.webp' AND `is_delete` = 0);
UPDATE `product_images` SET `is_primary` = 0, `sort_order` = `sort_order` + 1
WHERE `product_id` = @pid AND `media_type` = 'image' AND `is_delete` = 0 AND @done = 0;
INSERT INTO `product_images` (`product_id`, `cloudinary_public_id`, `image_url`, `alt_text`, `sort_order`, `is_primary`)
SELECT @pid, '', '/images/hampers/deepam-diwali-gift-bag.webp', 'Deepam Diwali gift box with Kashmiri kesar walnuts almonds and honey', 0, 1 FROM DUAL WHERE @pid IS NOT NULL AND @done = 0;
UPDATE `product_images` SET `alt_text` = 'Deepam Diwali gift box opened: Kashmiri kesar, walnut kernels, almonds and acacia honey'
WHERE `product_id` = @pid AND `image_url` = '/images/hampers/deepam-diwali-gift-box.webp' AND `is_delete` = 0;

-- utsav-diwali-dry-fruit-hamper
SET @pid = (SELECT `id` FROM `products` WHERE `slug` = 'utsav-diwali-dry-fruit-hamper');
SET @done = (SELECT COUNT(*) FROM `product_images` WHERE `product_id` = @pid AND `image_url` = '/images/hampers/utsav-diwali-gift-bag.webp' AND `is_delete` = 0);
UPDATE `product_images` SET `is_primary` = 0, `sort_order` = `sort_order` + 1
WHERE `product_id` = @pid AND `media_type` = 'image' AND `is_delete` = 0 AND @done = 0;
INSERT INTO `product_images` (`product_id`, `cloudinary_public_id`, `image_url`, `alt_text`, `sort_order`, `is_primary`)
SELECT @pid, '', '/images/hampers/utsav-diwali-gift-bag.webp', 'Utsav Diwali dry fruit hamper with 1g Kashmiri kesar walnuts almonds wild honey', 0, 1 FROM DUAL WHERE @pid IS NOT NULL AND @done = 0;
UPDATE `product_images` SET `alt_text` = 'Utsav Diwali hamper opened: 1g Kashmiri kesar, walnut kernels, almonds and wild forest honey'
WHERE `product_id` = @pid AND `image_url` = '/images/hampers/utsav-diwali-dry-fruit-hamper.webp' AND `is_delete` = 0;

-- heritage-diwali-gift-hamper
SET @pid = (SELECT `id` FROM `products` WHERE `slug` = 'heritage-diwali-gift-hamper');
SET @done = (SELECT COUNT(*) FROM `product_images` WHERE `product_id` = @pid AND `image_url` = '/images/hampers/heritage-diwali-gift-bag.webp' AND `is_delete` = 0);
UPDATE `product_images` SET `is_primary` = 0, `sort_order` = `sort_order` + 1
WHERE `product_id` = @pid AND `media_type` = 'image' AND `is_delete` = 0 AND @done = 0;
INSERT INTO `product_images` (`product_id`, `cloudinary_public_id`, `image_url`, `alt_text`, `sort_order`, `is_primary`)
SELECT @pid, '', '/images/hampers/heritage-diwali-gift-bag.webp', 'Heritage premium Diwali gift hamper with Kashmiri kesar Gir cow ghee honey walnuts almonds', 0, 1 FROM DUAL WHERE @pid IS NOT NULL AND @done = 0;
UPDATE `product_images` SET `alt_text` = 'Heritage Box opened: Kashmiri kesar, Gir cow ghee, wild forest honey, walnut kernels and almonds'
WHERE `product_id` = @pid AND `image_url` = '/images/hampers/heritage-diwali-gift-hamper.webp' AND `is_delete` = 0;
