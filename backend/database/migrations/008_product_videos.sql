-- Product videos live alongside photos in `product_images`; `media_type` tells them apart.
-- `image_url` holds the video's URL for video rows. Videos never become the primary (card) image.
-- Only adds a column. Safe to re-run.

ALTER TABLE `product_images`
  ADD COLUMN IF NOT EXISTS `media_type` enum('image','video') NOT NULL DEFAULT 'image' AFTER `variant_id`;
