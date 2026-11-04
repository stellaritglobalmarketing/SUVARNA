-- Guest checkout: an order can exist without an account until it's paid (user_id stays NULL), and the
-- browser proves it placed the order with a secret token, stored here hashed. guest_login_pending marks an
-- account made from this order whose one-time login hasn't been handed to the buyer yet. Safe to re-run.

ALTER TABLE `orders`
  MODIFY `user_id` int(10) unsigned DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `guest_token_hash` char(64) DEFAULT NULL AFTER `user_id`,
  ADD COLUMN IF NOT EXISTS `guest_login_pending` tinyint(1) NOT NULL DEFAULT 0 AFTER `guest_token_hash`;
