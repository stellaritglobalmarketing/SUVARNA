-- User Activity (Admin → User Activity): one row per visit in visitor_sessions (where the visitor came
-- from, their device), and one row per thing they did in visitor_events (opened a product, added to cart,
-- placed an order). Rows older than ACTIVITY_RETENTION_DAYS (default 90) are deleted automatically.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS `visitor_sessions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `session_key` char(36) NOT NULL,
  `visitor_key` char(36) NOT NULL,
  `user_id` int(10) unsigned DEFAULT NULL,
  `source` varchar(32) NOT NULL DEFAULT 'direct',
  `medium` varchar(16) NOT NULL DEFAULT 'direct',
  `campaign` varchar(128) DEFAULT NULL,
  `utm_source` varchar(64) DEFAULT NULL,
  `utm_medium` varchar(64) DEFAULT NULL,
  `utm_content` varchar(128) DEFAULT NULL,
  `utm_term` varchar(128) DEFAULT NULL,
  `referrer` varchar(255) DEFAULT NULL,
  `landing_path` varchar(255) DEFAULT NULL,
  `device_type` varchar(16) DEFAULT NULL,
  `browser` varchar(32) DEFAULT NULL,
  `os` varchar(32) DEFAULT NULL,
  `page_views` int(10) unsigned NOT NULL DEFAULT 0,
  `event_count` int(10) unsigned NOT NULL DEFAULT 0,
  `last_event_type` varchar(32) DEFAULT NULL,
  `last_event_label` varchar(191) DEFAULT NULL,
  `started_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_seen_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_visitor_sessions_key` (`session_key`),
  KEY `idx_visitor_sessions_started` (`started_at`),
  KEY `idx_visitor_sessions_last_seen` (`last_seen_at`),
  KEY `idx_visitor_sessions_source` (`source`,`started_at`),
  KEY `idx_visitor_sessions_visitor` (`visitor_key`),
  KEY `idx_visitor_sessions_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `visitor_events` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `session_id` bigint(20) unsigned NOT NULL,
  `event_type` varchar(32) NOT NULL,
  `path` varchar(255) DEFAULT NULL,
  `label` varchar(191) DEFAULT NULL,
  `product_slug` varchar(191) DEFAULT NULL,
  `variant` varchar(64) DEFAULT NULL,
  `quantity` int(10) unsigned DEFAULT NULL,
  `value` decimal(12,2) DEFAULT NULL,
  `order_number` varchar(32) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_visitor_events_session` (`session_id`,`id`),
  KEY `idx_visitor_events_type` (`event_type`,`created_at`),
  KEY `idx_visitor_events_order` (`order_number`),
  CONSTRAINT `fk_visitor_events_session` FOREIGN KEY (`session_id`) REFERENCES `visitor_sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
