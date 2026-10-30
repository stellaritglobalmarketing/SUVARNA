-- The new jar and pouch photos (migration 022) are swapped for studio versions: the same jar or pouch on a plain
-- warm-beige backdrop with a soft shadow, centred with space around it, like the Kashmiri Mamra Badam pack.
-- Safe to re-run.

UPDATE `product_images` SET `image_url` = '/images/products/kashmir-acacia-honey-studio.webp' WHERE `image_url` = '/images/products/kashmir-acacia-honey-jar.webp';
UPDATE `product_images` SET `image_url` = '/images/products/kashmir-wild-honey-studio.webp' WHERE `image_url` = '/images/products/kashmir-wild-honey-jar.webp';
UPDATE `product_images` SET `image_url` = '/images/products/buffalo-bilona-ghee-studio.webp' WHERE `image_url` = '/images/products/buffalo-bilona-ghee-jar.webp';
UPDATE `product_images` SET `image_url` = '/images/products/gir-cow-bilona-ghee-studio.webp' WHERE `image_url` = '/images/products/gir-cow-bilona-ghee-jar.webp';
UPDATE `product_images` SET `image_url` = '/images/products/kashmiri-walnut-kernels-studio.webp' WHERE `image_url` = '/images/products/kashmiri-walnut-kernels-pouch.webp';
