-- Uploaded files are now stored as site-relative paths ("/uploads/…") and the API adds the host on the
-- way out (config/public-url.js). This rewrites URLs saved earlier with a local host, e.g.
-- "http://localhost:5020/uploads/videos/x.mp4" → "/uploads/videos/x.mp4". Safe to re-run.

UPDATE `product_images`
SET `image_url` = SUBSTRING(`image_url`, LOCATE('/uploads/', `image_url`))
WHERE `image_url` REGEXP '^https?://(localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0)(:[0-9]+)?/uploads/';

UPDATE `home_banners`
SET `image_url` = SUBSTRING(`image_url`, LOCATE('/uploads/', `image_url`))
WHERE `image_url` REGEXP '^https?://(localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0)(:[0-9]+)?/uploads/';

UPDATE `hampers`
SET `image_url` = SUBSTRING(`image_url`, LOCATE('/uploads/', `image_url`))
WHERE `image_url` REGEXP '^https?://(localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0)(:[0-9]+)?/uploads/';
